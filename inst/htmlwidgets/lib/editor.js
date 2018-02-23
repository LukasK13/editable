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

// Text Input erstellen
function createTextInput(id, value, placeholder) {
  var input = document.createElement('INPUT'); // Text Input erzeugen
  input.setAttribute('type', 'text'); // Typ Attribut setzen
  input.setAttribute('value', value); // Wert setzen
  input.setAttribute('id', id + '_textInput'); // Id definieren
  input.setAttribute('placeholder', placeholder); // Platzhalter definieren
  input.setAttribute("autofocus", true); // Element hat autofocus
  return input;
}

function getEditorColumn(table) {
  var column = table.column(0).header();
  while (column !== null && !column.hasAttribute("data-editorselected"))
    column = column.nextSibling;
  if (column === null)
    return {column: -1, row: -1};
  else
    return {column: parseInt(column.getAttribute("data-editorcolnum")), row: parseInt(column.getAttribute("data-editorselected"))};
}

function saveEditorInput(table, id, type, oldCell) {
  var newVal = null;
  if (type == "text") {
    if (document.getElementById(id + '_textInput').value !=
        document.getElementById(id + '_textInput').getAttribute('value')) { // Wert wurde veraendert
      newVal = document.getElementById(id + '_textInput').value;
    }
    oldCell.data(document.getElementById(id + '_textInput').value); // Eingaben in Zelle speichern
  } else if (type == "select") {
    if (document.getElementById(id + '_selectInput').value !=
        document.getElementById(id + '_selectInput').getAttribute('initialSelected')) { // Wert wurde veraendert
      newVal = document.getElementById(id + '_selectInput').value;
    }
    oldCell.data(document.getElementById(id + '_selectInput').value); // Eingaben in Zelle speichern
  }
  if (newVal !== null && typeof Shiny.onInputChange !== "undefined") {
    Shiny.onInputChange(id + '_cellEdited', {column: oldCell.index().column, row: (oldCell.index().row + table.page.info().start),
      newValue: newVal}); // Shiny Input aktualisieren
  }
}

