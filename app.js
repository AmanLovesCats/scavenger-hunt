const API_BASE = (window.location.origin.includes(':3000'))
    ? `${window.location.origin}/api/scavenger`
    : `http://localhost:3000/api/scavenger`;

const SIERRA_DIALOGUES = {
    unauthenticated: "Greetings visitor. Attempting bio-signature recognition... Scanning... Unable to verify identity automatically. Please authenticate identify yourself.",
    pendingDiscordVerification: "However, you still haven't completed the quiz. tch tch tch. Kindly finish that first.",
    stage3CodeEntry: "Seems like you found the rock. Quite cheeky. Please enter the 6 digit authentication code. Security access beyond this level is highly restricted.",
    stage4WikiCipher: "Access granted to Primary Core. Next security checkpoint active. Enter the secondary cipher to proceed.",
    stage4HintText: "HINT: The official wiki",
    stage5ChronoCipher: "Wiki cipher confirmed. Snowflake assigned: [{snowflake}]. Hint: discord, time.",
    stage6ReturnDiscord: "Chrono code verified. Return to Discord and execute /scavenger-hunt for further instructions.",
    stage7UtilityGhar: "You're pretty close. Enter the final override code.",
    stage7HintText: "HINT: Bottom, page.",
    stage8CipherImage: "Override Code accepted. Accessing Final Vault Encryption Layer... Decrypt the encrypted signal to unlock the vault.",
    stage9GlobalChat: "CIPHER ACCEPTED. Initiating Final Global Network Authentication. Transmit the exact phrase '[PHRASE]' in the Repuls Global Chat to verify your identity.",
    stage10VaultOpened: "ALL CIPHERS ACCEPTED. OVERRIDING VAULT LOCKS... VAULT OPENED. All earned skins will be granted to your REPULS account soon."
};

const ALL_SKINS = [
    "Synth Sniper Rifle",
    "relay Burst Rifle",
    "RCA revolver",
    "Diamond Bolt",
    "Cat power bolt",
    "RCA shotgun"
];

const SPEED_60_WPM = 154;
const DISCORD_CLIENT_ID = '1532815092499091587';
const TYPING_VOLUME = 0.35;

const THEME_FONTS = [
    "'Monoton', cursive",
    "'Orbitron', sans-serif",
    "'VT323', monospace",
    "'Cinzel', serif",
    "'Press Start 2P', cursive",
    "'Rubik Glitch', display",
    "'Playfair Display', serif",
    "'Creepster', display",
    "'Outfit', sans-serif",
    "'JetBrains Mono', monospace"
];

let currentUser = {
    id: localStorage.getItem('scavenger_user_id') || '',
    username: localStorage.getItem('scavenger_user_name') || '',
    stage: 0,
    claimedSkins: []
};

const pageLoadStartTime = Date.now();

