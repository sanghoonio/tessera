import * as vg from '@uwdata/vgplot';


export const tableau20 = [
  '#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', 
  '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5', 
  '#8c564b', '#c49c94', '#e377c2', '#f7b6d3', '#7f7f7f', 
  '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5'
]
const transparentGray = 'rgba(204, 204, 204, 0.2)'
const transparentRed = 'rgba(255, 0, 0, 0.3)'
const grayBlue = ['#f0f0f0', '#deebf7', '#9ecae1', '#3182bd', '#08519c']

export const createUmapCategories = (
  gene: string, 
  gene2: string, 
  geneComparisonMode: string, 
  cellTypes: string[], 
  samples: string[],
  clusterCount: number
) => {
  const geneCol = 'gene_' + gene;
  const gene2Col = 'gene_' + gene2;
  const umapCategories = {
    'cluster': {
      title: 'Cell Type', 
      legendTitle: 'Cell Type', 
      fillValue: 'cluster', 
      colorScale: 'ordinal', 
      colorRange: tableau20,
      colorDomain: cellTypes,
      colorScheme: null,
      colorReverse: null
    },
    'cluster_silhouette': {
      title: 'Cell Type Silhouette', 
      legendTitle: 'Cell Type Silhouette', 
      fillValue: 'cluster_silhouette', 
      colorScale: 'linear', 
      colorRange: null,
      colorDomain: null,
      colorScheme: 'spectral',
      colorReverse: true
    },
    'pca_cluster': {
      title: 'Seurat Cluster', 
      legendTitle: 'Seurat Cluster', 
      fillValue: 'pca_cluster', 
      colorScale: 'ordinal', 
      colorRange: tableau20,
      colorDomain: Array.from({length: clusterCount}, (_, i) => i.toString()),
      // colorDomain: null,
      colorScheme: null,
      colorReverse: null
    },
    'pca_silhouette': {
      title: 'Seurat Cluster Silhouette', 
      legendTitle: 'Seurat Cluster Silhouette', 
      fillValue: 'pca_silhouette', 
      colorScale: 'linear', 
      colorRange: null,
      colorDomain: null,
      colorScheme: 'spectral',
      colorReverse: true
    },
    'sample': {
      title: 'Sample', 
      legendTitle: 'Sample', 
      fillValue: 'sample', 
      colorScale: 'ordinal', 
      colorRange: tableau20,
      colorDomain: samples,
      colorScheme: null,
      colorReverse: null
    },
    'orig_ident': {
      title: 'Source', 
      legendTitle: 'Source', 
      fillValue: 'orig_ident', 
      colorScale: 'ordinal', 
      colorRange: tableau20,
      colorDomain: null,
      colorScheme: null,
      colorReverse: null
    },
    'nFeature_RNA': {
      title: 'nFeature', 
      legendTitle: 'nFeature', 
      fillValue: 'nFeature_RNA', 
      colorScale: 'linear', 
      colorRange: null,
      colorDomain: null,
      colorScheme: 'spectral',
      colorReverse: true
    },
    'nCount_RNA': {
      title: 'nUMI',
      legendTitle: 'nUMI', 
      fillValue: 'nCount_RNA', 
      colorScale: 'linear', 
      colorRange: null,
      colorDomain: null,
      colorScheme: 'spectral',
      colorReverse: true
    }, 
    'nFeature_nCount_RNA': {
      title: 'nFeature / nUMI',
      legendTitle: 'nFeature / nUMI', 
      fillValue: 'nFeature_nCount_RNA', 
      colorScale: 'linear', 
      colorRange: null,
      colorDomain: null,
      colorScheme: 'spectral',
      colorReverse: true
    }, 
    'percent_mt': {
      title: 'Percent MT', 
      legendTitle: 'Percent MT', 
      fillValue: 'percent_mt', 
      colorScale: 'linear', 
      colorRange: null,
      colorDomain: null,
      colorScheme: 'spectral',
      colorReverse: true
    },
    'phase': {
      title: 'Cell Cycle Phase', 
      legendTitle: 'Cell Cycle Phase', 
      fillValue: 'phase', 
      colorScale: 'ordinal', 
      colorRange: tableau20,
      colorDomain: null,
      colorScheme: null,
      colorReverse: null
    },
    'gene': {
      title: 'Gene Expression', 
      legendTitle: `${gene} Expression`, 
      fillValue: geneCol, 
      colorScale: 'linear', 
      colorRange: grayBlue,
      colorDomain: null,
      colorScheme: null,
      colorReverse: null
    },
    'genes': {
      title: 'Gene Coexpression', 
      legendTitle: geneComparisonMode === 'addition' 
        ? `${gene} or ${gene2}`
        : geneComparisonMode === 'geometric' 
          ? `${gene} and ${gene2}`
          : `${gene} vs. ${gene2}`, 
      fillValue: (() => {
        switch(geneComparisonMode) {
          case 'addition':
            return vg.sql`${geneCol} + ${gene2Col}`;
          case 'geometric':
            return vg.sql`SQRT(${geneCol} * ${gene2Col})`;
          case 'logfold':
            return vg.sql`LOG(${gene2Col} + 1) - LOG(${geneCol} + 1)`;
          case 'categorical':
            return gene === gene2
              ? vg.sql`CASE WHEN ${geneCol} > 0 THEN '${geneCol} Expressed' ELSE 'Not Expressed' END`
              : vg.sql`CASE 
                  WHEN ${geneCol} > 0 AND ${gene2Col} > 0 THEN 'Both Expressed'
                  WHEN ${geneCol} > 0 AND ${gene2Col} = 0 THEN '${gene} Expressed' 
                  WHEN ${geneCol} = 0 AND ${gene2Col} > 0 THEN '${gene2} Expressed'
                  ELSE 'Neither Expressed' END`
          default:
            return geneCol;
        }
      })(), 
      colorScale: geneComparisonMode === 'categorical' ? 'ordinal' : 'linear', 
      colorRange: geneComparisonMode === 'categorical' 
        ? gene === gene2 
          ? ['#1f77b4', transparentGray] 
          : ['#333333', '#1f77b4', '#ff7f0e', transparentGray] 
        : geneComparisonMode === 'logfold'
          ? ['#313695', '#abd9e9', transparentGray, '#fee08b', '#d73027']
          : grayBlue,
      colorDomain: geneComparisonMode === 'categorical' 
        ? gene === gene2 
          ? [`${gene} Expressed`, 'Not Expressed']
          : ['Both Expressed', `${gene} Expressed`, `${gene2} Expressed`, 'Neither Expressed']
        : null,
      colorScheme: null,
      colorReverse: null
    }, 
    'excluded': {
      title: 'Filter Exclusion', 
      legendTitle: 'Filter Exclusion', 
      fillValue: vg.sql`'Included in Selection'`, 
      colorScale: 'ordinal', 
      colorRange: [transparentGray, transparentRed],
      colorDomain: ['Included in Selection', 'Excluded by Selection'],
      colorScheme: null,
      colorReverse: null
    },
  };

  return(umapCategories);
}

