# Load required libraries
library(duckdb)
library(cachem)
library(data.table)

# Source the server and query logic.
# Using file.path to construct the path robustly.
source(file.path('R', 'server.R'))
source(file.path('R', 'query.R'))

data <- fread('data/umap_sample.txt')


# Main function to run the server
run <- function() {
  # Get database path from command line arguments, default to in-memory
  args <- commandArgs(trailingOnly = TRUE)
  db_path <- if (length(args) >= 1) args[1] else ':memory:'
  
  # cat('Using DuckDB', db_path, '\n')
  
  # Connect to DuckDB
  con <- dbConnect(duckdb(), dbdir = db_path)
  on.exit(dbDisconnect(con, shutdown = TRUE), add = TRUE)
  
  clean_sql_names <- function(names) {
    # Replace any non-alphanumeric characters (except underscore) with underscore
    cleaned <- gsub('[^A-Za-z0-9_]', '_', names)
    
    # Ensure names don't start with a number
    cleaned <- ifelse(grepl('^[0-9]', cleaned), paste0('col_', cleaned), cleaned)
    
    # Remove multiple consecutive underscores
    cleaned <- gsub('_{2,}', '_', cleaned)
    
    # Remove trailing underscores
    cleaned <- gsub('_$', '', cleaned)
    
    return(cleaned)
  }
  
  # Create a dummy 'cells' table for testing if using an in-memory database
  if (db_path == ':memory:') {
    # cat('Creating table for testing...\n')
    
    original_names <- colnames(data)
    clean_names <- clean_sql_names(original_names)
    colnames(data) <- clean_names
    
    gene_columns <- colnames(data)[10:length(colnames(data))]
    gene_sql <- paste(gene_columns, 'DOUBLE', collapse = ',\n        ')
    
    # Build the complete SQL statement
    query <- paste0('
      CREATE TABLE cells (
        cell_id VARCHAR,
        cluster VARCHAR,
        pca_cluster VARCHAR,
        sample VARCHAR,
        orig_ident VARCHAR,
        UMAP_1 DOUBLE,
        UMAP_2 DOUBLE,
        nFeature_RNA INTEGER,
        nCount_RNA INTEGER,
        percent_mt DOUBLE,
        ', gene_sql, '
      );
    ')
    
    dbExecute(con, query)
    
    n_cells <- nrow(data)
    cells_data <- data
    cells_data$cell_id = 1:n_cells

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

