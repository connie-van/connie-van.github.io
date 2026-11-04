// Avatar builder data. Everything the builder shows comes from this file.
//
// HOW THE ART WORKS
// Every character layer is a transparent image on the SAME canvas (CANVAS below; the 3x/4x exports are the same shape),
// so each trait keeps its position automatically: the builder just stacks the layers.
// Nothing is repositioned or resized per trait. Background images are different: fit:'cover' fills the whole card.
//
// ADDING A TRAIT: add an object to the category's list below. Two kinds of layers:
//
//   1) A plain image:           layer('head_accessory_003_3x_1.png')     (the file is looked up in the artwork folder, ART below)
//         optional:  z (stacking number, higher = in front),  fit:'cover' (background images),
//                    tint:'body' | 'eyes' | 'hair'  (fills the image's shape with that color)
//
//   Every item can also take  crop:[left, top, right, bottom]  (in CANVAS units) to choose by hand how its selection tile is zoomed.
//   Normally leave that out: the tile is cropped to the artwork automatically, and on Tops and Bottoms a floating piece
//   that sits apart from the main trait is left out of the tile (it still shows on the live character).
//
//   2) A combined SVG export:   svgLayer('combined-body_003.svg')
//         The builder reads the SVG straight from your file: the flat shape painted in a marker color becomes color-changeable,
//         and the art image inside the SVG is drawn on top. Marker colors:
//              green (lime, #0f0)  ->  Skin color      yellow (#ff0)  ->  Eyes color      blue (#00f)  ->  Hair color
//         Drop in a new export with the same file name and it just works. Use web-sized images (under about 1600px wide).
//
// A trait does not need an outfit: it just becomes a tile in its tab. OUTFITS are optional presets that fill several slots at once (see `sets`).
// Stacking order, back to front: background, body bottom, body (tops), lower face (face), upper face (eyes), hair, hats,
// acc back (L Acc.), acc front (R Acc.). To change it, edit CATEGORY_Z.

const CANVAS = { w: 380, h: 600 };

const CATEGORY_Z = { backgrounds: 0, bottoms: 10, tops: 20, face: 30, eyes: 40, hair: 50, hats: 60, leftHand: 75, rightHand: 82 };

// the tabs: [key, label, which panel]. Left panel = the body, right panel = accessories, background and colors.
const TABS = [
  ['outfits', 'Outfits', 'left'], ['tops', 'Tops', 'left'], ['bottoms', 'Bottoms', 'left'], ['hair', 'Hair', 'left'], ['face', 'Face', 'left'], ['eyes', 'Eyes', 'left'],
  ['hats', 'Hats', 'right'], ['leftHand', 'L Acc.', 'right'], ['rightHand', 'R Acc.', 'right'], ['backgrounds', 'B.G.', 'right'], ['colors', 'Colors', 'right']
];
// these always have something selected (no None tile); everything else is optional
const REQUIRED = ['tops', 'bottoms', 'face', 'eyes'];
// set to true to hide tabs that have nothing in them yet
const HIDE_EMPTY_TABS = false;

const ART = 'media/reddit-avatars/builder/';     // where the artwork lives
const layer = (file, extra) => Object.assign({ src: ART + file }, extra || {});
const svgLayer = (file, extra) => Object.assign({ svgSrc: ART + file }, extra || {});

const TRAITS = {
  outfits: [
    // a complete fit (no background): picking it fills all of these slots
    { id: 'set-003', name: 'Set 003', sets: { tops: 'set-003', bottoms: 'set-003', face: 'set-003', eyes: 'set-003', hats: 'set-003', leftHand: 'try-me', rightHand: 'pigeon' } }
  ],
  tops:    [ { id: 'set-003', name: 'Set 003', layers: [svgLayer('combined-body_003.svg')] } ],               // body
  bottoms: [ { id: 'set-003', name: 'Set 003', layers: [layer('body_bottom_003_3x_1.png')] } ],              // body bottom
  hair: [],
  face:    [ { id: 'set-003', name: 'Set 003', layers: [svgLayer('combined-face_lower_003.svg')] } ],        // lower face
  eyes:    [ { id: 'set-003', name: 'Set 003', layers: [svgLayer('combined-face_upper_003.svg')] } ],        // upper face
  hats:    [ { id: 'set-003', name: 'Toast', layers: [layer('head_accessory_003_3x_1.png')] } ],             // head accessory
  rightHand: [ { id: 'pigeon', name: 'Pigeon', layers: [layer('1_r-acc_web.png')] } ],                      // acc front (1_r-acc, resized from 4000px)
  leftHand: [ { id: 'try-me', name: 'TRY ME', layers: [layer('accessory_back_003_4x_1.png')] } ],           // acc back (sits in front of the head accessory)
  backgrounds: [
    // background images show at their full size in the B.G. tab. cp4-bodega-bg-v03:
    { id: 'bodega', name: 'Bodega', layers: [layer('bg-bodega.png', { fit: 'cover' })] }
  ]
};

// ---------- colors ----------
// What can be colored: skin, eyes, hair (solid colors). The background has its own options: none, solid or a 2-color gradient.
const COLOR_GROUPS = [
  { key: 'body', label: 'Skin', def: '#9E9C91' },
  { key: 'eyes', label: 'Eyes', def: '#161616' },
  { key: 'hair', label: 'Hair', def: '#BB9250' }
];
// the colors used when the background is a solid color or gradient
const DEFAULT_BG = { mode: 'none', c1: '#FFD84D', c2: '#FF9EC4' };
// the preset palette (12 per row) and how many colors a visitor can save in the "yours" row
const PALETTE_PRESETS = ['#FFFFFF', '#EEDDCA', '#C0A98B', '#756A5E', '#161616', '#BB9250', '#EA4D85', '#EB5A2B', '#EBB249', '#5BC9C0', '#4F90E5', '#A650B8'];
const SAVED_SLOTS = 12;

// what the avatar looks like when the builder opens (null = nothing selected)
const DEFAULT_SEL = { tops: 'set-003', bottoms: 'set-003', hair: null, face: 'set-003', eyes: 'set-003', hats: 'set-003', rightHand: 'pigeon', leftHand: 'try-me', backgrounds: 'bodega' };
