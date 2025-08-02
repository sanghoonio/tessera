library(httpuv)
library(jsonlite)

handle_query <- function(con, cache, query) {
#   cat('Query:', toJSON(query, auto_unbox = TRUE), '
# ')
#   cat(paste0('Type of query$sql: ', typeof(query$sql), '
# '))
#   cat(paste0('Type of query$type: ', typeof(query$type), '
# '))
#   cat(paste0('Is query$sql a character vector of length 1: ', is.character(query$sql) && length(query$sql) == 1, '
# '))
#   cat(paste0('Is query$type a character vector of length 1: ', is.character(query$type) && length(query$type) == 1, '
# '))
  start_time <- Sys.time()

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
      stop(paste('Unknown command', command))
    }
  }, error = function(e) {
    list(type = 'error', data = e$message)
  })

  total_time <- round(as.numeric(Sys.time() - start_time) * 1000)
  # if (!is.null(result$type) && result$type == 'error') {
  #   cat('FAILED. Query took', total_time, 'ms.\n', sql, '\n')
  # } else {
  #   cat('DONE. Query took', total_time, 'ms.\n', sql, '\n')
  # }

  result
}

create_server <- function(con, cache) {
  app <- list(
    onWSOpen = function(ws) {
      # cat('WebSocket connection opened\n')

      ws$onMessage(function(binary, message) {
        tryCatch({
          # cat('WebSocket message received\n')
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
          # cat('Error in onWSMessage:\n')
          print(e)
          tryCatch({
            ws$send(as.character(toJSON(list(error = paste('Server error:', e$message)), auto_unbox = TRUE)))
          }, error = function(e2) {
            # cat('Failed to send error message to client:\n')
            print(e2)
          })
        })
      })

      ws$onClose(function() {
        # cat('WebSocket connection closed\n')
      })
    },
    call = function(req) {
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

      if (req$REQUEST_METHOD == 'GET') {
        query_param <- req$QUERY_STRING
        query_json <- sub('^query=', '', query_param)
        query <- fromJSON(URLdecode(query_json))

        result <- handle_query(con, cache, query)

        if (result$type == 'done') {
          list(status = 200L, headers = headers, body = '')
        } else if (result$type == 'json') {
          Content-Type <- 'application/json'
          list(status = 200L, headers = headers, body = result$data)
        } else {
          list(status = 500L, headers = headers, body = result$data)
        }
      } else {
        list(
          status = 405L,
          headers = list('Content-Type' = 'text/plain'),
          body = 'Method Not Allowed'
        )
      }
    }
  )

  cat('DuckDB Server listening at ws://localhost:3000 and http://localhost:3000\n')
  runServer('0.0.0.0', 3000, app)
}

