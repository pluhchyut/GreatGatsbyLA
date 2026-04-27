// Original poem about Jay Gatsby, woven with direct Fitzgerald quotes.
// Each section has: a poem line, an optional quote, and a "scene" key
// that maps to a Three.js visual configuration.

export const sections = [
  {
    type: 'hero',
    title: 'The Green Light',
    subtitle: 'A poem for Jay Gatsby',
    scene: 'greenLight',
  },

  // --- Stanza I: Longing ---
  { type: 'line', text: 'Across the bay, a single green eye burns,', scene: 'greenLight' },
  { type: 'line', text: 'A pinprick promise on the dark.', scene: 'greenLight' },
  {
    type: 'quote',
    text: 'He stretched out his arms toward the dark water in a curious way…',
    cite: '— Fitzgerald, Ch. 1',
    scene: 'greenLight',
  },
  { type: 'line', text: 'He stands upon his lawn and reaches —', scene: 'greenLight' },
  { type: 'line', text: 'A man rehearsing the shape of want.', scene: 'greenLight' },

  // --- Stanza II: The Parties ---
  { type: 'line', text: 'But first, the music. First, the gold.', scene: 'goldParticles' },
  { type: 'line', text: 'Champagne in fountains, laughter in the leaves,', scene: 'goldParticles' },
  {
    type: 'quote',
    text: 'In his blue gardens men and girls came and went like moths among the whisperings and the champagne and the stars.',
    cite: '— Fitzgerald, Ch. 3',
    scene: 'goldParticles',
  },
  { type: 'line', text: 'Strangers wear his name like borrowed silk,', scene: 'goldParticles' },
  { type: 'line', text: 'And no one ever finds the host.', scene: 'goldParticles' },

  // --- Stanza III: The Mansion ---
  { type: 'line', text: 'A castle built on rumor and on rain,', scene: 'mansion' },
  { type: 'line', text: 'Every window lit, every room alone.', scene: 'mansion' },
  {
    type: 'quote',
    text: 'There was music from my neighbor\'s house through the summer nights.',
    cite: '— Fitzgerald, Ch. 3',
    scene: 'mansion',
  },
  { type: 'line', text: 'He invented a name. He invented a man.', scene: 'mansion' },
  { type: 'line', text: 'He invented a love to live inside.', scene: 'mansion' },

  // --- Stanza IV: The Dream ---
  { type: 'line', text: 'Daisy — the syllables a small gold bell,', scene: 'artDeco' },
  { type: 'line', text: 'A voice, he said, full of money.', scene: 'artDeco' },
  {
    type: 'quote',
    text: 'Her voice is full of money.',
    cite: '— Fitzgerald, Ch. 7',
    scene: 'artDeco',
  },
  { type: 'line', text: 'Five years he polished the memory smooth,', scene: 'artDeco' },
  { type: 'line', text: 'Until no real woman could fit inside it.', scene: 'artDeco' },

  // --- Stanza V: The Collapse ---
  { type: 'line', text: 'The dream was always a little ahead of him,', scene: 'vortex' },
  { type: 'line', text: 'A green light receding as he reached.', scene: 'vortex' },
  {
    type: 'quote',
    text: 'Gatsby believed in the green light, the orgastic future that year by year recedes before us.',
    cite: '— Fitzgerald, Ch. 9',
    scene: 'vortex',
  },
  { type: 'line', text: 'Then a phone that did not ring,', scene: 'vortex' },
  { type: 'line', text: 'A pool, a pistol, a single ripple of red.', scene: 'vortex' },

  // --- Stanza VI: The Wake ---
  { type: 'line', text: 'They came for his parties. None came for his grave.', scene: 'boat' },
  { type: 'line', text: 'The rain wrote his eulogy alone.', scene: 'boat' },
  {
    type: 'quote',
    text: 'So we beat on, boats against the current, borne back ceaselessly into the past.',
    cite: '— Fitzgerald, Ch. 9',
    scene: 'boat',
  },
  { type: 'line', text: 'And still, across the water, the green light burns —', scene: 'boat' },
  { type: 'line', text: 'A small god for anyone still reaching.', scene: 'boat' },

  { type: 'end', text: 'fin.', scene: 'boat' },
];
