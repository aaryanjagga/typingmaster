/*---Typing Master - Full Feature Edition---*/

const levels = {
    easy: ["the", "sun", "cat", "dog", "run", "big", "red", "car", "sky", "cup", "hot", "man", "map", "boy", "hat", "pen", "ice", "fly", "joy", "box"],
    medium: ["Programming", "Consistency", "Innovation", "Development", "Application", "Experience", "Creativity", "Responsive", "Logical", "Performance"],
    hard: ["Socioeconomic", "Quantum", "Metaphysical", "Epistemological", "Architectural", "Ramifications", "Cryptographic", "Computational", "Fluctuations", "Superconductive"]
};

const paragraphs = {
    easy: ["the sun is red.", "a big cat sat.", "run to the boy.", "the sky is blue.", "i see a map.", "a hot red cup.", "get the big pen.", "the boy has a hat.", "ice is very cold.", "a fly is small."],
    medium: ["Practice leads to mastery of any skill you pursue.", "Innovation distinguishes between a leader and a follower.", "Clean code is like a well-written book with structure.", "Consistent habits build the foundation for future success.", "Modern web applications require responsive design patterns."],
    hard: ["The socioeconomic ramifications of decentralized finance are fundamentally altering traditional banking.", "Quantum superposition in physical systems exists in all theoretical states simultaneously until measured.", "Architectural brutalism is characterized by raw concrete and repetitive angular geometries in structural design.", "Epistemological skepticism questions the possibility of attaining absolute certainty in human knowledge."]
};

const lessons = [
    { title: "Home Row Mastery", keys: "asdfghjkl;", desc: "The center row where your fingers rest." },
    { title: "Top Row Reach", keys: "qwertyuiop", desc: "Reaching up from the home position." },
    { title: "Bottom Row Shift", keys: "zxcvbnm,./", desc: "Moving down for lower characters." },
    { title: "Number Row", keys: "1234567890", desc: "The top-most row for digits." }
];

// --- Storage Logic ---
const dbName = "TypingMasterDB";
let db;

async function initDB() {
    return new Promise((resolve) => {
        const request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            db.createObjectStore("history", { keyPath: "id", autoIncrement: true });
        };
        request.onsuccess = (e) => { db = e.target.result; resolve(); };
    });
}

const Storage = {
    save: async (data) => {
        const tx = db.transaction("history", "readwrite");
        tx.objectStore("history").add({ ...data, timestamp: Date.now() });
    },
    get: () => new Promise(res => {
        const tx = db.transaction("history", "readonly");
        const req = tx.objectStore("history").getAll();
        req.onsuccess = () => res(req.result);
    })
};

// --- Global State ---
let appMode = 'test';
let state = {
    test: { active: false, timer: 60, timerLimit: 60, text: "", input: "", mistakes: 0, interval: null, isPractice: false, startTime: 0 },
    game: { active: false, score: 0, lives: 3, balloons: [], speed: 0.7, lastSpawn: 0, spawnRate: 2800, animFrame: null, totalChars: 0, startTime: 0, difficulty: 'medium' }
};

const textStrip = document.getElementById('text-strip');
const hiddenInput = document.getElementById('hidden-input');

function switchView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    document.getElementById(`view-${id}`).classList.add('active');
    document.getElementById(`nav-${id}`).classList.add('active');
    appMode = id;
    if (id === 'profile') renderProfile();
    if (id === 'learn') renderLearn();
    
    if (id !== 'test') {
        state.test.isPractice = false;
        document.getElementById('practice-label').style.display = 'none';
        resetTest();
    }
    
    stopGame();
    focusInput();
}

// --- Learn Mode Logic ---
function renderLearn() {
    const container = document.getElementById('lesson-container');
    container.innerHTML = "";
    lessons.forEach((lesson, idx) => {
        const card = document.createElement('div');
        card.className = "lesson-card";
        
        let previewHtml = `<div class="keyboard-preview">`;
        const rowKeys = lesson.keys.split("");
        for(let i=0; i<10; i++) {
            const k = rowKeys[i] || "";
            previewHtml += `<div class="key-p ${k ? 'key-highlight' : ''}">${k}</div>`;
        }
        previewHtml += `</div>`;

        card.innerHTML = `
            <h3>${lesson.title}</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); min-height: 40px;">${lesson.desc}</p>
            ${previewHtml}
            <button class="btn btn-outline" onclick="startLesson(${idx})" style="width: 100%;">Practice Row</button>
        `;
        container.appendChild(card);
    });
}

