

const INTRO_TEXT_CONFIG = [
    { text: "REPULS HAS LIVED FOR 6 YEARS NOW.", duration: 3500 },
    { text: "THE COMMUNITY IS WHAT STILL KEEPS IT ALIVE TO THIS DAY.", duration: 3500 },
    { text: "AND THIS WAS A THANK YOU TO THE COMMUNITY.", duration: 3500 },
    { text: "Thank you for playing REPULS, {DISCORD_ID}..", duration: 5000 }
];

let preloadedVideoElements = {};

let MEDIA_SEQUENCE = [
    { order: 1, type: 'video', src: 'vids/1.mov', caption: null },
    { order: 2, type: 'video', src: 'vids/2.mov', caption: null },
    { order: 3, type: 'video', src: 'vids/3.mp4', caption: null },
    { order: 4, type: 'video', src: 'vids/4.mov', caption: null },
    { order: 5, type: 'video', src: 'vids/5.mov', caption: null },
    { order: 6, type: 'image', src: 'vids/6 sergiolan.webp', caption: 'sergiolan' },
    { order: 7, type: 'image', src: 'vids/7 caracal.jpg', caption: 'caracal' },
    { order: 8, type: 'image', src: 'vids/8 eldest.jpg', caption: 'eldest' },
    { order: 9, type: 'image', src: 'vids/9 scyth3.png', caption: 'scyth3' },
    { order: 10, type: 'image', src: 'vids/10 raphae60.png', caption: 'raphae60' },
    { order: 11, type: 'image', src: 'vids/11 pandaroux.png', caption: 'pandaroux' },
    { order: 12, type: 'image', src: 'vids/12 bratzel.png', caption: 'bratzel' },
    { order: 13, type: 'image', src: 'vids/13 axelbio60.png', caption: 'axelbio60' },
    { order: 14, type: 'image', src: 'vids/14 abyss.png', caption: 'abyss' },
    { order: 15, type: 'image', src: 'vids/15 mao.png', caption: 'mao' },
    { order: 16, type: 'image', src: 'vids/16 wangoos.png', caption: 'wangoos' },
    { order: 17, type: 'image', src: 'vids/17 imroro.png', caption: 'imroro' }
];

async function fetchDynamicManifest() {
    try {
        const res = await fetch(`${API_BASE}/vids-manifest`);
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                MEDIA_SEQUENCE = data;
            }
        }
    } catch (e) { }
}

function preloadCorridorMedia() {
    MEDIA_SEQUENCE.forEach((item, idx) => {
        if (item.type === 'video' && !preloadedVideoElements[idx]) {
            const v = document.createElement('video');
            v.src = item.src;
            v.crossOrigin = 'anonymous';
            v.loop = true;
            v.muted = false;
            v.volume = 0;
            v.playsInline = true;
            v.preload = 'auto';
            v.load();
            preloadedVideoElements[idx] = v;
        }
    });
}

async function runIntroTextSequence(onCompleteCallback) {
    await fetchDynamicManifest();
    preloadCorridorMedia();

    const overlay = document.getElementById('intro-text-section');
    const textBox = document.getElementById('intro-text-box');

    if (!overlay || !textBox) {
        if (onCompleteCallback) onCompleteCallback();
        return;
    }

    overlay.classList.remove('hidden');
    const discordId = currentUser.username || localStorage.getItem('scavenger_user_name') || currentUser.id || 'Operator';

    for (let i = 0; i < INTRO_TEXT_CONFIG.length; i++) {
        const item = INTRO_TEXT_CONFIG[i];
        let lineText = item.text.replace('{DISCORD_ID}', discordId);

        textBox.innerText = lineText;
        textBox.className = 'intro-text-container text-fade-in';

        await new Promise(resolve => setTimeout(resolve, item.duration));

        textBox.className = 'intro-text-container text-fade-out';
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    overlay.classList.add('hidden');
    if (onCompleteCallback) onCompleteCallback();
}

let showcaseScene, showcaseCamera, showcaseRenderer;
let showcaseMediaPanels = [];
let isShowcaseRunning = false;
let cameraZ = 0;
let finalStatsZ = -1800;

const PROXIMITY_RADIUS = 260;
const MAX_VIDEO_VOLUME = 0.25;

let stats3DCardMesh = null;
let statsCanvasTexture = null;
let isFinalButtonShown = false;

function create3DCaptionPlaque(captionText) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(8, 8, 496, 112);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 496, 112);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(captionText.toUpperCase(), 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const planeGeo = new THREE.PlaneGeometry(125, 31);
    const planeMat = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
        fog: true
    });

    return new THREE.Mesh(planeGeo, planeMat);
}