(async function checkOAuthRedirect() {
    try {
        const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
        const urlParams = new URLSearchParams(window.location.search);

        const accessToken = hashParams.get('access_token');
        const oauthUserId = urlParams.get('user_id');

        if (accessToken) {
            window.history.replaceState(null, document.title, window.location.pathname);
            const res = await fetch('https://discord.com/api/v10/users/@me', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (res.ok) {
                const userData = await res.json();
                currentUser.id = userData.id;
                currentUser.username = userData.username;
                localStorage.setItem('scavenger_user_id', userData.id);
                localStorage.setItem('scavenger_user_name', userData.username);
                if (userData.avatar) {
                    const avatarUrl = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=256`;
                    localStorage.setItem('scavenger_user_avatar', avatarUrl);
                    currentUser.avatarUrl = avatarUrl;
                }
            }
        } else if (oauthUserId) {
            window.history.replaceState(null, document.title, window.location.pathname);
            currentUser.id = oauthUserId;
            localStorage.setItem('scavenger_user_id', oauthUserId);
        }
    } catch (e) {
        console.warn("OAuth redirect check note:", e);
    }
})();

const loadingScreenEl = document.getElementById('loading-screen');
const titleContainerEl = document.getElementById('title-container');
const typingAudio = document.getElementById('typing-audio');
const enterAudio = document.getElementById('enter-audio');
const errorAudio = document.getElementById('error-audio');
const clickAudio = document.getElementById('click-audio');
const processingAudio = document.getElementById('processing-audio');
const crashAudio = document.getElementById('crash-audio');
const crash2Audio = document.getElementById('crash2-audio');
const offAudio = document.getElementById('off-audio');
const typewriterTextEl = document.getElementById('typewriter-text');
const cursorEl = document.getElementById('cursor');
const interactiveAreaEl = document.getElementById('interactive-area');
const loginPanelEl = document.getElementById('login-panel');
const codePanelEl = document.getElementById('code-panel');
const hintBoxEl = document.getElementById('hint-box');

const sierraWrapperEl = document.getElementById('sierra-3d-wrapper');
const helmetImgEl = document.getElementById('sierra-helmet-img');

const cinematicSectionEl = document.getElementById('cinematic-section');
const btnProceedVault = document.getElementById('btn-proceed-vault');

const btnDiscordLogin = document.getElementById('btn-discord-login');
const codeInput = document.getElementById('code-input');
const btnSubmitCode = document.getElementById('btn-submit-code');

const repulsLinkPanelEl = document.getElementById('repuls-link-panel');
const repulsInputEl = document.getElementById('repuls-input');
const btnSearchRepuls = document.getElementById('btn-search-repuls');
const repulsLinkHintEl = document.getElementById('repuls-link-hint');

const repulsConfirmPanelEl = document.getElementById('repuls-confirm-panel');
const repulsConfirmDetailsEl = document.getElementById('repuls-confirm-details');
const btnConfirmRepuls = document.getElementById('btn-confirm-repuls');
const btnRetryRepuls = document.getElementById('btn-retry-repuls');

const progressFillEl = document.getElementById('progress-bar-fill');
const progressPercentEl = document.getElementById('progress-percentage');
const skinsListEl = document.getElementById('skins-list');

if (typingAudio) {
    typingAudio.loop = true;
    typingAudio.playbackRate = 0.85;
    typingAudio.volume = TYPING_VOLUME;
}

let isAudioUnlocked = false;
function unlockAudioContext() {
    isAudioUnlocked = true;
    if (typingAudio) typingAudio.volume = TYPING_VOLUME;
    if (enterAudio) enterAudio.load();
    if (errorAudio) errorAudio.load();
    if (clickAudio) clickAudio.load();
    if (processingAudio) processingAudio.load();
    if (crashAudio) crashAudio.load();
    if (crash2Audio) crash2Audio.load();
    const holdMeAudioEl = document.getElementById('hold-me-audio');
    if (holdMeAudioEl) holdMeAudioEl.load();

    if (typingTimer && typingAudio && typingAudio.paused) {
        typingAudio.play().catch(() => { });
    }

    window.removeEventListener('click', unlockAudioContext);
    window.removeEventListener('keydown', unlockAudioContext);
    window.removeEventListener('pointerdown', unlockAudioContext);
}
window.addEventListener('click', unlockAudioContext);
window.addEventListener('keydown', unlockAudioContext);
window.addEventListener('pointerdown', unlockAudioContext);

function playHoldMeSongFadeIn(targetVolume = 0.0125, durationMs = 2500) {
    const audio = document.getElementById('hold-me-audio');
    if (!audio) return;

    try {
        audio.currentTime = 0;
        audio.volume = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => console.warn("[Audio] Hold me song autoplay note:", err));
        }

        let currentVol = 0;
        const intervalTime = 50;
        const step = targetVolume / (durationMs / intervalTime);

        const fadeTimer = setInterval(() => {
            currentVol += step;
            if (currentVol >= targetVolume) {
                audio.volume = targetVolume;
                clearInterval(fadeTimer);
            } else {
                audio.volume = Math.min(targetVolume, currentVol);
            }
        }, intervalTime);
    } catch (e) { }
}

function startTypingAudio() {
    if (!typingAudio) return;
    try {
        typingAudio.playbackRate = 0.85;
        typingAudio.volume = TYPING_VOLUME;
        if (typingAudio.paused) {
            const playPromise = typingAudio.play();
            if (playPromise !== undefined) {
                playPromise.catch((err) => {
                    console.warn("[Audio] Autoplay waiting for user interaction:", err);
                });
            }
        }
    } catch (e) { }
}

let fadeOutTimer = null;
function stopTypingAudio() {
    if (!typingAudio) return;
    try {
        if (fadeOutTimer) clearInterval(fadeOutTimer);
        let fadeVol = typingAudio.volume;
        fadeOutTimer = setInterval(() => {
            fadeVol -= 0.01;
            if (fadeVol <= 0.005) {
                clearInterval(fadeOutTimer);
                fadeOutTimer = null;
                typingAudio.pause();
                typingAudio.volume = TYPING_VOLUME;
            } else {
                typingAudio.volume = Math.max(0, fadeVol);
            }
        }, 20);
    } catch (e) {
        typingAudio.pause();
    }
}

function stopTypingAudioImmediate() {
    if (typingTimer) clearTimeout(typingTimer);
    if (fadeOutTimer) clearInterval(fadeOutTimer);
    typingTimer = null;
    fadeOutTimer = null;
    if (typingAudio) {
        try {
            typingAudio.pause();
            typingAudio.currentTime = 0;
        } catch (e) { }
    }
}

let titleInterval = null;
function initTitleAnimation() {
    if (!titleContainerEl) return;
    const titleText = "REPULS COMMUNITY ASSOCIATION";
    titleContainerEl.innerHTML = '';

    const charElements = [];
    for (let i = 0; i < titleText.length; i++) {
        const char = titleText.charAt(i);
        if (char === ' ') {
            const spaceSpan = document.createElement('span');
            spaceSpan.className = 'title-space';
            titleContainerEl.appendChild(spaceSpan);
        } else {
            const charSpan = document.createElement('span');
            charSpan.className = 'title-char';
            charSpan.innerText = char;
            titleContainerEl.appendChild(charSpan);
            charElements.push(charSpan);
        }
    }

    titleInterval = setInterval(() => {
        charElements.forEach(el => {
            if (Math.random() > 0.3) {
                const randomFont = THEME_FONTS[Math.floor(Math.random() * THEME_FONTS.length)];
                el.style.fontFamily = randomFont;
            }
        });
    }, 600);
}

function playClickSound() {
    if (!clickAudio) return;
    try {
        clickAudio.currentTime = 0;
        clickAudio.volume = 0.5;
        clickAudio.play().catch(() => { });
    } catch (e) { }
}

function startProcessingSound() {
    if (!processingAudio) return;
    try {
        processingAudio.currentTime = 0;
        processingAudio.volume = 0.4;
        processingAudio.play().catch(() => { });
    } catch (e) { }
}

function stopProcessingSound() {
    if (!processingAudio) return;
    try {
        processingAudio.pause();
        processingAudio.currentTime = 0;
    } catch (e) { }
}

document.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        playClickSound();
    }
});

function playErrorSound() {
    if (errorAudio) {
        try {
            errorAudio.currentTime = 0;
            errorAudio.volume = 0.5;
            errorAudio.play().catch(() => { });
        } catch (e) { }
    }
}

function playCrashSound() {
    if (crashAudio) {
        try {
            crashAudio.currentTime = 0;
            crashAudio.volume = 0.18;
            crashAudio.play().catch(() => { });
        } catch (e) { }
    }
}

function playCrash2Sound() {
    if (crash2Audio) {
        try {
            crash2Audio.currentTime = 0;
            crash2Audio.volume = 0.18;
            crash2Audio.play().catch(() => { });
        } catch (e) { }
    }
}

function playOffSound() {
    if (offAudio) {
        try {
            offAudio.currentTime = 0;
            offAudio.volume = 0.7;
            offAudio.play().catch(() => { });
        } catch (e) { }
    }
}

function playTickSound() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
            if (!window.sharedAudioCtx) {
                window.sharedAudioCtx = new AudioCtx();
            }
            const ctx = window.sharedAudioCtx;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(900, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.035);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.04);
            return;
        }
    } catch (e) { }

    if (clickAudio) {
        try {
            clickAudio.currentTime = 0;
            clickAudio.volume = 0.3;
            clickAudio.play().catch(() => { });
        } catch (e) { }
    }
}

function playEnterSoundAndFadeHelmet() {
    if (enterAudio) {
        try {
            enterAudio.currentTime = 0;
            enterAudio.volume = 0.6;
            enterAudio.play().catch(() => { });
        } catch (e) { }
    }
    const avatarSection = document.querySelector('.avatar-section');
    if (avatarSection) {
        avatarSection.classList.add('helmet-fade-in');
    }
}

let loadingDismissed = false;
function dismissLoadingScreen() {
    if (loadingDismissed) return;
    loadingDismissed = true;

    if (loadingScreenEl) {
        loadingScreenEl.classList.add('fade-out');
    }
    if (titleInterval) {
        clearInterval(titleInterval);
    }

    setTimeout(() => {
        playEnterSoundAndFadeHelmet();
    }, 1400);

    setTimeout(() => {
        renderStageFlow();
    }, 5000);
}

function safeDismissLoadingScreen() {
    const elapsed = Date.now() - pageLoadStartTime;
    const remainingDelay = Math.max(0, 3000 - elapsed);

    setTimeout(() => {
        dismissLoadingScreen();
    }, remainingDelay);
}

window.addEventListener('mousemove', (e) => {
    if (!sierraWrapperEl || !helmetImgEl) return;
    const rect = sierraWrapperEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) / (window.innerWidth / 2);
    const deltaY = (e.clientY - centerY) / (window.innerHeight / 2);

    const cssRotateY = deltaX * 30;
    const cssRotateX = -deltaY * 22;
    helmetImgEl.style.transform = `perspective(1000px) rotateY(${cssRotateY}deg) rotateX(${cssRotateX}deg) scale(1)`;
});

let typingTimer = null;
let currentTypingId = 0;

function typeMessage(message, speed = SPEED_60_WPM, callback = null, initialDelay = 200) {
    if (typingTimer) {
        clearTimeout(typingTimer);
        typingTimer = null;
    }
    currentTypingId++;
    const thisTypingId = currentTypingId;

    typewriterTextEl.innerText = '';
    cursorEl.style.display = 'inline-block';

    let index = 0;

    async function step() {
        if (thisTypingId !== currentTypingId) return;

        if (index === 0 && initialDelay > 0) {
            stopTypingAudio();
            await new Promise(resolve => setTimeout(resolve, initialDelay));
            if (thisTypingId !== currentTypingId) return;
        }

        if (index < message.length) {
            startTypingAudio();

            const char = message.charAt(index);
            typewriterTextEl.innerText += char;
            index++;

            let nextDelay = speed;

            if (message.substring(index - 3, index) === '...') {
                stopTypingAudio();
                nextDelay = 1600;
            } else if (char === '.' && message.charAt(index) === ' ') {
                nextDelay = 500;
            } else if (char === '?' || char === '!') {
                nextDelay = 600;
            }

            typingTimer = setTimeout(step, nextDelay);
        } else {
            typingTimer = null;
            stopTypingAudio();
            if (callback) callback();
        }
    }

    step();
}

function updateSidebarUI(claimedSkins = [], stage = 0) {
    const totalSkins = ALL_SKINS.length;
    const unlockedCount = Math.min(claimedSkins.length, totalSkins);
    const percent = Math.min(100, Math.round((unlockedCount / totalSkins) * 100));

    progressFillEl.style.width = `${percent}%`;
    progressPercentEl.innerText = `${percent}% COMPLETE`;

    skinsListEl.innerHTML = '';
    ALL_SKINS.forEach((skinName, idx) => {
        const isUnlocked = claimedSkins.includes(skinName) || (idx < claimedSkins.length);
        const li = document.createElement('li');
        li.className = `skin-item ${isUnlocked ? 'unlocked' : 'locked'}`;
        li.innerHTML = `
            <span class="skin-status">${isUnlocked ? '[ UNLOCKED ]' : '[ LOCKED ]'}</span>
            <span class="skin-name">${isUnlocked ? skinName : 'Classified Reward'}</span>
        `;
        skinsListEl.appendChild(li);
    });
}

async function fetchUserStatus(userId) {
    const endpoints = [
        `${API_BASE}/status?userId=${encodeURIComponent(userId)}`,
        `http://localhost:3000/api/scavenger/status?userId=${encodeURIComponent(userId)}`,
        `http://127.0.0.1:3000/api/scavenger/status?userId=${encodeURIComponent(userId)}`
    ];

    for (const ep of endpoints) {
        try {
            const res = await fetch(ep);
            if (res.ok) {
                const data = await res.json();
                return data;
            }
        } catch (e) { }
    }

    return null;
}

async function submitCodeToApi(userId, code) {
    const endpoints = [
        `${API_BASE}/verify-code`,
        `http://localhost:3000/api/scavenger/verify-code`,
        `http://127.0.0.1:3000/api/scavenger/verify-code`
    ];

    for (const ep of endpoints) {
        try {
            const res = await fetch(ep, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, code })
            });
            if (res.ok) {
                return await res.json();
            }
        } catch (e) { }
    }

    return { success: false, message: "Server connection failed." };
}

async function playTerminalBootSequence(user, statusData) {
    const t = statusData?.telemetry;
    const lines = [
        `[SYS] Authenticating Discord ID: ${user.id}... OK`,
        `[SYS] Verifying Repuls DB Link...`,
        `[SYS] PlayFab ID: ${user.repulsInfo.id} Match Found.`,
        `[SYS] Fetching Telemetry Data for ${user.repulsInfo.displayName}...`,
        `[SYS] Level ${t?.level || 1} | Wins: ${t?.battleWins || 0} | K/D: ${t?.kd || '0.00'}${t?.topWeapon ? ' | Fav: ' + t.topWeapon : ''}`,
        `[SYS] Accessing Classified Databanks...`,
        `[SYS] Override Accepted.`,
        `[SYS] Booting Sierra Protocol...`
    ];

    interactiveAreaEl.classList.add('hidden');
    let output = "";
    document.getElementById('typewriter-text').innerHTML = "";

    for (const line of lines) {
        output += line + "<br/>";
        document.getElementById('typewriter-text').innerHTML = output;
        await new Promise(resolve => setTimeout(resolve, 150));
    }

    await new Promise(resolve => setTimeout(resolve, 800));
    document.getElementById('typewriter-text').innerHTML = "";
}

let pendingRepulsAccount = null;

function triggerRepulsLinkFlow() {
    typeMessage(
        "Please link your Repuls account by entering your Username, Display Name, or PlayFab ID below to continue.",
        SPEED_60_WPM,
        () => {
            interactiveAreaEl.classList.remove('hidden');
            repulsLinkPanelEl.classList.remove('hidden');
            repulsConfirmPanelEl.classList.add('hidden');
        }
    );
}

btnSearchRepuls.addEventListener('click', async () => {
    const query = repulsInputEl.value.trim();
    if (!query) return;

    btnSearchRepuls.disabled = true;
    btnSearchRepuls.innerText = "SEARCHING...";
    repulsLinkHintEl.classList.add('hidden');
    startProcessingSound();

    try {
        const endpoints = [
            `${API_BASE}/verify-repuls`,
            `http://localhost:3000/api/scavenger/verify-repuls`,
            `http://127.0.0.1:3000/api/scavenger/verify-repuls`
        ];

        let resObj = null;
        for (const ep of endpoints) {
            try {
                const res = await fetch(ep, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });
                if (res.ok || res.status === 404) {
                    resObj = await res.json();
                    break;
                }
            } catch (e) { }
        }

        stopProcessingSound();

        if (resObj && resObj.success && resObj.account) {
            pendingRepulsAccount = resObj.account;
            repulsLinkPanelEl.classList.add('hidden');
            repulsConfirmPanelEl.classList.remove('hidden');

            const acc = resObj.account;
            const creationDate = acc.created ? new Date(acc.created).toLocaleDateString() : 'Unknown';
            repulsConfirmDetailsEl.innerHTML = `
                <strong>Match Found:</strong><br/>
                Username: ${acc.username || 'N/A'}<br/>
                Display Name: ${acc.displayName || 'N/A'}<br/>
                PlayFab ID: ${acc.id}<br/>
                Created: ${creationDate}
            `;
        } else {
            const errStr = resObj ? resObj.error : "No account found matching that query.";
            repulsLinkHintEl.innerText = errStr;
            repulsLinkHintEl.classList.remove('hidden');
            typeMessage(`[ERROR] Search failed for "${query}". ${errStr}`, SPEED_60_WPM, () => {
                interactiveAreaEl.classList.remove('hidden');
                repulsLinkPanelEl.classList.remove('hidden');
            });
            playErrorSound();
        }
    } finally {
        stopProcessingSound();
        btnSearchRepuls.disabled = false;
        btnSearchRepuls.innerText = "SEARCH RECORDS";
    }
});

btnRetryRepuls.addEventListener('click', () => {
    pendingRepulsAccount = null;
    repulsConfirmPanelEl.classList.add('hidden');
    repulsLinkPanelEl.classList.remove('hidden');
});

btnConfirmRepuls.addEventListener('click', async () => {
    if (!pendingRepulsAccount || !currentUser.id) return;

    btnConfirmRepuls.disabled = true;
    btnConfirmRepuls.innerText = "LINKING...";
    startProcessingSound();

    try {
        const endpoints = [
            `${API_BASE}/confirm-repuls`,
            `http://localhost:3000/api/scavenger/confirm-repuls`,
            `http://127.0.0.1:3000/api/scavenger/confirm-repuls`
        ];

        let success = false;
        for (const ep of endpoints) {
            try {
                const res = await fetch(ep, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUser.id, account: pendingRepulsAccount })
                });
                if (res.ok) {
                    success = true;
                    break;
                }
            } catch (e) { }
        }

        stopProcessingSound();

        if (success) {
            currentUser.repulsInfo = pendingRepulsAccount;
            repulsConfirmPanelEl.classList.add('hidden');
            interactiveAreaEl.classList.add('hidden');
            renderStageFlow();
        } else {
            typeMessage("[ERROR] Failed to link account. Server error.", SPEED_60_WPM);
            playErrorSound();
        }
    } finally {
        stopProcessingSound();
        btnConfirmRepuls.disabled = false;
        btnConfirmRepuls.innerText = "CONFIRM";
    }
});

