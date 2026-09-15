/* ═══════════════════════════════════════════════════════════════════════
   ZEN ADS — Caravela HUB · Sistema de Duas Faces (v21)
   ═══════════════════════════════════════════════════════════════════════
   Detecção de adblock / Brave + etiquetas de anúncios + alternativas
   de baixa qualidade nos vídeos.

   PORQUÊ (decisão do Quintas, 2026-09): o fundo zen usa o player EMBED
   do YouTube — os anúncios vivem no PLAYER, não nos nossos ficheiros,
   e não há parâmetro oficial que os desligue. Quem NÃO tem adblock/Brave
   VÊ os anúncios; quem tem, nunca os vê.

   AS DUAS FACES:
   • FACE PROTEGIDA (adblock OU Brave): nada muda — todos os vídeos
     reproduzem como sempre (os ORIGINAIS), sem bugs de sync/delay (o
     adblock está a fazer o seu trabalho).
   • FACE DESPROTEGIDA (sem adblock E sem Brave): a função continua a
     funcionar, mas LIMITADA —
       – vídeo SEM anúncio → toca o original, como sempre;
       – vídeo COM anúncio E alternativa (`alt`) → toca a ALTERNATIVA
         de baixa qualidade: re-upload NÃO LISTADO e sem anúncios do
         canal do Quintas (o mesmo vídeo; os tempos start/end e a
         resolução MANTÊM-SE — a qualidade inferior vem da compressão
         dupla, não do player);
       – vídeo COM anúncio SEM alternativa → fica fora da queue;
       – categoria cujos vídeos FICARAM TODOS indisponíveis → sai do
         carrossel (o zen-video.js aplica o filtro quando a detecção
         confirma desprotecção — ver applyZenAdsCategoryFilter).
     O utilizador recebe UMA notificação informativa (10 segundos,
     fundo centro do ecrã, 1× por sessão de página, na 1.ª categoria
     activada — trocar de categoria já não a mostra; o refresh repõe)
     a explicar como desbloquear tudo.

   DETECÇÃO v21 · A ARMADILHA (proposta do Quintas, 2026-09):
   o site esconde VÁRIAS iscas que um adblock está DESTINADO a
   bloquear — se QUALQUER delas desaparecer, há adblock em curso.
   4 vias independentes (positivo em QUALQUER uma → protegido;
   nada conclusivo a tempo → assume-se PROTEGIDO):
     1. BRAVE — API oficial do browser (navigator.brave.isBrave()).
     2. ISCAS COSMÉTICAS — 2 divs escondidos com os conjuntos de
        classes que as listas genéricas (EasyList & co.) escondem
        por CSS: o conjunto CLÁSSICO dos detectores battle-tested
        (pub_300x250, text-ad, textAd, text-ad-links...) + o nosso
        alargado (adsbox, advertisement, ad-slot...). Duas
        verificações (250ms + 750ms).
     3. ARMADILHA DE REDE (fetch) — 4 domínios de publicidade com
        regras BLANKET (||dominio^) nas listas: adnxs.com,
        quantserve.com, doubleclick.net (blanket bloqueia QUALQUER
        tipo de pedido — fetch incluído) + googlesyndication.com
        (apanha bloqueadores do estilo Edge/MV3). Lição v20: o
        adsbygoogle.js sozinho não chega — no uBO/Firefox do
        Quintas o fetch E o script a esse URL passavam livres (o
        ficheiro-biblioteca não está na rede de regras daquela
        instalação — as regras bloqueiam a ENTREGA de anúncios,
        não a biblioteca).
     4. ARMADILHA DE REDE (script) — 3 tags <script> a ficheiros
        REAIS de publicidade (gpt.js ×2 + adsbygoogle.js):
        bloquear scripts de anúncio é a função primária de qualquer
        adblock. onerror = bloqueio; onload = acessível; timeout
        NÃO conta (rede lenta ≠ adblock).
   Timeout/erro de rede NUNCA conta como bloqueio (incerto ≠
   bloqueado). Diagnóstico do dono: consola → ZenAds._debug()
   mostra a versão e o resultado de CADA isca.

   SEGURANÇA PARA QUEM NÃO TEM ADBLOCK (pergunta do Quintas,
   2026-09 · v21.1): as iscas só tocam a rede de quem NÃO bloqueia
   (com adblock, os pedidos são cortados DENTRO do browser e nunca
   saem). São domínios OFICIAIS (Google, Xandr/Microsoft, Quantcast)
   por HTTPS, com ficheiros estáticos — sem vetor de malware e SEM
   efeito visível: a página não tem slots de anúncio (as bibliotecas
   gpt/adsbygoogle carregam, definem as suas filas globais e ficam
   INACTIVAS; os fetches são no-cors, a resposta nunca é lida; as
   tags são removidas do DOM mal resolvem). PRIVACIDADE (v21.1):
   os 7 pedidos saem SEM referer (referrerPolicy no-referrer) e
   sem cookies do site — o destinatário vê apenas um IP e um
   User-Agent, sem saber de que site vieram (menos do que o pixel
   de um Google Analytics qualquer). Falsos positivos (Pi-hole,
   DNS filtrado, antivírus) caem na face PROTEGIDA — vêem tudo,
   sem notificação: inócuo por desenho (e correcto: quem bloqueia
   na rede também não vê os anúncios do player, logo não precisa
   do aviso).

   ETIQUETAS (lista real do Quintas, 2026-09): nos vídeos do
   ZEN_OPTIONS, `ads: true` = vídeo COM anúncio; omissão ou
   `ads: false` = sem anúncio; `alt: 'ID'` = alternativa de baixa
   qualidade (re-upload não listado, sem anúncios) do MESMO vídeo.
   As etiquetas SÓ fazem diferença na face desprotegida — na
   protegida são ignoradas (toca sempre o original).

   MODO FORÇADO (v16 · DONO DO SITE — ver as duas caras sem trocar de
   browser): acrescentar à URL `?zen-ads=full` (face protegida) ou
   `?zen-ads=limited` (face desprotegida). Ignora a detecção por
   completo; sem o parâmetro o site comporta-se sempre sozinho.

   i18n: texto da notificação na chave `zenAdsNotice` (i18n.js, EN+PT).
   ═══════════════════════════════════════════════════════════════════════ */
