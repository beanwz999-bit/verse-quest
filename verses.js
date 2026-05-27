// Default library of child-friendly Bible verses grouped by theme
const DEFAULT_VERSES = [
  // Theme: Joy & Praise
  {
    id: "joy-1",
    ref: "Philippians 4:4",
    text: "Rejoice in the Lord always; again I will say, rejoice.",
    theme: "Joy & Praise",
    custom: false
  },
  {
    id: "joy-2",
    ref: "Psalm 150:6",
    text: "Let everything that has breath praise the LORD!",
    theme: "Joy & Praise",
    custom: false
  },
  {
    id: "joy-3",
    ref: "Psalm 100:1",
    text: "Make a joyful noise to the LORD, all the earth!",
    theme: "Joy & Praise",
    custom: false
  },

  // Theme: Love & Kindness
  {
    id: "love-1",
    ref: "1 John 4:19",
    text: "We love because he first loved us.",
    theme: "Love & Kindness",
    custom: false
  },
  {
    id: "love-2",
    ref: "Ephesians 4:32",
    text: "Be kind to one another, tenderhearted, forgiving one another.",
    theme: "Love & Kindness",
    custom: false
  },
  {
    id: "love-3",
    ref: "John 15:12",
    text: "Love one another as I have loved you.",
    theme: "Love & Kindness",
    custom: false
  },

  // Theme: Faith & Trust
  {
    id: "faith-1",
    ref: "Proverbs 3:5",
    text: "Trust in the LORD with all your heart.",
    theme: "Faith & Trust",
    custom: false
  },
  {
    id: "faith-2",
    ref: "Psalm 56:3",
    text: "When I am afraid, I put my trust in you.",
    theme: "Faith & Trust",
    custom: false
  },
  {
    id: "faith-3",
    ref: "Proverbs 30:5",
    text: "Every word of God proves true.",
    theme: "Faith & Trust",
    custom: false
  },

  // Theme: Courage & Strength
  {
    id: "courage-1",
    ref: "Philippians 4:13",
    text: "I can do all things through him who strengthens me.",
    theme: "Courage & Strength",
    custom: false
  },
  {
    id: "courage-2",
    ref: "Joshua 1:9",
    text: "Be strong and courageous. Do not be frightened.",
    theme: "Courage & Strength",
    custom: false
  },
  {
    id: "courage-3",
    ref: "Psalm 23:1",
    text: "The LORD is my shepherd; I shall not want.",
    theme: "Courage & Strength",
    custom: false
  },

  // Theme: Wisdom & Listening
  {
    id: "wisdom-1",
    ref: "Psalm 119:105",
    text: "Your word is a lamp to my feet and a light to my path.",
    theme: "Wisdom & Listening",
    custom: false
  },
  {
    id: "wisdom-2",
    ref: "Ephesians 6:1",
    text: "Children, obey your parents in the Lord, for this is right.",
    theme: "Wisdom & Listening",
    custom: false
  },
  {
    id: "wisdom-3",
    ref: "Luke 11:28",
    text: "Blessed are those who hear the word of God and keep it!",
    theme: "Wisdom & Listening",
    custom: false
  }
];

const VersesManager = {
  // Load all verses, combining defaults and custom ones from localStorage
  getAllVerses() {
    let customVerses = [];
    try {
      const stored = localStorage.getItem("vq_custom_verses");
      if (stored) {
        customVerses = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error reading custom verses", e);
    }
    return [...DEFAULT_VERSES, ...customVerses];
  },

  // Get verses grouped by theme
  getVersesByTheme(theme) {
    return this.getAllVerses().filter(v => v.theme === theme);
  },

  // Get all unique themes
  getThemes() {
    const verses = this.getAllVerses();
    const themes = new Set(verses.map(v => v.theme));
    return Array.from(themes);
  },

  // Get a single verse by ID
  getVerseById(id) {
    return this.getAllVerses().find(v => v.id === id);
  },

  // Add a new parent-defined verse
  addCustomVerse(ref, text, theme = "Custom") {
    if (!ref || !text) return null;
    
    // Clean up spaces
    text = text.trim().replace(/\s+/g, ' ');
    ref = ref.trim();

    const customVerses = this.getCustomVerses();
    const newVerse = {
      id: "custom-" + Date.now(),
      ref: ref,
      text: text,
      theme: theme || "Custom",
      custom: true
    };

    customVerses.push(newVerse);
    localStorage.setItem("vq_custom_verses", JSON.stringify(customVerses));
    return newVerse;
  },

  // Delete a custom verse by ID
  deleteCustomVerse(id) {
    let customVerses = this.getCustomVerses();
    customVerses = customVerses.filter(v => v.id !== id);
    localStorage.setItem("vq_custom_verses", JSON.stringify(customVerses));
    
    // Clean up progress for this verse too
    localStorage.removeItem(`vq_progress_${id}`);
  },

  // Get only custom verses
  getCustomVerses() {
    try {
      const stored = localStorage.getItem("vq_custom_verses");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  // Get progress (stars: 0 to 3) for a verse
  getVerseProgress(id) {
    try {
      const progress = localStorage.getItem(`vq_progress_${id}`);
      return progress ? parseInt(progress, 10) : 0;
    } catch (e) {
      return 0;
    }
  },

  // Save progress (stars: 0 to 3) for a verse, only keeping the highest score
  saveVerseProgress(id, stars) {
    const current = this.getVerseProgress(id);
    if (stars > current) {
      localStorage.setItem(`vq_progress_${id}`, stars.toString());
      return true; // updated
    }
    return false;
  },

  // Check if every verse has > 0 stars progress
  checkAllCompleted() {
    const all = this.getAllVerses();
    if (all.length === 0) return false;
    return all.every(v => this.getVerseProgress(v.id) > 0);
  },

  // Reset all game progress
  resetAllProgress() {
    const allVerses = this.getAllVerses();
    allVerses.forEach(v => {
      localStorage.removeItem(`vq_progress_${v.id}`);
    });
    localStorage.removeItem("vq_all_completed_celebrated");
  }
};

// Export to window object for browser access
window.VersesManager = VersesManager;
