import { useState, useEffect, useRef, useMemo } from 'react';
import Select from 'react-select'
import * as vg from '@uwdata/vgplot';

import { createUmapCategories, bootstrapSelectStyles, tableau20 } from '../utils';
import { fetchColumnCounts, fetchGeneCols, fetchColumnValues, fetchExpressionRates, fetchColumnCountsFilter } from '../clients';

const Plots = () => {
  const plotColRef = useRef<HTMLDivElement>(null);
  const umapLegendRef = useRef<HTMLDivElement>(null);
  const umapRef = useRef<HTMLDivElement>(null);
  const featureCurveRef = useRef<HTMLDivElement>(null);
  const featureUMICurveRef = useRef<HTMLDivElement>(null);
  const nFeatureRef = useRef<HTMLDivElement>(null);
  const nCountRef = useRef<HTMLDivElement>(null);
  const percentMTRef = useRef<HTMLDivElement>(null);
  const sampleLegendRef = useRef<HTMLDivElement>(null);

  const [showUMAP, setShowUMAP] = useState(true);
  const [showQCDist, setShowQCDist] = useState(false);
  const [showSaturation, setShowSaturation] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [showCellTypeCount, setShowCellTypeCount] = useState(true);
  const [showSampleCount, setShowSampleCount] = useState(false);
  const [showGeneExpr, setShowGeneExpr] = useState(false);

  const [umapFill, setUmapFill] = useState('cluster');
  const [containerWidth, setContainerWidth] = useState(800);
  const [legendPosition, setLegendPosition] = useState('topright');
  const [clusterCount, setClusterCount] = useState(0);
  const [cellTypes, setCellTypes] = useState<string[]>([]);
  const [samples, setSamples] = useState<string[]>([]);

  const [geneComparisonMode, setGeneComparisonMode] = useState('categorical');
  const [geneExpressionRates, setGeneExpressionRates] = useState<{gene: string, expressionRate: number}[]>([]);
  const [genes, setGenes] = useState<string[]>([])
  const [gene, setGene] = useState('');
  const [gene2, setGene2] = useState('');

  const [selectedCellTypeCounts, setSelectedCellTypeCounts] = useState({
    totalCells: 0,
    filteredCells: 0,
    cellCounts: {}
  });
  const [selectedSampleCounts, setSelectedSampleCounts] = useState({
    totalCells: 0,
    filteredCells: 0,
    cellCounts: {}
  });

  const geneOptions = useMemo(() => 
    genes.map((gene: string) => ({
      value: gene, 
      label: gene.replace('gene_', '')
    })),
    [genes]
  );

  const umapCategories = useMemo(() => 
    createUmapCategories(gene, gene2, geneComparisonMode, clusterCount, cellTypes, samples),
    [gene, gene2, geneComparisonMode, clusterCount, cellTypes, samples]
  );
  const umapCategory = umapCategories[umapFill as keyof typeof umapCategories];

  const coordinator = vg.coordinator();
  // const coordinator = useRef(vg.coordinator()).current;
  // vg.coordinator().databaseConnector(vg.socketConnector());

  const geneExprAPI = vg.createAPIContext({coordinator: new vg.Coordinator(vg.socketConnector())});
  const umapAPI = vg.createAPIContext({coordinator: new vg.Coordinator(vg.socketConnector())});
  const qcAPI = vg.createAPIContext({coordinator: new vg.Coordinator(vg.socketConnector())});
  const saturationAPI = vg.createAPIContext({coordinator: new vg.Coordinator(vg.socketConnector())});

  const $legendBrush = useRef(vg.Selection.crossfilter()).current;
  const $umapBrush = useRef(vg.Selection.intersect()).current;
  
  const $nFeatureBrush = useRef(vg.Selection.intersect()).current;
  const $nCountBrush = useRef(vg.Selection.intersect()).current;
  const $percentMTBrush = useRef(vg.Selection.intersect()).current;
  const $sampleBrush = useRef(vg.Selection.crossfilter()).current;

  const $featureCurveBrush = useRef(vg.Selection.intersect()).current;
  const $featureUMICurveBrush = useRef(vg.Selection.intersect()).current;

  const $saturationFilter = useRef(vg.Selection.intersect({ include: [$legendBrush, $umapBrush, $nFeatureBrush, $nCountBrush, $percentMTBrush, $sampleBrush] })).current;
  const $densityFilter = useRef(vg.Selection.intersect({ include: [$legendBrush, $umapBrush, $featureCurveBrush, $featureUMICurveBrush, $sampleBrush] })).current;
  const $allFilter = useRef(vg.Selection.intersect({ include: [$legendBrush, $umapBrush, $nFeatureBrush, $nCountBrush, $percentMTBrush, $featureCurveBrush, $featureUMICurveBrush, $sampleBrush] })).current;
  
  const handleReset = () => {
    $legendBrush.reset();
    $umapBrush.reset();

    $nFeatureBrush.reset();
    $nCountBrush.reset();
    $percentMTBrush.reset();
    $sampleBrush.reset();

    $featureCurveBrush.reset();
    $featureUMICurveBrush.reset();
  };

  const nFeatureValues = $nFeatureBrush.value && Array.isArray($nFeatureBrush.value) && $nFeatureBrush.value.length >= 2
    ? $nFeatureBrush.value as [number, number]
    : null;
    
  const nCountValues = $nCountBrush.value && Array.isArray($nCountBrush.value) && $nCountBrush.value.length >= 2
    ? $nCountBrush.value as [number, number]
    : null;

  const percentMTValues = $percentMTBrush.value && Array.isArray($percentMTBrush.value) && $percentMTBrush.value.length >= 2
    ? $percentMTBrush.value as [number, number]
    : null;

  const plotUMAP = async () => {
    const umapWidth = containerWidth;
    const umapHeight = umapWidth * 11/16;

    const umapArgs = [
      umapAPI.dot(umapAPI.from('cells', {}), {
        x: 'UMAP_1',
        y: 'UMAP_2',
        fill: umapCategory.fillValue,
        r: 1.1,
        opacity: 0.44,
        tip: { format: { x: false, y: false, fill: false } },
        title: 'cluster'
      }),
      umapAPI.name('umap'),
      umapAPI.intervalXY({ as: $umapBrush, brush: { fill: 'none', stroke: '#888' } }),
      umapAPI.highlight({ by: $allFilter, fill: umapFill === 'excluded' ? 'red' : '#ccc', fillOpacity: umapFill === 'excluded' ? 0.3 : 0.2 }),
      umapAPI.xLabel('UMAP Dimension 1'),
      umapAPI.yLabel('UMAP Dimension 2'),
      umapAPI.width(umapWidth),
      umapAPI.height(umapHeight),
    ];

    const conditionalArgs = Object.entries({
      colorScale: umapCategory.colorScale,
      colorRange: umapCategory.colorRange,
      colorDomain: umapCategory.colorDomain,
      colorScheme: umapCategory.colorScheme,
      colorReverse: umapCategory.colorReverse
    })
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => umapAPI[key](value));
    umapArgs.push(...conditionalArgs);
    const umap = umapAPI.plot(...umapArgs);

    const umapLegend = umapAPI.colorLegend({ 
      for: 'umap',
      as: umapFill === 'excluded' ? null : $legendBrush, 
      columns: 1, 
      label: umapCategory.legendTitle ? umapCategory.legendTitle : umapCategory.title
    });

    if (umapRef.current) umapRef.current.replaceChildren(umap);
    if (umapLegendRef.current) umapLegendRef.current.replaceChildren(umapLegend);
  };

  const plotQC = async () => {
    const nFeature = qcAPI.plot(
      qcAPI.densityY(qcAPI.from('cells', { filterBy: $densityFilter }), {
        x: 'nFeature_RNA',
        fill: 'sample',
        opacity: 0.5,
        tip: false,
        normalize: 'max',
      }),
      qcAPI.name('nFeature'),
      qcAPI.colorRange(tableau20),
      qcAPI.colorDomain(samples),
      qcAPI.intervalX({ as: $nFeatureBrush }),
      qcAPI.xLabel(umapCategories.nFeature_RNA.title),
      qcAPI.yAxis(null),
      qcAPI.width(containerWidth),
      qcAPI.height(88),
    );

    const nCount = qcAPI.plot(
      qcAPI.densityY(qcAPI.from('cells', { filterBy: $densityFilter }), {
        x: 'nCount_RNA',
        fill: 'sample',
        opacity: 0.44,
        tip: false,
        normalize: 'max',
      }),
      qcAPI.name('nCount'),
      qcAPI.colorRange(tableau20),
      qcAPI.colorDomain(samples),
      qcAPI.intervalX({ as: $nCountBrush }),
      qcAPI.xLabel(umapCategories.nCount_RNA.title),
      qcAPI.yAxis(null),
      qcAPI.width(containerWidth),
      qcAPI.height(88),
    );

    const percentMT = qcAPI.plot(
      qcAPI.densityY(qcAPI.from('cells', { filterBy: $densityFilter }), {
        x: 'percent_mt',
        fill: 'sample',
        opacity: 0.44,
        tip: false,
        normalize: 'max',
      }),
      qcAPI.name('percentMT'),
      qcAPI.colorRange(tableau20),
      qcAPI.colorDomain(samples),
      qcAPI.intervalX({ as: $percentMTBrush }),
      qcAPI.xLabel(umapCategories.percent_mt.title),
      qcAPI.yAxis(null),
      qcAPI.width(containerWidth),
      qcAPI.height(88),
    );

    const sampleLegend = qcAPI.colorLegend({ 
      for: 'nFeature',
      as: $sampleBrush
    });

    if (nFeatureRef.current) nFeatureRef.current.replaceChildren(nFeature);
    if (nCountRef.current) nCountRef.current.replaceChildren(nCount);
    if (percentMTRef.current) percentMTRef.current.replaceChildren(percentMT);
    if (sampleLegendRef.current) sampleLegendRef.current.replaceChildren(sampleLegend);
  };

  const plotSaturation = async () => {
    const featureCurve = saturationAPI.plot(
      saturationAPI.line(saturationAPI.from('cells', { filterBy: $saturationFilter }), {
        x: saturationAPI.sql`ROW_NUMBER() OVER (ORDER BY nFeature_RNA)`,
        y: 'nFeature_RNA',
        stroke: 'gray',
        strokeWidth: 2.2,
        opacity: 0.44,
        tip: false
      }),
      saturationAPI.name('featureCurve'),
      saturationAPI.intervalY({ as: $featureCurveBrush }),
      saturationAPI.xLabel('Cell Count'),
      saturationAPI.yLabel(umapCategories.nFeature_RNA.title),
      saturationAPI.width(containerWidth),
      saturationAPI.height(255),
    );

    const featureUMICurve = saturationAPI.plot(
      saturationAPI.dot(saturationAPI.from('cells', { filterBy: $saturationFilter }), {
        x: 'nCount_RNA',
        y: 'nFeature_RNA',
        r: 2.2,
        fill: 'gray', 
        opacity: 0.25,
        tip: false
      }),
      saturationAPI.name('featureUMICurve'),
      // saturationAPI.colorRange(tableau20),
      // saturationAPI.colorDomain(samples),
      saturationAPI.intervalXY({ as: $featureUMICurveBrush }),
      saturationAPI.xLabel(umapCategories.nCount_RNA.title),
      saturationAPI.yLabel(umapCategories.nFeature_RNA.title),
      saturationAPI.width(containerWidth),
      saturationAPI.height(255),
    );

    if (featureCurveRef.current) featureCurveRef.current.replaceChildren(featureCurve);
    if (featureUMICurveRef.current) featureUMICurveRef.current.replaceChildren(featureUMICurve);
  };

  useEffect(() => { // get number of pca clusters and arrays of unique cell types, samples, gene columns
    if (!coordinator) return;
    fetchColumnCounts(coordinator, 'pca_cluster').then(result => setClusterCount(result));
    fetchColumnValues(coordinator, 'cluster').then(result => setCellTypes(result));
    fetchColumnValues(coordinator, 'sample').then(result => setSamples(result));
    fetchGeneCols(coordinator).then(result => {
      if (result && result.length > 0) {
        setGene(result[0]);
        setGene2(result[1]);
        setGenes(result);
      }
    })
  }, []);
  
  useEffect(() => { // set top expressed genes in selection
    if (!showGeneExpr || genes.length === 0 || !geneExprAPI.context.coordinator) return;
    const geneClient = fetchExpressionRates(geneExprAPI.context.coordinator, $allFilter, genes, setGeneExpressionRates);
    return () => {
      geneClient.destroy();
      geneExprAPI.context.coordinator.clear({ clients: true, cache: true });
    }
  }, [genes, showGeneExpr]);

  useEffect(() => { // set cell type counts in selection
    if (!showCellTypeCount) return;
    const client = fetchColumnCountsFilter(coordinator, $allFilter, 'cluster', cellTypes, setSelectedCellTypeCounts);
    return () => client.destroy()
  }, [cellTypes, showCellTypeCount]);

  useEffect(() => { // set sample counts in selection
    if (!showSampleCount) return;
    const client = fetchColumnCountsFilter(coordinator, $allFilter, 'sample', samples, setSelectedSampleCounts);
    return () => client.destroy()
  }, [samples, showSampleCount]);

  useEffect(() => { // plot umap if any dependencies change
    if (!showUMAP) return;
    handleReset();
    plotUMAP();
    return () => {
      umapAPI.context.coordinator.clear({ clients: true, cache: true });
    }
  }, [umapFill, gene, gene2, containerWidth, geneComparisonMode, showUMAP]);

  useEffect(() => { // plot qc if any dependences change
    if (!showQCDist) return;
    plotQC();
    return () => {
      qcAPI.context.coordinator.clear({ clients: true, cache: true });
    }
  }, [samples, showQCDist]);

  useEffect(() => { // plot saturation if any dependencies change
    if (!showSaturation) return;
    plotSaturation();
    return () => {
      saturationAPI.context.coordinator.clear({ clients: true, cache: true });
    }
  }, [samples, showSaturation]);

  useEffect(() => { // container width watcher
    const cardBody = plotColRef.current;
    if (!cardBody) return;
    const resizeObserver = new ResizeObserver(entries => {
      const width = entries[0].contentRect.width;
      setContainerWidth(width || 800);
    });
    resizeObserver.observe(cardBody);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className='row'>
      <div className='col-9 ps-0 pe-3'>
        <div className='card mb-3 shadow-sm'>
          <div className='card-header text-ss d-flex justify-content-between align-items-end position-relative'>
            <span className='fw-bold'>UMAP</span>
            {/* <button 
              className='btn btn-danger btn-xs shadow-sm ms-auto cursor-pointer'
              onClick={handleReset}
            >
              Reset
            </button> */}
            <a 
              className='text-black fs-5 ms-auto cursor-pointer stretched-link'
              onClick={() => setShowUMAP(!showUMAP)}
              type='button'
              data-bs-toggle='collapse'
              data-bs-target='#collapseUMAP'
              aria-expanded={showUMAP}
              aria-controls='collapseUMAP'
            >
              {showUMAP ? <i className='bi bi-chevron-compact-up' /> : <i className='bi bi-chevron-compact-down' />}
            </a>
          </div>
          <div id='collapseUMAP' className='collapse show'>
            <div className='card-body'>
              <div className='' ref={umapRef}></div>
              {showUMAP && (
                <div 
                  className={`border px-2 rounded shadow-sm bg-white ${umapCategory.colorScale === 'ordinal' && 'pt-1'} ${legendPosition === 'off' ? 'd-none' : 'd-inline-block'}`}
                  ref={umapLegendRef}
                  style={{
                    position: 'absolute',
                    right: 10,
                    ...(legendPosition === 'topright' && { top: 45 }),
                    ...(legendPosition === 'bottomright' && { bottom: 62 })
                  }}
                ></div>
              )}
            </div>
          </div>
        </div>

        <div className='card mb-3 shadow-sm'>
          <div className='card-header text-ss d-flex justify-content-between align-items-end position-relative'>
            <span className='fw-bold'>Normalized Sample QC Distributions</span>
            <a 
              className='text-black fs-5 ms-auto cursor-pointer stretched-link'
              onClick={() => {
                if (showQCDist) { // reset brushes on hide only
                  handleReset();
                  qcAPI.context.coordinator.clear({ clients: true, cache: true });
                }
                setShowQCDist(!showQCDist);
              }}
              type='button'
              data-bs-toggle='collapse'
              data-bs-target='#collapseQCDist'
              aria-expanded={showQCDist}
              aria-controls='collapseQCDist'
            >
              {showQCDist ? <i className='bi bi-chevron-compact-up' /> : <i className='bi bi-chevron-compact-down' />}
            </a>
          </div>
          <div id='collapseQCDist' className='collapse'>
            <div className='card-body pt-1 px-0'>
              <div className='d-flex flex-row justify-content-center align-items-center border-bottom py-1'>
                <div className='d-flex flex-grow-1 justify-content-center' ref={sampleLegendRef}></div>
                <div className='me-3 text-center' style={{width: '80px'}}>
                  <p className='text-xs mb-0 fw-bold'>{umapCategories.sample.title}</p>
                </div>
              </div>
              <div className='d-flex flex-row justify-content-between align-items-center border-bottom py-2'>
                <div className='flex-grow-1' style={{marginLeft: '-.75rem', marginRight: '2rem'}} ref={nFeatureRef}></div>
                <div className='me-3 text-center' style={{width: '80px'}}>
                  <p className='text-xs mb-0 fw-medium'>{umapCategories.nFeature_RNA.title}</p>
                  <p className='text-xs mb-0'>
                    <strong>Min: </strong>
                    {nFeatureValues ? nFeatureValues[0].toFixed(1) : '0'}
                  </p>
                  <p className='text-xs mb-0'>
                    <strong>Max: </strong>
                    {nFeatureValues ? nFeatureValues[1].toFixed(1) : 'Inf'}
                  </p>
                </div>
              </div>
              <div className='d-flex flex-row justify-content-between align-items-center border-bottom py-2'>
                <div className='flex-grow-1' style={{marginLeft: '-0.75rem', marginRight: '2rem'}} ref={nCountRef}></div>
                <div className='me-3 text-center' style={{width: '80px'}}>
                  <p className='text-xs mb-0 fw-medium'>{umapCategories.nCount_RNA.title}</p>
                  <p className='text-xs mb-0'>
                    <strong>Min: </strong>
                    {nCountValues ? nCountValues[0].toFixed(1) : '0'}
                  </p>
                  <p className='text-xs mb-0'>
                    <strong>Max: </strong>
                    {nCountValues ? nCountValues[1].toFixed(1) : 'Inf'}
                  </p>
                </div>
              </div>
              <div className='d-flex flex-row justify-content-between align-items-center pt-2'>
                <div className='flex-grow-1' style={{marginLeft: '-0.75rem', marginRight: '2rem'}} ref={percentMTRef}></div>
                <div className='me-3 text-center' style={{width: '80px'}}>
                  <p className='text-xs mb-0 fw-medium'>{umapCategories.percent_mt.title}</p>
                  <p className='text-xs mb-0'>
                    <strong>Min: </strong>
                    {percentMTValues ? percentMTValues[0].toFixed(1) : '0'}
                  </p>
                  <p className='text-xs mb-0'>
                    <strong>Max: </strong>
                    {percentMTValues ? percentMTValues[1].toFixed(1) : 'Inf'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='card mb-3 shadow-sm'>
          <div className='card-header text-ss d-flex justify-content-between align-items-end position-relative'>
            <span className='fw-bold'>Saturation Curves</span>
            <a 
              className='text-black fs-5 ms-auto cursor-pointer stretched-link'
              onClick={() => {
                if (showSaturation) { // reset brushes on hide only
                  handleReset();
                  saturationAPI.context.coordinator.clear({ clients: true, cache: true });
                }
                setShowSaturation(!showSaturation);
              }}
              type='button'
              data-bs-toggle='collapse'
              data-bs-target='#collapseSaturation'
              aria-expanded={showSaturation}
              aria-controls='collapseSaturation'
            >
              {showSaturation ? <i className='bi bi-chevron-compact-up' /> : <i className='bi bi-chevron-compact-down' />}
            </a>
          </div>
          <div id='collapseSaturation' className='collapse'>
            <div className='card-body px-0'>
              <div className='px-3 pb-3 border-bottom' ref={featureCurveRef}></div>
              <div className='px-3 pt-3' ref={featureUMICurveRef}></div>
            </div>
          </div>
        </div>


        <div className='card my-0 py-0' style={{visibility: 'hidden'}}>
          <div className='card-body my-0 py-0' ref={plotColRef}>
          </div>
        </div>
      
      </div>
      
      <div className='col-3 px-0'>

        <div className='card mt-0 mb-3 shadow-sm'>
          <div className='card-header text-ss d-flex justify-content-between align-items-end position-relative'>
            <span className='fw-bold'>Settings</span>
            <a 
              className='text-black fs-5 ms-auto cursor-pointer stretched-link'
              onClick={() => setShowSettings(!showSettings)}
              type='button'
              data-bs-toggle='collapse'
              data-bs-target='#collapseSettings'
              aria-expanded={showSettings}
              aria-controls='collapseSettings'
            >
              {showSettings ? <i className='bi bi-chevron-compact-up' /> : <i className='bi bi-chevron-compact-down' />}
            </a>
          </div>
          <div id='collapseSettings' className='collapse show'>
            <div className='card-body'>
            <button 
              className='btn btn-danger btn-sm mb-3 w-100 fw-bold'
              onClick={handleReset}
            >
              Reset Plots
            </button>

            <p className='text-ss mb-0 fw-bold'>Fill</p>
            <select 
              className='form-select form-select-sm'
              aria-label='umapFill'
              value={umapFill}
              onChange={(e) => setUmapFill(e.target.value)}
            >
              {Object.keys(umapCategories).map((key) => (
                <option key={key} value={key}>{umapCategories[key as keyof typeof umapCategories].title}</option>
              ))}
            </select>
            
            {(umapFill === 'gene' || umapFill === 'genes') && (
              <>
                <p className='text-ss mt-3 mb-0 fw-bold'>Gene</p>
                <Select 
                  className=''
                  options={geneOptions} 
                  value={{value: gene, label: gene.replace('gene_', '')}} 
                  onChange={(selectedOption) => setGene(selectedOption?.value || '')}
                  isSearchable
                  styles={bootstrapSelectStyles}
                />
              </>
            )}

            {umapFill === 'genes' && (
              <>
                <p className='text-ss mt-3 mb-0 fw-bold'>Gene 2</p>
                  <Select 
                    options={geneOptions} 
                    value={{value: gene2, label: gene2.replace('gene_', '')}} 
                    onChange={(selectedOption) => setGene2(selectedOption?.value || '')}
                    isSearchable
                    styles={bootstrapSelectStyles}
                  />

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
        </div>

        <div className='card mb-3 shadow-sm'>
          <div className='card-header text-ss d-flex justify-content-between align-items-end position-relative'>
            <span className='fw-bold'>Cell Type Counts</span>
            <a 
              className='text-black fs-5 ms-auto cursor-pointer stretched-link'
              onClick={() => setShowCellTypeCount(!showCellTypeCount)}
              type='button'
              data-bs-toggle='collapse'
              data-bs-target='#collapseCellTypeCount'
              aria-expanded={showCellTypeCount}
              aria-controls='collapseCellTypeCount'
            >
              {showCellTypeCount ? <i className='bi bi-chevron-compact-up' /> : <i className='bi bi-chevron-compact-down' />}
            </a>
          </div>
          <div id='collapseCellTypeCount' className='collapse show'>
            <div className='card-body p-0'>
              <table className='table table-striped table-rounded text-xs'>
                <thead>
                  <tr>
                    <th>Cell Type</th>
                    <th>Selected Count</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className='fst-italic fw-medium'>Total</td>
                    <td className='fst-italic fw-medium'>{selectedCellTypeCounts.filteredCells}</td>
                  </tr>
                  {Object.keys(selectedCellTypeCounts.cellCounts).map((cluster: string, index: number) => (
                    <tr key={index}>
                      <td>{cluster}</td>
                      <td>{String(Object.values(selectedCellTypeCounts.cellCounts)[index])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className='card mb-3 shadow-sm'>
          <div className='card-header text-ss d-flex justify-content-between align-items-end position-relative'>
            <span className='fw-bold'>Sample Counts</span>
            <a 
              className='text-black fs-5 ms-auto cursor-pointer stretched-link'
              onClick={() => setShowSampleCount(!showSampleCount)}
              type='button'
              data-bs-toggle='collapse'
              data-bs-target='#collapseSampleCount'
              aria-expanded={showSampleCount}
              aria-controls='collapseSampleCount'
            >
              {showSampleCount ? <i className='bi bi-chevron-compact-up' /> : <i className='bi bi-chevron-compact-down' />}
            </a>
          </div>
          <div id='collapseSampleCount' className='collapse'>
            <div className='card-body p-0'>
              <table className='table table-striped table-rounded text-xs'>
                <thead>
                  <tr>
                    <th>Sample</th>
                    <th>Selected Count</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className='fst-italic fw-medium'>Total</td>
                    <td className='fst-italic fw-medium'>{selectedSampleCounts.filteredCells}</td>
                  </tr>
                  {Object.keys(selectedSampleCounts.cellCounts).map((cluster: string, index: number) => (
                    <tr key={index}>
                      <td>{cluster}</td>
                      <td>{String(Object.values(selectedSampleCounts.cellCounts)[index])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className='card mb-3 shadow-sm'>
          <div className='card-header text-ss d-flex justify-content-between align-items-end position-relative'>
            <span className='fw-bold'>Most Expressed Genes</span>
            <a 
              className='text-black fs-5 ms-auto cursor-pointer stretched-link'
              onClick={() => setShowGeneExpr(!showGeneExpr)}
              type='button'
              data-bs-toggle='collapse'
              data-bs-target='#collapseGeneExpr'
              aria-expanded={showGeneExpr}
              aria-controls='collapseGeneExpr'
            >
              {showGeneExpr ? <i className='bi bi-chevron-compact-up' /> : <i className='bi bi-chevron-compact-down' />}
            </a>
          </div>
          <div id='collapseGeneExpr' className='collapse'>
            <div className='card-body p-0'>
              <table className='table table-striped table-rounded text-xs'>
                <thead>
                  <tr>
                    <th>Gene</th>
                    <th>Expression Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {geneExpressionRates.map((item, index) => (
                    <tr key={index}>
                      <td>{item.gene}</td>
                      <td>{item.expressionRate.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>    

    </div>
  );
};

export default Plots;
