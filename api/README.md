# Tessera API


This directory contains an R httpuv server that handles WebSocket and HTTP connections in addition to hosting the frontend UI.

### Dependencies

The server requires the following R packages:
- `httpuv`
- `duckdb`
- `arrow`
- `jsonlite`
- `digest`
- `cachem`
- `data.table`

Install them by running the following command in R:
``` R
install.packages(c('httpuv', 'duckdb', 'arrow', 'jsonlite', 'digest', 'cachem', 'data.table'))
```

### Running the server

Run the server from the command line:
``` sh
Rscript R/run.R ../db/local.duckdb
```

The server will start and listen on `ws://localhost:3000` and `http://localhost:3000`. Access the UI by navigating to `http://localhost:3000` in your browser.

If you don't provide a path, it will use an in-memory DuckDB database. To add your own data, first process your data as shown in the example R script located at `/db/generate_tutorial.R`. Feel free to write the parquet files anywhere on disk. Next, write your data to a local DuckDB database by following the example script located at `/db/load_duckdb.R`. If you provide this database path when running your server, you will be able to select your data from the config page in the UI and view it, as long as it was formatted correctly.