function initShowcase3D() {
    const container = document.getElementById('showcase-container');
    if (!container) return;

    showcaseScene = new THREE.Scene();
    showcaseScene.fog = new THREE.FogExp2(0x000000, 0.0016);

    showcaseCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 8000);
    showcaseCamera.position.set(0, 0, 100);

    showcaseRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    showcaseRenderer.setSize(window.innerWidth, window.innerHeight);
    showcaseRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(showcaseRenderer.domElement);

    showcaseMediaPanels = [];
    MEDIA_SEQUENCE.forEach((item, idx) => {
        const panelZ = -380 * (idx + 1);
        const xOffset = (idx % 2 === 0) ? -130 : 130;

        const planeGeo = new THREE.PlaneGeometry(160, 90);
        let texture;
        let videoEl = preloadedVideoElements[idx] || null;

        const planeMat = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            transparent: true,
            fog: true
        });

        const mesh = new THREE.Mesh(planeGeo, planeMat);
        mesh.position.set(xOffset, 0, panelZ);

        if (item.type === 'video') {
            if (!videoEl) {
                videoEl = document.createElement('video');
                videoEl.src = item.src;
                videoEl.crossOrigin = 'anonymous';
                videoEl.loop = true;
                videoEl.muted = false;
                videoEl.volume = 0;
                videoEl.playsInline = true;
            }
            texture = new THREE.VideoTexture(videoEl);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            planeMat.map = texture;
        } else {
            const loader = new THREE.TextureLoader();
            loader.load(item.src, (loadedTex) => {
                planeMat.map = loadedTex;
                planeMat.needsUpdate = true;
                if (loadedTex && loadedTex.image) {
                    const imgAspect = loadedTex.image.width / loadedTex.image.height;
                    if (imgAspect < 1.2) {
                        mesh.scale.set(0.68, 1.2, 1);
                    }
                }
            });
        }

        showcaseScene.add(mesh);

        if (item.caption) {
            const captionMesh = create3DCaptionPlaque(item.caption);
            captionMesh.position.set(xOffset, -68, panelZ);
            showcaseScene.add(captionMesh);
        }

        showcaseMediaPanels.push({
            mesh: mesh,
            z: panelZ,
            videoEl: videoEl,
            type: item.type
        });
    });

    finalStatsZ = -380 * (MEDIA_SEQUENCE.length + 1);

    createDeadCenter3DStatsCard(finalStatsZ);

    window.addEventListener('resize', onShowcaseResize);
}

function createDeadCenter3DStatsCard(targetZ) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(20, 20, 984, 984);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 12;
    ctx.strokeRect(20, 20, 984, 984);

    statsCanvasTexture = new THREE.CanvasTexture(canvas);

    const cardGeo = new THREE.PlaneGeometry(220, 220);
    const cardMat = new THREE.MeshBasicMaterial({
        map: statsCanvasTexture,
        side: THREE.DoubleSide,
        transparent: true,
        fog: false
    });

    stats3DCardMesh = new THREE.Mesh(cardGeo, cardMat);
    stats3DCardMesh.position.set(0, 0, targetZ);
    showcaseScene.add(stats3DCardMesh);

    update3DStatsCardTexture(canvas, ctx);
}