function startLesson(idx) {
    const lesson = lessons[idx];
    state.test.isPractice = true;
    state.test.timerLimit = 60;
    
    const chars = lesson.keys.split("");
    let practiceStr = "";
    for(let i=0; i<100; i++) {
        for(let j=0; j < Math.floor(Math.random() * 3) + 2; j++) {
            practiceStr += chars[Math.floor(Math.random() * chars.length)];
        }
        practiceStr += " ";
    }
    
    state.test.text = practiceStr.trim();
    switchView('test');
    document.getElementById('practice-label').style.display = 'block';
    resetTestFromSource();
}

// --- Speed Test Logic ---
function resetTest() {
    if (state.test.isPractice) return resetTestFromSource();
    const diff = document.getElementById('test-difficulty').value;
    state.test.text = shufflePool(paragraphs[diff]).join(" ");
    resetTestFromSource();
}

function resetTestFromSource() {
    clearInterval(state.test.interval);
    state.test.input = "";
    state.test.active = false;
    state.test.mistakes = 0;
    state.test.startTime = 0;
    state.test.timer = state.test.timerLimit;
    hiddenInput.value = "";
    renderTestText();
    updateTestUI();
    textStrip.style.transform = `translateX(0px)`;
}

function shufflePool(pool) {
    const p = [...pool];
    for (let i = p.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
    }
    return p;
}

function renderTestText() {
    textStrip.innerHTML = "";
    state.test.text.split("").forEach((char, i) => {
        const span = document.createElement('span');
        span.innerText = char === " " ? "\u00A0" : char;
        span.className = 'char';
        if (i === 0) span.classList.add('current');
        textStrip.appendChild(span);
    });
}

function updateTestUI() {
    const val = state.test.input;
    const spans = textStrip.querySelectorAll('.char');
    let curErrs = 0;

    spans.forEach((span, i) => {
        span.classList.remove('correct', 'incorrect', 'current');
        if (i < val.length) {
            if (val[i] === state.test.text[i]) span.classList.add('correct');
            else { span.classList.add('incorrect'); curErrs++; }
        } else if (i === val.length) {
            span.classList.add('current');
            textStrip.style.transform = `translateX(${-span.offsetLeft}px)`;
        }
    });

    let wpm = 0;
    let accuracy = 100;

    if (state.test.active && state.test.startTime > 0) {
        const elapsedMinutes = (Date.now() - state.test.startTime) / 60000;
        if (elapsedMinutes > 0.03) { 
            const totalWords = val.length / 5;
            const errorPenalty = curErrs; 
            const netWords = Math.max(0, totalWords - errorPenalty);
            wpm = Math.round(netWords / elapsedMinutes);
        }
        if (val.length > 0) {
            accuracy = Math.round(((val.length - curErrs) / val.length) * 100);
        }
    }

    const fixed = Math.max(0, state.test.mistakes - curErrs);
    document.getElementById('wpm').innerText = wpm;
    document.getElementById('accuracy').innerText = accuracy + "%";
    document.getElementById('corrected-stat').innerText = fixed;
    
    const m = Math.floor(state.test.timer / 60);
    const s = state.test.timer % 60;
    document.getElementById('timer').innerText = `${m}:${s.toString().padStart(2, '0')}`;
}

function startTest() {
    state.test.active = true;
    state.test.startTime = Date.now();
    state.test.interval = setInterval(() => {
        state.test.timer--;
        updateTestUI();
        if (state.test.timer <= 0) endTest();
    }, 1000);
}

