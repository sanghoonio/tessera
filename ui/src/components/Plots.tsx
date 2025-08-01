import { useState, useEffect, useRef } from 'react';
import * as vg from '@uwdata/vgplot';

const Plots = () => {
  const legendLabels = {
    'cluster': 'Cluster',
    'nFeature_RNA': 'Feature Count',
    'nCount_RNA': 'UMI Count', 
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

  const umapRef = useRef<HTMLDivElement>(null);
  const nFeatureRef = useRef<HTMLDivElement>(null);
  const nCountRef = useRef<HTMLDivElement>(null);
  const percentMTRef = useRef<HTMLDivElement>(null);

  const [umapFill, setUmapFill] = useState('cluster');
  const [gene, setGene] = useState(Object.keys(geneLabels)[0]);

  // const $xs = vg.Selection.intersect();
  // const $ys = vg.Selection.intersect();
  const $legendBrush = vg.Selection.intersect({ cross: true }); // Legend selection (categorical)
  const $spatialBrush = vg.Selection.intersect(); // Spatial brush (positional) 
  const $qcBrush = vg.Selection.crossfilter(); // QC brush (for density plots)
  const $umapFilter = vg.Selection.intersect({ include: [$legendBrush, $spatialBrush] }); // Combined selection for filtering legend and spatial
  const $allFilter = vg.Selection.intersect({ include: [$legendBrush, $spatialBrush, $qcBrush] }); // Combined selection for filtering all

  const handleResetAll = () => {
    $legendBrush.reset();
    $spatialBrush.reset();
    $qcBrush.reset();
  };

  const handleResetQC = () => {
    $legendBrush.reset();
    $spatialBrush.reset();
    $qcBrush.reset();
  };

  useEffect(() => {
    const createChart = async () => {
      // vg.coordinator().databaseConnector(vg.socketConnector());

      const containerWidth = umapRef.current?.clientWidth || 800;
      const umapWidth = containerWidth - 16*4;
      const umapHeight = window.innerHeight - 16*1 - 44

      const umap = umapFill === 'cluster' ? 
      vg.plot(
        vg.dot(vg.from('cells', {}), {
          x: 'UMAP_1',
          y: 'UMAP_2',
          fill: umapFill,
          r: 1.5,
          opacity: 0.5,
          tip: {
            format: {
              x: false,
              y: false,
              fill: false
            }
          },
          title: 'cluster'
        }),
        // vg.panZoom({x: $xs, y: $ys}),
        vg.intervalXY({ as: $spatialBrush, brush: { fill: 'none', stroke: '#888' } }),
        vg.highlight({ by: $allFilter, fill: '#ccc', fillOpacity: 0.2 }),
        vg.colorLegend({ 
          as: $legendBrush, 
          columns: 1, 
          label: legendLabels[umapFill as keyof typeof legendLabels]
        }),
        vg.colorScale('ordinal'),
        vg.colorRange([
          '#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', 
          '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5', 
          '#8c564b', '#c49c94', '#e377c2', '#f7b6d3', '#7f7f7f', 
          '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5'
        ]),
        vg.xLabel('UMAP Dimension 1'),
        vg.yLabel('UMAP Dimension 2'),
        vg.width(umapWidth),
        vg.height(umapHeight),
      ) 
      : umapFill === 'gene' ?
      vg.plot(
        vg.dot(vg.from('cells', {}), {
          x: 'UMAP_1',
          y: 'UMAP_2',
          fill: gene,
          r: 1.5,
          opacity: 0.5,
          tip: {
            format: {
              x: false,
              y: false,
              fill: false
            }
          },
          title: 'cluster'
        }),
        // vg.panZoom({x: $xs, y: $ys}),
        vg.intervalXY({ as: $spatialBrush, brush: { fill: 'none', stroke: '#888' } }),
        vg.highlight({ by: $allFilter, fill: '#ccc', fillOpacity: 0.2 }),
        vg.colorLegend({ 
          as: $legendBrush, 
          columns: 1, 
          label: geneLabels[gene as keyof typeof geneLabels]
        }),
        vg.colorScale('linear'),
        vg.colorRange(['#f0f0f0', '#deebf7', '#9ecae1', '#3182bd', '#08519c']),
        vg.xLabel('UMAP Dimension 1'),
        vg.yLabel('UMAP Dimension 2'),
        vg.width(umapWidth),
        vg.height(umapHeight),
      ) 
      : 
      vg.plot(
        vg.dot(vg.from('cells', {}), {
          x: 'UMAP_1',
          y: 'UMAP_2',
          fill: umapFill,
          r: 1.5,
          opacity: 0.5,
          tip: {
            format: {
              x: false,
              y: false,
              fill: false
            }
          },
          title: 'cluster'
        }),
        // vg.panZoom({x: $xs, y: $ys}),
        vg.intervalXY({ as: $spatialBrush, brush: { fill: 'none', stroke: '#888' } }),
        vg.highlight({ by: $allFilter, fill: '#ccc', fillOpacity: 0.2 }),
        vg.colorLegend({ 
          as: $legendBrush, 
          columns: 1, 
          label: legendLabels[umapFill as keyof typeof legendLabels]
        }),
        vg.xLabel('UMAP Dimension 1'),
        vg.yLabel('UMAP Dimension 2'),
        vg.width(umapWidth),
        vg.height(umapHeight),
      );
      if (umapRef.current) {
        umapRef.current.replaceChildren(umap);
      }

      const nFeature = vg.plot(
        vg.densityX(vg.from('cells', { filterBy: $umapFilter }), {
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
        vg.densityX(vg.from('cells', { filterBy: $umapFilter }), {
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
        vg.densityX(vg.from('cells', { filterBy: $umapFilter }), {
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
  }, [umapFill, gene]);

  return (
    <div className='row'>

      <div className='col-9 ps-0 pe-3'>

        <div className='card my-0 shadow-sm'>
          <div className='card-header text-ss d-flex justify-content-between align-items-end'>
            <span className='fw-bold'>UMAP</span>
            <button 
              className='btn btn-danger btn-xs shadow-sm ms-auto cursor-pointer'
              onClick={handleResetAll}
            >
              Reset
            </button>
          </div>
          <div className='card-body'>
            <div className='' ref={umapRef}></div>
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
              className='form-select form-select-sm mb-3'
              aria-label='umapFill'
              value={umapFill}
              onChange={(e) => setUmapFill(e.target.value)}
            >
              {Object.keys(legendLabels).map((key) => (
                <option key={key} value={key}>{legendLabels[key as keyof typeof legendLabels]}</option>
              ))}
              <option value='gene'>Gene Expression</option>
            </select>
            
            {umapFill === 'gene' && (
              <>
              <p className='text-ss mb-0 fw-bold'>Gene</p>
                <select 
                  className='form-select form-select-sm'
                  aria-label='umapFill'
                  value={gene}
                  onChange={(e) => setGene(e.target.value)}
                >
                  {Object.keys(geneLabels).map((key) => (
                    <option key={key} value={key}>{geneLabels[key as keyof typeof geneLabels]}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        <div className='card my-2 shadow-sm'>
          <div className='card-header text-ss d-flex justify-content-between align-items-end'>
            <span className='fw-bold'>QC Distribution</span>
            <button 
              className='btn btn-danger btn-xs shadow-sm ms-auto cursor-pointer'
              onClick={handleResetQC}
            >
              Reset
            </button>
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
