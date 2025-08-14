library(duckdb)
library(data.table)
library(arrow)

source(file.path('R', 'utils.R'))

con <- dbConnect(duckdb(), dbdir = file.path('..', 'db', 'local.duckdb'))

dbExecute(con, "CREATE OR REPLACE TABLE sample_unfiltered AS SELECT * FROM read_parquet('../db/sample/sample_unfiltered.parquet')")
dbExecute(con, "CREATE OR REPLACE TABLE sample_unfiltered_expr AS SELECT * FROM read_parquet('../db/sample/sample_unfiltered_expr.parquet')")

dbExecute(con, "CREATE OR REPLACE TABLE sample_qc_filtered AS SELECT * FROM read_parquet('../db/sample/sample_qc_filtered.parquet')")
dbExecute(con, "CREATE OR REPLACE TABLE sample_qc_filtered_expr AS SELECT * FROM read_parquet('../db/sample/sample_qc_filtered_expr.parquet')")

dbDisconnect(con, shutdown = TRUE)
