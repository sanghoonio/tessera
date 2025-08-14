suppressWarnings(suppressMessages(library(httpuv, quietly = TRUE)))
suppressWarnings(suppressMessages(library(jsonlite, quietly = TRUE)))

source(file.path('R', 'utils.R'))

handle_query <- function(con, cache, query) {
  sql <- query$sql
  command <- query$type
  
  result <- tryCatch({
    if (command == 'exec') {
      dbExecute(con, sql)
      list(type = 'done')
    } else if (command == 'json') {
      json <- retrieve(cache, query, function(s) get_json(con, s))
      list(type = 'json', data = json)
    } else if (command == 'arrow') {
      arrow_bytes <- retrieve(cache, query, function(s) get_arrow_bytes(con, s))
      list(type = 'arrow', data = arrow_bytes)
    } else {
      stop(paste('Unknown command: ', command))
    }
  }, error = function(e) {
    list(type = 'error', data = e$message)
  })
  result
}

create_server <- function(con, cache) {
  app <- list(
    onWSOpen = function(ws) { # websocket server
      ws$onMessage(function(binary, message) {
        tryCatch({
          query <- fromJSON(message)
          result <- handle_query(con, cache, query)
          
          if (result$type == 'done') {
            ws$send(as.character(toJSON(list(), auto_unbox = TRUE)))
          } else if (result$type == 'json') {
            ws$send(result$data)
          } else if (result$type == 'arrow') {
            ws$send(result$data)
          } else if (result$type == 'error') {
            ws$send(as.character(toJSON(list(error = result$data), auto_unbox = TRUE)))
          }
        }, error = function(e) {
          print(e)
          ws$send(as.character(toJSON(list(error = paste('Server error:', e$message)), auto_unbox = TRUE)))
        })
      })
      
      ws$onClose(function() {
      })
    },
    call = function(req) { # http server
      headers <- list(
        'Access-Control-Allow-Origin' = '*',
        'Access-Control-Request-Method' = '*',
        'Access-Control-Allow-Methods' = 'OPTIONS, POST, GET',
        'Access-Control-Allow-Headers' = '*',
        'Access-Control-Max-Age' = '2592000'
      )
      
      if (req$REQUEST_METHOD == 'OPTIONS') {
        return(list(status = 200L, headers = headers, body = ''))
      }
      
      path <- req$PATH_INFO
      method <- req$REQUEST_METHOD
      params <- parse_params(req$QUERY_STRING)
      
      if (path == '/api/echo') {
        if (req$REQUEST_METHOD == 'GET') {
          query_string <- req$QUERY_STRING
          msg <- NULL
          
          if (!is.null(query_string) && grepl('msg=', query_string)) {
            msg_part <- sub('.*msg=([^&]*).*', '\\1', query_string)
            msg <- URLdecode(msg_part)
          }
          
          if (is.null(msg) || msg == '') {
            return(list(status = 400L, headers = headers, 
                        body = toJSON(list(error = 'Missing msg parameter'))))
          }
          
          headers$`Content-Type` <- 'application/json'
          return(list(
            status = 200L, 
            headers = headers, 
            body = toJSON(list(message = msg), auto_unbox = TRUE)
          ))
        } else {
          list(
            status = 405L,
            headers = list('Content-Type' = 'text/plain'),
            body = 'Method Not Allowed'
          )
        }
      }
      else if (path == '/tessera/' || grepl('/tessera/', path)) { # serve ui index
        index_path <- file.path('..', 'ui', 'dist', 'index.html')
        if (file.exists(index_path)) {
          index_content <- readBin(index_path, 'raw', n = file.info(index_path)$size)
          list(
            status = 200L, 
            headers = list('Content-Type' = 'text/html'),
            body = index_content
          )
        } else {
          list(status = 404L, body = 'UI assets not found. Follow the README in the /ui directory to build the frontend.')
        }
      }
    },
    staticPaths = list(
      '/tessera/assets' = file.path('..', 'ui', 'dist', 'assets'),
      '/tessera/sample_unfiltered.parquet' = file.path('..', 'ui', 'dist', 'sample_unfiltered.parquet'),
      '/tessera/sample_unfiltered_expr.parquet' = file.path('..', 'ui', 'dist', 'sample_unfiltered_expr.parquet'),
      '/tessera/sample_qc_filtered.parquet' = file.path('..', 'ui', 'dist', 'sample_qc_filtered.parquet'),
      '/tessera/sample_qc_filtered_expr.parquet' = file.path('..', 'ui', 'dist', 'sample_qc_filtered_expr.parquet')
    )
  )
  
  cat('Server listening at ws://localhost:3000 and http://localhost:3000\n')
  utils::browseURL('http://localhost:3000/tessera/')
  runServer('0.0.0.0', 3000, app)
}
