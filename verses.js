// Default library of child-friendly Bible verses grouped by theme
const DEFAULT_VERSES = [
  // Theme: Joy & Peace
  {
    id: "joy-1",
    ref: "Psalm 118:24",
    text: "This is the day that the LORD has made; let us rejoice and be glad in it.",
    theme: "Joy & Peace",
    custom: false
  },
  {
    id: "joy-2",
    ref: "Philippians 4:4",
    text: "Rejoice in the Lord always; again I will say, rejoice.",
    theme: "Joy & Peace",
    custom: false
  },
  {
    id: "joy-3",
    ref: "Psalm 16:11",
    text: "You make known to me the path of life; in your presence there is fullness of joy; at your right hand are pleasures forevermore.",
    theme: "Joy & Peace",
    custom: false
  },

  // Theme: Faith & Trust
  {
    id: "faith-1",
    ref: "Proverbs 3:5",
    text: "Trust in the LORD with all your heart, and do not lean on your own understanding.",
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
    ref: "Hebrews 11:1",
    text: "Now faith is the assurance of things hoped for, the conviction of things not seen.",
    theme: "Faith & Trust",
    custom: false
  },

  // Theme: Love & Kindness
  {
    id: "love-1",
    ref: "Ephesians 4:32",
    text: "Be kind to one another, tenderhearted, forgiving one another, as God in Christ forgave you.",
    theme: "Love & Kindness",
    custom: false
  },
  {
    id: "love-2",
    ref: "1 John 4:19",
    text: "We love because he first loved us.",
    theme: "Love & Kindness",
    custom: false
  },
  {
    id: "love-3",
    ref: "John 13:34",
    text: "A new commandment I give to you, that you love one another: just as I have loved you, you also are to love one another.",
    theme: "Love & Kindness",
    custom: false
  },

  // Theme: Courage & Strength
  {
    id: "courage-1",
    ref: "Joshua 1:9",
    text: "Have I not commanded you? Be strong and courageous. Do not be frightened, and do not be dismayed, for the LORD your God is with you wherever you go.",
    theme: "Courage & Strength",
    custom: false
  },
  {
    id: "courage-2",
    ref: "Philippians 4:13",
    text: "I can do all things through him who strengthens me.",
    theme: "Courage & Strength",
    custom: false
  },
  {
    id: "courage-3",
    ref: "Isaiah 41:10",
    text: "Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with my righteous right hand.",
    theme: "Courage & Strength",
    custom: false
  },

  // Theme: Wisdom & Guidance
  {
    id: "wisdom-1",
    ref: "Psalm 119:105",
    text: "Your word is a lamp to my feet and a light to my path.",
    theme: "Wisdom",
    custom: false
  },
  {
    id: "wisdom-2",
    ref: "James 1:5",
    text: "If any of you lacks wisdom, let him ask God, who gives generously to all without reproach, and it will be given him.",
    theme: "Wisdom",
    custom: false
  },
  {
    id: "wisdom-3",
    ref: "Proverbs 4:23",
    text: "Keep your heart with all vigilance, for from it flow the springs of life.",
    theme: "Wisdom",
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
