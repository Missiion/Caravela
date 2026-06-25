// =========================================
// SIGNATURES.JS
// Requires window._sigSaveToFirebase and
// window._sigLoadFromFirebase (set by the
// inline Firebase module in index.html)
// =========================================

(function () {
    const MAX_CHARS = 16;

    // ── DOM refs ──────────────────────────────
    const idleText        = document.getElementById('sigIdleText');
    const cursor          = document.getElementById('sigCursor');
    const sigInput        = document.getElementById('sigInput');
    const lockedWrap      = document.getElementById('sigLockedWrap');
    const lockedText      = document.getElementById('sigLockedText');
    const sigMenu         = document.getElementById('sigMenu');
    const sigTrap         = document.getElementById('sigTrap');
    const editPopup       = document.getElementById('sigEditPopup');
    const editInput       = document.getElementById('sigEditInput');
    const editCancel      = document.getElementById('sigEditCancel');
    const editConfirm     = document.getElementById('sigEditConfirm');
    const sigZone         = document.getElementById('signatureZone');
    const seasonPopup     = document.getElementById('sigSeasonPopup');
    const seasonPopupOk   = document.getElementById('sigSeasonPopupOk');
    const seasonPopupSub  = document.getElementById('sigSeasonPopupSub');
    const seasonPopupTitle= document.getElementById('sigSeasonPopupTitle');

    // Season codes that are blocked from being used as signatures
    const SEASON_CODES = ['spring', 'snow', 'autumn', 'summer'];
    const menuEdit        = document.getElementById('sigMenuEdit');
    const menuHideRefresh = document.getElementById('sigMenuHideRefresh');
    const menuItems       = sigMenu.querySelectorAll('.sig-menu-item');

    const linksSection      = document.querySelector('.links-section');
    const signaturesSection = document.getElementById('signaturesSection');
    const sigCloseBtn       = document.getElementById('sigCloseBtn');
    const sigDisplayArea    = document.getElementById('sigDisplayArea');
    const sigSearch         = document.getElementById('sigSearch');
    const modBtnForceSigs   = document.getElementById('modBtnForceSigs');
    const menuShowAll       = document.getElementById('sigMenuShowAll');

    // ── i18n helper ───────────────────────────
    const _sigFallback = {
        sigIdlePhrases: ['Write your name...', 'Sign this website...'],
        sigThankYou:    'Thank you!',
        sigWelcomeBack: 'Welcome back',
        sigSeasonTitle: 'That\'s a season code!',
        sigSeasonSub:   'Season effects go on the page, not here. Write your actual name. If this is your name, use a variation and edit it later.'
    };
    function tr(key) {
        if (window._i18n && typeof window._i18n.get === 'function') {
            const val = window._i18n.get(key);
            // If i18n returns the key itself, the key is not registered — use local fallback
            if (val !== key) return val;
        }
        return _sigFallback[key] !== undefined ? _sigFallback[key] : key;
    }

    // ── State ─────────────────────────────────
    function getIdlePhrases() { return tr('sigIdlePhrases'); }

    let idlePhrase = 0, idleDisplayed = '', idleTyping = true, idleTimer = null;
    let isActive = false, isLocked = false, lastSubmit = 0, submitting = false;
    let signatures = [];

    // ── Helpers ───────────────────────────────
    function setLockedText(text) {
        lockedText.innerHTML = '';
        text.split('').forEach(function (ch, i) {
            const span = document.createElement('span');
            span.className = 'wl';
            span.textContent = ch === ' ' ? '\u00a0' : ch;
            span.style.animationDelay = (i * 0.09) + 's';
            lockedText.appendChild(span);
        });
    }

    function setMode(mode) {
        idleText.style.display = 'none';
        cursor.style.display   = 'none';
        sigInput.style.display = 'none';
        lockedWrap.classList.remove('visible');

        if (mode === 'idle' || mode === 'thankyou') {
            idleText.style.display = 'inline';
            cursor.style.display   = 'inline-block';
        } else if (mode === 'input') {
            sigInput.style.display = 'inline-block';
        } else if (mode === 'locked') {
            requestAnimationFrame(function () {
                requestAnimationFrame(function () { lockedWrap.classList.add('visible'); });
            });
        }
    }

    function getBrowserId() {
        let id = localStorage.getItem('sig_browser_id');
        if (!id) {
            id = 'uid_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
            localStorage.setItem('sig_browser_id', id);
        }
        return id;
    }

    function sendToFirebase(nome) {
        if (typeof window._sigSaveToFirebase === 'function') {
            window._sigSaveToFirebase(nome, getBrowserId());
        }
    }

    // Resolve o nome único consultando o Firebase (evita duplicados).
    // Aguarda Firebase ficar pronto e devolve o nome final a usar.
    async function resolveUniqueName(nome) {
        if (typeof window._sigResolveUniqueName !== 'function') {
            // Firebase ainda não pronto — aguarda até 5s
            await new Promise(resolve => {
                if (window._sigFirebaseReady) { resolve(); return; }
                document.addEventListener('sig-firebase-ready', resolve, { once: true });
                setTimeout(resolve, 5000);
            });
        }
        if (typeof window._sigResolveUniqueName === 'function') {
            return await window._sigResolveUniqueName(nome, getBrowserId());
        }
        return nome; // fallback
    }

    async function loadSignatures() {
        if (typeof window._sigLoadFromFirebase === 'function') {
            try {
                const loaded = await window._sigLoadFromFirebase();
                if (loaded && loaded.length > 0) signatures = loaded;
            } catch (e) {
                console.warn('Could not load signatures:', e);
            }
        }
    }

    function checkSigned() {
        const saved = localStorage.getItem('sig_name');
        if (saved) { enterLockedState(false); } else { startIdle(); }
    }

    function hideSigZone() { if (sigZone) sigZone.style.display = 'none'; }

    // ── Idle typewriter ───────────────────────
    function startIdle() {
        stopIdle();
        isActive = false; isLocked = false;
        idleDisplayed = ''; idleTyping = true; idlePhrase = 0;
        idleText.textContent = ''; sigInput.value = '';
        sigInput.classList.remove('active');
        setMode('idle');
        tickIdle();
    }

    function tickIdle() {
        if (isActive || isLocked) return;
        const phrases = getIdlePhrases();
        if (idlePhrase >= phrases.length) idlePhrase = 0;
        const target = phrases[idlePhrase];
        if (idleTyping) {
            if (idleDisplayed.length < target.length) {
                idleDisplayed += target[idleDisplayed.length];
                idleText.textContent = idleDisplayed;
                idleTimer = setTimeout(tickIdle, 70 + Math.random() * 50);
            } else {
                idleTimer = setTimeout(function () { idleTyping = false; tickIdle(); }, 1800);
            }
        } else {
            if (idleDisplayed.length > 0) {
                idleDisplayed = idleDisplayed.slice(0, -1);
                idleText.textContent = idleDisplayed;
                idleTimer = setTimeout(tickIdle, 45 + Math.random() * 30);
            } else {
                idlePhrase = (idlePhrase + 1) % phrases.length;
                idleTyping = true;
                idleTimer  = setTimeout(tickIdle, 400);
            }
        }
    }

    function stopIdle() { clearTimeout(idleTimer); }

    // ── Input activation ──────────────────────
    function activateInput() {
        if (isActive || isLocked) return;
        stopIdle(); isActive = true;
        idleText.textContent = '';
        sigInput.value = '';
        sigInput.classList.add('active');
        setMode('input');
        setTimeout(function () { sigInput.focus(); }, 10);
    }

    idleText.addEventListener('click', activateInput);
    cursor.addEventListener('click', activateInput);
    sigZone.addEventListener('click', function (e) {
        if (e.target === lockedText || lockedWrap.contains(e.target)) return;
        if (!isActive && !isLocked) activateInput();
    });

    sigInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = sigInput.value.trim();
            if (val.length > 0) submitSignature(val);
        }
        if (e.key === 'Escape') {
            isActive = false;
            sigInput.classList.remove('active');
            startIdle();
        }
    });

    sigInput.addEventListener('blur', function () {
        if (submitting) return;
        if (!isLocked && sigInput.value.trim().length === 0) {
            isActive = false;
            sigInput.classList.remove('active');
            startIdle();
        }
    });

    // ── Submit ────────────────────────────────
    async function submitSignature(nome) {
        if (!nome || nome.length < 1 || nome.length > MAX_CHARS) return;
        if (sigTrap.value !== '') return;

        // Block season codes — check BEFORE rate limit so it always triggers
        if (isSeasonCode(nome)) { submitting = true; showSeasonWarning(); return; }

        const now = Date.now();
        if (now - lastSubmit < 30000) return;
        lastSubmit = now;

        submitting = true;
        stopIdle(); isActive = false;
        sigInput.classList.remove('active'); sigInput.value = '';

        idleText.textContent = tr('sigThankYou');
        idleText.classList.remove('sig-fadein');
        setMode('thankyou');
        void idleText.offsetWidth;
        idleText.classList.add('sig-fadein');
        setTimeout(function () { idleText.classList.remove('sig-fadein'); }, 400);

        // Resolver nome único ANTES de guardar (pode adicionar número)
        const nomeFinal = await resolveUniqueName(nome);
        sendToFirebase(nomeFinal);
        localStorage.setItem('sig_name', nomeFinal);
        if (!signatures.includes(nomeFinal)) signatures.unshift(nomeFinal);

        setTimeout(function () {
            eraseText(function () { submitting = false; enterLockedState(true); });
        }, 3000);
    }

    function eraseText(cb) {
        function step() {
            const t = idleText.textContent;
            if (t.length === 0) { cb(); return; }
            idleText.textContent = t.slice(0, -1);
            setTimeout(step, 48 + Math.random() * 28);
        }
        setTimeout(step, 120);
    }

    // ── Locked state ──────────────────────────

    function enterLockedState(animate) {
        isLocked = true; isActive = false;
        stopIdle(); sigInput.classList.remove('active');

        // Revelar o banner do Suika
        const suikaBanner = document.getElementById('suikaLogoBtn');
        if (suikaBanner) {
            suikaBanner.classList.add('visible');
            // Tornar o wrapper hover-ável também
            if (suikaBanner.parentElement && suikaBanner.parentElement.classList.contains('suika-banner-wrap')) {
                suikaBanner.parentElement.classList.add('visible');
            }
            if (typeof window._applySuikaBannerCollapse === 'function') {
                window._applySuikaBannerCollapse();
            }
            if (animate) {
                setTimeout(() => {
                    suikaBanner.classList.add('burst');
                    setTimeout(() => suikaBanner.classList.remove('burst'), 750);
                }, 500);
            }
        }

        const welcomeBack = tr('sigWelcomeBack');

        if (animate) {
            idleText.textContent = '';
            setMode('thankyou');
            idleText.classList.remove('sig-fadein');
            void idleText.offsetWidth;
            idleText.classList.add('sig-fadein');
            setTimeout(function () { idleText.classList.remove('sig-fadein'); }, 400);

            let typed = '', target = welcomeBack;
            function typeWelcome() {
                if (typed.length < target.length) {
                    typed += target[typed.length];
                    idleText.textContent = typed;
                    setTimeout(typeWelcome, 70 + Math.random() * 40);
                } else {
                    setTimeout(function () {
                        setLockedText(welcomeBack);
                        lockedText.classList.add('wave-active');
                        setMode('locked');
                    }, 500);
                }
            }
            typeWelcome();
        } else {
            setLockedText(welcomeBack);
            lockedText.classList.add('wave-active');
            setMode('locked');
        }
    }

    // ── Language change hook ──────────────────
    window._sigSyncLang = function (newPhrases, newThankYou, newWelcomeBack) {
        if (isLocked) {
            setLockedText(newWelcomeBack);
            lockedText.classList.add('wave-active');
            setMode('locked');
        } else if (!isActive && !submitting) {
            startIdle();
        }
    };

    document.addEventListener('hub-lang-change', function () {
        if (window._sigSyncLang) {
            window._sigSyncLang(tr('sigIdlePhrases'), tr('sigThankYou'), tr('sigWelcomeBack'));
        }
    });

    // ── Context menu ──────────────────────────
    let menuHideTimer = null;
    let menuStaggerTimers = [];

    function openMenu() {
        clearTimeout(menuHideTimer);
        menuStaggerTimers.forEach(function (t) { clearTimeout(t); });
        menuStaggerTimers = [];
        sigMenu.classList.add('open');
        menuItems.forEach(function (item) { item.classList.remove('sig-menu-visible'); });
        Array.from(menuItems).forEach(function (item, i) {
            const tid = setTimeout(function () { item.classList.add('sig-menu-visible'); }, i * 70);
            menuStaggerTimers.push(tid);
        });
    }

    function closeMenu() {
        menuHideTimer = setTimeout(function () {
            menuStaggerTimers.forEach(function (t) { clearTimeout(t); });
            menuStaggerTimers = [];
            sigMenu.classList.remove('open');
            menuItems.forEach(function (item) { item.classList.remove('sig-menu-visible'); });
        }, 180);
    }

    lockedWrap.addEventListener('mouseenter', openMenu);
    lockedWrap.addEventListener('mouseleave', closeMenu);
    sigMenu.addEventListener('mouseenter', function () { clearTimeout(menuHideTimer); });
    sigMenu.addEventListener('mouseleave', closeMenu);

    // ── Render ────────────────────────────────
    function renderSigs(searchTerm) {
        searchTerm = (searchTerm || '').toLowerCase();
        sigDisplayArea.innerHTML = '';
        sigDisplayArea.className = 'sig-display-area view-grid';
        const filtered = signatures.filter(function (s) { return s.toLowerCase().includes(searchTerm); });
        if (filtered.length === 0) {
            sigDisplayArea.innerHTML = '<div style="color:rgba(255,255,255,0.4);text-align:center;margin-top:30px;font-weight:700;font-size:0.7rem;letter-spacing:3px;">' + tr('sigNoResults') + '</div>';
            return;
        }

        // Build all items hidden so the browser resolves font/grid sizes
        // before any CSS entry animation fires — prevents the first-item
        // resize flash.
        var fragment = document.createDocumentFragment();
        filtered.forEach(function (sig) {
            const div = document.createElement('div');
            div.className = 'sig-item';
            div.style.visibility = 'hidden';
            div.textContent = sig;
            fragment.appendChild(div);
        });
        sigDisplayArea.appendChild(fragment);

        // Force a synchronous reflow so the grid layout (column widths,
        // font metrics, etc.) is fully committed BEFORE we reveal anything.
        // Reading offsetHeight triggers layout without any visible side-effect.
        void sigDisplayArea.offsetHeight;

        // Now reveal all items together in a single paint frame — no stagger,
        // no intermediate state where only item #1 is visible at the wrong size.
        requestAnimationFrame(function () {
            sigDisplayArea.querySelectorAll('.sig-item').forEach(function (el) {
                el.style.visibility = '';
            });
        });
    }

    // ── Open / Close panel ───────────────────
    function runMorseExit(callback) {
        linksSection.classList.remove('morse-exit');
        linksSection.querySelectorAll('.link-btn, .visita-mais-header').forEach(function (el) {
            el.style.opacity = ''; el.style.animation = '';
        });
        void linksSection.offsetWidth;
        linksSection.classList.add('morse-exit');
        setTimeout(callback, 620);
    }

    function openSignatures() {
        if (signaturesSection.style.display === 'flex') return;
        runMorseExit(function () {
            linksSection.style.display = 'none';
            signaturesSection.style.display = 'flex';
            void signaturesSection.offsetWidth;
            signaturesSection.classList.add('panel-visible');
            sigDisplayArea.innerHTML = '<div id="sigLoadingMsg" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.4);font-weight:700;font-size:0.7rem;letter-spacing:3px;transition:opacity 0.25s ease;">' + tr('sigLoading') + '</div>';
            loadSignatures().then(function () {
                const loadingEl = document.getElementById('sigLoadingMsg');
                if (loadingEl) {
                    loadingEl.style.opacity = '0';
                    setTimeout(function () { renderSigs(sigSearch.value); }, 260);
                } else {
                    renderSigs(sigSearch.value);
                }
            });
        });
    }

    function closeSignatures() {
        signaturesSection.classList.remove('morse-exit');
        void signaturesSection.offsetWidth;
        signaturesSection.classList.add('morse-exit');
        setTimeout(function () {
            signaturesSection.classList.remove('panel-visible', 'morse-exit');
            linksSection.classList.remove('morse-exit', 'panel-fadein');
            linksSection.querySelectorAll('.link-btn, .visita-mais-header').forEach(function (el) {
                el.style.animation = 'none'; el.style.opacity = '1';
            });
            linksSection.classList.add('panel-swap');
            linksSection.style.display = 'grid';
            signaturesSection.style.display = 'none';
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    linksSection.classList.remove('panel-swap');
                    linksSection.classList.add('panel-fadein');
                    linksSection.querySelectorAll('.link-btn, .visita-mais-header').forEach(function (el) {
                        el.style.animation = '';
                    });
                    setTimeout(function () { linksSection.classList.remove('panel-fadein'); }, 300);
                });
            });
        }, 620);
    }
    sigCloseBtn.addEventListener('click', closeSignatures);
    sigSearch.addEventListener('input', function (e) { renderSigs(e.target.value); });

    if (menuShowAll) {
        menuShowAll.addEventListener('click', function (e) { e.stopPropagation(); openSignatures(); });
    }
    if (modBtnForceSigs) {
        modBtnForceSigs.addEventListener('click', function () {
            openSignatures();
            document.getElementById('modTab').classList.remove('open');
        });
    }

    menuEdit.addEventListener('click', function (e) { e.stopPropagation(); openEditPopup(); });
    menuHideRefresh.addEventListener('click', function (e) { e.stopPropagation(); hideSigZone(); });

    function openEditPopup() {
        editInput.value = '';
        editPopup.classList.add('open');
        setTimeout(function () { editInput.focus(); }, 80);
    }

    editCancel.addEventListener('click', function () { editPopup.classList.remove('open'); });
    editPopup.addEventListener('click', function (e) { if (e.target === editPopup) editPopup.classList.remove('open'); });
    editInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); confirmEdit(); }
        if (e.key === 'Escape') editPopup.classList.remove('open');
    });
    editConfirm.addEventListener('click', confirmEdit);

    async function confirmEdit() {
        const newName = editInput.value.trim();
        if (!newName || newName.length < 1 || newName.length > MAX_CHARS) return;

        // Block season codes
        if (isSeasonCode(newName)) { editPopup.classList.remove('open'); showSeasonWarning(); return; }

        editPopup.classList.remove('open');
        // Resolver nome único ANTES de guardar
        const nomeFinal = await resolveUniqueName(newName);
        sendToFirebase(nomeFinal);
        localStorage.setItem('sig_name', nomeFinal);
        const wb = tr('sigWelcomeBack');
        setLockedText(wb);
        lockedText.classList.add('wave-active');
        setMode('locked');
    }

    // ── Season code guard ─────────────────────
    function isSeasonCode(name) {
        return SEASON_CODES.includes(name.trim().toLowerCase());
    }

    function showSeasonWarning() {
        // Sync translated text if i18n is available
        if (seasonPopupTitle) seasonPopupTitle.textContent = tr('sigSeasonTitle');
        if (seasonPopupSub)   seasonPopupSub.textContent   = tr('sigSeasonSub');
        // Revert input to idle state before showing popup
        isActive = false; submitting = false;
        sigInput.classList.remove('active');
        sigInput.value = '';
        startIdle();
        seasonPopup.classList.add('open');
    }

    if (seasonPopupOk) {
        seasonPopupOk.addEventListener('click', function () {
            seasonPopup.classList.remove('open');
            submitting = false;
        });
    }
    if (seasonPopup) {
        seasonPopup.addEventListener('click', function (e) {
            if (e.target === seasonPopup) seasonPopup.classList.remove('open');
        });
    }

    const modResetBtn = document.getElementById('modBtnResetSig');
    if (modResetBtn) {
        modResetBtn.addEventListener('click', function () {
            localStorage.removeItem('sig_name');
            localStorage.removeItem('sig_browser_id');
            isLocked = false; isActive = false; lastSubmit = 0; submitting = false;
            if (sigZone) sigZone.style.display = '';
            startIdle();
            // Texto de feedback ("✅ Reset!") é tratado pelo i18n.js patchResetBtn()
            // que mostra a versão traduzida consoante o idioma activo.
        });
    }

    if (window._sigFirebaseReady) {
        checkSigned();
    } else {
        document.addEventListener('sig-firebase-ready', checkSigned);
    }

})();
