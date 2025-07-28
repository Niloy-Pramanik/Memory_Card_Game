(() => {
  'use strict';

  // Emoji pairs (8 pairs = 16 cards)
  const emojiPairs = [
    '🍎','🍎','🍌','🍌','🍇','🍇','🍒','🍒',
    '🍉','🍉','🥝','🥝','🍓','🍓','🥭','🥭'
  ];

  // DOM Elements
  const gameBoard = document.getElementById('game-board');
  const movesCountElem = document.getElementById('movesCount');
  const timerElem = document.getElementById('timer');
  const resetBtn = document.getElementById('resetBtn');
  const themeToggleBtn = document.getElementById('themeToggle');
  const victoryModal = document.getElementById('victoryModal');
  const victoryTitle = document.getElementById('victoryTitle');
  const victoryDesc = document.getElementById('victoryDesc');
  const playAgainBtn = document.getElementById('playAgainBtn');
  const confettiCanvas = document.getElementById('confetti');
  const player1box = document.getElementById('player1box');
  const player2box = document.getElementById('player2box');
  const score1Elem = document.getElementById('score1');
  const score2Elem = document.getElementById('score2');

  // Sounds
  const flipSound = document.getElementById('flipSound');
  const matchSound = document.getElementById('matchSound');
  const failSound = document.getElementById('failSound');

  // Game state
  let cards = [];
  let flippedCards = [];
  let matchedCount = 0;
  let moves = 0;
  let timerInterval = null;
  let secondsElapsed = 0;
  let canFlip = true;
  let turn = 0; // 0 = Player 1, 1 = Player 2
  let scores = [0,0];

  // Utility
  const shuffle = arr => {
    for(let i=arr.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]] = [arr[j],arr[i]];
    }
    return arr;
  };
  const formatTime = secs => `${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`;
  function updateMoveTimer() {
    movesCountElem.textContent = moves;
    timerElem.textContent = formatTime(secondsElapsed);
  }
  function updateScores() {
    score1Elem.textContent = scores[0];
    score2Elem.textContent = scores[1];
  }
  function resetTimer() {
    clearInterval(timerInterval); timerInterval = null; secondsElapsed = 0; updateMoveTimer();
  }
  function startTimer() {
    if(!timerInterval){
      timerInterval = setInterval(()=>{
        secondsElapsed++; updateMoveTimer();
      },1000);
    }
  }
  function setActivePlayer() {
    player1box.classList.toggle('active', turn===0);
    player2box.classList.toggle('active', turn===1);
  }
  // Initialize board
  function initBoard() {
    gameBoard.innerHTML = '';
    matchedCount = 0;
    moves = 0; scores = [0,0]; turn = 0;
    flippedCards = [];
    canFlip = true;
    resetTimer();
    updateScores();
    setActivePlayer();
    victoryModal.classList.add('hidden');
    victoryModal.classList.remove('active');
    clearConfetti();

    const deck = shuffle([...emojiPairs]);
    cards = [];
    deck.forEach((emoji,i) => {
      const card = document.createElement('button');
      card.classList.add('card');
      card.setAttribute('aria-label', 'Memory card');
      card.setAttribute('aria-pressed', 'false');
      card.setAttribute('type', 'button');
      card.dataset.emoji = emoji;
      card.innerHTML = `
        <div class="card-inner">
          <div class="card-front" aria-hidden="true">&#x1F0A0;</div>
          <div class="card-back" aria-hidden="true">${emoji}</div>
        </div>
      `;
      card.addEventListener('click', onCardClick);
      gameBoard.appendChild(card);
      cards.push(card);
    });
    updateMoveTimer();
  }
  
  function playSound(audioEl) {
    try {
      audioEl.pause();
      audioEl.currentTime = 0;
      audioEl.play().catch(()=>{});
    } catch(e) {}
  }
  
  function onCardClick(e) {
    if (!canFlip) return;
    const card = e.currentTarget;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

    playSound(flipSound);

    card.classList.add('flipped');
    card.setAttribute('aria-pressed', 'true');
    flippedCards.push(card);

    if (flippedCards.length === 1) {
      startTimer();
    }

    if (flippedCards.length === 2) {
      canFlip = false;
      moves++;
      updateMoveTimer();
      checkForMatch();
    }
  }
  function checkForMatch() {
    const [c1, c2] = flippedCards;
    if (c1.dataset.emoji === c2.dataset.emoji) {
      setTimeout(() => {
        playSound(matchSound);
        c1.classList.add('matched');
        c2.classList.add('matched');
        matchedCount++;
        scores[turn]++;
        updateScores();
        flippedCards = [];
        canFlip = true;
        setActivePlayer();
        if (matchedCount === emojiPairs.length / 2) {
          setTimeout(endGame, 650);
        }
        // Player stays on turn if they match
      }, 600);
    } else {
      setTimeout(() => {
        playSound(failSound);
        flippedCards.forEach(card => {
          card.classList.remove('flipped');
          card.setAttribute('aria-pressed', 'false');
        });
        flippedCards = [];
        // Switch player turn if no match
        turn = (turn + 1) % 2;
        setActivePlayer();
        canFlip = true;
      }, 950);
    }
  }

  function endGame() {
    clearInterval(timerInterval);
    timerInterval = null;
    let msg, desc;
    if (scores[0] > scores[1]) {
      msg = "🎉 Player 1 Wins!";
      player1box.classList.add('winner');
    } else if (scores[0] < scores[1]) {
      msg = "🎉 Player 2 Wins!";
      player2box.classList.add('winner');
    } else {
      msg = "🤝 It's a Tie!";
      player1box.classList.add('winner');
      player2box.classList.add('winner');
    }
    desc = `Player 1: ${scores[0]}<br>Player 2: ${scores[1]}<br>Moves: ${moves}<br>Time: ${formatTime(secondsElapsed)}`;
    victoryTitle.textContent = msg;
    victoryDesc.innerHTML = desc;
    victoryModal.classList.remove('hidden');
    victoryModal.classList.add('active');
    triggerConfetti();
  }

  playAgainBtn.addEventListener('click', () => {
    victoryModal.classList.remove('active'); victoryModal.classList.add('hidden');
    player1box.classList.remove('winner'); player2box.classList.remove('winner');
    resetGame();
  });

  victoryModal.addEventListener('click', e => {
    if (e.target === victoryModal) {
      victoryModal.classList.remove('active'); victoryModal.classList.add('hidden');
      player1box.classList.remove('winner'); player2box.classList.remove('winner');
      resetGame();
    }
  });
  victoryModal.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      victoryModal.classList.remove('active'); victoryModal.classList.add('hidden');
      player1box.classList.remove('winner'); player2box.classList.remove('winner');
      resetGame();
    }
  });

  resetBtn.addEventListener('click', () => {
    player1box.classList.remove('winner'); player2box.classList.remove('winner');
    resetGame();
  });

  function resetGame() {
    cards = [];
    flippedCards = [];
    matchedCount = 0;
    moves = 0;
    canFlip = true;
    turn = 0; scores = [0,0];
    resetTimer();
    updateScores();
    setActivePlayer();
    clearConfetti();
    initBoard();
  }

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    if (currentTheme === 'light') {
      document.body.setAttribute('data-theme', 'dark');
      themeToggleBtn.textContent = '☀️';
      themeToggleBtn.setAttribute('aria-pressed', 'true');
    } else {
      document.body.setAttribute('data-theme', 'light');
      themeToggleBtn.textContent = '🌙';
      themeToggleBtn.setAttribute('aria-pressed', 'false');
    }
  });

  // Confetti
  let confettiCtx, confettiPieces;
  function triggerConfetti() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    confettiCanvas.classList.remove('hidden');
    confettiCtx = confettiCanvas.getContext('2d');
    confettiPieces = [];
    const colors = ['#FFD700','#FF4500','#1E90FF','#32CD32','#FF69B4','#BA55D3'];
    for (let i = 0; i < 80; i++) {
      confettiPieces.push({
        x: Math.random() * confettiCanvas.width,
        y: Math.random() * -confettiCanvas.height,
        r: Math.random() * 7 + 7,
        d: Math.random() * 50 + 25,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.floor(Math.random() * 20) - 10,
        tiltAngleIncremental: Math.random() * 0.05 + 0.01,
        tiltAngle: 0,
        speedY: Math.random() * 3 + 2
      });
    }
    drawConfetti();
    setTimeout(clearConfetti, 6000);
  }
  function drawConfetti() {
    confettiCtx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
    confettiPieces.forEach((p) => {
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += p.speedY;
      p.tilt = Math.sin(p.tiltAngle) * 15;
      confettiCtx.beginPath();
      confettiCtx.lineWidth = p.r;
      confettiCtx.strokeStyle = p.color;
      confettiCtx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      confettiCtx.lineTo(p.x + p.tilt, p.y + p.r);
      confettiCtx.stroke();
    });
    confettiPieces = confettiPieces.filter(p => p.y < confettiCanvas.height + 30);
    if(confettiPieces.length){ requestAnimationFrame(drawConfetti); }
    else { clearConfetti(); }
  }
  function clearConfetti() {
    if(confettiCtx) confettiCtx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
    confettiCanvas.classList.add('hidden');
  }

  document.addEventListener('DOMContentLoaded', () => {
    initBoard();
  });
})();
