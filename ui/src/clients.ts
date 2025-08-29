import { makeClient } from '@uwdata/mosaic-core';
import { Query, sql, count, avg } from '@uwdata/mosaic-sql';

export const fetchGeneCols = async (coordinator: any, table: string) => {
  const result = await coordinator.query(
    Query.from(table + '_expr')
      .select('gene_name')
      .distinct()
      .orderby('gene_name'),
  );
  const genes = [];
  for (let i = 0; i < result.numRows; i++) {
    genes.push(result.getChild('gene_name').get(i));
  }
  return genes;
};

export const fetchColumnValues = async (
  coordinator: any,
  table: string,
  column: string,
) => {
  const result = await coordinator.query(
    Query.from(table).select(column).groupby(column).orderby(column),
  );
  const columns = [];
  for (let i = 0; i < (result as any).numRows; i++) {
    columns.push((result as any).getChild(column).get(i));
  }
  return columns;
};

export const fetchColumnCounts = async (
  coordinator: any,
  table: string,
  column: string,
) => {
  const result = await coordinator.query(
    Query.from(table).select({ count: count() }).groupby(column),
  );
  return result.numRows;
};

export const fetchColumnCountsFilter = (
  coordinator: any,
  table: string,
  selection: any,
  column: string,
  columnValues: string[],
  setSelectionCounts: (prev: any) => void,
) =>
  makeClient({
    coordinator: coordinator,
    selection: selection,
    query: (predicate) => {
      return Query.from(table)
        .select(column, { count: count() })
        .where(predicate)
        .groupby(column);
    },
    queryResult: async (data: any) => {
      const cellCounts: Record<string, number> = {};
      let totalCount = 0;

      columnValues.forEach((cluster) => {
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
        cellCounts,
      }));
    },
    queryError: (error) => {
      console.error('Selection query error:', error);
    },
  });

export const fetchExpressionRates = (
  coordinator: any,
  table: string,
  selection: any,
  setGeneExpressionRates: (geneExpressionRates: any) => void,
) =>
  makeClient({
    coordinator: coordinator,
    selection: selection,
    filterStable: false,
    query: (predicate) => {
      // First get the filtered cell IDs as a simple list
      let cellQuery = Query.from(table).select('cell_id');
      if (predicate) cellQuery = cellQuery.where(predicate);

      // Cast cell_id to match the data types (assuming expr table has VARCHAR cell_id)
      return Query.from(table + '_expr')
        .select({
          gene_name: 'gene_name',
          expr_cells: sql`COUNT(CASE WHEN expr > 0 THEN 1 END)`,
          total_cells: count(),
        })
        .where(
          sql`CAST(cell_id AS VARCHAR) IN (SELECT CAST(cell_id AS VARCHAR) FROM (${cellQuery}))`,
        )
        .groupby('gene_name')
        .orderby(sql`expr_cells DESC`)
        .limit(10);
    },
    queryResult: async (data: any) => {
      const results = [];
      for (let i = 0; i < data.numRows; i++) {
        const exprCells = data.getChild('expr_cells').get(i);
        const totalCells = data.getChild('total_cells').get(i);

        if (!!exprCells && !!totalCells) {
          results.push({
            gene: data.getChild('gene_name').get(i),
            exprRate: (exprCells / totalCells) * 100,
          });
        }
      }
      setGeneExpressionRates(results);
    },
    queryError: (error) => {
      console.error('Long format query error:', error);
    },
  });

