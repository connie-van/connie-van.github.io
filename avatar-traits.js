// Avatar builder data. Everything the builder shows comes from this file.
//
// HOW THE ART WORKS
// Every character layer is a transparent image on the SAME canvas (CANVAS below; the 3x/4x exports are the same shape),
// so each trait keeps its position automatically: the builder just stacks the layers.
// Nothing is repositioned or resized per trait. Background images are different: fit:'cover' fills the whole card.
//
// ADDING A TRAIT: add an object to the category's list below. Two kinds of layers:
//
//   1) A plain image:           bodega.layer('head_accessory_003_3x_1.png')     (looked up in that set's folder, see SETS below)
//         optional:  z (stacking number, higher = in front),  fit:'cover' (background images),
//                    tint:'body' | 'eyes' | 'hair'  (fills the image's shape with that color)
//
//   A layer with  z: CATEGORY_Z.hairBack  sits behind the body (see the stacking order below).
//   Every tile in a trait tab shows that item's set's ORIGINAL colors (see SETS) until the visitor picks a color of their own; Reset all and wearing an outfit
//   bring the originals back. The avatar itself always follows the visitor's colors. An item can opt out with  originalInMenu: false.
//   Every item can also take  crop:[left, top, right, bottom]  (in CANVAS units) to choose by hand how its selection tile is zoomed.
//   An item with  fullTile: true  shows ALL of its artwork in its tile, floating pieces included.
//   A background with  star:'light'  or  star:'dark'  sets the selected star's color on its B.G. tile and its set's Outfits tile
//   (otherwise it's picked automatically from the artwork under the star).
//   An item with  tileBg:'#hex'  gets that backing color in its tile, for light artwork that would disappear on the paper-colored tile;
//   add  tileBgOpacity: 0.25  (0 to 1) to tint it instead of filling it solid.
//   A Head (face) item with  hasEyes: true  has its eyes drawn in: Shuffle then gives it no Eyes trait (Shuffle otherwise always picks eyes).
//   Normally leave both out: the tile is cropped to the artwork automatically, and on Tops and Bottoms a floating piece
//   that sits apart from the main trait is left out of the tile (it still shows on the live character).
//
//   2) A combined SVG export:   bodega.svg('combined-body_003.svg')
//         The builder reads the SVG straight from your file: the flat shape painted in a marker color becomes color-changeable,
//         and the art image inside the SVG is drawn on top. Marker colors:
//              green (lime, #0f0)  ->  Skin color      yellow (#ff0)  ->  Eyes color      blue (#00f)  ->  Hair color
//         Drop in a new export with the same file name and it just works. Use web-sized images (under about 1600px wide).
//
// ADDING A SET: make a folder named after it inside the artwork folder, upload its files there, add it to SETS below, and give each of its
// traits  set:'<folder name>'.  Traits can also be added one at a time, with no set at all.
//
// A trait does not need an outfit: it just becomes a tile in its tab. OUTFITS are optional presets that fill several slots at once (see `sets`);
// picking one also puts on its set's original colors and paired background (see SETS).
// STACKING ORDER, back to front:
//   background, hair back, lower body (bottoms), upper body (tops), acc back (L Acc.), lower face (Head tab), upper face (eyes),
//   hair front, hat, front acc (R Acc.)
// Hair is one trait with up to two layers: a back layer and a front layer, so a hair item lists both:
//   { id:'curly', set:'...', name:'Curly', layers:[ x.svg('combined-hair_back_005.svg', { z: CATEGORY_Z.hairBack }), x.svg('combined-hair_front_005.svg') ] }
//   (the layer with no z uses the hair front position). Both layers take the one Hair color. A hair trait with no back layer just lists the front.
// To change the order, edit CATEGORY_Z.

const CANVAS = { w: 380, h: 600 };

// (leftHand = acc back, hairBack is only used by a hair trait's back layer, hair = hair front, rightHand = front acc)
const CATEGORY_Z = { backgrounds: 0, hairBack: 8, bottoms: 10, tops: 20, leftHand: 25, face: 30, eyes: 40, hair: 50, hats: 60, rightHand: 82 };

// the tabs: [key, label, which panel]. Left panel = the body, right panel = accessories, background and colors.
const TABS = [
  ['outfits', 'Outfits', 'left'], ['face', 'Head', 'left'], ['eyes', 'Eyes', 'left'], ['tops', 'Tops', 'left'], ['bottoms', 'Bottoms', 'left'], ['hair', 'Hair', 'left'],
  ['hats', 'Hats', 'right'], ['leftHand', 'L Acc.', 'right'], ['rightHand', 'R Acc.', 'right'], ['backgrounds', 'B.G.', 'right'], ['colors', 'Colors', 'right']
];
// these always have something selected (no None tile); everything else is optional.
// Eyes are optional so a head with its own eyes drawn in (hasEyes, see below) can be worn with no eyes on top.
const REQUIRED = ['tops', 'bottoms', 'face'];
// set to true to hide tabs that have nothing in them yet
const HIDE_EMPTY_TABS = false;

