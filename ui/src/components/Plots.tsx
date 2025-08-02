import { useState, useEffect, useRef } from 'react';

import * as vg from '@uwdata/vgplot';
// import * as sql from '@uwdata/mosaic-sql';
import { makeClient } from "@uwdata/mosaic-core";
import { Query, count, avg } from "@uwdata/mosaic-sql";

const Plots = () => {
  const legendLabels = {
    'cluster': 'Cluster',
    'nFeature_RNA': 'nFeature',
    'nCount_RNA': 'nUMI', 
    'percent_mt': 'Percent MT',
  };

  const geneLabels = {
    'SCGB1A1': 'SCGB1A1 (Secretoglobin)',
    'IGLC1': 'IGLC1 (Immunoglobulin)',
    'IGHG1': 'IGHG1 (Immunoglobulin)',
    'IGHD': 'IGHD (Immunoglobulin)',
    'SCGB3A2': 'SCGB3A2 (Secretoglobin)',
    'SCGB3A1': 'SCGB3A1 (Secretoglobin)',
    'IGHG3': 'IGHG3 (Immunoglobulin)',
    'IGHA1': 'IGHA1 (Immunoglobulin)',
    'BPIFB1': 'BPIFB1 (Antimicrobial)',
    'C9orf24': 'C9orf24',
    'IGKC': 'IGKC (Immunoglobulin)',
    'CXCL8': 'CXCL8 (IL-8)',
    'TPPP3': 'TPPP3 (Tubulin)',
    'COL3A1': 'COL3A1 (Collagen)',
    'RSPH1': 'RSPH1 (Radial Spoke)',
    'COL1A1': 'COL1A1 (Collagen)',
    'IL6': 'IL6 (Interleukin-6)',
    'MSMB': 'MSMB (Microseminoprotein)',
    'JCHAIN': 'JCHAIN (J Chain)',
    'TSPAN1': 'TSPAN1 (Tetraspanin)'
  }

  const umapLegendRef = useRef<HTMLDivElement>(null);
  const umapRef = useRef<HTMLDivElement>(null);
  const featureCurveRef = useRef<HTMLDivElement>(null);
  const featureUMICurveRef = useRef<HTMLDivElement>(null);
  const nFeatureRef = useRef<HTMLDivElement>(null);
  const nCountRef = useRef<HTMLDivElement>(null);
  const percentMTRef = useRef<HTMLDivElement>(null);

  const [resetToggle, setResetToggle] = useState(false);
  const [umapFill, setUmapFill] = useState('cluster');
  const [containerWidth, setContainerWidth] = useState(800);
  const [legendPosition, setLegendPosition] = useState('topright');
  const [geneComparisonMode, setGeneComparisonMode] = useState('categorical');

  const [gene, setGene] = useState(Object.keys(geneLabels)[0]);
  const [gene2, setGene2] = useState(Object.keys(geneLabels)[1]);

  const [selectionSummary, setSelectionSummary] = useState({
    totalCells: 0,
    filteredCells: 0,
    avgFeatureRNA: 0,
    avgCountRNA: 0,
    avgPercentMT: 0,
    clusterCounts: {}
  });

  useEffect(() => {
    // Observe the card-body or col-9 instead of the umapRef
    const cardBody = umapRef.current?.parentElement;
    if (!cardBody) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      const width = entries[0].contentRect.width;
      console.log('Observed width:', width);
      setContainerWidth(width || 800);
    });
    
    resizeObserver.observe(cardBody);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const client = makeClient({
      coordinator: vg.coordinator(),
      selection: $allFilter,
      prepare: async () => {
        const result = await vg.coordinator().query(
          Query.from('cells').select({ count: count() })
        );
        setSelectionSummary(prev => ({
          ...prev,
          totalCells: (result as any).get(0).count
        }));
      },
      query: (predicate) => {
        // Return a query that gets both stats and cluster counts
        if (predicate) {
          return Query.from('cells')
            .select('cluster', {
              count: count(),
              avgFeatures: avg('nFeature_RNA'),
              avgCount: avg('nCount_RNA'),
              avgMT: avg('percent_mt')
            })
            .where(predicate)
            .groupby('cluster');
        } else {
          return Query.from('cells')
            .select('cluster', {
              count: count(),
              avgFeatures: avg('nFeature_RNA'),
              avgCount: avg('nCount_RNA'),
              avgMT: avg('percent_mt')
            })
            .groupby('cluster');
        }
      },
      queryResult: async (data: any) => {
        // Get all clusters first (unfiltered)
        const allClustersResult = await vg.coordinator().query(
          Query.from('cells')
            .select('cluster')
            .groupby('cluster')
            .orderby('cluster')
        ) as any;
        
        const allClusters = [];
        try {
          for (let i = 0; i < allClustersResult.numRows; i++) {
            allClusters.push(allClustersResult.getChild('cluster').get(i));
          }
        } catch (error) {
          for (let i = 0; i < allClustersResult.numRows; i++) {
            allClusters.push(allClustersResult.getChild(0).get(i));
          }
        }
        
        // Process filtered cluster data from main query
        const clusterCounts: Record<string | number, number> = {};
        let totalCount = 0;
        let totalFeatures = 0;
        let totalCount_RNA = 0;
        let totalMT = 0;
        
        // Start with all clusters at 0
        allClusters.forEach(cluster => {
          clusterCounts[cluster] = 0;
        });
        
        // Update with actual data from filtered results
        try {
          for (let i = 0; i < data.numRows; i++) {
            const cluster = data.getChild('cluster').get(i);
            const count = data.getChild('count').get(i);
            const avgFeatures = data.getChild('avgFeatures').get(i);
            const avgCount = data.getChild('avgCount').get(i);
            const avgMT = data.getChild('avgMT').get(i);
            
            clusterCounts[cluster] = count;
            totalCount += count;
            totalFeatures += avgFeatures * count;
            totalCount_RNA += avgCount * count;
            totalMT += avgMT * count;
          }
        } catch (error) {
          for (let i = 0; i < data.numRows; i++) {
            const cluster = data.getChild(0).get(i);
            const count = data.getChild(1).get(i);
            const avgFeatures = data.getChild(2).get(i);
            const avgCount = data.getChild(3).get(i);
            const avgMT = data.getChild(4).get(i);
            
            clusterCounts[cluster] = count;
            totalCount += count;
            totalFeatures += avgFeatures * count;
            totalCount_RNA += avgCount * count;
            totalMT += avgMT * count;
          }
        }
        
        setSelectionSummary(prev => ({
          ...prev,
          filteredCells: totalCount,
          avgFeatureRNA: totalCount > 0 ? totalFeatures / totalCount : 0,
          avgCountRNA: totalCount > 0 ? totalCount_RNA / totalCount : 0,
          avgPercentMT: totalCount > 0 ? totalMT / totalCount : 0,
          clusterCounts
        }));
      },
      queryError: (error) => {
        console.error('Selection query error:', error);
      },
    });

    return () => {
      client.destroy();
    };
  }, [resetToggle, umapFill, gene, gene2, containerWidth, geneComparisonMode]);

    // const $xs = vg.Selection.intersect();
  // const $ys = vg.Selection.intersect();
  const $legendBrush = vg.Selection.intersect({ cross: true }); // Legend selection (categorical)
  const $spatialBrush = vg.Selection.intersect(); // Spatial brush (positional) 
  const $saturationBrush = vg.Selection.crossfilter(); // QC brush for saturation plots
  const $featureOrderBrush = vg.Selection.intersect(); // QC brush for saturation plots
  const $featureUMIBrush = vg.Selection.intersect(); // QC brush for saturation plots
  const $qcBrush = vg.Selection.crossfilter(); // QC brush for density plots

  const $saturationFilter = vg.Selection.intersect({ include: [$legendBrush, $spatialBrush, $qcBrush] }); // Combined selection for filtering legend, spatial, and qc density
  // const $featureOrderFilter = vg.Selection.intersect({ include: [$legendBrush, $spatialBrush, $qcBrush, $featureUMIBrush] }); // Combined selection for filtering legend, spatial, and qc density
  // const $featureUMIFilter = vg.Selection.intersect({ include: [$legendBrush, $spatialBrush, $qcBrush, $featureOrderBrush] }); // Combined selection for filtering legend, spatial, and qc density
  const $densityFilter = vg.Selection.intersect({ include: [$legendBrush, $spatialBrush, $saturationBrush, $featureOrderBrush, $featureUMIBrush] }); // Combined selection for filtering legend, spatial, and qc density
  const $allFilter = vg.Selection.intersect({ include: [$legendBrush, $spatialBrush, $qcBrush, $saturationBrush, $featureOrderBrush, $featureUMIBrush] }); // Combined selection for filtering all

  // const handleSoftReset = () => {
  //   $legendBrush.reset();
  //   $spatialBrush.reset();
  //   $qcBrush.reset();
  // };

  const handleHardReset = () => {
    setResetToggle(!resetToggle)
  };

  useEffect(() => { // draws vgplots
    const createChart = async () => {
      // vg.coordinator().databaseConnector(vg.socketConnector());

      const umapWidth = containerWidth;
      const umapHeight = umapWidth * 9/13;
      const fillValue = umapFill === 'genes' 
        ? (() => {
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
          })() // () IS REQUIRED
        : umapFill === 'gene' 
        ? gene
        : umapFill;
      const colorScale = (umapFill === 'cluster') || (umapFill === 'genes' && geneComparisonMode === 'categorical') ? 'ordinal' : 'linear';
      const colorRange = umapFill === 'cluster' 
        ? ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', 
          '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5', 
          '#8c564b', '#c49c94', '#e377c2', '#f7b6d3', '#7f7f7f', 
          '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5']
        : umapFill === 'genes' && geneComparisonMode === 'categorical'
        ? gene === gene2 
          ? ['#1f77b4', '#cccccc20'] 
          : ['#333333', '#1f77b4', '#ff7f0e', '#cccccc20']
        : umapFill === 'genes' && geneComparisonMode === 'logfold' 
        ? ['#313695', '#abd9e9', '#cccccc20', '#fee08b', '#d73027']
        : ['#f0f0f0', '#deebf7', '#9ecae1', '#3182bd', '#08519c'];

      const umapArgs = [
        vg.dot(vg.from('cells', {}), {
          x: 'UMAP_1',
          y: 'UMAP_2',
          fill: fillValue,
          r: 1.5,
          opacity: 0.5,
          tip: { format: { x: false, y: false, fill: false } },
          title: 'cluster'
        }),
        vg.name('umap'),
        vg.intervalXY({ as: $spatialBrush, brush: { fill: 'none', stroke: '#888' } }),
        vg.highlight({ by: $allFilter, fill: '#ccc', fillOpacity: 0.2 }),
        vg.xLabel('UMAP Dimension 1'),
        vg.yLabel('UMAP Dimension 2'),
        vg.width(umapWidth),
        vg.height(umapHeight),
      ];

      if (umapFill === 'cluster' || umapFill === 'gene' || umapFill === 'genes') {
        umapArgs.push(vg.colorScale(colorScale), vg.colorRange(colorRange));
      }
      if (umapFill === 'genes' && geneComparisonMode === 'categorical') {
        if (gene === gene2) {
          umapArgs.push(vg.colorDomain([`${gene} Expressed`, 'Not Expressed']))
        } else {
          umapArgs.push(vg.colorDomain(['Both Expressed', `${gene} Expressed`, `${gene2} Expressed`, 'Neither Expressed']))
        }
      }

      const umap = vg.plot(...umapArgs);
      if (umapRef.current) {
        umapRef.current.replaceChildren(umap);
      }

      const umapLegend = vg.colorLegend({ 
        for: 'umap',
        as: $legendBrush, 
        columns: 1, 
        label: umapFill === 'genes' 
          ? geneComparisonMode === 'addition' 
            ? `${gene} or ${gene2}`
            : geneComparisonMode === 'geometric' 
            ? `${gene} and ${gene2}`
            : `${gene} vs. ${gene2}`
          : umapFill === 'gene' 
          ? geneLabels[gene as keyof typeof geneLabels]
          : legendLabels[umapFill as keyof typeof legendLabels]
      });
      if (umapLegendRef.current) {
        umapLegendRef.current.replaceChildren(umapLegend);
      }

      const featureCurve = vg.plot(
        vg.dot(vg.from('cells', { filterBy: $saturationFilter }), {
          x: vg.sql`ROW_NUMBER() OVER (ORDER BY nFeature_RNA)`,
          y: 'nFeature_RNA',
          fill: 'gray',
          opacity: 0.3,
          tip: false,
        }),
        // vg.panZoom({x: $xs, y: $ys}),
        vg.intervalY({ as: $saturationBrush }),
        vg.xLabel('Cell'),
        vg.yLabel(legendLabels['nFeature_RNA']),
        vg.width(umapWidth),
        vg.height(umapHeight * 2/5),
      );
      if (featureCurveRef.current) {
        featureCurveRef.current.replaceChildren(featureCurve);
      }

      const featureUMICurve = vg.plot(
        vg.dot(vg.from('cells', { filterBy: $saturationFilter }), {
          x: 'nCount_RNA',
          y: 'nFeature_RNA',
          fill: 'gray',
          opacity: 0.3,
          tip: false,
        }),
        // vg.panZoom({x: $xs, y: $ys}),
        vg.intervalXY({ as: $saturationBrush }),
        vg.xLabel(legendLabels['nCount_RNA']),
        vg.yLabel(legendLabels['nFeature_RNA']),
        vg.width(umapWidth),
        vg.height(umapHeight * 2/5),
      );
      if (featureUMICurveRef.current) {
        featureUMICurveRef.current.replaceChildren(featureUMICurve);
      }

      const nFeature = vg.plot(
        vg.densityX(vg.from('cells', { filterBy: $densityFilter }), {
          y: 'nFeature_RNA',
          opacity: 0.5,
          tip: false,
        }),
        // vg.panZoom({x: $xs, y: $ys}),
        vg.intervalY({ as: $qcBrush }),
        vg.yLabel(legendLabels['nFeature_RNA']),
        vg.xAxis(null),
        vg.width(80),
        vg.height(400),
      );
      if (nFeatureRef.current) {
        nFeatureRef.current.replaceChildren(nFeature);
      }

      const nCount = vg.plot(
        vg.densityX(vg.from('cells', { filterBy: $densityFilter }), {
          y: 'nCount_RNA',
          opacity: 0.5,
          tip: false,
        }),
        // vg.panZoom({x: $xs, y: $ys}),
        vg.intervalY({ as: $qcBrush }),
        vg.yLabel(legendLabels['nCount_RNA']),
        vg.xAxis(null),
        vg.width(80),
        vg.height(400),
      );
      if (nCountRef.current) {
        nCountRef.current.replaceChildren(nCount);
      }

      const percentMT = vg.plot(
        vg.densityX(vg.from('cells', { filterBy: $densityFilter }), {
          y: 'percent_mt',
          opacity: 0.5,
          tip: false,
        }),
        // vg.panZoom({x: $xs, y: $ys}),
        vg.intervalY({ as: $qcBrush }),
        vg.yLabel(legendLabels['percent_mt']),
        vg.xAxis(null),
        vg.width(80),
        vg.height(400),
      );
      if (percentMTRef.current) {
        percentMTRef.current.replaceChildren(percentMT);
      }
    };

    createChart();
  }, [resetToggle, umapFill, gene, gene2, containerWidth, geneComparisonMode]);

  return (
    <div className='row'>

      <div className='col-9 ps-0 pe-3'>

        <div className='card mb-3 shadow-sm'>
          <div className='card-header text-ss d-flex justify-content-between align-items-end'>
            <span className='fw-bold'>UMAP</span>
            <button 
              className='btn btn-danger btn-xs shadow-sm ms-auto cursor-pointer'
              onClick={handleHardReset}
            >
              Reset
            </button>
          </div>
          <div className='card-body'>
            <div className='' ref={umapRef}></div>
            <div 
              className={`border px-2 rounded shadow-sm bg-white ${((umapFill === 'cluster') || (umapFill === 'genes' && geneComparisonMode === 'categorical')) && 'pt-1'} ${legendPosition === 'off' ? 'd-none' : 'd-inline-block'}`}
              ref={umapLegendRef}
              style={{
                position: 'absolute',
                right: 10,
                ...(legendPosition === 'topright' && { top: 45 }),
                ...(legendPosition === 'bottomright' && { bottom: 62 })
              }}
            ></div>
            
          </div>
        </div>

        <div className='card mb-3 shadow-sm'>
          <div className='card-header text-ss d-flex justify-content-between align-items-end'>
            <span className='fw-bold'>Saturation Curves</span>
          </div>
          <div className='card-body'>
            <div className='' ref={featureCurveRef}></div>
            <div className='' ref={featureUMICurveRef}></div>
          </div>
        </div>
      
      </div>
      
      <div className='col-3 px-0'>

        <div className='card mt-0 mb-3 shadow-sm'>
          <div className='card-header text-ss d-flex justify-content-between align-items-end'>
            <span className='fw-bold'>Settings</span>
          </div>
          <div className='card-body'>
            <p className='text-ss mb-0 fw-bold'>Fill</p>
            <select 
              className='form-select form-select-sm'
              aria-label='umapFill'
              value={umapFill}
              onChange={(e) => setUmapFill(e.target.value)}
            >
              {Object.keys(legendLabels).map((key) => (
                <option key={key} value={key}>{legendLabels[key as keyof typeof legendLabels]}</option>
              ))}
              <option value='gene'>Gene Expression</option>
              <option value='genes'>Gene Coexpression</option>
            </select>
            
            {(umapFill === 'gene' || umapFill === 'genes') && (
              <>
                <p className='text-ss mt-3 mb-0 fw-bold'>Gene</p>
                <select 
                  className='form-select form-select-sm'
                  aria-label='geneFill'
                  value={gene}
                  onChange={(e) => setGene(e.target.value)}
                >
                  {Object.keys(geneLabels).map((key) => (
                      <option key={key} value={key}>{geneLabels[key as keyof typeof geneLabels]}</option>
                    ))
                  }
                </select>
              </>
            )}

            {umapFill === 'genes' && (
              <>
                <p className='text-ss mt-3 mb-0 fw-bold'>Gene 2</p>
                <select 
                  className='form-select form-select-sm'
                  aria-label='geneFill'
                  value={gene2}
                  onChange={(e) => setGene2(e.target.value)}
                >
                  {Object.keys(geneLabels).map((key) => (
                    <option key={key} value={key}>{geneLabels[key as keyof typeof geneLabels]}</option>
                  ))}
                </select>

                <p className='text-ss mt-3 mb-0 fw-bold'>Gene Comparison</p>
                <select 
                  className='form-select form-select-sm'
                  value={geneComparisonMode}
                  onChange={(e) => setGeneComparisonMode(e.target.value)}
                >
                  <option value='categorical'>Categorical</option>
                  <option value='addition'>Simple Addition</option>
                  <option value='geometric'>Geometric Mean</option>
                  <option value='logfold'>Log Fold Change</option>
                </select>
              </>
            )}

            <p className='text-ss mt-3 mb-0 fw-bold'>Legend Position</p>
            <select 
              className='form-select form-select-sm'
              aria-label='legendPosition'
              value={legendPosition}
              onChange={(e) => setLegendPosition(e.target.value)}
            >
              <option value='topright'>Top Right</option>
              <option value='bottomright'>Bottom Right</option>
              <option value='off'>Hidden</option>
            </select>

          </div>
        </div>

        <div className='card mb-3 shadow-sm'>
          <div className='card-header text-ss d-flex justify-content-between align-items-end'>
            <span className='fw-bold'>Selection Metrics</span>
          </div>
          <div className='card-body p-0'>
            <table className='table table-striped table-hover table-rounded text-xs'>
              <thead>
                <tr>
                  <th>Cluster</th>
                  <th>Selected Count</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className='fst-italic fw-medium'>Total</td>
                  <td className='fst-italic fw-medium'>{selectionSummary.filteredCells}</td>
                </tr>
                {Object.keys(selectionSummary.clusterCounts).map((cluster: string, index: number) => (
                  <tr key={index}>
                    <td>{cluster}</td>
                    <td>{String(Object.values(selectionSummary.clusterCounts)[index])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className='card mb-3 shadow-sm'>
          <div className='card-header text-ss d-flex justify-content-between align-items-end'>
            <span className='fw-bold'>QC Distribution</span>
          </div>
          <div className='card-body pb-0'>
            <div className='row'>
              <div className='col-4'>
                <div className='' ref={nFeatureRef}></div>
              </div>
              <div className='col-4'>
                <div className='' ref={nCountRef}></div>
              </div>
              <div className='col-4'>
                <div className='' ref={percentMTRef}></div>
              </div>
            </div>
          </div>
        </div>

      </div>    

    </div>
  );
};

export default Plots;
