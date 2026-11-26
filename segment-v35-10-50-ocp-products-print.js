/* V35.10.50 - Corrige descrições genéricas conhecidas da OCP e espaçamento do cabeçalho PDF.
   Não altera regras de roteirização, vínculo Pedido + Cliente, quantidades ou status. */
(function () {
  'use strict';

  const productDescriptions = Object.freeze({
    '20150': 'BRAHMA CHOPP LT 473ML SH C/12 NPAL MULTPACK 12',
    '32683': 'ANTARCTICA PILSEN LT 473ML SH C/12 NPAL MULTPACK 12'
  });

  // Corrige apenas descrições vazias/genéricas destes códigos confirmados na consulta de pedidos.
  const originalGroupProducts = window.groupProducts;
  if (typeof originalGroupProducts === 'function' && !originalGroupProducts.__dwsV351050) {
    const fixedGroupProducts = function () {
      const grouped = originalGroupProducts.apply(this, arguments);
      if (!Array.isArray(grouped)) return grouped;

      return grouped.map(function (item) {
        if (!item || typeof item !== 'object') return item;
        const code = String(item.code == null ? '' : item.code).trim().replace(/^0+(?=\d)/, '');
        const knownDescription = productDescriptions[code];
        if (!knownDescription) return item;

        const currentDescription = String(item.desc == null ? '' : item.desc).trim();
        const isPlaceholder = !currentDescription || /^PRODUTO\s+\d+$/i.test(currentDescription);
        return isPlaceholder ? Object.assign({}, item, { desc: knownDescription }) : item;
      });
    };

    Object.defineProperty(fixedGroupProducts, '__dwsV351050', { value: true });
    window.groupProducts = fixedGroupProducts;
  }

  // Recalcula os comprimentos e a tabela xref após inserir uma transformação PDF.
  // A transformação passa a valer antes do texto do cliente e desloca para baixo
  // somente esse texto, a tabela e o rodapé; data/título/quadro Mapa-Veículo ficam intactos.
  function adjustPdfHeaderSpacing(bytes) {
    if (!bytes || typeof bytes.length !== 'number') return bytes;

    let raw = '';
    for (let i = 0; i < bytes.length; i++) raw += String.fromCharCode(bytes[i]);

    const xrefStart = raw.lastIndexOf('\nxref\n') + 1;
    if (xrefStart <= 0) return bytes;

    const trailerStart = raw.indexOf('trailer\n', xrefStart);
    if (trailerStart < 0) return bytes;

    let body = raw.slice(0, xrefStart);
    const trailer = raw.slice(trailerStart);
    let movedPages = 0;

    const streamPattern = /(\d+ 0 obj\n<< \/Length )(\d+)( >>\nstream\n)([\s\S]*?)(endstream\nendobj\n)/g;
    body = body.replace(streamPattern, function (_match, prefix, _oldLength, middle, stream, suffix) {
      const marker = /(?=BT \/F2 9 Tf 1 0 0 1 [\d.]+ [\d.]+ Tm \(Cliente segmentado:)/g;
      const adjustedStream = stream.replace(marker, function () {
        movedPages++;
        return '1 0 0 1 0 -10 cm\n';
      });
      return prefix + adjustedStream.length + middle + adjustedStream + suffix;
    });

    if (!movedPages) return bytes;

    const objectMatches = Array.from(body.matchAll(/(\d+) 0 obj\n[\s\S]*?\nendobj\n/g));
    if (!objectMatches.length) return bytes;

    const offsets = [];
    let maxId = 0;
    for (const match of objectMatches) {
      const id = Number(match[1]);
      offsets[id] = match.index;
      if (id > maxId) maxId = id;
    }
    for (let id = 1; id <= maxId; id++) {
      if (typeof offsets[id] !== 'number') return bytes;
    }

    let xref = 'xref\n0 ' + (maxId + 1) + '\n0000000000 65535 f \n';
    for (let id = 1; id <= maxId; id++) {
      xref += String(offsets[id]).padStart(10, '0') + ' 00000 n \n';
    }

    const rebuiltXrefOffset = body.length;
    const rebuiltTrailer = trailer.replace(/startxref\n\d+\n%%EOF\s*$/, 'startxref\n' + rebuiltXrefOffset + '\n%%EOF');
    if (rebuiltTrailer === trailer) return bytes;

    const rebuiltPdf = body + xref + rebuiltTrailer;
    const output = new Uint8Array(rebuiltPdf.length);
    for (let i = 0; i < rebuiltPdf.length; i++) output[i] = rebuiltPdf.charCodeAt(i) & 255;
    return output;
  }

  const originalPdfBuild = window._pdfBuild;
  if (typeof originalPdfBuild === 'function' && !originalPdfBuild.__dwsV351050) {
    const fixedPdfBuild = function () {
      const result = originalPdfBuild.apply(this, arguments);
      if (!result || !result.bytes) return result;
      const adjustedBytes = adjustPdfHeaderSpacing(result.bytes);
      return adjustedBytes === result.bytes ? result : Object.assign({}, result, { bytes: adjustedBytes });
    };

    Object.defineProperty(fixedPdfBuild, '__dwsV351050', { value: true });
    window._pdfBuild = fixedPdfBuild;
  }
})();