// ---------- sets ----------
// A set is a group of traits that were made together. Each set has its own folder inside the artwork folder (named after the set),
// so files with the same or similar names in different sets never clash. The names are stored here for later; nothing shows them yet.
//   colors:      the set's ORIGINAL colors (body = skin, eyes, hair). The Outfits tab always shows the set in these, and picking
//                the outfit puts them on the avatar. Leave a color out if the set doesn't have one: that color is left as it is.
//                An outfit (or a trait) can carry its own  colors: { ... }  too: those override the set's, color by color, for that item only.
//                Add  ?livecolors  to the page address to see the Outfits tiles in the colors you pick (handy for choosing originals).
//   background:  the id of the set's paired background image. Picking the outfit switches to it. Leave it out if the set has none.
//                An outfit can carry its own  background: '<id>'  too, for a set whose outfits don't share one.
//   clearBackground: true  for a set with no background of its own whose outfits should be worn on transparency: picking one of its
//                outfits sets the background to None (the visitor can change it afterwards). Without it, a set with no background
//                leaves the current background as it is.
// MENU SECTIONS: every tab groups its tiles under dividers, in this order. A trait's section comes from its set:
//   'personal' = my own creator-program sets; 'reddit' = a set with  reddit: true  (work I made for Reddit);
//   'base' = an item with  base: true  (the base Snoo, made by Reddit). Empty sections are skipped. Change the labels here.
const SECTIONS = [
  { key: 'personal', label: 'Made 4 Reddit creator program' },
  { key: 'reddit', label: 'Made 4 Reddit' },
  { key: 'base', label: 'Snoo base \u00b7 by Reddit' }
];
// COLLECTIBLE: a set with  collectible: true  is part of the collectible line. Its Outfits tile gets the holographic hover (HOLO below);
// a set without it (anything added later that isn't collectible) shows a plain tile. Its traits belong to the set, so they share the flag.
const SETS = {
  'bodegacatceo': { name: 'bodegacatceo', short: 'Bodega', number: '003', colors: { body: '#9E9C91', eyes: '#000000' }, background: 'bodega', collectible: true },
  'lil-bliss':    { name: "Lil' Bliss", number: '004', colors: { body: '#FFF800', eyes: '#000000' }, background: 'angel', collectible: true },
  'lil-blaze':    { name: "Lil' Blaze", number: '005', colors: { body: '#FF0C00', eyes: '#000000' }, background: 'devil', collectible: true },
  // lil-marco is drawn in full color (PNG files, no recolorable shapes), so it has no `colors` to list and nothing in it can be recolored
  'lil-marco':    { name: "Lil' Marco", number: '006', background: 'possum', collectible: true },
  // big-g is full-color PNG art too (nothing recolorable), so no `colors`; its original look has no hat
  'big-g':        { name: 'Big G', number: '007', background: 'raccoon', collectible: true },
  // mr-bossman is full-color PNG art too (nothing recolorable), so no `colors`
  'mr-bossman':   { name: 'Mr. Bossman', number: '001', background: 'rat', collectible: true },
  // full-color PNGs, nothing recolorable; the head has its own eyes, so the set has no Eyes trait and wearing it takes eyes off
  'guardian-of-the-realms': { name: 'Guardian of the Realms', background: 'realms', collectible: true },
  // full-color PNGs, nothing recolorable, no hat
  'eye-of-the-beholder': { name: 'Eye of the Beholder', background: 'beholder', collectible: true },
  // full-color PNGs, nothing recolorable, no hat
  'snitches-get-stitches': { name: 'Snitches Get Stitches', background: 'stitches', collectible: true },
  // full-color vector SVGs with no marker colors, so nothing on it recolors. The legs file also holds the little figure seen
  // through the gaps in the puzzle head.
  'cp3crash': { name: 'Captcha', background: 'captcha', collectible: true, reddit: true },
  // full-color PNGs, nothing recolorable; no back accessory
  'deadass': { name: 'Deadass', background: 'deadass', collectible: true },
  // plain full-color SVGs (used as images, nothing recolorable); no accessories
  'pickle-guy': { name: 'Pickle Guy', background: 'pickle', collectible: true },
  // full-color PNGs, nothing recolorable; no hat, no accessories
  'gummy': { name: 'Gummy', background: 'gummy', collectible: true },
  // Reddit work, not collectible: no outfit and no background, just individual pieces (two tops, back and front accessories).
  // Vector SVGs; the lime shapes (hands and arms) take the Skin color.
  'june23': { name: 'June 23', collectible: false, reddit: true, colors: { body: '#FFFFFF' } },
  // Reddit work, not collectible: single traits only (no outfit, no background), including the base Snoo (head, eyes, body, legs).
  // Vector SVGs: lime shapes take the Skin color,
  // yellow the Eyes color, blue the Hair color. Original colors are the classic Snoo's: white body, orange-red eyes.
  'bhm23': { name: 'BHM 23', collectible: false, reddit: true, colors: { body: '#FFFFFF', eyes: '#FF4500' } },
  // Reddit work, not collectible: onboarding outfits (Alt grunge, Funky, Gamer girl, Gamer guy, Gen Z, Tracksuit). No backgrounds, so wearing either one clears the
  // background to None. Vector SVGs: lime shapes take the Skin color, yellow the Eyes color, blue the Hair color.
  'onboarding24': { name: 'Onboarding 24', collectible: false, reddit: true, colors: { body: '#FFFFFF', eyes: '#000000' }, clearBackground: true },
  // Reddit work, collectible: onboarding outfits from 2023 (Druid, Bard, Fighter, Mage). Each outfit has its own background.
  // Vector SVGs: lime shapes take the Skin color, yellow the Eyes color. Each outfit carries its own original colors (from Reddit's composite).
  // Bard's eyes are closed, drawn in fixed colors, so they don't recolor.
  'onboarding23': { name: 'Onboarding 23', collectible: true, reddit: true },
  // Reddit work, collectible: two full outfits (Bye bye awards and Downvote guy), both in the expressions folder.
  // Each outfit has its own background. Vector SVGs: lime shapes take the Skin color.
  // The eyes in both are drawn in fixed colors (no eye-color marker), so they don't recolor.
  'expressions': { name: 'Expressions', collectible: true, reddit: true, colors: { body: '#FFFFFF' } }
};
const ART = 'media/reddit-avatars/builder/';     // the artwork folder; each set's folder sits inside it
// layer helpers for one set's folder:  bodega.layer('x.png')  /  bodega.svg('x.svg')
const inSet = folder => ({
  layer: (file, extra) => Object.assign({ src: ART + folder + '/' + file }, extra || {}),
  svg: (file, extra) => Object.assign({ svgSrc: ART + folder + '/' + file }, extra || {})
});
const bodega = inSet('bodegacatceo');      // set 003
const bliss = inSet('lil-bliss');          // set 004
const blaze = inSet('lil-blaze');         // set 005
const marco = inSet('lil-marco');         // set 006
const biggy = inSet('big-g');             // set 007
const boss = inSet('mr-bossman');         // set 001
const guard = inSet('guardian-of-the-realms');
const eye = inSet('eye-of-the-beholder');
const stitch = inSet('snitches-get-stitches');
const captcha = inSet('cp3crash');
const dead = inSet('deadass');
const pickle = inSet('pickle-guy');
const gummy = inSet('gummy');
const june = inSet('june23');
const bhm = inSet('bhm23');
const onb = inSet('onboarding24');
const onb23 = inSet('onboarding23');
const expr = inSet('expressions');

