// Select input element erstellen
function createSelectInput(id, options, selected = options[0]) {
  var selectList = document.createElement("select"); // Select element erzeugen
  selectList.id = id; // Id Attribut setzen
  selectList.setAttribute("initialSelected", selected); // Urspruenglich ausgewaehlte Option festlegen
  selectList.setAttribute("autofocus", true); // Element bekommt automatisch Fokus
  for (var i = 0; i < options.length; i++) { // Schleife ueber alle Optionen
    var option = document.createElement("option"); // Optionselement erzeugen
    option.value = options[i]; // Optionswert setzen
    option.text = options[i]; // Optionstext setzen
    if (options[i] == selected) { // Options ist ausgewaehlt
      option.setAttribute("selected", true); // Option auswaehlen
    }
    selectList.appendChild(option); // Option zum select Element hinzufuegen
  }
  return selectList; // Select Element zurueckgeben
}

// Text Input in Spalte erzeugen
function buildColumnTextInput(table, id, colNumber, nextColNumber, placeholder) {
  rowClickedVar = id + '_rowClicked'; // Name der Variable der angeklickten Zeile
  colClickedVar = id + '_colClicked'; // Name der Variable der angeklickten Spalte
  if (typeof dataTableEditorClicked === 'undefined') { // Editor Tabelle ist noch nicht vorhanden
    window.dataTableEditorClicked = []; // Editor Tabelle erzeugen
  }
  dataTableEditorClicked[rowClickedVar] = -1; // Angeklickte Zeile initialisieren
  dataTableEditorClicked[colClickedVar] = -1; // Angeklickte Spalte inintialisieren
  table.on('click.dt', 'td', function () { // Zelle wurde angeklickt
    var cell = table.cell(this); // Angeklickt Zelle finden
    var input = document.createElement('INPUT'); // Text Input erzeugen
    input.setAttribute('type', 'text'); // Typ Attribut setzen
    input.setAttribute('value', cell.data()); // Wert setzen
    input.setAttribute('id', id + '_textInput'); // Id definieren
    input.setAttribute('placeholder', placeholder); // Platzhalter definieren
    input.setAttribute("autofocus", true); // Element hat autofocus
    
    if (cell.index().column != dataTableEditorClicked[colClickedVar] || cell.index().row != dataTableEditorClicked[rowClickedVar]) { // kein Doppelklick
      if (dataTableEditorClicked[colClickedVar] == colNumber) { // Uspruenglich angeklickte Zelle ist in dieser Spalte
        var oldCell = table.cell(dataTableEditorClicked[rowClickedVar], dataTableEditorClicked[colClickedVar]); // Alte Zelle
        if (document.getElementById(id + '_textInput').value != document.getElementById(id + '_textInput').getAttribute('value')) { // Wert wurde veraendert
          Shiny.onInputChange(id + '_cellEdited', {column: oldCell.index().column, row: (oldCell.index().row + table.page.info().start),
                                                   newVal: document.getElementById(id + '_textInput').value, update: false}); // Shiny Input aktualisieren
        }
        oldCell.data(document.getElementById(id + '_textInput').value); // Eingaben in Zelle speichern
        dataTableEditorClicked[rowClickedVar] = -1; // angeklickte Zeile zuruecksetzen
        dataTableEditorClicked[colClickedVar] = -1; // angelickte Spalte zuruecksetzen
      }
      
      if (cell.index().column == colNumber) { // Neu angeklickte Zelle ist in dieser Spalte
        window.setTimeout(function(){ // Verzoegrung um vorheriges Entfernen zu ermoeglichen
          cell.data(input.outerHTML); // Text Input in Zelle darstellen
          dataTableEditorClicked[rowClickedVar] = cell.index().row; // Angeklickte Zeile speichern
          dataTableEditorClicked[colClickedVar] = cell.index().column; // Angeklickte Spalte speichern
        }, 10);
      }
    }
  });
  $(document).on('keydown', function(ev) { // Taste wurde geklickt
    if (dataTableEditorClicked[colClickedVar] == colNumber) { // Bereits angeklickte Zelle ist in dieser Spalte
      var cell = table.cell(dataTableEditorClicked[rowClickedVar], dataTableEditorClicked[colClickedVar]); // Zell Element finden
      if (ev.keyCode == 13) { // Enter
        if (document.getElementById(id + '_textInput').value != document.getElementById(id + '_textInput').getAttribute('value')) { // Wert wurde veraendert
          Shiny.onInputChange(id + '_cellEdited', {column: cell.index().column, row: (cell.index().row + table.page.info().start),
                                                   newVal: document.getElementById(id + '_textInput').value, update: true}); // Shiny Input aktualisieren
        }
        cell.data(document.getElementById(id + '_textInput').value); // Eingaben in Zelle speichern
        dataTableEditorClicked[rowClickedVar] = -1; // angeklickte Zeile zuruecksetzen
        dataTableEditorClicked[colClickedVar] = -1; // angeklickte Spalte zuruecksetzen
      }
      if (ev.keyCode == 27) { // Escape
        cell.data(document.getElementById(id + '_textInput').getAttribute('value')); // Eingaben in Zelle zuruecksetzen
        dataTableEditorClicked[rowClickedVar] = -1; // angeklickte Zeile zuruecksetzen
        dataTableEditorClicked[colClickedVar] = -1; // angeklickte Spalte zuruecksetzen
      }
      if (ev.keyCode == 9) { // Tabulator
        if (nextColNumber > colNumber) { // Es exisitiert eine nachfolgende Spalte in dieser Zeile
          ev.preventDefault(); // Browser Tab springen unterbinden
          window.setTimeout(function(){table.cell(dataTableEditorClicked[rowClickedVar], nextColNumber).node().click();}, 10); // Naechste Zelle mit verzoegerung anklicken
        } else if (table.column(nextColNumber).data().length > (dataTableEditorClicked[rowClickedVar] + 1)) { // Es exisitiert eine nachfolgende Spalte in der naechsten Zeile
          ev.preventDefault(); // Browser Tab springen unterbinden
          window.setTimeout(function(){table.cell((dataTableEditorClicked[rowClickedVar] + 1), nextColNumber).node().click();}, 10); // Naechste Zelle mit verzoegerung anklicken
        }
      }
    }
  });
  $(document).on('click', function(event) { // Mausklick im Dokument
    if(((event.target.tagName != "TD" && event.target.parentElement.tagName != "TD") || $(event.target).closest('#' + id).length === 0)
       && dataTableEditorClicked[colClickedVar] == colNumber) { // Klick ist ausserhalb der Tabelle
      var cell = table.cell(dataTableEditorClicked[rowClickedVar], dataTableEditorClicked[colClickedVar]); // Angeklickte Zelle finden
      if (document.getElementById(id + '_textInput').value != document.getElementById(id + '_textInput').getAttribute('value')) { // Wert wurde veraendert
        Shiny.onInputChange(id + '_cellEdited', {column: cell.index().column, row: (cell.index().row + table.page.info().start),
                                                 newVal: document.getElementById(id + '_textInput').value, update: true}); // Shiny Input aktualisieren
      }
      cell.data(document.getElementById(id + '_textInput').value); // Eingaben in Zelle speichern
      dataTableEditorClicked[rowClickedVar] = -1; // angeklickte Zeile zuruecksetzen
      dataTableEditorClicked[colClickedVar] = -1; // angeklickte Spalte zuruecksetzen
    }
  });
}

