/* ==========================================================================
   PREMIUM BIRTHDAY CARD - INTERACTIVE CORE
   ========================================================================== */

// Global State
let isPlaying = false;
let audioContext = null;
let currentPolaroidIndex = 0;
const totalPolaroids = 3;

// Synthesize pop sound using Web Audio API (cross-device offline compatibility)
function playPopSound() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Ensure AudioContext is resumed (browser safety policies)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        // Frequency sweep for a nice "pop" sound
        oscillator.frequency.setValueAtTime(250, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.08);
        
        // Fast volume decay
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.08);
    } catch (e) {
        console.log("Audio play blocked or unsupported:", e);
    }
}

// Synthesize a magical shimmer sound when blowing out the candle
function playShimmerSound() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const now = audioContext.currentTime;
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        gainNode.connect(audioContext.destination);

        // Create an arpeggio chord of chiming frequencies
        const frequencies = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C major high chord
        frequencies.forEach((freq, idx) => {
            const osc = audioContext.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + (idx * 0.08));
            osc.connect(gainNode);
            osc.start(now + (idx * 0.08));
            osc.stop(now + 1.2);
        });
    } catch (e) {
        console.log("Audio shimmer failed:", e);
    }
}

// ==========================================================================
// UNWRAPPING INTERACTION (GIFT OPEN)
// ==========================================================================
function openGift() {
    const lid = document.getElementById('gift-lid');
    const body = document.getElementById('gift-body');
    const welcome = document.getElementById('welcome-view');
    const celebration = document.getElementById('celebration-view');
    const bgMusic = document.getElementById('bg-music');
    const musicBtn = document.getElementById('music-btn');

    // 1. Trigger Box opening animations
    lid.classList.add('fly');
    body.classList.add('fall');

    // Initialize audio context on first click
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // 2. Play beautiful royalty-free music
    if (bgMusic) {
        bgMusic.volume = 0.55;
        bgMusic.play()
            .then(() => {
                isPlaying = true;
                musicBtn.classList.add('playing');
                musicBtn.classList.add('visible');
                startMusicNotesInterval();
            })
            .catch(err => {
                console.log("Music play failed initially, showing floating player:", err);
                musicBtn.classList.add('visible');
            });
    }

    // 3. Trigger massive confetti blast
    triggerGiftConfetti();

    // 4. Transition Views
    setTimeout(() => {
        welcome.style.display = 'none';
        celebration.classList.add('active');
        
        // Start generating floating balloons
        startBalloonSpawning();
    }, 600);
}

// Huge confetti blast when gift opens
function triggerGiftConfetti() {
    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 28, spread: 360, ticks: 60, zIndex: 100 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // Confetti shoots from left and right corners
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}

// ==========================================================================
// POP-ABLE BALLOONS SYSTEM
// ==========================================================================
let balloonIntervalId = null;

function startBalloonSpawning() {
    // Spawn a balloon immediately, then spawn periodically
    spawnBalloon();
    balloonIntervalId = setInterval(spawnBalloon, 2200);
}

function spawnBalloon() {
    const container = document.getElementById('balloon-container');
    if (!container) return;

    const balloon = document.createElement('div');
    balloon.classList.add('balloon');

    // Generate cute pastel HSL color
    const hue = Math.floor(Math.random() * 360);
    const color = `hsl(${hue}, 85%, 72%)`;
    balloon.style.backgroundColor = color;
    balloon.style.color = color; // For the knot color border in CSS

    // Randomize starting X position
    const startX = Math.random() * 85 + 5; // 5% to 90% width
    balloon.style.left = `${startX}vw`;

    // Add randomized sway offsets for CSS animations
    const swayX = Math.random() * 40 - 20; // -20px to 20px
    const rotateDeg = Math.random() * 20 - 10; // -10deg to 10deg
    balloon.style.setProperty('--sway-x', `${swayX}px`);
    balloon.style.setProperty('--rotate-deg', `${rotateDeg}deg`);

    // Randomize animation speed
    const duration = Math.random() * 6 + 7; // 7s to 13s
    balloon.style.animation = `floatUp ${duration}s linear forwards`;

    // String child element
    const string = document.createElement('div');
    string.classList.add('balloon-string');
    balloon.appendChild(string);

    // Click handler to pop the balloon!
    balloon.addEventListener('click', (e) => {
        e.stopPropagation();
        popBalloon(balloon);
    });

    container.appendChild(balloon);

    // Auto-remove balloon when animation ends off-screen
    balloon.addEventListener('animationend', () => {
        balloon.remove();
    });
}

function popBalloon(balloon) {
    const rect = balloon.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // 1. Play Synthesized pop sound
    playPopSound();

    // 2. Confetti trigger at mouse/click location
    confetti({
        particleCount: 15,
        spread: 45,
        origin: { 
            x: x / window.innerWidth, 
            y: y / window.innerHeight 
        },
        colors: [balloon.style.backgroundColor, '#ffffff']
    });

    // 3. Create visual pop expansion particles in DOM
    createPopSparkles(x, y, balloon.style.backgroundColor);

    // 4. Remove balloon element
    balloon.remove();
}

