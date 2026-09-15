/* Caravela HUB · isca first-party nº 3 — zen-ads.js v22.
   Caminho escolhido para colidir com a regra GENÉRICA
   "/common/ad.js$script" do EasyList (e a equivalente do AdGuard Base)
   — bloqueada por adblocks em QUALQUER domínio, first-party incluído.
   Os bloqueadores NATIVOS dos browsers (Edge Tracking Prevention,
   Firefox ETP, Safari ITP, Chrome) só bloqueiam domínios de anúncios
   de TERCEIROS (lista Disconnect) e nunca um script first-party por
   caminho → zero falsos positivos.
   NÃO APAGAR · NÃO RENOMEAR · NÃO MOVER — sobe para o GitHub Pages na
   mesma pasta que o index.html. Executa sem efeito (só define uma flag
   de diagnóstico). */
window.__CARAVELA_BAITS__ = window.__CARAVELA_BAITS__ || {};
window.__CARAVELA_BAITS__['common/ad.js'] = true;
