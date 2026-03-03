// =========================================
// GENERAL SETTINGS
// =========================================
const rainVolume    = 0.10;
const maxWindAngle  = 10;
const windChangeSpeed = 0.002;

// =========================================
// RANDOM BACKGROUND SYSTEM
// =========================================
const BG_LIGHT = [
    'https://raw.githubusercontent.com/Missiion/Caravela/refs/heads/main/Ligh_1.png',
    'https://raw.githubusercontent.com/Missiion/Caravela/refs/heads/main/Ligh_2.jpg',
    'https://raw.githubusercontent.com/Missiion/Caravela/refs/heads/main/Ligh_3.jpg',
    'https://raw.githubusercontent.com/Missiion/Caravela/refs/heads/main/Light_4.png',
];
const BG_DARK = [
    'https://raw.githubusercontent.com/Missiion/Caravela/refs/heads/main/dark_1.jpg',
    'https://raw.githubusercontent.com/Missiion/Caravela/refs/heads/main/dark_2.jpg',
    'https://raw.githubusercontent.com/Missiion/Caravela/refs/heads/main/Dark_3.png',
    'https://raw.githubusercontent.com/Missiion/Caravela/refs/heads/main/dark_4.png',
];

let _lightIdx = Math.floor(Math.random() * BG_LIGHT.length);
let _darkIdx  = Math.floor(Math.random() * BG_DARK.length);
let _lightSlot = 'A';
let _darkSlot  = 'A';
let _blending  = false;

function pickNextLight() { _lightIdx = (_lightIdx + 1) % BG_LIGHT.length; }
function pickNextDark()  { _darkIdx  = (_darkIdx  + 1) % BG_DARK.length;  }

function createBgLayers() {
    const ids = ['bg-light-A','bg-light-B','bg-dark-A','bg-dark-B'];
    ids.forEach(id => {
        const el = document.createElement('div');
        el.id = id;
        el.style.cssText = `
            position:fixed; top:0; left:0; width:100%; height:100%;
            background-size:cover; background-position:center; background-repeat:no-repeat;
            opacity:0; transition:opacity 1.2s ease-in-out; z-index:-2; pointer-events:none;
        `;
        document.body.insertBefore(el, document.body.firstChild);
    });
}
createBgLayers();

document.querySelector('.bg-calm').style.display  = 'none';
document.querySelector('.bg-night').style.display = 'none';

// Night overlay
const nightOverlay = document.createElement('div');
nightOverlay.id = 'night-overlay';
nightOverlay.style.cssText = `
    position:fixed; top:0; left:0; width:100%; height:100%;
    background: rgba(0,0,12,0.45); opacity:0;
    transition: opacity 1.5s ease-in-out; z-index:-1; pointer-events:none;
`;
document.body.insertBefore(nightOverlay, document.body.firstChild);

const nightObserver = new MutationObserver(() => {
    nightOverlay.style.opacity = document.body.classList.contains('night-mode') ? '1' : '0';
});
nightObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

function preloadImage(url) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = img.onerror = () => resolve();
        img.src = url;
    });
}

function crossfade(nextUrl, getSlot, setSlot, idPrefix) {
    if (_blending) return;
    _blending = true;
    const current = getSlot();
    const next    = current === 'A' ? 'B' : 'A';
    const elNext  = document.getElementById(idPrefix + next);
    const elCurr  = document.getElementById(idPrefix + current);

    preloadImage(nextUrl).then(() => {
        elNext.style.backgroundImage = `url('${nextUrl}')`;
        elNext.style.opacity = '1';
        setTimeout(() => {
            elCurr.style.opacity = '0';
            setSlot(next);
            _blending = false;
        }, 1250);
    });
}

function applyBgLight(url, instant) {
    if (instant) {
        const elA = document.getElementById('bg-light-A');
        elA.style.transition = 'none';
        elA.style.backgroundImage = `url('${url}')`;
        elA.style.opacity = '1';
        document.getElementById('bg-light-B').style.opacity = '0';
        _lightSlot = 'A';
        setTimeout(() => { elA.style.transition = 'opacity 1.2s ease-in-out'; }, 50);
        return;
    }
    crossfade(url, () => _lightSlot, v => { _lightSlot = v; }, 'bg-light-');
}

function applyBgDark(url, instant) {
    if (instant) {
        const elA = document.getElementById('bg-dark-A');
        elA.style.transition = 'none';
        elA.style.backgroundImage = `url('${url}')`;
        elA.style.opacity = '1';
        document.getElementById('bg-dark-B').style.opacity = '0';
        _darkSlot = 'A';
        setTimeout(() => { elA.style.transition = 'opacity 1.2s ease-in-out'; }, 50);
        return;
    }
    crossfade(url, () => _darkSlot, v => { _darkSlot = v; }, 'bg-dark-');
}

function syncDarkLayers() {
    const isNight = document.body.classList.contains('night-mode');
    const FADE_MS = 1400;
    if (isNight) {
        ['bg-dark-A','bg-dark-B'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.style.zIndex = '-2'; el.style.transition = `opacity ${FADE_MS}ms ease-in-out`; }
        });
        ['bg-light-A','bg-light-B'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.style.zIndex = '-2';
            el.style.transition = `opacity ${FADE_MS}ms ease-in-out`;
            el.style.opacity = '0';
        });
        const el = document.getElementById('bg-dark-' + _darkSlot);
        if (el) el.style.opacity = '1';
    } else {
        ['bg-light-A','bg-light-B'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.style.zIndex = '-2'; el.style.transition = `opacity ${FADE_MS}ms ease-in-out`; }
        });
        ['bg-dark-A','bg-dark-B'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.style.zIndex = '-2';
            el.style.transition = `opacity ${FADE_MS}ms ease-in-out`;
            el.style.opacity = '0';
        });
        const el = document.getElementById('bg-light-' + _lightSlot);
        if (el) el.style.opacity = '1';
    }
}

const layerSyncObserver = new MutationObserver(syncDarkLayers);
layerSyncObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