async function update3DStatsCardTexture(canvas, ctx) {
    const userId = currentUser.id || localStorage.getItem('scavenger_user_id') || 'GUEST';
    const userName = currentUser.username || localStorage.getItem('scavenger_user_name') || 'Operator';

    let statsData = {};
    try {
        const res = await fetch(`${API_BASE}/user-full-stats?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
            statsData = await res.json();
        }
    } catch (e) { }

    const localAvatar = localStorage.getItem('scavenger_user_avatar');
    const avatarUrl = localAvatar || (statsData.avatarUrl && statsData.avatarUrl !== 'favicon.png' ? statsData.avatarUrl : null) || 'favicon.png';
    const repulsName = (statsData.repulsUsername && statsData.repulsUsername !== 'Operator')
        ? statsData.repulsUsername
        : (localStorage.getItem('scavenger_repuls_name') || 'AmanLovesCats');
    const timeTaken = statsData.timeTaken || '34m 12s';
    const rank = statsData.rank || '#1';

    const renderTextContent = (img = null) => {
        ctx.fillStyle = '#0a0a0e';
        ctx.fillRect(20, 20, 984, 984);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 12;
        ctx.strokeRect(20, 20, 984, 984);

        if (img) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(512, 260, 160, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, 352, 100, 320, 320);
            ctx.restore();
        }

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(512, 260, 160, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(userName, 512, 475);

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '32px monospace';
        ctx.fillText(repulsName, 512, 525);

        ctx.fillStyle = '#000000';
        ctx.fillRect(90, 585, 390, 190);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(90, 585, 390, 190);

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '22px monospace';
        ctx.fillText('TIME TAKEN TO SOLVE', 285, 638);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px monospace';
        ctx.fillText(timeTaken, 285, 720);

        ctx.fillStyle = '#000000';
        ctx.fillRect(544, 585, 390, 190);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(544, 585, 390, 190);

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '22px monospace';
        ctx.fillText('COMPLETION RANK', 739, 638);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px monospace';
        ctx.fillText(rank, 739, 720);

        if (statsCanvasTexture) statsCanvasTexture.needsUpdate = true;
    };

    renderTextContent(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        renderTextContent(img);
    };
    img.src = avatarUrl;
}

function onShowcaseResize() {
    if (!showcaseCamera || !showcaseRenderer) return;
    showcaseCamera.aspect = window.innerWidth / window.innerHeight;
    showcaseCamera.updateProjectionMatrix();
    showcaseRenderer.setSize(window.innerWidth, window.innerHeight);
}

async function start3DMediaShowcase() {
    const section = document.getElementById('showcase-section');
    if (section) section.classList.remove('hidden');

    await fetchDynamicManifest();
    initShowcase3D();
    isShowcaseRunning = true;
    isFinalButtonShown = false;
    cameraZ = 100;

    animateShowcase();
}

function animateShowcase() {
    if (!isShowcaseRunning) return;
    requestAnimationFrame(animateShowcase);

    const stopZ = finalStatsZ + 215;

    if (cameraZ > stopZ) {
        cameraZ -= 2.2;

        showcaseMediaPanels.forEach(p => {
            if (p.videoEl) {
                const dist = Math.abs(cameraZ - p.z);
                if (dist < PROXIMITY_RADIUS) {
                    if (p.videoEl.paused) {
                        p.videoEl.play().catch(() => {});
                    }
                    const normDist = 1 - (dist / PROXIMITY_RADIUS);
                    p.videoEl.volume = Math.min(MAX_VIDEO_VOLUME, Math.max(0, normDist * MAX_VIDEO_VOLUME));
                } else {
                    p.videoEl.volume = 0;
                    if (!p.videoEl.paused) {
                        p.videoEl.pause();
                    }
                }
            }
        });
    } else {
        cameraZ = stopZ;

        showcaseMediaPanels.forEach(p => {
            if (p.videoEl) {
                p.videoEl.volume = 0;
                if (!p.videoEl.paused) {
                    try { p.videoEl.pause(); } catch(e){}
                }
            }
        });

        if (!isFinalButtonShown) {
            isFinalButtonShown = true;
            showDeadCenterFinalizeButton();
        }
    }

    showcaseCamera.position.z = cameraZ;
    showcaseRenderer.render(showcaseScene, showcaseCamera);
}

function showDeadCenterFinalizeButton() {
    const userId = currentUser.id || localStorage.getItem('scavenger_user_id') || 'GUEST';
    const userName = currentUser.username || localStorage.getItem('scavenger_user_name') || 'Operator';

    const statsSection = document.getElementById('rewind-stats-section');
    if (!statsSection) return;

    statsSection.classList.remove('hidden');

    statsSection.innerHTML = `
        <div id="finalize-btn-container" style="position: fixed; bottom: 12.5%; left: 50%; transform: translateX(-50%); width: 100%; max-width: 420px; z-index: 999999; text-align: center; pointer-events: auto;">
            <button id="btn-claim-grant" class="btn-proceed-white" style="width: 100%; padding: 1.15rem 1.8rem; font-size: 1.08rem; letter-spacing: 4px; font-weight: bold;">FINALIZE TRANSMISSION</button>
        </div>
    `;

    const btnClaim = document.getElementById('btn-claim-grant');
    if (btnClaim) {
        btnClaim.addEventListener('click', async () => {
            playClickSound();

            const btnContainer = document.getElementById('finalize-btn-container');
            if (btnContainer) btnContainer.style.opacity = '0';

            if (showcaseRenderer && showcaseRenderer.domElement) {
                showcaseRenderer.domElement.style.transition = 'opacity 1s ease-out';
                showcaseRenderer.domElement.style.opacity = '0';
            }

            try {
                await fetch(`${API_BASE}/complete-event`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: userId, username: userName })
                });
            } catch (e) { }

            setTimeout(() => {
                const showcaseSection = document.getElementById('showcase-section');
                if (showcaseSection) showcaseSection.classList.add('hidden');

                statsSection.innerHTML = `
                    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90%; max-width: 750px; text-align: center; z-index: 999999; pointer-events: auto;" class="fade-in-slow">
                        <h1 style="font-family: var(--font-mono); font-size: 2.2rem; color: #ffffff; letter-spacing: 6px; margin-bottom: 1.2rem; text-shadow: 0 0 20px rgba(255,255,255,0.4);">ALL CIPHERS ACCEPTED</h1>
                        <p style="font-family: var(--font-mono); font-size: 1.05rem; color: #aaaaaa; letter-spacing: 3px; margin: 0; line-height: 1.6;">YOUR REWARDS AND SKINS WILL BE GRANTED TO YOUR REPULS ACCOUNT SOON.</p>
                    </div>
                `;
            }, 1000);
        });
    }
}
