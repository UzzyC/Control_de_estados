/* =========================================================
   Control de Estados — lógica
   =========================================================

   >>> CUADROS VERDES DEL CONTROL EXITOSO <<<
   Para agregar un recuadro nuevo, agregá un objeto a CUADROS_EXITO:

     { titulo: 'NOMBRE DEL CUADRO', campo: 'nombreCampo' }
        -> toma el valor del campo de la guía (definilo en GUIAS)

     { titulo: 'NOMBRE DEL CUADRO', valor: 'VALOR FIJO' }
        -> muestra siempre ese valor

     destacado: true  -> el cuadro ocupa todo el ancho (fila propia,
                          como FECHA REPACTACION). Sin esa marca, los
                          cuadros se acomodan de a 4 por fila.
   ========================================================= */

var DEFAULT_CUADROS_EXITO = [
  { titulo: 'FECHA REPACTACION', campo: 'fechaRepactacion', destacado: true, tipoCampo: 'fecha' },
  { titulo: 'FECHA PACTADA', campo: 'fechaPactada', tipoCampo: 'fecha' },
  { titulo: 'ZONA DESTINO', campo: 'zonaDestino', tipoCampo: 'lista', opciones: 'GBA, CABA, INTERIOR' },
  { titulo: 'SUBZONA DESTINO', campo: 'subzonaDestino', tipoCampo: 'texto' },
  { titulo: 'CORDON DESTINO', campo: 'cordonDestino', tipoCampo: 'texto' },
  { titulo: 'NUEVO CUADRO', campo: 'nuevoCampo', tipoCampo: 'texto' }
];

var CUADROS_EXITO = JSON.parse(localStorage.getItem('CUADROS_EXITO')) || DEFAULT_CUADROS_EXITO;

/* Estado que valida el control (el del combo "Estado") */
var ESTADO_CONTROL_DEFAULT = 'EPR';

/* =========================================================
   Listados de guías internas (simulación)
   ========================================================= */

var DEFAULT_GUIAS_ACEPTADAS = {
  '1822483': {
    estado: 'EPR',
    estadoNombre: 'ESPERANDO PROGRAMACION',
    fechaRepactacion: '11/11/2030',
    fechaPactada: '14/09/2026',
    zonaDestino: 'GBA',
    subzonaDestino: 'GBA OESTE 2',
    cordonDestino: 'AZUL'
  }
};

var DEFAULT_GUIAS_RECHAZADAS = {
  '1524869': {
    estado: 'ENT',
    estadoNombre: 'ENTREGADA'
  }
};

var GUIAS_ACEPTADAS = JSON.parse(localStorage.getItem('GUIAS_ACEPTADAS')) || DEFAULT_GUIAS_ACEPTADAS;
var GUIAS_RECHAZADAS = JSON.parse(localStorage.getItem('GUIAS_RECHAZADAS')) || DEFAULT_GUIAS_RECHAZADAS;
var HISTORIAL_ESCANEO = JSON.parse(localStorage.getItem('HISTORIAL_ESCANEO')) || [];

var sonidosActivados = localStorage.getItem('sonidosActivados') !== 'false'; // default true


/* ========================================================= */

var contadorExito = 0;
var contadorTotal = 0;

function renderCuadrosExito(guia) {
  var $cont = $('#cuadros_exito').empty();

  var destacados = CUADROS_EXITO.filter(function (c) { return c.destacado; });
  var normales = CUADROS_EXITO.filter(function (c) { return !c.destacado; });

  function valorDe(c) {
    if (c.valor !== undefined) return c.valor;
    var v = guia[c.campo];
    return (v === undefined || v === null || v === '') ? '—' : v;
  }

  function cuadroHtml(c) {
    return '<div class="col-lg-12 alert-success">' +
      '<h2><b>' + c.titulo + '</b></h2>' +
      '<h3><b>' + valorDe(c) + '</b></h3>' +
      '</div>';
  }

  // Destacados: fila completa cada uno
  destacados.forEach(function (c) {
    $cont.append(
      '<div class="row"><div class="col-lg-12" style="text-align:center">' +
      cuadroHtml(c) +
      '</div></div><br>'
    );
  });

  // Normales: de a 4 por fila (col-lg-3)
  for (var i = 0; i < normales.length; i += 4) {
    var $row = $('<div class="row"></div>');
    normales.slice(i, i + 4).forEach(function (c) {
      $row.append('<div class="col-lg-3">' + cuadroHtml(c) + '</div>');
    });
    $cont.append($row);
  }
}