Promise.all([preloadImage(BG_LIGHT[_lightIdx]), preloadImage(BG_DARK[_darkIdx])]).then(() => {
    applyBgLight(BG_LIGHT[_lightIdx], true);
    applyBgDark(BG_DARK[_darkIdx], true);
    ['bg-dark-A','bg-dark-B'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.style.zIndex = '-3'; el.style.opacity = '0'; }
    });
});

document.getElementById('bgShuffleBtn').addEventListener('click', function() {
    if (_blending) return;
    const isNight = document.body.classList.contains('night-mode');
    if (isNight) { pickNextDark();  applyBgDark(BG_DARK[_darkIdx]); }
    else         { pickNextLight(); applyBgLight(BG_LIGHT[_lightIdx]); }
    this.classList.remove('spinning');
    void this.offsetWidth;
    this.classList.add('spinning');
    setTimeout(() => this.classList.remove('spinning'), 500);
});

// =========================================
// MUSIC PLAYER
// =========================================
const playlist = [
    { title: "Art Deco",            cover: "https://raw.githubusercontent.com/Missiion/Caravela/refs/heads/main/Art_deco.png",           src: "https://cdn.jsdelivr.net/gh/Missiion/Caravela@main/Art_deco.mp3" },
    { title: "Big Iron",            cover: "https://raw.githubusercontent.com/Missiion/Caravela/refs/heads/main/Iron_on_his_hip.png",    src: "https://cdn.jsdelivr.net/gh/Missiion/Caravela@main/Big_Iron.mp3" },
    { title: "Distant Dreamer",     cover: "https://raw.githubusercontent.com/Missiion/Caravela/refs/heads/main/Distant_dreamer.png",    src: "https://cdn.jsdelivr.net/gh/Missiion/Caravela@main/Distant_dreamer.mp3" },
    { title: "Dragon Fly (Remix)",  cover: "https://raw.githubusercontent.com/Missiion/Caravela/refs/heads/main/Dragonfly.png",          src: "https://cdn.jsdelivr.net/gh/Missiion/Caravela@main/Dragonfly.mp3" },
    { title: "Hecha pa mi (Bochi)", cover: "https://raw.githubusercontent.com/Missiion/Caravela/refs/heads/main/Hecha_pa_mi_Bochi.png", src: "https://cdn.jsdelivr.net/gh/Missiion/Caravela@main/Hecha_pa_mi_Bochi.mp3" },
    { title: "Invisible",           cover: "https://raw.githubusercontent.com/Missiion/Caravela/refs/heads/main/INVISIBLE.png",          src: "https://cdn.jsdelivr.net/gh/Missiion/Caravela@main/INVISIBLE.mp3" },
    { title: "Me gustas tu (Remix)",cover: "https://raw.githubusercontent.com/Missiion/Caravela/refs/heads/main/Me_gustas_tu.png",      src: "https://cdn.jsdelivr.net/gh/Missiion/Caravela@main/Me_gustas_tu.mp3" },
    { title: "Chase",               cover: "https://raw.githubusercontent.com/Missiion/Caravela/refs/heads/main/Chase.png",              src: "https://cdn.jsdelivr.net/gh/Missiion/Caravela@main/chase.mp3" }
];

let currentTrackIndex = Math.floor(Math.random() * playlist.length);
let isPlaying = false;

const musicAudio   = document.getElementById('musicAudio');
const playerStage  = document.getElementById('playerStage');
const volumeSlider = document.getElementById('volumeSlider');

musicAudio.volume = 0.15;

function initCards() {
    playerStage.innerHTML = '';
    const ringRadius = 19;
    const ringCircumference = 2 * Math.PI * ringRadius;

    playlist.forEach((track, index) => {
        const card = document.createElement('div');
        card.className = 'music-card hidden';
        card.id = `music-card-${index}`;
        card.style.backgroundImage = `url('${track.cover}')`;

        // Progress ring
        const ringSvg = document.createElementNS('http://www.w3.org/2000/svg','svg');
        ringSvg.setAttribute('class','progress-ring-svg');
        ringSvg.setAttribute('viewBox','0 0 44 44');
        const trackCircle = document.createElementNS('http://www.w3.org/2000/svg','circle');
        trackCircle.setAttribute('class','progress-ring-track');
        trackCircle.setAttribute('cx','22'); trackCircle.setAttribute('cy','22'); trackCircle.setAttribute('r', ringRadius);
        const fillCircle = document.createElementNS('http://www.w3.org/2000/svg','circle');
        fillCircle.setAttribute('class','progress-ring-fill');
        fillCircle.setAttribute('cx','22'); fillCircle.setAttribute('cy','22'); fillCircle.setAttribute('r', ringRadius);
        fillCircle.style.strokeDasharray = ringCircumference;
        fillCircle.style.strokeDashoffset = ringCircumference;
        fillCircle.style.transformOrigin = '22px 22px';
        fillCircle.style.transform = 'rotate(-90deg)';
        ringSvg.appendChild(trackCircle);
        ringSvg.appendChild(fillCircle);
        card.appendChild(ringSvg);

        // ── Centre play/pause overlay button ──────────────────
        const playOverlay = document.createElement('div');
        playOverlay.className = 'card-play-btn';
        playOverlay.innerHTML =
            '<svg class="card-play-icon"  viewBox="0 0 24 24"><polygon points="6,3 20,12 6,21"/></svg>' +
            '<svg class="card-pause-icon" viewBox="0 0 24 24"><rect x="5" y="3" width="4" height="18"/><rect x="15" y="3" width="4" height="18"/></svg>';
        playOverlay.addEventListener('click', function(e) {
            e.stopPropagation();
            const btn = document.getElementById('vhsToggleBtn');
            if (btn) btn.click();
        });
        card.appendChild(playOverlay);
        // ──────────────────────────────────────────────────────

        playerStage.appendChild(card);
    });

    musicAudio.src = playlist[currentTrackIndex].src;
    musicAudio.load();
    updateCards();
}

// ── Next-track peek card ──────────────────────────────
function getNextIndex() {
    return (currentTrackIndex + 1) % playlist.length;
}

