// =========================================
// SUIKA.JS — Suika Game
// =========================================

(function () {

    const BASE = 'https://raw.githubusercontent.com/Missiion/Caravela/refs/heads/main/';
    const FRUITS = [
        { level: 0,  r: 15, img: BASE+'Suika_1ponto.png' },
        { level: 1,  r: 20, img: BASE+'Suika_3pontos.png' },
        { level: 2,  r: 28, img: BASE+'suika_6pontos.png' },
        { level: 3,  r: 35, img: BASE+'Suika_10pontos.png' },
        { level: 4,  r: 40, img: BASE+'suika_15pontos.png' },
        { level: 5,  r: 44, img: BASE+'Suika_21pontos.png' },
        { level: 6,  r: 48, img: BASE+'Suika_28pontos.png' },
        { level: 7,  r: 54, img: BASE+'Suika_36pontos.png' },
        { level: 8,  r: 58, img: BASE+'Suika_45pontos.png' },
        { level: 9,  r: 63, img: BASE+'Suika_55pontos.png' },
        { level: 10, r: 71, img: BASE+'Suika_66pontos.png' },
    ];

    const SCORES = [1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66];

    // ── Sound Effects ─────────────────────────────────────────
    // Elements declared in index.html with crossorigin="anonymous" (same as music player)
    const SFX_IDS = { start: 'sfxStart', restart: 'sfxRestart', lose: 'sfxLose', pop: 'sfxPop' };

    // ── Volume individual por som (0.0 a 1.0) ─────────────────
    const SFX_VOL = {
        start:   0.02,
        restart: 0.02,
        lose:    0.02,
        pop:     0.02,
    };

    function playSfx(key) {
        const el = document.getElementById(SFX_IDS[key]);
        if (!el) return;
        try {
            const clone = el.cloneNode();
            clone.volume = SFX_VOL[key] ?? 0.6;
            clone.play().catch(() => {});
        } catch(e) {}
    }

    // Pre-load all fruit images
    const FRUIT_IMGS = FRUITS.map(f => {
        const im = new Image();
        im.crossOrigin = 'anonymous';
        im.src = f.img;
        return im;
    });



    let engine, runner;
    let fruitElMap = {}; // body._id -> img element
    let gameActive    = false;
    let gameOver      = false;
    let score         = 0;
    let queue         = [];
    let dropCooldown  = false;
    let pendingMerges = new Set();
    let bodies        = [];
    let dropX         = 0;
    let panelW        = 0;
    let panelH        = 0;
    const WALL_T      = 20;
    const DANGER_Y    = 40;
    let gameOverTimer  = null;

    let suikaSection, canvas, fruitLayer, scoreEl, dropIndicator, gameOverOverlay;
    let nextCanvases = [];

    // ── Controlos de teclado ──────────────────────────────────
    const KEY_SPEED = 7;          // px por frame a 60fps
    let   keysHeld  = {};
    let   keyRafId  = null;

    function getLinksSection() { return document.querySelector('.links-section'); }

    function loadMatter(cb) {
        if (window.Matter) { cb(); return; }
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js';
        s.onload = cb;
        document.head.appendChild(s);
    }

    function buildPanel() {
        if (document.getElementById('suikaSection')) {
            suikaSection    = document.getElementById('suikaSection');
            canvas          = document.getElementById('suikaCanvas');
            scoreEl         = document.getElementById('suikaScore');
            gameOverOverlay = document.getElementById('suikaGameOver');
            dropIndicator   = document.getElementById('suikaDropLine');
            nextCanvases    = [0,1].map(i => document.getElementById('suikaNext'+i));
            return;
        }

        suikaSection = document.createElement('div');
        suikaSection.id = 'suikaSection';
        suikaSection.className = 'suika-section';

        const _t = (key) => (window._i18n ? window._i18n.get(key) : key);
        suikaSection.innerHTML = `
            <div class="suika-header-row">
                <div class="visita-mais-header">${_t('suikaSectionTitle')}</div>
                <button class="suika-lb-btn" id="suikaLbBtn">${_t('suikaLbBtn')}</button>
            </div>
            <div class="suika-body">
                <div class="suika-left">
                    <canvas id="suikaCanvas"></canvas>
                    <div id="suikaFruitLayer" class="suika-fruit-layer"></div>
                    <div class="suika-drop-line" id="suikaDropLine"></div>
                    <div class="suika-gameover" id="suikaGameOver">
                        <div class="suika-go-title">${_t('suikaYouLose')}</div>
                        <div class="suika-go-score" id="suikaGoScore">0</div>
                        <button class="suika-go-restart-btn" id="suikaRestartGO">${_t('suikaPlayAgain')}</button>
                        <div class="suika-go-hs-notice" id="suikaHsNotice">${_t('suikaHsNotice')}</div>
                    </div>

                    <!-- Leaderboard overlay -->
                    <div class="suika-lb-overlay" id="suikaLbOverlay">
                        <div class="suika-lb-title">${_t('suikaLbTitle')}</div>
                        <input class="suika-lb-search" id="suikaLbSearch" type="text" placeholder="${_t('suikaLbSearch')}" autocomplete="off">
                        <div class="suika-lb-list" id="suikaLbList"></div>
                        <button class="suika-go-restart-btn" id="suikaLbClose">${_t('suikaLbClose')}</button>
                    </div>
                </div>
                <div class="suika-right">
                    <div class="suika-score-box">
                        <div class="suika-label">${_t('suikaScoreLabel')}</div>
                        <div class="suika-score-val" id="suikaScore">0</div>
                    </div>
                    <div class="suika-next-box">
                        <div class="suika-label">${_t('suikaNextLabel')}</div>
                        <img id="suikaNext0" class="suika-next-canvas" draggable="false">
                        <img id="suikaNext1" class="suika-next-canvas suika-next-sm" draggable="false">
                    </div>
                    <div class="suika-right-spacer"></div>
                    <div class="suika-right-footer">
                        <button class="suika-action-btn suika-restart-btn" id="suikaRestart">${_t('suikaRestart')}</button>
                        <button class="suika-action-btn sig-close-btn suika-back-btn" id="suikaCloseBtn" title="${_t('suikaBackTitle')}">${_t('suikaBack')}</button>
                    </div>
                </div>
            </div>
        `;

        document.querySelector('.hub-container').appendChild(suikaSection);

        canvas          = document.getElementById('suikaCanvas');
        scoreEl         = document.getElementById('suikaScore');
        gameOverOverlay = document.getElementById('suikaGameOver');
        dropIndicator   = document.getElementById('suikaDropLine');
        fruitLayer      = document.getElementById('suikaFruitLayer');
        nextCanvases    = [0,1].map(i => document.getElementById('suikaNext'+i));

        document.getElementById('suikaCloseBtn').addEventListener('click', closeGame);
        document.getElementById('suikaLbClose').addEventListener('click', () => {
            document.getElementById('suikaLbOverlay').classList.remove('visible');
        });
        document.getElementById('suikaLbBtn').addEventListener('click', () => {
            document.getElementById('suikaLbOverlay').classList.add('visible');
            _lbCache = null;
            const searchEl = document.getElementById('suikaLbSearch');
            if (searchEl) searchEl.value = '';
            renderLeaderboard();
        });
        document.getElementById('suikaLbSearch').addEventListener('input', (e) => {
            renderLeaderboard(e.target.value.trim());
        });
        let restartConfirmTimer = null;
        const restartBtn = document.getElementById('suikaRestart');
        restartBtn.addEventListener('click', () => {
            if (restartConfirmTimer) {
                // Segunda vez — confirma
                clearTimeout(restartConfirmTimer);
                restartConfirmTimer = null;
                restartBtn.textContent = _t('suikaRestart');
                restartBtn.classList.remove('suika-restart-confirm');
                restartGame();
            } else {
                // Primeira vez — pede confirmação
                restartBtn.textContent = _t('suikaRestartConfirm');
                restartBtn.classList.add('suika-restart-confirm');
                restartConfirmTimer = setTimeout(() => {
                    restartBtn.textContent = _t('suikaRestart');
                    restartBtn.classList.remove('suika-restart-confirm');
                    restartConfirmTimer = null;
                }, 5000);
            }
        });
        document.getElementById('suikaRestartGO').addEventListener('click', restartGame);


    }

    function runMorseExit(callback) {
        const ls = getLinksSection();
        ls.classList.remove('morse-exit');
        ls.querySelectorAll('.link-btn, .visita-mais-header').forEach(el => {
            el.style.opacity = ''; el.style.animation = '';
        });
        void ls.offsetWidth;
        ls.classList.add('morse-exit');
        setTimeout(callback, 620);
    }

    function openGame() {
        if (!getLinksSection()) return;
        if (suikaSection && suikaSection.style.display === 'flex') return;
        playSfx('start');
        const wrap = document.querySelector('.suika-banner-wrap');
        if (wrap) wrap.classList.add('suika-disabled');
        buildPanel();
        runMorseExit(() => {
            getLinksSection().style.display = 'none';
            suikaSection.style.display = 'flex';
            void suikaSection.offsetWidth;
            suikaSection.classList.add('panel-visible');
            // Retoma jogo existente se houver; senão começa novo
            if (engine && !gameOver) {
                loadMatter(resumePhysics);
            } else {
                loadMatter(startGame);
            }
        });
    }

    function closeGame() {
        pausePhysics();
        const wrap = document.querySelector('.suika-banner-wrap');
        if (wrap) wrap.classList.remove('suika-disabled');
        suikaSection.classList.remove('morse-exit');
        void suikaSection.offsetWidth;
        suikaSection.classList.add('morse-exit');
        setTimeout(() => {
            suikaSection.classList.remove('panel-visible', 'morse-exit');
            suikaSection.style.display = 'none';

            // Se a Games Zone existir, voltar para ela em vez do hub
            if (window._gamesZoneOpen && window._gamesZoneOpenPanel) {
                window._gamesZoneOpenPanel();
            } else {
                const ls = getLinksSection();
                ls.classList.remove('morse-exit', 'panel-fadein');
                ls.querySelectorAll('.link-btn, .visita-mais-header').forEach(el => {
                    el.style.animation = 'none'; el.style.opacity = '1';
                });
                ls.classList.add('panel-swap');
                ls.style.display = 'grid';
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    ls.classList.remove('panel-swap');
                    ls.classList.add('panel-fadein');
                    ls.querySelectorAll('.link-btn, .visita-mais-header').forEach(el => {
                        el.style.animation = '';
                    });
                    setTimeout(() => ls.classList.remove('panel-fadein'), 300);
                }));
            }
        }, 620);
    }


    // ── Mod mode: teclas 1–9, 0, - spawnam frutas ──────────────────────
    const MOD_KEY_MAP = {
        '1': 0, '2': 1, '3': 2, '4': 3, '5': 4,
        '6': 5, '7': 6, '8': 7, '9': 8, '0': 9, '-': 10
    };

    function onModKey(e) {
        if (!gameActive) return;
        if (!document.body.classList.contains('mod-mode')) return;
        // Ignore if typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        const level = MOD_KEY_MAP[e.key];
        if (level === undefined) return;
        e.preventDefault();
        dropFruit(level, dropX);
    }

    function startGame() {
        const { Engine, Runner, Bodies, World, Events } = Matter;

        const container = suikaSection.querySelector('.suika-left');
        panelW = container.clientWidth  || 260;
        panelH = container.clientHeight || 400;
        const dpr = window.devicePixelRatio || 1;
        canvas.width  = panelW * dpr;
        canvas.height = panelH * dpr;
        canvas.style.width  = panelW + 'px';
        canvas.style.height = panelH + 'px';
        dropX = panelW / 2;

        score        = 0;
        gameOver     = false;
        bodies       = [];
        pendingMerges.clear();
        dropCooldown  = false;
        dangerFrames  = 0;
        gameOverOverlay.classList.remove('visible');
        scoreEl.textContent = '0';
        if (fruitLayer) fruitLayer.innerHTML = '';
        fruitElMap = {};
        ghostEl = null;


        queue = [randomLevel(), randomLevel()];

        engine = Engine.create({ gravity: { y: 1.8 } });
        const world = engine.world;

        const wo = { isStatic: true, friction: 0.5, restitution: 0.2, render: { fillStyle: 'transparent' } };
        World.add(world, [
            Bodies.rectangle(panelW/2, panelH + WALL_T/2, panelW + WALL_T*2, WALL_T, wo),
            Bodies.rectangle(-WALL_T/2, panelH/2, WALL_T, panelH*2, wo),
            Bodies.rectangle(panelW + WALL_T/2, panelH/2, WALL_T, panelH*2, wo),
        ]);

        runner = Runner.create();
        Runner.run(runner, engine);
        Events.on(engine, 'collisionStart', handleCollisions);

        gameActive = true;
        requestAnimationFrame(drawLoop);
        drawQueuePreviews();
        updateDropLine();

        canvas.addEventListener('mousemove',  onMouseMove);
        canvas.addEventListener('click',      onDrop);
        canvas.addEventListener('touchmove',  onTouchMove, { passive: false });
        canvas.addEventListener('touchend',   onTouchDrop);
        document.addEventListener('keydown',  onModKey);
        document.addEventListener('keydown',  onKeyDown);
        document.addEventListener('keyup',    onKeyUp);
    }

    function _removeListeners() {
        if (!canvas) return;
        canvas.removeEventListener('mousemove',  onMouseMove);
        canvas.removeEventListener('click',      onDrop);
        canvas.removeEventListener('touchmove',  onTouchMove);
        canvas.removeEventListener('touchend',   onTouchDrop);
        document.removeEventListener('keydown',  onModKey);
        document.removeEventListener('keydown',  onKeyDown);
        document.removeEventListener('keyup',    onKeyUp);
        keysHeld = {};
        if (keyRafId) { cancelAnimationFrame(keyRafId); keyRafId = null; }
    }

    function pausePhysics() {
        gameActive = false;
        if (runner && Matter.Runner) Matter.Runner.stop(runner);
        _removeListeners();
    }

    function resumePhysics() {
        if (!engine || !runner) { startGame(); return; }
        const { Runner } = Matter;
        Runner.run(runner, engine);
        canvas.addEventListener('mousemove',  onMouseMove);
        canvas.addEventListener('click',      onDrop);
        canvas.addEventListener('touchmove',  onTouchMove, { passive: false });
        canvas.addEventListener('touchend',   onTouchDrop);
        document.addEventListener('keydown',  onModKey);
        document.addEventListener('keydown',  onKeyDown);
        document.addEventListener('keyup',    onKeyUp);
        gameActive = true;
        requestAnimationFrame(drawLoop);
        if (scoreEl) scoreEl.textContent = score;
        drawQueuePreviews();
        updateDropLine();
    }

    function stopPhysics() {
        gameActive = false;
        if (runner && Matter.Runner) Matter.Runner.stop(runner);
        _removeListeners();
    }

    function restartGame() {
        playSfx('restart');
        stopPhysics();
        if (engine) Matter.World.clear(engine.world);
        engine = null;
        runner = null;
        bodies = [];
        setTimeout(startGame, 50);
    }

    function onMouseMove(e) {
        if (gameOver) return;
        const rect = canvas.getBoundingClientRect();
        const fr = FRUITS[queue[0]].r;
        dropX = Math.max(fr + 2, Math.min(panelW - fr - 2, e.clientX - rect.left));
        updateDropLine();
    }

    function onTouchMove(e) {
        e.preventDefault();
        if (gameOver) return;
        const rect = canvas.getBoundingClientRect();
        const fr = FRUITS[queue[0]].r;
        dropX = Math.max(fr + 2, Math.min(panelW - fr - 2, e.touches[0].clientX - rect.left));
        updateDropLine();
    }

    function onDrop() {
        if (gameOver || dropCooldown) return;
        const level = queue.shift();
        queue.push(randomLevel());
        dropFruit(level, dropX);
        drawQueuePreviews();
        dropCooldown = true;
        setTimeout(() => { dropCooldown = false; }, 420);
    }

    function onTouchDrop() { onDrop(); }
    function updateDropLine() { if (dropIndicator) dropIndicator.style.left = dropX + 'px'; }

    // ── Keyboard controls ─────────────────────────────────────
    const KB_LEFT  = new Set(['ArrowLeft',  'a', 'A']);
    const KB_RIGHT = new Set(['ArrowRight', 'd', 'D']);

    function onKeyDown(e) {
        if (!gameActive || gameOver) return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (document.body.classList.contains('mod-mode') && MOD_KEY_MAP[e.key] !== undefined) return;
        if (KB_LEFT.has(e.key) || KB_RIGHT.has(e.key)) {
            e.preventDefault();
            if (!keysHeld[e.key]) {
                keysHeld[e.key] = true;
                if (!keyRafId) startKeyLoop();
            }
        }
        if (e.key === ' ') {
            e.preventDefault();
            onDrop();
        }
    }

    function onKeyUp(e) {
        delete keysHeld[e.key];
        const anyHeld = [...KB_LEFT, ...KB_RIGHT].some(k => keysHeld[k]);
        if (!anyHeld && keyRafId) {
            cancelAnimationFrame(keyRafId);
            keyRafId = null;
        }
    }

    function startKeyLoop() {
        function loop() {
            if (!gameActive || gameOver) { keyRafId = null; return; }
            const fr = FRUITS[queue[0]].r;
            let dx = 0;
            if ([...KB_LEFT].some(k => keysHeld[k]))  dx -= KEY_SPEED;
            if ([...KB_RIGHT].some(k => keysHeld[k])) dx += KEY_SPEED;
            if (dx !== 0) {
                dropX = Math.max(fr + 2, Math.min(panelW - fr - 2, dropX + dx));
                updateDropLine();
            }
            const anyHeld = [...KB_LEFT, ...KB_RIGHT].some(k => keysHeld[k]);
            if (anyHeld) {
                keyRafId = requestAnimationFrame(loop);
            } else {
                keyRafId = null;
            }
        }
        keyRafId = requestAnimationFrame(loop);
    }

    function dropFruit(level, x) {
        const { Bodies, World } = Matter;
        const f = FRUITS[level];
        // Spawn no mesmo y que o ghost preview (centro = f.r + 5)
        const spawnY = f.r + 5;
        const body = Bodies.circle(x, spawnY, f.r, {
            restitution: 0.3, friction: 0.6, frictionAir: 0.01, density: 0.002,
        });
        body._level = level;
        body._id    = Date.now() + Math.random();
        body._born  = Date.now();
        World.add(engine.world, body);
        bodies.push({ body, level });
    }

    // Monitoriza continuamente — corre a cada frame via drawLoop
    let dangerFrames = 0;
    function checkGameOver() {
        if (gameOver) return;
        const now = Date.now();
        // Só conta bolas com mais de 1.5s de vida, paradas (não em merge/queda),
        // e cujo CENTRO está acima da linha de perigo
        const anyOver = bodies.some(b =>
            (now - b.body._born) > 1500 &&
            !b.body.isStatic &&
            b.body.position.y < DANGER_Y &&
            Math.abs(b.body.velocity.y) < 1.5 &&
            Math.abs(b.body.velocity.x) < 1.5
        );
        if (anyOver) {
            dangerFrames++;
            if (dangerFrames >= 80) triggerGameOver(); // ~1.3s a 60fps
        } else {
            dangerFrames = Math.max(0, dangerFrames - 3); // recupera mais rápido ao sair
        }
    }

    function randomLevel() { return Math.floor(Math.random() * 5); }

    function handleCollisions(event) {
        event.pairs.forEach(pair => {
            const { bodyA, bodyB } = pair;
            if (bodyA._level === undefined || bodyB._level === undefined) return;
            if (bodyA._level !== bodyB._level) return;
            // level 10 can still merge (both disappear)
            const key = [bodyA._id, bodyB._id].sort().join('-');
            if (pendingMerges.has(key)) return;
            pendingMerges.add(key);
            setTimeout(() => { mergeFruits(bodyA, bodyB); pendingMerges.delete(key); }, 80);
        });
    }

    function mergeFruits(bA, bB) {
        const { World } = Matter;
        const iA = bodies.findIndex(b => b.body === bA);
        const iB = bodies.findIndex(b => b.body === bB);
        if (iA === -1 || iB === -1) return;
        const level = bA._level;
        const mx = (bA.position.x + bB.position.x) / 2;
        const my = (bA.position.y + bB.position.y) / 2;
        World.remove(engine.world, bA);
        World.remove(engine.world, bB);
        bodies.splice(Math.max(iA, iB), 1);
        bodies.splice(Math.min(iA, iB), 1);
        score += SCORES[level];
        scoreEl.textContent = score;
        playSfx('pop');
        if (level + 1 <= 10) dropFruit(level + 1, mx);
        else spawnMergeFlash(mx, my, FRUITS[level].r * 1.5, '#ffd700');
        spawnMergeFlash(mx, my, FRUITS[level].r, '#ffffff');
    }


    function triggerGameOver() {
        gameOver = true;
        playSfx('lose');
        document.getElementById('suikaGoScore').textContent = score;
        gameOverOverlay.classList.add('visible');
        const hsNotice = document.getElementById('suikaHsNotice');
        if (hsNotice) hsNotice.classList.remove('visible');
        checkAndUpdateScore(score);
    }

    function getBrowserId() {
        return localStorage.getItem('sig_browser_id') || null;
    }

    function waitForFirebase() {
        return new Promise(resolve => {
            if (typeof window._suikaGetScore === 'function') { resolve(); return; }
            document.addEventListener('sig-firebase-ready', () => resolve(), { once: true });
            setTimeout(resolve, 8000);
        });
    }

    async function checkAndUpdateScore(currentScore) {
        if (document.body.classList.contains('mod-mode')) return;
        const bid = getBrowserId();
        if (!bid) return;
        await waitForFirebase();
        if (typeof window._suikaGetScore !== 'function') return;
        const existing = await window._suikaGetScore(bid);
        const hsNotice = document.getElementById('suikaHsNotice');
        if (existing === null) {
            await window._suikaSetScore(bid, currentScore);
        } else if (currentScore > existing) {
            await window._suikaSetScore(bid, currentScore);
            if (hsNotice) {
                hsNotice.classList.add('visible');
                setTimeout(() => hsNotice.classList.remove('visible'), 3500);
            }
        }
    }

    // ── Draw ──────────────────────────────────────────────────
    const mergeFlashes = [];

    function spawnMergeFlash(x, y, r, color) {
        mergeFlashes.push({ x, y, r, color: color || '#fff', alpha: 1.0, age: 0 });
    }

    let ghostEl = null;
    function updateGhostEl() {
        if (!fruitLayer) return;
        if (gameOver || dropCooldown || !queue.length) {
            if (ghostEl) ghostEl.style.display = 'none';
            return;
        }
        const lvl = queue[0];
        const f   = FRUITS[lvl];
        if (!ghostEl) {
            ghostEl = document.createElement('img');
            ghostEl.className = 'suika-fruit-img suika-fruit-ghost';
            ghostEl.draggable = false;
            fruitLayer.appendChild(ghostEl);
        }
        ghostEl.src = FRUIT_IMGS[lvl].src;
        ghostEl.style.display = 'block';
        ghostEl.style.width  = f.r*2 + 'px';
        ghostEl.style.height = f.r*2 + 'px';
        ghostEl.style.transform = `translate(${dropX - f.r}px, ${5}px)`;
    }

    function syncFruitElements() {
        if (!fruitLayer) return;
        const seen = new Set();
        bodies.forEach(({ body, level }) => {
            const id = body._id;
            seen.add(id);
            const f  = FRUITS[level];
            const d  = f.r * 2;
            let el = fruitElMap[id];
            if (!el) {
                el = document.createElement('img');
                el.src = FRUIT_IMGS[level].src;
                el.crossOrigin = 'anonymous';
                el.className = 'suika-fruit-img';
                el.draggable = false;
                el.style.width  = d + 'px';
                el.style.height = d + 'px';
                fruitLayer.appendChild(el);
                fruitElMap[id] = el;
            }
            const x = body.position.x - f.r;
            const y = body.position.y - f.r;
            el.style.transform = `translate(${x}px, ${y}px) rotate(${body.angle}rad)`;
        });
        // Remove elements for bodies that no longer exist
        for (const id in fruitElMap) {
            if (!seen.has(Number(id))) {
                fruitElMap[id].remove();
                delete fruitElMap[id];
            }
        }
    }

    function drawLoop() {
        if (!gameActive) return;
        requestAnimationFrame(drawLoop);
        checkGameOver();
        const dpr = window.devicePixelRatio || 1;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled  = true;
        ctx.imageSmoothingQuality  = 'high';
        ctx.clearRect(0, 0, panelW * dpr, panelH * dpr);
        ctx.save();
        ctx.scale(dpr, dpr);

        // Linha de perigo
        ctx.save();
        ctx.setLineDash([6,4]);
        ctx.strokeStyle = 'rgba(231,76,60,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, DANGER_Y);
        ctx.lineTo(panelW, DANGER_Y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        syncFruitElements();

        // Ghost — update ghost img element
        updateGhostEl();

        // Merge flashes
        for (let i = mergeFlashes.length - 1; i >= 0; i--) {
            const fl = mergeFlashes[i];
            fl.age += 0.07; fl.alpha -= 0.045;
            if (fl.alpha <= 0) { mergeFlashes.splice(i, 1); continue; }
            ctx.save();
            ctx.globalAlpha = fl.alpha;
            ctx.beginPath();
            ctx.arc(fl.x, fl.y, fl.r*(1+fl.age*1.5), 0, Math.PI*2);
            ctx.strokeStyle = fl.color;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore(); // undo DPR scale
    }

    function drawQueuePreviews() {
        nextCanvases.forEach((el, i) => {
            if (!el) return;
            const level = queue[i];
            if (level === undefined) return;
            el.src = FRUIT_IMGS[level].src;
        });
    }

    function lighten(hex, amt) {
        const n = parseInt(hex.replace('#',''), 16);
        const r = Math.min(255, ((n>>16)&0xff) + Math.round(255*amt));
        const g = Math.min(255, ((n>> 8)&0xff) + Math.round(255*amt));
        const b = Math.min(255, ((n>> 0)&0xff) + Math.round(255*amt));
        return `rgb(${r},${g},${b})`;
    }


    // ── Leaderboard (Firebase) ────────────────────────────────
    let _lbCache = null;

    async function renderLeaderboard(filter) {
        const list = document.getElementById("suikaLbList");
        if (!list) return;
        if (!_lbCache) {
            const _t = (key) => (window._i18n ? window._i18n.get(key) : key);
            list.innerHTML = '<div class="suika-lb-loading">' + _t('suikaLbLoading') + '</div>';
            if (typeof window._suikaGetLeaderboard !== 'function') {
                await new Promise(resolve => {
                    document.addEventListener('sig-firebase-ready', () => resolve(), { once: true });
                    setTimeout(resolve, 8000);
                });
            }
            _lbCache = typeof window._suikaGetLeaderboard === 'function'
                ? await window._suikaGetLeaderboard()
                : [];
        }
        let entries = _lbCache;
        if (filter && filter.length > 0) {
            const lc = filter.toLowerCase();
            entries = entries.filter(e => e.name.toLowerCase().includes(lc));
        }
        if (entries.length === 0) {
            const _t2 = (key) => (window._i18n ? window._i18n.get(key) : key);
            list.innerHTML = '<div class="suika-lb-empty">' + _t2('suikaLbEmpty') + '</div>';
            return;
        }
        list.innerHTML = entries.map((e) => {
            const rank = _lbCache.indexOf(e);
            const medal = rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : "#"+(rank+1);
            const cls   = rank === 0 ? "suika-lb-gold" : rank === 1 ? "suika-lb-silver" : rank === 2 ? "suika-lb-bronze" : "";
            return `<div class="suika-lb-row ${cls}"><span class="suika-lb-rank">${medal}</span><span class="suika-lb-name">${e.name.toUpperCase()}</span><span class="suika-lb-score">${e.score.toLocaleString()}</span></div>`;
        }).join("");
    }

    // ── i18n live-sync: chamado por i18n.js quando o idioma muda ──────────
    window._suikaSyncLang = function (t) {
        // Só actualiza se o painel estiver aberto no DOM
        const el = (id) => document.getElementById(id);

        const header = suikaSection && suikaSection.querySelector('.visita-mais-header');
        if (header) header.textContent = t.suikaSectionTitle;

        const lbBtn = el('suikaLbBtn');
        if (lbBtn) lbBtn.textContent = t.suikaLbBtn;

        const goTitle = suikaSection && suikaSection.querySelector('.suika-go-title');
        if (goTitle) goTitle.textContent = t.suikaYouLose;

        const goRestart = el('suikaRestartGO');
        if (goRestart) goRestart.textContent = t.suikaPlayAgain;

        const hsNotice = el('suikaHsNotice');
        if (hsNotice) hsNotice.textContent = t.suikaHsNotice;

        const lbTitle = suikaSection && suikaSection.querySelector('.suika-lb-title');
        if (lbTitle) lbTitle.textContent = t.suikaLbTitle;

        const lbSearch = el('suikaLbSearch');
        if (lbSearch) lbSearch.placeholder = t.suikaLbSearch;

        const lbClose = el('suikaLbClose');
        if (lbClose) lbClose.textContent = t.suikaLbClose;

        const scoreLabels = suikaSection && suikaSection.querySelectorAll('.suika-label');
        if (scoreLabels && scoreLabels[0]) scoreLabels[0].textContent = t.suikaScoreLabel;
        if (scoreLabels && scoreLabels[1]) scoreLabels[1].textContent = t.suikaNextLabel;

        // Restart button — só actualiza se não estiver em modo de confirmação
        const restartBtn = el('suikaRestart');
        if (restartBtn && !restartBtn.classList.contains('suika-restart-confirm')) {
            restartBtn.textContent = t.suikaRestart;
        }

        const backBtn = el('suikaCloseBtn');
        if (backBtn) { backBtn.textContent = t.suikaBack; backBtn.title = t.suikaBackTitle; }
    };

    // Exposto globalmente — a Games Zone chama isto ao clicar no card Suika
    window._suikaOpenGame = function () {
        if (suikaSection && suikaSection.style.display === 'flex') return;
        playSfx('start');
        const wrap = document.querySelector('.suika-banner-wrap');
        if (wrap) wrap.classList.add('suika-disabled');
        buildPanel();
        // links-section já está escondida pela Games Zone — abrir directamente
        const ls = getLinksSection();
        if (ls) ls.style.display = 'none';
        suikaSection.style.display = 'flex';
        void suikaSection.offsetWidth;
        suikaSection.classList.add('panel-visible');
        if (engine && !gameOver) {
            loadMatter(resumePhysics);
        } else {
            loadMatter(startGame);
        }
    };

    function init() {
        console.log('[Suika] pronto');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
