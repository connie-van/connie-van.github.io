// Avatar builder data. Everything the builder shows comes from this file.
//
// HOW THE ART WORKS
// Every character layer is a transparent image on the SAME canvas (CANVAS below, the 3x/4x exports are the same shape),
// so each trait keeps its position automatically: the builder just stacks the layers.
// Nothing is repositioned or resized per trait. Backgrounds are different: fit:'cover' fills the whole card.
//
// ADDING A TRAIT: add an object to the category's list. Two kinds of layers:
//
//   1) A plain image:           layer('head_accessory_003_3x_1.png')     (the file is looked up in the artwork folder, ART below)
//         optional:  z (stacking number, higher = in front),  fit:'cover' (backgrounds),
//                    tint:'body' | 'eyes' | 'hair'  (fills the image's shape with that Colors-tab color)
//
//   Every item can also take  crop:[left, top, right, bottom]  (in CANVAS units) to choose by hand how its selection tile is zoomed.
//   Normally you can leave that out: the tile is cropped to the artwork automatically, and on Tops and Bottoms a floating piece
//   that sits apart from the main trait is left out of the tile (it still shows on the live character).
//
//   2) A combined SVG export:   svgLayer('combined-body_003.svg')
//         The builder reads the SVG straight from your file: the flat shape painted in a marker color becomes color-changeable,
//         and the art image inside the SVG is drawn on top. Marker colors:
//              green (lime, #0f0)  ->  Body color       yellow (#ff0)  ->  Eyes color       blue (#00f)  ->  Hair color
//         Drop in a new export with the same file name and it just works. Use web-sized images (under about 1600px wide).
//
// OUTFITS are presets: an outfit fills several slots at once (see `sets`).
// Stacking order, back to front: background, body bottom, body (tops), lower face (face), upper face (eyes), hair, hats,
// acc back, acc front (hands). To change it, edit CATEGORY_Z.

const CANVAS = { w: 380, h: 600 };

const CATEGORY_Z = { backgrounds: 0, bottoms: 10, tops: 20, face: 30, eyes: 40, hair: 50, hats: 60, leftHand: 75, rightHand: 82 };

// tab order and labels (Colors is always last)
const TABS = [
  ['outfits', 'Outfits'], ['tops', 'Tops'], ['bottoms', 'Bottoms'], ['hair', 'Hair'], ['face', 'Face'],
  ['eyes', 'Eyes'], ['hats', 'Hats'], ['rightHand', 'Right Hand'], ['leftHand', 'Left Hand'], ['backgrounds', 'Backgrounds'], ['colors', 'Colors']
];
// set to true to hide tabs that have nothing in them yet
const HIDE_EMPTY_TABS = false;

const ART = 'media/reddit-avatars/builder/';     // where the artwork lives
const layer = (file, extra) => Object.assign({ src: ART + file }, extra || {});
const svgLayer = (file, extra) => Object.assign({ svgSrc: ART + file }, extra || {});

const TRAITS = {
  outfits: [
    // a complete look: picking it fills all of these slots
    { id: 'set-003', name: 'Set 003', sets: { tops: 'set-003', bottoms: 'set-003', face: 'set-003', eyes: 'set-003', hats: 'set-003', leftHand: 'try-me', rightHand: 'pigeon', backgrounds: 'bodega' } }
  ],
  tops:    [ { id: 'set-003', name: 'Set 003', layers: [svgLayer('combined-body_003.svg')] } ],               // body
  bottoms: [ { id: 'set-003', name: 'Set 003', layers: [layer('body_bottom_003_3x_1.png')] } ],              // body bottom
  hair: [],
  face:    [ { id: 'set-003', name: 'Set 003', layers: [svgLayer('combined-face_lower_003.svg')] } ],        // lower face
  eyes:    [ { id: 'set-003', name: 'Set 003', layers: [svgLayer('combined-face_upper_003.svg')] } ],        // upper face
  hats:    [ { id: 'set-003', name: 'Toast', layers: [layer('head_accessory_003_3x_1.png')] } ],             // head accessory
  rightHand: [ { id: 'pigeon', name: 'Pigeon', layers: [layer('1_r-acc_web.png')] } ],                      // acc front (1_r-acc, resized from 4000px)
  leftHand: [ { id: 'try-me', name: 'TRY ME', layers: [layer('accessory_back_003_4x_1.png')] } ],              // acc back (sits in front of the head accessory)
  backgrounds: [
    // cp4-bodega-bg-v03
    { id: 'bodega', name: 'Bodega', layers: [layer('bg-bodega.png', { fit: 'cover' })] }
  ]
};

// ---------- colors tab ----------
const SHARED_PRESETS = ['#EBB249', '#EB5A2B', '#EA4D85', '#A650B8', '#655CF4', '#4F90E5', '#5BC9C0'];
const COLOR_GROUPS = [
  { key: 'body', label: 'Body', def: '#9E9C91', presets: ['#FFFFFF', '#EEDDCA', '#C0A98B', '#756A5E'].concat(SHARED_PRESETS) },
  { key: 'eyes', label: 'Eyes', def: '#161616', presets: ['#161616', '#5FD0C0', '#7B94F5', '#BB9250', '#694A33'].concat(SHARED_PRESETS) },
  { key: 'hair', label: 'Hair', def: '#BB9250', presets: ['#BB9250', '#FDEEBB', '#694A33', '#2D2A2B'].concat(SHARED_PRESETS) }
];

// what the avatar looks like when the builder opens (null = nothing selected)
const DEFAULT_SEL = { tops: 'set-003', bottoms: 'set-003', hair: null, face: 'set-003', eyes: 'set-003', hats: 'set-003', rightHand: 'pigeon', leftHand: 'try-me', backgrounds: 'bodega' };