const TRAITS = {
  outfits: [
    // no back accessory: wearing it takes any L Acc. off
    { id: 'deadass', set: 'deadass', name: 'Deadass', sets: { tops: 'deadass', bottoms: 'deadass', face: 'deadass', eyes: 'deadass', hats: 'ny-cap', rightHand: 'pizza-rat' } },
    // no accessories: wearing it takes both off
    { id: 'pickle', set: 'pickle-guy', name: 'Pickle Guy', sets: { tops: 'pickle', bottoms: 'pickle', face: 'pickle', eyes: 'pickle', hats: 'pickle-hat' } },
    // no hat and no accessories: wearing it takes all three off
    { id: 'gummy', set: 'gummy', name: 'Gummy', sets: { tops: 'gummy', bottoms: 'gummy', face: 'gummy', eyes: 'gummy' } },
    // a complete fit (no background): picking it fills all of these slots
    { id: 'set-003', set: 'bodegacatceo', name: 'Set 003', sets: { tops: 'set-003', bottoms: 'set-003', face: 'set-003', eyes: 'set-003', leftHand: 'try-me', rightHand: 'pigeon' } },   // no hat: the Toast is there to add if the visitor wants it,
    { id: 'set-004', set: 'lil-bliss', name: 'Set 004', sets: { tops: 'set-004', bottoms: 'set-004', face: 'set-004', eyes: 'set-004', hats: 'halo', leftHand: 'wings', rightHand: 'set-004' } },
    { id: 'set-005', set: 'lil-blaze', name: 'Set 005', sets: { tops: 'set-005', bottoms: 'set-005', face: 'set-005', eyes: 'set-005', hats: 'imp', leftHand: 'bat-wings', rightHand: 'set-005' } },
    // set 006 has no hat: its original look is no hat, so wearing it takes off any hat (a hat can still be added afterwards)
    { id: 'set-006', set: 'lil-marco', name: 'Set 006', sets: { tops: 'set-006', bottoms: 'set-006', face: 'set-006', eyes: 'set-006', leftHand: 'lid', rightHand: 'set-006' } },
    // no hat in this set either, so wearing it takes any hat off
    { id: 'set-007', set: 'big-g', name: 'Set 007', sets: { tops: 'set-007', bottoms: 'set-007', face: 'set-007', eyes: 'set-007', leftHand: 'set-007', rightHand: 'set-007' } },
    { id: 'set-001', set: 'mr-bossman', name: 'Set 001', sets: { tops: 'set-001', bottoms: 'set-001', face: 'set-001', eyes: 'set-001', hats: 'bandage', leftHand: 'cane', rightHand: 'cash' } },
    // no eyes and no hat: wearing it takes both off (the cat head has its own eyes)
    { id: 'guardian', set: 'guardian-of-the-realms', name: 'Guardian', sets: { tops: 'guardian', bottoms: 'guardian', face: 'guardian', leftHand: 'sparkles', rightHand: 'ghosts' } },
    // no hat: wearing it takes any hat off
    { id: 'beholder', set: 'eye-of-the-beholder', name: 'Beholder', sets: { tops: 'beholder', bottoms: 'beholder', face: 'beholder', eyes: 'beholder', leftHand: 'skull-flame-back', rightHand: 'skull-flame' } },
    // no hat: wearing it takes any hat off
    { id: 'stitches', set: 'snitches-get-stitches', name: 'Stitches', sets: { tops: 'stitches', bottoms: 'stitches', face: 'stitches', eyes: 'stitches', leftHand: 'heart', rightHand: 'needle' } },
    // no hair in either Expressions outfit; Downvote guy has no back accessory
    { id: 'bye-bye-awards', set: 'expressions', name: 'Bye bye awards', background: 'bye-bye-awards', sets: { tops: 'bye-bye-awards', bottoms: 'bye-bye-awards', face: 'bye-bye-awards', eyes: 'bye-bye-awards', hats: 'bye-bye-awards-cat-hat', leftHand: 'bye-bye-awards-rocket', rightHand: 'bye-bye-awards-duck' } },
    { id: 'downvote-guy', set: 'expressions', name: 'Downvote guy', background: 'downvote-guy', sets: { tops: 'downvote-guy', bottoms: 'downvote-guy', face: 'downvote-guy', eyes: 'downvote-guy', hats: 'downvote-guy-cap', rightHand: 'downvote-guy-dog' } },
    { id: 'captcha', set: 'cp3crash', name: 'Captcha', sets: { tops: 'captcha', bottoms: 'captcha', face: 'captcha', eyes: 'captcha', hats: 'captcha-pieces', leftHand: 'captcha-sign', rightHand: 'captcha-shield' } },
    // no hair and no back accessory
    { id: 'druid', set: 'onboarding23', name: 'Druid', background: 'druid', colors: { body: '#9ADB52', eyes: '#031619' }, sets: { tops: 'druid', bottoms: 'druid', face: 'druid', eyes: 'druid', hats: 'druid-nest', rightHand: 'druid-stick' } },
    // no hair and no back accessory
    { id: 'bard', set: 'onboarding23', name: 'Bard', background: 'bard', colors: { body: '#FFFFFF' }, sets: { tops: 'bard', bottoms: 'bard', face: 'bard', eyes: 'bard', hats: 'bard-banana', rightHand: 'bard-ukulele' } },
    // no hair
    { id: 'fighter', set: 'onboarding23', name: 'Fighter', background: 'fighter', colors: { body: '#FFFFFF', eyes: '#FF3924' }, sets: { tops: 'fighter', bottoms: 'fighter', face: 'fighter', eyes: 'fighter', hats: 'fighter-headgear', leftHand: 'fighter-keyboard', rightHand: 'fighter-shield' } },
    // no hair and no hat
    { id: 'mage', set: 'onboarding23', name: 'Mage', background: 'mage', colors: { body: '#C7E3FF', eyes: '#78B5FF' }, sets: { tops: 'mage', bottoms: 'mage', face: 'mage', eyes: 'mage', leftHand: 'mage-book', rightHand: 'mage-ray-gun' } },
    // onboarding outfits (no background: worn on transparency). None has a front accessory; Alt grunge has no hair.
    { id: 'altgrunge', set: 'onboarding24', name: 'Alt grunge', sets: { tops: 'altgrunge', bottoms: 'altgrunge', face: 'altgrunge', eyes: 'altgrunge-sunglasses', hats: 'altgrunge-hood', leftHand: 'altgrunge-phone' } },
    { id: 'funky', set: 'onboarding24', name: 'Funky', colors: { hair: '#32312F' }, sets: { tops: 'funky', bottoms: 'funky', face: 'funky', eyes: 'funky', hair: 'funky', hats: 'funky-visor', leftHand: 'funky-juice' } },
    { id: 'gamergirl', set: 'onboarding24', name: 'Gamer girl', colors: { hair: '#492F1D' }, sets: { tops: 'gamergirl', bottoms: 'gamergirl', face: 'gamergirl', eyes: 'gamergirl', hair: 'gamergirl', hats: 'gamergirl-headset', leftHand: 'gamergirl-controller' } },
    { id: 'gamerguy', set: 'onboarding24', name: 'Gamer guy', colors: { hair: '#775218' }, sets: { tops: 'gamerguy', bottoms: 'gamerguy', face: 'gamerguy', eyes: 'gamerguy', hair: 'gamerguy', hats: 'gamerguy-headset', leftHand: 'gamerguy-joystick' } },
    { id: 'genz', set: 'onboarding24', name: 'Gen Z', colors: { hair: '#E49234' }, sets: { tops: 'genz', bottoms: 'genz', face: 'genz', eyes: 'genz', hair: 'genz', hats: 'genz-bucket-hat', leftHand: 'genz-bag' } },
    { id: 'tracksuit', set: 'onboarding24', name: 'Tracksuit', colors: { hair: '#BA5220' }, sets: { tops: 'tracksuit', bottoms: 'tracksuit', face: 'tracksuit', eyes: 'tracksuit', hair: 'tracksuit', hats: 'tracksuit-cap', leftHand: 'tracksuit-bottle' } },
    // the base Snoo, whole: head, eyes, body and legs; wearing it takes off hair, hat and accessories (it has no background, so the current one stays)
    { id: 'snoo', set: 'bhm23', name: 'Snoo', base: true, sets: { tops: 'snoo-body', bottoms: 'snoo-legs', face: 'snoo-head', eyes: 'snoo-eyes' } }
  ],
  tops: [                                                                                                     // body
    { id: 'set-003', set: 'bodegacatceo', name: 'Set 003', layers: [bodega.svg('combined-body_003.svg')] },
    // the little devil on top touches the body, so its tile is cropped by hand to leave it out (it still shows on the avatar)
    { id: 'set-004', set: 'lil-bliss', name: 'Set 004', layers: [bliss.svg('combined-body_004.svg')], crop: [98, 347, 304, 501] },
    // the little angel on top touches the body, so its tile is cropped by hand to leave it out (it still shows on the avatar)
    { id: 'set-005', set: 'lil-blaze', name: 'Set 005', layers: [blaze.svg('combined-body_005.svg')], crop: [97, 342, 305, 510] },
    // lil-marco is plain full-color art (PNG files): no recolorable shapes, so it is shown exactly as drawn
    { id: 'set-006', set: 'lil-marco', name: 'Set 006', layers: [marco.layer('body_003_2x.png')] },
    // the skull floats above the jacket (it sits behind the head), so this tile is cropped by hand to the jacket; the skull still shows on the avatar
    { id: 'set-007', set: 'big-g', name: 'Set 007', layers: [biggy.layer('body_002_2x.png')], crop: [113, 346, 295, 501] },
    // same as Big G: the skull floats above the jacket (behind the head), so the tile is cropped by hand to the jacket; the skull still shows on the avatar
    { id: 'set-001', set: 'mr-bossman', name: 'Set 001', layers: [boss.layer('body_001_2x.png')], crop: [112, 339, 295, 498] },
    { id: 'guardian', set: 'guardian-of-the-realms', name: 'Green pumpkin', layers: [guard.layer('body_003_2x.png')] },
    { id: 'beholder', set: 'eye-of-the-beholder', name: 'Zombie torso', layers: [eye.layer('body_002_2x.png')] },
    { id: 'stitches', set: 'snitches-get-stitches', name: 'Patchwork torso', layers: [stitch.layer('body_001_2x.png')] },
    { id: 'captcha', set: 'cp3crash', name: 'Puzzle body', layers: [captcha.svg('body_001_b7672d.svg')] },
    { id: 'deadass', set: 'deadass', name: 'Puffer jacket', layers: [dead.layer('body_001_2x.png')] },
    { id: 'pickle', set: 'pickle-guy', name: 'Pickle top', layers: [pickle.layer('body_002.svg')] },
    { id: 'gummy', set: 'gummy', name: 'Gummy top', layers: [gummy.layer('body_003_2x.png')] },
    { id: 'love-wins-tee', set: 'june23', name: 'Love Wins tee', layers: [june.svg('body_001.svg')] },
    { id: 'rainbow-tee', set: 'june23', name: 'Black rainbow tee', layers: [june.svg('body_008.svg')] },
    { id: 'altgrunge', set: 'onboarding24', name: 'Black jacket', layers: [onb.svg('altgrunge-upperbody.svg')] },
    { id: 'funky', set: 'onboarding24', name: 'Camo tee', layers: [onb.svg('funky-upperbody.svg')] },
    { id: 'gamergirl', set: 'onboarding24', name: 'Heart tee', layers: [onb.svg('gamergirl-upperbody.svg')] },
    { id: 'gamerguy', set: 'onboarding24', name: 'Pixel tee', layers: [onb.svg('gamerguy-upperbody.svg')] },
    { id: 'genz', set: 'onboarding24', name: 'Smiley crop top', layers: [onb.svg('genz-upperbody.svg')] },
    { id: 'tracksuit', set: 'onboarding24', name: 'Track jacket', layers: [onb.svg('tracksuit-upperbody.svg')] },
    { id: 'druid', set: 'onboarding23', name: 'Leaf collar', colors: { body: '#9ADB52', eyes: '#031619' }, layers: [onb23.svg('body_001_1c2dea.svg')] },
    { id: 'bard', set: 'onboarding23', name: 'Cat tee and cape', colors: { body: '#FFFFFF' }, layers: [onb23.svg('body_002_1.svg')] },
    { id: 'fighter', set: 'onboarding23', name: 'Orange fight top', colors: { body: '#FFFFFF', eyes: '#FF3924' }, layers: [onb23.svg('body_003_1f9d01.svg')] },
    { id: 'mage', set: 'onboarding23', name: 'Lab coat', colors: { body: '#C7E3FF', eyes: '#78B5FF' }, layers: [onb23.svg('body_004.svg')] },
    { id: 'bye-bye-awards', set: 'expressions', name: 'Gold hoodie', layers: [expr.svg('body_001_d8e1d5.svg')] },
    { id: 'downvote-guy', set: 'expressions', name: 'Jacket and hoodie', layers: [expr.svg('body_003_1.svg')] },
    { id: 'snoo-body', set: 'bhm23', name: 'Snoo body', base: true, layers: [bhm.svg('body_013.svg')] }
  ],
  bottoms: [                                                                                                  // body bottom
    { id: 'set-003', set: 'bodegacatceo', name: 'Set 003', layers: [bodega.layer('body_bottom_003_3x_1.png')] },
    // the heart above the legs is part of this piece, so its tile shows all of it (fullTile)
    { id: 'set-004', set: 'lil-bliss', name: 'Set 004', layers: [bliss.svg('combined-body_bottom_004.svg')], fullTile: true },
    { id: 'set-005', set: 'lil-blaze', name: 'Set 005', layers: [blaze.svg('combined-body_bottom_005.svg')] },
    { id: 'set-006', set: 'lil-marco', name: 'Set 006', layers: [marco.layer('body_bottom_003_2x.png')] },
    { id: 'set-007', set: 'big-g', name: 'Set 007', layers: [biggy.layer('body_bottom_002_2x.png')] },
    { id: 'set-001', set: 'mr-bossman', name: 'Set 001', layers: [boss.layer('body_bottom_001_2x.png')] },
    { id: 'guardian', set: 'guardian-of-the-realms', name: 'Jack-o-lantern', layers: [guard.layer('body_bottom_003_2x.png')] },
    { id: 'beholder', set: 'eye-of-the-beholder', name: 'Zombie legs', layers: [eye.layer('body_bottom_002_2x.png')] },
    { id: 'stitches', set: 'snitches-get-stitches', name: 'Patchwork legs', layers: [stitch.layer('body_bottom_001_2x.png')] },
    { id: 'captcha', set: 'cp3crash', name: 'Puzzle legs', layers: [captcha.svg('body_bottom_001_36b1db.svg')] },
    { id: 'deadass', set: 'deadass', name: 'Jeans and boots', layers: [dead.layer('body_bottom_001_2x.png')] },
    { id: 'pickle', set: 'pickle-guy', name: 'Pickle bottom', layers: [pickle.layer('body_bottom_002.svg')] },
    { id: 'gummy', set: 'gummy', name: 'Gummy bottom', layers: [gummy.layer('body_bottom_003_2x.png')] },
    { id: 'altgrunge', set: 'onboarding24', name: 'Chain shorts', layers: [onb.svg('altgrunge-bottom.svg')] },
    { id: 'funky', set: 'onboarding24', name: 'Shorts and clogs', layers: [onb.svg('funky-bottom.svg')] },
    { id: 'gamergirl', set: 'onboarding24', name: 'Shorts and pink slides', layers: [onb.svg('gamergirl-bottom.svg')] },
    { id: 'gamerguy', set: 'onboarding24', name: 'Plaid shorts and slides', layers: [onb.svg('gamerguy-bottom.svg')] },
    { id: 'genz', set: 'onboarding24', name: 'Orange shorts and sneakers', layers: [onb.svg('genz-bottom.svg')] },
    { id: 'tracksuit', set: 'onboarding24', name: 'Track pants', layers: [onb.svg('tracksuit-bottom.svg')] },
    { id: 'druid', set: 'onboarding23', name: 'Narwhal ride', colors: { body: '#9ADB52', eyes: '#031619' }, layers: [onb23.svg('body_bottom_001_68d72c.svg')] },
    { id: 'bard', set: 'onboarding23', name: 'Red shorts and sneakers', colors: { body: '#FFFFFF' }, layers: [onb23.svg('body_bottom_002_1.svg')] },
    { id: 'fighter', set: 'onboarding23', name: 'Fight shorts', colors: { body: '#FFFFFF', eyes: '#FF3924' }, layers: [onb23.svg('body_bottom_003_1.svg')] },
    { id: 'mage', set: 'onboarding23', name: 'Hover base', colors: { body: '#C7E3FF', eyes: '#78B5FF' }, layers: [onb23.svg('body_bottom_004.svg')] },
    { id: 'bye-bye-awards', set: 'expressions', name: 'Gift box', layers: [expr.svg('body_bottom_001_1.svg')] },
    { id: 'downvote-guy', set: 'expressions', name: 'Ripped jeans and sneakers', layers: [expr.svg('body_bottom_003.svg')] },
    { id: 'snoo-legs', set: 'bhm23', name: 'Snoo legs', base: true, layers: [bhm.svg('body_bottom_013.svg')] }
  ],
  hair: [
    { id: 'buns-braids', set: 'bhm23', name: 'Space buns with braids', layers: [bhm.svg('hair_back_004.svg', { z: CATEGORY_Z.hairBack }), bhm.svg('hair_004.svg')] },
    { id: 'long-waves', set: 'bhm23', name: 'Long waves', layers: [bhm.svg('hair_back_005.svg', { z: CATEGORY_Z.hairBack }), bhm.svg('hair_005.svg')] },
    { id: 'short-bob', set: 'bhm23', name: 'Short bob', layers: [bhm.svg('hair_back_006.svg', { z: CATEGORY_Z.hairBack }), bhm.svg('hair_006.svg')] },
    { id: 'swept-fringe', set: 'bhm23', name: 'Swept fringe', layers: [bhm.svg('hair_007.svg')] },
    { id: 'locs', set: 'bhm23', name: 'Locs', layers: [bhm.svg('hair_back_008.svg', { z: CATEGORY_Z.hairBack }), bhm.svg('hair_008.svg')] },
    { id: 'curls', set: 'bhm23', name: 'Curls', layers: [bhm.svg('hair_back_009.svg', { z: CATEGORY_Z.hairBack }), bhm.svg('hair_009.svg')] },
    { id: 'box-braids', set: 'bhm23', name: 'Braids', layers: [bhm.svg('hair_010.svg')] },
    { id: 'braids-bun', set: 'bhm23', name: 'Braids with bun', layers: [bhm.svg('hair_back_011.svg', { z: CATEGORY_Z.hairBack }), bhm.svg('hair_011.svg')] },
    { id: 'swoop-puff', set: 'bhm23', name: 'Swoop with puff', layers: [bhm.svg('hair_back_012.svg', { z: CATEGORY_Z.hairBack }), bhm.svg('hair_012.svg')] },
    { id: 'curls-headwrap', set: 'bhm23', name: 'Curls with headwrap', layers: [bhm.svg('hair_001.svg')] },
    { id: 'beaded-braids', set: 'bhm23', name: 'Beaded braids', layers: [bhm.svg('hair_back_002.svg', { z: CATEGORY_Z.hairBack }), bhm.svg('hair_002.svg')] },
    { id: 'knotted-updo', set: 'bhm23', name: 'Knotted updo', layers: [bhm.svg('hair_back_003.svg', { z: CATEGORY_Z.hairBack }), bhm.svg('hair_003.svg')] },
    { id: 'funky', set: 'onboarding24', name: 'Wavy hair', colors: { hair: '#32312F' }, layers: [onb.svg('funky-hair.svg')], originalInMenu: false },
    { id: 'gamergirl', set: 'onboarding24', name: 'Long layers', colors: { hair: '#492F1D' }, layers: [onb.svg('gamergirl-hair.svg')], originalInMenu: false },
    { id: 'gamerguy', set: 'onboarding24', name: 'Messy fringe', colors: { hair: '#775218' }, layers: [onb.svg('gamerguy-hair.svg')], originalInMenu: false },
    { id: 'genz', set: 'onboarding24', name: 'Shag', colors: { hair: '#E49234' }, layers: [onb.svg('genz-hair.svg')], originalInMenu: false },
    { id: 'tracksuit', set: 'onboarding24', name: 'Short hair and beard', colors: { hair: '#BA5220' }, layers: [onb.svg('tracksuit-hair.svg')], originalInMenu: false }
  ],
  face: [                                                                                                     // lower face
    { id: 'set-003', set: 'bodegacatceo', name: 'Set 003', layers: [bodega.svg('combined-face_lower_003.svg')] },
    { id: 'set-004', set: 'lil-bliss', name: 'Set 004', layers: [bliss.svg('combined-face_lower_004.svg')] },
    { id: 'set-005', set: 'lil-blaze', name: 'Set 005', layers: [blaze.svg('combined-face_lower_005.svg')] },
    { id: 'set-006', set: 'lil-marco', name: 'Set 006', layers: [marco.layer('face_lower_003_2x.png')] },
    { id: 'set-007', set: 'big-g', name: 'Set 007', layers: [biggy.layer('face_lower_002_2x.png')] },
    { id: 'set-001', set: 'mr-bossman', name: 'Set 001', layers: [boss.layer('face_lower_001_2x.png')] },
    { id: 'guardian', set: 'guardian-of-the-realms', name: 'Three-eyed cat', layers: [guard.layer('face_lower_003_2x.png')], hasEyes: true },
    { id: 'beholder', set: 'eye-of-the-beholder', name: 'Zombie hand', layers: [eye.layer('face_lower_002_2x.png')] },
    { id: 'stitches', set: 'snitches-get-stitches', name: 'Voodoo head', layers: [stitch.layer('face_lower_001_2x.png')] },
    { id: 'captcha', set: 'cp3crash', name: 'Puzzle head', layers: [captcha.svg('face_lower_001_04ea8e.svg')] },
    { id: 'deadass', set: 'deadass', name: 'Skull', layers: [dead.layer('face_lower_001_2x.png')] },
    { id: 'pickle', set: 'pickle-guy', name: 'Pickle head', layers: [pickle.layer('face_lower_002.svg')] },
    { id: 'gummy', set: 'gummy', name: 'Gummy head', layers: [gummy.layer('face_lower_003_2x.png')] },
    { id: 'altgrunge', set: 'onboarding24', name: 'Pierced head', layers: [onb.svg('altgrunge-lowerface.svg')] },
    { id: 'funky', set: 'onboarding24', name: 'Kissy head', layers: [onb.svg('funky-lowerface.svg')] },
    { id: 'gamergirl', set: 'onboarding24', name: 'Sweet smile head', layers: [onb.svg('gamergirl-lowerface.svg')] },
    { id: 'gamerguy', set: 'onboarding24', name: 'Grin head', layers: [onb.svg('gamerguy-lowerface.svg')] },
    { id: 'genz', set: 'onboarding24', name: 'Soft smile head', layers: [onb.svg('genz-lowerface.svg')] },
    { id: 'tracksuit', set: 'onboarding24', name: 'Calm smile head', layers: [onb.svg('tracksuit-lowerface.svg')] },
    { id: 'druid', set: 'onboarding23', name: 'Antler cat head', colors: { body: '#9ADB52', eyes: '#031619' }, layers: [onb23.svg('face_lower_001_6e5bc9.svg')] },
    { id: 'bard', set: 'onboarding23', name: 'Laughing head', colors: { body: '#FFFFFF' }, layers: [onb23.svg('face_lower_002_1.svg')] },
    { id: 'fighter', set: 'onboarding23', name: 'Mouse antenna head', colors: { body: '#FFFFFF', eyes: '#FF3924' }, layers: [onb23.svg('face_lower_003_d0c08f.svg')] },
    { id: 'mage', set: 'onboarding23', name: 'Robot head', colors: { body: '#C7E3FF', eyes: '#78B5FF' }, layers: [onb23.svg('face_lower_004.svg')] },
    { id: 'bye-bye-awards', set: 'expressions', name: 'Crown head', layers: [expr.svg('face_lower_001_1.svg')] },
    { id: 'downvote-guy', set: 'expressions', name: 'Banana earring head', layers: [expr.svg('face_lower_003_1.svg')] },
    { id: 'snoo-head', set: 'bhm23', name: 'Snoo head', base: true, layers: [bhm.svg('face_lower_013.svg')] }
  ],
  eyes: [                                                                                                     // upper face
    { id: 'set-003', set: 'bodegacatceo', name: 'Set 003', layers: [bodega.svg('combined-face_upper_003.svg')] },
    { id: 'set-004', set: 'lil-bliss', name: 'Set 004', layers: [bliss.svg('face_upper_004.svg')] },
    { id: 'set-005', set: 'lil-blaze', name: 'Set 005', layers: [blaze.svg('face_upper_005.svg')] },
    { id: 'set-006', set: 'lil-marco', name: 'Set 006', layers: [marco.layer('face_upper_003_2x.png')] },
    { id: 'set-007', set: 'big-g', name: 'Set 007', layers: [biggy.layer('face_upper_002_2x.png')] },
    { id: 'set-001', set: 'mr-bossman', name: 'Set 001', layers: [boss.layer('face_upper_001_2x.png')] },
    { id: 'beholder', set: 'eye-of-the-beholder', name: 'Stitched eye', layers: [eye.layer('face_upper_002_2x.png')] },
    { id: 'stitches', set: 'snitches-get-stitches', name: 'Button eye', layers: [stitch.layer('face_upper_001_2x.png')] },
    { id: 'captcha', set: 'cp3crash', name: 'Green eyes', layers: [captcha.svg('face_upper_001_a58a2b.svg')] },
    { id: 'deadass', set: 'deadass', name: 'Eye sockets', layers: [dead.layer('face_upper_001_2x.png')] },
    { id: 'pickle', set: 'pickle-guy', name: 'Pickle eyes', layers: [pickle.layer('face_upper_002.svg')] },
    { id: 'gummy', set: 'gummy', name: 'Gummy eyes', layers: [gummy.layer('face_upper_003_2x.png')] },
    { id: 'lidded-eyes', set: 'bhm23', name: 'Lidded eyes', layers: [bhm.svg('face_upper_005.svg')] },
    { id: 'lidded-eyes-lashes', set: 'bhm23', name: 'Lidded eyes with lashes', layers: [bhm.svg('face_upper_008.svg')] },
    { id: 'side-eye', set: 'bhm23', name: 'Side-eye', layers: [bhm.svg('face_upper_010.svg')] },
    { id: 'altgrunge-sunglasses', set: 'onboarding24', name: 'Sunglasses', layers: [onb.svg('altgrunge-upperface.svg')] },
    { id: 'funky', set: 'onboarding24', name: 'Sleepy eyes', layers: [onb.svg('funky-upperface.svg')] },
    { id: 'gamergirl', set: 'onboarding24', name: 'Lash flick eyes', layers: [onb.svg('gamergirl-upperface.svg')] },
    { id: 'gamerguy', set: 'onboarding24', name: 'Focused eyes', layers: [onb.svg('gamerguy-upperface.svg')] },
    { id: 'genz', set: 'onboarding24', name: 'Sparkle eyes', layers: [onb.svg('genz-upperface.svg')] },
    { id: 'tracksuit', set: 'onboarding24', name: 'Unbothered eyes', layers: [onb.svg('tracksuit-upperface.svg')] },
    { id: 'druid', set: 'onboarding23', name: 'Sparkle cat eyes', colors: { body: '#9ADB52', eyes: '#031619' }, layers: [onb23.svg('face_upper_001_a14b5c.svg')] },
    { id: 'bard', set: 'onboarding23', name: 'Tears of joy', layers: [onb23.svg('face_upper_002_1.svg')] },
    { id: 'fighter', set: 'onboarding23', name: 'Fierce eyes', colors: { body: '#FFFFFF', eyes: '#FF3924' }, layers: [onb23.svg('face_upper_003_6d0db2.svg')] },
    { id: 'mage', set: 'onboarding23', name: 'Round eyes', colors: { body: '#C7E3FF', eyes: '#78B5FF' }, layers: [onb23.svg('face_upper_004.svg')] },
    { id: 'bye-bye-awards', set: 'expressions', name: 'Blue eyes', layers: [expr.svg('face_upper_001_1.svg')] },
    { id: 'downvote-guy', set: 'expressions', name: 'Blue sunglasses', layers: [expr.svg('face_upper_003_1.svg')] },
    { id: 'snoo-eyes', set: 'bhm23', name: 'Snoo eyes', base: true, layers: [bhm.svg('face_upper_013.svg')] }
  ],
  hats: [                                                                                                     // head accessory
    { id: 'set-003', set: 'bodegacatceo', name: 'Toast', layers: [bodega.layer('head_accessory_003_3x_1.png')] },
    { id: 'halo', set: 'lil-bliss', name: 'Halo', layers: [bliss.layer('head_accessory_004_3x.png')] },
    { id: 'imp', set: 'lil-blaze', name: 'Imp', layers: [blaze.svg('combined-head_accessory_005.svg')] },
    { id: 'bandage', set: 'mr-bossman', name: 'Bandage', layers: [boss.layer('head_accessory_001_2x.png')] },
    { id: 'ny-cap', set: 'deadass', name: 'NY cap', layers: [dead.layer('head_accessory_001_2x.png')] },
    { id: 'pickle-hat', set: 'pickle-guy', name: 'Pickle hat', layers: [pickle.layer('head_accessory_002.svg')] },
    { id: 'captcha-pieces', set: 'cp3crash', name: 'Puzzle pieces', layers: [captcha.svg('head_accessory_001_3468b2.svg')] },
    { id: 'gold-earrings', set: 'bhm23', name: 'Gold earrings', layers: [bhm.svg('head_accessory_005.svg')] },
    { id: 'gold-studs', set: 'bhm23', name: 'Gold studs', layers: [bhm.svg('head_accessory_001.svg')] },
    { id: 'gold-hoops', set: 'bhm23', name: 'Gold hoops', layers: [bhm.svg('head_accessory_003.svg')] },
    { id: 'altgrunge-hood', set: 'onboarding24', name: 'Black hood', layers: [onb.svg('altgrunge-head-acc.svg')] },
    { id: 'funky-visor', set: 'onboarding24', name: 'Lime visor', layers: [onb.svg('funky-head-acc.svg')] },
    { id: 'gamergirl-headset', set: 'onboarding24', name: 'Cat-ear headset', layers: [onb.svg('gamergirl-head-acc.svg')] },
    { id: 'gamerguy-headset', set: 'onboarding24', name: 'Lime headset', layers: [onb.svg('gamerguy-head-acc.svg')] },
    { id: 'genz-bucket-hat', set: 'onboarding24', name: 'Yellow bucket hat', layers: [onb.svg('genz-head-acc.svg')] },
    { id: 'tracksuit-cap', set: 'onboarding24', name: 'Teal cap', layers: [onb.svg('tracksuit-head-acc.svg')] },
    { id: 'druid-nest', set: 'onboarding23', name: 'Bird nest', layers: [onb23.svg('head_accessory_001_8b4d28.svg')] },
    { id: 'bard-banana', set: 'onboarding23', name: 'Banana costume', layers: [onb23.svg('head_accessory_002_1.svg')] },
    { id: 'fighter-headgear', set: 'onboarding23', name: 'Red headgear', layers: [onb23.svg('head_accessory_003_485e92.svg')] },
    { id: 'bye-bye-awards-cat-hat', set: 'expressions', name: 'Cat hat with pixel shades', layers: [expr.svg('head_accessory_001_016eca.svg')] },
    { id: 'downvote-guy-cap', set: 'expressions', name: 'Black cap', layers: [expr.svg('head_accessory_003_1.svg')] }
  ],
  rightHand: [                                                                                                // acc front
    { id: 'pigeon', set: 'bodegacatceo', name: 'Pigeon', layers: [bodega.layer('1_r-acc_web.png')] },       // (1_r-acc, resized from 4000px)
    { id: 'set-004', set: 'lil-bliss', name: 'Set 004', layers: [bliss.svg('combined-accessory_004.svg')] },
    { id: 'set-005', set: 'lil-blaze', name: 'Set 005', layers: [blaze.svg('combined-accessory_005.svg')] },
    { id: 'set-006', set: 'lil-marco', name: 'Set 006', layers: [marco.layer('accessory_003_2x.png')] },
    { id: 'set-007', set: 'big-g', name: 'Set 007', layers: [biggy.layer('accessory_002_2x.png')] },
    { id: 'cash', set: 'mr-bossman', name: 'Cash', layers: [boss.layer('accessory_001_2x.png')] },
    { id: 'ghosts', set: 'guardian-of-the-realms', name: 'Ghosts', layers: [guard.layer('accessory_003_2x.png')] },
    { id: 'skull-flame', set: 'eye-of-the-beholder', name: 'Skull flame', layers: [eye.layer('accessory_002_2x.png')] },
    { id: 'needle', set: 'snitches-get-stitches', name: 'Needle and thread', layers: [stitch.layer('accessory_001_2x.png')] },
    { id: 'captcha-shield', set: 'cp3crash', name: 'Green shield', layers: [captcha.svg('accessory_001_8c155a.svg')] },
    { id: 'pizza-rat', set: 'deadass', name: 'Pizza rat', layers: [dead.layer('accessory_001_2x.png')] },
    { id: 'rainbow-heart', set: 'june23', name: 'Rainbow heart', layers: [june.svg('accessory_001.svg')] },
    { id: 'trans-heart', set: 'june23', name: 'Trans flag heart', layers: [june.svg('accessory_002.svg')] },
    { id: 'lesbian-heart', set: 'june23', name: 'Lesbian flag heart', layers: [june.svg('accessory_003.svg')] },
    { id: 'bi-heart', set: 'june23', name: 'Bi flag heart', layers: [june.svg('accessory_004.svg')] },
    { id: 'nonbinary-heart', set: 'june23', name: 'Nonbinary flag heart', layers: [june.svg('accessory_005.svg')] },
    { id: 'pan-heart', set: 'june23', name: 'Pan flag heart', layers: [june.svg('accessory_006.svg')] },
    { id: 'ace-heart', set: 'june23', name: 'Ace flag heart', layers: [june.svg('accessory_007.svg')] },
    { id: 'pan-african-heart', set: 'june23', name: 'Pan-African flag heart', layers: [june.svg('accessory_008.svg')] },
    { id: 'juneteenth-heart', set: 'june23', name: 'Juneteenth flag heart', layers: [june.svg('accessory_009.svg')] },
    { id: 'bye-bye-awards-duck', set: 'expressions', name: 'Duck in shades', layers: [expr.svg('accessory_001_18fb76.svg')] },
    { id: 'downvote-guy-dog', set: 'expressions', name: 'Dog on a leash', layers: [expr.svg('accessory_003_80b525.svg')] },
    { id: 'druid-stick', set: 'onboarding23', name: 'Banana stick', colors: { body: '#9ADB52', eyes: '#031619' }, layers: [onb23.svg('accessory_001_a560e7.svg')] },
    { id: 'bard-ukulele', set: 'onboarding23', name: 'Cat ukulele', colors: { body: '#FFFFFF' }, layers: [onb23.svg('accessory_002_1.svg')] },
    { id: 'fighter-shield', set: 'onboarding23', name: 'Upvote shield', layers: [onb23.svg('accessory_003_f49d4a.svg')] },
    { id: 'mage-ray-gun', set: 'onboarding23', name: 'Ray gun', colors: { body: '#C7E3FF', eyes: '#78B5FF' }, layers: [onb23.svg('accessory_004_1.svg')] }
  ],
  leftHand: [                                                                                                 // acc back (between the top and the head)
    { id: 'try-me', set: 'bodegacatceo', name: 'TRY ME', layers: [bodega.layer('accessory_back_003_4x_1.png')] },
    { id: 'wings', set: 'lil-bliss', name: 'Wings', layers: [bliss.layer('accessory_back_004_3x.png')] },
    { id: 'bat-wings', set: 'lil-blaze', name: 'Bat wings', layers: [blaze.svg('combined-accessory_back_005.svg')] },
    { id: 'lid', set: 'lil-marco', name: 'Trash lid', layers: [marco.layer('accessory_back_003_2x.png')] },
    { id: 'set-007', set: 'big-g', name: 'Set 007', layers: [biggy.layer('accessory_back_002_2x.png')] },
    { id: 'cane', set: 'mr-bossman', name: 'Cane', layers: [boss.layer('accessory_back_001_2x.png')] },
    // the sparkles are near-white, so their tile gets a light tint of the Realms night color behind them
    { id: 'sparkles', set: 'guardian-of-the-realms', name: 'Sparkles', layers: [guard.layer('accessory_back_003_2x.png')], tileBg: '#15121F', tileBgOpacity: 0.25 },
    { id: 'skull-flame-back', set: 'eye-of-the-beholder', name: 'Skull flame (back)', layers: [eye.layer('accessory_back_002_2x.png')] },
    { id: 'heart', set: 'snitches-get-stitches', name: 'Stitched heart', layers: [stitch.layer('accessory_back_001_2x.png')] },
    { id: 'captcha-sign', set: 'cp3crash', name: 'Not a robot sign', layers: [captcha.svg('accessory_back_001_2c4aa3.svg')] },
    { id: 'nameplate', set: 'bhm23', name: 'Nameplate necklace', layers: [bhm.svg('accessory_back_004.svg')] },
    { id: 'gold-chain', set: 'bhm23', name: 'Gold chain', layers: [bhm.svg('accessory_back_006.svg')] },
    { id: 'gold-charm', set: 'bhm23', name: 'Gold charm necklace', layers: [bhm.svg('accessory_back_007.svg')] },
    { id: 'snoo-medallion', set: 'bhm23', name: 'Snoo medallion', layers: [bhm.svg('accessory_back_011.svg')] },
    { id: 'altgrunge-phone', set: 'onboarding24', name: 'Phone', layers: [onb.svg('altgrunge-back-acc.svg')] },
    { id: 'funky-juice', set: 'onboarding24', name: 'Green juice', layers: [onb.svg('funky-back-acc.svg')] },
    { id: 'gamergirl-controller', set: 'onboarding24', name: 'Pink controller', layers: [onb.svg('gamergirl-back-acc.svg')] },
    { id: 'gamerguy-joystick', set: 'onboarding24', name: 'Joystick', layers: [onb.svg('gamerguy-back-acc.svg')] },
    { id: 'genz-bag', set: 'onboarding24', name: 'Smiley bag', layers: [onb.svg('genz-back-acc.svg')] },
    { id: 'tracksuit-bottle', set: 'onboarding24', name: 'Yellow water bottle', layers: [onb.svg('tracksuit-back-acc.svg')] },
    { id: 'fighter-keyboard', set: 'onboarding23', name: 'Keyboard sword', colors: { body: '#FFFFFF', eyes: '#FF3924' }, layers: [onb23.svg('accessory_back_003_1.svg')] },
    { id: 'mage-book', set: 'onboarding23', name: 'Glowing spellbook', layers: [onb23.svg('accessory_back_004_1.svg')] },
    { id: 'bye-bye-awards-rocket', set: 'expressions', name: 'Rocket thumbs-up', layers: [expr.svg('accessory_back_001_1.svg')] }
  ],
  backgrounds: [
    { id: 'deadass', set: 'deadass', name: 'Deadass', layers: [dead.layer('deadass-bg.png', { fit: 'cover' })] },
    { id: 'pickle', set: 'pickle-guy', name: 'Pickle', layers: [pickle.layer('pickle-guy-bg.png', { fit: 'cover' })] },
    { id: 'gummy', set: 'gummy', name: 'Gummy', layers: [gummy.layer('gummy-bg.png', { fit: 'cover' })] },
    // background images show at their full size in the B.G. tab
    { id: 'bodega', set: 'bodegacatceo', name: 'Bodega', layers: [bodega.layer('bg-bodega.png', { fit: 'cover' })], star: 'dark' },
    { id: 'angel', set: 'lil-bliss', name: 'Angel', layers: [bliss.layer('angel-bg.png', { fit: 'cover' })] },
    { id: 'devil', set: 'lil-blaze', name: 'Devil', layers: [blaze.layer('devil-bg.png', { fit: 'cover' })] },
    { id: 'possum', set: 'lil-marco', name: 'Possum', layers: [marco.layer('possum-bg.png', { fit: 'cover' })], star: 'light' },
    { id: 'raccoon', set: 'big-g', name: 'Raccoon', layers: [biggy.layer('raccoon-bg.png', { fit: 'cover' })] },
    { id: 'rat', set: 'mr-bossman', name: 'Rat', layers: [boss.layer('rat-bg-2.png', { fit: 'cover' })] },
    { id: 'realms', set: 'guardian-of-the-realms', name: 'Realms', layers: [guard.layer('GUARDIANOFTHEREALMS-BG.png', { fit: 'cover' })] },
    { id: 'beholder', set: 'eye-of-the-beholder', name: 'Beholder', layers: [eye.layer('EYEOFTHEBEHOLDER-BG.png', { fit: 'cover' })], star: 'light' },
    { id: 'stitches', set: 'snitches-get-stitches', name: 'Stitches', layers: [stitch.layer('SNITCHESGETSTITCHES-BG.png', { fit: 'cover' })] },
    { id: 'captcha', set: 'cp3crash', name: 'Captcha', layers: [captcha.layer('captcha-bg.png', { fit: 'cover' })] },
    { id: 'bye-bye-awards', set: 'expressions', name: 'Bye bye awards', layers: [expr.layer('byebyeawards-bg.png', { fit: 'cover' })] },
    { id: 'downvote-guy', set: 'expressions', name: 'Downvote guy', layers: [expr.layer('downvoteguy-bg.png', { fit: 'cover' })] },
    { id: 'druid', set: 'onboarding23', name: 'Druid', layers: [onb23.layer('druid-bg.png', { fit: 'cover' })] },
    { id: 'bard', set: 'onboarding23', name: 'Bard', layers: [onb23.layer('bard-bg.png', { fit: 'cover' })] },
    { id: 'fighter', set: 'onboarding23', name: 'Fighter', layers: [onb23.layer('fighter-bg.png', { fit: 'cover' })] },
    { id: 'mage', set: 'onboarding23', name: 'Mage', layers: [onb23.layer('mage-bg.png', { fit: 'cover' })] }
  ]
};

