// The poem itself: each line carries chapter + scene + shot + transition
// metadata, which scene.js reads to choose camera profiles, blend visuals,
// and animate the on-screen "current shot" / "transition" HUD.

const line = (chapter, scene, text, shot, transition) => ({
  type: 'line',
  chapter,
  scene,
  text,
  shot,
  transition,
});

export const sections = [
  {
    type: 'hero',
    title: 'The Green Light',
    subtitle: 'A poem for Jay Gatsby',
    scene: 'greenLight',
    chapter: 'shoreline',
  },

  // --- I. SHORELINE ---
  line(
    'shoreline', 'greenLight',
    'we used to think summer was permanent',
    'wide shot of a glowing shoreline at dusk, light stretching across the water',
    'the water ripples, and the reflection bleeds upward into the sky',
  ),
  line(
    'shoreline', 'greenLight',
    'but it was just light stretching itself thin',
    'sky desaturates slowly, colors draining into gray',
    'the fading sky dissolves into the pale glow of mansion lights',
  ),

  // --- II. PARTIES ---
  line(
    'parties', 'mansion',
    'they said his parties were unforgettable',
    'crane shot rising over a crowded mansion, lights blazing',
    'the camera tilts down into a single champagne glass',
  ),
  line(
    'parties', 'goldParticles',
    'like that made them matter',
    'condensation sliding down the glass in silence',
    'the droplet falls and lands as bass from distant music',
  ),
  line(
    'parties', 'goldParticles',
    'the noise couldn’t turn into meaning',
    'muffled laughter, distorted and echoing',
    'sound warps into a spinning record',
  ),
  line(
    'parties', 'goldParticles',
    'no matter how hard it tries',
    'spinning record in close-up, needle crackling',
    'the spin slows, warping into silence',
  ),

  line(
    'parties', 'goldParticles',
    'rooms full of people',
    'tracking shot weaving through bodies on the dance floor',
    'movement blurs into streaks of color',
  ),
  line(
    'parties', 'goldParticles',
    'who did not know his name',
    'close-ups of strangers laughing, disconnected',
    'faces overlap in a quick layered dissolve',
  ),
  line(
    'parties', 'mansion',
    'but said it anyway',
    'whispers of “gatsby” passed between mouths',
    'the final whisper carries into empty air',
  ),

  line(
    'parties', 'goldParticles',
    'champagne left sweating on tables',
    'abandoned glasses catching dim light',
    'one glass tips slightly, reflecting a figure',
  ),
  line(
    'parties', 'goldParticles',
    'music still playing',
    'spinning record in close-up, needle crackling',
    'the spin slows, warping into silence',
  ),
  line(
    'parties', 'mansion',
    'after the feeling had already left',
    'wide shot of a half-empty room, motion slowed',
    'the emptiness expands into a still hallway',
  ),

  // --- III. INVENTION ---
  line(
    'invention', 'mansion',
    'he built a life out of almost',
    'montage of rehearsed gestures, letters, tailored suits',
    'paper edges flutter and become water waves',
  ),
  line(
    'invention', 'mansion',
    'out of maybe',
    'hand hesitating before knocking on a door',
    'the hand pulls back, dissolving into darkness',
  ),
  line(
    'invention', 'greenLight',
    'out of if she comes back',
    'over-the-shoulder shot toward a distant dock',
    'the dock light flickers into the green light',
  ),

  line(
    'invention', 'mansion',
    'and everyone called it greatness',
    'slow pan across guests admiring the mansion',
    'admiration fades into blurred silhouettes',
  ),

  line(
    'invention', 'mansion',
    'but greatness looked like standing still',
    'static shot of him alone while everything blurs',
    'motion streaks pass through his figure',
  ),
  line(
    'invention', 'vortex',
    'while everything else kept moving',
    'time-lapse of bodies flowing past',
    'the movement drains into still water',
  ),

  // --- IV. DAISY ---
  line(
    'longing', 'artDeco',
    'it looked like a smile',
    'tight close-up, carefully held expression',
    'the smile trembles, almost breaking',
  ),
  line(
    'longing', 'artDeco',
    'that stayed a second too long',
    'the stillness lingers uncomfortably',
    'cut on the breath he holds',
  ),

  line(
    'longing', 'greenLight',
    'looked like waiting',
    'long shot at the edge of the water',
    'ripples spread outward from his feet',
  ),
  line(
    'longing', 'greenLight',
    'and calling it hope',
    'soft focus on the green light flickering',
    'the flicker syncs with a heartbeat sound',
  ),
  line(
    'longing', 'greenLight',
    'even though it was lost at the start',
    'extreme close-up of the green glow',
    'each blink becomes slower, heavier',
  ),

  line(
    'longing', 'greenLight',
    'across the water',
    'compressed telephoto shot of distance',
    'heat haze blurs the frame into abstraction',
  ),
  line(
    'longing', 'greenLight',
    'a light kept blinking',
    'extreme close-up of the green glow',
    'each blink becomes slower, heavier',
  ),

  line(
    'longing', 'greenLight',
    'not bright enough to reach',
    'silhouette reaching forward, stopping short',
    'his hand fades into the reflection',
  ),
  line(
    'longing', 'artDeco',
    'just enough to believe in',
    'the light reflected in his eyes',
    'reflection dissolves into Daisy’s face',
  ),

  line(
    'longing', 'artDeco',
    'and the worst part is',
    'slow push-in as shadows swallow the frame',
    'darkness gives way to warm golden light',
  ),

  line(
    'longing', 'artDeco',
    'not that he dreamed',
    'soft-lit memory of him looking upward',
    'the glow shifts subtly colder',
  ),
  line(
    'longing', 'artDeco',
    'but how close it always felt',
    'match cut between his hand and empty air',
    'the gap widens without movement',
  ),

  line(
    'longing', 'artDeco',
    'how love can exist',
    'close-up of her laughing in sunlight',
    'light flares across the lens',
  ),
  line(
    'longing', 'artDeco',
    'and still not arrive',
    'she turns away, fading out of focus',
    'her silhouette dissolves into air',
  ),

  line(
    'longing', 'artDeco',
    'she laughed like something untouchable',
    'slow-motion, hair catching the wind',
    'strands blur into soft motion trails',
  ),

  line(
    'longing', 'artDeco',
    'and he believed it',
    'close-up, eyes fixed forward',
    'reflection of the light flickers inside them',
  ),

  // --- V. PAST ---
  line(
    'past', 'vortex',
    'because belief is easier',
    'shadows creeping across his face',
    'the shadows consume the frame',
  ),
  line(
    'past', 'vortex',
    'than letting go',
    'hand dropping slowly out of frame',
    'the fall becomes a drift through darkness',
  ),

  line(
    'past', 'vortex',
    'we talk about the past',
    'sepia-toned fragments flickering',
    'edges burn into present color',
  ),
  line(
    'past', 'vortex',
    'like it is somewhere behind us',
    'over-the-shoulder down an empty road',
    'road stretches endlessly forward instead',
  ),

  line(
    'past', 'vortex',
    'but it does not stay there',
    'past and present overlay, slightly misaligned',
    'frames glitch and settle',
  ),

  line(
    'past', 'vortex',
    'it lingers',
    'still frame of held breath',
    'the image refuses to leave',
  ),

  line(
    'past', 'vortex',
    'in the way we want things',
    'layered shots of memory and reality',
    'images fade but never fully disappear',
  ),
  line(
    'past', 'vortex',
    'in the way we refuse to move on',
    'figure frozen while background shifts',
    'time speeds up around stillness',
  ),

  line(
    'past', 'vortex',
    'in the way we call it fate',
    'whisper carried through empty space',
    'sound stretches, distorts',
  ),
  line(
    'past', 'vortex',
    'instead of what it is',
    'abrupt silence, no score',
    'cut feels too clean',
  ),

  line(
    'past', 'boat',
    'wanting something',
    'close-up of eyes filled with longing',
    'light reflects, trembling',
  ),
  line(
    'past', 'boat',
    'that was never ours',
    'empty frame where someone stood',
    'dust particles drift through light',
  ),

  // --- VI. FADE ---
  line(
    'fade', 'boat',
    'and still reaching',
    'arm extending into darkness',
    'the reach slows, suspended',
  ),

  line(
    'fade', 'boat',
    'because somewhere',
    'wide shot of night settling in',
    'stars begin to emerge',
  ),
  line(
    'fade', 'boat',
    'a light is still on',
    'the green light glowing alone',
    'water reflects it in broken fragments',
  ),

  line(
    'fade', 'boat',
    'and we tell ourselves',
    'close-up, lips barely moving',
    'words echo faintly',
  ),
  line(
    'fade', 'boat',
    'it means something',
    'reflection trembling in water',
    'ripples distort the image',
  ),

  line(
    'fade', 'boat',
    'we tell ourselves',
    'repeated shot, slightly warped',
    'edges blur further',
  ),
  line(
    'fade', 'boat',
    'we are close',
    'zoom nearly reaching the light',
    'focus slips just before contact',
  ),

  line(
    'fade', 'boat',
    'we tell ourselves',
    'echoing voice fading out',
    'sound dissolves into wind',
  ),
  line(
    'fade', 'boat',
    'just a little further',
    'footsteps slow, then stop',
    'ground beneath fades into water',
  ),

  line(
    'fade', 'boat',
    'but some distances do not shrink',
    'wide shot emphasizing emptiness',
    'horizon pulls farther away',
  ),

  line(
    'fade', 'boat',
    'they just stay glowing',
    'the green light steady in darkness',
    'glow pulses once, softly',
  ),
  line(
    'fade', 'boat',
    'while everything else fades',
    'full fade to black, the light lingering last',
    'the frame empties without ever quite closing',
  ),

  { type: 'end', text: 'fin.', scene: 'boat', chapter: 'fade' },
];