function generateSierraPersonalityIntro(user, statusData, isFirstBoot) {
    const t = statusData?.telemetry;
    const userFacts = statusData?.userFacts || [];
    const commanderName = t?.repulsUser || user.repulsInfo?.displayName || user.repulsInfo?.username || `Subject [${user.id}]`;
    const stage = user.stage || 0;
    const helmet = t?.helmet || 'Knight';

    let intro = "";

    if (isFirstBoot && stage > 3) {
        const returns = [
            `Ah, ${commanderName}. The Archive notes your return. Have you uncovered any new data in the wastes?`,
            `Welcome back, ${commanderName}. The Reclamation Wars wait for no one. Let us proceed.`,
            `Back again, ${commanderName}? The Artifact's signal grows stronger. We must hurry.`
        ];
        intro += returns[Math.floor(Math.random() * returns.length)] + " ";
    } else {
        const greets = [
            `Bio-signature verified. Welcome, Commander ${commanderName}. I am Sierra, AI Archivist of this conflict.`,
            `Access granted, Commander ${commanderName}. The history of the REPULS digitizations is vast, but I am ready.`,
            `System recognizes you, ${commanderName}. Are you fighting for Earth's UEA or Martian Corum today?`
        ];
        intro += greets[Math.floor(Math.random() * greets.length)] + " ";
    }

    const observations = [];

    if (userFacts.length > 0) {
        const fact = userFacts[Math.floor(Math.random() * userFacts.length)];
        observations.push(`Classified Archive note: ${fact}`);
    }

    if (t) {
        if (t.topWeapon && t.topWeaponKills > 0) {
            observations.push(`I see your weapon of choice is the ${t.topWeapon} with ${t.topWeaponKills} recorded eliminations.`);
            observations.push(`The databanks mark you as a specialist with the ${t.topWeapon}. Highly lethal.`);
        }

        if (t.kd && parseFloat(t.kd) > 0) {
            const kdNum = parseFloat(t.kd);
            if (kdNum >= 2.0) {
                observations.push(`A ${t.kd} K/D ratio across ${t.totalKills || 0} kills... superior tactical efficiency, Commander.`);
            } else {
                observations.push(`Combat efficiency rating: ${t.kd} K/D with ${t.totalKills || 0} confirmed eliminations.`);
            }
        }

        if (t.headshots && t.headshots > 10) {
            observations.push(`${t.headshots} precision headshots logged in the matrix. Marksmanship confirmed.`);
        }

        if (t.clan) {
            observations.push(`Fighting under the banner of [${t.clan}], I observe.`);
        }

        if (t.winstreak && t.winstreak > 2) {
            observations.push(`An active streak of ${t.winstreak} victories... momentum is on your side.`);
        }

        if (t.winRate && parseFloat(t.winRate) > 40) {
            observations.push(`${t.winRate}% win rate across all engagements. A formidable track record.`);
        }
    }

    if (observations.length > 0) {
        intro += observations[Math.floor(Math.random() * observations.length)] + " ";
    } else if (t && typeof t.level === 'number' && t.level > 0) {
        intro += `Logging combat data: Level ${t.level}, ${t.battleWins || 0} victories... keep fighting, Commander. `;
    }

    if (t && Math.random() > 0.4) {
        if (helmet.toLowerCase().includes('sierra')) {
            intro += "I see you are wearing the Sierra helmet... an excellent choice for a historian's ally.";
        } else if (helmet.toLowerCase().includes('scav')) {
            intro += `The ${helmet} helmet... A Scavenger from outside the Havens, then? The UEA won't like that.`;
        } else {
            intro += `Your ${helmet} EXO configuration has been logged in the historical matrix.`;
        }
    }

    return intro.trim();
}

