import * as vg from '@uwdata/vgplot';


const tableau20 = [
  '#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', 
  '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5', 
  '#8c564b', '#c49c94', '#e377c2', '#f7b6d3', '#7f7f7f', 
  '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5'
]
const transparentGray = 'rgba(204, 204, 204, 0.2)'
const transparentRed = 'rgba(255, 0, 0, 0.3)'
const grayBlue = ['#f0f0f0', '#deebf7', '#9ecae1', '#3182bd', '#08519c']

export const createUmapCategories = (gene: string, gene2: string, geneComparisonMode: string, clusterCount: number) => {
  const umapCategories = {
    'cluster': {
      title: 'Cell Type', 
      legendTitle: null, 
      fillValue: 'cluster', 
      colorScale: 'ordinal', 
      colorRange: tableau20,
      colorDomain: null,
      colorScheme: null,
      colorReverse: null
    },
    'pca_cluster': {
      title: 'PCA Cluster', 
      legendTitle: null, 
      fillValue: 'pca_cluster', 
      colorScale: 'ordinal', 
      colorRange: tableau20,
      colorDomain: Array.from({length: clusterCount}, (_, i) => i.toString()),
      colorScheme: null,
      colorReverse: null
    },
    'sample': {
      title: 'Sample', 
      legendTitle: null, 
      fillValue: 'sample', 
      colorScale: 'ordinal', 
      colorRange: tableau20,
      colorDomain: null,
      colorScheme: null,
      colorReverse: null
    },
    'orig_ident': {
      title: 'Source', 
      legendTitle: null, 
      fillValue: 'orig_ident', 
      colorScale: 'ordinal', 
      colorRange: tableau20,
      colorDomain: null,
      colorScheme: null,
      colorReverse: null
    },
    'nFeature_RNA': {
      title: 'nFeature', 
      legendTitle: null, 
      fillValue: 'nFeature_RNA', 
      colorScale: 'linear', 
      colorRange: null,
      colorDomain: null,
      colorScheme: 'spectral',
      colorReverse: true
    },
    'nCount_RNA': {
      title: 'nUMI',
      legendTitle: null, 
      fillValue: 'nCount_RNA', 
      colorScale: 'linear', 
      colorRange: null,
      colorDomain: null,
      colorScheme: 'spectral',
      colorReverse: true
    }, 
    'percent_mt': {
      title: 'Percent MT', 
      legendTitle: null, 
      fillValue: 'percent_mt', 
      colorScale: 'linear', 
      colorRange: null,
      colorDomain: null,
      colorScheme: 'spectral',
      colorReverse: true
    },
    'gene': {
      title: 'Gene Expression', 
      legendTitle: `${gene.replace('gene_', '')} Expression`, 
      fillValue: gene, 
      colorScale: 'linear', 
      colorRange: grayBlue,
      colorDomain: null,
      colorScheme: null,
      colorReverse: null
    },
    'genes': {
      title: 'Gene Coexpression', 
      legendTitle: geneComparisonMode === 'addition' 
        ? `${gene.replace('gene_', '')} or ${gene2.replace('gene_', '')}`
        : geneComparisonMode === 'geometric' 
          ? `${gene.replace('gene_', '')} and ${gene2.replace('gene_', '')}`
          : `${gene.replace('gene_', '')} vs. ${gene2.replace('gene_', '')}`, 
      fillValue: (() => {
        switch(geneComparisonMode) {
          case 'addition':
            return vg.sql`${gene} + ${gene2}`;
          case 'geometric':
            return vg.sql`SQRT(${gene} * ${gene2})`;
          case 'logfold':
            return vg.sql`LOG(${gene2} + 1) - LOG(${gene} + 1)`;
          case 'categorical':
            return gene === gene2
              ? vg.sql`CASE WHEN ${gene} > 1 THEN '${gene} Expressed' ELSE 'Not Expressed' END`
              : vg.sql`CASE WHEN ${gene} > 1 AND ${gene2} > 1 THEN 'Both Expressed' WHEN ${gene} > 0 THEN '${gene} Expressed' WHEN ${gene2} > 0 THEN '${gene2} Expressed' ELSE 'Neither Expressed' END`;
          default:
            return gene;
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
          ? [`${gene.replace('gene_', '')} Expressed`, 'Not Expressed']
          : ['Both Expressed', `${gene.replace('gene_', '')} Expressed`, `${gene2.replace('gene_', '')} Expressed`, 'Neither Expressed']
        : null,
      colorScheme: null,
      colorReverse: null
    }, 
    'excluded': {
      title: 'Filter Exclusion', 
      legendTitle: null, 
      fillValue: transparentGray, 
      colorScale: 'ordinal', 
      colorRange: [transparentGray, transparentRed],
      colorDomain: ['Included in Filters', 'Excluded by Filters'],
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
  }),
  option: (provided: any) => ({
    ...provided,
    fontSize: '0.875rem',
    padding: '0.25rem 0.5rem'
  })
};