function updateNextCard() {
    const nextCard = document.getElementById('vhsNextCard');
    if (!nextCard) return;
    const ni = getNextIndex();
    nextCard.style.backgroundImage = `url('${playlist[ni].cover}')`;
    nextCard.classList.remove('dropping');
}

// ── Next-track peek ───────────────────────────────────────────
const PEEK_PX    = 22;
const CARD_SIZE  = 110;
const OVERLAP_PX = 6;

function positionNextWrap(expanded) {
    const wrap   = document.getElementById('vhsNextWrap');
    const player = document.querySelector('.music-player-wrapper');
    if (!wrap || !player) return;
    const rect = player.getBoundingClientRect();

    wrap.style.width  = CARD_SIZE + 'px';
    wrap.style.height = CARD_SIZE + 'px';
    wrap.style.left   = rect.left + 'px';
    wrap.style.bottom = 'auto';

    const topRest     = rect.top - PEEK_PX;
    const topExpanded = rect.top - CARD_SIZE + OVERLAP_PX;

    wrap.style.top = (expanded ? topExpanded : topRest) + 'px';
}

(function setupNextHover() {
    const wrap  = document.getElementById('vhsNextWrap');
    const card  = document.getElementById('vhsNextCard');
    const title = document.getElementById('vhsNextTitle');
    if (!wrap || !card) return;

    const BASE_REST     = 'scale(0.88) translateY(-4%)';
    const BASE_EXPANDED = 'scale(1.0) translateY(0)';
    const MAX_TILT_X    = 8;
    const MAX_TILT_Y    = 8;
    const BASE_TILT_X   = -10;

    let isExpanded      = false;
    let typeTimer       = null;
    let fadeTimer       = null;
    let eraseTimer      = null;
    let currentTarget   = '';
    let isErasing       = false;
    let pendingTitle    = null;

    const CHAR_DELAY  = 42;
    const SHOW_DELAY  = 480;
    const ERASE_DELAY = 6;

    function getNextTitle() {
        if (pendingTitle !== null) return pendingTitle;
        const ni = typeof getNextIndex === 'function' ? getNextIndex() : 0;
        return (playlist && playlist[ni]) ? playlist[ni].title || '' : '';
    }

    function startTypewriter() {
        if (!title) return;
        const text = getNextTitle();
        currentTarget = text;
        title.textContent = '';
        title.style.opacity  = '1';
        title.style.maxWidth = '300px';
        let i = 0;
        clearInterval(typeTimer);
        typeTimer = setInterval(() => {
            if (pendingTitle === null && currentTarget !== getNextTitle()) {
                clearInterval(typeTimer);
                eraseTitle(() => { if (isExpanded) startTypewriter(); });
                return;
            }
            if (i < text.length) {
                title.textContent += text[i++];
            } else {
                clearInterval(typeTimer);
                pendingTitle = null;
            }
        }, CHAR_DELAY);
    }

    function eraseTitle(onDone) {
        clearInterval(typeTimer);
        clearInterval(eraseTimer);
        clearTimeout(fadeTimer);
        isErasing = true;
        eraseTimer = setInterval(() => {
            if (title && title.textContent.length > 0) {
                title.textContent = title.textContent.slice(0, -1);
            } else {
                clearInterval(eraseTimer);
                isErasing = false;
                if (title) {
                    title.style.opacity  = '0';
                    title.style.maxWidth = '0';
                    title.textContent    = '';
                }
                if (typeof onDone === 'function') onDone();
            }
        }, ERASE_DELAY);
    }

    wrap._eraseTitle = (titleForNewTrack) => {
        pendingTitle = titleForNewTrack;
        eraseTitle(() => {
            if (isExpanded) {
                fadeTimer = setTimeout(startTypewriter, 80);
            }
        });
    };

    function fadeOutTitle() {
        clearInterval(typeTimer);
        clearInterval(eraseTimer);
        clearTimeout(fadeTimer);
        isErasing = false;
        if (!title) return;
        title.style.opacity = '0';
        setTimeout(() => {
            title.textContent    = '';
            title.style.maxWidth = '0';
        }, 300);
    }

    function applyTilt(e) {
        const r  = wrap.getBoundingClientRect();
        const nx = ((e.clientX - r.left) / r.width)  * 2 - 1;
        const ny = ((e.clientY - r.top)  / r.height) * 2 - 1;
        const tiltY =  nx * MAX_TILT_Y;
        const tiltX = BASE_TILT_X + (-ny * MAX_TILT_X);
        const base  = isExpanded ? BASE_EXPANDED : BASE_REST;
        card.style.transition = 'transform 0.08s ease, filter 0.48s cubic-bezier(0.4,0,0.2,1)';
        card.style.transform  = `${base} perspective(500px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
    }

    function resetTilt() {
        const base = isExpanded ? BASE_EXPANDED : BASE_REST;
        card.style.transition = 'transform 0.48s cubic-bezier(0.34,1.2,0.64,1), filter 0.48s cubic-bezier(0.4,0,0.2,1)';
        card.style.transform  = base;
    }

    wrap.addEventListener('mouseenter', () => {
        isExpanded = true;
        wrap.classList.add('expanded');
        positionNextWrap(true);
        clearTimeout(fadeTimer);
        if (!isErasing) fadeTimer = setTimeout(startTypewriter, SHOW_DELAY);
    });

    wrap.addEventListener('mousemove', applyTilt);

    wrap.addEventListener('mouseleave', () => {
        isExpanded = false;
        wrap.classList.remove('expanded');
        positionNextWrap(false);
        resetTilt();
        clearTimeout(fadeTimer);
        fadeOutTitle();
    });
})();

window.addEventListener('resize', () => {
    const isExp = document.getElementById('vhsNextWrap')?.classList.contains('expanded');
    positionNextWrap(!!isExp);
});
requestAnimationFrame(() => requestAnimationFrame(() => positionNextWrap(false)));

// Click on next peek → drop animation then change track
const vhsNextWrap = document.getElementById('vhsNextWrap');
if (vhsNextWrap) {
    vhsNextWrap.addEventListener('click', () => {
        const nextCard = document.getElementById('vhsNextCard');
        if (!nextCard || nextCard.classList.contains('dropping')) return;
        nextCard.classList.add('dropping');

        const futureNextIndex = (currentTrackIndex + 2) % playlist.length;
        const futureNextTitle = playlist[futureNextIndex] ? playlist[futureNextIndex].title : '';

        if (typeof vhsNextWrap._eraseTitle === 'function') {
            vhsNextWrap._eraseTitle(futureNextTitle);
        }

        setTimeout(() => {
            nextTrack();
        }, 420);
    });
}

function updateCards() {
    // Active card
    playlist.forEach((_, index) => {
        const card = document.getElementById(`music-card-${index}`);
        card.classList.remove('active', 'hidden', 'playing');
        if (index === currentTrackIndex) {
            card.classList.add('active');
            if (isPlaying) card.classList.add('playing');
        } else {
            card.classList.add('hidden');
        }
    });

    // Title
    const titleEl = document.getElementById('vhsTitle');
    if (titleEl) titleEl.innerText = playlist[currentTrackIndex].title;

    // Dots
    const dotsEl = document.getElementById('vhsDots');
    if (dotsEl) {
        dotsEl.innerHTML = '';
        playlist.forEach((_, i) => {
            const d = document.createElement('div');
            d.className = 'vhs-dot' + (i === currentTrackIndex ? ' on' : '');
            dotsEl.appendChild(d);
        });
    }

    // Toggle button icon
    const toggleBtn = document.getElementById('vhsToggleBtn');
    if (toggleBtn) toggleBtn.classList.toggle('playing', isPlaying);

    // EQ bars
    const eq = document.getElementById('vhsEq');
    if (eq) eq.classList.toggle('playing', isPlaying);

    // ── Sync centre overlay icon on the active card ────────
    const activeOverlay = document.querySelector('.music-card.active .card-play-btn');
    if (activeOverlay) activeOverlay.classList.toggle('playing', isPlaying);
    // ──────────────────────────────────────────────────────

    // Update next peek
    updateNextCard();
}

function togglePlay() {
    if (musicAudio.paused) {
        if (musicAudio.readyState < 2) {
            musicAudio.load();
            musicAudio.addEventListener('canplay', function onCanPlay() {
                musicAudio.removeEventListener('canplay', onCanPlay);
                musicAudio.play().then(() => { isPlaying = true; updateCards(); }).catch(e => console.log(e));
            }, { once: true });
        } else {
            musicAudio.play().then(() => { isPlaying = true; updateCards(); }).catch(e => console.log(e));
        }
    } else {
        musicAudio.pause();
        isPlaying = false;
        updateCards();
    }
}

function changeTrack(newIndex) {
    currentTrackIndex = newIndex;
    musicAudio.src = playlist[currentTrackIndex].src;
    musicAudio.load();
    if (isPlaying) {
        musicAudio.addEventListener('canplay', function onCanPlay() {
            musicAudio.removeEventListener('canplay', onCanPlay);
            musicAudio.play().catch(e => console.log(e));
        }, { once: true });
    }
    updateCards();
}

function nextTrack() { changeTrack((currentTrackIndex + 1) % playlist.length); }
function prevTrack() { changeTrack((currentTrackIndex - 1 + playlist.length) % playlist.length); }

musicAudio.onended = nextTrack;
volumeSlider.oninput = (e) => {
    musicAudio.volume = e.target.value / 100;
    const pct = e.target.value + '%';
    e.target.style.background = `linear-gradient(to right, var(--cor-sombra) ${pct}, rgba(255,255,255,0.15) ${pct})`;
};

// Toggle button + animated status text
const vhsToggleBtn  = document.getElementById('vhsToggleBtn');
const vhsStatusText = document.getElementById('vhsStatusText');

function animateStatus(newText, isPlayingState) {
    if (!vhsStatusText) return;
    vhsStatusText.classList.add('slide-out');
    setTimeout(() => {
        vhsStatusText.classList.remove('slide-out');
        vhsStatusText.classList.add('slide-in');
        vhsStatusText.textContent = newText;
        vhsStatusText.classList.toggle('playing', isPlayingState);
        void vhsStatusText.offsetHeight;
        vhsStatusText.classList.remove('slide-in');
    }, 300);
}

if (vhsToggleBtn) {
    vhsToggleBtn.onclick = () => {
        const wasPlaying = isPlaying;
        togglePlay();
        animateStatus(wasPlaying ? 'Stopped' : 'Playing', !wasPlaying);
    };
}

// ── Track title tooltip ───────────────────────────────────────
(function setupTitleTooltip() {
    const tooltip = document.createElement('div');
    tooltip.className = 'vhs-title-tooltip';
    document.body.appendChild(tooltip);

    let hoverTimer = null;
    const TOOLTIP_H = 20;

    function showTooltip(titleEl) {
        if (titleEl.scrollWidth <= titleEl.clientWidth + 1) return;
        tooltip.textContent = titleEl.textContent || '';

        tooltip.style.visibility = 'hidden';
        tooltip.style.left = '0px';
        tooltip.style.top  = '-9999px';
        tooltip.classList.add('visible');
        const tw = tooltip.offsetWidth;
        tooltip.classList.remove('visible');
        tooltip.style.visibility = '';

        const player = document.querySelector('.music-player-wrapper');
        const pr = player ? player.getBoundingClientRect() : titleEl.getBoundingClientRect();
        const centreX = pr.left + pr.width / 2;
        tooltip.style.left = Math.max(4, centreX - tw / 2) + 'px';
        tooltip.style.top  = (pr.top - TOOLTIP_H - 10) + 'px';
        tooltip.classList.add('visible');
    }

    function hideTooltip() {
        clearTimeout(hoverTimer);
        hoverTimer = null;
        tooltip.classList.remove('visible');
    }

    const titleEl = document.getElementById('vhsTitle');
    if (!titleEl) return;

    titleEl.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => showTooltip(titleEl), 1000);
    });
    titleEl.addEventListener('mouseleave', hideTooltip);
})();

initCards();
positionNextWrap(false);

// Progress ring animation
(function() {
    const ringRadius = 19;
    const ringCircumference = 2 * Math.PI * ringRadius;
    function updateProgressRing() {
        const activeCard = document.querySelector('.music-card.active');
        if (activeCard) {
            const fillCircle = activeCard.querySelector('.progress-ring-fill');
            if (fillCircle && musicAudio.duration) {
                const pct = musicAudio.currentTime / musicAudio.duration;
                fillCircle.style.strokeDashoffset = ringCircumference * (1 - pct);
            } else if (fillCircle) {
                fillCircle.style.strokeDashoffset = ringCircumference;
            }
        }
        requestAnimationFrame(updateProgressRing);
    }
    requestAnimationFrame(updateProgressRing);
})();

// Scroll to seek
let seekHintDismissed = false;
playerStage.addEventListener('wheel', (e) => {
    const activeCard = document.querySelector('.music-card.active');
    if (!activeCard || !activeCard.matches(':hover')) return;
    e.preventDefault();
    if (!musicAudio.duration) return;
    const seekSecs = e.deltaY > 0 ? -5 : 5;
    musicAudio.currentTime = Math.max(0, Math.min(musicAudio.duration, musicAudio.currentTime + seekSecs));
    if (!seekHintDismissed) {
        seekHintDismissed = true;
        const hint = document.getElementById('vhsHint');
        if (hint) { hint.classList.add('dismissed'); hint.style.opacity = '0'; }
    }
}, { passive: false });

// =========================================
// PARALLAX 3D
// =========================================
(function() {
    const card = document.getElementById('parallax-box');
    document.body.addEventListener('mousemove', (e) => {
        const xAxis = (window.innerWidth  / 2 - e.pageX) / 150;
        const yAxis = (window.innerHeight / 2 - e.pageY) / 150;
        card.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    });
    document.body.addEventListener('mouseleave', () => {
        card.style.transition = 'transform 0.5s ease';
        card.style.transform = 'rotateY(0deg) rotateX(0deg)';
    });
    document.body.addEventListener('mouseenter', () => { card.style.transition = 'none'; });
})();

// =========================================
// RAIN SYSTEM
// =========================================
(function() {
    const rainBox = document.getElementById('rainBox');
    for (let i = 0; i < 150; i++) {
        const drop = document.createElement('div');
        drop.classList.add('drop');
        drop.style.left = Math.random() * 100 + '%';
        drop.style.animationDuration = Math.random() * 0.8 + 1.2 + 's';
        drop.style.animationDelay = Math.random() * 2 + 's';
        rainBox.appendChild(drop);
    }

    let windTime = 0;
    function animateWind() {
        rainBox.style.transform = `rotate(${Math.sin(windTime) * maxWindAngle}deg)`;
        windTime += windChangeSpeed;
        requestAnimationFrame(animateWind);
    }
    animateWind();

    const audio    = document.getElementById('rainAudio');
    const rainBtn  = document.getElementById('rainBtn');
    audio.volume   = rainVolume;
    let isStorming = false;

    function startStorm() {
        const tryPlay = () => {
            audio.play().then(() => {
                rainBox.style.opacity = '1';
                rainBtn.classList.add('sound-on');
                isStorming = true;
                syncSoundPanel();
            }).catch(() => {});
        };
        if (audio.readyState < 2) { audio.load(); audio.addEventListener('canplay', tryPlay, { once: true }); }
        else tryPlay();
    }
    function stopStorm() {
        audio.pause();
        rainBox.style.opacity = '0';
        rainBtn.classList.remove('sound-on');
        isStorming = false;
        syncSoundPanel();
    }
    rainBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isStorming) stopStorm(); else startStorm();
    });

    // Screen drops on rain
    let dropInterval = null;
    function spawnScreenDrop() {
        const drop = document.createElement('div');
        drop.className = 'screen-drop';
        const x = Math.random() * (window.innerWidth - 4);
        const len = 18 + Math.random() * 30;
        const dur = 0.6 + Math.random() * 0.8;
        const endY = Math.floor(80 + Math.random() * (window.innerHeight - 120));
        drop.style.cssText = `left:${x}px; height:${len}px; --drop-end:${endY}px; animation-duration:${dur}s;`;
        document.body.appendChild(drop);
        drop.addEventListener('animationend', () => drop.remove());
    }
    rainBtn.addEventListener('click', () => {
        setTimeout(() => {
            if (isStorming) {
                dropInterval = dropInterval || setInterval(() => {
                    const count = 2 + Math.floor(Math.random() * 3);
                    for (let i = 0; i < count; i++) setTimeout(spawnScreenDrop, Math.random() * 300);
                }, 180);
            } else {
                clearInterval(dropInterval);
                dropInterval = null;
            }
        }, 50);
    });

    // Dryer
    const dryerAudio = document.getElementById('dryerAudio');
    const dryerBtn   = document.getElementById('dryerBtn');
    dryerAudio.volume = 0.10;
    let isDryer = false;
    dryerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isDryer) {
            dryerAudio.pause(); dryerBtn.classList.remove('sound-on'); isDryer = false; syncSoundPanel();
        } else {
            const tryPlay = () => dryerAudio.play().then(() => { dryerBtn.classList.add('sound-on'); isDryer = true; syncSoundPanel(); }).catch(() => {});
            if (dryerAudio.readyState < 2) { dryerAudio.load(); dryerAudio.addEventListener('canplay', tryPlay, { once: true }); }
            else tryPlay();
        }
    });

    // Wind
    const windAudio = document.getElementById('windAudio');
    const windBtn   = document.getElementById('windBtn');
    windAudio.volume = 0.10;
    let isWind = false;
    windBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isWind) {
            windAudio.pause(); windBtn.classList.remove('sound-on'); isWind = false; syncSoundPanel();
        } else {
            const tryPlay = () => windAudio.play().then(() => { windBtn.classList.add('sound-on'); isWind = true; syncSoundPanel(); }).catch(() => {});
            if (windAudio.readyState < 2) { windAudio.load(); windAudio.addEventListener('canplay', tryPlay, { once: true }); }
            else tryPlay();
        }
    });

    // Volume sliders
    document.getElementById('sndVolRain').addEventListener('input',  (e) => { audio.volume       = e.target.value / 100; });
    document.getElementById('sndVolDryer').addEventListener('input', (e) => { dryerAudio.volume  = e.target.value / 100; });
    document.getElementById('sndVolWind').addEventListener('input',  (e) => { windAudio.volume   = e.target.value / 100; });

    window.syncSoundPanel = function() {
        document.getElementById('sndWrapRain').classList.toggle('sound-on',  isStorming);
        document.getElementById('sndWrapDryer').classList.toggle('sound-on', isDryer);
        document.getElementById('sndWrapWind').classList.toggle('sound-on',  isWind);
    };
    syncSoundPanel();
})();

// =========================================
// EYE BUTTON (Hide/Show UI)
// =========================================
(function() {
    const eyeBtn    = document.getElementById('eyeBtn');
    const eyeOpen   = document.getElementById('eyeOpen');
    const eyeClosed = document.getElementById('eyeClosed');
    let hidden = false;
    eyeBtn.addEventListener('click', () => {
        hidden = !hidden;
        document.body.classList.toggle('hidden-mode', hidden);
        eyeBtn.classList.toggle('active', hidden);
        eyeOpen.style.display   = hidden ? 'none'  : 'block';
        eyeClosed.style.display = hidden ? 'block' : 'none';
    });
})();

// =========================================
// CLOCK
// =========================================
(function() {
    const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    function updateClock() {
        const now = new Date();
        const h = now.getHours().toString().padStart(2,'0');
        const m = now.getMinutes().toString().padStart(2,'0');
        const s = now.getSeconds().toString().padStart(2,'0');
        document.getElementById('clockTime').textContent = `${h}:${m}:${s}`;
        document.getElementById('clockDate').textContent =
            `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    }
    updateClock();
    setInterval(updateClock, 1000);
})();