function mostrarExito(guia) {
  $('#box_fallido').hide();
  renderCuadrosExito(guia);
  $('#box_exitoso').show();
  var audio = document.getElementById('audio_ok');
  if (audio.src && sonidosActivados) audio.play();
}

function mostrarFallido(mensaje) {
  $('#box_exitoso').hide();
  $('#mensaje_error').text(mensaje);
  $('#box_fallido').show();
  var audio = document.getElementById('audio_error');
  if (audio.src && sonidosActivados) audio.play();
}

function agregarAlHistorial(nroGuia, resultado) {
  var fecha = new Date();
  var hora = fecha.getHours().toString().padStart(2, '0') + ':' + fecha.getMinutes().toString().padStart(2, '0') + ':' + fecha.getSeconds().toString().padStart(2, '0');

  HISTORIAL_ESCANEO.unshift({
    hora: hora,
    timestamp: fecha.getTime(),
    guia: nroGuia,
    estadoControl: $('#estado_id').val() || ESTADO_CONTROL_DEFAULT,
    resultado: resultado
  });

  if (HISTORIAL_ESCANEO.length > 500) HISTORIAL_ESCANEO.pop(); // Limite de 500
  localStorage.setItem('HISTORIAL_ESCANEO', JSON.stringify(HISTORIAL_ESCANEO));
  renderHistorial();
}

function renderHistorial() {
  var tbody = $('#tablaHistorial tbody').empty();

  var tiempos = [];
  var totalMilisegundos = 0;
  var diferenciasValidas = 0;

  for (var i = 0; i < HISTORIAL_ESCANEO.length; i++) {
    var h = HISTORIAL_ESCANEO[i];
    var tr = '<tr>' +
      '<td>' + h.hora + '</td>' +
      '<td>' + h.guia + '</td>' +
      '<td>' + h.estadoControl + '</td>' +
      '<td>' + h.resultado + '</td>' +
      '</tr>';
    tbody.append(tr);

    // Calcular diferencias de tiempo con el escaneo anterior (que es el i+1 en el array)
    if (i + 1 < HISTORIAL_ESCANEO.length && h.timestamp && HISTORIAL_ESCANEO[i + 1].timestamp) {
      var diffMs = h.timestamp - HISTORIAL_ESCANEO[i + 1].timestamp;
      // Si la diferencia es menor a 15 minutos (900000 ms), lo contamos (asumimos que no hubo corte/descanso)
      if (diffMs < 900000 && diffMs >= 0) {
        totalMilisegundos += diffMs;
        diferenciasValidas++;
      }
    }
  }

  if (diferenciasValidas > 0) {
    var promMs = totalMilisegundos / diferenciasValidas;
    var promSegs = Math.round(promMs / 1000);
    $('#promedio_tiempo').text(promSegs + ' segundos');
    
    var totalSecs = Math.round(totalMilisegundos / 1000);
    var hStr = Math.floor(totalSecs / 3600);
    var mStr = Math.floor((totalSecs % 3600) / 60);
    var sStr = totalSecs % 60;
    var timeStr = (hStr > 0 ? hStr + 'h ' : '') + mStr + 'm ' + sStr + 's';
    $('#historial_tiempo_total').text(timeStr);
  } else {
    $('#promedio_tiempo').text('-');
    $('#historial_tiempo_total').text('-');
  }
  
  $('#historial_cantidad_guias').text(HISTORIAL_ESCANEO.length);
}

