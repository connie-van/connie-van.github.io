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
//   Every item can also take  crop:[left, top, right, bottom]  (in CANVAS units) to choose by hand how its selection tile is zoomed.
//   Normally leave that out: the tile is cropped to the artwork automatically, and on Tops and Bottoms a floating piece
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
//   background, acc back (L Acc.), hair back, lower body (bottoms), upper body (tops), lower face (face), upper face (eyes),
//   hair front, hat, front acc (R Acc.)
// Hair is one trait with up to two layers: a back layer and a front layer, so a hair item lists both:
//   { id:'curly', set:'...', name:'Curly', layers:[ x.svg('combined-hair_back_005.svg', { z: CATEGORY_Z.hairBack }), x.svg('combined-hair_front_005.svg') ] }
//   (the layer with no z uses the hair front position). Both layers take the one Hair color. A hair trait with no back layer just lists the front.
// To change the order, edit CATEGORY_Z.

const CANVAS = { w: 380, h: 600 };

// (leftHand = acc back, hairBack is only used by a hair trait's back layer, hair = hair front, rightHand = front acc)
const CATEGORY_Z = { backgrounds: 0, leftHand: 5, hairBack: 8, bottoms: 10, tops: 20, face: 30, eyes: 40, hair: 50, hats: 60, rightHand: 82 };

// the tabs: [key, label, which panel]. Left panel = the body, right panel = accessories, background and colors.
const TABS = [
  ['outfits', 'Outfits', 'left'], ['tops', 'Tops', 'left'], ['bottoms', 'Bottoms', 'left'], ['hair', 'Hair', 'left'], ['face', 'Face', 'left'], ['eyes', 'Eyes', 'left'],
  ['hats', 'Hats', 'right'], ['leftHand', 'L Acc.', 'right'], ['rightHand', 'R Acc.', 'right'], ['backgrounds', 'B.G.', 'right'], ['colors', 'Colors', 'right']
];
// these always have something selected (no None tile); everything else is optional
const REQUIRED = ['tops', 'bottoms', 'face', 'eyes'];
// set to true to hide tabs that have nothing in them yet
const HIDE_EMPTY_TABS = false;

