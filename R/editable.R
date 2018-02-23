# install()
# editable::editable(iris[1:5,], editable = T, editType = list("0" = "text", "4" = "select"), editAttribs = list("0" = list(placeholder = "Sepal.Length"), "4" = list(options = c("setosa", "petosa", "virginica"))))

prepareDataFrame <- function(data, rownames, checkboxSelect) {
  if (checkboxSelect) {
    data = cbind(rep("", nrow(data)), data)
    colnames(data)[1] = "  "
  }
  if (rownames) {
    data = cbind(rownames(data), data)
    colnames(data)[1] = " "
  }
  return(data)
}

#' Convert data returned from an editable table to a data frame
#'
#' This function converts data returned from an editable table
#' to a dataframe object. Therefore, the column and row names will
#' be used.
#'
#' @param Data data returned from getData()
#' @return data frame
#'
#' @seealso editableGetData
#' @export
EditableToDataFrame <- function(Data) {
  df = as.data.frame(Reduce(rbind, Data$data[1:Data$nrow]))
  rownames(df) = NULL
  cols <<- gsub(": .{+}$", "", Data$colnames)
  colnames(df) = cols
  if (" " %in% cols) {
    rownames(df) = df[," "]
    df = df[,-which(" " %in% cols)]
  }
  if ("  " %in% cols) {
    df = df[,-which("  " %in% cols)]
  }
  return(df)
}

#' Get data from an editable table
#'
#' This function requests data from an editable table. The data will
#' be available on an input named with the specified id and "_data" appended.
#' The returned JSON-Data can be converted to a dataframe using the
#' function EditableToDataFrame().
#'
#' @param id Id of the editable table.
#'
#' @seealso EditableToDataFrame
#' @export
editableGetData <- function(id) {
  message = list(id = id)
  shiny::getDefaultReactiveDomain()$sendCustomMessage("editable_getData", message)
}

#' Update data of an editable table
#'
#' This function updates the displayed data of an editable table.
#' Therefore the current search and page selection wont't be changed.
#'
#' @param id Id of the editable table.
#' @param data New data to display as dataframe
#' @param rownames Show rownames.
#' @param checkboxSelect Select rows using checkboxes.
#' @param redraw Redraw the table and reset search, ordering and
#' page selection. The default is FALSE.
#'
#' @seealso editableGetData
#' @export
editableSetData <- function(proxy, data, rownames = F, checkboxSelect = F, redraw = F) {
  data = prepareDataFrame(data, rownames = rownames, checkboxSelect = checkboxSelect)
  invokeRemote(proxy, 'setData', list(data, rownames, checkboxSelect, redraw))
}
# editableSetData <- function(id, data, rownames = F, checkboxSelect = F, redraw = F) {
#   data = prepareDataFrame(data, rownames = rownames, checkboxSelect = checkboxSelect)
#   message = list(id = id, data = jsonlite::toJSON(data, auto_unbox = T), redraw = redraw)
#   shiny::getDefaultReactiveDomain()$sendCustomMessage("editable_setData", message)
# }

#' Add a row to an editable table
#'
#' This function appends a row to an editable table.
#'
#' @param id Id of the editable table.
#' @param rowData Row data to display as dataframe
#' @param rownames Show rownames.
#' @param checkboxSelect Select rows using checkboxes.
#' @param redraw Redraw the table and reset search, ordering and
#'
#' @seealso editableRemoveRow
#' @export
editableAppendRow <- function(id, rowData, rownames = F, checkboxSelect = F, redraw = F) {
  rowData = prepareDataFrame(rowData, rownames = rownames, checkboxSelect = checkboxSelect)
  message = list(id = id, rowData = jsonlite::toJSON(as.data.frame(rowData), auto_unbox = T))
  shiny::getDefaultReactiveDomain()$sendCustomMessage("editable_appendRow", message)
}

#' Remove a row of an editable table
#'
#' This function removes a specified row of an editable table.
#'
#' @param id Id of the editable table.
#' @param rowNum Index(es) of the row(s) to be removed.
#'
#' @seealso editableAppendRow
#' @export
editableRemoveRow <- function(id, rowNum) {
  message = list(id = id, rowNum = rowNum)
  shiny::getDefaultReactiveDomain()$sendCustomMessage("editable_removeRow", message)
}