(function() {
'use strict';

var TOAST_ID         = 'zenAdsToast';
var VISIBLE_MS       = 10000;   // visível 10 segundos (pedido do Quintas)
var FETCH_TIMEOUT_MS = 3000;    // rede lenta ≠ adblock
var GLOBAL_TIMEOUT   = 5000;    // além disto: incerto → assume PROTEGIDO

// (v21 · ARMADILHA — proposta do Quintas) Iscas múltiplas. Regra de
// ouro: cada alvo é um recurso que um adblock está DESTINADO a
// bloquear. Os domínios de rede têm regras BLANKET (||dominio^) nas
// listas de filtros — bloqueiam QUALQUER tipo de pedido (fetch,
// script, imagem...), ao contrário do adsbygoogle.js, cujo ficheiro-
// -biblioteca passava livre no uBO/Firefox do Quintas.
var VERSION = 'v21.1 (armadilha · no-referrer)';

// Iscas cosméticas — 2 conjuntos de classes escondidas por CSS
// genérico (EasyList & co.). O 1.º é o conjunto CLÁSSICO dos
// detectores battle-tested (FuckAdBlock & afins — a referência da
// indústria contra uBO); o 2.º é o nosso conjunto alargado da v20.
var BAIT_CLASS_SETS = [
    'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad ' +
        'text_ads text-ads text-ad-links',
    'adsbox ad-banner ads ad-placement ad-slot ad-zone advertisement ' +
        'ad-unit ad-frame sponsored-ad'
];

// Iscas de rede (fetch) — os 3 primeiros são domínios blanket + o
// googlesyndication (apanha bloqueadores do estilo Edge/MV3)
var FETCH_BAITS = [
    { name: 'adnxs.com',
      url: 'https://ib.adnxs.com/px?id=caravela-' },
    { name: 'quantserve.com',
      url: 'https://pixel.quantserve.com/pixel;r=caravela-' },
    { name: 'doubleclick.net',
      url: 'https://static.doubleclick.net/instream/ad_status.js?caravela-' },
    { name: 'googlesyndication.com',
      url: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?caravela-' }
];

// Iscas de rede (script) — ficheiros REAIS de publicidade (JS
// válido: se NÃO houver adblock, carregam e executam 1× sem efeito
// — gpt.js define window.googletag, adsbygoogle.js define a fila
// window.adsbygoogle; não há slots de anúncio nesta página)
var SCRIPT_BAITS = [
    { name: 'googletagservices.com',
      url: 'https://www.googletagservices.com/tag/js/gpt.js?caravela-' },
    { name: 'doubleclick.net',
      url: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js?caravela-' },
    { name: 'googlesyndication.com',
      url: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?caravela-' }
];

// Resultados detalhados por isca (ver ZenAds._debug())
var debug = { cosmetic: null, fetch: {}, script: {} };

// ── Estado ──
var state = {
    brave: false,        // o browser é Brave
    adblock: false,      // alguma isca da armadilha bloqueada (v21)
    resolved: false,     // detecção concluída
    protected: null,     // null = pendente · true/false = resultado
    notified: false      // notificação já mostrada nesta sessão de página
};

var unprotectedCallbacks = [];  // avisados quando (e se) se confirmar
                                // "sem adblock e sem Brave"

// ─────────────────────────────────────────────────────────────────────
// 1. BRAVE — API oficial (só existe no browser Brave)
// ─────────────────────────────────────────────────────────────────────
function detectBrave() {
    try {
        if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
            return navigator.brave.isBrave()
                .then(function(v) { return !!v; })
                .catch(function() { return false; });
        }
    } catch (e) {}
    return Promise.resolve(false);
}

// ─────────────────────────────────────────────────────────────────────
// 2. ISCAS COSMÉTICAS — as listas de filtros dos adblocks escondem
//    estes selectores por CSS genérico; se algum elemento
//    desaparecer do layout, há adblock. (v21 · ARMADILHA) Agora
//    são 2 elementos com conjuntos diferentes e DUAS verificações
//    (250ms + 750ms).
// ─────────────────────────────────────────────────────────────────────
function baitHiddenNow(els) {
    for (var i = 0; i < els.length; i++) {
        var b = els[i];
        var cs = window.getComputedStyle(b);
        // getClientRects(): lista VAZIA quando o elemento não é
        // renderizado de todo (display:none e variantes via user
        // stylesheets das extensões — padrão dos detectores clássicos)
        if (b.offsetHeight === 0 || b.offsetWidth === 0 ||
            b.getClientRects().length === 0 ||
            cs.display === 'none' || cs.visibility === 'hidden' ||
            parseFloat(cs.opacity) === 0) return true;
    }
    return false;
}

function baitCheck() {
    return new Promise(function(resolve) {
        var els = [];
        for (var i = 0; i < BAIT_CLASS_SETS.length; i++) {
            var b = document.createElement('div');
            b.className = BAIT_CLASS_SETS[i];
            b.style.cssText = 'position:absolute;left:-9999px;top:-9999px;' +
                              'width:1px;height:1px;pointer-events:none;';
            b.innerHTML = '&nbsp;';
            (document.body || document.documentElement).appendChild(b);
            els.push(b);
        }
        function cleanup() {
            for (var j = 0; j < els.length; j++)
                if (els[j].parentNode) els[j].parentNode.removeChild(els[j]);
        }
        setTimeout(function() {                      // 1.ª verificação
            if (baitHiddenNow(els)) {
                cleanup(); debug.cosmetic = { hidden: true, at: '250ms' };
                resolve(true); return;
            }
            setTimeout(function() {                  // 2.ª (tardia)
                var h = baitHiddenNow(els);
                cleanup();
                debug.cosmetic = { hidden: h, at: '750ms' };
                resolve(h);
            }, 500);
        }, 250);
    });
}

// ─────────────────────────────────────────────────────────────────────
// 3. ARMADILHA DE REDE (fetch) — (v21) 4 domínios de publicidade:
//    adnxs.com, quantserve.com e doubleclick.net têm regras
//    BLANKET (||dominio^) nas listas — bloqueiam QUALQUER tipo de
//    pedido, fetch incluído; googlesyndication.com apanha os
//    bloqueadores do estilo Edge/MV3. Timeout/erro de rede NÃO
//    conta (incerto ≠ bloqueado).
// ─────────────────────────────────────────────────────────────────────
function fetchOne(bait) {
    var ctrl = null, timer = null;
    // (v21.1 · PRIVACIDADE) no-referrer: o pedido NÃO transporta o
    // domínio do site — o destinatário só vê um IP + User-Agent,
    // sem saber de onde veio (menos do que qualquer pixel de GA)
    var opts = { method: 'GET', mode: 'no-cors', cache: 'no-store',
                 referrerPolicy: 'no-referrer' };
    try {
        if (window.AbortController) {
            ctrl = new AbortController();
            timer = setTimeout(function() {
                try { ctrl.abort(); } catch (e) {}
            }, FETCH_TIMEOUT_MS);
            opts.signal = ctrl.signal;
        }
    } catch (e) {}
    try {
        return fetch(bait.url + Date.now(), opts).then(
            function() {                                    // carregou → sem bloqueio
                if (timer) clearTimeout(timer);
                debug.fetch[bait.name] = 'ok';
                return false;
            },
            function() {                                    // falhou:
                if (timer) clearTimeout(timer);
                // abort por timeout = rede lenta, NÃO adblock
                var timedOut = !!(ctrl && ctrl.signal && ctrl.signal.aborted);
                debug.fetch[bait.name] = timedOut ? 'timeout' : 'blocked';
                return !timedOut;
            }
        ).catch(function() { return false; });
    } catch (e) {
        return Promise.resolve(false);
    }
}

function fetchCheck() {
    return Promise.all(FETCH_BAITS.map(fetchOne)).then(function(rs) {
        for (var i = 0; i < rs.length; i++) if (rs[i]) return true;
        return false;
    });
}

// ─────────────────────────────────────────────────────────────────────
// 4. ARMADILHA DE REDE (script) — (v21) 3 tags <script> a ficheiros
//    REAIS de publicidade (gpt.js ×2 + adsbygoogle.js). Bloquear
//    scripts de anúncio é a função primária de qualquer adblock —
//    é o tipo de pedido que TODOS filtram. onerror = bloqueio (ou
//    erro de rede — mesma semântica do fetch); onload = acessível;
//    timeout NÃO conta (rede lenta ≠ adblock). As tags são REMOVIDAS
//    logo que resolvem; se chegarem a carregar (sem adblock),
//    executam 1× sem efeito (a página já depende do ecossistema
//    YouTube/Google: iframe_api, gstatic, fonts). Sem CSP no
//    index.html (verificado).
// ─────────────────────────────────────────────────────────────────────
function scriptOne(bait) {
    return new Promise(function(resolve) {
        var s = document.createElement('script');
        s.src = bait.url + Date.now();
        s.async = true;
        // (v21.1 · PRIVACIDADE) sem referer — ver nota no fetchOne
        s.referrerPolicy = 'no-referrer';
        var done = false, to = null;
        function finish(blocked, why) {
            if (done) return;
            done = true;
            if (to) clearTimeout(to);
            s.onload = s.onerror = null;
            if (s.parentNode) s.parentNode.removeChild(s);
            debug.script[bait.name] = why;
            resolve(blocked);
        }
        to = setTimeout(function() { finish(false, 'timeout'); },
                        FETCH_TIMEOUT_MS);   // rede lenta ≠ adblock
        s.onload  = function() { finish(false, 'ok');      };
        s.onerror = function() { finish(true,  'blocked');  };
        (document.body || document.documentElement).appendChild(s);
    });
}

function scriptCheck() {
    return Promise.all(SCRIPT_BAITS.map(scriptOne)).then(function(rs) {
        for (var i = 0; i < rs.length; i++) if (rs[i]) return true;
        return false;
    });
}

// ─────────────────────────────────────────────────────────────────────
// COMBINAÇÃO — "protegido" = Brave OU adblock. Resolve CEDO se
// qualquer isca der positivo (o Brave resolve quase instantâneo; um
// adblock bloqueia as iscas de rede em milissegundos). Nada
// conclusivo a tempo → protegido (princípio: nunca limitar por
// incerteza).
// ─────────────────────────────────────────────────────────────────────
var readyResolve;
var readyPromise = new Promise(function(res) { readyResolve = res; });

var settled = false;
function settle(prot) {
    if (settled) return;
    settled = true;
    state.resolved = true;
    state.protected = prot;
    readyResolve(prot);
    if (prot === false) {
        var cbs = unprotectedCallbacks.splice(0);
        for (var i = 0; i < cbs.length; i++) {
            try { cbs[i](); } catch (e) {}
        }
    }
}

// ── (v16 · DONO DO SITE) Forçar uma face para verificação ──
// ?zen-ads=full    → face  protegida (tudo, como com adblock/Brave)
// ?zen-ads=limited → face desprotegida (notificação + alternativas +
//                    categorias escondidas) — ver as duas caras sem
//                    trocar de browser. Ignora a detecção por completo.
function forcedMode() {
    try {
        var m = (window.location.search || '')
                    .match(/[?&]zen-ads=(full|limited)(?:&|$)/);
        return m ? m[1] : null;
    } catch (e) { return null; }
}

function detect() {
    // (v16) modo forçado pelo dono → sem detecção (ver forcedMode)
    var forced = forcedMode();
    if (forced) { settle(forced === 'full'); return; }
    var braveP = detectBrave().then(function(b) {
        state.brave = b;
        if (b) settle(true);
        return b;
    });
    var adblockP = Promise.all([baitCheck(), fetchCheck(), scriptCheck()])
        .then(function(r) {
            state.adblock = !!(r[0] || r[1] || r[2]);
            if (state.adblock) settle(true);
            return state.adblock;
        });
    Promise.all([braveP, adblockP]).then(function(r) {
        settle(!!(r[0] || r[1]));
    });
    setTimeout(function() { settle(true); }, GLOBAL_TIMEOUT);
}

// ─────────────────────────────────────────────────────────────────────
// NOTIFICAÇÃO — 1× por sessão de página · fundo centro · 10 segundos
// (v17) showNotification(text?) — sem argumento usa o texto da DUAS
// FACES (i18n zenAdsNotice, 1× por sessão); com argumento mostra esse
// texto (usado pelo zen-video.js para avisos de RESILIÊNCIA — ex.:
// categoria temporariamente indisponível — com throttle próprio de
// 15s para não spammar em cliques repetidos).
// ─────────────────────────────────────────────────────────────────────
function noticeText() {
    var t = (window._i18n && window._i18n.get) ? window._i18n.get('zenAdsNotice')
                                               : null;
    return (t && typeof t === 'string') ? t
        : 'This feature is limited. Use the Brave browser, or install an ad blocker, to fully enjoy it.';
}

var lastCustomNoticeAt = 0;    // throttle dos avisos custom (v17)

function showNotification(text) {
    // Texto CUSTOM (v17 — avisos do zen-video.js): throttle de 15s
    if (text) {
        if (Date.now() - lastCustomNoticeAt < 15000) return;
        lastCustomNoticeAt = Date.now();
    } else if (state.notified) {
        return;                   // aviso das duas faces: 1× por sessão
    }
    if (!text) state.notified = true;
    var el = document.getElementById(TOAST_ID);
    if (!el) {
        el = document.createElement('div');
        el.id = TOAST_ID;
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        (document.body || document.documentElement).appendChild(el);
    }
    el.textContent = text || noticeText();
    // dupla rAF: garante que o elemento entra no layout antes de a
    // transição de opacidade arrancar (fade suave garantido)
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            el.classList.add('zen-ads-toast--on');
            setTimeout(function() {
                el.classList.remove('zen-ads-toast--on');
            }, VISIBLE_MS);
        });
    });
}

