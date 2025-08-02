# Load required libraries
library(duckdb)
library(cachem)
library(data.table)

# Source the server and query logic.
# Using file.path to construct the path robustly.
source(file.path('R', 'server.R'))
source(file.path('R', 'query.R'))

data <- fread('umap_sample.txt')


# Main function to run the server
run <- function() {
  # Get database path from command line arguments, default to in-memory
  args <- commandArgs(trailingOnly = TRUE)
  db_path <- if (length(args) >= 1) args[1] else ':memory:'
  
  # cat('Using DuckDB', db_path, '\n')
  
  # Connect to DuckDB
  con <- dbConnect(duckdb(), dbdir = db_path)
  on.exit(dbDisconnect(con, shutdown = TRUE), add = TRUE)
  
  # Create a dummy 'cells' table for testing if using an in-memory database
  if (db_path == ':memory:') {
    # cat('Creating table for testing...\n')
    
    gene_columns <- colnames(data)[8:length(colnames(data))]
    
    # Create the gene column definitions with DOUBLE type
    gene_sql <- paste(gene_columns, 'DOUBLE', collapse = ',\n        ')
    
    # Build the complete SQL statement
    query <- paste0('
      CREATE TABLE cells (
        cell_id VARCHAR,
        cluster VARCHAR,
        UMAP_1 DOUBLE,
        UMAP_2 DOUBLE,
        nFeature_RNA INTEGER,
        nCount_RNA INTEGER,
        percent_mt DOUBLE,
        sample VARCHAR,
        ', gene_sql, '
      );
    ')
    
    dbExecute(con, query)
    
    # Populate with sample data
    # n_cells <- 5000
    # set.seed(42)
    # cells_data <- data.frame(
    #   cell_id = paste0('cell_', 1:n_cells),
    #   cluster = sample(paste0('Cluster_', 1:8), n_cells, replace = TRUE),
    #   UMAP_1 = rnorm(n_cells, mean = 0, sd = 2),
    #   UMAP_2 = rnorm(n_cells, mean = 0, sd = 2),
    #   nFeature_RNA = sample(500:3000, n_cells, replace = TRUE),
    #   nCount_RNA = sample(1000:10000, n_cells, replace = TRUE),
    #   percent_mt = runif(n_cells, min = 0, max = 20),
    #   sample = sample(c('Sample_A', 'Sample_B'), n_cells, replace = TRUE)
    # )
    
    n_cells <- nrow(data)
    cells_data <- data
    cells_data$cell_id = 1:n_cells
    cells_data$sample = 'test_data'
    cells_data <- setnames(cells_data, c('percent.mt'), c('percent_mt'))
    cells_data$orig.ident <- NULL
    
    dbWriteTable(con, 'cells', cells_data, append = TRUE, row.names = FALSE)
    # cat('Dummy table created and populated.\n')
  }
  
  # Create a cache
  cache <- cache_mem() # In-memory cache, can be changed to cache_disk for persistence
  # cat('Caching in memory\n')
  
  # Start the server
  create_server(con, cache)
}

# Run the server
run()

