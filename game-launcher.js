/* ═══════════════════════════════════════════════════════════════
   GAME-LAUNCHER.JS  — v5

   COMO ADICIONAR UM NOVO JOGO:
   1. Coloca o HTML em  games/nome.html
   2. Adiciona um card em games-zone.js com um id único
   3. Regista o jogo abaixo em GAME_REGISTRY — só uma linha
   ═══════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    const GAME_REGISTRY = [
        { id: 'gzCardFruitNinja', title: 'FRUIT NINJA', src: 'fruit-ninja.html' },
        // { id: 'gzCardJogo2', title: 'NOME', src: 'games/jogo2.html' },
    ];

    const SOUND_IDS   = ['sndWrapRain', 'sndWrapDryer', 'sndWrapWind'];
    const _sndOrigins = {};

    const SEASON_CANVAS_IDS = [
        'snow-canvas', 'spring-canvas', 'autumn-canvas',
        'summer-canvas', 'sun-canvas', 'night-canvas',
    ];
    const _seasonSavedDisplay = {};

    let _seasonKeysBlocked = false;
    const _seasonKeyHandler = function (e) { e.stopImmediatePropagation(); };

    function blockSeasonKeys() {
        if (_seasonKeysBlocked) return;
        _seasonKeysBlocked = true;
        document.addEventListener('keydown', _seasonKeyHandler, true);
        document.addEventListener('keyup',   _seasonKeyHandler, true);
    }
    function unblockSeasonKeys() {
        if (!_seasonKeysBlocked) return;
        _seasonKeysBlocked = false;
        document.removeEventListener('keydown', _seasonKeyHandler, true);
        document.removeEventListener('keyup',   _seasonKeyHandler, true);
    }

    /* ── DOM ── */
    let overlay, frame, backBtn, gameTitle, soundDock;
    let _built = false;

    function buildDOM() {
        if (_built) return;
        _built = true;

        overlay      = el('div',    'gameLaunchOverlay');
        const topBar = el('div',    'glTopBar');
        backBtn      = el('button', 'glBackBtn');
        const _fnBackVal = window._i18n && window._i18n.get('fnBack');
        const _fnBackLabel = (_fnBackVal && _fnBackVal !== 'fnBack') ? _fnBackVal : 'BACK';
        backBtn.textContent = '\u2190 ' + _fnBackLabel;
        gameTitle    = el('span',   'glGameTitle');
        soundDock    = el('div',    'glSoundDock');

        const spacer = document.createElement('span');
        spacer.style.cssText = 'flex:1';

        topBar.appendChild(backBtn);
        topBar.appendChild(gameTitle);
        topBar.appendChild(spacer);
        topBar.appendChild(soundDock);

        frame = el('iframe', 'gameLaunchFrame');
        frame.setAttribute('allowfullscreen', '');
        frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-pointer-lock');

        // Evento load do iframe — neste momento os scripts do iframe já executaram,
        // por isso é seguro enviar o tema directamente. Serve de fallback para o
        // caso em que o PEDIR_TEMA chegou antes do listener do pai estar pronto.
        frame.addEventListener('load', function () {
            if (!frame.src || frame.src === 'about:blank') return;
            sendThemeToFrame();
        });

        overlay.appendChild(topBar);
        overlay.appendChild(frame);
        document.body.appendChild(overlay);


        /* Botão BACK do header fecha o jogo */
        backBtn.addEventListener('click', closeGame);
    }

    function el(tag, id) {
        const e = document.createElement(tag);
        e.id = id;
        return e;
    }

    /* ── Estações ── */
    function freezeSeasons() {
        SEASON_CANVAS_IDS.forEach(id => {
            const e = document.getElementById(id);
            if (!e) return;
            _seasonSavedDisplay[id] = e.style.display;
            e.style.display = 'none';
        });
    }
    function restoreSeasons() {
        SEASON_CANVAS_IDS.forEach(id => {
            const e = document.getElementById(id);
            if (!e) return;
            const saved = _seasonSavedDisplay[id];
            if (saved !== undefined) { e.style.display = saved; delete _seasonSavedDisplay[id]; }
        });
    }

    /* ── Sons ── */
    function moveSoundsToDock() {
        SOUND_IDS.forEach(id => {
            const e = document.getElementById(id);
            if (!e) return;
            _sndOrigins[id] = { parent: e.parentElement, next: e.nextSibling };
        });
        [...SOUND_IDS].reverse().forEach(id => {
            const e = document.getElementById(id);
            if (e) soundDock.appendChild(e);
        });
        soundDock.classList.add('gl-dock-visible');
    }
    function restoreSounds() {
        soundDock.classList.remove('gl-dock-visible');
        SOUND_IDS.forEach(id => {
            const e = document.getElementById(id);
            if (!e) return;
            const r = _sndOrigins[id];
            if (!r) return;
            r.next ? r.parent.insertBefore(e, r.next) : r.parent.appendChild(e);
        });
    }

    /* ── Cometas (modo noite) ── */
    function _freezeNight() {
        if (window._nightCtrl && typeof window._nightCtrl.pause === 'function') {
            window._nightCtrl.pause();
        }
    }
    function _resumeNight() {
        if (window._nightCtrl && typeof window._nightCtrl.resume === 'function') {
            window._nightCtrl.resume();
        }
    }

    /* ── Chuva ── */
    function _freezeRain() {
        if (window._rainCtrl && typeof window._rainCtrl.pauseDrops === 'function') {
            window._rainCtrl.pauseDrops();
        }
        document.querySelectorAll('.screen-drop').forEach(e => e.remove());
    }
    function _cleanupRain() {
        document.querySelectorAll('.screen-drop').forEach(e => e.remove());
        if (window._rainCtrl && typeof window._rainCtrl.resumeDrops === 'function') {
            window._rainCtrl.resumeDrops();
        }
        const rainBox = document.getElementById('rainBox');
        if (rainBox && rainBox.style.opacity !== '0') {
            const drops = rainBox.querySelectorAll('.drop');
            drops.forEach(d => { d.style.animationName = 'none'; d.style.animationDelay = (Math.random() * 2) + 's'; });
            void rainBox.offsetWidth;
            drops.forEach(d => { d.style.animationName = ''; });
        }
    }

    /* ── Abrir ── */
    function openGame(src, title) {
        buildDOM();
        gameTitle.textContent = title || '';

        frame.src = src;
        moveSoundsToDock();
        freezeSeasons();
        blockSeasonKeys();
        _freezeRain();
        _freezeNight();
        document.body.classList.add('game-open');
        overlay.classList.add('gl-active');
        cfgApply(_cfgState);
        sendLangToFrame();
    }

    /* ── Fechar ── */
    function closeGame() {
        if (!overlay) return;
        overlay.classList.add('gl-exit');
        setTimeout(() => {
            overlay.classList.remove('gl-active', 'gl-exit');
            cleanupAfterClose();
        }, 680);
    }

    function cleanupAfterClose() {
        frame.src = 'about:blank';
        restoreSounds();
        restoreSeasons();
        unblockSeasonKeys();
        _cleanupRain();
        _resumeNight();
        document.body.classList.remove('game-open');
    }

    /* ══════════════════════════════════════════════════════════
       CONFIG PANEL
       — Sem persistência: estado em memória, reset ao recarregar
       — Sempre presente no DOM mas INVISÍVEL por defeito (cfg-hidden)
       — Ativado apenas via window._cfgTogglePanel() no mod panel
       — Acessível em qualquer página (não limitado ao jogo)
    ══════════════════════════════════════════════════════════ */

    const CFG_DEFAULTS = {
        soundSize:    25,
        soundGap:      8,
        soundOffsetY:  0,
        titleSize:  0.75,
        titleSpacing: 5.0,
        titleOffsetY:  4,
        bgBlur:        4,
        bgDark:        0,
    };

    let _cfgState = Object.assign({}, CFG_DEFAULTS);

    function cfgApply(cfg) {
        if (!overlay) return;
        overlay.style.backdropFilter       = 'blur(' + cfg.bgBlur + 'px) saturate(1.4)';
        overlay.style.webkitBackdropFilter = 'blur(' + cfg.bgBlur + 'px) saturate(1.4)';
        overlay.style.background           = 'rgba(0,0,0,' + (cfg.bgDark / 100) + ')';
        if (soundDock) {
            soundDock.style.setProperty('--tamanho-nuvem', cfg.soundSize + 'px');
            soundDock.style.gap       = cfg.soundGap + 'px';
            soundDock.style.marginTop = cfg.soundOffsetY + 'px';
        }
        if (gameTitle) {
            gameTitle.style.fontSize      = cfg.titleSize + 'rem';
            gameTitle.style.letterSpacing = cfg.titleSpacing + 'px';
            gameTitle.style.marginTop     = cfg.titleOffsetY + 'px';
        }
    }

    function buildConfigPanel() {
        const cfg = _cfgState;

        const tab = document.createElement('div');
        tab.id    = 'glConfigTab';
        tab.classList.add('cfg-hidden'); /* invisível por defeito */

        const toggle = document.createElement('button');
        toggle.id    = 'glConfigToggle';
        toggle.innerHTML = '<span class="cfg-icon">⚙</span>EDITOR';

        const panel = document.createElement('div');
        panel.id    = 'glConfigPanel';

        const inner = document.createElement('div');
        inner.id    = 'glConfigInner';

        inner.innerHTML = `
            <div class="cfg-panel-title">⚙ Config</div>
            <div class="cfg-section">
                <div class="cfg-section-label">🔊 Sons do jogo</div>
                <div class="cfg-row">
                    <span class="cfg-label">Tamanho</span>
                    <input class="cfg-slider" type="range" id="cfgSoundSize" min="16" max="52" step="1" value="${cfg.soundSize}">
                    <span class="cfg-value" id="cfgSoundSizeVal">${cfg.soundSize}px</span>
                </div>
                <div class="cfg-row">
                    <span class="cfg-label">Espaço</span>
                    <input class="cfg-slider" type="range" id="cfgSoundGap" min="0" max="24" step="1" value="${cfg.soundGap}">
                    <span class="cfg-value" id="cfgSoundGapVal">${cfg.soundGap}px</span>
                </div>
                <div class="cfg-row">
                    <span class="cfg-label">Posição Y</span>
                    <input class="cfg-slider" type="range" id="cfgSoundOffsetY" min="-20" max="20" step="1" value="${cfg.soundOffsetY}">
                    <span class="cfg-value" id="cfgSoundOffsetYVal">${cfg.soundOffsetY}px</span>
                </div>
            </div>
            <div class="cfg-section">
                <div class="cfg-section-label">🏷 Título</div>
                <div class="cfg-row">
                    <span class="cfg-label">Tamanho</span>
                    <input class="cfg-slider" type="range" id="cfgTitleSize" min="0.2" max="1.4" step="0.05" value="${cfg.titleSize}">
                    <span class="cfg-value" id="cfgTitleSizeVal">${cfg.titleSize}rem</span>
                </div>
                <div class="cfg-row">
                    <span class="cfg-label">Espaçamento</span>
                    <input class="cfg-slider" type="range" id="cfgTitleSpacing" min="0" max="14" step="0.5" value="${cfg.titleSpacing}">
                    <span class="cfg-value" id="cfgTitleSpacingVal">${cfg.titleSpacing}px</span>
                </div>
                <div class="cfg-row">
                    <span class="cfg-label">Posição Y</span>
                    <input class="cfg-slider" type="range" id="cfgTitleOffsetY" min="-16" max="16" step="1" value="${cfg.titleOffsetY}">
                    <span class="cfg-value" id="cfgTitleOffsetYVal">${cfg.titleOffsetY}px</span>
                </div>
            </div>
            <div class="cfg-section">
                <div class="cfg-section-label">🌫 Fundo</div>
                <div class="cfg-row">
                    <span class="cfg-label">Blur</span>
                    <input class="cfg-slider" type="range" id="cfgBgBlur" min="0" max="40" step="1" value="${cfg.bgBlur}">
                    <span class="cfg-value" id="cfgBgBlurVal">${cfg.bgBlur}px</span>
                </div>
                <div class="cfg-row">
                    <span class="cfg-label">Escuridão</span>
                    <input class="cfg-slider" type="range" id="cfgBgDark" min="0" max="90" step="1" value="${cfg.bgDark}">
                    <span class="cfg-value" id="cfgBgDarkVal">${cfg.bgDark}%</span>
                </div>
            </div>
            <div style="padding: 0 16px;">
                <button class="cfg-reset" id="cfgResetBtn">↺ Repor defaults</button>
            </div>
            <div class="cfg-footer">Temporário — reset ao recarregar a página.</div>
        `;

        panel.appendChild(inner);
        tab.appendChild(toggle);
        tab.appendChild(panel);
        document.body.appendChild(tab);

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.classList.toggle('cfg-open');
        });
        document.addEventListener('click', (e) => {
            if (!tab.contains(e.target)) panel.classList.remove('cfg-open');
        });

        function bindSlider(id, valId, unit, key, decimals) {
            const slider = document.getElementById(id);
            const valEl  = document.getElementById(valId);
            if (!slider || !valEl) return;
            slider.addEventListener('input', () => {
                const v = parseFloat(slider.value);
                _cfgState[key] = v;
                valEl.textContent = v.toFixed(decimals) + unit;
                cfgApply(_cfgState);
            });
        }

        bindSlider('cfgSoundSize',    'cfgSoundSizeVal',    'px',  'soundSize',    0);
        bindSlider('cfgSoundGap',     'cfgSoundGapVal',     'px',  'soundGap',     0);
        bindSlider('cfgSoundOffsetY', 'cfgSoundOffsetYVal', 'px',  'soundOffsetY', 0);
        bindSlider('cfgTitleSize',    'cfgTitleSizeVal',    'rem', 'titleSize',    2);
        bindSlider('cfgTitleSpacing', 'cfgTitleSpacingVal', 'px',  'titleSpacing', 1);
        bindSlider('cfgTitleOffsetY', 'cfgTitleOffsetYVal', 'px',  'titleOffsetY', 0);
        bindSlider('cfgBgBlur',       'cfgBgBlurVal',       'px',  'bgBlur',       0);
        bindSlider('cfgBgDark',       'cfgBgDarkVal',       '%',   'bgDark',       0);

        document.getElementById('cfgResetBtn').addEventListener('click', () => {
            Object.assign(_cfgState, CFG_DEFAULTS);
            cfgApply(_cfgState);
            const map = {
                cfgSoundSize:    [_cfgState.soundSize,    'px',  0],
                cfgSoundGap:     [_cfgState.soundGap,     'px',  0],
                cfgSoundOffsetY: [_cfgState.soundOffsetY, 'px',  0],
                cfgTitleSize:    [_cfgState.titleSize,    'rem', 2],
                cfgTitleSpacing: [_cfgState.titleSpacing, 'px',  1],
                cfgTitleOffsetY: [_cfgState.titleOffsetY, 'px',  0],
                cfgBgBlur:       [_cfgState.bgBlur,       'px',  0],
                cfgBgDark:       [_cfgState.bgDark,       '%',   0],
            };
            Object.entries(map).forEach(([id, [val, unit, dec]]) => {
                const sl = document.getElementById(id);
                const vl = document.getElementById(id + 'Val');
                if (sl) sl.value = val;
                if (vl) vl.textContent = val.toFixed(dec) + unit;
            });
        });

        window._cfgTogglePanel = function () {
            const isHidden = tab.classList.toggle('cfg-hidden');
            if (isHidden) panel.classList.remove('cfg-open');
        };
    }

    /* ── Cards ── */
    function bindCardClicks() {
        document.addEventListener('click', function (e) {
            GAME_REGISTRY.forEach(game => {
                const card = e.target.closest('#' + game.id);
                if (!card) return;
                if (card.classList.contains('gz-card-placeholder')) return;
                const sfx = document.getElementById('sfxStart');
                if (sfx) { try { const c = sfx.cloneNode(); c.volume = 0.02; c.play().catch(() => {}); } catch(e) {} }
                openGame(game.src, game.title);
            });
        });
    }

    /* ── API Pública ── */
    window._gameLauncher = {
        open:  openGame,
        close: closeGame,
        register: function (id, title, src) {
            if (!GAME_REGISTRY.find(g => g.id === id)) {
                GAME_REGISTRY.push({ id, title, src });
            }
        }
    };


    /* ── Parallax — envia coords do rato para o iframe ──────────────────
       O #gameLaunchOverlay cobre o ecrã inteiro quando o jogo está aberto.
       Capturamos o rato aqui (no pai) e enviamos coords normalizadas
       (-1 a +1) ao iframe via postMessage, para que o parallax funcione
       em toda a área do ecrã e não apenas dentro do canvas.
    ────────────────────────────────────────────────────────────────── */
    function initParallaxRelay() {
        overlay.addEventListener('mousemove', (e) => {
            if (!frame || !frame.contentWindow) return;
            const r = overlay.getBoundingClientRect();
            const nx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
            const ny = ((e.clientY - r.top)  / r.height - 0.5) * 2;
            try {
                frame.contentWindow.postMessage({ tipo: 'PARALLAX_MOUSE', nx, ny }, '*');
            } catch(e) {}
        });
        overlay.addEventListener('mouseleave', () => {
            if (!frame || !frame.contentWindow) return;
            try {
                frame.contentWindow.postMessage({ tipo: 'PARALLAX_MOUSE', nx: 0, ny: 0 }, '*');
            } catch(e) {}
        });
    }
    /* ── Lê as cores do tema activo directamente dos CSS vars ── */
    // IMPORTANTE: as vars de tema são definidas em body.theme-X, NÃO em :root.
    // Por isso usa-se getComputedStyle(document.body) e não documentElement.
    function getThemeColors() {
        const cs = getComputedStyle(document.body);
        return {
            borda:  cs.getPropertyValue('--cor-borda-principal').trim() || '#283593',
            sombra: cs.getPropertyValue('--cor-sombra').trim()          || '#b71c1c',
        };
    }

    /* ── Envia o tema actual ao iframe (se estiver aberto) ── */
    function sendThemeToFrame() {
        if (!frame || !frame.contentWindow) return;
        if (!frame.src || frame.src === 'about:blank') return;
        const { borda, sombra } = getThemeColors();
        try {
            frame.contentWindow.postMessage({ tipo: 'MUDAR_TEMA', borda, sombra }, '*');
        } catch(err) {}
    }

    // Envia browserId e sigName ao iframe (localStorage não é partilhado cross-frame)
    function sendUserInfoToFrame() {
        if (!frame || !frame.contentWindow) return;
        if (!frame.src || frame.src === 'about:blank') return;
        try {
            const bid  = localStorage.getItem('sig_browser_id') || null;
            const name = localStorage.getItem('sig_name')       || null;
            frame.contentWindow.postMessage({ tipo: 'FN_USER_INFO', bid, name }, '*');
        } catch(err) {}
    }

    /* ── Envia o idioma actual ao iframe (se estiver aberto) ── */
    const _fnFallbacks = {
        fnPlay: 'PLAY', fnLeaderboard: 'LEADERBOARDS', fnBack: 'BACK',
        fnMenu: 'MENU', fnPause: 'PAUSE', fnResume: 'RESUME',
        fnRestart: '↺ RESTART', fnRestartConfirm: 'SURE?', fnPlayAgain: 'PLAY AGAIN',
        fnHsNotice: '⭐ High score updated!', fnScoreLabel: 'SCORE',
        fnFinalScore: 'SCORE', fnBestScore: 'BEST', fnLoading: 'LOADING...',
        fnNoRecords: 'No records yet', fnLeaderTitle: 'LEADERBOARD', fnHints: 'WATCH OUT FOR BOMBS'
    };
    function sendLangToFrame() {
        if (!frame || !frame.contentWindow) return;
        if (!frame.src || frame.src === 'about:blank') return;
        const t = {};
        Object.keys(_fnFallbacks).forEach(function(k) {
            const val = window._i18n && window._i18n.get(k);
            // só usa o valor do i18n se for diferente da chave (ou seja, foi mesmo traduzido)
            t[k] = (val && val !== k) ? val : _fnFallbacks[k];
        });
        try { frame.contentWindow.postMessage({ tipo: 'FN_SET_LANG', t }, '*'); } catch(err) {}
    }

    // Registar hook para o i18n notificar quando o idioma muda
    window._fnSyncLang = function() { sendLangToFrame(); };

    /* ── Listener permanente para mensagens do iframe ── */
    window.addEventListener('message', (e) => {
        if (!e.data || !e.data.tipo) return;
        if (e.data.tipo === 'FECHAR_JOGO') closeGame();
        // O iframe pede o tema assim que os seus scripts estão prontos —
        // responde-se directamente ao remetente para garantir entrega.
        if (e.data.tipo === 'PEDIR_TEMA') {
            const { borda, sombra } = getThemeColors();
            try { e.source.postMessage({ tipo: 'MUDAR_TEMA', borda, sombra }, '*'); } catch(err) {}
            sendLangToFrame();
        }

        if (e.data.tipo === 'PEDIR_USER_INFO') {
            try {
                const bid  = localStorage.getItem('sig_browser_id') || null;
                const name = localStorage.getItem('sig_name')       || null;
                e.source.postMessage({ tipo: 'FN_USER_INFO', bid, name }, '*');
            } catch(err) {}
        }

        // ── Fruit Ninja Firebase bridge ──────────────────────────────────
        if (e.data.tipo === 'FN_GET_SCORE' || e.data.tipo === 'FN_SET_SCORE' || e.data.tipo === 'FN_GET_LEADERBOARD') {
            const _msg = e.data;
            const _src = e.source;
            console.log('[FN bridge] recebido:', _msg.tipo, 'id:', _msg.id, 'bid:', _msg.bid);
            (async () => {
                // Esperar Firebase ficar pronto
                if (!window._sigFirebaseReady) {
                    console.log('[FN bridge] a aguardar Firebase...');
                    await new Promise(resolve => {
                        document.addEventListener('sig-firebase-ready', resolve, { once: true });
                        setTimeout(resolve, 8000);
                    });
                }
                console.log('[FN bridge] Firebase pronto. _fnGetScore:', typeof window._fnGetScore, '_fnSetScore:', typeof window._fnSetScore);
                try {
                    if (_msg.tipo === 'FN_GET_SCORE') {
                        const value = typeof window._fnGetScore === 'function'
                            ? await window._fnGetScore(_msg.bid)
                            : null;
                        console.log('[FN bridge] GET_SCORE resultado:', value);
                        _src.postMessage({ tipo: 'FN_RESP', id: _msg.id, value }, '*');
                    }
                    else if (_msg.tipo === 'FN_SET_SCORE') {
                        console.log('[FN bridge] SET_SCORE bid:', _msg.bid, 'score:', _msg.score);
                        if (typeof window._fnSetScore === 'function') {
                            await window._fnSetScore(_msg.bid, _msg.score);
                            console.log('[FN bridge] SET_SCORE guardado com sucesso');
                        } else {
                            console.warn('[FN bridge] _fnSetScore não existe!');
                        }
                        _src.postMessage({ tipo: 'FN_RESP', id: _msg.id, value: true }, '*');
                    }
                    else if (_msg.tipo === 'FN_GET_LEADERBOARD') {
                        const value = typeof window._fnGetLeaderboard === 'function'
                            ? await window._fnGetLeaderboard()
                            : [];
                        console.log('[FN bridge] GET_LEADERBOARD entradas:', value.length);
                        _src.postMessage({ tipo: 'FN_RESP', id: _msg.id, value }, '*');
                    }
                } catch(err) {
                    console.error('[FN bridge] ERRO:', err);
                    try { _src.postMessage({ tipo: 'FN_RESP', id: _msg.id, value: null }, '*'); } catch(_) {}
                }
            })();
        }
    });

    /* ── Observar mudanças de tema no body e reenviar ao iframe ── */
    (function watchTheme() {
        const observer = new MutationObserver(() => sendThemeToFrame());
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    })();

    /* ── Init ── */
    function init() {
        buildDOM();
        buildConfigPanel();
        bindCardClicks();
        initParallaxRelay();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