function createPopSparkles(centerX, centerY, color) {
    const numSparkles = 8;
    for (let i = 0; i < numSparkles; i++) {
        const sparkle = document.createElement('div');
        sparkle.classList.add('pop-sparkle');
        sparkle.style.backgroundColor = color;
        sparkle.style.left = `${centerX}px`;
        sparkle.style.top = `${centerY}px`;

        // Exploding directions
        const angle = (i / numSparkles) * 2 * Math.PI;
        const speed = Math.random() * 40 + 30;
        const dx = `${Math.cos(angle) * speed}px`;
        const dy = `${Math.sin(angle) * speed}px`;
        sparkle.style.setProperty('--dx', dx);
        sparkle.style.setProperty('--dy', dy);

        document.body.appendChild(sparkle);

        // Remove sparkles after animation completes
        setTimeout(() => sparkle.remove(), 500);
    }
}

// ==========================================================================
// POLAROID DECK INTERACTIVE SLIDER
// ==========================================================================
function setupPolaroids() {
    const polaroids = document.querySelectorAll('.polaroid');
    polaroids.forEach((card) => {
        card.addEventListener('click', () => {
            swipeCard(card);
        });
    });
}

function swipeCard(card) {
    const index = parseInt(card.getAttribute('data-index'), 10);
    
    // Swipe only the top card (index 0)
    if (index !== 0) return;

    // Randomize swipe direction (left or right)
    const directionClass = Math.random() > 0.5 ? 'swipe-left' : 'swipe-right';
    card.classList.add(directionClass);

    // After swipe completes, rotate deck indices
    setTimeout(() => {
        const polaroids = document.querySelectorAll('.polaroid');
        
        polaroids.forEach((c) => {
            let currentIdx = parseInt(c.getAttribute('data-index'), 10);
            let nextIdx = (currentIdx - 1 + totalPolaroids) % totalPolaroids;
            c.setAttribute('data-index', nextIdx);
            
            // If it was the swiped card, reset swipe styling class so it comes back to the bottom
            if (c === card) {
                c.classList.remove('swipe-left', 'swipe-right');
            }
        });
    }, 600);
}

// ==========================================================================
// SVG BIRTHDAY CAKE & CANDLE INTERACTION
// ==========================================================================
let candleBlown = false;

function blowCandle() {
    if (candleBlown) return;

    const flame = document.getElementById('candle-flame');
    const smoke = document.getElementById('candle-smoke');
    const hiddenWish = document.getElementById('hidden-wish');

    // 1. Play synthesized magic chiming sound
    playShimmerSound();

    // 2. Turn off flame visibility
    flame.classList.add('extinguished');
    candleBlown = true;

    // 3. Trigger SVG smoke puff animation
    smoke.classList.add('puff');

    // 4. Reveal secret birthday wish block
    hiddenWish.classList.add('active');

    // 5. Fire high-end glitter confetti (golden golden/pink showers)
    triggerGoldenConfetti();
}

function triggerGoldenConfetti() {
    const end = Date.now() + 1.2 * 1000;
    const colors = ['#ffd700', '#f1c40f', '#ff758f', '#ffffff'];

    (function frame() {
        confetti({
            particleCount: 4,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors
        });
        confetti({
            particleCount: 4,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

// ==========================================================================
// FLOATING MUSIC NOTES & PLAYER CONTROL
// ==========================================================================
let musicNotesIntervalId = null;

function toggleMusic() {
    const bgMusic = document.getElementById('bg-music');
    const musicBtn = document.getElementById('music-btn');
    if (!bgMusic) return;

    // Resume AudioContext just in case
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }

    if (isPlaying) {
        bgMusic.pause();
        isPlaying = false;
        musicBtn.classList.remove('playing');
        clearInterval(musicNotesIntervalId);
    } else {
        bgMusic.play()
            .then(() => {
                isPlaying = true;
                musicBtn.classList.add('playing');
                startMusicNotesInterval();
            })
            .catch(err => console.log("Failed to resume music playback:", err));
    }
}

function startMusicNotesInterval() {
    if (musicNotesIntervalId) clearInterval(musicNotesIntervalId);
    musicNotesIntervalId = setInterval(spawnMusicNote, 600);
}

function spawnMusicNote() {
    const musicBtn = document.getElementById('music-btn');
    if (!musicBtn || !isPlaying) return;

    const note = document.createElement('div');
    note.classList.add('music-note');
    
    // Choose random musical character symbol
    const symbols = ['♪', '♫', '♬', '♩'];
    note.innerText = symbols[Math.floor(Math.random() * symbols.length)];

    // Get position of music button
    const btnRect = musicBtn.getBoundingClientRect();
    const startX = btnRect.left + btnRect.width / 2;
    const startY = btnRect.top + btnRect.height / 2;

    note.style.left = `${startX}px`;
    note.style.top = `${startY}px`;

    // Randomize offset targets for floating
    const ndx = `${Math.random() * 80 - 40}px`;
    const ndy = `${-Math.random() * 70 - 40}px`;
    note.style.setProperty('--ndx', ndx);
    note.style.setProperty('--ndy', ndy);

    document.body.appendChild(note);

    // Delete notes when they finish animating
    setTimeout(() => note.remove(), 2000);
}

// Initialize components on load
window.addEventListener('DOMContentLoaded', () => {
    setupPolaroids();
});