function endTest() {
    clearInterval(state.test.interval);
    
    const val = state.test.input;
    let curErrs = 0;
    for(let i=0; i<val.length; i++) {
        if (val[i] !== state.test.text[i]) curErrs++;
    }
    
    const start = state.test.startTime || Date.now();
    const elapsedMinutes = (Date.now() - start) / 60000;
    const totalWords = val.length / 5;
    const netWords = Math.max(0, totalWords - curErrs);
    const finalWpm = elapsedMinutes > 0.005 ? Math.round(netWords / elapsedMinutes) : 0;
    const finalAcc = Math.round(((val.length - curErrs) / (val.length || 1)) * 100) + "%";

    state.test.active = false;
    
    Storage.save({ type: state.test.isPractice ? 'Practice' : 'Test', wpm: finalWpm, acc: finalAcc });
    
    document.getElementById('modal-title').innerText = state.test.isPractice ? "Practice Complete" : "Test Complete";
    document.getElementById('modal-wpm').innerText = finalWpm;
    document.getElementById('modal-acc').innerText = finalAcc;
    document.getElementById('modal-extra-stat').innerText = "Fixed Errors: " + (state.test.mistakes - curErrs);
    document.getElementById('modal-result').style.display = 'flex';
}

// --- Game Logic ---
function startGame() {
    const gameDifficulty = document.getElementById('game-difficulty-select').value;
    document.getElementById('game-overlay').style.display = 'none';
    state.game = {
        active: true, score: 0, lives: 3, balloons: [],
        speed: 0.7, lastSpawn: Date.now(), spawnRate: 2800,
        animFrame: null, totalChars: 0, startTime: Date.now(),
        difficulty: gameDifficulty
    };
    hiddenInput.value = "";
    document.getElementById('game-input-display').innerText = "_";
    updateGameStats();
    gameLoop();
    focusInput();
}

function spawnBalloon() {
    const diff = state.game.difficulty;
    const pool = levels[diff];
    const word = pool[Math.floor(Math.random() * pool.length)].toLowerCase();
    const el = document.createElement('div');
    el.className = 'balloon';
    el.innerText = word;
    const arena = document.getElementById('game-arena');
    const x = Math.random() * (arena.offsetWidth - 130) + 10;
    el.style.left = x + "px"; el.style.top = "-130px";
    arena.appendChild(el);
    state.game.balloons.push({ el, word, x, y: -130 });
}

function gameLoop() {
    if (!state.game.active) return;
    const now = Date.now();
    if (now - state.game.lastSpawn > state.game.spawnRate) {
        spawnBalloon();
        state.game.lastSpawn = now;
        state.game.speed += 0.008; 
    }
    state.game.balloons.forEach((b, i) => {
        b.y += state.game.speed;
        b.el.style.top = b.y + "px";
        if (b.y > 480) {
            state.game.lives--;
            b.el.style.background = 'var(--error)';
            setTimeout(() => b.el.remove(), 200);
            state.game.balloons.splice(i, 1);
            updateGameStats();
            if (state.game.lives <= 0) endGame();
        }
    });
    state.game.animFrame = requestAnimationFrame(gameLoop);
}

function updateGameStats() {
    document.getElementById('game-score').innerText = state.game.score;
    document.getElementById('game-lives').innerText = "❤️".repeat(Math.max(0, state.game.lives));
    
    let wpm = 0;
    if (state.game.active && state.game.startTime > 0) {
        const elapsedMinutes = (Date.now() - state.game.startTime) / 60000;
        if (elapsedMinutes > 0.05 && state.game.totalChars > 0) {
            wpm = Math.round((state.game.totalChars / 5) / elapsedMinutes);
        }
    }
    
    const highScore = localStorage.getItem("TypingMaster_GameHighScore") || 0;
    document.getElementById('game-wpm').innerText = wpm;
    document.getElementById('game-best').innerText = highScore;
}

function stopGame() {
    state.game.active = false;
    cancelAnimationFrame(state.game.animFrame);
    document.querySelectorAll('.balloon').forEach(b => b.remove());
    document.getElementById('game-overlay').style.display = 'flex';
}

function endGame() {
    const elapsedMinutes = (Date.now() - state.game.startTime) / 60000;
    const finalWpm = Math.round((state.game.totalChars / 5) / (elapsedMinutes || 0.01));
    
    const currentHigh = parseInt(localStorage.getItem("TypingMaster_GameHighScore") || "0");
    if (state.game.score > currentHigh) {
        localStorage.setItem("TypingMaster_GameHighScore", state.game.score);
    }
    
    Storage.save({ type: `Game (${state.game.difficulty})`, wpm: finalWpm, score: state.game.score });
    stopGame();
    
    document.getElementById('modal-title').innerText = "Game Over";
    document.getElementById('modal-wpm').innerText = finalWpm;
    document.getElementById('modal-acc').innerText = "---";
    document.getElementById('modal-extra-stat').innerText = "Final Score: " + state.game.score;
    document.getElementById('modal-result').style.display = 'flex';
}

