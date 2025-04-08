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
let isGameStarted = false;
let startTime;
let timerInterval;
const foundWords = new Set();

// Palavras e suas posições
const words = {
    "VOLATIL": [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]],
    "PRIMARIAS": [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8]],
    "SECUNDARIAS": [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8], [2, 9], [2, 10]],
    "SCANNER": [[3, 0], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6]],
    "TECLADO": [[4, 0], [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6]],
    "WIRELESS": [[5, 0], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [5, 7]],
    "OCULOS": [[6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5]],
    "CPU": [[7, 0], [7, 1], [7, 2]],
    "ULA": [[8, 0], [8, 1], [8, 2]],
    "UNIDADEDECONTROLE": [[17, 0], [17, 1], [17, 2], [17, 3], [17, 4], [17, 5], [17, 6], [17, 7], [17, 8], [17, 9], [17, 10], [17, 11], [17, 12], [17, 13], [17, 14], [17, 15]],
    "REGISTRADORES": [[19, 0], [19, 1], [19, 2], [19, 3], [19, 4], [19, 5], [19, 6], [19, 7], [19, 8], [19, 9], [19, 10], [19, 11]],
    "PARALELA": [[17, 0], [17, 1], [17, 2], [17, 3], [17, 4], [17, 5], [17, 6], [17, 7]],
    "BALISTICOS": [[13, 0], [13, 1], [13, 2], [13, 3], [13, 4], [13, 5], [13, 6], [13, 7], [13, 8], [13, 9]],
    "EDVAC": [[13, 0], [13, 1], [13, 2], [13, 3], [13, 4]]
};

// Efeitos sonoros do Kahoot
const sounds = {
    correct: new Audio('https://cdn.kahoot.it/build/assets/sounds/correct.mp3'),
    wrong: new Audio('https://cdn.kahoot.it/build/assets/sounds/wrong.mp3'),
    complete: new Audio('https://cdn.kahoot.it/build/assets/sounds/complete.mp3')
};

// Inicialização do grid
function initializeGrid() {
    const gridElement = document.getElementById('grid');
    gridElement.innerHTML = '';
    grid = [];
    selectedCells = [];
    foundWords.clear();

    const gridLetters = [
        "MBXGGJWTKPXYXWDPXYQG",
        "OHSFIRNZNJIFTSFSOPIV",
        "UCMCPUBDBUDGWOBEWNBS",
        "EPUCVKVDFONBGNKCFJOS",
        "BKOLGYCELNUKYBSVUZID",
        "FANHOWETHLKIPYANSJUR",
        "ECLUASJTRYVACDADDJHZ",
        "WXCIKZBZNEPUUVMASLWS",
        "MIVMSTXLUXDANOGREWSC",
        "JMQSBTWOSOHMVLLIYGOA",
        "XRKAAWITHUYYVAAUECAN",
        "UPZGWECTCPVXHQCPSZXT",
        "XQDELUDAOXEVTIBEYXSB",
        "HZYELDURCSTMELWRHDXR",
        "YRRFFPKHDUITYCDHNTRO",
        "RIRHFHUCRBGALKDWVYQP",
        "WIFDQTDACPCMAALVTYVP",
        "CUNIDADEDECOPARALELA",
        "HSMJKRYREGISTRADORES",
        "WDSVQDXJXPFBESFYCIAV"
    ];

    // Criar grid 20x20
    for (let i = 0; i < 20; i++) {
        grid[i] = [];
        for (let j = 0; j < 20; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.textContent = gridLetters[i][j];
            grid[i][j] = cell;
            gridElement.appendChild(cell);
        }
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
    if (!cell || selectedCells.includes(cell)) return;

    const lastCell = selectedCells[selectedCells.length - 1];
    const lastRow = parseInt(lastCell.dataset.row);
    const lastCol = parseInt(lastCell.dataset.col);
    const currentRow = parseInt(cell.dataset.row);
    const currentCol = parseInt(cell.dataset.col);

    if (isAdjacent(lastRow, lastCol, currentRow, currentCol)) {
        selectedCells.push(cell);
        cell.classList.add('selected');
    }
}

function endSelection() {
    if (!isGameStarted || selectedCells.length === 0) return;

    const selectedWord = selectedCells.map(cell => cell.textContent).join('');
    checkWord(selectedWord);

    selectedCells.forEach(cell => cell.classList.remove('selected'));
    selectedCells = [];
}

// Funções auxiliares
function isAdjacent(row1, col1, row2, col2) {
    return Math.abs(row1 - row2) <= 1 && Math.abs(col1 - col2) <= 1;
}

function checkWord(word) {
    const wordElement = document.querySelector(`.word-item[data-word="${word}"]`);
    if (wordElement && !foundWords.has(word)) {
        foundWords.add(word);
        wordElement.classList.add('found');
        selectedCells.forEach(cell => cell.classList.add('found'));

        if (foundWords.size === Object.keys(words).length) {
            endGame();
        }
    } else {
        selectedCells.forEach(cell => {
            cell.classList.add('wrong');
            setTimeout(() => cell.classList.remove('wrong'), 500);
        });
    }
}

// Funções de controle do jogo
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
}

function resetGame() {
    isGameStarted = false;
    clearInterval(timerInterval);
    document.querySelector('.kahoot-timer').textContent = 'Tempo: 00:00';

    document.getElementById('startButton').disabled = false;
    document.getElementById('resetButton').disabled = true;
    document.getElementById('checkButton').disabled = true;

    initializeGrid();
}

function endGame() {
    isGameStarted = false;
    clearInterval(timerInterval);
    const completionTime = document.querySelector('.kahoot-timer').textContent;

    const studentName = document.getElementById('studentName').value.trim();
    const score = {
        name: studentName,
        time: completionTime,
        date: new Date().toISOString()
    };

    // Salvar no Firebase
    database.ref('scores').push(score);

    // Mostrar mensagem de conclusão
    document.getElementById('completionTime').textContent = completionTime;
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('completionMessage').style.display = 'block';
}

function closeCompletionMessage() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('completionMessage').style.display = 'none';
}

// Timer
function updateTimer() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    document.querySelector('.kahoot-timer').textContent =
        `Tempo: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Ranking
function updateRanking() {
    const rankingList = document.getElementById('rankingList');
    rankingList.innerHTML = '';

    database.ref('scores')
        .orderByChild('date')
        .limitToLast(10)
        .once('value')
        .then(snapshot => {
            const scores = [];
            snapshot.forEach(childSnapshot => {
                scores.push(childSnapshot.val());
            });

            scores.sort((a, b) => {
                const timeA = a.time.split(':').map(Number);
                const timeB = b.time.split(':').map(Number);
                return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
            });

            scores.forEach((score, index) => {
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

// QR Code
function generateQRCode() {
    const qrCode = document.getElementById('qrCode');
    new QRCode(qrCode, {
        text: window.location.href,
        width: 200,
        height: 200,
        colorDark: '#46178f',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeGrid();
    generateQRCode();
    updateRanking();
});

document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('resetButton').addEventListener('click', resetGame);
document.getElementById('checkButton').addEventListener('click', () => {
    const selectedWord = selectedCells.map(cell => cell.textContent).join('');
    checkWord(selectedWord);
}); 