#' Create an HTML table widget using the DataTables library
#'
#' This function creates an HTML widget to display a data frame
#' using the JavaScript library DataTables. The resulting table
#' may be editable by text inputs and select inputs.
#'
#' @param data a data frame.
#' @param rownames Show rownames.
#' @param checkboxSelect Select rows using checkboxes.
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param ... Other arguments passed to the DataTable() constructor in Javascript.
#'
#' @seealso editableOutput
#' @import htmlwidgets
#'
#' @export
editable <- function(data, rownames = F, checkboxSelect = F, width = NULL, height = NULL, ...) {
  options = list(...)
  if (checkboxSelect) {
    if (rownames) {
      data = cbind(rep("", nrow(data)), data)
      colnames(data)[1] = "  "
      options$columnDefs = c(list(list(orderable = F, className = "select-checkbox", targets = 1)), options$columnDefs)
      options$select = list(style = "os", selector = "td:nth-child(2)", blurable = T)
    } else {
      data = cbind(rep("", nrow(data)), data)
      colnames(data)[1] = "  "
      options$columnDefs = c(list(list(orderable = F, className = "select-checkbox", targets = 0)), options$columnDefs)
      options$select = list(style = "os", selector = "td:first-child", blurable = T)
    }
  }
  if (rownames) {
    data = cbind(rownames(data), data)
    colnames(data)[1] = " "
    options$columnDefs = c(list(list(orderable = F, targets = 0)), options$columnDefs)
  }
  
  # forward options using x
  x = list(data = data, options = options)
  attr(x, 'TOJSON_ARGS') <- list(dataframe = "rows")

  # create widget
  htmlwidgets::createWidget(
    name = 'editable',
    x,
    width = width,
    height = height,
    package = 'editable',
    elementId = NULL
  )
}

#' Shiny bindings for editable
#'
#' Output and render functions for using editable within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a editable
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name editable-shiny
#'
#' @export
editableOutput <- function(outputId, width = '100%', height = 'auto') {
  htmlwidgets::shinyWidgetOutput(outputId, 'editable', width, height, package = 'editable')
}

#' @rdname editable-shiny
#' @export
renderEditable <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, editableOutput, env, quoted = TRUE)
}

#' Manipulate an existing DataTables instance in a Shiny app
#'
#' The function \code{datatableProxy()} creates a proxy object that can be used
#' to manipulate an existing DataTables instance in a Shiny app, e.g. select
#' rows/columns, or add rows.
#' @param outputId the id of the table to be manipulated (the same id as the one
#'   you used in \code{\link{dataTableOutput}()})
#' @param session the Shiny session object (from the server function of the
#'   Shiny app)
#' @param deferUntilFlush whether an action should be carried out right away, or
#'   should be held until after the next time all of the outputs are updated
#' @note \code{addRow()} only works for client-side tables. If you want to use
#'   it in a Shiny app, make sure to use \code{renderDataTable(..., server =
#'   FALSE)}. Also note that the column filters (if used) of the table will not
#'   be automatically updated when a new row is added, e.g., the range of the
#'   slider of a column will stay the same even if you have added a value
#'   outside the range of the original data column.
#' @references \url{https://rstudio.github.io/DT/shiny.html}
#' @rdname proxy
#' @export
editableProxy = function(
  outputId, session = shiny::getDefaultReactiveDomain(), deferUntilFlush = TRUE
) {
  if (is.null(session))
    stop('editableProxy() must be called from the server function of a Shiny app')
  
  structure(list(
    id = session$ns(outputId), rawId = outputId, session = session,
    deferUntilFlush = deferUntilFlush
  ), class = 'editableProxy')
}

invokeRemote = function(proxy, method, args = list()) {
  if (!inherits(proxy, 'editableProxy'))
    stop('Invalid proxy argument; table proxy object was expected')
  
  msg = list(id = proxy$id, call = list(method = method, args = args))
  
  sess = proxy$session
  if (proxy$deferUntilFlush) {
    sess$onFlushed(function() {
      sess$sendCustomMessage('editable-calls', msg)
    }, once = TRUE)
  } else {
    sess$sendCustomMessage('editable-calls', msg)
  }
  proxy
}