function controlarGuia(nroGuia) {
  nroGuia = $.trim(nroGuia);
  if (!nroGuia) return;

  var estadoControl = $('#estado_id').val() || ESTADO_CONTROL_DEFAULT;

  // Incrementar el contador total de guías escaneadas
  contadorTotal++;
  $('#contador_total').text(contadorTotal);
  $('#ultima_guia').text(nroGuia);

  var resultadoLog = '';

  // Buscar en el listado de aceptadas
  if (GUIAS_ACEPTADAS[nroGuia]) {
    var guia = GUIAS_ACEPTADAS[nroGuia];
    if (guia.estado === estadoControl) {
      contadorExito++;
      $('#contador_exito').text(contadorExito);
      mostrarExito(guia);
      resultadoLog = 'EXITO';
    } else {
      var msg = 'El estado actual es: ' + (guia.estadoNombre || guia.estado);
      mostrarFallido(msg);
      resultadoLog = 'FALLO - ' + msg;
    }
  }
  // Buscar en el listado de rechazadas
  else if (GUIAS_RECHAZADAS[nroGuia]) {
    var guia = GUIAS_RECHAZADAS[nroGuia];
    var msg = 'El estado actual es: ' + (guia.estadoNombre || guia.estado);
    mostrarFallido(msg);
    resultadoLog = 'FALLO - ' + msg;
  }
  // Si no está en ningún listado
  else {
    mostrarFallido('GUIA NO ENCONTRADA');
    resultadoLog = 'NO ENCONTRADA';
  }

  agregarAlHistorial(nroGuia, resultadoLog);
}

$(function () {
  // Inicialización UI
  actualizarBtnSonido();
  renderHistorial();

  // Escaneo: Enter en cualquiera de los campos con lector
  $('#guia_scan, #remito_scan, #agente_scan').on('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      controlarGuia($(this).val());
      $(this).val('').focus(); // mantener cursor
    }
  });

  // Búsqueda manual
  $('#guia_buscar').on('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      controlarGuia($(this).val());
    }
  });

  $('#guia_scan').focus();

  /* =========================================================
     LOGICA DEL MODAL DE CONFIGURACION
     ========================================================= */

  // Mostrar modal via el boton cog
  $('[data-target="#configModal"]').click(function (e) {
    e.preventDefault();
    $('#configModal').show();
    renderTablaCuadros();
    renderTablaGuias();
  });

  // Manejo de tabs en el modal
  $('#configTabs a').click(function (e) {
    e.preventDefault();
    $('#configTabs li').removeClass('active');
    $(this).parent().addClass('active');
    $('.tab-pane').hide();
    $($(this).data('target')).show();
  });

  // Mostrar/Ocultar campos dinámicos según clasificación
  $('#guiaClasificacion').on('change', function () {
    if ($(this).val() === 'ACEPTADA') {
      $('#contenedorCamposDinamicos').show();
    } else {
      $('#contenedorCamposDinamicos').hide();
    }
  });

});

// === CONFIGURACION DE CUADROS ===
function renderTablaCuadros() {
  var tbody = $('#tablaCuadros tbody').empty();
  CUADROS_EXITO.forEach(function (c, i) {
    var tr = '<tr>' +
      '<td>' + c.titulo + '</td>' +
      '<td>' + c.campo + '</td>' +
      '<td>' + (c.destacado ? 'Sí' : 'No') + '</td>' +
      '<td>' +
      '<button class="btn btn-xs btn-primary" onclick="editarCuadro(' + i + ')">Editar</button> ' +
      '<button class="btn btn-xs btn-danger" onclick="eliminarCuadro(' + i + ')">Eliminar</button>' +
      '</td>' +
      '</tr>';
    tbody.append(tr);
  });
}

function nuevoCuadro() {
  $('#cuadroIndex').val('');
  $('#cuadroTitulo').val('');
  $('#cuadroCampo').val('');
  $('#cuadroDestacado').prop('checked', false);
  $('#cuadroTipo').val('texto').trigger('change');
  $('#cuadroOpciones').val('');
  $('#formCuadro').show();
}

