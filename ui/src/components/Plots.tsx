import { useState, useEffect, useRef } from 'react';
import Select from 'react-select'
import * as vg from '@uwdata/vgplot';

import { createUmapCategories, bootstrapSelectStyles } from '../utils';
import { fetchColumnCounts, fetchGeneCols, fetchExpressionRates, fetchColumnCountsFilter } from '../clients';

const Plots = () => {
  const umapLegendRef = useRef<HTMLDivElement>(null);
  const umapRef = useRef<HTMLDivElement>(null);
  const featureCurveRef = useRef<HTMLDivElement>(null);
  const featureUMICurveRef = useRef<HTMLDivElement>(null);
  const nFeatureRef = useRef<HTMLDivElement>(null);
  const nCountRef = useRef<HTMLDivElement>(null);
  const percentMTRef = useRef<HTMLDivElement>(null);

  const [geneOptions, setGeneOptions] = useState<{value: string, label: string}[]>([])
  const [umapFill, setUmapFill] = useState('cluster');
  const [containerWidth, setContainerWidth] = useState(800);
  const [legendPosition, setLegendPosition] = useState('topright');
  const [clusterCount, setClusterCount] = useState(0);
  const [geneComparisonMode, setGeneComparisonMode] = useState('categorical');
  const [geneExpressionRates, setGeneExpressionRates] = useState<{gene: string, expressionRate: number}[]>([]);
  const [gene, setGene] = useState('');
  const [gene2, setGene2] = useState('');

  const [selectionSummary, setSelectionSummary] = useState({
    totalCells: 0,
    filteredCells: 0,
    avgFeatureRNA: 0,
    avgCountRNA: 0,
    avgPercentMT: 0,
    clusterCounts: {}
  });

  const umapCategories = createUmapCategories(gene, gene2, geneComparisonMode, clusterCount);
  const umapCategory = umapCategories[umapFill as keyof typeof umapCategories];

  useEffect(() => {
    const cardBody = umapRef.current?.parentElement;
    if (!cardBody) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      const width = entries[0].contentRect.width;
      setContainerWidth(width || 800);
    });
    
    resizeObserver.observe(cardBody);
    return () => resizeObserver.disconnect();
  }, []);

  const coordinator = vg.coordinator();
  // vg.coordinator().databaseConnector(vg.socketConnector());

  useEffect(() => {
    if (!coordinator) return;

    fetchColumnCounts(coordinator, 'pca_cluster').then(result => {
      setClusterCount(result);
    });

    fetchGeneCols(coordinator).then(result => {
      if (result && result.length > 0) {
        setGene(result[0]);
        setGene2(result[1]);
        setGeneOptions(result.map((gene: string) => {
          return({value: gene, label: gene.replace('gene_', '')})
        }))
      }
    })
  }, []);
  
  useEffect(() => {
    const geneClient = fetchExpressionRates(coordinator, $allFilter, geneOptions, setGeneExpressionRates);
    return () => geneClient.destroy();
  }, [geneOptions.length > 0]);
  
  useEffect(() => {
    const client = fetchColumnCountsFilter(coordinator, $allFilter, 'cluster', setSelectionSummary);
    return () => client.destroy();
  }, [umapFill, gene, gene2, containerWidth, geneComparisonMode]);

  const $legendBrush = useRef(vg.Selection.intersect({ cross: true })).current;
  const $umapBrush = useRef(vg.Selection.intersect()).current;
  
  const $nFeatureBrush = useRef(vg.Selection.intersect()).current;
  const $nCountBrush = useRef(vg.Selection.intersect()).current;
  const $percentMTBrush = useRef(vg.Selection.intersect()).current;

  const $featureCurveBrush = useRef(vg.Selection.intersect()).current;
  const $featureUMICurveBrush = useRef(vg.Selection.intersect()).current;

  const $saturationFilter = useRef(vg.Selection.intersect({ include: [$legendBrush, $umapBrush, $nFeatureBrush, $nCountBrush, $percentMTBrush] })).current;
  const $densityFilter = useRef(vg.Selection.intersect({ include: [$legendBrush, $umapBrush, $featureCurveBrush, $featureUMICurveBrush] })).current;
  const $allFilter = useRef(vg.Selection.intersect({ include: [$legendBrush, $umapBrush, $nFeatureBrush, $nCountBrush, $percentMTBrush, $featureCurveBrush, $featureUMICurveBrush] })).current;
  
  const handleReset = () => {
    $legendBrush.reset();
    $umapBrush.reset();

    $nFeatureBrush.reset();
    $nCountBrush.reset();
    $percentMTBrush.reset();

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

  useEffect(() => { // Reset all brushes when the category changes
    $nFeatureBrush.reset();
    $nCountBrush.reset();
    $percentMTBrush.reset();
    $featureCurveBrush.reset();
    $featureUMICurveBrush.reset();
    $umapBrush.reset();
    $legendBrush.reset();
  }, [umapFill, gene, gene2, geneComparisonMode]);

  useEffect(() => { // draws vgplots
    const createChart = async () => {

      const umapWidth = containerWidth;
      const umapHeight = umapWidth * 9/13;

      const umapArgs = [
        vg.dot(vg.from('cells', {}), {
          x: 'UMAP_1',
          y: 'UMAP_2',
          fill: umapCategory.fillValue,
          r: 1.5,
          opacity: 0.44,
          tip: { format: { x: false, y: false, fill: false } },
          title: 'cluster'
        }),
        vg.name('umap'),
        vg.intervalXY({ as: $umapBrush, brush: { fill: 'none', stroke: '#888' } }),
        vg.highlight({ by: $allFilter, fill: umapFill === 'excluded' ? 'red' : '#ccc', fillOpacity: umapFill === 'excluded' ? 0.3 : 0.2 }),
        vg.xLabel('UMAP Dimension 1'),
        vg.yLabel('UMAP Dimension 2'),
        vg.width(umapWidth),
        vg.height(umapHeight),
      ];

      if (umapCategory.colorScale) {
        umapArgs.push(vg.colorScale(umapCategory.colorScale));
      }
      if (umapCategory.colorRange) {
        umapArgs.push(vg.colorRange(umapCategory.colorRange));
      }
      if (umapCategory.colorDomain) {
        umapArgs.push(vg.colorDomain(umapCategory.colorDomain));
      }
      if (umapCategory.colorScheme) {
        umapArgs.push(vg.colorScheme(umapCategory.colorScheme));
      }
      if (umapCategory.colorReverse) {
        umapArgs.push(vg.colorReverse(umapCategory.colorReverse));
      }

      const umap = vg.plot(...umapArgs);
      if (umapRef.current) {
        umapRef.current.replaceChildren(umap);
      }

      const umapLegend = vg.colorLegend({ 
        for: 'umap',
        as: umapFill === 'excluded' ? null : $legendBrush, 
        columns: 1, 
        label: umapCategory.legendTitle ? umapCategory.legendTitle : umapCategory.title
      });
      if (umapLegendRef.current) {
        umapLegendRef.current.replaceChildren(umapLegend);
      }

      const featureCurve = vg.plot(
        vg.line(vg.from('cells', { filterBy: $saturationFilter }), {
          x: vg.sql`ROW_NUMBER() OVER (ORDER BY nFeature_RNA)`,
          y: 'nFeature_RNA',
          stroke: 'gray',
          strokeWidth: 3,
          opacity: 0.5,
          tip: false,
        }),
        vg.intervalY({ as: $featureCurveBrush }),
        vg.xLabel('Cell Count'),
        vg.yLabel(umapCategories.nFeature_RNA.title),
        vg.width(umapWidth),
        vg.height(255),
      );
      if (featureCurveRef.current) {
        featureCurveRef.current.replaceChildren(featureCurve);
      }

      const featureUMICurve = vg.plot(
        vg.dot(vg.from('cells', { filterBy: $saturationFilter }), {
          x: 'nCount_RNA',
          y: 'nFeature_RNA',
          r: 2.5,
          fill: 'gray', 
          opacity: 0.3,
          tip: false,
        }),
        vg.colorScheme('magma'),
        vg.intervalXY({ as: $featureUMICurveBrush }),
        vg.xLabel(umapCategories.nCount_RNA.title),
        vg.yLabel(umapCategories.nFeature_RNA.title),
        vg.width(umapWidth),
        vg.height(255),
      );
      if (featureUMICurveRef.current) {
        featureUMICurveRef.current.replaceChildren(featureUMICurve);
      }

      const nFeature = vg.plot(
        vg.densityY(vg.from('cells', { filterBy: $densityFilter }), {
          x: 'nFeature_RNA',
          opacity: 0.5,
          tip: false,
        }),
        vg.intervalX({ as: $nFeatureBrush }),
        vg.xLabel(umapCategories.nFeature_RNA.title),
        vg.yAxis(null),
        vg.width(umapWidth),
        vg.height(88),
      );
      if (nFeatureRef.current) {
        nFeatureRef.current.replaceChildren(nFeature);
      }

      const nCount = vg.plot(
        vg.densityY(vg.from('cells', { filterBy: $densityFilter }), {
          x: 'nCount_RNA',
          opacity: 0.5,
          tip: false,
        }),
        vg.intervalX({ as: $nCountBrush }),
        vg.xLabel(umapCategories.nCount_RNA.title),
        vg.yAxis(null),
        vg.width(umapWidth),
        vg.height(88),
      );
      if (nCountRef.current) {
        nCountRef.current.replaceChildren(nCount);
      }

      const percentMT = vg.plot(
        vg.densityY(vg.from('cells', { filterBy: $densityFilter }), {
          x: 'percent_mt',
          opacity: 0.5,
          tip: false,
        }),
        vg.intervalX({ as: $percentMTBrush }),
        vg.xLabel(umapCategories.percent_mt.title),
        vg.yAxis(null),
        vg.width(umapWidth),
        vg.height(88),
      );
      if (percentMTRef.current) {
        percentMTRef.current.replaceChildren(percentMT);
      }
    };

    createChart();
  }, [umapFill, gene, gene2, containerWidth, geneComparisonMode]);

  return (
    <div className='row'>

      <div className='col-9 ps-0 pe-3'>

        <div className='card mb-3 shadow-sm'>
          <div className='card-header text-ss d-flex justify-content-between align-items-end'>
            <span className='fw-bold'>UMAP</span>
            <button 
              className='btn btn-danger btn-xs shadow-sm ms-auto cursor-pointer'
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
          <div className='card-body'>
            <div className='' ref={umapRef}></div>
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
            
          </div>
        </div>

        <div className='card mb-3 shadow-sm'>
          <div className='card-header text-ss d-flex justify-content-between align-items-end'>
            <span className='fw-bold'>QC Distribution</span>
          </div>
          <div className='card-body pt-1 px-0'>
            <div className='d-flex flex-row justify-content-between align-items-center border-bottom py-2'>
              <div className='flex-grow-1' style={{marginLeft: '-.75rem', marginRight: '2rem'}} ref={nFeatureRef}></div>
              <div className='me-3 text-center' style={{width: '80px'}}>
                <p className='text-xs mb-0'>
                  <strong>Max: </strong>
                  {nFeatureValues ? nFeatureValues[1].toFixed(1) : 'Inf'}
                </p>
                <p className='text-xs mb-0'>
                  <strong>Min: </strong>
                  {nFeatureValues ? nFeatureValues[0].toFixed(1) : '0'}
                </p>
              </div>
            </div>
            <div className='d-flex flex-row justify-content-between align-items-center border-bottom py-2'>
              <div className='flex-grow-1' style={{marginLeft: '-0.75rem', marginRight: '2rem'}} ref={nCountRef}></div>
              <div className='me-3 text-center' style={{width: '80px'}}>
                <p className='text-xs mb-0'>
                  <strong>Max: </strong>
                  {nCountValues ? nCountValues[1].toFixed(1) : 'Inf'}
                </p>
                <p className='text-xs mb-0'>
                  <strong>Min: </strong>
                  {nCountValues ? nCountValues[0].toFixed(1) : '0'}
                </p>
              </div>
            </div>
            <div className='d-flex flex-row justify-content-between align-items-center pt-2'>
              <div className='flex-grow-1' style={{marginLeft: '-0.75rem', marginRight: '2rem'}} ref={percentMTRef}></div>
              <div className='me-3 text-center' style={{width: '80px'}}>
                <p className='text-xs mb-0'>
                  <strong>Max: </strong>
                  {percentMTValues ? percentMTValues[1].toFixed(1) : 'Inf'}
                </p>
                <p className='text-xs mb-0'>
                  <strong>Min: </strong>
                  {percentMTValues ? percentMTValues[0].toFixed(1) : '0'}
                </p>
              </div>
            </div>

          </div>
        </div>

        <div className='card mb-3 shadow-sm'>
          <div className='card-header text-ss d-flex justify-content-between align-items-end'>
            <span className='fw-bold'>Saturation Curves</span>
          </div>
          <div className='card-body px-0'>
            <div className='px-3 pb-3 border-bottom' ref={featureCurveRef}></div>
            <div className='px-3 pt-3' ref={featureUMICurveRef}></div>
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

        <div className='card mb-3 shadow-sm'>
          <div className='card-header text-ss d-flex justify-content-between align-items-end'>
            <span className='fw-bold'>Counts</span>
          </div>
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
            <span className='fw-bold'>Most Expressed Genes</span>
          </div>
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
  );
};

export default Plots;