function buildColumnSelectInput(table, id, colNumber, nextColNumber, options) {
  rowClickedVar = id + '_rowClicked'; // Name der Variable der angeklickten Zeile
  colClickedVar = id + '_colClicked'; // Name der Variable der angeklickten Spalte
  if (typeof dataTableEditorClicked === 'undefined') { // Editor Tabelle ist noch nicht vorhanden
    window.dataTableEditorClicked = []; // Editor Tabelle erzeugen
  }
  dataTableEditorClicked[rowClickedVar] = -1; // angeklickte Zeile zuruecksetzen
  dataTableEditorClicked[colClickedVar] = -1; // angeklickte Spalte zuruecksetzen
  
  table.on('click.dt', 'td', function () { // Zelle wurde angeklickt
    var cell = table.cell(this); // Angeklickte Zelle finden
    var input = createSelectInput(id + '_selectInput', options, cell.data()); // Select Input Element erzeugen
    if (cell.index().column != dataTableEditorClicked[colClickedVar] || cell.index().row != dataTableEditorClicked[rowClickedVar]) { // Kein Doppelklick
      if (dataTableEditorClicked[colClickedVar] == colNumber) { // Uspruenglich angeklickte Zelle ist in dieser Spalte
        var oldCell = table.cell(dataTableEditorClicked[rowClickedVar], dataTableEditorClicked[colClickedVar]); // Urpsruenglich angeklickte Zelle finden
        if (document.getElementById(id + '_selectInput').value !=
              document.getElementById(id + '_selectInput').getAttribute('initialSelected')) { // Wert wurde veraendert
          Shiny.onInputChange(id + '_cellEdited', {column: oldCell.index().column, row: (oldCell.index().row + table.page.info().start),
                                                   newVal: document.getElementById(id + '_selectInput').value, update: false}); // Shiny Input aktualisieren
        }
        oldCell.data(document.getElementById(id + '_selectInput').value); // Eingaben in Zelle speichern
        dataTableEditorClicked[rowClickedVar] = -1; // angeklickte Zeile zuruecksetzen
        dataTableEditorClicked[colClickedVar] = -1; // angeklickte Spalte zuruecksetzen
      }
    
      if (cell.index().column == colNumber) { // Neu angeklickte Zelle ist in dieser Spalte
        window.setTimeout(function(){ // Verzoegrung um vorheriges Entfernen zu ermoeglichen
          cell.data(input.outerHTML); // Select Input in Zelle darstellen
          dataTableEditorClicked[rowClickedVar] = cell.index().row; // Angeklickte Zeile speichern
          dataTableEditorClicked[colClickedVar] = cell.index().column; // Angeklickte Spalte speichern
        }, 10);
      }
    }
  });
  $(document).on('keydown', function(ev) { // Taste wurde geklickt
    if (dataTableEditorClicked[colClickedVar] == colNumber) { // Bereits angeklickte Zelle ist in dieser Spalte
      var cell = table.cell(dataTableEditorClicked[rowClickedVar], dataTableEditorClicked[colClickedVar]); // Zell Element finden
      if (ev.keyCode == 13) { // Enter
        if (document.getElementById(id + '_selectInput').value != document.getElementById(id + '_selectInput').getAttribute('initialSelected')) { // Wert wurde veraendert
          Shiny.onInputChange(id + '_cellEdited', {column: cell.index().column, row: (cell.index().row + table.page.info().start),
                                                   newVal: document.getElementById(id + '_selectInput').value, update: true}); // Shiny Input aktualisieren
        }
        cell.data(document.getElementById(id + '_selectInput').value); // Eingaben in Zelle speichern
        dataTableEditorClicked[rowClickedVar] = -1; // angeklickte Zeile zuruecksetzen
        dataTableEditorClicked[colClickedVar] = -1; // angeklickte Spalte zuruecksetzen
      }
      if (ev.keyCode == 27) { // Escape
        cell.data(document.getElementById(id + '_selectInput').getAttribute('initialSelected')); // Eingaben in Zelle zuruecksetzen
        dataTableEditorClicked[rowClickedVar] = -1; // angeklickte Zeile zuruecksetzen
        dataTableEditorClicked[colClickedVar] = -1; // angeklickte Spalte zuruecksetzen
      }
      if (ev.keyCode == 9) { // Tabulator
        if (nextColNumber > colNumber) { // Es exisitiert eine nachfolgende Spalte in dieser Zeile
          ev.preventDefault(); // Browser Tab springen unterbinden
          window.setTimeout(function(){table.cell(dataTableEditorClicked[rowClickedVar], nextColNumber).node().click();}, 10); // Naechste Zelle mit verzoegerung anklicken
        } else if (table.column(nextColNumber).data().length > (dataTableEditorClicked[rowClickedVar] + 1)) { // Es exisitiert eine nachfolgende Spalte in der naechsten Zeile
          ev.preventDefault(); // Browser Tab springen unterbinden
          window.setTimeout(function(){table.cell((dataTableEditorClicked[rowClickedVar] + 1), nextColNumber).node().click();}, 10); // Naechste Zelle mit verzoegerung anklicken
        }
      }
    }
  });
  $(document).on('click', function(event) { // Mausklick im Dokument
    if(((event.target.tagName != "TD" && event.target.parentElement.tagName != "TD") || $(event.target).closest('#' + id).length === 0)
       && dataTableEditorClicked[colClickedVar] == colNumber) { // Klick ist ausserhalb der Tabelle
      var cell = table.cell(dataTableEditorClicked[rowClickedVar], dataTableEditorClicked[colClickedVar]); // Angeklickte Zelle finden
      if (document.getElementById(id + '_selectInput').value != document.getElementById(id + '_selectInput').getAttribute('initialSelected')) { // Wert wurde veraendert
        Shiny.onInputChange(id + '_cellEdited', {column: cell.index().column, row: (cell.index().row + table.page.info().start),
                                                   newVal: document.getElementById(id + '_selectInput').value, update: true}); // Shiny Input aktualisieren
      }
      cell.data(document.getElementById(id + '_selectInput').value); // Eingaben in Zelle speichern
      dataTableEditorClicked[rowClickedVar] = -1; // angeklickte Zeile zuruecksetzen
      dataTableEditorClicked[colClickedVar] = -1; // angeklickte Spalte zuruecksetzen
    }
  });
}