function editarCuadro(i) {
  var c = CUADROS_EXITO[i];
  $('#cuadroIndex').val(i);
  $('#cuadroTitulo').val(c.titulo);
  $('#cuadroCampo').val(c.campo);
  $('#cuadroDestacado').prop('checked', !!c.destacado);
  $('#cuadroTipo').val(c.tipoCampo || 'texto').trigger('change');
  $('#cuadroOpciones').val(c.opciones || '');
  $('#formCuadro').show();
}

function guardarCuadro() {
  var i = $('#cuadroIndex').val();
  var c = {
    titulo: $('#cuadroTitulo').val().toUpperCase(),
    campo: $('#cuadroCampo').val(),
    destacado: $('#cuadroDestacado').prop('checked'),
    tipoCampo: $('#cuadroTipo').val(),
    opciones: $('#cuadroOpciones').val()
  };
  if (i === '') CUADROS_EXITO.push(c);
  else CUADROS_EXITO[i] = c;

  localStorage.setItem('CUADROS_EXITO', JSON.stringify(CUADROS_EXITO));
  $('#formCuadro').hide();
  renderTablaCuadros();
}

function eliminarCuadro(i) {
  if (confirm('¿Seguro que querés eliminar este cuadro?')) {
    CUADROS_EXITO.splice(i, 1);
    localStorage.setItem('CUADROS_EXITO', JSON.stringify(CUADROS_EXITO));
    renderTablaCuadros();
  }
}

// === CONFIGURACION DE GUIAS ===
function renderTablaGuias() {
  var tbody = $('#tablaGuias tbody').empty();

  $.each(GUIAS_ACEPTADAS, function (nro, g) {
    tbody.append(trGuiaHtml(nro, g, 'ACEPTADA'));
  });
  $.each(GUIAS_RECHAZADAS, function (nro, g) {
    tbody.append(trGuiaHtml(nro, g, 'RECHAZADA'));
  });
}

function trGuiaHtml(nro, g, tipo) {
  var badge = tipo === 'ACEPTADA' ? '<span class="label label-success">Aceptada</span>' : '<span class="label label-danger">Rechazada</span>';
  return '<tr>' +
    '<td>' + nro + '</td>' +
    '<td>' + g.estado + '</td>' +
    '<td>' + g.estadoNombre + '</td>' +
    '<td>' + badge + '</td>' +
    '<td>' +
    '<button class="btn btn-xs btn-primary" onclick="editarGuia(\'' + nro + '\', \'' + tipo + '\')">Editar</button> ' +
    '<button class="btn btn-xs btn-danger" onclick="eliminarGuia(\'' + nro + '\', \'' + tipo + '\')">Eliminar</button>' +
    '</td>' +
    '</tr>';
}

function nuevaGuia() {
  $('#guiaNro').val('').prop('readonly', false);
  $('#guiaEstado').val('');
  $('#guiaEstadoNombre').val('');
  $('#guiaClasificacion').val('ACEPTADA').trigger('change');
  generarCamposDinamicos({});
  $('#formGuia').show();
}

function generarCamposDinamicos(extra) {
  var row = $('#camposDinamicosRow').empty();
  var camposAgregados = {};

  CUADROS_EXITO.forEach(function (c) {
    if (c.campo && !camposAgregados[c.campo]) {
      camposAgregados[c.campo] = true;
      var valor = (extra && extra[c.campo]) ? extra[c.campo] : '';

      var inputHtml = '';
      if (c.tipoCampo === 'fecha') {
        inputHtml = '<input type="date" class="form-control input-dinamico" data-campo="' + c.campo + '" value="' + valor + '">';
      } else if (c.tipoCampo === 'lista') {
        var opciones = (c.opciones || '').split(',').map(function (s) { return $.trim(s); });
        inputHtml = '<select class="form-control input-dinamico" data-campo="' + c.campo + '">';
        inputHtml += '<option value="">-- Seleccionar --</option>';
        opciones.forEach(function (op) {
          var sel = (valor === op) ? 'selected' : '';
          inputHtml += '<option value="' + op + '" ' + sel + '>' + op + '</option>';
        });
        inputHtml += '</select>';
      } else {
        inputHtml = '<input type="text" class="form-control input-dinamico" data-campo="' + c.campo + '" value="' + valor + '">';
      }

      var html = '<div class="col-md-4" style="margin-bottom:10px;">' +
        '<label>' + c.titulo + ' (' + c.campo + ')</label>' +
        inputHtml +
        '</div>';
      row.append(html);
    }
  });
}

