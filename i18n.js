// =========================================
// i18n.js — Sistema de Tradução / Translation System
// Idiomas / Languages: en (British English) · pt (Português — Portugal)
// Carregar DEPOIS de todos os outros scripts / Load AFTER all other scripts
// =========================================

(function () {

    // ══════════════════════════════════════════════════════════
    // DICIONÁRIOS / DICTIONARIES
    // ══════════════════════════════════════════════════════════
    const TRANSLATIONS = {

        // ─────────────────────────────────────────────────────
        // ENGLISH (British) — original
        // ─────────────────────────────────────────────────────
        en: {
            days:   ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

            bio: "Helloo! I'm known online as Caravela, and I'm a 24-year-old guy. I adore Anime, Movies, Video Games, Nature, Animals, and my Computer. Feel free to reach out.",

            seeMore: 'SEE MORE',

            themeDefault: 'Blue / Red',
            themeEmerald: 'Emerald / Gold',
            themeMono:    'Mono / Black and White',

            nightMode: 'Night Mode',

            snowHint:   'Type "snow" \u2744',
            springHint: 'Type "spring" \u2600',
            autumnHint: 'Type "autumn" \uD83C\uDF42',
            summerHint: 'Type "summer" \uD83C\uDF0A',

            playerPlay:    'Play / Stop',
            playerStopped: 'Stopped',
            playerPlaying: 'Playing',
            seekHint:      '\u21D5 scroll',

            sigIdlePhrases:     ['Write your name...', 'Sign this website...'],
            sigThankYou:        'Thank you!',
            sigWelcomeBack:     'Welcome back',
            sigMenuShowAll:     'Show all signatures',
            sigMenuEdit:        'Edit my signature',
            sigMenuHideRefresh: 'Hide until refresh',
            sigMenuToggleGames: 'Collapse Games',
            sigMenuToggleGamesOn: 'Attach Games',
            sigEditTitle:       'Edit Signature',
            sigEditPlaceholder: 'New name...',
            sigEditCancel:      'Cancel',
            sigEditSave:        'Save',
            sigNoResults:       'NO SIGNATURES FOUND',
            sigLoading:         'LOADING...',
            sigSearchPlaceholder: 'Search...',
            sigSectionTitle:    'SIGNATURES',
            sigBackBtn:         '\u2190 BACK',
            sigBackBtnTitle:    'Back',

            sigSeasonTitle:     'That\'s a season code!',
            sigSeasonSub:       'Season effects go on the page, not here. Write your actual name. If this is your name, use a variation and edit it later.',

            physicsHint:      'Drag and throw! \uD83C\uDF89',
            profileClickHint: '\uD83D\uDDB1 CLICK',

            tickerText: 'NEVER GIVE UP \u2605 GO GO PORTUGAL \u2605 WATCH BABYLON \u2605 INVEST \u2605 PLAY SILENT HILL 3 \u2605 CREATE \u2605 BUILD \u2605 BE HAPPY \u2605 NOTHING MATTERS \u2605 JUST DO IT \u2605 BE SMART \u2605 WATCH YOFUKASHI NO UTA \u2605 PIRATE \u2605 MOD \u2605 BE FREE',

            eyeBtnTitle:     'Hide/Show UI',
            shuffleBtnTitle: 'Change Background',
            rainBtnTitle:    'Toggle Rain',
            dryerBtnTitle:   'Toggle Dryer',
            windBtnTitle:    'Toggle Wind',

            modPanelTooltip:    '\u26A1 Mod Panel',
            modTitleModeration: '\u26A1 Moderation',
            modBtnSnowHint:     '\u2744 Force Snow Notice',
            modBtnSpringHint:   '\u2600 Force Spring Notice',
            modBtnAutumnHint:   '\uD83C\uDF42 Force Autumn Notice',
            modBtnSummerHint:   '\uD83C\uDF0A Force Summer Notice',
            modTitleImages:     '\uD83D\uDDBC Images (Temp.)',
            modBtnDarkBg:       '\uD83C\uDF03 Dark Background',
            modBtnLightBg:      '\u2600\uFE0F Light Background',
            modBtnProfile:      '\uD83D\uDC64 Profile',
            modTitleSignature:  '\u270D Signature',
            modBtnForceSigs:    '\uD83D\uDCDC Force Show Signatures',
            modBtnResetSig:     '\uD83D\uDDD1 Reset Signature State',
            modBtnResetDone:    '\u2705 Reset!',

            // ── Suika Game ──
            suikaSectionTitle:   'SUIKA',
            suikaLbBtn:          '\uD83C\uDFC6 LEADERBOARD',
            suikaYouLose:        'YOU LOSE!',
            suikaPlayAgain:      '\u21BA PLAY AGAIN',
            suikaHsNotice:       '\u2B50 High score updated!',
            suikaLbTitle:        'LEADERBOARD',
            suikaLbSearch:       '\uD83D\uDD0D Search player...',
            suikaLbClose:        '\u2715 CLOSE',
            suikaScoreLabel:     'SCORE',
            suikaNextLabel:      'NEXT',
            suikaRestart:        '\u21BA RESTART',
            suikaRestartConfirm: 'SURE?',
            suikaBack:           '\u2190 BACK',
            suikaBackTitle:      'Back',
            gzBack:              '\u2190 BACK',
            suikaLbLoading:      'Loading...',
            suikaLbEmpty:        'No results found.',
            gamesTitle:          'Games!',
            suikaBannerPhrases:  ['Try my Suika game', 'Challenge the leaderboards', 'Have fun, and play Suika', 'We have Fruit Ninja!', 'Wanna play a game?'],

            // ── Fruit Ninja ──
            fnPlay:              'PLAY',
            fnLeaderboard:       'LEADERBOARDS',
            fnBack:              'BACK',
            fnMenu:              'MENU',
            fnPause:             'PAUSE',
            fnResume:            '▶ RESUME',
            fnRestart:           '↺ RESTART',
            fnRestartConfirm:    'SURE?',
            fnPlayAgain:         'PLAY AGAIN',
            fnHsNotice:          '🏆 NEW RECORD!',
            fnScoreLabel:        'SCORE',
            fnFinalScore:        'SCORE',
            fnBestScore:         'BEST',
            fnLoading:           'LOADING...',
            fnNoRecords:         'NO RECORDS YET',
            fnLeaderTitle:       'LEADERBOARD',
            fnHints: [
                'CLICK AND SLASH!',
                'ARE YOU HUNGRY?',
                'COMBOS = MORE POINTS',
                'WATCH OUT FOR BOMBS',
                'THE FASTER THE BETTER',
                "DON'T LET ANY FALL!",
            ],
        },

        // ─────────────────────────────────────────────────────
        // PORTUGUÊS (Portugal)
        // ─────────────────────────────────────────────────────
        pt: {
            days:   ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'S\u00E1b'],
            months: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                     'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],

            bio: 'Ol\u00E1! Sou conhecido online como Caravela, tenho 24 anos. Adoro Anime, Filmes, Videojogos, Natureza, Animais e o meu Computador. Fica \u00E0 vontade para entrar em contacto.',

            seeMore: 'VER MAIS',

            themeDefault: 'Azul / Vermelho',
            themeEmerald: 'Esmeralda / Dourado',
            themeMono:    'Mono / Preto e Branco',

            nightMode: 'Modo Nocturno',

            snowHint:   'Escreve "snow" \u2744',
            springHint: 'Escreve "spring" \u2600',
            autumnHint: 'Escreve "autumn" \uD83C\uDF42',
            summerHint: 'Escreve "summer" \uD83C\uDF0A',

            playerPlay:    'Reproduzir / Parar',
            playerStopped: 'Parado',
            playerPlaying: 'A Tocar',
            seekHint:      '\u21D5 D\u00E1 Scroll',

            sigIdlePhrases:     ['Escreve o teu nome...', 'Assina este website...'],
            sigThankYou:        'Obrigado!',
            sigWelcomeBack:     'Bem-vindo de volta',
            sigMenuShowAll:     'Ver todas as assinaturas',
            sigMenuEdit:        'Editar a minha assinatura',
            sigMenuHideRefresh: 'Esconder at\u00E9 recarregar',
            sigMenuToggleGames: 'Colapsar Jogos',
            sigMenuToggleGamesOn: 'Anexar Jogos',
            sigEditTitle:       'Editar Assinatura',
            sigEditPlaceholder: 'Novo nome...',
            sigEditCancel:      'Cancelar',
            sigEditSave:        'Guardar',
            sigNoResults:       'NENHUMA ASSINATURA ENCONTRADA',
            sigLoading:         'A CARREGAR...',
            sigSearchPlaceholder: 'Pesquisar...',
            sigSectionTitle:    'ASSINATURAS',
            sigBackBtn:         '\u2190 VOLTAR',
            sigBackBtnTitle:    'Voltar',

            sigSeasonTitle:     'Isso \u00e9 um c\u00f3digo de esta\u00e7\u00e3o!',
            sigSeasonSub:       'Os efeitos de esta\u00e7\u00e3o activam-se na p\u00e1gina, n\u00e3o aqui. Escreve o teu nome. Se este for mesmo o teu nome, usa uma varia\u00e7\u00e3o e edita depois.',

            physicsHint:      'Arrasta e atira! \uD83C\uDF89',
            profileClickHint: '\uD83D\uDDB1 CLICAR',

            tickerText: 'NUNCA DESISTAS \u2605 FOR\u00C7A PORTUGAL \u2605 V\u00CA BABYLON \u2605 INVESTE \u2605 JOGA SILENT HILL 3 \u2605 CRIA \u2605 CONSTR\u00D3I \u2605 S\u00CA FELIZ \u2605 NADA IMPORTA \u2605 JUST DO IT \u2605 S\u00CA INTELIGENTE \u2605 V\u00CA YOFUKASHI NO UTA \u2605 PIRATA \u2605 MOD \u2605 S\u00CA LIVRE',

            eyeBtnTitle:     'Esconder/Mostrar Interface',
            shuffleBtnTitle: 'Mudar Fundo',
            rainBtnTitle:    'Ligar/Desligar Chuva',
            dryerBtnTitle:   'Ligar/Desligar Secador',
            windBtnTitle:    'Ligar/Desligar Vento',

            modPanelTooltip:    '\u26A1 Painel Mod',
            modTitleModeration: '\u26A1 Modera\u00E7\u00E3o',
            modBtnSnowHint:     '\u2744 For\u00E7ar Aviso Neve',
            modBtnSpringHint:   '\u2600 For\u00E7ar Aviso Primavera',
            modBtnAutumnHint:   '\uD83C\uDF42 For\u00E7ar Aviso Outono',
            modBtnSummerHint:   '\uD83C\uDF0A For\u00E7ar Aviso Ver\u00E3o',
            modTitleImages:     '\uD83D\uDDBC Imagens (Temp.)',
            modBtnDarkBg:       '\uD83C\uDF03 Fundo Escuro',
            modBtnLightBg:      '\u2600\uFE0F Fundo Claro',
            modBtnProfile:      '\uD83D\uDC64 Perfil',
            modTitleSignature:  '\u270D Assinatura',
            modBtnForceSigs:    '\uD83D\uDCDC For\u00E7ar Assinaturas',
            modBtnResetSig:     '\uD83D\uDDD1 Redefinir Assinatura',
            modBtnResetDone:    '\u2705 Redefinido!',

            // ── Suika Game ──
            suikaSectionTitle:   'SUIKA',
            suikaLbBtn:          '\uD83C\uDFC6 RANKING',
            suikaYouLose:        'PERDESTE!',
            suikaPlayAgain:      '\u21BA JOGAR DE NOVO',
            suikaHsNotice:       '\u2B50 Recorde batido!',
            suikaLbTitle:        'RANKING',
            suikaLbSearch:       '\uD83D\uDD0D Pesquisar jogador...',
            suikaLbClose:        '\u2715 FECHAR',
            suikaScoreLabel:     'PONTOS',
            suikaNextLabel:      'PR\u00D3X.',
            suikaRestart:        '\u21BA REINICIAR',
            suikaRestartConfirm: 'MESMO?',
            suikaBack:           '\u2190 VOLTAR',
            suikaBackTitle:      'Voltar',
            gzBack:              '\u2190 VOLTAR',
            suikaLbLoading:      'A carregar...',
            suikaLbEmpty:        'Sem resultados.',
            gamesTitle:          'Jogos!',
            suikaBannerPhrases:  ['Joga o meu Suika', 'Desafia o ranking', 'Divirte-te no Suika', 'Nós temos Fruit Ninja!', 'Queres jogar um jogo?'],

            // ── Fruit Ninja ──
            fnPlay:              'JOGAR',
            fnLeaderboard:       'LEADERBOARDS',
            fnBack:              'VOLTAR',
            fnMenu:              'MENU',
            fnPause:             'PAUSA',
            fnResume:            '▶ CONTINUAR',
            fnRestart:           '↺ REINICIAR',
            fnRestartConfirm:    'MESMO?',
            fnPlayAgain:         'JOGAR DE NOVO',
            fnHsNotice:          '🏆 NOVO RECORDE!',
            fnScoreLabel:        'SCORE',
            fnFinalScore:        'PONTUAÇÃO',
            fnBestScore:         'RECORDE',
            fnLoading:           'A CARREGAR...',
            fnNoRecords:         'SEM RECORDES AINDA',
            fnLeaderTitle:       'LEADERBOARD',
            fnHints: [
                'CLICA E DESLIZA!',
                'ESTÁS COM FOME?',
                'COMBOS = MAIS PONTOS',
                'CUIDADO COM AS BOMBAS',
                'QUANTO MAIS RÁPIDO MELHOR',
                'NÃO DEIXES CAIR NENHUMA!',
            ],
        }
    };

    // ══════════════════════════════════════════════════════════
    // STATE — English is always the default.
    // Only switch to PT if the user explicitly saved 'pt'.
    // ══════════════════════════════════════════════════════════
    let currentLang = 'en';
    try {
        if (localStorage.getItem('hub_lang') === 'pt') currentLang = 'pt';
    } catch (e) {}

    window._i18n = {
        get:     function (key) { return (TRANSLATIONS[currentLang] || {})[key] || (TRANSLATIONS.en || {})[key] || key; },
        getLang: function ()    { return currentLang; }
    };

    // ══════════════════════════════════════════════════════════
    // CLOCK
    // ──────────────────────────────────────────────────────────
    // main.js has its own setInterval(updateClock, 1000) with hardcoded
    // EN day/month arrays inside a closed IIFE — we can't stop it.
    //
    // Definitive fix: use a MutationObserver on #clockDate.
    // Whenever main.js writes an EN day name into the element we
    // immediately overwrite it with the correct PT value.
    // This fires synchronously within the same JS microtask, so the
    // user never sees the English text — no flicker, no race condition.
    // ══════════════════════════════════════════════════════════
    var _clockObserver = null;

    function buildDateString(tr, now) {
        return tr.days[now.getDay()] + ' ' +
               now.getDate()        + ' ' +
               tr.months[now.getMonth()] + ' ' +
               now.getFullYear();
    }

    function tickClock() {
        const tr  = TRANSLATIONS[currentLang];
        const now = new Date();
        const h   = now.getHours()  .toString().padStart(2, '0');
        const m   = now.getMinutes().toString().padStart(2, '0');
        const s   = now.getSeconds().toString().padStart(2, '0');
        const timeEl = document.getElementById('clockTime');
        const dateEl = document.getElementById('clockDate');
        if (timeEl) timeEl.textContent = h + ':' + m + ':' + s;
        if (dateEl) dateEl.textContent = buildDateString(tr, now);
    }

    function patchClock() {
        const dateEl = document.getElementById('clockDate');

        if (dateEl && window.MutationObserver) {
            // EN day names that main.js may write — detect any of them
            const EN_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

            _clockObserver = new MutationObserver(function (mutations) {
                // Only act when we're in PT mode — EN writes are fine as-is
                if (currentLang === 'en') return;

                for (var i = 0; i < mutations.length; i++) {
                    var text = dateEl.textContent || '';
                    // If any EN day token appears, it means main.js just wrote it
                    var needsFix = EN_DAYS.some(function (d) { return text.indexOf(d) !== -1; });
                    if (needsFix) {
                        // Disconnect briefly to avoid infinite loop from our own write
                        _clockObserver.disconnect();
                        dateEl.textContent = buildDateString(TRANSLATIONS.pt, new Date());
                        _clockObserver.observe(dateEl, { childList: true, characterData: true, subtree: true });
                    }
                }
            });

            _clockObserver.observe(dateEl, { childList: true, characterData: true, subtree: true });
        }

        // Still run our own interval so the clock works independently
        setInterval(tickClock, 1000);
        tickClock();
    }

    // ══════════════════════════════════════════════════════════
    // APPLY TRANSLATIONS
    // ══════════════════════════════════════════════════════════
    function applyTranslations(lang) {
        const t = TRANSLATIONS[lang];
        if (!t) return;

        document.documentElement.lang = lang === 'pt' ? 'pt' : 'en';

        const bioEl = document.querySelector('p.bio');
        if (bioEl) bioEl.textContent = t.bio;

        document.querySelectorAll('.links-section .visita-mais-header').forEach(function (el) {
            el.textContent = t.seeMore;
        });

        ['default','emerald','mono'].forEach(function (theme) {
            const el = document.querySelector('.theme-dot[data-theme="' + theme + '"]');
            const key = 'theme' + theme.charAt(0).toUpperCase() + theme.slice(1);
            if (el) el.title = t[key];
        });

        const moonBtn = document.getElementById('moonBtn');
        if (moonBtn) moonBtn.title = t.nightMode;

        ['snowHint','springHint','autumnHint','summerHint'].forEach(function (id) {
            const el = document.getElementById(id);
            if (el) el.textContent = t[id];
        });

        const toggleBtn = document.getElementById('vhsToggleBtn');
        if (toggleBtn) toggleBtn.title = t.playerPlay;

        const vhsHint = document.getElementById('vhsHint');
        if (vhsHint && !vhsHint.classList.contains('dismissed')) vhsHint.textContent = t.seekHint;

        const statusEl = document.getElementById('vhsStatusText');
        if (statusEl) {
            statusEl.textContent = statusEl.classList.contains('playing')
                ? t.playerPlaying : t.playerStopped;
        }

        ['sigMenuShowAll','sigMenuEdit','sigMenuHideRefresh'].forEach(function (id) {
            const el = document.getElementById(id);
            if (el) el.textContent = t[id];
        });

        const toggleGamesBtn = document.getElementById('sigMenuToggleGames');
        if (toggleGamesBtn) {
            const isCollapsed = localStorage.getItem('suika_banner_collapsed') === '1';
            toggleGamesBtn.textContent = isCollapsed ? t.sigMenuToggleGamesOn : t.sigMenuToggleGames;
        }

        const editTitle   = document.querySelector('.sig-edit-title');
        const editInput   = document.getElementById('sigEditInput');
        const editCancel  = document.getElementById('sigEditCancel');
        const editConfirm = document.getElementById('sigEditConfirm');
        if (editTitle)   editTitle.textContent   = t.sigEditTitle;
        if (editInput)   editInput.placeholder   = t.sigEditPlaceholder;
        if (editCancel)  editCancel.textContent  = t.sigEditCancel;
        if (editConfirm) editConfirm.textContent = t.sigEditSave;

        const sigSearch   = document.getElementById('sigSearch');
        const sigCloseBtn = document.getElementById('sigCloseBtn');
        const sigHeader   = document.querySelector('.signatures-section .visita-mais-header');
        if (sigSearch)   sigSearch.placeholder = t.sigSearchPlaceholder;
        if (sigCloseBtn) { sigCloseBtn.textContent = t.sigBackBtn; sigCloseBtn.title = t.sigBackBtnTitle; }
        if (sigHeader)   sigHeader.textContent  = t.sigSectionTitle;

        const physHint = document.getElementById('physics-hint');
        if (physHint) physHint.textContent = t.physicsHint;

        applyProfileClickHint(t.profileClickHint);

        document.querySelectorAll('.ticker-item').forEach(function (el) { el.textContent = t.tickerText; });

        const btnMap = {
            eyeBtn: 'eyeBtnTitle', bgShuffleBtn: 'shuffleBtnTitle',
            rainBtn: 'rainBtnTitle', dryerBtn: 'dryerBtnTitle', windBtn: 'windBtnTitle'
        };
        Object.keys(btnMap).forEach(function (id) {
            const el = document.getElementById(id);
            if (el) el.title = t[btnMap[id]];
        });

        const modTooltip = document.querySelector('.mod-tab-tooltip');
        if (modTooltip) modTooltip.textContent = t.modPanelTooltip;

        const modTitles = document.querySelectorAll('.mod-tab-title');
        if (modTitles[0]) modTitles[0].textContent = t.modTitleModeration;
        if (modTitles[1]) modTitles[1].textContent = t.modTitleImages;
        if (modTitles[2]) modTitles[2].textContent = t.modTitleSignature;

        const modBtnMap = {
            modBtnForceSnowHint:   'modBtnSnowHint',
            modBtnForceSpringHint: 'modBtnSpringHint',
            modBtnForceAutumnHint: 'modBtnAutumnHint',
            modBtnForceSummerHint: 'modBtnSummerHint',
            modBtnForceSigs:       'modBtnForceSigs'
        };
        Object.keys(modBtnMap).forEach(function (id) {
            const el = document.getElementById(id);
            if (el) el.textContent = t[modBtnMap[id]];
        });

        const imgLabels = document.querySelectorAll('.mod-tab-body label.mod-btn');
        const imgKeys   = ['modBtnDarkBg','modBtnLightBg','modBtnProfile'];
        imgLabels.forEach(function (label, i) {
            if (!imgKeys[i]) return;
            const inp = label.querySelector('input');
            label.textContent = t[imgKeys[i]];
            if (inp) label.appendChild(inp);
        });

        const resetBtn = document.getElementById('modBtnResetSig');
        if (resetBtn && !resetBtn.dataset.i18nFeedback) resetBtn.textContent = t.modBtnResetSig;

        if (window._sigSyncLang) window._sigSyncLang(t.sigIdlePhrases, t.sigThankYou, t.sigWelcomeBack);

        // ── Season popup ──
        const seasonTitle = document.getElementById('sigSeasonPopupTitle');
        const seasonSub   = document.getElementById('sigSeasonPopupSub');
        if (seasonTitle) seasonTitle.textContent = t.sigSeasonTitle;
        if (seasonSub)   seasonSub.textContent   = t.sigSeasonSub;

        // ── Suika Game ──
        if (window._suikaSyncLang) window._suikaSyncLang(t);

        const gamesTitleEl = document.querySelector('.suika-banner-title');
        if (gamesTitleEl) gamesTitleEl.textContent = t.gamesTitle;

        // ── Fruit Ninja ──
        if (window._fnSyncLang) window._fnSyncLang(t);

        const glBackBtn = document.getElementById('glBackBtn');
        if (glBackBtn) glBackBtn.textContent = '\u2190 ' + t.fnBack;

        const gzBackBtn = document.getElementById('gzBackBtn');
        if (gzBackBtn) gzBackBtn.textContent = t.gzBack;
    }

    // ══════════════════════════════════════════════════════════
    // PROFILE CLICK HINT — override the CSS ::after pseudo-element
    // ══════════════════════════════════════════════════════════
    var _profileHintStyle = null;
    function applyProfileClickHint(text) {
        if (!_profileHintStyle) {
            _profileHintStyle = document.createElement('style');
            _profileHintStyle.id = 'i18n-profile-hint';
            document.head.appendChild(_profileHintStyle);
        }
        var safe = (text || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        _profileHintStyle.textContent =
            '.no-signal-wrapper:hover::after { content: "' + safe + '" !important; }';
    }

    // ══════════════════════════════════════════════════════════
    // PLAYER STATUS PATCH
    // ══════════════════════════════════════════════════════════
    function patchPlayerStatus() {
        const toggleBtn = document.getElementById('vhsToggleBtn');
        const statusEl  = document.getElementById('vhsStatusText');
        if (!toggleBtn || !statusEl) return;
        toggleBtn.addEventListener('click', function () {
            setTimeout(function () {
                const tr      = TRANSLATIONS[currentLang];
                const playing = toggleBtn.classList.contains('playing');
                statusEl.textContent = playing ? tr.playerPlaying : tr.playerStopped;
            }, 320);
        });
    }

    // ══════════════════════════════════════════════════════════
    // RESET BUTTON PATCH
    // ══════════════════════════════════════════════════════════
    function patchResetBtn() {
        const resetBtn = document.getElementById('modBtnResetSig');
        if (!resetBtn) return;
        resetBtn.addEventListener('click', function () {
            const tr = TRANSLATIONS[currentLang];
            resetBtn.dataset.i18nFeedback = '1';
            resetBtn.textContent = tr.modBtnResetDone;
            setTimeout(function () {
                delete resetBtn.dataset.i18nFeedback;
                resetBtn.textContent = tr.modBtnResetSig;
            }, 1500);
        });
    }

    // ══════════════════════════════════════════════════════════
    // LANGUAGE TOGGLE — flag image, top-right corner below ticker
    // ══════════════════════════════════════════════════════════
    // =============================================
    // POSICAO DA BANDEIRA -- altera aqui a vontade
    var TOGGLE_TOP   = '44px';  // distancia ao topo   (ex: '52px', '60px')
    var TOGGLE_RIGHT = '6px';   // distancia a direita (ex: '8px',  '14px')
    // =============================================
    var FLAG_EN = 'https://raw.githubusercontent.com/Missiion/Caravela/refs/heads/main/Bandeira_great_britan.png';
    var FLAG_PT = 'https://raw.githubusercontent.com/Missiion/Caravela/refs/heads/main/Bandeira_Portugal.png';

    function createToggle() {
        var btn = document.createElement('button');
        btn.id = 'langToggleBtn';
        btn.setAttribute('aria-label', 'Toggle language / Mudar idioma');

        var s = btn.style;
        s.position       = 'fixed';
        s.top            = TOGGLE_TOP;
        s.right          = TOGGLE_RIGHT;
        s.zIndex         = '300';
        s.background     = 'none';
        s.border         = 'none';
        s.padding        = '0';
        s.cursor         = 'pointer';
        s.opacity        = '0.5';
        s.transition     = 'opacity 0.2s, transform 0.2s';
        s.width          = '20px';   // small – flag proportions ~20×14
        s.height         = '14px';
        s.display        = 'flex';
        s.alignItems     = 'center';
        s.justifyContent = 'center';

        var img = document.createElement('img');
        // No border, no box-shadow — pure clean flag
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
        img.draggable = false;
        btn.appendChild(img);

        function render() {
            img.src   = currentLang === 'en' ? FLAG_EN : FLAG_PT;
            img.alt   = currentLang === 'en' ? 'EN' : 'PT';
            btn.title = currentLang === 'en'
                ? 'Mudar para Portugu\u00EAs'
                : 'Switch to English';
        }

        btn.addEventListener('mouseenter', function () { btn.style.opacity = '1';   btn.style.transform = 'scale(1.15)'; });
        btn.addEventListener('mouseleave', function () { btn.style.opacity = '0.5'; btn.style.transform = 'scale(1)'; });

        btn.addEventListener('click', function () {
            currentLang = currentLang === 'en' ? 'pt' : 'en';
            try { localStorage.setItem('hub_lang', currentLang); } catch (e) {}
            render();
            applyTranslations(currentLang);
            tickClock();   // immediate clock update in new language
            document.dispatchEvent(new CustomEvent('hub-lang-change', { detail: { lang: currentLang } }));
        });

        render();
        document.body.appendChild(btn);
    }

    // ══════════════════════════════════════════════════════════
    // BOOT
    // ══════════════════════════════════════════════════════════
    function boot() {
        createToggle();
        patchClock();
        patchPlayerStatus();
        patchResetBtn();
        applyProfileClickHint(TRANSLATIONS[currentLang].profileClickHint);
        if (currentLang === 'pt') applyTranslations('pt');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();