async function renderStageFlow() {
    interactiveAreaEl.classList.add('hidden');
    loginPanelEl.classList.add('hidden');
    repulsLinkPanelEl.classList.add('hidden');
    repulsConfirmPanelEl.classList.add('hidden');
    codePanelEl.classList.add('hidden');
    const cipherImgPanel = document.getElementById('cipher-image-panel');
    if (cipherImgPanel) cipherImgPanel.classList.add('hidden');
    hintBoxEl.classList.add('hidden');

    let isFirstBoot = false;

    if (!currentUser.id) {
        typeMessage(
            SIERRA_DIALOGUES.unauthenticated,
            SPEED_60_WPM,
            () => {
                interactiveAreaEl.classList.remove('hidden');
                loginPanelEl.classList.remove('hidden');
            }
        );
        updateSidebarUI([], 0);
        return;
    }

    const statusData = await fetchUserStatus(currentUser.id);
    if (statusData && typeof statusData.stage === 'number') {
        currentUser.stage = statusData.stage;
        currentUser.claimedSkins = statusData.claimedSkins || [];
        currentUser.repulsInfo = statusData.repulsInfo || null;
        currentUser.quiz_data = statusData.quiz_data || {};
    }

    if (currentUser.stage >= 11) {
        stopTypingAudio();
        updateSidebarUI(currentUser.claimedSkins, currentUser.stage);
        triggerCinematicTransition();
        return;
    }

    if (!currentUser.repulsInfo) {
        triggerRepulsLinkFlow();
        return;
    }

    if (!window.__terminalBooted) {
        window.__terminalBooted = true;
        isFirstBoot = true;
        await playTerminalBootSequence(currentUser, statusData);
    }

    updateSidebarUI(currentUser.claimedSkins, currentUser.stage);

    let personalityIntro = generateSierraPersonalityIntro(currentUser, statusData, isFirstBoot);

    if (currentUser.stage < 3) {
        typeMessage(
            `${personalityIntro}\n\n${SIERRA_DIALOGUES.pendingDiscordVerification}`,
            SPEED_60_WPM
        );
        return;
    }

    if (currentUser.stage === 3) {
        typeMessage(
            `${personalityIntro}\n\n${SIERRA_DIALOGUES.stage3CodeEntry}`,
            SPEED_60_WPM,
            () => {
                interactiveAreaEl.classList.remove('hidden');
                codePanelEl.classList.remove('hidden');
            }
        );
        return;
    }

    if (currentUser.stage === 4) {
        typeMessage(
            `${personalityIntro ? personalityIntro + '\n\n' : ''}${SIERRA_DIALOGUES.stage4WikiCipher}`,
            SPEED_60_WPM,
            () => {
                interactiveAreaEl.classList.remove('hidden');
                codePanelEl.classList.remove('hidden');
                hintBoxEl.innerText = SIERRA_DIALOGUES.stage4HintText;
                hintBoxEl.classList.remove('hidden');
            }
        );
        return;
    }

    if (currentUser.stage === 5) {
        const snowflakeId = statusData && statusData.assignedSnowflake ? statusData.assignedSnowflake.snowflake : "Discord Search";
        const messageText = SIERRA_DIALOGUES.stage5ChronoCipher.replace('{snowflake}', snowflakeId);
        typeMessage(
            `${personalityIntro ? personalityIntro + '\n\n' : ''}${messageText}`,
            SPEED_60_WPM,
            () => {
                interactiveAreaEl.classList.remove('hidden');
                codePanelEl.classList.remove('hidden');
            }
        );
        return;
    }

    if (currentUser.stage === 6) {
        typeMessage(
            `${personalityIntro ? personalityIntro + '\n\n' : ''}${SIERRA_DIALOGUES.stage6ReturnDiscord}`,
            SPEED_60_WPM
        );
        return;
    }

    if (currentUser.stage === 7) {
        typeMessage(
            `${personalityIntro ? personalityIntro + '\n\n' : ''}${SIERRA_DIALOGUES.stage7UtilityGhar}`,
            SPEED_60_WPM,
            () => {
                interactiveAreaEl.classList.remove('hidden');
                codePanelEl.classList.remove('hidden');
                hintBoxEl.innerText = SIERRA_DIALOGUES.stage7HintText;
                hintBoxEl.classList.remove('hidden');
            }
        );
        return;
    }

    if (currentUser.stage === 8) {
        typeMessage(
            `${personalityIntro ? personalityIntro + '\n\n' : ''}${SIERRA_DIALOGUES.stage8CipherImage}`,
            SPEED_60_WPM,
            () => {
                interactiveAreaEl.classList.remove('hidden');
                document.getElementById('cipher-image-panel').classList.remove('hidden');

                const cipherImg = document.getElementById('cipher-svg-img');
                cipherImg.src = `${API_BASE}/cipher-image?userId=${encodeURIComponent(currentUser.id)}&t=${Date.now()}`;

                codePanelEl.classList.remove('hidden');
                hintBoxEl.classList.add('hidden');
            }
        );
        return;
    }

    if (currentUser.stage === 9) {
        let p = statusData?.quiz_data?.globalPassphrase || statusData?.globalPassphrase || currentUser?.quiz_data?.globalPassphrase;
        if (!p || p === "ERROR") p = "ALPHA SIERRA VICTOR";

        typeMessage(
            `${personalityIntro ? personalityIntro + '\n\n' : ''}${SIERRA_DIALOGUES.stage9GlobalChat.replace('[PHRASE]', p)}`,
            SPEED_60_WPM,
            () => {
                interactiveAreaEl.classList.remove('hidden');
                document.getElementById('cipher-image-panel').classList.add('hidden');
                codePanelEl.classList.add('hidden');
                hintBoxEl.classList.remove('hidden');
                hintBoxEl.innerText = `Awaiting transmission: "${p}" in Global Chat...`;
            }
        );
        return;
    }

    if (currentUser.stage === 10) {
        startTimedDiscordChallenge();
        return;
    }

    if (currentUser.stage >= 11) {
        triggerVaultOpenedView();
    }
}

