// Memory Matrix Challenge - Advanced Pattern Memory Game

// Game State
let gameState = {
    currentScreen: 'menu',
    difficulty: 'easy',
    level: 1,
    score: 0,
    lives: 3,
    timeElapsed: 0,
    isPaused: false,
    soundEnabled: true,
    pattern: [],
    userPattern: [],
    symbolCell: undefined,
    isShowingPattern: false,
    canClick: false,
    gridSize: 3,
    patternLength: 3,
    showTime: 2000,
    gamesPlayed: 0,
    totalScore: 0,
    highScore: 0,
    correctPatterns: 0,
    totalPatterns: 0,
    startTime: null,
    timerInterval: null,
    failures: 0,
    currentGameFailures: 0,
    bestTime: Infinity,
    gameHistory: [],
    currentPatternStartTime: null,
    currentPatternBestTime: null,
    completedGames: 0,
    failedGames: 0
};

// Difficulty Settings
const difficultySettings = {
    easy: {
        gridSize: 3,
        patternLength: 3,
        showTime: 2000,
        scoreMultiplier: 1,
        lives: 3
    },
    medium: {
        gridSize: 4,
        patternLength: 4,
        showTime: 2500,
        scoreMultiplier: 2,
        lives: 3
    },
    hard: {
        gridSize: 5,
        patternLength: 5,
        showTime: 3000,
        scoreMultiplier: 3,
        lives: 2
    },
    extreme: {
        gridSize: 6,
        patternLength: 6,
        showTime: 3500,
        scoreMultiplier: 5,
        lives: 2
    }
};

// Sound System
const audioContext = new (window.AudioContext || window.webkitAudioContext());

function playSound(frequency, duration, type = 'sine') {
    if (!gameState.soundEnabled) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function playSuccessSound() {
    playSound(523, 0.1); // C
    setTimeout(() => playSound(659, 0.1), 100); // E
    setTimeout(() => playSound(784, 0.2), 200); // G
}

function playErrorSound() {
    playSound(200, 0.2, 'sawtooth');
}

function playClickSound() {
    playSound(440, 0.05);
}

function playLevelUpSound() {
    playSound(523, 0.1); // C
    setTimeout(() => playSound(659, 0.1), 150); // E
    setTimeout(() => playSound(784, 0.1), 300); // G
    setTimeout(() => playSound(1047, 0.2), 450); // High C
}

function playGameOverSound() {
    playSound(300, 0.2);
    setTimeout(() => playSound(250, 0.2), 200);
    setTimeout(() => playSound(200, 0.3), 400);
}

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.style.display = screenId === 'gameScreen' ? 'block' : 'flex';
        gameState.currentScreen = screenId;
    }
}

// Menu Functions
function startGame(difficulty) {
    // Save stats before starting new game to ensure persistence
    saveStats();
    
    gameState.difficulty = difficulty;
    const settings = difficultySettings[difficulty];
    
    gameState.gridSize = settings.gridSize;
    gameState.patternLength = settings.patternLength;
    gameState.showTime = settings.showTime;
    gameState.lives = settings.lives;
    gameState.level = 1;
    gameState.score = 0;
    gameState.pattern = [];
    gameState.userPattern = [];
    gameState.symbolCell = undefined;
    gameState.isPaused = false;
    gameState.startTime = Date.now();
    gameState.timeElapsed = 0;
    gameState.currentGameFailures = 0;
    gameState.currentPatternStartTime = Date.now();
    gameState.currentPatternBestTime = null;
    
    showScreen('gameScreen');
    initializeGame();
    startTimer();
}

function initializeGame() {
    updateDisplay();
    createMatrix();
    document.getElementById('startPatternBtn').style.display = 'inline-block';
    updatePhaseIndicator('Click "Show Pattern" to begin!');
}