// ─────────────────────────────────────────────────────────────────────
// REGRAS DE DUAS FACES (v16) — funções puras sobre o estado
// ─────────────────────────────────────────────────────────────────────
// Vídeo disponível para ESTE utilizador? protegido/pendente → todos;
// desprotegido → sem anúncio OU COM alternativa de baixa qualidade
// (que é a versão que o player vai tocar — ver playbackIdOf)
function videoAllowed(v) {
    return !v || state.protected !== false || !v.ads || !!v.alt;
}

// ID a dar ao PLAYER: desprotegido + vídeo com anúncio + alternativa →
// a ALTERNATIVA (o re-upload sem anúncios); todos os outros casos → o
// ORIGINAL. Os tempos start/end são do MESMO objecto vídeo — a
// alternativa herda-os automaticamente (é o mesmo vídeo, re-carregado;
// a resolução pedida também é sempre a máxima — a qualidade inferior
// vem da compressão dupla do re-upload, não do lado do site).
function playbackIdOf(v) {
    if (v && state.protected === false && v.ads && v.alt) return v.alt;
    return v ? v.id : null;
}

// Categoria disponível? protegido/pendente → todas; desprotegido →
// pelo menos 1 vídeo disponível (sem anúncio ou com alternativa).
// Categorias SEM nenhum vídeo disponível saem do carrossel (o
// zen-video.js remove-as — applyZenAdsCategoryFilter).
function categoryAvailable(opt) {
    if (!opt || !opt.functional || !opt.videos || !opt.videos.length)
        return true;
    if (state.protected !== false) return true;
    for (var i = 0; i < opt.videos.length; i++)
        if (videoAllowed(opt.videos[i])) return true;
    return false;
}

