// Add a project = add one entry below, then upload its media to /images/<slug>/
// cat:   'work' | 'reddit' | 'play'
// r:     tile shape on the grid: '16:9' | '9:16' | '1:1'
// cover: image, gif, mp4 or webm shown on the grid tile, e.g. 'images/demon-friends/cover.mp4'
// feat:  true = also shown on the home page
// media: list shown on the project page. Types: img, video (loops, muted), embed (Vimeo/YouTube URL)
//   { t:'img', src:'images/demon-friends/01.jpg' }
//   { t:'video', src:'images/demon-friends/loop.mp4' }
//   { t:'embed', src:'https://player.vimeo.com/video/123456' }
// Ratios below are placeholders: set each one to match its cover.

const PROJECTS = [
  // WORK
  { slug:'chobani-feed-the-future', title:'Chobani: Feed the Future', cat:'work', r:'16:9', feat:true, cover:'', blurb:'', media:[] },
  { slug:'stuffed-puffs-every-smore', title:"Stuffed Puffs 'Every S'more'", cat:'work', r:'9:16', feat:true, cover:'', blurb:'', media:[] },
  { slug:'pandora-one-lovely-day', title:'Pandora: One Lovely Day', cat:'work', r:'1:1', cover:'', blurb:'', media:[] },
  { slug:'adidas-adiprene', title:'ADIDAS: Adiprene', cat:'work', r:'16:9', feat:true, cover:'', blurb:'', media:[] },
  { slug:'design-thinking', title:'Design Thinking', cat:'work', r:'1:1', cover:'', blurb:'', media:[] },
  { slug:'beats-by-dre-x-line-friends', title:'Beats by Dre x Line Friends', cat:'work', r:'9:16', cover:'', blurb:'', media:[] },
  { slug:'froot-loops-color-quest', title:'Froot Loops: Color Quest', cat:'work', r:'16:9', cover:'', blurb:'', media:[] },
  { slug:'annies-loved-again', title:"Annie's Loved Again", cat:'work', r:'1:1', cover:'', blurb:'', media:[] },
  { slug:'embark', title:'EMBARK', cat:'work', r:'9:16', cover:'', blurb:'', media:[] },
  { slug:'oreo-space-invasion', title:'OREO: Space Invasion', cat:'work', r:'16:9', cover:'', blurb:'', media:[] },
  { slug:'google-cloud-googleverse', title:'Google Cloud: Googleverse', cat:'work', r:'1:1', cover:'', blurb:'', media:[] },
  { slug:'bnym-moments', title:'BNYM: Moments', cat:'work', r:'16:9', cover:'', blurb:'', media:[] },

  // WORK / REDDIT (only shown inside the Reddit page, plus one stack tile on Work)
  { slug:'reddit-avatars-gen-1', title:'Reddit Avatars Gen 1: The Genesis Series', cat:'reddit', r:'1:1', cover:'', blurb:'', media:[] },
  { slug:'reddit-avatars-gen-2', title:'Reddit Avatars Gen 2: Spooky Szn', cat:'reddit', r:'9:16', cover:'', blurb:'', media:[] },
  { slug:'reddit-avatars-gen-3-archived', title:'Reddit Avatars Gen 3: Archived Avatars', cat:'reddit', r:'16:9', cover:'', blurb:'', media:[] },
  { slug:'reddit-avatars-gen-3-vermin', title:'Reddit Avatars Gen 3: Release the Vermin', cat:'reddit', r:'1:1', cover:'', blurb:'', media:[] },
  { slug:'reddit-avatars-gen-4', title:'Reddit Avatars Gen 4: Retro Reimagined', cat:'reddit', r:'9:16', cover:'', blurb:'', media:[] },

  // PLAY
  { slug:'opensea-2-brand-film', title:'OpenSea 2 Brand Film', cat:'play', r:'16:9', feat:true, cover:'', blurb:'', media:[] },
  { slug:'touch-grass', title:'Touch Grass', cat:'play', r:'1:1', feat:true, cover:'', blurb:'', media:[] },
  { slug:'demon-friends', title:'Demon Friends', cat:'play', r:'9:16', feat:true, cover:'', blurb:'', media:[] },
  { slug:'pengu-sitter', title:'Pengu Sitter', cat:'play', r:'1:1', cover:'', blurb:'', media:[] },
  { slug:'garbage-nonsense', title:'Garbage Nonsense', cat:'play', r:'16:9', cover:'', blurb:'', media:[] },
  { slug:'bffl', title:'BFFL', cat:'play', r:'9:16', cover:'', blurb:'', media:[] },
  { slug:'leave-her-alone', title:'Leave Her Alone', cat:'play', r:'1:1', cover:'', blurb:'', media:[] },
  { slug:'ur-l8', title:'UR L8', cat:'play', r:'16:9', cover:'', blurb:'', media:[] },
  { slug:'gm-gib-cobbee', title:'gm, gib cobbee', cat:'play', r:'1:1', cover:'', blurb:'', media:[] },
  { slug:'stoned-to-the-bone-broth', title:'Stoned To The Bone Broth', cat:'play', r:'9:16', cover:'', blurb:'', media:[] },
  { slug:'sweet-tooth', title:'Sweet Tooth', cat:'play', r:'16:9', cover:'', blurb:'', media:[] },
  { slug:'happy-mothers-day', title:"Happy Mother's Day", cat:'play', r:'1:1', cover:'', blurb:'', media:[] },
  { slug:'gordon-gimley', title:'Character Exploration: Gordon Gimley', cat:'play', r:'9:16', cover:'', blurb:'', media:[] }
];

const SITE = {
  name: 'Connie Van',
  tagline: 'designer, illustrator, and sometimes animator',
  links: [
    { label: 'Instagram', href: 'http://instagram.com/_connievan' },
    { label: 'LinkedIn', href: 'http://www.linkedin.com/in/connievan' }
  ]
};