function editarGuia(nro, tipo) {
  var g = tipo === 'ACEPTADA' ? GUIAS_ACEPTADAS[nro] : GUIAS_RECHAZADAS[nro];
  $('#guiaNro').val(nro).prop('readonly', true); // no editar ID
  $('#guiaEstado').val(g.estado);
  $('#guiaEstadoNombre').val(g.estadoNombre);
  $('#guiaClasificacion').val(tipo).trigger('change');

  // extraemos los datos que no sean estado ni estadoNombre
  var extra = {};
  $.each(g, function (k, v) {
    if (k !== 'estado' && k !== 'estadoNombre') extra[k] = v;
  });

  generarCamposDinamicos(extra);
  $('#formGuia').show();
}

function guardarGuia() {
  var nro = $.trim($('#guiaNro').val());
  if (!nro) return alert('El Nro de Guía es obligatorio');

  var tipo = $('#guiaClasificacion').val();
  var obj = {
    estado: $('#guiaEstado').val().toUpperCase(),
    estadoNombre: $('#guiaEstadoNombre').val().toUpperCase()
  };

  if (tipo === 'ACEPTADA') {
    $('.input-dinamico').each(function () {
      var campo = $(this).data('campo');
      var valor = $.trim($(this).val());
      if (valor) obj[campo] = valor;
    });
  }

  // Borrar de ambos por las dudas (si cambió de clasificacion)
  delete GUIAS_ACEPTADAS[nro];
  delete GUIAS_RECHAZADAS[nro];

  if (tipo === 'ACEPTADA') GUIAS_ACEPTADAS[nro] = obj;
  else GUIAS_RECHAZADAS[nro] = obj;

  localStorage.setItem('GUIAS_ACEPTADAS', JSON.stringify(GUIAS_ACEPTADAS));
  localStorage.setItem('GUIAS_RECHAZADAS', JSON.stringify(GUIAS_RECHAZADAS));

  $('#formGuia').hide();
  renderTablaGuias();
}

function eliminarGuia(nro, tipo) {
  if (confirm('¿Seguro que querés eliminar la guía ' + nro + '?')) {
    if (tipo === 'ACEPTADA') delete GUIAS_ACEPTADAS[nro];
    else delete GUIAS_RECHAZADAS[nro];

    localStorage.setItem('GUIAS_ACEPTADAS', JSON.stringify(GUIAS_ACEPTADAS));
    localStorage.setItem('GUIAS_RECHAZADAS', JSON.stringify(GUIAS_RECHAZADAS));
    renderTablaGuias();
  }
}

// === PREFERENCIAS ===
function toggleSonido() {
  sonidosActivados = !sonidosActivados;
  localStorage.setItem('sonidosActivados', sonidosActivados);
  actualizarBtnSonido();
}

function actualizarBtnSonido() {
  var btn = $('#btnToggleSound');
  if (sonidosActivados) {
    btn.text('Sonido Activado 🔊').removeClass('btn-default').addClass('btn-info');
  } else {
    btn.text('Sonido Desactivado 🔇').removeClass('btn-info').addClass('btn-default');
  }
}

function reiniciarContadores() {
  if (confirm('¿Seguro querés reiniciar los contadores y el historial a 0?')) {
    contadorExito = 0;
    contadorTotal = 0;
    HISTORIAL_ESCANEO = [];
    localStorage.setItem('HISTORIAL_ESCANEO', JSON.stringify(HISTORIAL_ESCANEO));
    $('#contador_exito').text(contadorExito);
    $('#contador_total').text(contadorTotal);
    $('#ultima_guia').text('-');
    $('#box_exitoso').hide();
    $('#box_fallido').hide();
    $('#configModal').hide();
    renderHistorial();
  }
}