// Builds the HTML Table out of data.
function buildHtmlTable(selector, data) {
  var columns = addAllColumnHeaders(data, selector);
  for (var i = 0; i < data.length; i++) {
    var row = $('<tr/>');
    for (var colIndex = 0; colIndex < columns.length; colIndex++) {
      var cellValue = data[i][columns[colIndex]];
      if (cellValue === null) cellValue = "";
      row.append($('<td/>').html(cellValue));
    }
    $(selector).append(row);
  }
}

// Adds a header row to the table and returns the set of columns.
// Need to do union of keys from all records as some records may not contain
// all records.
function addAllColumnHeaders(data, selector) {
  var columnSet = [];
  var header = $('<thead/>');
  var headerTr = $('<tr>');

  //for (var i = 0; i < data.length; i++) {
  //var rowHash = data[i];
  var row = data[0];
  for (var key in row) {
    if ($.inArray(key, columnSet) == -1) {
      columnSet.push(key);
      headerTr.append($('<th/>').html(key));
    }
  }
  //}
  header.append(headerTr);
  $(selector).append(header);

  return columnSet;
}

var newBinding = new Shiny.OutputBinding();
$.extend(newBinding, {
  find: function(scope) {
    return $(scope).find(".editableOutput");
  },
  getId: function(el) {
    return el.children[0].id;
  },
  renderError: function(el,error) {
    console.log("Error");
  },
  clearError: function(el) {
    console.log("Error cleared");
  },
  renderValue: function(el,data) {
    //alert(JSON.stringify(data.options));
    var id = el.children[0].id; // get table id
    buildHtmlTable("#" + id, data.data); // convert JSON dataframe to HTML elements
    var table = $("#" + id).DataTable(data.options); // Initialize DataTable
    eval(data.callback);
    
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
      Shiny.onInputChange(id + "_selection", selection); // write shiny input
    });
  }
});

Shiny.outputBindings.register(newBinding, "editableOutputBinding");