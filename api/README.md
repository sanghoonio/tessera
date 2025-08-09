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

If you don't provide a path, it will use an in-memory DuckDB database.

The server will start and listen on `ws://localhost:3000` and `http://localhost:3000`. Access the UI by navigating to `http://localhost:3000` in your browser.