export const bootstrapSelectStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    minHeight: '31px',
    height: '31px',
    fontFamily: 'Nunito',
    fontWeight: 400 ,
    fontStyle: 'normal',
    fontSize: '0.875rem',
    borderColor: state.isFocused ? '#86b7fe' : '#dee2e6',
    borderRadius: '0.25rem',
    boxShadow: state.isFocused ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#86b7fe' : '#dee2e6'
    }
  }),
  valueContainer: (provided: any) => ({
    ...provided,
    height: '31px',
    padding: '0 6px'
  }),
  input: (provided: any) => ({
    ...provided,
    margin: '0px',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  indicatorsContainer: (provided: any) => ({
    ...provided,
    height: '31px',
  }),
  clearIndicator: (provided: any) => ({
    ...provided,
    padding: '4px'
  }),
  dropdownIndicator: (provided: any) => ({
    ...provided,
    padding: '0.375rem 2.25rem 0.375rem 0.75rem',
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e")`, // Bootstrap select arrow
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.75rem center',
    backgroundSize: '16px 12px',
    width: '16px',
    height: '16px',
    '& svg': {
      display: 'none' // Hide react-select's default arrow
    }
  }),
  menu: (provided: any) => ({
    ...provided,
    fontSize: '0.875rem',
    fontFamily: 'Nunito',
    fontWeight: 400 ,
    fontStyle: 'normal',
    zIndex: 999
  }),
  option: (provided: any) => ({
    ...provided,
    fontSize: '0.875rem',
    padding: '0.25rem 0.5rem'
  })
};
