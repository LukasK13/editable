switchNull <- function(argument, alternative) {
  if (is.null(argument) || argument == "") {
    return(alternative)
  } else {
    return(argument)
  }
}

# Input Listener in Tabelle intialisieren
buildTableInputs <- function(type, attribs) {
  callback = "" # Variable callback initialisieren
  for (column in names(type)) { # Schleife ueber alle bearbeitbaren Spalten
    colIndex = which(column == names(type)) # Index der Spalte in der Liste aller bearbeitbarer Spalten berechnen
    nextCol = if (colIndex < length(type)) names(type)[colIndex + 1] else names(type)[1] # Index der naechsten Spalte berechnen

    if (type[[column]] == "text") { # Input ist ein Textfeld
      callback = paste0(callback, "buildColumnTextInput(table, id, ", column, ", ", nextCol, ", '",
                        switchNull(attribs[[column]]$placeholder, ""), "');") # Callback erzeugen
    } else if (type[[column]] == "select") { # Input ist ein Select Input
      callback = paste0(callback, "buildColumnSelectInput(table, id, ", column, ", ", nextCol, ", ",
                        jsonlite::toJSON(attribs[[column]]$options), ");") # Callback erzeugen
    }
  }
  return(callback) # Callback zurueckgeben
}

#' Create an editable HTML table widget output using the DataTables library
#'
#' This function creates an HTML widget output to display a data frame
#' using the JavaScript library DataTables.
#'
#' @param id output variable to read the table from.
#' @param width the width of the table container.
#' @param height the height of the table container.
#'
#' @seealso editable
#' @export
editableOutput <- function(outputId, width = "100%", height = "auto") {
  shiny::addResourcePath("DataTables", system.file("DataTables", package = "editable"))
  shiny::addResourcePath("editable", system.file("editable", package = "editable"))

  tagList(
    singleton(tags$head(
      tags$script(src="DataTables/datatables.min.js"),
      tags$link(rel="stylesheet", type="text/css", href="DataTables/datatables.min.css"),
      tags$script(src="editable/editable.js")
    )),
    tags$div(class = "editableOutput", tags$table(id = outputId, class = "display", width = width, height = height))
  )
}

#' Create an HTML table widget using the DataTables library
#'
#' This function creates an HTML widget to display a data frame
#' using the JavaScript library DataTables. The resulting table
#' may be editable by text inputs and select inputs.
#'
#' @param data a data frame.
#' @param editType A list containing the types of the column editors. The list
#' must be named by the corresponding column name. Available options are 'text'
#' for a text input element and 'select' for a select input element.
#' @param editAttribs A list containing the options of the column editor elements.
#' The list must be named by the corresponding column name.
#' In case of a text input, the option itself must be a list containing the entry
#' placeholder, which defines the placeholder of the textinput.
#' In case of a select input, the option itself must be a list containing the vector
#' named options, which defines the available options of the select input.
#' @param rownames Show rownames.
#' @param checkboxSelect Select rows using checkboxes.
#' @param callback String containing Javascript code to be called during init.
#' @param ... Other arguments passed to the DataTable() constructor in Javascript.
#'
#' @seealso editableOutput
#' @export
editable <- function(data, editType = NULL, editAttribs = NULL, rownames = F, checkboxSelect = F, callback = "", ...) {
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
  if (!is.null(editType) && !is.null(editAttribs)) {
    colNums = as.character(unname(unlist(lapply(names(editType), function(name) { # Schleife ueber alle bearbeitbaren Spalten
      return(which(names(data) == name) - 1) # Index der bearbeitbaren Spalten zurueckgeben
    }))))
    names(editType) = colNums # Namen der bearbeitbaren Spalten in Spaltenindex aendern
    names(editAttribs) = colNums # Namen der Spaltenattribute in Spaltenindex aendern
    callback = paste0(callback, buildTableInputs(editType, editAttribs)) # Callback formatieren
  }

  return(list(data = data, options = options, callback = callback))
}

#' Render an HTML table widget using the DataTables library
#'
#' This function renders an HTML widget to display a data frame
#' using the JavaScript library DataTables. The resulting table
#' may be editable by text inputs and select inputs.
#'
#' @param expr an expression to create a table widget (normally via editable()),
#' or a data frame to be passed to editable() to create a table widget.
#' @param env The environment in which to evaluate expr.
#' @param quoted Is expr a quoted expression (with quote())?
#' This is useful if you want to save an expression in a variable.
#' @param ... ignored when expr returns a table widget, and passed as
#' additional arguments to editable() when expr returns a data frame
#'
#' @seealso editable
#' @export
renderEditable <- function(expr, env = parent.frame(), quoted = F, ...) {
  if (class(expr) == "data.frame") {
    json = do.call(editable, c(list(data = expr), list(...)))
  } else {
    json = exprToFunction(expr, env, quoted)()
  }

  function() {
    jsonlite::toJSON(json, auto_unbox = T)
  }
}
