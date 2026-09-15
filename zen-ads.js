/* ═══════════════════════════════════════════════════════════════════════
   ZEN ADS — Caravela HUB · Sistema de Duas Faces (v22)
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

   DETECÇÃO v22 · ISCAS FIRST-PARTY (bug do Edge, 2026-10): a v21
   usava iscas em DOMÍNIOS de publicidade de TERCEIROS (adnxs,
   quantserve, doubleclick, googlesyndication, googletagservices) — mas
   o TRACKING PREVENTION NATIVO do Edge (modo Balanced, o default)
   bloqueia esses mesmos domínios SEM adblock nenhum (lista Disconnect,
   contexto third-party) → o Edge sem extensões dava "protegido" (falso
   positivo): sem aviso, sem alternativas, anúncios à vista (o bug
   reportado pelo Quintas). No Firefox o ETP Standard só restringe
   cookies, não corta pedidos — por isso a v21 lá "funcionava".

   A v22 troca as iscas de terceiros por ISCAS FIRST-PARTY: ficheiros
   NOSSOS, publicados junto do index.html, em caminhos que as regras
   GENÉRICAS das listas bloqueiam em QUALQUER domínio (first-party
   incluído):
     · pagead/conversion.js → "/pagead/conversion.js$script"
                              (EasyList · AdGuard Base)
     · ads/show.js          → "/ads/show.$script"
                              (EasyList · AdGuard Base)
     · common/ad.js        → "/common/ad.js$script"
                              (EasyList · AdGuard Base)
   Um adblock REAL (uBO, AdGuard, ABP, Opera…) corta o <script> a esses
   caminhos (onerror em milissegundos); os bloqueadores NATIVOS dos
   browsers NUNCA bloqueiam um script first-party por caminho → o Edge
   sem adblock carrega-os a 100%. As regras são $script — não tocam em
   fetch → CONTROLO anti-esquecimento: quando um script falha, um
   fetch() same-origin ao MESMO URL prova que o ficheiro existe
   (200 = deploy ok → o onerror É adblock; 404 = iscas não subidas →
   deployError, NÃO conta como adblock — o _debug() acusa).

   NOTA github.io: o EasyList tem "@@||github.io^$generichide" — as
   iscas COSMÉTICAS genéricas são desligadas em *.github.io (nunca são
   escondidas); as regras de REDE genéricas não são afectadas ($generichide
   só mexe em cosmética) → o NÚCLEO da detecção v22 é a rede (scripts
   first-party); a cosmética fica como via best-effort extra (vale em
   domínio próprio / outros alojamentos).

   3 VIAS (positivo em QUALQUER uma → protegido; nada conclusivo a
   tempo → assume-se PROTEGIDO):
     1. BRAVE — API oficial do browser (navigator.brave.isBrave()).
     2. ISCAS COSMÉTICAS — 2 divs escondidos com os conjuntos de
        classes das listas genéricas (best-effort — ver nota github.io).
        Duas verificações (250ms + 750ms). Os nativos NUNCA escondem
        elementos → sem falsos positivos.
     3. ISCAS FIRST-PARTY (o núcleo) — 3 tags <script> a ficheiros
        NOSSOS em caminhos bloqueados por regras genéricas (ver acima),
        cada uma com controlo fetch ao mesmo URL (distinção bloqueado/
        -não-subido). As iscas de TERCEIROS da v21 foram REMOVIDAS —
        eram a causa do falso positivo no Edge.
   Timeout/erro de rede NÃO conta como bloqueio (incerto ≠ bloqueado).
   Diagnóstico do dono: consola → ZenAds._debug() mostra a versão, o
   resultado de CADA isca, e deployError:true se faltarem os ficheiros.

   PRIVACIDADE (v22): a detecção já NÃO toca em NENHUM domínio de
   terceiros — todos os pedidos vão para o NOSSO domínio (o CDN estático
   do GitHub Pages): 3 ficheiros de ~50 bytes por visita (e quem tem
   adblock nem os faz — são cortados dentro do browser). Falsos
   positivos de rede (Pi-hole, DNS filtrado, ETP Strict do Firefox)
   já NÃO caem na face protegida: caem na DESPROTEGIDA — e é correcto,
   porque quem bloqueia só ao nível de rede/domingo CONTINUA a ver os
   anúncios do player do YouTube (servidos dos mesmos domínios do
   vídeo), logo precisa do aviso e das alternativas.

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

var VERSION = 'v22 (first-party · Edge-safe)';

// Iscas cosméticas — 2 conjuntos de classes escondidas por CSS
// genérico (EasyList & co.). O 1.º é o conjunto CLÁSSICO dos
// detectores battle-tested (FuckAdBlock & afins); o 2.º é o nosso
// conjunto alargado da v20. (v22: via best-effort — em *.github.io o
// $generichide do EasyList desliga-as; o núcleo passou a ser as iscas
// first-party de rede.)
var BAIT_CLASS_SETS = [
    'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad ' +
        'text_ads text-ads text-ad-links',
    'adsbox ad-banner ads ad-placement ad-slot ad-zone advertisement ' +
        'ad-unit ad-frame sponsored-ad'
];

// (v22 · FIRST-PARTY) Ficheiros NOSSOS em caminhos que as regras
// GENÉRICAS das listas (EasyList + AdGuard Base) bloqueiam em QUALQUER
// domínio — first-party incluído. URLs RELATIVOS: funcionam no
// github.io raiz, em /repo/ ou em domínio próprio. TÊM DE ESTAR
// PUBLICADOS junto do index.html (senão o _debug() acusa deployError).
var FP_BAITS = [
    { name: 'pagead/conversion.js', url: 'pagead/conversion.js' },
    { name: 'ads/show.js',          url: 'ads/show.js'          },
    { name: 'common/ad.js',         url: 'common/ad.js'         }
];

// Resultados detalhados por isca (ver ZenAds._debug())
var debug = { cosmetic: null, fp: {}, deployError: false };

// ── Estado ──
var state = {
    brave: false,        // o browser é Brave
    adblock: false,      // alguma isca da armadilha bloqueada
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
//    estes selectores por CSS genérico; se algum elemento desaparecer
//    do layout, há adblock. 2 elementos com conjuntos diferentes e
//    DUAS verificações (250ms + 750ms). Os bloqueadores NATIVOS dos
//    browsers nunca escondem elementos do DOM → sem falsos positivos
//    (a questão Edge). (v22: best-effort — ver nota github.io.)
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
// 3. ISCAS FIRST-PARTY (script + controlo fetch) — (v22) O NÚCLEO.
//    Ficheiros NOSSOS em caminhos que as regras GENÉRICAS das listas
//    bloqueiam em qualquer domínio (first-party incluído): um adblock
//    REAL corta o <script> (onerror quase instantâneo); os nativos dos
//    browsers (Edge Tracking Prevention, Firefox ETP, Safari ITP,
//    Chrome) NUNCA bloqueiam um script first-party por caminho — o
//    falso positivo do Edge v21 vinha das iscas de TERCEIROS (domínios
//    da lista Disconnect), agora removidas.
//    CONTROLO: as regras são $script (não tocam fetch) → quando o
//    script falha, um fetch() same-origin ao MESMO URL distingue:
//      · 200    → o ficheiro EXISTE → o onerror FOI adblock → bloqueado;
//      · 404    → isca não subida (deployError — NÃO conta como
//                 adblock; o _debug() acusa em altifalante);
//      · reject → o fetch também foi bloqueado (regra sem tipo, ou
//                 rede mesmo morta) → conservador: conta como bloqueado.
//    Timeout do script NÃO conta (rede lenta ≠ adblock). O controlo
//    fetch só corre SE o script falhar (utilizadores limpos fazem
//    apenas os 3 pedidos de ~50 bytes ao nosso próprio CDN).
// ─────────────────────────────────────────────────────────────────────
function fpBait(bait) {
    return new Promise(function(resolve) {
        var bust = Date.now() + '-' + Math.floor(Math.random() * 1e9);
        var s = document.createElement('script');
        var done = false, to = null, loaded = false, timedOut = false;
        function finish() {
            if (done) return;
            done = true;
            if (to) clearTimeout(to);
            s.onload = s.onerror = null;
            if (s.parentNode) s.parentNode.removeChild(s);
            if (loaded || timedOut) {
                // carregou (sem bloqueio) ou timeout (rede lenta) →
                // nada conclusivo de bloqueio
                debug.fp[bait.name] = timedOut ? 'timeout' : 'ok';
                resolve(false);
                return;
            }
            // script FALHOU → controlo por fetch ao MESMO URL (as
            // regras $script não tocam fetch; same-origin = resposta
            // legível: distingue 200 "existe" de 404 "não subido")
            if (typeof window.fetch !== 'function') {
                // browser sem fetch API: sem controlo possível — assume
                // o comportamento clássico (onerror = bloqueio)
                debug.fp[bait.name] = 'blocked (sem fetch p/ controlo)';
                resolve(true);
                return;
            }
            fetch(bait.url + '?caravela-' + bust + '-ctrl',
                  { cache: 'no-store' })
                .then(function(r) {
                    if (r.ok) {
                        debug.fp[bait.name] = 'blocked';
                        resolve(true);            // existe + cortado
                    } else {
                        debug.fp[bait.name] = 'missing-' + r.status;
                        debug.deployError = true; // isca não subida!
                        resolve(false);
                    }
                })
                .catch(function() {
                    // fetch também bloqueado (regra sem tipo) ou rede
                    // morta — conservador: conta como bloqueado
                    debug.fp[bait.name] = 'blocked+ctrl';
                    resolve(true);
                });
        }
        to = setTimeout(function() { timedOut = true; finish(); },
                        FETCH_TIMEOUT_MS);     // rede lenta ≠ adblock
        s.onload  = function() { loaded = true; finish(); };
        s.onerror = function()            { finish(); };
        s.async = true;
        s.src = bait.url + '?caravela-' + bust;
        (document.body || document.documentElement).appendChild(s);
    });
}

function fpCheck() {
    return Promise.all(FP_BAITS.map(fpBait)).then(function(rs) {
        for (var i = 0; i < rs.length; i++) if (rs[i]) return true;
        return false;
    });
}

// ─────────────────────────────────────────────────────────────────────
// COMBINAÇÃO — "protegido" = Brave OU adblock. Resolve CEDO se
// qualquer isca der positivo (o Brave resolve quase instantâneo; um
// adblock corta as iscas first-party em milissegundos). Nada
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
    var adblockP = Promise.all([baitCheck(), fpCheck()])
        .then(function(r) {
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
    // (v22) diagnóstico do dono — resultado de CADA isca + a versão
    // (revela cache antiga) + deployError:true se as ISCAS NÃO
    // FOREM ENCONTRADAS (esqueceu-se de as subir para o GitHub
    // Pages — NÃO é adblock) + baitsExecuted (prova de execução dos
    // ficheiros quando não bloqueados)
    _debug: function() {
        return {
            version:       VERSION,
            forced:        forcedMode(),
            isResolved:    state.resolved,
            isProtected:   state.protected !== false,
            isBrave:       !!state.brave,
            hasAdblock:    !!state.adblock,
            cosmetic:      debug.cosmetic,
            firstparty:    debug.fp,
            deployError:   debug.deployError,
            baitsExecuted: (typeof window.__CARAVELA_BAITS__ === 'object')
                             ? window.__CARAVELA_BAITS__ : null
        };
    },
    _state: state
};

// Arranque — o mais cedo possível: o utilizador demora a chegar ao
// zen; quando chegar, a detecção já deve estar concluída
detect();

})();
