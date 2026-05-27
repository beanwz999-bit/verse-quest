// Screen Navigation, Event Listeners, and Visual Effects (Confetti)
const App = {
  selectedVerse: null,
  confettiActive: false,
  confettiAnimationId: null,
  confettiParticles: [],

  init() {
    this.bindEvents();
    this.showScreen('welcome-screen');
    this.preloadMascotSpeech();
  },

  // Navigate between screens
  showScreen(screenId) {
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));

    // Stop active audio/speech when moving away from game arena
    if (screenId !== 'game-arena-screen') {
      GameEngine.clearBubbleLoops();
      AudioManager.stopSpeech();
    }

    // Stop confetti if moving away from victory
    if (screenId !== 'victory-screen') {
      this.stopConfetti();
    }

    // Show target screen
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
    }

    // Special renders on entering screens
    if (screenId === 'map-screen') {
      this.renderMapScreen();
    } else if (screenId === 'welcome-screen') {
      this.renderWelcomeScreen();
    }
  },

  bindEvents() {
    // Welcome Screen
    document.getElementById('play-btn').addEventListener('click', () => {
      this.showScreen('map-screen');
      AudioManager.init(); // Warm up audio context
    });

    document.getElementById('welcome-parent-btn').addEventListener('click', () => {
      this.toggleModal('parent-modal', true);
    });

    // Map Screen back
    document.getElementById('map-back-btn').addEventListener('click', () => {
      this.showScreen('welcome-screen');
    });

    document.getElementById('map-parent-btn').addEventListener('click', () => {
      this.toggleModal('parent-modal', true);
    });

    // Mode Selection back
    document.getElementById('mode-back-btn').addEventListener('click', () => {
      this.showScreen('map-screen');
    });

    // Game Mode selection triggers
    document.getElementById('mode-scramble-btn').addEventListener('click', () => this.launchGame('scramble'));
    document.getElementById('mode-bubble-btn').addEventListener('click', () => this.launchGame('bubble'));
    document.getElementById('mode-blanks-btn').addEventListener('click', () => this.launchGame('blanks'));

    // Game Arena back
    document.getElementById('game-back-btn').addEventListener('click', () => {
      this.showScreen('map-screen');
    });

    // TTS Speak button
    document.getElementById('game-tts-btn').addEventListener('click', () => {
      if (this.selectedVerse) {
        AudioManager.speak(this.selectedVerse.text);
      }
    });

    // Victory screen controls
    document.getElementById('victory-next-btn').addEventListener('click', () => {
      this.showScreen('map-screen');
    });
    
    document.getElementById('victory-replay-btn').addEventListener('click', () => {
      // Re-trigger the active game mode
      this.launchGame(GameEngine.gameMode);
    });

    // Parent Settings panel tabs/modals
    document.getElementById('close-modal-btn').addEventListener('click', () => {
      this.toggleModal('parent-modal', false);
    });

    // Certificate / Legend Screen events
    document.getElementById('close-certificate-btn').addEventListener('click', () => {
      this.toggleModal('certificate-modal', false);
    });

    document.getElementById('view-certificate-btn').addEventListener('click', () => {
      this.toggleModal('certificate-modal', true);
      this.startConfetti();
      AudioManager.playCorrect();
    });

    document.getElementById('child-name-input').addEventListener('input', (e) => {
      const name = e.target.value.trim();
      document.getElementById('cert-child-name').innerText = name || "Safari Legend";
    });

    document.getElementById('print-cert-btn').addEventListener('click', () => {
      window.print();
    });

    document.getElementById('celebrate-again-btn').addEventListener('click', () => {
      this.startConfetti();
      AudioManager.playVictory();
    });

    document.getElementById('parent-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCustomVerseSubmit();
    });

    // Settings inputs
    const soundToggle = document.getElementById('sound-effects-toggle');
    const speechToggle = document.getElementById('voice-read-toggle');
    const resetProgressBtn = document.getElementById('reset-progress-btn');

    soundToggle.addEventListener('change', (e) => {
      AudioManager.toggleSound(e.target.checked);
    });

    speechToggle.addEventListener('change', (e) => {
      AudioManager.toggleSpeech(e.target.checked);
    });

    resetProgressBtn.addEventListener('click', () => {
      if (confirm("Are you sure you want to reset all game stars? This will not delete custom verses.")) {
        VersesManager.resetAllProgress();
        this.renderMapScreen();
        alert("Progress reset completed!");
      }
    });
  },

  preloadMascotSpeech() {
    const welcomeQuotes = [
      "Let's explore God's Word together! Choose a theme and start your quest!",
      "Memorizing verses helps us carry truth in our hearts every single day!",
      "Are you ready for a scripture safari adventure? Tap Play!",
      "Leo the Lion says: You can build a super strong memory with practice!"
    ];
    const welcomeBubble = document.getElementById('welcome-mascot-speech');
    if (welcomeBubble) {
      welcomeBubble.innerText = welcomeQuotes[Math.floor(Math.random() * welcomeQuotes.length)];
    }
  },

  renderWelcomeScreen() {
    this.preloadMascotSpeech();
    
    // Update setting checkbox status
    document.getElementById('sound-effects-toggle').checked = AudioManager.soundEnabled;
    document.getElementById('voice-read-toggle').checked = AudioManager.speechEnabled;
  },

  // Draw the Level Map
  renderMapScreen() {
    const themeContainer = document.getElementById('map-themes');
    themeContainer.innerHTML = '';

    // Check if child has completed all verses
    const isAllCompleted = VersesManager.checkAllCompleted();
    const trophyBanner = document.getElementById('trophy-banner');
    
    if (isAllCompleted) {
      if (trophyBanner) trophyBanner.style.display = 'flex';
      
      // Auto-trigger celebration if not celebrated yet
      const celebrated = localStorage.getItem("vq_all_completed_celebrated");
      if (celebrated !== "true") {
        localStorage.setItem("vq_all_completed_celebrated", "true");
        setTimeout(() => {
          this.toggleModal('certificate-modal', true);
          this.startConfetti();
          AudioManager.playVictory();
        }, 600);
      }
    } else {
      if (trophyBanner) trophyBanner.style.display = 'none';
    }

    const themes = VersesManager.getThemes();

    themes.forEach(theme => {
      const themeSection = document.createElement('div');
      themeSection.className = 'theme-section';

      // Theme Emoji Map
      let emoji = '📚';
      if (theme === 'Joy & Peace') emoji = '☀️';
      else if (theme === 'Faith & Trust') emoji = '⛵';
      else if (theme === 'Love & Kindness') emoji = '❤️';
      else if (theme === 'Courage & Strength') emoji = '🛡️';
      else if (theme === 'Wisdom') emoji = '🦉';
      else if (theme === 'Custom') emoji = '✏️';

      const title = document.createElement('h3');
      title.className = 'theme-title';
      title.innerHTML = `<span>${emoji}</span> ${theme}`;
      themeSection.appendChild(title);

      const verseGrid = document.createElement('div');
      verseGrid.className = 'verse-grid';

      const verses = VersesManager.getVersesByTheme(theme);
      verses.forEach(verse => {
        const card = document.createElement('div');
        card.className = 'verse-card';
        
        // Stars display based on progress
        const starsCount = VersesManager.getVerseProgress(verse.id);
        let starsHTML = '';
        for (let i = 1; i <= 3; i++) {
          if (i <= starsCount) {
            starsHTML += '★'; // Filled
          } else {
            starsHTML += '☆'; // Empty
          }
        }

        card.innerHTML = `
          <div>
            <div class="verse-card-ref">${verse.ref}</div>
            <div class="verse-card-text">"${verse.text}"</div>
          </div>
          <div class="verse-card-footer">
            <span class="stars-display">${starsHTML}</span>
            ${verse.custom ? `<button class="delete-custom-btn" data-id="${verse.id}" title="Delete Verse">🗑️</button>` : ''}
          </div>
        `;

        // Event listener to trigger mode selector
        card.addEventListener('click', (e) => {
          // If trash can was clicked, delete custom verse instead
          if (e.target.classList.contains('delete-custom-btn')) {
            e.stopPropagation();
            const id = e.target.dataset.id;
            if (confirm("Delete this custom verse?")) {
              VersesManager.deleteCustomVerse(id);
              this.renderMapScreen();
            }
            return;
          }
          this.selectVerse(verse);
        });

        verseGrid.appendChild(card);
      });

      themeSection.appendChild(verseGrid);
      themeContainer.appendChild(themeSection);
    });
  },

  selectVerse(verse) {
    this.selectedVerse = verse;
    
    // Set headers on mode screen
    document.getElementById('mode-verse-ref').innerText = verse.ref;
    document.getElementById('mode-verse-text').innerText = `"${verse.text}"`;

    this.showScreen('mode-selection-screen');
  },

  launchGame(mode) {
    if (!this.selectedVerse) return;
    
    // Set title reference
    document.getElementById('arena-verse-ref').innerText = this.selectedVerse.ref;
    
    // Initialize Game Engine
    GameEngine.initGame(this.selectedVerse, mode);

    this.showScreen('game-arena-screen');
  },

  showVictoryScreen(verse, stars) {
    this.showScreen('victory-screen');

    // Fill verse text
    document.getElementById('victory-verse-display-text').innerText = `"${verse.text}"`;
    document.getElementById('victory-verse-display-ref').innerText = verse.ref;

    // Render Victory Stars
    const starsBox = document.getElementById('victory-stars-box');
    starsBox.innerHTML = '';

    for (let i = 1; i <= 3; i++) {
      const star = document.createElement('span');
      star.className = 'star-spin';
      if (i <= stars) {
        star.innerText = '★';
      } else {
        star.innerText = '☆';
        star.style.color = '#ccc';
      }
      starsBox.appendChild(star);
    }

    // Trigger Canvas Confetti
    this.startConfetti();
  },

  toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    if (modal) {
      if (show) {
        modal.classList.add('active');
        
        // Populate custom voices in parents panel
        const voiceSelect = document.getElementById('parent-voice-select');
        if (voiceSelect) {
          voiceSelect.innerHTML = '<option value="">Default English Voice</option>';
          const voices = AudioManager.getVoices();
          voices.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.name;
            opt.innerText = `${v.name} (${v.lang})`;
            if (AudioManager.selectedVoice && AudioManager.selectedVoice.name === v.name) {
              opt.selected = true;
            }
            voiceSelect.appendChild(opt);
          });

          // Handle voice setting change
          voiceSelect.onchange = (e) => {
            AudioManager.setVoice(e.target.value);
          };
        }
      } else {
        modal.classList.remove('active');
      }
    }
  },

  handleCustomVerseSubmit() {
    const ref = document.getElementById('custom-ref').value;
    const text = document.getElementById('custom-text').value;
    const theme = document.getElementById('custom-theme').value;

    if (!ref || !text) {
      alert("Please fill in both reference and verse text!");
      return;
    }

    const newVerse = VersesManager.addCustomVerse(ref, text, theme);
    if (newVerse) {
      // Clear form
      document.getElementById('custom-ref').value = '';
      document.getElementById('custom-text').value = '';
      
      this.toggleModal('parent-modal', false);
      this.renderMapScreen();
      alert("Successfully added verse! Look for it under the '" + theme + "' theme.");
    }
  },

  // --- CANVAS CONFETTI ENGINE ---
  startConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;

    this.confettiActive = true;
    this.confettiParticles = [];
    const ctx = canvas.getContext('2d');

    // Resize canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create particle presets
    const colors = ['#f9c74f', '#f9844a', '#48cae4', '#52b788', '#f94144', '#f3722c', '#43aa8b'];
    for (let i = 0; i < 150; i++) {
      this.confettiParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.random() * 4 - 2,
        speedY: Math.random() * 5 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 4 - 2
      });
    }

    const draw = () => {
      if (!this.confettiActive) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      this.confettiParticles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        // Reset particle to top if it goes off bottom
        if (p.y > canvas.height) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        
        // Draw little squares or circles
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      this.confettiAnimationId = requestAnimationFrame(draw);
    };

    draw();

    // Auto fade confetti after 6 seconds to save system CPU resources
    setTimeout(() => {
      this.stopConfetti();
    }, 6000);
  },

  stopConfetti() {
    this.confettiActive = false;
    if (this.confettiAnimationId) {
      cancelAnimationFrame(this.confettiAnimationId);
      this.confettiAnimationId = null;
    }
    const canvas = document.getElementById('confetti-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
};

// Listen to windows resize to adjust confetti canvas size
window.addEventListener('resize', () => {
  const canvas = document.getElementById('confetti-canvas');
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
});

window.App = App;

// Bootstrap on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
