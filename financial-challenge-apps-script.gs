// Hoja: Extensiones > Apps Script. Implementar > Administrar implementaciones > Nueva versión.
var ENCABEZADOS = ['Fecha y hora','Apellidos y nombres','DNI','Teléfono','Carrera','Ciclo','Nivel de Excel','Estado'];
var CUPOS = 25;   // inscritos confirmados
var ESPERA = 5;   // lista de espera adicional

function inscritos(hoja) { return Math.max(hoja.getLastRow() - 1, 0); }
function estadoCupos(n) {
  return { inscritos: n, quedan: Math.max(CUPOS - n, 0), espera: Math.max(CUPOS + ESPERA - Math.max(n, CUPOS), 0), cupos: CUPOS, maxEspera: ESPERA };
}
function doGet() {
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  return salida(estadoCupos(inscritos(hoja)));
}
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (hoja.getLastRow() === 0) {
      hoja.appendRow(ENCABEZADOS);
      hoja.getRange(1, 1, 1, ENCABEZADOS.length).setFontWeight('bold').setBackground('#0e4a38').setFontColor('#ffffff');
      hoja.setFrozenRows(1);
    }
    var p = e.parameter;
    var dni = String(p.dni || '').trim();
    var n = inscritos(hoja);
    if (n > 0) {
      var datos = hoja.getRange(2, 3, n, 1).getDisplayValues();
      for (var i = 0; i < datos.length; i++) {
        if (datos[i][0] === dni) return salida({ ok: false, duplicado: true });
      }
    }
    if (n >= CUPOS + ESPERA) return salida({ ok: false, lleno: true });
    var estado = n < CUPOS ? 'Inscrito' : 'En espera';
    hoja.appendRow([new Date(), p.nombre, "'" + dni, "'" + p.celular, p.carrera, p.ciclo, p.excel, estado]);
    var r = estadoCupos(n + 1); r.ok = true; r.estado = estado;
    return salida(r);
  } finally {
    lock.releaseLock();
  }
}
function salida(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
