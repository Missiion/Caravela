/* ═══════════════════════════════════════════════════════════════════════
   ZEN ADS — Caravela HUB · Sistema de Duas Faces (v16)
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

   DETECÇÃO (3 vias independentes; "protegido" se QUALQUER der
   positivo; nada conclusivo a tempo → assume-se PROTEGIDO — nunca
   limitamos a função por incerteza):
     1. BRAVE — API oficial do browser (navigator.brave.isBrave()).
     2. BAIT ELEMENT — div com as classes que as listas de filtros
        (EasyList etc.) escondem; se desaparecer do layout, há adblock.
     3. FETCH BAIT — pedido a um domínio REAL de publicidade
        (pagead2.googlesyndication.com); as extensões bloqueiam-no ao
        nível da rede e o fetch falha. Timeout NÃO conta como bloqueio
        (rede lenta ≠ adblock).

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

// ── Estado ──
var state = {
    brave: false,        // o browser é Brave
    adblock: false,      // bait escondido OU fetch bloqueado
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
// 2. BAIT ELEMENT — as listas de filtros dos adblocks escondem estes
//    seletores; se o elemento desaparecer do layout, há adblock
// ─────────────────────────────────────────────────────────────────────
function baitCheck() {
    return new Promise(function(resolve) {
        var b = document.createElement('div');
        b.className = 'adsbox ad-banner ads ad-placement ad-slot ' +
                      'ad-zone pub_300x250 advertisement';
        b.style.cssText = 'position:absolute;left:-9999px;top:-9999px;' +
                          'width:1px;height:1px;pointer-events:none;';
        b.innerHTML = '&nbsp;';
        (document.body || document.documentElement).appendChild(b);
        setTimeout(function() {
            var cs = window.getComputedStyle(b);
            var hidden = b.offsetHeight === 0 || b.offsetWidth === 0 ||
                         cs.display === 'none' || cs.visibility === 'hidden' ||
                         parseFloat(cs.opacity) === 0;
            if (b.parentNode) b.parentNode.removeChild(b);
            resolve(hidden);
        }, 250);
    });
}

// ─────────────────────────────────────────────────────────────────────
// 3. FETCH BAIT — domínio real de publicidade; os adblocks bloqueiam-no
//    (o fetch rejeita IMEDIATAMENTE). Timeout/erro de rede NÃO conta
//    (incerto ≠ bloqueado).
// ─────────────────────────────────────────────────────────────────────
function fetchCheck() {
    var url = 'https://pagead2.googlesyndication.com/pagead/js/' +
              'adsbygoogle.js?caravela-detect=' + Date.now();
    var ctrl = null, timer = null;
    var opts = { method: 'GET', mode: 'no-cors', cache: 'no-store' };
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
        return fetch(url, opts).then(
            function() {                                    // carregou → sem bloqueio
                if (timer) clearTimeout(timer);
                return false;
            },
            function() {                                    // falhou:
                if (timer) clearTimeout(timer);
                // abort por timeout = rede lenta, NÃO adblock
                var timedOut = !!(ctrl && ctrl.signal && ctrl.signal.aborted);
                return !timedOut;
            }
        ).catch(function() { return false; });
    } catch (e) {
        return Promise.resolve(false);
    }
}

// ─────────────────────────────────────────────────────────────────────
// COMBINAÇÃO — "protegido" = Brave OU adblock. Resolve CEDO se
// qualquer via der positivo (o Brave resolve quase instantâneo; um
// adblock bloqueia o fetch em milissegundos). Nada conclusivo a
// tempo → protegido (princípio: nunca limitar por incerteza).
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
    var adblockP = Promise.all([baitCheck(), fetchCheck()]).then(function(r) {
        state.adblock = !!(r[0] || r[1]);
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
// ─────────────────────────────────────────────────────────────────────
function noticeText() {
    var t = (window._i18n && window._i18n.get) ? window._i18n.get('zenAdsNotice')
                                               : null;
    return (t && typeof t === 'string') ? t
        : 'This feature is limited. Use the Brave browser, or install an ad blocker, to fully enjoy it.';
}

function showNotification() {
    if (state.notified) return;          // 1× por sessão de página
    state.notified = true;
    var el = document.getElementById(TOAST_ID);
    if (!el) {
        el = document.createElement('div');
        el.id = TOAST_ID;
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        (document.body || document.documentElement).appendChild(el);
    }
    el.textContent = noticeText();
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
    // callback para quando a detecção CONFIRMAR desprotecção
    // (chamado de imediato se já estiver confirmada)
    onUnprotected: function(cb) {
        if (typeof cb !== 'function') return;
        if (state.protected === false) { try { cb(); } catch (e) {} return; }
        unprotectedCallbacks.push(cb);
    },
    // (debug/testes) dispara a notificação manualmente
    _notify: showNotification,
    _state: state
};

// Arranque — o mais cedo possível: o utilizador demora a chegar ao
// zen; quando chegar, a detecção já deve estar concluída
detect();

})();