function createMatrix() {
    const container = document.getElementById('matrixContainer');
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${gameState.gridSize}, 1fr)`;
    
    for (let i = 0; i < gameState.gridSize * gameState.gridSize; i++) {
        const cell = document.createElement('div');
        cell.className = 'matrix-cell';
        cell.dataset.index = i;
        cell.addEventListener('click', () => handleCellClick(i));
        container.appendChild(cell);
    }
    
    // Add special symbol cell effect
    if (gameState.symbolCell !== undefined) {
        const symbolCell = container.querySelector(`[data-index="${gameState.symbolCell}"]`);
        if (symbolCell) {
            symbolCell.classList.add('symbol-cell');
        }
    }
}

function startPattern() {
    if (gameState.isShowingPattern) return;
    
    gameState.pattern = generatePattern();
    gameState.userPattern = [];
    gameState.isShowingPattern = true;
    gameState.canClick = false;
    gameState.currentPatternStartTime = Date.now();
    
    document.getElementById('startPatternBtn').style.display = 'none';
    updatePhaseIndicator('Watch the pattern carefully...');
    
    showPattern();
}

function generatePattern() {
    const pattern = [];
    const totalCells = gameState.gridSize * gameState.gridSize;
    
    // Add one special symbol cell as a distractor
    const symbolCellIndex = Math.floor(Math.random() * totalCells);
    
    while (pattern.length < gameState.patternLength) {
        const randomIndex = Math.floor(Math.random() * totalCells);
        if (!pattern.includes(randomIndex) && randomIndex !== symbolCellIndex) {
            pattern.push(randomIndex);
        }
    }
    
    // Store the symbol cell index for visual effect
    gameState.symbolCell = symbolCellIndex;
    
    return pattern;
}

function showPattern() {
    const cells = document.querySelectorAll('.matrix-cell');
    let currentIndex = 0;
    
    const showNextCell = () => {
        if (currentIndex < gameState.pattern.length) {
            const cellIndex = gameState.pattern[currentIndex];
            cells[cellIndex].classList.add('active');
            playClickSound();
            
            setTimeout(() => {
                cells[cellIndex].classList.remove('active');
                currentIndex++;
                
                if (currentIndex < gameState.pattern.length) {
                    setTimeout(showNextCell, 300);
                } else {
                    setTimeout(() => {
                        gameState.isShowingPattern = false;
                        gameState.canClick = true;
                        updatePhaseIndicator('Now repeat the pattern!');
                        enableCells();
                    }, 500);
                }
            }, 600);
        }
    };
    
    updateProgressBar(gameState.patternLength * 900 + 500);
    showNextCell();
}

function enableCells() {
    document.querySelectorAll('.matrix-cell').forEach(cell => {
        cell.classList.remove('disabled');
    });
}

function disableCells() {
    document.querySelectorAll('.matrix-cell').forEach(cell => {
        cell.classList.add('disabled');
    });
}

function handleCellClick(index) {
    if (!gameState.canClick || gameState.isShowingPattern || gameState.isPaused) return;
    
    const cell = document.querySelector(`[data-index="${index}"]`);
    if (cell.classList.contains('disabled')) return;
    
    playClickSound();
    gameState.userPattern.push(index);
    
    // Check if clicked the special symbol cell (distractor)
    if (index === gameState.symbolCell) {
        cell.classList.add('incorrect');
        setTimeout(() => cell.classList.remove('incorrect'), 500);
        
        playErrorSound();
        gameState.lives--;
        gameState.currentGameFailures++;
        updateDisplay();
        
        updatePhaseIndicator('Oops! That was a distractor symbol! ⚠️');
        
        if (gameState.lives <= 0) {
            gameOver();
        } else {
            gameState.canClick = false;
            disableCells();
            
            setTimeout(() => {
                document.getElementById('startPatternBtn').style.display = 'inline-block';
            }, 1500);
        }
        return;
    }
    
    if (gameState.pattern[gameState.userPattern.length - 1] === index) {
        cell.classList.add('correct');
        setTimeout(() => cell.classList.remove('correct'), 500);
        
        if (gameState.userPattern.length === gameState.pattern.length) {
            // Pattern completed successfully
            gameState.canClick = false;
            disableCells();
            
            setTimeout(() => {
                levelComplete();
            }, 1000);
        }
    } else {
        // Wrong cell
        cell.classList.add('incorrect');
        setTimeout(() => cell.classList.remove('incorrect'), 500);
        
        playErrorSound();
        gameState.lives--;
        gameState.currentGameFailures++;
        updateDisplay();
        
        if (gameState.lives <= 0) {
            gameOver();
        } else {
            gameState.canClick = false;
            disableCells();
            
            setTimeout(() => {
                updatePhaseIndicator('Wrong! Try again...');
                document.getElementById('startPatternBtn').style.display = 'inline-block';
            }, 1000);
        }
    }
}

function levelComplete() {
    const settings = difficultySettings[gameState.difficulty];
    const baseScore = 100 * gameState.level;
    const timeBonus = Math.max(0, 50 - Math.floor((Date.now() - gameState.startTime) / 1000));
    const levelScore = (baseScore + timeBonus) * settings.scoreMultiplier;
    
    // Track pattern completion time
    const patternTime = (Date.now() - gameState.currentPatternStartTime) / 1000; // in seconds
    if (!gameState.currentPatternBestTime || patternTime < gameState.currentPatternBestTime) {
        gameState.currentPatternBestTime = patternTime;
    }
    if (patternTime < (gameState.bestTime || Infinity)) {
        gameState.bestTime = patternTime;
    }
    
    gameState.score += levelScore;
    gameState.correctPatterns++;
    gameState.totalPatterns++;
    
    // Update high score in real-time
    if (gameState.score > (gameState.highScore || 0)) {
        gameState.highScore = gameState.score;
        // Save immediately when high score is updated
        saveStats();
    }
    
    playSuccessSound();
    updatePhaseIndicator('Excellent! Level Complete!');
    
    // Increase difficulty for next level
    gameState.level++;
    if (gameState.level % 3 === 0 && gameState.patternLength < gameState.gridSize * gameState.gridSize - 2) {
        gameState.patternLength++;
    }
    
    updateDisplay();
    
    // Save stats periodically during gameplay (every 3 levels)
    if (gameState.level % 3 === 0) {
        saveStats();
    }
    
    setTimeout(() => {
        if (gameState.level % 5 === 0) {
            playLevelUpSound();
            updatePhaseIndicator(`Level ${gameState.level - 1} Complete! 🎉`);
            // Save stats at milestone levels
            saveStats();
        }
        
        document.getElementById('startPatternBtn').style.display = 'inline-block';
        updatePhaseIndicator('Ready for next level?');
    }, 2000);
}

function gameOver() {
    // Count this game (win or lose, it's still a game played)
    gameState.gamesPlayed = (gameState.gamesPlayed || 0) + 1;
    gameState.totalPatterns = (gameState.totalPatterns || 0) + 1;
    gameState.totalScore = (gameState.totalScore || 0) + gameState.score;
    
    // Update high score if this is better
    if (gameState.score > (gameState.highScore || 0)) {
        gameState.highScore = gameState.score;
    }
    
    // Add current game failures to total
    gameState.failures = (gameState.failures || 0) + gameState.currentGameFailures;
    
    // Determine if game was completed (reached level 3 or higher)
    const wasCompleted = gameState.level >= 3;
    if (wasCompleted) {
        gameState.completedGames = (gameState.completedGames || 0) + 1;
    } else {
        gameState.failedGames = (gameState.failedGames || 0) + 1;
    }
    
    // Save game history
    if (!gameState.gameHistory) {
        gameState.gameHistory = [];
    }
    gameState.gameHistory.push({
        score: gameState.score,
        level: gameState.level,
        time: gameState.timeElapsed,
        failures: gameState.currentGameFailures,
        completed: wasCompleted,
        date: new Date().toISOString()
    });
    
    // Keep only last 10 games for history
    if (gameState.gameHistory.length > 10) {
        gameState.gameHistory = gameState.gameHistory.slice(-10);
    }
    
    playGameOverSound();
    stopTimer();
    
    // Calculate accuracy based on completed games vs total games
    const accuracy = gameState.gamesPlayed > 0 ? 
        Math.round((gameState.completedGames / gameState.gamesPlayed) * 100) : 0;
    
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalLevel').textContent = gameState.level;
    document.getElementById('finalAccuracy').textContent = accuracy + '%';
    document.getElementById('finalTime').textContent = formatTime(gameState.timeElapsed);
    
    // Set title based on performance
    const title = document.getElementById('gameOverTitle');
    if (gameState.score >= 1000) {
        title.textContent = '🏆 Legendary Performance!';
    } else if (gameState.score >= 500) {
        title.textContent = '⭐ Excellent Work!';
    } else if (gameState.score >= 200) {
        title.textContent = '👍 Good Job!';
    } else {
        title.textContent = 'Game Over';
    }
    
    // Show achievements
    showAchievements();
    
    // CRITICAL: Save stats immediately after game ends
    saveStats();
    
    // Log for debugging
    console.log('Game Over - Stats saved:', {
        gamesPlayed: gameState.gamesPlayed,
        score: gameState.score,
        level: gameState.level,
        failures: gameState.failures,
        correctPatterns: gameState.correctPatterns,
        totalPatterns: gameState.totalPatterns
    });
    
    showScreen('gameOverScreen');
}

function showAchievements() {
    const badgesContainer = document.getElementById('achievementBadges');
    badgesContainer.innerHTML = '';
    
    const badges = [];
    
    if (gameState.score >= 1000) badges.push('🏆 High Scorer');
    if (gameState.level >= 10) badges.push('📈 Level Master');
    if (gameState.correctPatterns === gameState.totalPatterns && gameState.totalPatterns > 0) badges.push('🎯 Perfect Accuracy');
    if (gameState.difficulty === 'extreme') badges.push('⚡ Extreme Player');
    if (gameState.timeElapsed < 60) badges.push('⚡ Speed Demon');
    
    badges.forEach(badge => {
        const badgeElement = document.createElement('div');
        badgeElement.className = 'achievement-badge';
        badgeElement.textContent = badge;
        badgesContainer.appendChild(badgeElement);
    });
}

// Game Controls
function pauseGame() {
    if (gameState.currentScreen !== 'gameScreen') return;
    
    gameState.isPaused = true;
    stopTimer();
    
    document.getElementById('pauseScore').textContent = gameState.score;
    document.getElementById('pauseLevel').textContent = gameState.level;
    
    showScreen('pauseScreen');
}

function resumeGame() {
    gameState.isPaused = false;
    showScreen('gameScreen');
    startTimer();
}

function restartGame() {
    // Don't double count - stats are already saved in gameOver()
    // Just start a new game
    startGame(gameState.difficulty);
}

function backToMenu() {
    stopTimer();
    gameState.isPaused = false;
    
    // If user is leaving an active game, save it as a completed game
    if (gameState.currentScreen === 'gameScreen' && gameState.score > 0) {
        // This is a game in progress, save it as completed
        gameState.gamesPlayed = (gameState.gamesPlayed || 0) + 1;
        gameState.totalScore = (gameState.totalScore || 0) + gameState.score;
        
        // Update high score
        if (gameState.score > (gameState.highScore || 0)) {
            gameState.highScore = gameState.score;
        }
        
        // Mark as completed if reached level 3+
        const wasCompleted = gameState.level >= 3;
        if (wasCompleted) {
            gameState.completedGames = (gameState.completedGames || 0) + 1;
        } else {
            gameState.failedGames = (gameState.failedGames || 0) + 1;
        }
        
        // Save game history
        if (!gameState.gameHistory) {
            gameState.gameHistory = [];
        }
        gameState.gameHistory.push({
            score: gameState.score,
            level: gameState.level,
            time: gameState.timeElapsed,
            failures: gameState.currentGameFailures,
            completed: wasCompleted,
            date: new Date().toISOString()
        });
        
        // Keep only last 10 games
        if (gameState.gameHistory.length > 10) {
            gameState.gameHistory = gameState.gameHistory.slice(-10);
        }
        
        // Add failures to total
        gameState.failures = (gameState.failures || 0) + gameState.currentGameFailures;
        
        console.log('Saving game progress on menu exit:', {
            gamesPlayed: gameState.gamesPlayed,
            score: gameState.score,
            level: gameState.level,
            highScore: gameState.highScore
        });
    }
    
    // Save stats before going to menu
    saveStats();
    showScreen('menuScreen');
    // Reload stats to ensure we have latest data
    loadStats();
    updateMenuStats();
}

function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    document.getElementById('soundIcon').textContent = gameState.soundEnabled ? '🔊' : '🔇';
    
    if (gameState.soundEnabled) {
        playClickSound();
    }
}

// Display Updates
function updateDisplay() {
    document.getElementById('currentLevel').textContent = gameState.level;
    document.getElementById('currentScore').textContent = gameState.score;
    updateLivesDisplay();
}

function updateLivesDisplay() {
    const container = document.getElementById('livesContainer');
    container.innerHTML = '';
    
    for (let i = 0; i < 3; i++) {
        const life = document.createElement('span');
        life.className = 'life';
        life.textContent = '❤️';
        
        if (i >= gameState.lives) {
            life.classList.add('lost');
        }
        
        container.appendChild(life);
    }
}

function updatePhaseIndicator(text) {
    document.querySelector('.phase-text').textContent = text;
}

function updateProgressBar(duration) {
    const progressFill = document.getElementById('progressFill');
    progressFill.style.transition = `width ${duration}ms linear`;
    progressFill.style.width = '100%';
    
    setTimeout(() => {
        progressFill.style.transition = 'none';
        progressFill.style.width = '0%';
    }, 100);
}

// Timer Functions
function startTimer() {
    gameState.timerInterval = setInterval(() => {
        gameState.timeElapsed++;
        document.getElementById('timer').textContent = formatTime(gameState.timeElapsed);
    }, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Stats Management
function updateMenuStats() {
    // First reload stats to ensure we have latest data
    loadStats();
    
    // Ensure values are numbers, not undefined
    const highScore = Number(gameState.highScore) || 0;
    const gamesPlayed = Number(gameState.gamesPlayed) || 0;
    const totalFailures = Number(gameState.failures) || 0;
    const completedGames = Number(gameState.completedGames) || 0;
    const failedGames = Number(gameState.failedGames) || 0;
    
    // Update menu stats
    const menuHighScoreEl = document.getElementById('menuHighScore');
    const menuGamesPlayedEl = document.getElementById('menuGamesPlayed');
    const menuAccuracyEl = document.getElementById('menuAccuracy');
    
    if (menuHighScoreEl) menuHighScoreEl.textContent = highScore;
    if (menuGamesPlayedEl) menuGamesPlayedEl.textContent = gamesPlayed;
    
    // Calculate accuracy based on completed games vs total attempts
    let accuracy = 0;
    if (gamesPlayed > 0) {
        // Use completedGames directly or calculate from history
        const actualCompleted = completedGames > 0 ? completedGames : 
            (gameState.gameHistory ? gameState.gameHistory.filter(g => (g.level >= 3 || g.completed === true)).length : 0);
        accuracy = Math.round((actualCompleted / gamesPlayed) * 100);
    }
    if (menuAccuracyEl) menuAccuracyEl.textContent = accuracy + '%';
    
    // Update detailed stats
    const bestTime = (gameState.bestTime === Infinity || gameState.bestTime === null || isNaN(gameState.bestTime)) ? null : Number(gameState.bestTime);
    const bestTimeEl = document.getElementById('bestTimeDisplay');
    if (bestTimeEl) {
        bestTimeEl.textContent = bestTime ? bestTime.toFixed(2) + 's' : '--';
    }
    
    const totalFailuresEl = document.getElementById('totalFailuresDisplay');
    if (totalFailuresEl) {
        totalFailuresEl.textContent = totalFailures;
    }
    
    // Success rate based on pattern accuracy
    const totalPatterns = Number(gameState.totalPatterns) || 0;
    const correctPatterns = Number(gameState.correctPatterns) || 0;
    const successRate = totalPatterns > 0 ? 
        Math.round((correctPatterns / totalPatterns) * 100) : 0;
    const successRateEl = document.getElementById('successRateDisplay');
    if (successRateEl) {
        successRateEl.textContent = successRate + '%';
    }
    
    // Average score
    const totalScore = Number(gameState.totalScore) || 0;
    const avgScore = gamesPlayed > 0 ? 
        Math.round(totalScore / gamesPlayed) : 0;
    const avgScoreEl = document.getElementById('avgScoreDisplay');
    if (avgScoreEl) {
        avgScoreEl.textContent = avgScore;
    }
    
    // Update charts
    updateCharts();
    
    // Update insights (real-time)
    updateInsights();
}

function saveStats() {
    try {
        const statsToSave = {
            highScore: Number(gameState.highScore) || 0,
            gamesPlayed: Number(gameState.gamesPlayed) || 0,
            totalScore: Number(gameState.totalScore) || 0,
            correctPatterns: Number(gameState.correctPatterns) || 0,
            totalPatterns: Number(gameState.totalPatterns) || 0,
            failures: Number(gameState.failures) || 0,
            bestTime: gameState.bestTime === Infinity || gameState.bestTime === null ? null : Number(gameState.bestTime),
            gameHistory: gameState.gameHistory || [],
            completedGames: Number(gameState.completedGames) || 0,
            failedGames: Number(gameState.failedGames) || 0
        };
        localStorage.setItem('memoryMatrixStats', JSON.stringify(statsToSave));
        console.log('Stats saved:', statsToSave);
    } catch (e) {
        console.error('Error saving stats:', e);
    }
}

function loadStats() {
    const saved = localStorage.getItem('memoryMatrixStats');
    if (saved) {
        try {
            const stats = JSON.parse(saved);
            gameState.highScore = Number(stats.highScore) || 0;
            gameState.gamesPlayed = Number(stats.gamesPlayed) || 0;
            gameState.totalScore = Number(stats.totalScore) || 0;
            gameState.correctPatterns = Number(stats.correctPatterns) || 0;
            gameState.totalPatterns = Number(stats.totalPatterns) || 0;
            gameState.failures = Number(stats.failures) || 0;
            gameState.bestTime = stats.bestTime !== null && stats.bestTime !== undefined ? Number(stats.bestTime) : Infinity;
            gameState.gameHistory = stats.gameHistory || [];
            gameState.completedGames = Number(stats.completedGames) || 0;
            gameState.failedGames = Number(stats.failedGames) || 0;
            
            // Recalculate completed/failed games from history if needed
            if (gameState.gameHistory.length > 0) {
                gameState.completedGames = gameState.gameHistory.filter(g => g.level >= 3 || g.completed === true).length;
                gameState.failedGames = gameState.gameHistory.filter(g => g.level < 3 && g.completed !== true).length;
            }
        } catch (e) {
            console.error('Error loading stats:', e);
        }
    }
}

// Keyboard Controls
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (gameState.currentScreen === 'gameScreen') {
            pauseGame();
        } else if (gameState.currentScreen === 'pauseScreen') {
            resumeGame();
        }
    }
    
    if (e.key === ' ' && gameState.currentScreen === 'gameScreen') {
        e.preventDefault();
        const startBtn = document.getElementById('startPatternBtn');
        if (startBtn.style.display !== 'none') {
            startPattern();
        }
    }
});

// Three.js 3D Background
let scene, camera, renderer, particles, geometricShapes;
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;

function initThreeJS() {
    const container = document.getElementById('threejs-bg');
    
    // Scene setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.0008);
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x0a0a0a, 1);
    container.appendChild(renderer.domElement);
    
    // Create particle system
    createParticles();
    
    // Create geometric shapes
    createGeometricShapes();
    
    // Add lights
    setupLights();
    
    // Handle mouse movement
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('touchmove', onTouchMove);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Start animation
    animate();
}

function onMouseMove(event) {
    mouseX = (event.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
    mouseY = (event.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
}

function onTouchMove(event) {
    if (event.touches.length > 0) {
        mouseX = (event.touches[0].clientX - window.innerWidth / 2) / (window.innerWidth / 2);
        mouseY = (event.touches[0].clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    }
}

function setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);
    
    // Multiple colored point lights
    const colors = [0xff006e, 0xfb5607, 0xffbe0b, 0x8338ec, 0x3a86ff];
    
    colors.forEach((color, index) => {
        const light = new THREE.PointLight(color, 1.5, 50);
        light.position.set(
            Math.cos(index * Math.PI * 2 / colors.length) * 20,
            Math.sin(index * Math.PI * 2 / colors.length) * 20,
            10
        );
        scene.add(light);
    });
}

function createParticles() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];
    
    const particleCount = 2000;
    
    for (let i = 0; i < particleCount; i++) {
        vertices.push(
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 30
        );
        
        // Gen-Z color palette
        const colorChoices = [
            new THREE.Color(0xff006e), // Hot pink
            new THREE.Color(0xfb5607), // Orange
            new THREE.Color(0xffbe0b), // Yellow
            new THREE.Color(0x8338ec), // Purple
            new THREE.Color(0x3a86ff), // Blue
            new THREE.Color(0x06ffa5)  // Cyan
        ];
        
        const color = colorChoices[Math.floor(Math.random() * colorChoices.length)];
        colors.push(color.r, color.g, color.b);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true
    });
    
    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

function createGeometricShapes() {
    geometricShapes = [];
    
    // Create floating geometric shapes
    const shapeTypes = ['tetrahedron', 'octahedron', 'icosahedron'];
    const colors = [0xff006e, 0xfb5607, 0xffbe0b, 0x8338ec, 0x3a86ff];
    
    for (let i = 0; i < 15; i++) {
        let geometry;
        const shapeType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
        
        switch(shapeType) {
            case 'tetrahedron':
                geometry = new THREE.TetrahedronGeometry(Math.random() * 0.5 + 0.2);
                break;
            case 'octahedron':
                geometry = new THREE.OctahedronGeometry(Math.random() * 0.4 + 0.2);
                break;
            case 'icosahedron':
                geometry = new THREE.IcosahedronGeometry(Math.random() * 0.3 + 0.2);
                break;
        }
        
        const material = new THREE.MeshPhongMaterial({
            color: colors[Math.floor(Math.random() * colors.length)],
            emissive: colors[Math.floor(Math.random() * colors.length)],
            emissiveIntensity: 0.2,
            shininess: 100,
            transparent: true,
            opacity: 0.7
        });
        
        const shape = new THREE.Mesh(geometry, material);
        shape.position.set(
            (Math.random() - 0.5) * 25,
            (Math.random() - 0.5) * 25,
            (Math.random() - 0.5) * 15
        );
        
        shape.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        shape.userData = {
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.02,
                y: (Math.random() - 0.5) * 0.02,
                z: (Math.random() - 0.5) * 0.02
            },
            floatSpeed: Math.random() * 0.01 + 0.005,
            floatOffset: Math.random() * Math.PI * 2
        };
        
        geometricShapes.push(shape);
        scene.add(shape);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    const time = Date.now() * 0.001;
    
    // Smooth mouse following
    targetX += (mouseX - targetX) * 0.05;
    targetY += (mouseY - targetY) * 0.05;
    
    // Camera movement based on mouse
    camera.position.x = targetX * 3;
    camera.position.y = targetY * 3;
    camera.lookAt(scene.position);
    
    // Rotate particles
    if (particles) {
        particles.rotation.x += 0.0005;
        particles.rotation.y += 0.001;
        particles.position.x = Math.sin(time * 0.1) * 2;
        particles.position.y = Math.cos(time * 0.15) * 2;
    }
    
    // Animate geometric shapes
    geometricShapes.forEach((shape, index) => {
        // Rotation
        shape.rotation.x += shape.userData.rotationSpeed.x;
        shape.rotation.y += shape.userData.rotationSpeed.y;
        shape.rotation.z += shape.userData.rotationSpeed.z;
        
        // Floating motion
        shape.position.y += Math.sin(time * shape.userData.floatSpeed + shape.userData.floatOffset) * 0.02;
        shape.position.x += Math.cos(time * shape.userData.floatSpeed * 0.7 + shape.userData.floatOffset) * 0.01;
        
        // Mouse interaction
        const distance = shape.position.distanceTo(camera.position);
        if (distance < 10) {
            shape.scale.setScalar(1 + (10 - distance) * 0.05);
        } else {
            shape.scale.setScalar(1);
        }
    });
    
    renderer.render(scene, camera);
}

// Chart Management
let gameStatsChart = null;

function updateCharts() {
    // Destroy existing chart if it exists
    if (gameStatsChart) {
        gameStatsChart.destroy();
        gameStatsChart = null;
    }
    
    // Create Game Statistics Bar Chart with REAL data
    const statsCtx = document.getElementById('gameStatsChart');
    if (statsCtx) {
        const gamesPlayed = Number(gameState.gamesPlayed) || 0;
        const correctPatterns = Number(gameState.correctPatterns) || 0;
        const failures = Number(gameState.failures) || 0;
        const highScore = Number(gameState.highScore) || 0;
        
        // Use REAL values - normalize high score for better visualization
        const maxValue = Math.max(gamesPlayed, correctPatterns, failures, highScore > 0 ? highScore / 100 : 0, 1);
        
        gameStatsChart = new Chart(statsCtx, {
            type: 'bar',
            data: {
                labels: ['Games Played', 'Patterns Completed', 'Total Failures', 'High Score (÷100)'],
                datasets: [{
                    label: 'Your Statistics',
                    data: [
                        gamesPlayed,
                        correctPatterns,
                        failures,
                        highScore > 0 ? Math.round(highScore / 100) : 0
                    ],
                    backgroundColor: [
                        'rgba(102, 126, 234, 0.8)',    // Blue for games
                        'rgba(39, 174, 96, 0.8)',      // Green for patterns
                        'rgba(231, 76, 60, 0.8)',      // Red for failures
                        'rgba(255, 193, 7, 0.8)'       // Yellow for high score
                    ],
                    borderColor: [
                        'rgba(102, 126, 234, 1)',
                        'rgba(39, 174, 96, 1)',
                        'rgba(231, 76, 60, 1)',
                        'rgba(255, 193, 7, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const labels = ['Games Played', 'Patterns Completed', 'Total Failures', 'High Score'];
                                const values = [
                                    gamesPlayed,
                                    correctPatterns,
                                    failures,
                                    highScore
                                ];
                                const displayValues = [
                                    gamesPlayed,
                                    correctPatterns,
                                    failures,
                                    highScore > 0 ? highScore + ' pts' : '0 pts'
                                ];
                                return labels[context.dataIndex] + ': ' + displayValues[context.dataIndex];
                            }
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255, 0, 110, 1)',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }
}

function updateInsights() {
    const insightCard = document.getElementById('insightCard');
    if (!insightCard) {
        return;
    }
    
    // Reload stats to get latest data
    loadStats();
    
    const gamesPlayed = Number(gameState.gamesPlayed) || 0;
    const totalPatterns = Number(gameState.totalPatterns) || 0;
    const correctPatterns = Number(gameState.correctPatterns) || 0;
    const totalFailures = Number(gameState.failures) || 0;
    const completedGames = Number(gameState.completedGames) || 0;
    const failedGames = Number(gameState.failedGames) || 0;
    const highScore = Number(gameState.highScore) || 0;
    const avgScore = gamesPlayed > 0 ? Math.round((Number(gameState.totalScore) || 0) / gamesPlayed) : 0;
    const totalGames = gamesPlayed;
    const bestTime = (gameState.bestTime === Infinity || gameState.bestTime === null || isNaN(gameState.bestTime)) ? null : Number(gameState.bestTime);
    
    // Get last game details
    const lastGame = gameState.gameHistory && gameState.gameHistory.length > 0 ? 
        gameState.gameHistory[gameState.gameHistory.length - 1] : null;
    
    if (gamesPlayed === 0) {
        insightCard.innerHTML = '<p class="insight-text">🎮 Play your first game to see your performance insights!</p>';
        return;
    }
    
    // Calculate metrics
    const accuracy = totalPatterns > 0 ? 
        Math.round((correctPatterns / totalPatterns) * 100) : 0;
    const completionRate = totalGames > 0 ? Math.round((completedGames / totalGames) * 100) : 0;
    
    // Build insights based on ACTUAL performance data
    let html = '';
    
    // Main performance assessment based on HIGH SCORE
    if (highScore >= 1000) {
        html += '<h5 class="insight-main">🏆 Exceptional Performer!</h5>';
        html += '<div class="insight-list">';
        html += `<p class="insight-text"><strong>High Score:</strong> ${highScore} points - Outstanding achievement! Your memory skills are exceptional.</p>`;
    } else if (highScore >= 500) {
        html += '<h5 class="insight-main">⭐ Great Performance!</h5>';
        html += '<div class="insight-list">';
        html += `<p class="insight-text"><strong>High Score:</strong> ${highScore} points - Excellent memory and pattern recognition skills!</p>`;
    } else if (highScore >= 200) {
        html += '<h5 class="insight-main">👍 Good Progress!</h5>';
        html += '<div class="insight-list">';
        html += `<p class="insight-text"><strong>High Score:</strong> ${highScore} points - You're building strong memory skills!</p>`;
    } else if (highScore > 0) {
        html += '<h5 class="insight-main">🌱 Getting Started!</h5>';
        html += '<div class="insight-list">';
        html += `<p class="insight-text"><strong>High Score:</strong> ${highScore} points - Keep practicing to improve your memory!</p>`;
    } else {
        html += '<h5 class="insight-main">🎮 Start Your Journey!</h5>';
        html += '<div class="insight-list">';
        html += '<p class="insight-text">Complete a game to see your performance insights!</p>';
    }
    
    // Add detailed stats
    if (gamesPlayed > 0) {
        html += `<p class="insight-text"><strong>📊 Games Played:</strong> ${gamesPlayed} ${gamesPlayed === 1 ? 'game' : 'games'}</p>`;
        
        if (completedGames > 0 || failedGames > 0) {
            html += `<p class="insight-text"><strong>✅ Completed:</strong> ${completedGames} game(s) | <strong>⚠️ Failed:</strong> ${failedGames} game(s)</p>`;
        }
        
        if (avgScore > 0) {
            html += `<p class="insight-text"><strong>📈 Average Score:</strong> ${avgScore} points per game</p>`;
        }
        
        if (correctPatterns > 0) {
            html += `<p class="insight-text"><strong>🧩 Patterns Completed:</strong> ${correctPatterns} successful pattern(s)</p>`;
        }
        
        if (totalFailures > 0) {
            html += `<p class="insight-text"><strong>❌ Total Failures:</strong> ${totalFailures} - Each mistake is a learning opportunity!</p>`;
        }
        
        if (accuracy > 0) {
            html += `<p class="insight-text"><strong>🎯 Pattern Accuracy:</strong> ${accuracy}% - ${accuracy >= 70 ? 'Excellent!' : accuracy >= 50 ? 'Good!' : 'Keep practicing!'}</p>`;
        }
        
        if (completionRate > 0) {
            html += `<p class="insight-text"><strong>🏁 Completion Rate:</strong> ${completionRate}% - ${completionRate >= 70 ? 'Outstanding consistency!' : completionRate >= 50 ? 'Good progress!' : 'Room for improvement!'}</p>`;
        }
        
        if (bestTime && bestTime > 0) {
            html += `<p class="insight-text"><strong>⚡ Best Time:</strong> ${bestTime.toFixed(2)}s - ${bestTime < 5 ? 'Lightning fast!' : bestTime < 10 ? 'Very quick!' : 'Good speed!'}</p>`;
        }
        
        // Last game details
        if (lastGame) {
            html += `<p class="insight-text"><strong>🎮 Last Game:</strong> Reached Level ${lastGame.level}, Score: ${lastGame.score} points`;
            if (lastGame.completed) {
                html += ' ✅ Completed!';
            }
            html += '</p>';
        }
    }
    
    html += '</div>';
    
    // Personalized tip based on ACTUAL performance
    let recommendation = '';
    if (gamesPlayed === 1) {
        recommendation = '💡 Tip: Play more games to build consistent performance. Practice makes perfect!';
    } else if (highScore < 200) {
        recommendation = '💡 Tip: Focus on accuracy and reaching higher levels to improve your high score!';
    } else if (completionRate < 50) {
        recommendation = '💡 Tip: Try to complete more games (reach level 3+) to improve your completion rate!';
    } else if (accuracy < 70) {
        recommendation = '💡 Tip: Take your time observing patterns carefully to improve accuracy!';
    } else {
        recommendation = '💡 Tip: Excellent performance! Try harder difficulty levels for a greater challenge!';
    }
    
    html += `<p class="insight-recommendation">${recommendation}</p>`;
    
    insightCard.innerHTML = html;
}

// Initialize on load
window.onload = function() {
    initThreeJS();
    // Load stats first
    loadStats();
    // Then update menu to show stats
    updateMenuStats();
    showScreen('menuScreen');
    
    // Save stats periodically as backup
    setInterval(() => {
        saveStats();
    }, 30000); // Save every 30 seconds
};
