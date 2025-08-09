suppressWarnings(suppressMessages(library(digest, quietly = TRUE)))
suppressWarnings(suppressMessages(library(arrow, quietly = TRUE)))

get_key <- function(sql, command) {
  paste0(digest(sql, algo = 'sha256'), '_', command)
}

retrieve <- function(cache, query, get) {
  key <- get_key(query$sql, query$type)
  result <- cache$get(key)
  
  if (is.key_missing(result)) { # not in cache
    result <- get(query$sql)
    if (isTRUE(query$persist)) {
      cache$set(key, result)
    }
  }
  result
}

get_json <- function(con, sql) {
  result <- dbGetQuery(con, sql)
  result[is.na(result)] <- ''
  as.character(toJSON(result, auto_unbox = TRUE))
}

get_arrow_bytes <- function(con, sql) {
  result <- dbGetQuery(con, sql)
  result[is.na(result)] <- ''
  write_to_raw(result, format = 'stream')
}