const TIMED_QUESTIONS = [
    { prompt: "OVERRIDE 1/3: Send exact phrase in Discord channel:\n\nOVERRIDE SIERRA 101", answer: "override sierra 101" },
    { prompt: "OVERRIDE 2/3: Answer in Discord channel:\n\nWhat planet is Corum from?", answer: "mars" },
    { prompt: "OVERRIDE 3/3: Send exact phrase in Discord channel:\n\nCONFIRM VAULT ACCESS", answer: "confirm vault access" }
];

let timedCountdownTimer = null;
let timedCheckInterval = null;
let currentQuestionIndex = 0;
let crashPlayedThisSession = sessionStorage.getItem('stage10_crash_played') === 'true';

async function startTimedDiscordChallenge(stepIndex = 0) {
    currentQuestionIndex = stepIndex;

    const termContainer = document.querySelector('.terminal-container');

    if (!crashPlayedThisSession && stepIndex === 0) {
        crashPlayedThisSession = true;
        sessionStorage.setItem('stage10_crash_played', 'true');

        stopTypingAudio();
        stopProcessingSound();

        playCrashSound();
        interactiveAreaEl.classList.add('hidden');
        typewriterTextEl.innerText = '';

        if (termContainer) {
            termContainer.classList.add('blank-screen');
        }

        await new Promise(resolve => setTimeout(resolve, 3000));

        if (termContainer) {
            termContainer.classList.remove('blank-screen');
        }
        playCrash2Sound();
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (helmetImgEl) {
        helmetImgEl.classList.remove('helmet-glitching', 'tv-turn-off');
        helmetImgEl.classList.add('helmet-shake-glow');
    }

    const q = TIMED_QUESTIONS[currentQuestionIndex];
    if (!q) return;

    typeMessage(
        `[CRITICAL OVERRIDE] SYSTEM RECOVERED FROM CORRUPTION. EMERGENCY DISCORD TRANSMISSION REQUIRED IN CHANNEL #scavenger-hunt.\n\n${q.prompt}`,
        SPEED_60_WPM,
        () => {
            interactiveAreaEl.classList.remove('hidden');
            const timedPanel = document.getElementById('timed-challenge-panel');
            const timerDisplay = document.getElementById('timed-timer-display');
            const promptText = document.getElementById('timed-prompt-text');
            const retryBtn = document.getElementById('btn-retry-timed');

            if (timedPanel) timedPanel.classList.remove('hidden');
            if (retryBtn) retryBtn.classList.add('hidden');

            let timeLeft = 10;
            if (timerDisplay) timerDisplay.innerText = `[ TIME REMAINING: ${timeLeft}s ]`;
            if (promptText) promptText.innerText = `Transmit response in Discord channel #scavenger-hunt`;

            if (timedCountdownTimer) clearInterval(timedCountdownTimer);
            if (timedCheckInterval) clearInterval(timedCheckInterval);

            timedCountdownTimer = setInterval(() => {
                timeLeft--;
                if (timerDisplay) timerDisplay.innerText = `[ TIME REMAINING: ${timeLeft}s ]`;
                playTickSound();

                if (timeLeft <= 0) {
                    clearInterval(timedCountdownTimer);
                    clearInterval(timedCheckInterval);
                    triggerTimedChallengeFailure();
                }
            }, 1000);

            timedCheckInterval = setInterval(async () => {
                try {
                    const res = await fetch(`${API_BASE}/check-timed-override`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: currentUser.id,
                            questionIndex: currentQuestionIndex,
                            expectedAnswer: q.answer
                        })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success) {
                            clearInterval(timedCountdownTimer);
                            clearInterval(timedCheckInterval);

                            if (data.vaultOpened || data.nextStep >= 3) {
                                playOffSound();
                                if (helmetImgEl) {
                                    helmetImgEl.classList.remove('helmet-shake-glow', 'helmet-glitching');
                                    helmetImgEl.classList.add('tv-turn-off');
                                }

                                const dialogueSection = document.querySelector('.dialogue-section');
                                if (dialogueSection) {
                                    dialogueSection.classList.add('fade-out-slow');
                                }

                                setTimeout(() => {
                                    currentUser.stage = 11;
                                    triggerCinematicTransition();
                                }, 1200);
                            } else {
                                if (helmetImgEl) helmetImgEl.classList.remove('helmet-shake-glow', 'helmet-glitching');
                                startTimedDiscordChallenge(data.nextStep);
                            }
                        }
                    }
                } catch (e) { }
            }, 800);
        }
    );
}

