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
    timerInterval: null
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
    
    gameState.score += levelScore;
    gameState.correctPatterns++;
    gameState.totalPatterns++;
    
    playSuccessSound();
    updatePhaseIndicator('Excellent! Level Complete!');
    
    // Increase difficulty for next level
    gameState.level++;
    if (gameState.level % 3 === 0 && gameState.patternLength < gameState.gridSize * gameState.gridSize - 2) {
        gameState.patternLength++;
    }
    
    updateDisplay();
    
    setTimeout(() => {
        if (gameState.level % 5 === 0) {
            playLevelUpSound();
            updatePhaseIndicator(`Level ${gameState.level - 1} Complete! 🎉`);
        }
        
        document.getElementById('startPatternBtn').style.display = 'inline-block';
        updatePhaseIndicator('Ready for next level?');
    }, 2000);
}

function gameOver() {
    gameState.totalPatterns++;
    gameState.gamesPlayed++;
    gameState.totalScore += gameState.score;
    
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
    }
    
    playGameOverSound();
    stopTimer();
    
    const accuracy = gameState.totalPatterns > 0 ? 
        Math.round((gameState.correctPatterns / gameState.totalPatterns) * 100) : 0;
    
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
    
    saveStats();
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
    if (gameState.currentScreen === 'gameOverScreen') {
        gameState.gamesPlayed--;
        gameState.totalPatterns -= gameState.correctPatterns;
        gameState.totalScore -= gameState.score;
    }
    
    startGame(gameState.difficulty);
}

function backToMenu() {
    stopTimer();
    gameState.isPaused = false;
    showScreen('menuScreen');
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
    document.getElementById('menuHighScore').textContent = gameState.highScore;
    document.getElementById('menuGamesPlayed').textContent = gameState.gamesPlayed;
    
    const accuracy = gameState.totalPatterns > 0 ? 
        Math.round((gameState.correctPatterns / gameState.totalPatterns) * 100) : 0;
    document.getElementById('menuAccuracy').textContent = accuracy + '%';
}

function saveStats() {
    localStorage.setItem('memoryMatrixStats', JSON.stringify({
        highScore: gameState.highScore,
        gamesPlayed: gameState.gamesPlayed,
        totalScore: gameState.totalScore,
        correctPatterns: gameState.correctPatterns,
        totalPatterns: gameState.totalPatterns
    }));
}

function loadStats() {
    const saved = localStorage.getItem('memoryMatrixStats');
    if (saved) {
        const stats = JSON.parse(saved);
        gameState.highScore = stats.highScore || 0;
        gameState.gamesPlayed = stats.gamesPlayed || 0;
        gameState.totalScore = stats.totalScore || 0;
        gameState.correctPatterns = stats.correctPatterns || 0;
        gameState.totalPatterns = stats.totalPatterns || 0;
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

// Initialize on load
window.onload = function() {
    initThreeJS();
    loadStats();
    updateMenuStats();
    showScreen('menuScreen');
};
