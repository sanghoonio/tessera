library(digest)
library(arrow)

get_key <- function(sql, command) {
  paste0(digest(sql, algo = "sha256"), "_", command)
}

retrieve <- function(cache, query, get) {
  sql <- query$sql
  command <- query$type

  key <- get_key(sql, command)
  result <- cache$get(key)

  if (!is.key_missing(result)) {
    cat("Cache hit\n")
  } else {
    cat("Cache miss\n")
    result <- get(sql)
    if (isTRUE(query$persist)) {
      cache$set(key, result)
    }
  }
  result
}

get_json <- function(con, sql) {
  result <- dbGetQuery(con, sql)
  cat(paste0("Type of result in get_json: ", typeof(result), "\n"))
  cat("Structure of result in get_json:\n")
  print(str(result))
  # Replace NA values with empty strings for robust JSON serialization
  result[is.na(result)] <- ""
  as.character(toJSON(result, auto_unbox = TRUE))
}

get_arrow_bytes <- function(con, sql) {
  result <- dbGetQuery(con, sql)
  cat(paste0("Type of result in get_arrow_bytes: ", typeof(result), "\n"))
  cat("Structure of result in get_arrow_bytes:\n")
  print(str(result))
  # Replace NA values with empty strings for robust Arrow serialization
  result[is.na(result)] <- ""

  # Write to a temporary file and then read as raw bytes
  temp_file <- tempfile(fileext = ".feather")
  arrow::write_feather(result, temp_file, compression = "uncompressed")
  buffer <- readBin(temp_file, "raw", n = file.info(temp_file)$size)
  unlink(temp_file) # Clean up the temporary file
  buffer
}