function triggerTimedChallengeFailure() {
    playErrorSound();
    const termContainer = document.querySelector('.terminal-container');
    if (termContainer) {
        termContainer.classList.add('glitch-active');
        termContainer.classList.add('blast-fused');
        setTimeout(() => {
            termContainer.classList.remove('glitch-active');
            termContainer.classList.remove('blast-fused');
        }, 1200);
    }

    if (helmetImgEl) {
        helmetImgEl.classList.remove('helmet-shake-glow');
        helmetImgEl.classList.add('helmet-glitching');
    }

    const timerDisplay = document.getElementById('timed-timer-display');
    const promptText = document.getElementById('timed-prompt-text');
    const retryBtn = document.getElementById('btn-retry-timed');

    if (timerDisplay) timerDisplay.innerText = `[ SYSTEM FUSED: TIME EXPIRED ]`;
    if (promptText) promptText.innerText = `Transmission failed in Discord. Time limit exceeded.`;
    if (retryBtn) {
        retryBtn.classList.remove('hidden');
        retryBtn.onclick = () => {
            if (helmetImgEl) {
                helmetImgEl.classList.remove('helmet-glitching', 'tv-turn-off');
            }
            startTimedDiscordChallenge(0);
        };
    }
}

let globalPollInterval = null;
function startGlobalPolling() {
    if (globalPollInterval) return;
    globalPollInterval = setInterval(async () => {
        if (!currentUser.id) return;
        try {
            const statusData = await fetchUserStatus(currentUser.id);
            if (statusData && typeof statusData.stage === 'number') {
                if (statusData.stage > currentUser.stage) {
                    const oldStage = currentUser.stage;
                    currentUser.stage = statusData.stage;
                    currentUser.claimedSkins = statusData.claimedSkins || currentUser.claimedSkins;

                    if (currentUser.stage >= 11) {
                        triggerCinematicTransition();
                    } else {
                        renderStageFlow();
                    }
                }
            }
        } catch (e) { }
    }, 4000);
}

