suppressWarnings(suppressMessages(library(data.table, quietly = TRUE)))

parse_params <- function(query_string) {
  if (is.null(query_string) || nchar(query_string) == 0) {
    return(list())
  }
  
  params <- list()
  pairs <- strsplit(query_string, '&')[[1]]
  for (pair in pairs) {
    kv <- strsplit(pair, '=')[[1]]
    if (length(kv) == 2) {
      params[[URLdecode(kv[1])]] <- URLdecode(kv[2])
    }
  }
  params
}

read_post_body <- function(req) {
  if (req$REQUEST_METHOD == 'POST' && !is.null(req$rook.input)) {
    body <- rawToChar(req$rook.input$read())
    if (nchar(body) > 0) {
      return(fromJSON(body))
    }
  }
  return(NULL)
}

clean_sql_names <- function(names) {
  cleaned <- gsub('[^A-Za-z0-9_]', '_', names)
  cleaned <- ifelse(grepl('^[0-9]', cleaned), paste0('col_', cleaned), cleaned)
  cleaned <- gsub('_{2,}', '_', cleaned)
  cleaned <- gsub('_$', '', cleaned)
  return(cleaned)
}

load_test <- function(con) {
  df <- fread(file.path('..', 'db', 'sample', 'sample.txt'))
  df <- setnames(df, clean_sql_names(colnames(df)))
  dbWriteTable(con, 'sample', df, append = FALSE, overwrite = TRUE, row.names = FALSE)
  
  df <- fread(file.path('..', 'db', 'sample', 'sample_qc_subset.txt'))
  df <- setnames(df, clean_sql_names(colnames(df)))
  dbWriteTable(con, 'sample_qc_subset', df, append = FALSE, overwrite = TRUE, row.names = FALSE)
}
