// Pegar en la hoja de Google: Extensiones > Apps Script. Luego Implementar > Nueva implementación
// > Aplicación web > Ejecutar como: yo / Acceso: cualquier persona. Copiar la URL /exec en financial-challenge.html (APPS_SCRIPT_URL).
var ENCABEZADOS = ['Fecha y hora','Nombres y apellidos','DNI','Código de estudiante','Correo','Celular','Carrera','Ciclo','Experiencia en Excel'];
function doPost(e) {
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (hoja.getLastRow() === 0) { hoja.appendRow(ENCABEZADOS); hoja.getRange(1,1,1,ENCABEZADOS.length).setFontWeight('bold').setBackground('#071767').setFontColor('#fff'); hoja.setFrozenRows(1); }
    var p = e.parameter;
    var dni = String(p.dni || '').trim();
    var datos = hoja.getRange(2,3,Math.max(hoja.getLastRow()-1,1),1).getDisplayValues();
    for (var i=0;i<datos.length;i++) if (datos[i][0] === dni) return salida({ok:false, duplicado:true});
    hoja.appendRow([new Date(), p.nombre, "'"+dni, p.codigo, p.correo, "'"+p.celular, p.carrera, p.ciclo, p.excel]);
    return salida({ok:true});
  } finally { lock.releaseLock(); }
}
function salida(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