// ─────────────────────────────────────────────────────────────────────
// API PÚBLICA — consumida pelo zen-video.js (e testável na consola)
// ─────────────────────────────────────────────────────────────────────
window.ZenAds = {
    ready: readyPromise,
    // null (pendente) → true: enquanto não sabemos, o comportamento
    // fica INALTERADO (nunca limitar por incerteza)
    isProtected:  function() { return state.protected !== false; },
    isResolved:   function() { return state.resolved; },
    isBrave:      function() { return !!state.brave; },
    hasAdblock:   function() { return !!state.adblock; },
    // (v16) regras de duas faces — ver funções acima
    videoAllowed:     videoAllowed,
    playbackIdOf:     playbackIdOf,
    categoryAvailable: categoryAvailable,
    // mostra a notificação SE a detecção já confirmou desprotecção
    notifyIfUnprotected: function() {
        if (state.protected === false) showNotification();
    },
    // (v17) mostra um aviso CUSTOM (texto do zen-video.js — ex.:
    // categoria temporariamente indisponível); throttle de 15s
    notifyText: function(text) {
        if (typeof text === 'string' && text) showNotification(text);
    },
    // callback para quando a detecção CONFIRMAR desprotecção
    // (chamado de imediato se já estiver confirmada)
    onUnprotected: function(cb) {
        if (typeof cb !== 'function') return;
        if (state.protected === false) { try { cb(); } catch (e) {} return; }
        unprotectedCallbacks.push(cb);
    },
    // (debug/testes) dispara a notificação manualmente
    _notify: showNotification,
    // (v21) diagnóstico do dono — resultado de CADA isca. A versão
    // confirma que o ficheiro novo está vivo (revela cache antiga)
    _debug: function() {
        return {
            version:     VERSION,
            forced:      forcedMode(),
            isResolved:  state.resolved,
            isProtected: state.protected !== false,
            isBrave:     !!state.brave,
            hasAdblock:  !!state.adblock,
            cosmetic:    debug.cosmetic,
            fetch:       debug.fetch,
            script:      debug.script
        };
    },
    _state: state
};

// Arranque — o mais cedo possível: o utilizador demora a chegar ao
// zen; quando chegar, a detecção já deve estar concluída
detect();

})();
