import * as vg from '@uwdata/vgplot';
import { makeClient } from "@uwdata/mosaic-core";
import { Query, count, sum } from "@uwdata/mosaic-sql";


export const fetchColumnCounts = async (coordinator: any, column: string) => {
  const result = await coordinator.query(
    Query.from('cells')
      .select({ count: count() })
      .groupby(column)
  );
  return result.numRows;
};

export const fetchColumnValues = async (coordinator: any, column: string) => {
  const result = await coordinator.query(
    Query.from('cells')
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

export const fetchGeneCols = async (coordinator: any) => {
  const result = await coordinator.query(
    Query.from('information_schema.columns')
      .select('column_name')
      .where(`table_name = 'cells' AND column_name LIKE 'gene_%'`)
      .orderby('column_name')
  );
  const columns = [];
  for (let i = 0; i < (result as any).numRows; i++) {
    columns.push((result as any).getChild('column_name').get(i));
  }
  return columns;
};

export const fetchExpressionRates = (
  coordinator: any, 
  selection: any,
  geneOptions: {value: string, label: string}[], 
  setGeneExpressionRates: (geneExpressionRates: any) => void
) => makeClient({
  coordinator: coordinator,
  selection: selection,
  query: (predicate) => {
    // Build the SELECT clause with count of non-zero expression for each gene column
    const countSelects: Record<string, any> = {};
    geneOptions.forEach(option => {
      const geneCol = option.value; // This is the full gene_XXX column name
      countSelects[`count_${geneCol}`] = sum(vg.sql`CASE WHEN ${geneCol} > 0 THEN 1 ELSE 0 END`);
    });
    // Also get total count for calculating expression rate
    countSelects['total_count'] = count();

    // Create the query
    let query = Query.from('cells').select(countSelects);
    if (predicate) {
      query = query.where(predicate);
    }
    return query;
  },
  queryResult: async (data: any) => {
    // Convert results to array of objects
    const geneExpressionRates: {gene: string, expressionRate: number}[] = [];
    
    try {
      const totalCells = data.getChild('total_count').get(0);
      
      geneOptions.forEach(option => {
        const geneCol = option.value;
        const countColumnName = `count_${geneCol}`;
        try {
          const nonZeroCount = data.getChild(countColumnName).get(0);
          const expressionRate = totalCells > 0 ? (nonZeroCount / totalCells) * 100 : 0;
          geneExpressionRates.push({
            gene: option.label, // This is the cleaned name without gene_ prefix
            expressionRate: expressionRate
          });
        } catch (error) {
          console.warn(`Could not get expression rate for ${geneCol}:`, error);
        }
      });

      setGeneExpressionRates(geneExpressionRates.sort((a, b) => b.expressionRate - a.expressionRate).slice(0, 25));
    } catch (error) {
      console.error('Error processing expression rates:', error);
    }
  },
  queryError: (error) => {
    console.error('Gene expression rates query error:', error);
  },
});


export const fetchColumnCountsFilter = (
  coordinator: any, 
  selection: any, 
  column: string,
  setSelectionSummary: (prev: any) => void
) => makeClient({
  coordinator: coordinator,
  selection: selection,
  prepare: async () => {
    const result = await coordinator.query(
      Query.from('cells').select({ count: count() })
    );
    setSelectionSummary((prev: any) => ({
      ...prev,
      totalCells: (result as any).get(0).count
    }));
  },
  query: (predicate) => {
    return Query.from('cells')
      .select(column, {count: count()})
      .where(predicate)
      .groupby(column);
  },
  queryResult: async (data: any) => {
    // Get all clusters first (unfiltered)
    const allClusters = await fetchColumnValues(coordinator, column);
    
    // Process filtered cluster data from main query
    const clusterCounts: Record<string, number> = {};
    let totalCount = 0;
    
    // Start with all clusters at 0
    allClusters.forEach(cluster => {
      clusterCounts[cluster] = 0;
    });
    
    // Update with actual data from filtered results
    for (let i = 0; i < data.numRows; i++) {
      const cluster = data.getChild(column).get(i);
      const count = data.getChild('count').get(i);
      
      clusterCounts[cluster] = count;
      totalCount += count;
    }
    
    setSelectionSummary((prev: any) => ({
      ...prev,
      filteredCells: totalCount,
      clusterCounts
    }));
  },
  queryError: (error) => {
    console.error('Selection query error:', error);
  },
});