// --- Shared Handlers ---
function focusInput() { hiddenInput.focus(); }
function setTimerLimit(s) { state.test.timerLimit = s; resetTest(); }

hiddenInput.addEventListener('input', (e) => {
    const val = hiddenInput.value;
    if (appMode === 'test') {
        if (!state.test.active && val.length > 0) startTest();
        if (val.length > state.test.input.length) {
            if (val[val.length-1] !== state.test.text[val.length-1]) {
                state.test.mistakes++;
            }
        }
        state.test.input = val;
        updateTestUI();
    } else if (appMode === 'game' && state.game.active) {
        document.getElementById('game-input-display').innerText = val || "_";
        updateGameStats();
    }
});

hiddenInput.addEventListener('keydown', (e) => {
    if (appMode === 'game' && state.game.active) {
        if (e.key === 'Enter' || e.key === ' ') {
            const word = hiddenInput.value.trim().toLowerCase();
            const idx = state.game.balloons.findIndex(b => b.word === word);
            if (idx !== -1) {
                const b = state.game.balloons[idx];
                state.game.totalChars += b.word.length;
                state.game.score += (b.word.length * 10);
                b.el.style.transform = 'scale(1.2)';
                b.el.style.opacity = '0';
                setTimeout(() => b.el.remove(), 150);
                state.game.balloons.splice(idx, 1);
                updateGameStats();
            }
            hiddenInput.value = "";
            document.getElementById('game-input-display').innerText = "_";
            e.preventDefault();
        }
    }
});

function closeModal() { document.getElementById('modal-result').style.display = 'none'; resetTest(); }

/**
 * VISUAL ANALYTICS & PROFILE
 */
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${dd}/${mm}/${yyyy} at ${time}`;
}

async function renderProfile() {
    const history = await Storage.get();
    const list = document.getElementById('history-list');
    list.innerHTML = history.length ? "" : "No logs found.";
    
    drawHistoryGraph(history.slice(-15));

    history.reverse().forEach(h => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div>
                <strong>${h.type}</strong> 
                <div style="color:var(--text-muted); font-size: 0.75rem; margin-top: 4px;">${formatDate(h.timestamp)}</div>
            </div>
            <div>
                <span style="color:var(--accent); font-weight:700; font-size: 1.1rem;">${h.wpm} WPM</span> 
                ${h.score ? '<div style="font-size: 0.7rem; color: var(--text-muted); text-align: right;">Score: '+h.score+'</div>' : ''}
            </div>
        `;
        list.appendChild(item);
    });
}

function drawHistoryGraph(data) {
    const canvas = document.getElementById('history-graph');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (data.length < 2) {
        ctx.fillStyle = "#94a3b8";
        ctx.font = "24px Inter";
        ctx.textAlign = "center";
        ctx.fillText("Insufficient data to generate graph", canvas.width / 2, canvas.height / 2);
        return;
    }

    const padding = 60;
    const chartW = canvas.width - padding * 2;
    const chartH = canvas.height - padding * 2;
    const maxWpm = Math.max(...data.map(d => d.wpm), 80);
    
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 6;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();

    data.forEach((point, i) => {
        const x = padding + (i * (chartW / (data.length - 1)));
        const y = (canvas.height - padding) - (point.wpm / maxWpm) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    data.forEach((point, i) => {
        const x = padding + (i * (chartW / (data.length - 1)));
        const y = (canvas.height - padding) - (point.wpm / maxWpm) * chartH;
        ctx.fillStyle = "#3b82f6";
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = "#64748b";
        ctx.font = "bold 18px Inter";
        ctx.textAlign = "center";
        ctx.fillText(point.wpm, x, y - 20);
    });
}

window.onload = async () => {
    await initDB();
    resetTest();
    
    document.addEventListener('copy', e => e.preventDefault());
    document.addEventListener('paste', e => e.preventDefault());
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('dragstart', e => e.preventDefault());

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v')) {
            e.preventDefault();
        }
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT' && e.key.length === 1) focusInput();
    });
}