// ---------- colors ----------
// What can be colored: skin, eyes, hair (solid colors). The background has its own options: none, solid or a 2-color gradient.
// `def` is the color each one starts with (and what Reset all goes back to).
const COLOR_GROUPS = [
  { key: 'body', label: 'Skin', def: '#9E9C91' },
  { key: 'eyes', label: 'Eyes', def: '#000000' },
  { key: 'hair', label: 'Hair', def: '#BB9250' }
];
// the colors used when the background is a solid color or gradient
const DEFAULT_BG = { mode: 'none', c1: '#FFD91A', c2: '#FF9EC4' };
// The preset palette: one row of 12. The row under it is the visitor's own saved colors (SAVED_SLOTS slots, empty at first).
// Six natural tones and six brights, taken from the colors in the artwork. Keep it at 12 so it fills the row.
const PALETTE_PRESETS = ['#FFFFFF', '#F6DDBF', '#BB9250', '#8B5A2B', '#9E9C91', '#000000', '#FF7A1A', '#FFD91A', '#12E6BE', '#2F80FF', '#9040FF', '#FF3D88'];
const SAVED_SLOTS = 12;
// how None / Solid / Gradient show which one is chosen: 'underline' (plain words, the chosen one underlined) or 'square' (a small square, hollow = off, filled = on)
const MODE_STYLE = 'underline';
// how round the avatar's background corners are in the main display, as a fraction of the card's width (0 = square, 0.05 = about 5%).
// Only the main display: the background tiles in the B.G. tab stay square. Nothing is rounded when the background is None.
const AVATAR_CORNER = 0.05;
// the ground shadow under every character: always on, just in front of the background and behind every trait.
// An ellipse in canvas units (the 380 x 600 canvas), measured from the Deadass composite. Set SHADOW = null to turn it off.
// the holographic hover on collectible Outfits tiles (the tile itself stays still): the Venusaur-ex-style foil (chunky rainbow stripes and
// wide silver bands) plus one soft rainbow shine, both printed through a pixel halftone and sliding together with the cursor.
// intensity 0 to 1 (how strong it is; the shine runs a little stronger than the foil).
// pattern = where the big squares go: 'vertical-balanced' (top and bottom, small through the middle), 'diagonal-balanced', or 'edges'.
// dot = the size of the biggest squares, in screen pixels (smaller number = finer pixels).
// tilt = degrees the card leans toward the cursor at its edge, lift = how much it grows (1 = not at all). Both kept very small.
// Mouse/trackpad only: off on touch screens.
const HOLO = { intensity: 0.5, pattern: 'vertical-balanced', dot: 4, tilt: 4, lift: 1.0 };
const SHADOW = { cx: 190.5, cy: 547.5, rx: 81, ry: 41.5, color: '#000000', opacity: 0.30 };
// where the character sits on the main display. The display is always 3:4 (the shape of the background art), the background fills it,
// and the character (every trait, all sets) is drawn smaller inside it. Fractions of the display: left and top = where the character's
// canvas starts, height = how tall the canvas is (its width follows from CANVAS). Measured against the finished Bodega art.
// The selection tiles are not affected.
const FIGURE = { left: 0.1406, top: 0.0845, height: 0.841 };

// what the avatar looks like when the builder opens (null = nothing selected)
const DEFAULT_SEL = { tops: 'set-003', bottoms: 'set-003', hair: null, face: 'set-003', eyes: 'set-003', hats: null, rightHand: 'pigeon', leftHand: 'try-me', backgrounds: 'bodega' };