// ---------- sets ----------
// A set is a group of traits that were made together. Each set has its own folder inside the artwork folder (named after the set),
// so files with the same or similar names in different sets never clash. The names are stored here for later; nothing shows them yet.
//   colors:      the set's ORIGINAL colors (body = skin, eyes, hair). The Outfits tab always shows the set in these, and picking
//                the outfit puts them on the avatar. Leave a color out if the set doesn't have one: that color is left as it is.
//   background:  the id of the set's paired background image. Picking the outfit switches to it. Leave it out if the set has none.
const SETS = {
  'bodegacatceo': { name: 'bodegacatceo', short: 'Bodega', number: '003', colors: { body: '#9E9C91', eyes: '#161616' }, background: 'bodega' },
  'lil-bliss':    { name: "Lil' Bliss", number: '004', colors: { body: '#FFF800', eyes: '#161616' }, background: 'angel' },
  // set 005's original eyes color is assumed to be black
  'lil-blaze':    { name: "Lil' Blaze", number: '005', colors: { body: '#FF0C00', eyes: '#161616' }, background: 'devil' }
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

const TRAITS = {
  outfits: [
    // a complete fit (no background): picking it fills all of these slots
    { id: 'set-003', set: 'bodegacatceo', name: 'Set 003', sets: { tops: 'set-003', bottoms: 'set-003', face: 'set-003', eyes: 'set-003', hats: 'set-003', leftHand: 'try-me', rightHand: 'pigeon' } },
    { id: 'set-004', set: 'lil-bliss', name: 'Set 004', sets: { tops: 'set-004', bottoms: 'set-004', face: 'set-004', eyes: 'set-004', hats: 'halo', leftHand: 'wings', rightHand: 'set-004' } },
    { id: 'set-005', set: 'lil-blaze', name: 'Set 005', sets: { tops: 'set-005', bottoms: 'set-005', face: 'set-005', eyes: 'set-005', hats: 'imp', leftHand: 'bat-wings', rightHand: 'set-005' } }
  ],
  tops: [                                                                                                     // body
    { id: 'set-003', set: 'bodegacatceo', name: 'Set 003', layers: [bodega.svg('combined-body_003.svg')] },
    // the little devil on top touches the body, so its tile is cropped by hand to leave it out (it still shows on the avatar)
    { id: 'set-004', set: 'lil-bliss', name: 'Set 004', layers: [bliss.svg('combined-body_004.svg')], crop: [98, 347, 304, 501] },
    // the little angel on top touches the body, so its tile is cropped by hand to leave it out (it still shows on the avatar)
    { id: 'set-005', set: 'lil-blaze', name: 'Set 005', layers: [blaze.svg('combined-body_005.svg')], crop: [97, 342, 305, 510] }
  ],
  bottoms: [                                                                                                  // body bottom
    { id: 'set-003', set: 'bodegacatceo', name: 'Set 003', layers: [bodega.layer('body_bottom_003_3x_1.png')] },
    // same for the heart above the legs (it sits in the opening, so the tile starts just below it)
    { id: 'set-004', set: 'lil-bliss', name: 'Set 004', layers: [bliss.svg('combined-body_bottom_004.svg')], crop: [113, 443, 301, 585] },
    { id: 'set-005', set: 'lil-blaze', name: 'Set 005', layers: [blaze.svg('combined-body_bottom_005.svg')] }
  ],
  hair: [],
  face: [                                                                                                     // lower face
    { id: 'set-003', set: 'bodegacatceo', name: 'Set 003', layers: [bodega.svg('combined-face_lower_003.svg')] },
    { id: 'set-004', set: 'lil-bliss', name: 'Set 004', layers: [bliss.svg('combined-face_lower_004.svg')] },
    { id: 'set-005', set: 'lil-blaze', name: 'Set 005', layers: [blaze.svg('combined-face_lower_005.svg')] }
  ],
  eyes: [                                                                                                     // upper face
    { id: 'set-003', set: 'bodegacatceo', name: 'Set 003', layers: [bodega.svg('combined-face_upper_003.svg')] },
    { id: 'set-004', set: 'lil-bliss', name: 'Set 004', layers: [bliss.svg('face_upper_004.svg')] },
    { id: 'set-005', set: 'lil-blaze', name: 'Set 005', layers: [blaze.svg('face_upper_005.svg')] }
  ],
  hats: [                                                                                                     // head accessory
    { id: 'set-003', set: 'bodegacatceo', name: 'Toast', layers: [bodega.layer('head_accessory_003_3x_1.png')] },
    { id: 'halo', set: 'lil-bliss', name: 'Halo', layers: [bliss.layer('head_accessory_004_3x.png')] },
    { id: 'imp', set: 'lil-blaze', name: 'Imp', layers: [blaze.svg('combined-head_accessory_005.svg')] }
  ],
  rightHand: [                                                                                                // acc front
    { id: 'pigeon', set: 'bodegacatceo', name: 'Pigeon', layers: [bodega.layer('1_r-acc_web.png')] },       // (1_r-acc, resized from 4000px)
    { id: 'set-004', set: 'lil-bliss', name: 'Set 004', layers: [bliss.svg('combined-accessory_004.svg')] },
    { id: 'set-005', set: 'lil-blaze', name: 'Set 005', layers: [blaze.svg('combined-accessory_005.svg')] }
  ],
  leftHand: [                                                                                                 // acc back (the furthest back, just in front of the background)
    { id: 'try-me', set: 'bodegacatceo', name: 'TRY ME', layers: [bodega.layer('accessory_back_003_4x_1.png')] },
    { id: 'wings', set: 'lil-bliss', name: 'Wings', layers: [bliss.layer('accessory_back_004_3x.png')] },
    { id: 'bat-wings', set: 'lil-blaze', name: 'Bat wings', layers: [blaze.svg('combined-accessory_back_005.svg')] }
  ],
  backgrounds: [
    // background images show at their full size in the B.G. tab
    { id: 'bodega', set: 'bodegacatceo', name: 'Bodega', layers: [bodega.layer('bg-bodega.png', { fit: 'cover' })] },
    { id: 'angel', set: 'lil-bliss', name: 'Angel', layers: [bliss.layer('angel-bg.png', { fit: 'cover' })] },
    { id: 'devil', set: 'lil-blaze', name: 'Devil', layers: [blaze.layer('devil-bg.png', { fit: 'cover' })] }
  ]
};

// ---------- colors ----------
// What can be colored: skin, eyes, hair (solid colors). The background has its own options: none, solid or a 2-color gradient.
// `def` is the color each one starts with (and what Reset all goes back to).
const COLOR_GROUPS = [
  { key: 'body', label: 'Skin', def: '#9E9C91' },
  { key: 'eyes', label: 'Eyes', def: '#161616' },
  { key: 'hair', label: 'Hair', def: '#BB9250' }
];
// the colors used when the background is a solid color or gradient
const DEFAULT_BG = { mode: 'none', c1: '#FFD91A', c2: '#FF9EC4' };
// The preset palette: one row of 12. The row under it is the visitor's own saved colors (SAVED_SLOTS slots, empty at first).
// Six natural tones and six brights, taken from the colors in the artwork. Keep it at 12 so it fills the row.
const PALETTE_PRESETS = ['#FFFFFF', '#F6DDBF', '#BB9250', '#8B5A2B', '#9E9C91', '#161616', '#FF7A1A', '#FFD91A', '#12E6BE', '#2F80FF', '#9040FF', '#FF3D88'];
const SAVED_SLOTS = 12;
// how None / Solid / Gradient show which one is chosen: 'underline' (plain words, the chosen one underlined) or 'square' (a small square, hollow = off, filled = on)
const MODE_STYLE = 'underline';

// what the avatar looks like when the builder opens (null = nothing selected)
const DEFAULT_SEL = { tops: 'set-003', bottoms: 'set-003', hair: null, face: 'set-003', eyes: 'set-003', hats: 'set-003', rightHand: 'pigeon', leftHand: 'try-me', backgrounds: 'bodega' };