// =========================================
// SEASON HINTS
// =========================================
(function() {
    function isWinter() { const m = new Date().getMonth()+1, d = new Date().getDate(); return m===12||m===1||(m===2&&d<=28); }
    function isSpring() { const m = new Date().getMonth()+1; return m>=3&&m<=5; }
    function isSummer() { const m = new Date().getMonth()+1; return m>=6&&m<=8; }
    function isAutumn() { const m = new Date().getMonth()+1; return m>=9&&m<=11; }

    const allHints     = ['snowHint','springHint','autumnHint','summerHint'].map(id => document.getElementById(id));
    const [snowEl, springEl, autumnEl, summerEl] = allHints;

    function dismissHint(el) {
        el.classList.add('fading');
        setTimeout(() => { el.classList.remove('visible','fading'); }, 620);
    }
    function clearOthers(except) { allHints.forEach(h => { if (h !== except) h.classList.remove('visible','fading'); }); }

    function showSnowHint()   { clearOthers(snowEl);   snowEl.classList.remove('fading');   snowEl.classList.add('visible'); }
    function showSpringHint() { clearOthers(springEl); springEl.classList.remove('fading'); springEl.classList.add('visible'); }
    function showAutumnHint() { clearOthers(autumnEl); autumnEl.classList.remove('fading'); autumnEl.classList.add('visible'); }
    function showSummerHint() { clearOthers(summerEl); summerEl.classList.remove('fading'); summerEl.classList.add('visible'); }

    snowEl.addEventListener('click',   () => dismissHint(snowEl));
    springEl.addEventListener('click', () => dismissHint(springEl));
    autumnEl.addEventListener('click', () => dismissHint(autumnEl));
    summerEl.addEventListener('click', () => dismissHint(summerEl));

    window._showSnowHint   = showSnowHint;   window._hideSnowHint   = () => dismissHint(snowEl);
    window._showSpringHint = showSpringHint; window._hideSpringHint = () => dismissHint(springEl);
    window._showAutumnHint = showAutumnHint; window._hideAutumnHint = () => dismissHint(autumnEl);
    window._showSummerHint = showSummerHint; window._hideSummerHint = () => dismissHint(summerEl);

    if      (isWinter()) showSnowHint();
    else if (isSpring()) showSpringHint();
    else if (isSummer()) showSummerHint();
    else if (isAutumn()) showAutumnHint();

    document.addEventListener('keydown', () => {
        setTimeout(() => {
            if (window._snowActive)   dismissHint(snowEl);
            if (window._springActive) dismissHint(springEl);
            if (window._autumnActive) dismissHint(autumnEl);
            if (window._summerActive) dismissHint(summerEl);
        }, 80);
    });
})();

