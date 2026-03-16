/* ═══════════════════════════════════════════════════════════════
   GAMES-ZONE.JS  — Games Zone panel
   Opens from the Suika banner button.
   Shows a game-selection menu; clicking Suika launches the game.
   ═══════════════════════════════════════════════════════════════ */
(function () {
    'use strict';



    // Sinaliza ao suika.js que a Games Zone está presente — ele não deve ligar ao botão
    window._gamesZoneActive = true;

    /* ── Pac-Man canvas renderer ─────────────────────────────── */
    function initPacCanvas(canvas) {
        const footer = canvas.parentElement;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        let W, H;
        const CY         = 14;
        const PAC_R      = 7;
        const DOT_R      = 2;
        const DOT_SPACE  = 16;
        const SPEED      = 1.6;
        const S          = 1.1;
        const GHOST_COLS = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852'];

        // Dot refill: one dot reappears every N frames
        const REFILL_INTERVAL = 6; // frames between each dot reappearing

        let pacX, dots = [], mouth = 0, mDir = -1, gFrame = 0, gTick = 0;
        let rafId = null;

        // Phase: 'chase' = pac-man eating dots | 'refill' = dots reappearing one by one
        let phase = 'chase';
        let refillIndex = 0;   // next dot index to restore
        let refillTick  = 0;   // frame counter between restores

        function buildDots() {
            dots = [];
            for (let x = DOT_SPACE; x < W - 4; x += DOT_SPACE) {
                dots.push({ x, eaten: false, alpha: 1 });
            }
        }

        function resize() {
            W = footer.offsetWidth;
            H = 28;
            canvas.width  = W;
            canvas.height = H;
            buildDots();
        }

        function startChase() {
            phase = 'chase';
            pacX  = -(PAC_R + 4 * 18 + 20);
            dots.forEach(d => { d.eaten = false; d.alpha = 1; });
        }

        function startRefill() {
            phase        = 'refill';
            refillIndex  = 0;
            refillTick   = 0;
            // mark all as eaten so they're invisible at start of refill
            dots.forEach(d => { d.eaten = true; d.alpha = 0; });
        }

        function drawPacman(cx, cy, mouthFrac) {
            const maxHalf = 0.23 * Math.PI;
            const halfGap = maxHalf * (1 - mouthFrac);
            ctx.fillStyle = '#FFE000';
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, PAC_R, halfGap, Math.PI * 2 - halfGap);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.arc(cx - 1, cy - PAC_R * 0.42, 1.1, 0, Math.PI * 2);
            ctx.fill();
        }

        function drawGhost(cx, cy, col, frame) {
            const W14 = Math.round(14 * S);
            const H14 = Math.round(14 * S);
            const ox  = Math.round(cx - W14 / 2);
            const oy  = Math.round(cy - H14 / 2);
            const p = (c, r, w, h) =>
                ctx.fillRect(ox + Math.round(c * S), oy + Math.round(r * S),
                             Math.round(w * S), Math.round(h * S));
            ctx.fillStyle = col;
            p(4,  0, 6, 1); p(2,  1, 10, 1); p(1,  2, 12, 1);
            p(0,  3, 14, 1); p(0,  4, 14, 1); p(0,  5, 14, 1);
            p(0,  6, 14, 1); p(0,  7, 14, 1); p(0,  8, 14, 1);
            p(0,  9, 14, 1); p(0, 10, 14, 1);
            if (frame === 0) {
                p(0, 11, 4, 1); p(5, 11, 4, 1); p(10, 11, 4, 1);
                p(0, 12, 4, 1); p(5, 12, 4, 1); p(10, 12, 4, 1);
                p(0, 13, 3, 1); p(5, 13, 3, 1); p(10, 13, 3, 1);
            } else {
                p(1, 11, 3, 1); p(5, 11, 4, 1); p(10, 11, 3, 1);
                p(1, 12, 3, 1); p(5, 12, 4, 1); p(10, 12, 3, 1);
                p(2, 13, 2, 1); p(6, 13, 2, 1); p(11, 13, 2, 1);
            }
            ctx.fillStyle = '#FFFFFF';
            p(2, 3, 4, 4); p(8, 3, 4, 4);
            ctx.fillStyle = '#222EFF';
            p(4, 4, 2, 2); p(10, 4, 2, 2);
        }

        function drawDot(x, y, alpha) {
            ctx.globalAlpha = alpha * 0.6;
            ctx.fillStyle = 'rgba(255,220,80,1)';
            ctx.beginPath();
            ctx.arc(x, y, DOT_R, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        function loop() {
            ctx.clearRect(0, 0, W, H);

            // ── mouth + ghost animation (always running) ──
            mouth += 0.09 * mDir;
            if (mouth <= 0) { mouth = 0; mDir =  1; }
            if (mouth >= 1) { mouth = 1; mDir = -1; }
            gTick++;
            if (gTick >= 10) { gFrame ^= 1; gTick = 0; }

            if (phase === 'chase') {
                pacX += SPEED;

                // eat dots
                dots.forEach(d => { if (!d.eaten && pacX >= d.x) d.eaten = true; });

                // draw uneaten dots
                dots.forEach(d => { if (!d.eaten) drawDot(d.x, CY, 1); });

                // draw ghosts + pac-man
                const GHOST_GAP = Math.round(14 * S) + 4;
                for (let i = GHOST_COLS.length - 1; i >= 0; i--) {
                    const gx = pacX - PAC_R - 6 - (i * GHOST_GAP) - Math.round(14 * S) / 2;
                    drawGhost(gx, CY, GHOST_COLS[i], gFrame);
                }
                drawPacman(pacX, CY, mouth);

                // when pac-man + all ghosts fully exit right → start refill
                if (pacX > W + PAC_R + 4 * 18 + 30) {
                    startRefill();
                }

            } else {
                // ── REFILL phase: dots pop back one by one, left to right ──
                refillTick++;
                if (refillTick >= REFILL_INTERVAL && refillIndex < dots.length) {
                    refillTick = 0;
                    // pop-in: set alpha to 0 and animate up to 1 over next frames
                    dots[refillIndex].eaten = false;
                    dots[refillIndex].alpha = 0;
                    refillIndex++;
                }

                // animate alpha of recently restored dots
                dots.forEach(d => {
                    if (!d.eaten && d.alpha < 1) {
                        d.alpha = Math.min(1, d.alpha + 0.12);
                    }
                });

                // draw all visible dots
                dots.forEach(d => { if (!d.eaten) drawDot(d.x, CY, d.alpha); });

                // once last dot is fully visible, start chase again
                if (refillIndex >= dots.length && dots.every(d => d.alpha >= 1)) {
                    startChase();
                }
            }

            rafId = requestAnimationFrame(loop);
        }

        function start() {
            if (rafId) cancelAnimationFrame(rafId);
            resize();
            startChase();
            rafId = requestAnimationFrame(loop);
        }

        function stop() {
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        }

        window.addEventListener('resize', () => { if (rafId) { resize(); startChase(); } });

        return { start, stop };
    }

    /* ── Build Games Zone HTML ───────────────────────────────── */
    function buildGamesZonePanel() {
        const existing = document.getElementById('gamesZoneSection');
        if (existing) return existing;

        const section = document.createElement('div');
        section.id = 'gamesZoneSection';
        section.className = 'games-zone-section';
        section.style.display = 'none';

        // Fruit level 11 image URL (watermelon — the highest tier)


        section.innerHTML = `
            <div class="gz-header-row">
		<div class="gz-neon-title">GAMES</div>
                <button class="gz-back-btn" id="gzBackBtn">${(window._i18n && window._i18n.get('gzBack')) || '\u2190 BACK'}</button>
            </div>

            <div class="gz-grid">
                <!-- Suika card -->
                <div class="gz-card" id="gzCardSuika">
                    <div class="gz-card-img gz-card-img-suika"></div>
                    <div class="gz-card-label">Suika</div>
                </div>
                <!-- Fruit Ninja card -->
                <div class="gz-card" id="gzCardFruitNinja">
                    <div class="gz-card-img gz-card-img-fruitninja"></div>
                    <div class="gz-card-label">Fruit Ninja</div>
                </div>

                <!-- Placeholder 2 -->
                <div class="gz-card gz-card-placeholder">
                    <div class="gz-card-img"></div>
                    <div class="gz-coin-blink">INSERT COIN</div>
                    <div class="gz-card-label">???</div>
                </div>
            </div>

            <div class="gz-pac-footer">
                <canvas id="gzPacCanvas"></canvas>
            </div>
        `;

        document.querySelector('.hub-container').appendChild(section);
        return section;
    }

    /* ── Panel transition helpers ────────────────────────────── */
    function getLinksSection() {
        return document.querySelector('.links-section');
    }

    function runMorseExit(target, callback) {
        target.classList.remove('morse-exit');
        target.querySelectorAll('.link-btn, .visita-mais-header').forEach(el => {
            el.style.opacity = ''; el.style.animation = '';
        });
        void target.offsetWidth;
        target.classList.add('morse-exit');
        setTimeout(callback, 620);
    }

    let pacAnim = null;

    /* ── Open Games Zone ─────────────────────────────────────── */
    function openGamesZone() {
        const ls = getLinksSection();
        if (!ls) return;
        if (document.getElementById('gamesZoneSection') &&
            document.getElementById('gamesZoneSection').style.display === 'flex') return;

        const wrap = document.querySelector('.suika-banner-wrap');
        if (wrap) wrap.classList.add('suika-disabled');

        const panel = buildGamesZonePanel();
        bindPanelButtons();

        runMorseExit(ls, () => {
            ls.style.display = 'none';
            _showGamesZonePanel(panel);
        });
    }

    /* ── Show panel (used by openGamesZone + return from Suika) ─ */
    function _showGamesZonePanel(panel) {
        panel = panel || document.getElementById('gamesZoneSection');
        if (!panel) return;
        panel.style.display = 'flex';
        void panel.offsetWidth;
        panel.classList.add('gz-panel-visible');
        window._gamesZoneOpen = true;

        const canvas = document.getElementById('gzPacCanvas');
        if (canvas) {
            if (pacAnim) pacAnim.stop();
            pacAnim = initPacCanvas(canvas);
            pacAnim.start();
        }
    }

    // Exposto ao suika.js para o botão Back do jogo voltar à Games Zone
    window._gamesZoneOpenPanel = function () {
        const panel = buildGamesZonePanel();
        bindPanelButtons();
        _showGamesZonePanel(panel);
    };

    /* ── Close Games Zone ────────────────────────────────────── */
    function closeGamesZone() {
        const panel = document.getElementById('gamesZoneSection');
        if (!panel) return;

        window._gamesZoneOpen = false;
        const wrap = document.querySelector('.suika-banner-wrap');
        if (wrap) wrap.classList.remove('suika-disabled');

        if (pacAnim) { pacAnim.stop(); pacAnim = null; }

        panel.classList.remove('morse-exit');
        void panel.offsetWidth;
        panel.classList.add('morse-exit');

        setTimeout(() => {
            panel.classList.remove('gz-panel-visible', 'morse-exit');
            panel.style.display = 'none';

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
        }, 620);
    }

    /* ── Intercept suikaLogoBtn via document delegation ─────── */
    let _btnsBound = false;
    function bindButtons() {
        if (_btnsBound) return;
        _btnsBound = true;
        document.addEventListener('click', (e) => {
            const logo = e.target.closest('#suikaLogoBtn');
            if (!logo) return;
            e.stopPropagation();
            e.preventDefault();
            buildGamesZonePanel();
            bindPanelButtons();
            openGamesZone();
        }, true); // capture phase — fires before any other listener
    }

    /* ── Bind back + game-card buttons (after panel is built) ── */
    function bindPanelButtons() {
        const panel = document.getElementById('gamesZoneSection');
        if (!panel) return;

        const backBtn = document.getElementById('gzBackBtn');
        if (backBtn && !backBtn._gzBound) {
            backBtn._gzBound = true;
            backBtn.addEventListener('click', closeGamesZone);
        }

        const lbBtn = document.getElementById('gzLbBtn');
        if (lbBtn && !lbBtn._gzBound) {
            lbBtn._gzBound = true;
            lbBtn.addEventListener('click', () => {});
        }

        const suikaCard = document.getElementById('gzCardSuika');
        if (suikaCard && !suikaCard._gzBound) {
            suikaCard._gzBound = true;
            suikaCard.addEventListener('click', () => {
                if (pacAnim) { pacAnim.stop(); pacAnim = null; }

                // Animar saída da Games Zone
                panel.classList.remove('morse-exit');
                void panel.offsetWidth;
                panel.classList.add('morse-exit');

                setTimeout(() => {
                    panel.classList.remove('gz-panel-visible', 'morse-exit');
                    panel.style.display = 'none';

                    // Abrir Suika directamente — sem passar pela links-section
                    if (window._suikaOpenGame) {
                        window._suikaOpenGame();
                    }
                }, 620);
            });
        }
    }

    /* ── CSS injection ───────────────────────────────────────── */
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
/* ═══════════════════════════════════════════════
   GAMES ZONE PANEL
   ═══════════════════════════════════════════════ */
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.games-zone-section {
    flex-direction: column;
    flex: 2 1 500px;
    position: relative;
    overflow: hidden;
    background: transparent;
    padding: 20px 20px 0 20px;
    gap: 14px;
    align-self: stretch;
    opacity: 0;
    pointer-events: none;
    /* dot-grid overlay */
}

/* dot grid removed */

.games-zone-section.gz-panel-visible {
    opacity: 1;
    pointer-events: auto;
}

/* Entry: each child animates in with staggered morse delays */
.games-zone-section.gz-panel-visible .gz-header-row,
.games-zone-section.gz-panel-visible .gz-grid,
.games-zone-section.gz-panel-visible .gz-pac-footer {
    animation: morseNeonIn 0.22s steps(1) forwards;
}
.games-zone-section.gz-panel-visible .gz-header-row  { animation-delay: 0.00s; }
.games-zone-section.gz-panel-visible .gz-grid        { animation-delay: 0.14s; }
.games-zone-section.gz-panel-visible .gz-pac-footer  { animation-delay: 0.28s; }

@keyframes morseNeonIn {
    0%   { opacity: 0; }
    25%  { opacity: 1; }
    45%  { opacity: 0; }
    75%  { opacity: 1; }
    100% { opacity: 1; }
}

/* Exit: each child animates out with staggered morse delays */
.games-zone-section.morse-exit {
    pointer-events: none;
}
.games-zone-section.morse-exit .gz-header-row,
.games-zone-section.morse-exit .gz-grid,
.games-zone-section.morse-exit .gz-pac-footer {
    animation: morseNeonOut 0.55s steps(1) forwards;
}
.games-zone-section.morse-exit .gz-grid        { animation-delay: 0.00s; }
.games-zone-section.morse-exit .gz-pac-footer  { animation-delay: 0.14s; }
.games-zone-section.morse-exit .gz-header-row  { animation-delay: 0.28s; }

@keyframes morseNeonOut {
    0%   { opacity: 1; }
    12%  { opacity: 0; }
    22%  { opacity: 0.85; }
    33%  { opacity: 0; }
    45%  { opacity: 0.6; }
    56%  { opacity: 0; }
    70%  { opacity: 0.35; }
    85%  { opacity: 0; }
    100% { opacity: 0; }
}

/* ── Header row ── */
.gz-header-row {
    position: relative; z-index: 2;
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 2px solid var(--cor-borda-principal, #283593);
    padding-bottom: 12px;
    flex-shrink: 0;
}

/* ──────────────────────────────────────────────────────────────
   🔙 BOTÃO BACK — edita aqui para mudar tamanho e proporções
   ──────────────────────────────────────────────────────────────
   font-size      → tamanho do texto        (ex: 0.55rem, 0.65rem, 0.8rem)
   padding        → tamanho interno         (ex: 6px 10px, 8px 16px, 10px 20px)
   letter-spacing → espaçamento letras      (ex: 1px, 2px, 3px)
   box-shadow     → sombra offset           (ex: 1px 1px, 2px 2px, 3px 3px)
   ────────────────────────────────────────────────────────────── */
.gz-back-btn {
    background: var(--cor-botao-bg, rgba(0,0,0,0.5));
    border: 1px solid var(--cor-borda-principal, #283593);
    box-shadow: 2px 2px 0 var(--cor-sombra, #b71c1c);
    color: var(--cor-texto-titulo, rgba(255,255,255,0.92));
    font-family: 'Inter', sans-serif;
    font-size: 0.65rem;
    font-weight: 900;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 8px 16px;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.2s, transform 0.15s;
}
.gz-back-btn:hover {
    background: var(--cor-borda-principal, #283593);
    color: var(--cor-texto-titulo, #fff);
    transform: translate(-1px,-1px);
}

/* ── Neon title ── */
.gz-lb-btn {
    background: var(--cor-botao-bg, rgba(0,0,0,0.5));
    border: 1px solid var(--cor-borda-principal, #283593);
    box-shadow: 2px 2px 0 var(--cor-sombra, #b71c1c);
    color: var(--cor-texto-titulo, rgba(255,255,255,0.92));
    font-family: 'Inter', sans-serif;
    font-size: 0.65rem;
    font-weight: 900;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 8px 16px;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.2s, transform 0.15s;
}
.gz-lb-btn:hover {
    background: var(--cor-borda-principal, #283593);
    color: var(--cor-texto-titulo, #fff);
    transform: translate(-1px,-1px);
}

/* ──────────────────────────────────────────────────────────────
   🎮 CONFIGURAÇÃO FÁCIL — edita aqui para mudar o título GAMES
   ──────────────────────────────────────────────────────────────
   font-size      → tamanho do texto        (ex: 1.5rem, 2rem, 2.5rem)
   letter-spacing → espaçamento letras      (ex: 4px, 8px, 12px)
   text-align     → alinhamento: left | center | right
   padding-left   → margem da esquerda      (ex: 0px, 8px, 20px)
   ────────────────────────────────────────────────────────────── */
.gz-neon-title {
    flex: 1;
    color: var(--cor-texto-titulo, #ffffff);
    font-family: 'Inter', sans-serif;
    font-size: 1.5rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 6px;
    text-align: left;
    text-shadow: 0 2px 8px rgba(0,0,0,0.8), 0 0 30px color-mix(in srgb, var(--cor-borda-principal, #283593) 20%, transparent);
}

/* ── Game cards grid ── */
.gz-grid {
    position: relative; z-index: 2;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
    align-content: flex-start;
    justify-content: center;
    padding-top: 4px;
}

.gz-card {
    position: relative;
    width: 130px; height: 130px;
    border: 1px solid var(--cor-borda-principal, #283593);
    box-shadow: 3px 3px 0 var(--cor-sombra, #b71c1c);
    cursor: pointer;
    overflow: hidden;
    flex-shrink: 0;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    background: var(--cor-botao-bg, rgba(0,0,0,0.55));
}
.gz-card:hover {
    transform: translate(-2px,-2px);
    box-shadow: 5px 5px 0 var(--cor-sombra, #b71c1c);
}

.gz-card-img {
    position: absolute; inset: 0;
    background-size: cover;
    background-position: center;
    transition: transform 0.3s ease;
}
.gz-card:hover .gz-card-img { transform: scale(1.05); }

/* Suika card image — dark purple bg + centered fruit */
.gz-card-img-suika {
    background: radial-gradient(circle at 55% 38%, #7b1fa2 0%, #1a0028 100%);
    background-image: url('https://raw.githubusercontent.com/Missiion/Caravela/refs/heads/main/capa_do_jogo_suika.jpg');
    background-size: cover;
    background-position: center center;
}

/* Fruit Ninja card image */
.gz-card-img-fruitninja {
    background: radial-gradient(circle at 50% 40%, #8b0000 0%, #0a0000 100%);
    background-image: url('https://raw.githubusercontent.com/Missiion/Caravela/refs/heads/main/capa_do_jogo_fruitninja.jpg');
    background-size: cover;
    background-position: center center;
}

.gz-card-label {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 40px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 0 8px 7px;
    background: linear-gradient(to top, color-mix(in srgb, var(--cor-borda-principal, #283593) 40%, rgba(0,0,0,0.5)) 0%, rgba(0,0,0,0.28) 60%, transparent);
    font-family: 'Press Start 2P', monospace;
    font-size: 0.52rem;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--cor-texto-titulo, rgba(255,255,255,0.97));
    text-shadow: 0 1px 6px rgba(0,0,0,0.9);
    text-align: center; z-index: 5;
    line-height: 1.55;
    box-sizing: border-box;
}

.gz-card-placeholder {
    opacity: 0.4;
    cursor: default;
    pointer-events: none;
}
.gz-card-placeholder .gz-card-img {
    background: color-mix(in srgb, var(--cor-borda-principal, #283593) 5%, transparent);
}

.gz-coin-blink {
    position: absolute; bottom: 18px; left: 0; right: 0; z-index: 5;
    font-family: 'Press Start 2P', monospace;
    font-size: 0.26rem; letter-spacing: 1px;
    color: color-mix(in srgb, var(--cor-sombra, #b71c1c) 75%, transparent);
    text-align: center;
    animation: gzCoinBlink 1.2s step-end infinite;
}
.gz-card-placeholder:nth-child(3) .gz-coin-blink { animation-delay: 0.6s; }
@keyframes gzCoinBlink { 0%,100%{opacity:1} 50%{opacity:0} }

/* ── Pac-Man footer ── */
.gz-pac-footer {
    position: relative; z-index: 2;
    height: 28px;
    overflow: hidden;
    flex-shrink: 0;
    margin: auto -20px 0 -20px;
}
#gzPacCanvas {
    position: absolute;
    top: 0; left: 0;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
}
/* ══════════════════════════════════════════════════════
   TEMAS — espelho das variáveis de styles.css
   (garante que as cores mudam sem depender de herança)
   ══════════════════════════════════════════════════════ */
body.theme-emerald .games-zone-section {
    --cor-borda-principal: #1b5e20;
    --cor-sombra:          #f9a825;
    --cor-botao-bg:        rgba(0, 0, 0, 0.65);
    --cor-botao-hover:     #1b5e20;
}
body.theme-mono .games-zone-section {
    --cor-borda-principal: #6b6b6b;
    --cor-sombra:          #1e1e1e;
    --cor-botao-bg:        rgba(0, 0, 0, 0.65);
    --cor-botao-hover:     #2e2e2e;
}

        `;
        document.head.appendChild(style);
    }

    /* ── Init ────────────────────────────────────────────────── */
    function init() {
        injectStyles();
        bindButtons();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