function triggerCinematicTransition() {
    stopTypingAudio();
    if (interactiveAreaEl) interactiveAreaEl.classList.add('hidden');
    if (typewriterTextEl) typewriterTextEl.innerText = '';

    const avatarSection = document.querySelector('.avatar-section');
    const dialogueSection = document.querySelector('.dialogue-section');

    if (avatarSection) avatarSection.classList.add('fade-out-slow');
    if (dialogueSection) dialogueSection.classList.add('fade-out-slow');

    setTimeout(() => {
        cinematicSectionEl.classList.remove('hidden');
        cinematicSectionEl.classList.add('fade-in-slow');

        setTimeout(() => {
            if (btnProceedVault) btnProceedVault.classList.remove('hidden');
        }, 1200);
    }, 1000);
}

function runVaultDoorAnimation() {
    stopTypingAudioImmediate();
    const vaultOverlay = document.getElementById('vault-animation-overlay');
    const vaultViewport = document.getElementById('vault-viewport-el');
    const vaultHingedDoor = document.getElementById('vault-hinged-door-el');
    const vaultWheel = document.getElementById('vault-wheel-el');
    const barTopLeft = document.querySelector('.bar-top-left');
    const barBottomLeft = document.querySelector('.bar-bottom-left');

    if (!vaultOverlay || !vaultViewport || !vaultHingedDoor || !vaultWheel) return;

    vaultOverlay.classList.remove('hidden');
    if (processingAudio) {
        try { processingAudio.play().catch(() => { }); } catch (e) { }
    }

    setTimeout(() => {
        vaultWheel.classList.add('unlocking');
        if (barTopLeft) barTopLeft.classList.add('retracting');
        if (barBottomLeft) barBottomLeft.classList.add('retracting');
    }, 800);

    setTimeout(() => {
        vaultHingedDoor.classList.add('opening');
        if (enterAudio) {
            try { enterAudio.currentTime = 0; enterAudio.volume = 0.8; enterAudio.play().catch(() => { }); } catch (e) { }
        }
    }, 5500);

    setTimeout(() => {
        vaultViewport.classList.add('zooming');
    }, 10200);

    setTimeout(() => {
        vaultOverlay.classList.add('hidden');
        if (processingAudio) {
            try { processingAudio.pause(); } catch (e) { }
        }

        if (typeof playHoldMeSongFadeIn === 'function') {
            playHoldMeSongFadeIn(0.0125, 2500);
        }

        if (typeof runIntroTextSequence === 'function') {
            runIntroTextSequence(() => {
                if (typeof start3DMediaShowcase === 'function') {
                    start3DMediaShowcase();
                }
            });
        } else if (typeof start3DMediaShowcase === 'function') {
            start3DMediaShowcase();
        }
    }, 12500);
}

