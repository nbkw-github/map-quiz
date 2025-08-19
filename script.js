document.addEventListener('DOMContentLoaded', () => {
    // --- App State ---
    let audioCtx;
    let remainingPrefectures = [];
    let currentPrefecture = null;
    let score = 0;
    let gameActive = false;

    // --- DOM Element Variables ---
    let mapContainer, questionEl, resultEl, scoreEl, feedbackOverlay,
        feedbackSymbol, feedbackText, questionMascot;

    const PREFECTURE_DATA = [
        { code: 1, name: '北海道', emoji: '🦀' }, { code: 2, name: '青森県', emoji: '🍎' }, { code: 3, name: '岩手県', emoji: '🍜' },
        { code: 4, name: '宮城県', emoji: '🎋' }, { code: 5, name: '秋田県', emoji: '🐶' }, { code: 6, name: '山形県', emoji: '🍒' },
        { code: 7, name: '福島県', emoji: '🍑' }, { code: 8, name: '茨城県', emoji: '🌰' }, { code: 9, name: '栃木県', emoji: '🍓' },
        { code: 10, name: '群馬県', emoji: '♨️' }, { code: 11, name: '埼玉県', emoji: '🍠' }, { code: 12, name: '千葉県', emoji: '🥜' },
        { code: 13, name: '東京都', emoji: '🗼' }, { code: 14, name: '神奈川県', emoji: '🚢' }, { code: 15, name: '新潟県', emoji: '🍚' },
        { code: 16, name: '富山県', emoji: '🦑' }, { code: 17, name: '石川県', emoji: '' }, { code: 18, name: '福井県', emoji: '🦖' },
        { code: 19, name: '山梨県', emoji: '🍇' }, { code: 20, name: '長野県', emoji: '' }, { code: 21, name: '岐阜県', emoji: '' },
        { code: 22, name: '静岡県', emoji: '🍵' }, { code: 23, name: '愛知県', emoji: '' }, { code: 24, name: '三重県', emoji: '🥷' },
        { code: 25, name: '滋賀県', emoji: '' }, { code: 26, name: '京都府', emoji: '⛩️' }, { code: 27, name: '大阪府', emoji: '🐙' },
        { code: 28, name: '兵庫県', emoji: '🌉' }, { code: 29, name: '奈良県', emoji: '🦌' }, { code: 30, name: '和歌山県', emoji: '🍊' },
        { code: 31, name: '鳥取県', emoji: '🐫' }, { code: 32, name: '島根県', emoji: '' }, { code: 33, name: '岡山県', emoji: '🍑' },
        { code: 34, name: '広島県', emoji: '🍁' }, { code: 35, name: '山口県', emoji: '🐡' }, { code: 36, name: '徳島県', emoji: '' },
        { code: 37, name: '香川県', emoji: '' }, { code: 38, name: '愛媛県', emoji: '🍊' }, { code: 39, name: '高知県', emoji: '' },
        { code: 40, name: '福岡県', emoji: '🍓' }, { code: 41, name: '佐賀県', emoji: '🦑' }, { code: 42, name: '長崎県', emoji: '🔔' },
        { code: 43, name: '熊本県', emoji: '🐻' }, { code: 44, name: '大分県', emoji: '♨️' }, { code: 45, name: '宮崎県', emoji: '🥭' },
        { code: 46, name: '鹿児島県', emoji: '🌋' }, { code: 47, name: '沖縄県', emoji: '🌺' }
    ];

    // --- Main Initialization ---
    fetch('japan.svg')
        .then(response => response.text())
        .then(svgData => {
            document.getElementById('map-container').innerHTML = svgData;
            initializeDOMElements();
            initializeMap();
            startGame();
        });

    function initializeDOMElements() {
        mapContainer = document.getElementById('map-container');
        questionEl = document.getElementById('question');
        resultEl = document.getElementById('result');
        scoreEl = document.getElementById('score');
        feedbackOverlay = document.getElementById('feedback-overlay');
        feedbackSymbol = document.getElementById('feedback-symbol');
        feedbackText = document.getElementById('feedback-text');
        questionMascot = document.getElementById('question-mascot');
    }

    function initializeMap() {
        const prefectureGroups = mapContainer.querySelectorAll('g.prefectures > g');
        prefectureGroups.forEach(group => {
            const code = group.getAttribute('data-code');
            if (code) group.id = `pref-group-${code}`;
        });
    }

    function startGame() {
        score = 0;
        resultEl.innerHTML = '';
        updateScore();
        PREFECTURE_DATA.forEach(p => {
            const el = document.getElementById(`pref-group-${p.code}`);
            if (el) el.classList.remove('correct-answer');
        });
        remainingPrefectures = [...PREFECTURE_DATA];
        gameActive = true;
        mapContainer.addEventListener('click', handleMapClick);
        askQuestion();
    }

    function askQuestion() {
        if (remainingPrefectures.length === 0) {
            showFinalResult();
            return;
        }
        const randomIndex = Math.floor(Math.random() * remainingPrefectures.length);
        currentPrefecture = remainingPrefectures[randomIndex];
        remainingPrefectures.splice(randomIndex, 1);
        questionEl.textContent = `${currentPrefecture.name}はどこかな？`;
        resultEl.textContent = '';
        updateMascot('default');
    }

    function handleMapClick(event) {
        if (!gameActive) return;
        const clickedGroup = event.target.closest('g[id^="pref-group-"]');
        if (!clickedGroup) return;
        const clickedCode = clickedGroup.id.replace('pref-group-', '');
        if (clickedGroup.classList.contains('correct-answer')) return;

        if (parseInt(clickedCode, 10) === currentPrefecture.code) {
            score++;
            updateScore();
            clickedGroup.classList.add('correct-answer');
            showFeedback(true);
            updateMascot('correct');
            setTimeout(askQuestion, 800);
        } else {
            playSound('incorrect');
            updateMascot('incorrect');
            resultEl.textContent = 'もう一度！';
            resultEl.style.color = 'red';
        }
    }

    // --- Helper Functions ---
    function updateScore() { scoreEl.textContent = score; }

    function updateMascot(state) {
        questionMascot.textContent = state === 'correct' ? '😄' : state === 'incorrect' ? '🤔' : '🐼';
    }

    function playSound(type) {
        if (!audioCtx) {
            try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
            catch (e) { console.error("Web Audio API is not supported"); return; }
        }
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        if (type === 'correct') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
            setTimeout(() => gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5), 100);
        } else if (type === 'incorrect') {
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(261.63, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            setTimeout(() => gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.3), 100);
        }
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.5);
    }

    function showFeedback(isCorrect) {
        if (isCorrect) {
            // Use prefecture emoji if it exists, otherwise default to a circle
            feedbackSymbol.textContent = currentPrefecture.emoji || '⚪︎';
            feedbackText.textContent = '正解！';
            feedbackOverlay.className = 'correct';
            playSound('correct');
        }
        setTimeout(() => feedbackOverlay.classList.add('hidden'), 800);
    }

    function showFinalResult() {
        gameActive = false;
        mapContainer.removeEventListener('click', handleMapClick);
        questionEl.textContent = '全問正解！おめでとう！';
        updateMascot('win');
        resultEl.innerHTML = '<button id="restart-button">もう一度プレイ</button>';
        document.getElementById('restart-button').addEventListener('click', startGame);
    }
});
