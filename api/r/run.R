# Load required libraries
library(duckdb)
library(cachem)
library(data.table)

# Source the server and query logic.
# Using file.path to construct the path robustly.
source(file.path('R', 'server.R'))
source(file.path('R', 'query.R'))

ct <- fread('data/ct_data.txt')
sc2 <- fread('data/sc2_data.txt')
sc4 <- fread('data/sc4_data.txt')
img <- fread('data/korea.txt')
unique(img$color)

data <- list('ct' = ct, 'sc2' = sc2, 'sc4' = sc4)

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
    
    for (i in 1:length(data)) {
      original_names <- colnames(data[[i]])
      clean_names <- clean_sql_names(original_names)
      colnames(data[[i]]) <- clean_names
      
      gene_columns <- colnames(data[[i]])[10:length(colnames(data[[i]]))]
      gene_sql <- paste(gene_columns, 'DOUBLE', collapse = ',\n        ')
      
      query <- paste0('
      CREATE TABLE ', names(data)[[i]], ' (
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
      
      n_cells <- nrow(data[[i]])
      cells_data <- data[[i]]
      cells_data$cell_id = 1:n_cells
      
      dbWriteTable(con, names(data)[[i]], cells_data, append = FALSE, overwrite = TRUE, row.names = FALSE)
    }
    
    query <- paste0('
      CREATE TABLE img (
        x VARCHAR,
        y VARCHAR,
        color VARCHAR,
      );
    ')
    
    dbExecute(con, query)
    dbWriteTable(con, 'img', img, append = FALSE, overwrite = TRUE, row.names = FALSE)
    
  }
  
  # Create a cache
  cache <- cache_mem() # In-memory cache, can be changed to cache_disk for persistence
  # cat('Caching in memory\n')
  
  # Start the server
  create_server(con, cache)
}

# Run the server
run()