export const fetchExpressionMeans = (
  coordinator: any,
  table: string,
  selection: any,
  setGeneExpressionRates: (geneExpressionRates: any) => void,
) =>
  makeClient({
    coordinator: coordinator,
    selection: selection,
    filterStable: false,
    query: (predicate) => {
      // First get the filtered cell IDs as a simple list
      let cellQuery = Query.from(table).select('cell_id');
      if (predicate) cellQuery = cellQuery.where(predicate);

      // Cast cell_id to match the data types (assuming expr table has VARCHAR cell_id)
      return Query.from(table + '_expr')
        .select({
          gene_name: 'gene_name',
          expr_mean: avg('expr'),
        })
        .where(
          sql`CAST(cell_id AS VARCHAR) IN (SELECT CAST(cell_id AS VARCHAR) FROM (${cellQuery}))`,
        )
        .groupby('gene_name')
        .orderby(sql`expr_mean DESC`)
        .limit(10);
    },
    queryResult: async (data: any) => {
      const results = [];
      for (let i = 0; i < data.numRows; i++) {
        const exprMean = data.getChild('expr_mean').get(i);

        if (!!exprMean) {
          results.push({
            gene: data.getChild('gene_name').get(i),
            exprMean: exprMean,
          });
        }
      }
      setGeneExpressionRates(results);
    },
    queryError: (error) => {
      console.error('Long format query error:', error);
    },
  });

export const fetchExpressionCVs = (
  coordinator: any,
  table: string,
  selection: any,
  setGeneExpressionCVs: (geneExpressionCVs: any) => void,
) =>
  makeClient({
    coordinator: coordinator,
    selection: selection,
    filterStable: false,
    query: (predicate) => {
      // First get the filtered cell IDs as a simple list
      let cellQuery = Query.from(table).select('cell_id');
      if (predicate) cellQuery = cellQuery.where(predicate);

      // Cast cell_id to match the data types (assuming expr table has VARCHAR cell_id)
      return Query.from(table + '_expr')
        .select({
          gene_name: 'gene_name',
          cv: sql`STDDEV(expr) / NULLIF(AVG(expr), 0)`,
        })
        .where(
          sql`CAST(cell_id AS VARCHAR) IN (SELECT CAST(cell_id AS VARCHAR) FROM (${cellQuery}))`,
        )
        .groupby('gene_name')
        .having(sql`AVG(expr) > 1`) // only meaningful for genes expressed at some level
        .orderby(sql`cv DESC`)
        .limit(10);
    },
    queryResult: async (data: any) => {
      const results = [];
      for (let i = 0; i < data.numRows; i++) {
        const cv = data.getChild('cv').get(i);

        if (!!cv) {
          results.push({
            gene: data.getChild('gene_name').get(i),
            cv: cv,
          });
        }
      }
      setGeneExpressionCVs(results);
    },
    queryError: (error) => {
      console.error('Long format query error:', error);
    },
  });

export const fetchExpressionFolds = (
  coordinator: any,
  table: string,
  selection: any,
  setGeneExpressionFolds: (geneExpressionFolds: any) => void,
) =>
  makeClient({
    coordinator: coordinator,
    selection: selection,
    filterStable: false,
    query: (predicate) => {
      // First get the filtered cell IDs as a simple list
      let cellQuery = Query.from(table).select('cell_id');
      if (predicate) {
        cellQuery = cellQuery.where(predicate);
      }

      // Cast cell_id to match the data types (assuming expr table has VARCHAR cell_id)
      return Query.from(table + '_expr')
        .select({
          gene_name: 'gene_name',
          fold_enrichment: sql`
          AVG(CASE WHEN CAST(cell_id AS VARCHAR) IN (SELECT CAST(cell_id AS VARCHAR) FROM (${cellQuery})) THEN expr ELSE NULL END) /
          NULLIF(AVG(CASE WHEN CAST(cell_id AS VARCHAR) NOT IN (SELECT CAST(cell_id AS VARCHAR) FROM (${cellQuery})) THEN expr ELSE NULL END), 0)`,
        })
        .groupby('gene_name')
        .having(sql`AVG(expr) > 1`)
        .orderby(sql`fold_enrichment DESC`)
        .limit(10);
    },
    queryResult: async (data: any) => {
      const results = [];
      for (let i = 0; i < data.numRows; i++) {
        const fold_enrichment = data.getChild('fold_enrichment').get(i);

        if (!!fold_enrichment) {
          results.push({
            gene: data.getChild('gene_name').get(i),
            foldEnrichment: fold_enrichment,
          });
        }
      }
      setGeneExpressionFolds(results);
    },
    queryError: (error) => {
      console.error('Long format query error:', error);
    },
  });
