/*
 * Império • Painel Roteirizador
 * V35.10.49 — reconhece pedidos prefixados com o dia anterior à Data Roteiro.
 *
 * O núcleo já remove o prefixo quando ele corresponde ao dia da rota.
 * Este patch acrescenta apenas a véspera, preservando a regra original
 * para os demais casos.
 */
(function () {
  'use strict';

  var PATCH_KEY = '__DWS_SEG_ORDER_PREFIX_V35_10_49';
  if (window[PATCH_KEY]) return;

  var original = window.romOrderToCora;
  if (typeof original !== 'function') {
    console.error('[DWS V35.10.49] romOrderToCora não foi encontrada; patch não aplicado.');
    return;
  }

  window.romOrderToCora = function (value, routeDate) {
    var digits = String(value == null ? '' : value).replace(/\D/g, '');
    var match = String(routeDate == null ? '' : routeDate)
      .match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (digits.length >= 8 && match) {
      var year = Number(match[1]);
      var month = Number(match[2]);
      var day = Number(match[3]);
      var routeDay = String(day).padStart(2, '0');
      var previousDate = new Date(Date.UTC(year, month - 1, day - 1));
      var previousDay = String(previousDate.getUTCDate()).padStart(2, '0');

      if (digits.slice(0, 2) === previousDay && previousDay !== routeDay) {
        var normalized = digits.slice(2).replace(/^0+/, '');
        return normalized || '0';
      }
    }

    return original.apply(this, arguments);
  };

  Object.defineProperty(window, PATCH_KEY, {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false
  });

  console.info('[DWS V35.10.49] Prefixo do dia anterior habilitado.');
})();
