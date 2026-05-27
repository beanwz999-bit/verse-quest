// Game Core State and Game Loop Management
const GameEngine = {
  activeVerse: null,
  gameMode: '', // 'scramble', 'bubble', 'blanks'
  words: [], // Array of original words from the verse text
  cleanedWords: [], // Array of lowercase, punctuation-cleaned words for matching
  currentWordIndex: 0,
  mistakesCount: 0,
  
  // Blanks Mode specific fields
  blankIndices: [], // Indices of words that are blanks
  nextBlankIndex: 0, // Index in blankIndices we are currently trying to fill
  
  // Bubble Mode specific fields
  bubbleSpawnInterval: null,
  bubbleAnimationId: null,
  activeBubbles: [],
  
  // Helper to clean punctuation from a word for easy matching
  cleanWord(word) {
    return word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "");
  },

  initGame(verse, mode) {
    this.activeVerse = verse;
    this.gameMode = mode;
    this.mistakesCount = 0;
    this.currentWordIndex = 0;
    this.isCompleted = false;
    
    // Clear any active bubble loops
    this.clearBubbleLoops();

    // Parse words from text
    // Replace double spaces/line breaks
    const cleanedText = verse.text.replace(/\s+/g, ' ');
    this.words = cleanedText.split(' ');
    
    // Append the verse reference as the final puzzle token (e.g., "(John 3:16)")
    this.words.push(`(${verse.ref})`);
    
    this.cleanedWords = this.words.map(w => this.cleanWord(w));

    if (mode === 'scramble') {
      this.setupScramble();
    } else if (mode === 'bubble') {
      this.setupBubblePop();
    } else if (mode === 'blanks') {
      this.setupBlanks();
    }

    // Encourage child with mascot speech!
    this.updateMascotSpeech("Let's memorize this together! Press the 🔊 button to hear it first.");
  },

  // --- SCRAMBLE MODE ---
  setupScramble() {
    // Renders the verse display box with empty slots
    const displayBox = document.getElementById('verse-display');
    displayBox.innerHTML = '';
    displayBox.className = 'verse-display-box';

    this.words.forEach((word, idx) => {
      const slot = document.createElement('span');
      slot.className = 'verse-word-slot empty';
      slot.id = `slot-${idx}`;
      slot.innerText = word; // kept for spacing, but color is hidden
      if (idx === this.words.length - 1) {
        slot.classList.add('reference-slot');
      }
      displayBox.appendChild(slot);
    });

    // Scramble the words
    let scrambled = this.words.map((word, idx) => ({
      text: word,
      originalIndex: idx
    }));

    // Fisher-Yates shuffle
    for (let i = scrambled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [scrambled[i], scrambled[j]] = [scrambled[j], scrambled[i]];
    }

    // Render scrambled tiles
    const scrambleZone = document.getElementById('scramble-zone');
    scrambleZone.innerHTML = '';
    scrambleZone.style.display = 'flex';
    document.getElementById('bubble-zone').style.display = 'none';
    document.getElementById('blanks-zone').style.display = 'none';

    scrambled.forEach((tileInfo, idx) => {
      const tile = document.createElement('button');
      tile.className = 'word-tile';
      tile.innerText = tileInfo.text;
      tile.dataset.originalIndex = tileInfo.originalIndex;
      
      tile.addEventListener('click', (e) => this.handleScrambleTileClick(tile, tileInfo.originalIndex));
      scrambleZone.appendChild(tile);
    });
  },

  handleScrambleTileClick(tileElement, originalIndex) {
    const expectedWord = this.cleanedWords[this.currentWordIndex];
    const clickedWord = this.cleanWord(tileElement.innerText);

    // Friendly matching: check if either the exact index aligns OR the text matches what we need
    if (clickedWord === expectedWord) {
      // Correct!
      AudioManager.playCorrect();
      
      // Reveal the word in the slot
      const slot = document.getElementById(`slot-${this.currentWordIndex}`);
      if (slot) {
        slot.className = 'verse-word-slot filled';
      }

      // Mark tile as correct and disable it
      tileElement.classList.add('correct');
      tileElement.disabled = true;

      this.currentWordIndex++;
      this.updateMascotSpeech(this.getRandomEncouragement());

      // Check if verse is fully completed
      if (this.currentWordIndex >= this.words.length) {
        this.completeVerse();
      }
    } else {
      // Wrong word clicked
      AudioManager.playWrong();
      tileElement.classList.add('wrong-shake');
      this.mistakesCount++;
      this.updateMascotSpeech("Oops! Try another word. You can do it!");

      // Remove shake animation after it plays
      setTimeout(() => {
        tileElement.classList.remove('wrong-shake');
      }, 300);
    }
  },

  // --- BUBBLE POP MODE ---
  setupBubblePop() {
    const displayBox = document.getElementById('verse-display');
    displayBox.innerHTML = '';
    displayBox.className = 'verse-display-box';

    // Renders empty slots
    this.words.forEach((word, idx) => {
      const slot = document.createElement('span');
      slot.className = 'verse-word-slot empty';
      slot.id = `slot-${idx}`;
      slot.innerText = word;
      if (idx === this.words.length - 1) {
        slot.classList.add('reference-slot');
      }
      displayBox.appendChild(slot);
    });

    const scrambleZone = document.getElementById('scramble-zone');
    scrambleZone.style.display = 'none';
    
    const bubbleZone = document.getElementById('bubble-zone');
    bubbleZone.style.display = 'block';
    
    const blanksZone = document.getElementById('blanks-zone');
    blanksZone.style.display = 'none';

    // Clear previous elements inside arena
    const bubbleArena = document.getElementById('bubble-arena');
    bubbleArena.innerHTML = '';
    this.activeBubbles = [];

    // Start Spawning Loop
    this.bubbleSpawnInterval = setInterval(() => {
      this.spawnBubble();
    }, 1800);

    // Launch Animation Frame loop
    this.animateBubbles();
  },

  spawnBubble() {
    if (this.currentWordIndex >= this.words.length) return;

    const arena = document.getElementById('bubble-arena');
    if (!arena) return;

    // Decide what word to place in the bubble
    let bubbleWord = '';
    let isCorrectWord = false;

    // 40% chance of spawning the actual next word, or if there are no bubbles on screen, make sure to spawn it
    const activeCorrectBubbles = this.activeBubbles.filter(b => b.isCorrect);
    if (Math.random() < 0.45 || activeCorrectBubbles.length === 0) {
      bubbleWord = this.words[this.currentWordIndex];
      isCorrectWord = true;
    } else {
      // Spawn some other random word from the verse
      const randomIdx = Math.floor(Math.random() * this.words.length);
      bubbleWord = this.words[randomIdx];
      isCorrectWord = (randomIdx === this.currentWordIndex);
    }

    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'bubble';
    bubbleEl.innerText = bubbleWord;

    // Adjust bubble dimensions and font sizing to handle longer strings (like verse references)
    const size = Math.max(80, Math.min(130, bubbleWord.length * 7 + 50));
    bubbleEl.style.width = `${size}px`;
    bubbleEl.style.height = `${size}px`;
    
    if (bubbleWord.length > 10) {
      bubbleEl.style.fontSize = '0.9rem';
      bubbleEl.style.padding = '8px';
    }
    
    // Position randomly on horizontal axis
    const maxLeft = arena.clientWidth - size;
    const randomLeft = Math.floor(Math.random() * maxLeft);
    bubbleEl.style.left = `${randomLeft}px`;

    arena.appendChild(bubbleEl);

    // Add to engine tracking list
    this.activeBubbles.push({
      element: bubbleEl,
      yPos: -60, // starts below screen (using absolute bottom spacing)
      speed: 1.2 + Math.random() * 1.5, // gentle float speed
      isCorrect: isCorrectWord,
      wordText: bubbleWord,
      cleanText: this.cleanWord(bubbleWord)
    });

    // Click handler for bubble
    bubbleEl.addEventListener('click', () => {
      this.handleBubbleClick(bubbleEl, bubbleWord, isCorrectWord);
    });
  },

  animateBubbles() {
    if (this.gameMode !== 'bubble' || this.currentWordIndex >= this.words.length) return;

    const arena = document.getElementById('bubble-arena');
    const arenaHeight = arena ? arena.clientHeight : 380;

    for (let i = this.activeBubbles.length - 1; i >= 0; i--) {
      const bubble = this.activeBubbles[i];
      bubble.yPos += bubble.speed;
      bubble.element.style.bottom = `${bubble.yPos}px`;

      // If bubble float past screen height, remove it
      if (bubble.yPos > arenaHeight + 80) {
        bubble.element.remove();
        this.activeBubbles.splice(i, 1);
      }
    }

    this.bubbleAnimationId = requestAnimationFrame(() => this.animateBubbles());
  },

  handleBubbleClick(bubbleEl, wordText, isCorrect) {
    const expectedWordClean = this.cleanedWords[this.currentWordIndex];
    const clickedWordClean = this.cleanWord(wordText);

    // Bubble pop sound
    AudioManager.playPop();

    // Check match
    if (clickedWordClean === expectedWordClean) {
      AudioManager.playCorrect();
      
      // Animate bubble pop out
      bubbleEl.classList.add('popped');
      
      // Reveal word in slot
      const slot = document.getElementById(`slot-${this.currentWordIndex}`);
      if (slot) {
        slot.className = 'verse-word-slot filled';
      }

      this.currentWordIndex++;
      this.updateMascotSpeech(this.getRandomEncouragement());

      // Clean this bubble from tracking immediately
      this.activeBubbles = this.activeBubbles.filter(b => b.element !== bubbleEl);
      setTimeout(() => bubbleEl.remove(), 150);

      if (this.currentWordIndex >= this.words.length) {
        this.completeVerse();
      }
    } else {
      // Wrong bubble popped
      AudioManager.playWrong();
      bubbleEl.classList.add('popped'); // still pop it, but register mistake
      this.mistakesCount++;
      this.updateMascotSpeech("Whoops! Watch the words closely!");

      this.activeBubbles = this.activeBubbles.filter(b => b.element !== bubbleEl);
      setTimeout(() => bubbleEl.remove(), 150);
    }
  },

  clearBubbleLoops() {
    if (this.bubbleSpawnInterval) {
      clearInterval(this.bubbleSpawnInterval);
      this.bubbleSpawnInterval = null;
    }
    if (this.bubbleAnimationId) {
      cancelAnimationFrame(this.bubbleAnimationId);
      this.bubbleAnimationId = null;
    }
    this.activeBubbles = [];
  },

  // --- JUNGLE BLANKS MODE ---
  setupBlanks() {
    const displayBox = document.getElementById('verse-display');
    displayBox.innerHTML = '';
    displayBox.className = 'verse-display-box';

    // Decide which words to blank out (roughly 35% of words, ensuring at least 2 blanks)
    this.blankIndices = [];
    const count = this.words.length;
    let step = 3; // blank every 3rd word
    if (count <= 5) step = 2; // blank every 2nd word for short verses

    for (let i = 1; i < count; i += step) {
      this.blankIndices.push(i);
    }
    
    // Ensure we have blanks
    if (this.blankIndices.length === 0 && count > 1) {
      this.blankIndices.push(1);
    }

    this.nextBlankIndex = 0; // index in blankIndices

    // Render the verse containing the blanks
    this.words.forEach((word, idx) => {
      const slot = document.createElement('span');
      
      if (this.blankIndices.includes(idx)) {
        slot.className = 'verse-word-slot empty';
        slot.id = `slot-${idx}`;
        slot.innerText = word; // hidden but used for size
      } else {
        slot.className = 'verse-word-slot filled';
        slot.innerText = word;
      }

      if (idx === this.words.length - 1) {
        slot.classList.add('reference-slot');
      }
      
      displayBox.appendChild(slot);
    });

    // Populate the word bank at bottom
    const bankWords = this.blankIndices.map(idx => ({
      text: this.words[idx],
      originalIndex: idx
    }));

    // Shuffle the word bank
    for (let i = bankWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bankWords[i], bankWords[j]] = [bankWords[j], bankWords[i]];
    }

    const scrambleZone = document.getElementById('scramble-zone');
    scrambleZone.style.display = 'none';
    document.getElementById('bubble-zone').style.display = 'none';
    
    const blanksZone = document.getElementById('blanks-zone');
    blanksZone.style.display = 'block';

    const wordBankContainer = document.getElementById('blanks-wordbank');
    wordBankContainer.innerHTML = '';

    // Highlight the first blank slot
    this.highlightNextBlank();

    bankWords.forEach((bankItem, idx) => {
      const wordBtn = document.createElement('button');
      wordBtn.className = 'bank-word-item';
      wordBtn.innerText = bankItem.text;
      
      wordBtn.addEventListener('click', () => {
        this.handleBankWordClick(wordBtn, bankItem.text, bankItem.originalIndex);
      });
      wordBankContainer.appendChild(wordBtn);
    });
  },

  highlightNextBlank() {
    // Remove active highlights from all blanks
    this.blankIndices.forEach(idx => {
      const slot = document.getElementById(`slot-${idx}`);
      if (slot) slot.style.borderColor = '';
    });

    if (this.nextBlankIndex < this.blankIndices.length) {
      const targetIdx = this.blankIndices[this.nextBlankIndex];
      const nextSlot = document.getElementById(`slot-${targetIdx}`);
      if (nextSlot) {
        nextSlot.style.borderColor = 'var(--accent-orange)';
        nextSlot.style.borderStyle = 'solid';
        nextSlot.style.borderWidth = '4px';
      }
    }
  },

  handleBankWordClick(btnElement, wordText, originalIndex) {
    if (this.nextBlankIndex >= this.blankIndices.length) return;

    const targetVerseIndex = this.blankIndices[this.nextBlankIndex];
    const expectedWord = this.cleanedWords[targetVerseIndex];
    const clickedWord = this.cleanWord(wordText);

    if (clickedWord === expectedWord) {
      // Correct!
      AudioManager.playCorrect();
      
      // Fill the slot
      const slot = document.getElementById(`slot-${targetVerseIndex}`);
      if (slot) {
        slot.className = 'verse-word-slot filled';
        slot.style.borderColor = '';
        slot.style.borderWidth = '';
      }

      // Lock/hide the word bank item
      btnElement.classList.add('placed');

      this.nextBlankIndex++;
      this.updateMascotSpeech(this.getRandomEncouragement());

      if (this.nextBlankIndex >= this.blankIndices.length) {
        this.completeVerse();
      } else {
        this.highlightNextBlank();
      }
    } else {
      // Wrong word clicked
      AudioManager.playWrong();
      btnElement.classList.add('wrong-shake');
      this.mistakesCount++;
      this.updateMascotSpeech("Not quite! Look at the empty slot and find the word that fits.");

      setTimeout(() => {
        btnElement.classList.remove('wrong-shake');
      }, 300);
    }
  },

  // --- VICTORY MANAGEMENT ---
  completeVerse() {
    this.isCompleted = true;
    this.clearBubbleLoops();

    // Pulse the final text box
    const displayBox = document.getElementById('verse-display');
    displayBox.classList.add('success-pulse');

    // Calculate rating based on mistakes
    let stars = 3;
    if (this.mistakesCount > 4) {
      stars = 1;
    } else if (this.mistakesCount > 1) {
      stars = 2;
    }

    // Save progress to local storage
    VersesManager.saveVerseProgress(this.activeVerse.id, stars);

    // Play fanfare chime
    setTimeout(() => {
      AudioManager.playVictory();
      
      // Trigger victory page transitions (managed in app.js)
      if (window.App) {
        window.App.showVictoryScreen(this.activeVerse, stars);
      }
    }, 800);
  },

  // Mascot interactions
  updateMascotSpeech(text) {
    const textEl = document.getElementById('arena-mascot-speech');
    if (textEl) {
      textEl.innerText = text;
    }
  },

  getRandomEncouragement() {
    const lines = [
      "Super job! Keep it up!",
      "Awesome! You got it!",
      "Woohoo! You're a scripture superstar!",
      "Sensational! Let's get the next one!",
      "Wow! Your memory is amazing!",
      "Brilliant! Keep going!"
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }
};

window.GameEngine = GameEngine;
