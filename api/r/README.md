# R WebSocket Server for Mosaic vgplots

This directory contains an R implementation of the Python WebSocket server.

## Dependencies

The server requires the following R packages:
- `httpuv`
- `duckdb`
- `arrow`
- `jsonlite`
- `digest`
- `cachem`
- `promises`
- `later`

You can install them by running the following command in your R console:
```R
install.packages(c("httpuv", "duckdb", "arrow", "jsonlite", "digest", "cachem", "promises", "later"))
```

## Running the server

You can run the server from your system's command line using `Rscript`:

```sh
Rscript R/run.R [path_to_duckdb_file]
```

If you don't provide a path, it will use an in-memory DuckDB database.

The server will start and listen on `ws://localhost:3000` and `http://localhost:3000`.
