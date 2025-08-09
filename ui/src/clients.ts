import * as vg from '@uwdata/vgplot';
import { makeClient } from "@uwdata/mosaic-core";
import { Query, count, sum } from "@uwdata/mosaic-sql";

import { createTableQuery } from './utils';


export const fetchColumnCounts = async (coordinator: any, table: string, column: string) => {
  const result = await coordinator.query(
    Query.from(table)
      .select({ count: count() })
      .groupby(column)
  );
  return result.numRows;
};

export const fetchColumnValues = async (coordinator: any, table: string, column: string) => {
  const result = await coordinator.query(
    Query.from(table)
      .select(column)
      .groupby(column)
      .orderby(column)
  )
  const columns = [];
  for (let i = 0; i < (result as any).numRows; i++) {
    columns.push((result as any).getChild(column).get(i));
  }
  return columns;
};

export const fetchGeneCols = async (coordinator: any, table: string) => {
  const result = await coordinator.query(
    Query.from(table + '_expr')
      .select('gene_name')
      .distinct()
      .orderby('gene_name')
  );
  const genes = [];
  for (let i = 0; i < result.numRows; i++) {
    genes.push('gene_' + result.getChild('gene_name').get(i));
  }
  return genes;
};

export const fetchExpressionRates = (
  coordinator: any,
  table: string,
  selection: any,
  setGeneExpressionRates: (geneExpressionRates: any) => void
) => makeClient({
  coordinator: coordinator,
  selection: selection,
  query: (predicate) => {
    let query = Query
      .from({
        expr: table + '_expr',
        tbl: table
      })
      .select({
        gene_name: 'expr.gene_name',
        expr_cells: count(),
        total_cells: vg.sql`COUNT(DISTINCT tbl.cell_id)`
      })
      .where(vg.sql`expr.cell_id = tbl.cell_id`)
      .groupby('expr.gene_name');

    if (predicate) {
      query = query.where(predicate);
    }

    return query
      .orderby(vg.sql`expr_cells DESC`)
      .limit(25);
  },
  queryResult: async (data: any) => {
    const results = [];
    for (let i = 0; i < data.numRows; i++) {
      const exprCells = data.getChild('expr_cells').get(i);
      const totalCells = data.getChild('total_cells').get(i);
      
      results.push({
        gene: data.getChild('gene_name').get(i),
        exprRate: exprCells
      });
    }
    setGeneExpressionRates(results);
  },
  queryError: (error) => {
    console.error('Long format query error:', error);
  },
});

export const fetchColumnCountsFilter = (
  coordinator: any, 
  table: string,
  selection: any, 
  column: string,
  columnValues: string[],
  gene: string, 
  gene2: string,
  setSelectionCounts: (prev: any) => void
) => makeClient({
  coordinator: coordinator,
  selection: selection,
  query: (predicate) => {
    const tableQuery = createTableQuery(table, gene, gene2)

    return tableQuery
      .select(column, {count: count()})
      .where(predicate)
      .groupby(column);
  },
  queryResult: async (data: any) => {
    const cellCounts: Record<string, number> = {};
    let totalCount = 0;
    
    columnValues.forEach(cluster => {
      cellCounts[cluster] = 0;
    });

    for (let i = 0; i < data.numRows; i++) {
      const cluster = data.getChild(column).get(i);
      const count = data.getChild('count').get(i);
      
      cellCounts[cluster] = count;
      totalCount += count;
    }
    
    setSelectionCounts((prev: any) => ({
      ...prev,
      filteredCells: totalCount,
      cellCounts
    }));
  },
  queryError: (error) => {
    console.error('Selection query error:', error);
  },
});
