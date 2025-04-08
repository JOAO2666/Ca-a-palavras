// Configuração do Firebase
const firebaseConfig = {
    apiKey: "sua-api-key",
    authDomain: "seu-auth-domain",
    projectId: "seu-project-id",
    storageBucket: "seu-storage-bucket",
    messagingSenderId: "seu-messaging-sender-id",
    appId: "seu-app-id"
};

// Inicialização do Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Variáveis globais
let grid = [];
let selectedCells = [];
let startTime;
let timerInterval;
let isGameStarted = false;
let foundWords = new Set();

// Palavras e suas posições
const words = {
    "MEMORIA": [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]],
    "RAM": [[1, 0], [1, 1], [1, 2]],
    "ROM": [[2, 0], [2, 1], [2, 2]],
    "SSD": [[3, 0], [3, 1], [3, 2]],
    "HD": [[4, 0], [4, 1]],
    "PENDRIVE": [[5, 0], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [5, 7]],
    "CD": [[6, 0], [6, 1]],
    "DVD": [[7, 0], [7, 1], [7, 2]],
    "BLURAY": [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5]],
    "FLOPPY": [[9, 0], [9, 1], [9, 2], [9, 3], [9, 4], [9, 5]]
};

// Inicialização do grid
function initializeGrid() {
    const gridElement = document.getElementById('grid');
    gridElement.innerHTML = '';
    grid = [];
    selectedCells = [];
    foundWords.clear();

    // Criar grid 15x15
    for (let i = 0; i < 15; i++) {
        grid[i] = [];
        for (let j = 0; j < 15; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.textContent = getRandomLetter();
            grid[i][j] = cell;
            gridElement.appendChild(cell);
        }
    }

    // Colocar palavras no grid
    for (const [word, positions] of Object.entries(words)) {
        positions.forEach(([row, col]) => {
            grid[row][col].textContent = word[col];
        });
    }

    // Adicionar eventos
    gridElement.addEventListener('mousedown', startSelection);
    gridElement.addEventListener('mousemove', updateSelection);
    gridElement.addEventListener('mouseup', endSelection);
}

// Funções de seleção
function startSelection(e) {
    if (!isGameStarted) return;
    const cell = e.target.closest('.cell');
    if (!cell) return;

    selectedCells = [cell];
    cell.classList.add('selected');
}

function updateSelection(e) {
    if (!isGameStarted || selectedCells.length === 0) return;

    const cell = e.target.closest('.cell');
    if (!cell) return;

    const lastCell = selectedCells[selectedCells.length - 1];
    const lastRow = parseInt(lastCell.dataset.row);
    const lastCol = parseInt(lastCell.dataset.col);
    const currentRow = parseInt(cell.dataset.row);
    const currentCol = parseInt(cell.dataset.col);

    // Verificar se a célula é adjacente
    if (Math.abs(currentRow - lastRow) <= 1 && Math.abs(currentCol - lastCol) <= 1) {
        if (!selectedCells.includes(cell)) {
            selectedCells.push(cell);
            cell.classList.add('selected');
        }
    }
}

function endSelection() {
    if (!isGameStarted || selectedCells.length === 0) return;

    const selectedWord = selectedCells.map(cell => cell.textContent).join('');
    checkWord(selectedWord);

    selectedCells.forEach(cell => cell.classList.remove('selected'));
    selectedCells = [];
}

// Verificação de palavras
function checkWord(word) {
    const wordElement = document.querySelector(`.word-item[data-word="${word}"]`);
    if (wordElement && !foundWords.has(word)) {
        foundWords.add(word);
        wordElement.classList.add('found');
        selectedCells.forEach(cell => cell.classList.add('found'));

        if (foundWords.size === Object.keys(words).length) {
            endGame();
        }
    }
}

// Controle do jogo
function startGame() {
    const studentName = document.getElementById('studentName').value.trim();
    if (!studentName) {
        alert('Por favor, digite seu nome!');
        return;
    }

    isGameStarted = true;
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);

    document.getElementById('startButton').disabled = true;
    document.getElementById('resetButton').disabled = false;
    document.getElementById('checkButton').disabled = false;

    initializeGrid();
    generateQRCode();
}

function resetGame() {
    isGameStarted = false;
    clearInterval(timerInterval);
    document.getElementById('timer').textContent = 'Tempo: 00:00';

    document.getElementById('startButton').disabled = false;
    document.getElementById('resetButton').disabled = true;
    document.getElementById('checkButton').disabled = true;

    document.querySelectorAll('.word-item').forEach(item => item.classList.remove('found'));
    document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('found'));
}

function endGame() {
    isGameStarted = false;
    clearInterval(timerInterval);
    const completionTime = document.getElementById('timer').textContent;

    const studentName = document.getElementById('studentName').value.trim();
    saveScore(studentName, completionTime);

    document.getElementById('completionTime').textContent = completionTime;
    document.getElementById('completionMessage').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

// Timer
function updateTimer() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    document.getElementById('timer').textContent =
        `Tempo: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// QR Code
function generateQRCode() {
    const qrCodeElement = document.getElementById('qrCode');
    qrCodeElement.innerHTML = '';
    new QRCode(qrCodeElement, {
        text: window.location.href,
        width: 200,
        height: 200
    });
}

// Firebase
function saveScore(name, time) {
    const scoresRef = database.ref('scores');
    scoresRef.push({
        name: name,
        time: time,
        date: new Date().toISOString()
    });
}

function updateRanking() {
    const scoresRef = database.ref('scores');
    scoresRef.orderByChild('time').limitToLast(10).on('value', (snapshot) => {
        const rankingList = document.getElementById('rankingList');
        rankingList.innerHTML = '';

        const scores = [];
        snapshot.forEach((childSnapshot) => {
            scores.push(childSnapshot.val());
        });

        scores.reverse().forEach((score, index) => {
            const li = document.createElement('li');
            li.className = 'ranking-item';
            li.innerHTML = `
                <span>${index + 1}. ${score.name}</span>
                <span>${score.time}</span>
            `;
            rankingList.appendChild(li);
        });
    });
}

// Utilitários
function getRandomLetter() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return letters[Math.floor(Math.random() * letters.length)];
}

function closeCompletionMessage() {
    document.getElementById('completionMessage').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

// Event Listeners
document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('resetButton').addEventListener('click', resetGame);
document.getElementById('checkButton').addEventListener('click', () => {
    const selectedWord = selectedCells.map(cell => cell.textContent).join('');
    checkWord(selectedWord);
});

// Inicialização
updateRanking();
initializeGrid();
generateQRCode(); 