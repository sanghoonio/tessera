# Tessera


### A functional, intuitive, and aesthetic interface for single-cell data

**Real-time multimodal analysis**

Tessera is based on [Mosaic](https://idl.uw.edu/mosaic/), which supports real-time multimodal interactions across visualizations that remain performant across billions of data points. Because linked interactions occur in real time, visual exploration of data becomes more intuitive, engaging, and fun. The instantanous feedback provided by Mosaic interactions not only speeds up analysis, but also helps increase the precision of your selections and filters, allowing for a more refined exploration of data. Subtle details you might have missed in static visualizations or visualizations with sequential feedback become more apparent, giving you a more nuanced understanding of the data to support iterative exploration and hypothesis generation.

Some examples of multimodal interactions facilitated by Tessera include:
- receiving a live feed of the most expressed or differentially expressed genes that updates as you select a group of cells on a UMAP projection
- brushing across a density plot of feature counts or percent mitochondria by cell to see how varying QC thresholds affect highlighted cells of a particular group on a UMAP projection in real time
- likely many more, but a little annoying to describe in words


**Declarative specifications and extensible views**

Underlying Mosaic is [vgplot](https://idl.uw.edu/mosaic/vgplot/), a declarative grammar-based graphics library inspired by Vega-Lite (written by the same authors) and rendered as SVG through Observable Plot. Plot specifications are defined in JSON or YAML with a concise syntax that is easy to understand, distribute, and convert to other declarative grammars such as Vega-Lite and ggplot2. Mosaic builds upon this concept of extensibility and employs selection and filter parameters that are independent of the plots themselves, meaning they can be used with an infinite number of other Mosaic plots, custom visualizations, or even simply exported as text. These generalized selection abstractions allow for serializing individual analyses results and their associated plots within Tessera to a link or schema, which facilitates convenient sharing.

A schema-based interface is extensible by nature, and custom plot categories or metadata annotations can be added to existing plots by simply appending to vgplot specifications. View schemas can be based on JSON or YAML and incorporate plots with custom selections or analyses taken that resulted in a particular outcome. Tessera is a great candidate for integration with PEPhub schemas to allow for storage, iterative development through version control, and sharing of plots and analysis workflows. Even if Tessera infrastructure becomes unavailable, the declarative nature of these schemas can allow them to be converted to or exported as other grammars that can be rendered elsewhere like in Jupyter Notebooks.

**Flexibility across platforms**

Mosaic processes its data and interactions through a database backing, usually DuckDB. DuckDB is portable and supports a wide variety of platforms, including Python, R, Node.js, Rust, Go, and even WebAssembly. This means Tessera can run with a backing server platform of your choice, or standalone directly in the browser if your data is preprocessed. The interface takes this into account and will allow for connecting to a custom server or run as standalone if the user provides a compatible schema.

### Comparison to existing tools

**[CELLxGENE Explorer](https://github.com/chanzuckerberg/cellxgene)**

- provides a performant interface centered around a projection plot and selection by metadata category or lasso to show differential gene expression across groups
- as the name suggests, focuses mainly showing gene expression in selected cells and not other annotations of the data
- lasso select is cool, but analyses of selected groups are sequential to selections and not real-time
- supports spatial data
- open source

**[UCSC Cell Browser](https://github.com/ucscGenomeBrowser/cellBrowser)**

- provides a performant interface centered around a projection plot and selection by metadata category, subcategory bin levels, or rectangle to aggregate metadata metrics or highlight selection gene expression levels
- similar concept to CELLxGENE Explorer but more useful in terms of metadata metrics while being arguably uglier
- analyses and aggregations are sequential to selections
- supports spatial data
- open source

**[Vitessce](https://github.com/vitessce/vitessce)**

- primary focus is to provide a modular interface where various visualizations, including scatterplots, heatmaps, spatial plots, histograms, tables, and others, can interact with each other
- plot views are defined by a view config schema based on JSON or JS
- includes projection plots with lasso or rectangle selections that update other plots, and other plots are similarly selectable to highlight the projection plot
- analyses and aggregations are sequential to selections
- supports spatial data
- open source

**[ShinyCell2](https://github.com/the-ouyang-lab/ShinyCell2)**

- provides a Shiny-based interface to allow R users to view and interact with their single-cell data
- good integration with R and distributable, but comes with the downsides of Shiny including lack of scalability and limited frontend interactivity
- supports spatial data
- open source

**[Tessera](https://github.com/sanghoonio/tessera)** (current prototype)

- supports real-time interactions and feedback between visualizations
- provides a performant interface that includes a projection plot and selection by metadata category, subcategory ranges or levels, or rectangle to aggregate metadata metrics or highlight selection gene expression levels
- density plots for metadata update in real-time as the user updates their selection on the UMAP projection, and vice-versa for highlighted cells on the UMAP as the user brushes on other plots
- plots are defined in vgplot, which provides a concise grammar that is distributable and can be incorporated in hypothetical view schemas
- open source

### Next steps

**Frontend**

- continue to explore various Mosaic and vgplot visualizations for single-cell data
- try incorporating a schema system that builds out vgplots according to spec
- look into [lasso select in D3](https://observablehq.com/@fil/lasso-selection), which [Observable Plot](https://observablehq.com/blog/linked-brushing) and vgplot are based off of
- determine whether it is possible for a selection query from the UMAP to update a volcano plot for differential gene expression between selected and background cells in real time

**Backend**

- explore what the most suitable implementation of a DuckDB websocket server might be for Mosaic queries
- determine what kind of analyses might be doable through DuckDB queries, and how much preprocessing various input data would generally require before you can drop them into Mosaic plots and run standard SQL queries on them

<img width="1512" height="945" alt="image" src="https://github.com/user-attachments/assets/864458fc-ffec-4b43-84f0-2cd4816187e8" />