// =========================================
// MOD TAB
// =========================================
(function() {
    const tab    = document.getElementById('modTab');
    const handle = document.getElementById('modTabHandle');
    let isOpen   = false;

    let leoBuffer = '';
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        leoBuffer += e.key.toLowerCase();
        if (leoBuffer.length > 5) leoBuffer = leoBuffer.slice(-5);
        if (leoBuffer.endsWith('leo')) {
            document.body.classList.toggle('mod-mode');
            leoBuffer = '';
        }
    });

    handle.addEventListener('click', () => {
        isOpen = !isOpen;
        tab.classList.toggle('open', isOpen);
    });

    document.getElementById('modBtnForceSnowHint').addEventListener('click',   () => window._showSnowHint   && window._showSnowHint());
    document.getElementById('modBtnForceSpringHint').addEventListener('click', () => window._showSpringHint && window._showSpringHint());
    document.getElementById('modBtnForceAutumnHint').addEventListener('click', () => window._showAutumnHint && window._showAutumnHint());
    document.getElementById('modBtnForceSummerHint').addEventListener('click', () => window._showSummerHint && window._showSummerHint());

    function fileToURL(input, callback) {
        input.addEventListener('change', () => {
            const file = input.files[0];
            if (!file) return;
            callback(URL.createObjectURL(file));
        });
    }
    fileToURL(document.getElementById('modImgDark'),    (url) => { applyBgDark(url); });
    fileToURL(document.getElementById('modImgLight'),   (url) => { applyBgLight(url); });
    fileToURL(document.getElementById('modImgProfile'), (url) => {
        document.getElementById('profilePic').src   = url;
        document.getElementById('physicsImg').src   = url;
    });
})();