// Text Input in Spalte erzeugen
function registerColumnEditor(table, colNumber) {
  var id = table.table().node().parentElement.parentElement.id;
  var options = JSON.parse(table.column(colNumber).header().getAttribute("data-editoroptions"));
  var type = table.column(colNumber).header().getAttribute("data-editor");
  
  table.on('click.dt', 'td', function () { // Zelle wurde angeklickt
    var cell = table.cell(this); // Angeklickt Zelle finden
    var input;
    if (type == "text") {
      input = createTextInput(id, cell.data(), options.placeholder); // Text Input Element erzeugen
    } else if (type == "select") {
      input = createSelectInput(id + '_selectInput', options.options, cell.data()); // Select Input Element erzeugen
    }
    
    var clickedOld = getEditorColumn(table);
    if (cell.index().column != clickedOld.column || cell.index().row != clickedOld.row) { // kein Doppelklick
      if (clickedOld.column == colNumber) { // Uspruenglich angeklickte Zelle ist in dieser Spalte
        var oldCell = table.cell(clickedOld.row, clickedOld.column); // Alte Zelle finden
        saveEditorInput(table, id, type, oldCell);
        table.column(clickedOld.column).header().removeAttribute("data-editorselected"); // angeklickte Zeile zuruecksetzen
      }
      
      if (cell.index().column == colNumber) { // Neu angeklickte Zelle ist in dieser Spalte
        window.setTimeout(function() { // Verzoegrung um vorheriges Entfernen zu ermoeglichen
          cell.data(input.outerHTML); // Text Input in Zelle darstellen
          table.column(colNumber).header().setAttribute("data-editorselected", cell.index().row); // Angeklickte Zeile speichern
        }, 10);
      }
    }
  });
  $(document).on('keydown', function(ev) { // Taste wurde geklickt
    var clickedOld = getEditorColumn(table);
    if (clickedOld.column == colNumber) { // Bereits angeklickte Zelle ist in dieser Spalte
      var oldCell = table.cell(clickedOld.row, clickedOld.column); // Alte Zelle finden
      if (ev.keyCode == 13) { // Enter
        saveEditorInput(table, id, type, oldCell);
        table.column(clickedOld.column).header().removeAttribute("data-editorselected"); // angeklickte Zeile zuruecksetzen
      }
      if (ev.keyCode == 27) { // Escape
        if (type == "text") {
          oldCell.data(document.getElementById(id + '_textInput').getAttribute('value')); // Eingaben in Zelle zuruecksetzen
        } else if (type == "select") {
          oldCell.data(document.getElementById(id + '_selectInput').getAttribute('initialSelected')); // Eingaben in Zelle zuruecksetzen
        }
        table.column(clickedOld.column).header().removeAttribute("data-editorselected"); // angeklickte Zeile zuruecksetzen
      }
      if (ev.keyCode == 9) { // Tabulator
        // TODO: naechste Zeile in Sortierung
        var column = table.column(colNumber).header();
        do {
          column = column.nextSibling;
        }
        while (column !== null && !column.hasAttribute("data-editor"));
        if (column === null) {
          column = table.column(0).header();
          while (!column.hasAttribute("data-editor"))
            column = column.nextSibling;
        }
        nextColNumber = parseInt(column.getAttribute("data-editorcolnum"));
        if (nextColNumber > colNumber) { // Es exisitiert eine nachfolgende Spalte in dieser Zeile
          ev.preventDefault(); // Browser Tab springen unterbinden
          window.setTimeout(function(){table.cell(clickedOld.row, nextColNumber).node().click();}, 10); // Naechste Zelle mit verzoegerung anklicken
        } else { // Es exisitiert eine nachfolgende Spalte in der naechsten Zeile
          var rows = table.rows({order: "current", page: "current", search: "applied"}).indexes();
          var i = 0;
          while (i < rows.length && rows[i] != clickedOld.row)
            i++;
          if (i < (rows.length - 1)) {
            ev.preventDefault(); // Browser Tab springen unterbinden
            window.setTimeout(function(){table.cell(rows[i+1], nextColNumber).node().click();}, 10); // Naechste Zelle mit verzoegerung anklicken
          }
        }
      }
    }
  });
  $(document).on('click', function(event) { // Mausklick im Dokument
    var clickedOld = getEditorColumn(table);
    if(((event.target.tagName != "TD" && event.target.parentElement.tagName != "TD") || $(event.target).closest('#' + id).length === 0)
       && clickedOld.column == colNumber) { // Klick ist ausserhalb der Tabelle
      saveEditorInput(table, id, type, table.cell(clickedOld.row, clickedOld.column)); // Eingaben uebernehmen
      table.column(clickedOld.column).header().removeAttribute("data-editorselected"); // angeklickte Zeile zuruecksetzen
    }
  });
}

// Builds the HTML Table out of data.
function buildHtmlTable(el, data) {
  var columns = [];
  var header = el.createTHead();
  var row = header.insertRow(0);
  var dataRow = data[0];
  for (var column in dataRow) {
    row.appendChild(document.createElement('th'));
    row.lastChild.innerHTML = column;
    columns.push(column);
  }
  header.append(row);
  el.append(header);
  
  var body = document.createElement("tbody");
  for (var i = 0; i < data.length; i++) {
    row = body.insertRow(-1);
    for (var colIndex = 0; colIndex < columns.length; colIndex++) {
      var cellValue = data[i][columns[colIndex]];
      if (cellValue === null)
        cellValue = "";
      var cell = row.insertCell(-1);
      cell.innerHTML = cellValue;
    }
    body.append(row);
  }
  el.append(body);
}

$.fn.dataTable.Api.register('setData()', function(data, redraw = false) {
  this.clear();
  function jsonToArray(el) {return el}
  for (var i = 0; i< data.length; i++) {
    this.row.add($.map(data[i], jsonToArray));
  }
  this.draw(redraw);
  return this;
});

$.fn.dataTable.Api.register('column().editable()', function(editorType, options) {
  var table = this;
  var id = table.table().node().parentElement.id;
  var index = this.index();
  table.column(index).header().setAttribute("data-editor", editorType);
  table.column(index).header().setAttribute("data-editorcolnum", index);
  table.column(index).header().setAttribute("data-editoroptions", JSON.stringify(options));
  registerColumnEditor(table, index);
  return this;
});

$(document).on( 'init.dt.dtr', function (e, settings) {
  var table = $(e.target).DataTable();
  var id = table.table().node().id;
  var options = table.init();
  if (options.editable) {
    for (var key in options.editType) {
      table.column(key).editable(options.editType[key], options.editAttribs[key]);
    }
  }
});