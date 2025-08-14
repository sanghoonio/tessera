// import { useRef, useEffect } from 'react';
// import * as vg from '@uwdata/vgplot';


function Overview() {
  // const imgRef = useRef<HTMLDivElement>(null);

  // const colors = ["#66695A", "#F6FCFE", "#444C44", "#383F30", "#192216", "#575A46", "#4C4C30", "#8E6E2B", "#7E7967", "#2A3224", "#A58237", "#938A75", "#796A41", "#CC9C52", "#6D5727", "#A8A08B"]

  // const plotImg = async () => {
  //   const featureCurve = vg.plot(
  //     vg.voronoi(vg.from('img', {}), {
  //       x: vg.sql`CAST(x AS NUMERIC)`,
  //       y: vg.sql`CAST(y AS NUMERIC)`,
  //       r: 2,
  //       fill: 'color',
  //       tip: false
  //     }),
  //     vg.name('img'),
  //     vg.colorRange(colors),
  //     vg.colorDomain(colors),
  //     vg.xAxis(null),
  //     vg.yAxis(null),
  //     vg.width(5312/9),
  //     vg.height(2988/9),
  //   );

  //   if (imgRef.current) imgRef.current.replaceChildren(featureCurve);
  // };

  // useEffect(() => { // plot saturation if any dependencies change
  //   plotImg();
  //   // return () => {
  //   //   coordinator.clear({ clients: true, cache: true });
  //   // }
  // }, []);

  return (
    <div className='row p-2 p-lg-4 mt-4 mt-lg-0'>
      <div className='col-12 px-5 py-4'>
        {/* <div className='d-flex justify-content-end' ref={imgRef}></div> */}
        
        <h4 className='fw-lighter'>A functional, intuitive, and aesthetic interface for single-cell data</h4>

        <h6 className='fw-bold mt-4'>Real-time multimodal analysis</h6>
        <p>
          Tessera is based on Mosaic, which supports real-time multimodal interactions across visualizations that remain performant across billions of data points. 
          Because linked interactions occur in real time, visual exploration of data becomes more intuitive, engaging, and fun.
          The instantanous feedback provided by Mosaic interactions not only speeds up analysis, but also helps increase the precision of your selections and filters, allowing for a more refined exploration of data.
          Subtle details you might have missed in static visualizations or visualizations with sequential feedback become more apparent, 
          giving you a more nuanced understanding of the data to support iterative exploration and hypothesis generation.
        </p>
        <p className='mb-1'>
          Some examples of multimodal interactions facilitated by Tessera include: 
        </p>
        <ul>
          <li>receiving a live feed of the most expressed or differentially expressed genes that updates as you select a group of cells on a UMAP projection</li>
          <li>brushing across a density plot of feature counts or percent mitochondria by cell to see how varying QC thresholds affect highlighted cells of a particular group on a UMAP projection in real time</li>
          <li>likely many more, but a little annoying to describe in words</li>
        </ul>
        
        <h6 className='fw-bold mt-4'>Declarative specifications and extensible views</h6>
        <p>
          Underlying Mosaic is vgplot, a declarative grammar-based graphics library inspired by Vega-Lite (written by the same authors) and rendered as SVG through Observable Plot. 
          Plot specifications are defined in JSON or YAML with a concise syntax that is easy to understand, distribute, and convert to other declarative grammars such as Vega-Lite and ggplot2. 
          Mosaic builds upon this concept of extensibility and employs selection and filter parameters that are independent of the plots themselves, meaning they can be used with an infinite number of other Mosaic plots, custom visualizations, or even simply exported as text.
          These generalized selection abstractions allow for serializing individual analyses results and their associated plots within Tessera to a link or schema, which facilitates convenient sharing.
        </p>
        <p>
          A schema-based interface is extensible by nature, and custom plot categories or metadata annotations can be added to existing plots by simply appending to vgplot specifications. 
          View schemas can be based on JSON or YAML and incorporate plots with custom selections or analyses taken that resulted in a particular outcome. 
          Tessera is a great candidate for integration with PEPhub schemas to allow for storage, iterative development through version control, and sharing of plots and analysis workflows.
          Even if Tessera infrastructure becomes unavailable, the declarative nature of these schemas can allow them to be converted to or exported as other grammars that can be rendered elsewhere like in Jupyter Notebooks.
        </p>

        <h6 className='fw-bold mt-4'>Flexibility across platforms</h6>
        <p>
          Mosaic processes its data and interactions through a database backing, usually DuckDB. 
          DuckDB is portable and supports a wide variety of platforms, including Python, R, Node.js, Rust, Go, and even WebAssembly. 
          This means Tessera can run with a backing server platform of your choice, or standalone directly in the browser if your data is preprocessed. 
          The interface takes this into account and will allow for connecting to a custom server or run as standalone if the user provides a compatible schema.
        </p>
          
        <h5 className='fw-light mt-4'>Comparison to existing tools</h5>

        <h6 className='fw-bold mt-3'>CELLxGENE Explorer</h6>
        <ul>
          <li>provides a performant interface centered around a projection plot and selection by metadata category or lasso to show differential gene expression across groups</li>
          <li>as the name suggests, focuses mainly showing gene expression in selected cells and not other annotations of the data</li>
          <li>lasso select is cool, but analyses of selected groups are sequential to selections and not real-time</li>
          <li>supports spatial data</li>
          <li>open source</li>
        </ul>

        <h6 className='fw-bold'>UCSC Cell Browser</h6>
        <ul>
          <li>provides a performant interface centered around a projection plot and selection by metadata category, subcategory bin levels, or rectangle to aggregate metadata metrics or highlight selection gene expression levels</li>
          <li>similar concept to CELLxGENE Explorer but more useful in terms of metadata metrics while being arguably uglier</li>
          <li>analyses and aggregations are sequential to selections</li>
          <li>supports spatial data</li>
          <li>open source</li>
        </ul>

        <h6 className='fw-bold'>Vitessce</h6>
        <ul>
          <li>primary focus is to provide a modular interface where various visualizations, including scatterplots, heatmaps, spatial plots, histograms, tables, and others, can interact with each other</li>
          <li>plot views are defined by a view config schema based on JSON or JS</li>
          <li>includes projection plots with lasso or rectangle selections that update other plots, and other plots are similarly selectable to highlight the projection plot</li>
          <li>analyses and aggregations are sequential to selections</li>
          <li>supports spatial data</li>
          <li>open source</li>
        </ul>

        <h6 className='fw-bold'>ShinyCell2</h6>
        <ul>
          <li>provides a Shiny-based interface to allow R users to view and interact with their single-cell data</li>
          <li>good integration with R and distributable, but comes with the downsides of Shiny including lack of scalability and limited frontend interactivity</li>
          <li>supports spatial data</li>
          <li>open source</li>
        </ul>

        <h6 className='fw-bold'>Tessera (current prototype)</h6>
        <ul>
          <li>supports real-time interactions and feedback between visualizations</li>
          <li>provides a performant interface that includes a projection plot and selection by metadata category, subcategory ranges or levels, or rectangle to aggregate metadata metrics or highlight selection gene expression levels</li>
          <li>density plots for metadata update in real-time as the user updates their selection on the UMAP projection, and vice-versa for highlighted cells on the UMAP as the user brushes on other plots</li>
          <li>plots are defined in vgplot, which provides a concise grammar that is distributable and can be incorporated in hypothetical view schemas</li>
          <li>open source</li>
        </ul>

        <h5 className='fw-light mt-4'>Next steps</h5>

        <h6 className='fw-bold mt-3'>Frontend</h6>
        <ul>
          <li>continue to explore various Mosaic and vgplot visualizations for single-cell data</li>
          <li>try incorporating a schema system that builds out vgplots according to spec</li>
          <li>look into lasso select in D3, which Observable Plot and vgplot are based off of</li>
          <li>determine whether it is possible for a selection query from the UMAP to update a volcano plot for differential gene expression between selected and background cells in real time</li>
        </ul>

        <h6 className='fw-bold'>Backend</h6>
        <ul>
          <li>explore what the most suitable implementation of a DuckDB websocket server might be for Mosaic queries</li>
          <li>determine what kind of analyses might be doable through DuckDB queries, and how much preprocessing various input data would generally require before you can drop them into Mosaic plots and run standard SQL queries on them</li>
        </ul>

      </div>
    </div>
  );
}

export default Overview;
