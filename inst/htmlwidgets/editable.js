HTMLWidgets.widget({
  name: 'editable',
  type: 'output',

  factory: function(el, width, height) {
    var table; // contains the table instance

    return {
      renderValue: function(x) {
        if ($(el).find("table").length > 0) {
          $(el).find("table").DataTable().destroy();
          el.innerHTML = "";
        }
        el.appendChild(document.createElement('table'));
        el.firstChild.setAttribute("class", "display");
        buildHtmlTable(el.firstChild, x.data);
        table = $(el).find('table').DataTable(x.options);
        $(el).data('datatable', table);
        table.on('select deselect', function (e, dt, type, indexes) { // selection or deselection in table
          var selection = {"row":[], "column":[]}; // initialize selection object
          var i;
          if (table.select.items() == "cell") { // selection target is cell
            for (i = 0; i < indexes.length; i++) { // loop over all selected elements
              selection.row[i] = indexes[i].row; // copy row index to selection object
              selection.column[i] = indexes[i].column; // copy column index to selection object
            }
          } else if (table.select.items() == "row") { // selection target is row
            rows = table.rows('.selected').indexes(); // get selected rows
            for (i = 0; i < rows.length; i++) { // loop over all selected elements
              selection.row[i] = rows[i]; // copy row index to selection object
            }
          } else if (table.select.items() == "column") { // selection target is column
            cols = table.columns('.selected').indexes(); // get selected columns
            for (i = 0; i < cols.length; i++) { // loop over all selected elements
              selection.column[i] = cols[i]; // copy column index to selection object
            }
          }
          if (typeof Shiny.onInputChange !== "undefined")
            Shiny.onInputChange(table.table().node().parentElement.parentElement.id + "_selection", selection); // write shiny input
        });
        var methods = {};
        methods.setData = function(data, redraw) {
          table.setData(message.data, message.redraw);
        }
      },

      resize: function(width, height) {
        // TODO: code to re-render the widget with a new size
      }
    };
  }
});

Shiny.addCustomMessageHandler('editable-calls', function(data) {
  var id = data.id;
  var el = document.getElementById(id);
  var table = el ? $(el).data('datatable') : null;
  if (!table) {
    console.log("Couldn't find table with id " + id);
    return;
  }

  var methods = table.shinyMethods, call = data.call;
  if (methods[call.method]) {
    methods[call.method].apply(table, call.args);
  } else {
    console.log("Unknown method " + call.method);
  }
});

Shiny.addCustomMessageHandler("editable_getData", function(message) {
  var table = $("#" + message.id).find("table").DataTable();
  var data = table.rows().data();
  var header = table.columns().header();
  var colnames = [];
  for (var i = 0; i < header.length; i++) {
    colnames[i] = header[i].getAttribute("aria-label");
  }
  Shiny.onInputChange(message.id + "_data", {data: data, colnames: colnames, nrow: data.length});
});

Shiny.addCustomMessageHandler("editable_setData", function(message) {
  var table = $("#" + message.id).find("table").DataTable();
  table.setData(message.data, message.redraw);
});

Shiny.addCustomMessageHandler("editable_removeRow", function(message) {
  var table = $("#" + message.id).find("table").DataTable();
  table.rows(message.rowNum).remove().draw();
});

Shiny.addCustomMessageHandler("editable_appendRow", function(message) {
  var table = $("#" + message.id).find("table").DataTable();
  function jsonToArray(el) {return el}
  for (var i = 0; i< message.rowData.length; i++) {
    table.row.add($.map(message.rowData[i], jsonToArray));
  }
  table.draw();
});