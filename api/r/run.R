suppressWarnings(suppressMessages(library(duckdb, quietly = TRUE)))
suppressWarnings(suppressMessages(library(cachem, quietly = TRUE)))

source(file.path('R', 'server.R'))
source(file.path('R', 'query.R'))
source(file.path('R', 'utils.R'))

run <- function() {
  args <- commandArgs(trailingOnly = TRUE)
  db_path <- if (length(args) >= 1) args[1] else ':memory:'
  
  con <- dbConnect(duckdb(), dbdir = db_path)
  on.exit(dbDisconnect(con, shutdown = TRUE), add = TRUE)
  
  # if (db_path == ':memory:') {
  #   load_test(con)
  # }
  
  load_test(con)
  
  cache <- cache_mem()
  create_server(con, cache)
}

run()
