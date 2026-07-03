import toast from 'react-hot-toast';

interface PreviewData {
  nombre: string;
  tipoContrato: string;
  lugarEmision: string;
  asunto: string;
  destinatarios: string;
  cuerpoHtml: string;
  despedida: string;
  remitenteNombre: string;
  remitenteCargo: string;
  conCopiaPara: string;
}

export const handlePreview = (data: PreviewData) => {
  
  const headerHtml = `
  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #002d55; padding-bottom: 10px; margin-bottom: 20px; margin-left: -10mm; margin-right: -10mm;">
      <div style="display: flex; align-items: center; gap: 12px;">
          <img src="/logo-unach-color.png" alt="UNACH Shield" style="width: 50px; height: 50px; object-fit: contain;" />
          <div style="font-family: Arial, sans-serif; text-align: left; line-height: 1.2;">
              <strong style="font-size: 13px; color: #002d55; display: block; letter-spacing: 0.5px;">UNIVERSIDAD AUTÓNOMA DE CHIAPAS</strong>
              <span style="font-size: 11px; color: #555; font-weight: bold;">Escuela de Tecnologías Digitales Aplicadas Campus I</span>
          </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
          <img src="/edu-transforma.png" alt="UNACH Transforma" style="width: 140px; object-fit: contain;" />
      </div>
  </div>
  `;
  
  const footerHtml = `
  <div style="position: absolute; bottom: 15mm; left: 15mm; right: 15mm; border-top: 3px solid #A8C200; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; font-family: Arial, sans-serif; font-size: 9px; color: #555;">
      <div style="line-height: 1.3; text-transform: uppercase; font-weight: bold; color: #002d55;">
          BOULEVARD DR. BELISARIO DOMÍNGUEZ, KM 1081, SIN NÚMERO/TERÁN, TUXTLA GUTIÉRREZ, MÉXICO<br>
          C.P. 29050 / TELÉFONOS 961 615 1326, 961 615 4249 Ext: 101
      </div>
      <div style="font-size: 14px; font-weight: bold; color: #002d55;">
          unach.mx
      </div>
  </div>
  `;

  const destinatariosHtml = data.destinatarios.replace(/\n/g, '<br>');
  const despedidaHtml = data.despedida.replace(/\n/g, '<br>');
  const conCopiaParaHtml = data.conCopiaPara.replace(/\n/g, '<br>');

  const tablaHtml = `
  <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-family: Arial, sans-serif; font-size: 11px; margin-bottom: 25px;">
      <thead>
          <tr style="background-color: #b8cce4; font-weight: bold;">
              <th style="border: 1px solid #000; padding: 4px; width: 10%;">LIC</th>
              <th style="border: 1px solid #000; padding: 4px; width: 60%; text-align: center;">MATERIA</th>
              <th style="border: 1px solid #000; padding: 4px; width: 10%;">SEM</th>
              <th style="border: 1px solid #000; padding: 4px; width: 10%;">GPO</th>
              <th style="border: 1px solid #000; padding: 4px; width: 10%; color: #dc2626;">HSM</th>
          </tr>
      </thead>
      <tbody>
          <tr>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">LIDTS</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: left;">MATEMÁTICAS DISCRETAS</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">1°</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">C</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center; color: #dc2626;">5</td>
          </tr>
          <tr>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">LIDTS</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: left;">CÁLCULO DIFERENCIAL</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">2°</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">M</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center; color: #dc2626;">5</td>
          </tr>
          <tr>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">LIDTS</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: left;">CÁLCULO DIFERENCIAL</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">2°</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">N</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center; color: #dc2626;">5</td>
          </tr>
          <tr>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">LIDTS</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: left;">CÁLCULO INTEGRAL</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">3°</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">O</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center; color: #dc2626;">5</td>
          </tr>
          <tr>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">LSC</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: left;">RAZONAMIENTO MATEMÁTICO</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">1°</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">F</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center; color: #dc2626;">3</td>
          </tr>
          <tr>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">LSC</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: left;">MÉTODOS NUMÉRICOS</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">3°</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">L</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center; color: #dc2626;">5</td>
          </tr>
          <tr style="font-weight: bold;">
              <td colspan="4" style="border: 1px solid #000; padding: 4px; text-align: center;">TOTAL DE HORAS PROGRAMADAS</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center; color: #dc2626;">28</td>
          </tr>
      </tbody>
  </table>
  `;

  const lugar = data.lugarEmision || "Tuxtla Gutiérrez, Chiapas";
  const fecha = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  const folio = "D/SA/007/26";
  const ciclo = "CICLO AGOSTO - DICIEMBRE 2026";

  const page1 = `
  <div class="page-container">
      ${headerHtml}
      
      <div style="text-align: right; margin-bottom: 20px; font-weight: bold; font-family: Arial, sans-serif;">
          <span style="font-size: 14px; color: #002d55; display: block; margin-bottom: 5px;">SECRETARÍA ACADÉMICA</span>
          <span style="font-weight: normal; font-size: 11px; color: #444; line-height: 1.4; display: block;">
              ${lugar};<br>
              ${fecha}<br>
              <strong>Oficio No.</strong> ${folio}
          </span>
      </div>
      
      <div style="text-align: right; margin-bottom: 20px; font-size: 11px; font-family: Arial, sans-serif; line-height: 1.4;">
          <strong>ASUNTO:</strong> ${data.asunto}<br>
          <strong>CICLO:</strong> ${ciclo}
      </div>
      
      <div style="margin-bottom: 20px; line-height: 1.4; font-family: Arial, sans-serif; text-transform: uppercase; font-size: 11px; font-weight: bold; color: #111;">
          ${destinatariosHtml}
      </div>
      
      <div style="text-align: justify; margin-bottom: 20px; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.5;">
          ${data.cuerpoHtml || '<p style="color:red">[Cuerpo vacío]</p>'}
      </div>
      
      <div style="margin-bottom: 20px; font-family: Arial, sans-serif; line-height: 1.4; font-size: 11px;">
          <strong>${despedidaHtml}</strong><br><br><br><br>
          <strong>${data.remitenteNombre || "[Nombre del remitente]"}</strong><br>
          <span style="font-size: 10px; color: #555; text-transform: uppercase;">${data.remitenteCargo}</span>
      </div>
      
      ${conCopiaParaHtml ? `<div style="position: absolute; bottom: 30mm; left: 15mm; font-family: Arial, sans-serif; font-size: 8px; line-height: 1.3; color: #000;">${conCopiaParaHtml}</div>` : ''}
      
      ${footerHtml}
  </div>
  `;

  const page2 = `
  <div class="page-container">
      ${headerHtml}
      
      <div style="text-align: right; margin-bottom: 20px; font-family: Arial, sans-serif; line-height: 1.3;">
          <strong style="font-size: 14px; color: #000; display: block;">SECRETARÍA ACADÉMICA</strong>
          <span style="font-size: 11px; color: #000; display: block;">Área de Logística Académica</span>
          <span style="font-size: 11px; color: #000; display: block;">Tuxtla Gutiérrez, Chiapas a 19 de junio de 2026</span>
      </div>
      
      <div style="text-align: right; margin-bottom: 30px; font-family: Arial, sans-serif; line-height: 1.3;">
          <strong style="font-size: 11px; color: #000; display: block;">Planeación Académica Docente (agosto – diciembre 2026)</strong>
          <strong style="font-size: 11px; color: #000; display: block;">Docentes de Asignatura Eventuales</strong>
      </div>
      
      <div style="margin-bottom: 15px; font-family: Arial, sans-serif; font-size: 11px; line-height: 1.5; color: #000;">
          <strong>Docente:</strong> ANDRADE GUTIÉRREZ GUSTAVO ADOLFO<br>
          <strong>Categoría:</strong> PROFESOR DE ASIGNATURA B<br>
          <strong>Plaza:</strong> 8200<br>
          Horas totales programadas: <strong>28</strong><br>
          <strong>Carga académica programada 2026-2:</strong>
      </div>
      
      ${tablaHtml}
      
      <p style="font-size: 11px; color: #000; text-align: justify; margin-bottom: 60px; font-family: Arial, sans-serif; line-height: 1.4;">
          Las Unidades de Competencia indicadas con anterioridad, pueden estar sujetas a cambios por necesidades académicas.
      </p>
      
      <div style="text-align: right; font-family: Arial, sans-serif; font-size: 11px; color: #000;">
          Área de Logística Académica ETDA C-I
      </div>
      
      <div style="position: absolute; bottom: 30mm; left: 15mm; font-family: Arial, sans-serif; font-size: 8px; line-height: 1.3; color: #000;">
          C.c.p. C. Dra. María de los Ángeles Polanco Enciso.- Encargada de la Dirección de la ETDA C-I.- Para superior conocimiento.-Edificio<br>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Archivo/Minutario<br>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*PLL/gam.
      </div>
      
      ${footerHtml}
  </div>
  `;

  const compiledHtml = page1 + page2;

  const win = window.open('', '_blank');
  if (!win) {
    toast.error('Por favor permite las ventanas emergentes en tu navegador para ver la vista previa.');
    return;
  }

  win.document.write(`
    <html>
      <head>
        <title>Vista Previa de Plantilla - SIPAD</title>
        <style>
          @page {
            size: letter;
            margin: 0mm; /* Disables default browser headers and footers */
          }
          
          body { 
            margin: 0; 
            padding: 0; 
            background-color: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .page-container {
            box-sizing: border-box;
            width: 215.9mm;  /* Letter Width */
            height: 279.4mm; /* Letter Height */
            padding: 10mm 25mm 10mm 25mm;
            position: relative;
            background-color: #fff;
          }
          
          @media print {
            .page-container {
              page-break-after: always;
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div id="sipad-preview-area">
          ${compiledHtml}
        </div>
        <script>
          window.onload = function() {
            window.print();
            // We do not close the window immediately so the user can interact if the print preview dialog is dismissed
          }
        </script>
      </body>
    </html>
  `);
  win.document.close();
};
