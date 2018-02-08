# editable
A bare R wrapper to the DataTables library including an open source cell editor. All other arguments are passed to the DataTable library according to: https://datatables.net/reference/option/

Install by executing `devtools::install_github("LukasK13/editable")` in the R console.

Example usage:

```R
library(shiny)
library(editable)

ui <- fluidPage(
  titlePanel("Editable Table"),
  editableOutput("Table")
)

server <- function(input, output) {
  output$Table = renderEditable(iris, editType = list(Sepal.Length = "text", Sepal.Width = "text", Petal.Length = "text",
                                                                 Petal.Width = "text", Species = "select"),
                                editAttribs = list(Sepal.Length = list(placeholder = "Length"), Sepal.Width = list(placeholder = "Width"),
                                                   Petal.Length = list(placeholder = "Length"), Petal.Width = list(placeholder = "Width"),
                                                   Species = list(options = c("setosa", "versicolor", "virginica"))),
                                order = list(), rownames = F, checkboxSelect = T)
  
  observeEvent(input$Table_selection, {
    print(input$Table_selection)
  })
  
  observeEvent(input$Table_cellEdited, {
    print(input$Table_cellEdited)
  })
}

shinyApp(ui = ui, server = server)
```