if (btnProceedVault) {
    btnProceedVault.addEventListener('click', () => {
        playClickSound();
        stopTypingAudioImmediate();

        cinematicSectionEl.classList.remove('fade-in-slow');
        cinematicSectionEl.classList.add('hidden');
        btnProceedVault.classList.add('hidden');

        setTimeout(() => {
            runVaultDoorAnimation();
        }, 2000);
    });
}

function triggerVaultOpenedView() {
    typeMessage(
        SIERRA_DIALOGUES.stage10VaultOpened,
        SPEED_60_WPM
    );
}

btnDiscordLogin.addEventListener('click', () => {
    const REDIRECT_URI = encodeURIComponent(window.location.origin + window.location.pathname);
    const OAUTH_URL = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&response_type=token&redirect_uri=${REDIRECT_URI}&scope=identify`;

    window.location.href = OAUTH_URL;
});

btnSubmitCode.addEventListener('click', async () => {
    const val = codeInput.value.trim();
    if (!val) return;

    const originalText = btnSubmitCode.innerText;
    btnSubmitCode.disabled = true;
    btnSubmitCode.innerText = 'PROCESSING...';
    startProcessingSound();

    try {
        const res = await submitCodeToApi(currentUser.id, val);
        codeInput.value = '';

        stopProcessingSound();

        if (res.success) {
            currentUser.stage = res.stage;
            currentUser.claimedSkins = res.claimedSkins || currentUser.claimedSkins;
            updateSidebarUI(currentUser.claimedSkins, currentUser.stage);

            if (res.vaultOpened) {
                triggerVaultOpenedView();
            } else {
                renderStageFlow();
            }
        } else {
            const errMsg = res.message || "Invalid cipher code.";
            typeMessage(`[ERROR] Access Denied: "${val}" is incorrect. ${errMsg}`, SPEED_60_WPM, () => {
                interactiveAreaEl.classList.remove('hidden');
                codePanelEl.classList.remove('hidden');
            });
            playErrorSound();
        }
    } finally {
        stopProcessingSound();
        btnSubmitCode.disabled = false;
        btnSubmitCode.innerText = originalText;
    }
});

window.addEventListener('DOMContentLoaded', () => {
    initTitleAnimation();
    safeDismissLoadingScreen();
    startGlobalPolling();
});