// =========================================
// NIGHT MODE (MOON BUTTON + STARS + COMETS)
// =========================================
(function() {
    const moonBtn     = document.getElementById('moonBtn');
    const nightCanvas = document.getElementById('night-canvas');
    const ctx         = nightCanvas.getContext('2d');
    let nightActive   = false;
    let animFrame     = null;
    let W, H;

    function resize() { W = nightCanvas.width = window.innerWidth; H = nightCanvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    const NUM_STARS = 90;
    const stars = [];
    function initStars() {
        stars.length = 0;
        for (let i = 0; i < NUM_STARS; i++) stars.push(newStar());
    }
    function newStar(born) {
        return {
            x: Math.random() * (W || window.innerWidth),
            y: Math.random() * (H || window.innerHeight),
            r: 0.8 + Math.random() * 2.2,
            phase: Math.random() * Math.PI * 2,
            speed: 0.008 + Math.random() * 0.018,
            alpha: 0,
            born: born || false
        };
    }

    const comets = [];
    function spawnComet() {
        const fromTop = Math.random() < 0.5;
        const x = fromTop ? Math.random() * W : 0;
        const y = fromTop ? 0 : Math.random() * H * 0.5;
        const angle = (Math.PI / 6) + Math.random() * (Math.PI / 6);
        comets.push({ x, y, vx: Math.cos(angle) * (6 + Math.random() * 5), vy: Math.sin(angle) * (3 + Math.random() * 3), len: 80 + Math.random() * 120, alpha: 1, done: false });
    }

    let cometTimer = null;
    function scheduleCometTimer() {
        cometTimer = setTimeout(() => {
            if (nightActive) { spawnComet(); scheduleCometTimer(); }
        }, 4000 + Math.random() * 9000);
    }

    function drawFrame() {
        ctx.clearRect(0, 0, W, H);

        stars.forEach((s, i) => {
            s.phase += s.speed;
            s.alpha = (Math.sin(s.phase) + 1) / 2;
            if (s.alpha < 0.02 && s.born) { stars[i] = newStar(true); return; }
            s.born = true;

            ctx.save();
            ctx.globalAlpha = s.alpha * 0.85;
            const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
            grd.addColorStop(0, 'rgba(220,230,255,1)');
            grd.addColorStop(0.4, 'rgba(180,200,255,0.5)');
            grd.addColorStop(1, 'rgba(180,200,255,0)');
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill();
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,1)'; ctx.fill();
            ctx.restore();
        });

        for (let i = comets.length - 1; i >= 0; i--) {
            const c = comets[i];
            c.x += c.vx; c.y += c.vy; c.alpha -= 0.012;
            if (c.alpha <= 0 || c.x > W + 200 || c.y > H + 200) { comets.splice(i, 1); continue; }

            ctx.save();
            ctx.globalAlpha = c.alpha;
            const mag = Math.hypot(c.vx, c.vy);
            const tailX = c.x - (c.vx / mag) * c.len;
            const tailY = c.y - (c.vy / mag) * c.len;
            const grad = ctx.createLinearGradient(tailX, tailY, c.x, c.y);
            grad.addColorStop(0, 'rgba(255,255,255,0)');
            grad.addColorStop(0.7, 'rgba(200,220,255,0.5)');
            grad.addColorStop(1, 'rgba(255,255,255,1)');
            ctx.strokeStyle = grad; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(c.x, c.y); ctx.stroke();
            ctx.beginPath(); ctx.arc(c.x, c.y, 2.5, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill();
            ctx.restore();
        }

        animFrame = requestAnimationFrame(drawFrame);
    }

    function startNight() { nightCanvas.style.display = 'block'; initStars(); drawFrame(); scheduleCometTimer(); }
    function stopNight()  { nightCanvas.style.display = 'none';  cancelAnimationFrame(animFrame); clearTimeout(cometTimer); comets.length = 0; ctx.clearRect(0, 0, W, H); }

    moonBtn.addEventListener('click', () => {
        nightActive = !nightActive;
        document.body.classList.toggle('night-mode', nightActive);
        moonBtn.classList.toggle('active', nightActive);

        const dots = document.querySelectorAll('.theme-dot');
        if (nightActive) {
            moonBtn._prevTheme = document.body.className.match(/theme-(\w+)/)?.[1] || 'default';
            document.body.classList.remove('theme-emerald'); document.body.classList.add('theme-mono');
            dots.forEach(d => d.classList.toggle('active', d.dataset.theme === 'mono'));
            startNight();
        } else {
            const prev = moonBtn._prevTheme || 'default';
            document.body.classList.remove('theme-mono');
            if (prev !== 'default') document.body.classList.add('theme-' + prev);
            dots.forEach(d => d.classList.toggle('active', d.dataset.theme === prev));
            stopNight();
        }
    });
})();

// =========================================
// THEME SWITCHER
// =========================================
(function() {
    const dots   = document.querySelectorAll('.theme-dot');
    const themes = ['default', 'emerald', 'mono'];

    function applyTheme(theme) {
        document.body.classList.remove(...themes.map(t => 'theme-' + t));
        if (theme !== 'default') document.body.classList.add('theme-' + theme);
        dots.forEach(d => d.classList.toggle('active', d.dataset.theme === theme));
        try { localStorage.setItem('hub_theme', theme); } catch(e) {}
    }

    dots.forEach(dot => { dot.addEventListener('click', () => applyTheme(dot.dataset.theme)); });

    try {
        const saved = localStorage.getItem('hub_theme');
        if (saved && themes.includes(saved)) applyTheme(saved);
    } catch(e) {}
})();

// =========================================
// PHYSICS (Profile Image)
// =========================================
(function() {
    const wrapper = document.getElementById('profileWrapper');
    const physImg = document.getElementById('physicsImg');
    const hint    = document.getElementById('physics-hint');
    let activated = false;
    let px, py, vx = 0, vy = 0, isDragging = false;
    let dragOffX, dragOffY, lastMX, lastMY, lastT;
    const GRAVITY = 0.5, FRICTION = 0.985, BOUNCE = 0.6;
    const W = () => physImg.offsetWidth;
    const H = () => physImg.offsetHeight;

    function clampX(x) { return Math.max(0, Math.min(window.innerWidth  - W(), x)); }
    function clampY(y) { return Math.max(0, Math.min(window.innerHeight - H(), y)); }

    function showHint() {
        hint.style.display = 'block';
        hint.style.animation = 'none';
        void hint.offsetWidth;
        hint.style.animation = 'fadeHint 3s ease forwards';
        setTimeout(() => { hint.style.display = 'none'; }, 3000);
    }

    let snapTimer = null, snapping = false;

    function checkSnap() {
        if (snapping) return;
        const wRect = wrapper.getBoundingClientRect();
        const cx = px + W() / 2, cy = py + H() / 2;
        const wx = wRect.left + wRect.width / 2, wy = wRect.top + wRect.height / 2;
        const dist = Math.hypot(cx - wx, cy - wy);

        if (dist < 90) {
            wrapper.classList.add('snap-ready');
            if (!snapTimer) snapTimer = setTimeout(snapBack, 1200);
        } else {
            wrapper.classList.remove('snap-ready');
            clearTimeout(snapTimer); snapTimer = null;
        }
    }

    function snapBack() {
        snapping = true; isDragging = false; wrapper.classList.remove('snap-ready');
        const wRect = wrapper.getBoundingClientRect();
        const targetX = wRect.left, targetY = wRect.top;
        vx = 0; vy = 0;

        function animSnap() {
            px += (targetX - px) * 0.18; py += (targetY - py) * 0.18;
            physImg.style.left = px + 'px'; physImg.style.top = py + 'px';
            if (Math.abs(px - targetX) > 1 || Math.abs(py - targetY) > 1) {
                requestAnimationFrame(animSnap);
            } else {
                physImg.classList.remove('active'); physImg.style.display = 'none';
                wrapper.classList.remove('broken');
                activated = false; snapping = false; snapTimer = null; vx = 0; vy = 0;
            }
        }
        requestAnimationFrame(animSnap);
    }

    function activate() {
        if (activated) return;
        activated = true; wrapper.classList.add('broken');
        const rect = wrapper.getBoundingClientRect();
        px = rect.left; py = rect.top;
        vx = (Math.random() - 0.5) * 14; vy = -12;
        physImg.style.left = px + 'px'; physImg.style.top = py + 'px';
        physImg.style.display = 'block'; physImg.classList.add('active');
        const popAudio = new Audio('https://cdn.jsdelivr.net/gh/Missiion/Caravela@main/Efeito_pop.mp3');
        popAudio.volume = 0.7; popAudio.play().catch(() => {});
        showHint();
        requestAnimationFrame(physicsLoop);
    }

    function physicsLoop() {
        if (snapping) return;
        if (!isDragging) {
            vx *= FRICTION; vy += GRAVITY; px += vx; py += vy;
            if (py + H() >= window.innerHeight) { py = window.innerHeight - H(); vy *= -BOUNCE; vx *= 0.85; if (Math.abs(vy) < 1) vy = 0; }
            if (py <= 0)                        { py = 0; vy *= -BOUNCE; }
            if (px <= 0)                        { px = 0; vx *= -BOUNCE; }
            if (px + W() >= window.innerWidth)  { px = window.innerWidth - W(); vx *= -BOUNCE; }
            physImg.style.left = px + 'px'; physImg.style.top = py + 'px';
            checkSnap();
        }
        requestAnimationFrame(physicsLoop);
    }

    physImg.addEventListener('mousedown', (e) => {
        if (snapping) return;
        isDragging = true; dragOffX = e.clientX - px; dragOffY = e.clientY - py;
        lastMX = e.clientX; lastMY = e.clientY; lastT = Date.now(); vx = 0; vy = 0;
        clearTimeout(snapTimer); snapTimer = null; wrapper.classList.remove('snap-ready'); e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const now = Date.now(), dt = Math.max(1, now - lastT);
        vx = (e.clientX - lastMX) / dt * 16; vy = (e.clientY - lastMY) / dt * 16;
        lastMX = e.clientX; lastMY = e.clientY; lastT = now;
        px = clampX(e.clientX - dragOffX); py = clampY(e.clientY - dragOffY);
        physImg.style.left = px + 'px'; physImg.style.top = py + 'px'; checkSnap();
    });
    document.addEventListener('mouseup', () => { isDragging = false; });

    physImg.addEventListener('touchstart', (e) => {
        if (snapping) return;
        const t = e.touches[0]; isDragging = true;
        dragOffX = t.clientX - px; dragOffY = t.clientY - py;
        lastMX = t.clientX; lastMY = t.clientY; lastT = Date.now(); vx = 0; vy = 0;
        clearTimeout(snapTimer); snapTimer = null; wrapper.classList.remove('snap-ready');
    }, { passive: true });
    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const t = e.touches[0], now = Date.now(), dt = Math.max(1, now - lastT);
        vx = (t.clientX - lastMX) / dt * 16; vy = (t.clientY - lastMY) / dt * 16;
        lastMX = t.clientX; lastMY = t.clientY; lastT = now;
        px = clampX(t.clientX - dragOffX); py = clampY(t.clientY - dragOffY);
        physImg.style.left = px + 'px'; physImg.style.top = py + 'px'; checkSnap();
    }, { passive: true });
    document.addEventListener('touchend', () => { isDragging = false; });

    wrapper.addEventListener('click', activate);
})();