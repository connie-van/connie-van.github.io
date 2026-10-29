// Add a project = add one entry below, then upload its media to /media/<slug>/
// cat:    'work' | 'reddit' | 'play'   (reddit projects only appear inside Work > Reddit)
// r:      tile shape on the grid: '16:9' | '9:16' | '1:1'  (placeholders: match each to its cover)
// cover:  image, gif, mp4 or webm shown on the grid tile, e.g. 'media/demon-friends/cover.mp4'
// feat:   true = also shown on the home page
// hidden: true = not shown anywhere until you remove it (use for "maybe" projects)
// single: true = image-only project. Opens as a floating lightbox over its grid (still has its own link)
//         instead of a separate page. Needs a cover or one media item.
// blurb:  short description shown beside the title on the project page
// credits: [{ role:'Design', name:'Connie Van' }, ...] shown side by side under the blurb
// media:  list shown on the project page, top to bottom. Types: img, video (loops, muted), embed (Vimeo/YouTube URL)
//   { t:'img', src:'media/demon-friends/01.jpg', alt:'short description' }
//   { t:'video', src:'media/demon-friends/loop.mp4', alt:'short description' }   (plays like a gif: autoplay, loop, muted, no controls)
//   { t:'embed', src:'https://player.vimeo.com/video/123456' }
//   Layout blocks that hold several items:
//   { t:'grid', cols:5, items:[ ...img/video items ] }   one colored box, items in a grid (2 per row on phones)
//   { t:'row', items:[ ...img/video/embed items ] }                   items side by side (stacked on phones)

const PROJECTS = [
  // WORK
  { slug:'chobani-feed-the-future', title:'Chobani: Feed the Future', cat:'work', r:'16:9', feat:true, cover:'', blurb:'', media:[] },
  { slug:'stuffed-puffs-every-smore', title:"Stuffed Puffs 'Every S'more'", cat:'work', r:'9:16', feat:true, cover:'', blurb:'', media:[] },
  { slug:'adidas-adiprene', title:'ADIDAS: Adiprene', cat:'work', r:'16:9', feat:true, cover:'', blurb:'', media:[] },
  { slug:'intuit', title:'Intuit', cat:'work', r:'1:1', cover:'', blurb:'', media:[] },
  { slug:'pandora-one-lovely-day', title:'Pandora: One Lovely Day', cat:'work', r:'1:1', cover:'', blurb:'', media:[] },
  { slug:'google-cloud-googleverse', title:'Google Cloud: Googleverse', cat:'work', r:'16:9', cover:'', blurb:'', media:[] },
  { slug:'design-thinking', title:'Design Thinking', cat:'work', r:'1:1', cover:'', blurb:'', media:[] },
  { slug:'beats-by-dre-x-line-friends', title:'Beats by Dre x Line Friends', cat:'work', r:'9:16', cover:'', blurb:'', media:[] },
  { slug:'garbage-nonsense', title:'Garbage Nonsense', cat:'work', r:'16:9', cover:'', blurb:'', media:[] },
  { slug:'high-tales', title:'High Tales', cat:'work', r:'9:16', cover:'', blurb:'', media:[] },
  { slug:'gvc', title:'Good Vibes Club', cat:'work', r:'1:1', feat:true,
    cover:'media/gvc/GVC_Stickerpack_Teaser_01_a01_goyzk7.gif',
    blurb:"My work with Good Vibes Club centered on bringing their 3D universe into 2D by shaping a distinct illustration style rooted in the brand’s characters and personality. I helped expand GVC’s creative identity through expressive Telegram sticker illustrations designed with animation in mind, visual storytelling through storyboarding, and merch design. A key part of this work also involved developing the brand’s badge system, transforming distinctive 3D character traits into a versatile icon set that became a core part of its evolving identity.",
    credits:[
      { role:'Creative Direction', name:'Chris Guyot' },
      { role:'Art Direction', name:'Jack Maschka' },
      { role:'Design', name:'Connie Van' },
      { role:'Animation', name:'Mac Wozjcik' }
    ],
    media:[
      { t:'grid', cols:5, items:[
      { t:'img', src:'media/gvc/Cool.webp', alt:'Cool sticker' },
      { t:'img', src:'media/gvc/SobLaughing.webp', alt:'Sob laughing sticker' },
      { t:'img', src:'media/gvc/Pwease.webp', alt:'Pwease sticker' },
      { t:'img', src:'media/gvc/HeartEyes.webp', alt:'Heart eyes sticker' },
      { t:'img', src:'media/gvc/WaveHello.webp', alt:'Wave hello sticker' },
      { t:'img', src:'media/gvc/Hype.webp', alt:'Hype sticker' },
      { t:'img', src:'media/gvc/Snickering.webp', alt:'Snickering sticker' },
      { t:'img', src:'media/gvc/Stoked.webp', alt:'Stoked sticker' },
      { t:'img', src:'media/gvc/Think.webp', alt:'Think sticker' },
      { t:'img', src:'media/gvc/Mindblown.webp', alt:'Mindblown sticker' }
      ] },
      { t:'row', items:[
        { t:'img', src:'media/gvc/GVC-Telegram-Evergreen-Stickers-v02.png', alt:'Finished Telegram sticker set' },
        { t:'img', src:'media/gvc/gvc-telegram-stickers-v01.png', alt:'Telegram sticker sketches' }
      ] }
    ] },
  { slug:'opensea', title:'OpenSea', cat:'work', r:'16:9', feat:true, cover:'', blurb:'', media:[] },
  { slug:'keke-palmer', title:'Keke Palmer', cat:'work', r:'9:16', cover:'', blurb:'', media:[] },

  // WORK / REDDIT (only shown inside the Reddit page, plus one stack tile on Work)
  { slug:'reddit-avatars-gen-1', title:'Reddit Avatars Gen 1: The Genesis Series', cat:'reddit', r:'1:1', cover:'', blurb:'', media:[] },
  { slug:'reddit-avatars-gen-2', title:'Reddit Avatars Gen 2: Spooky Szn', cat:'reddit', r:'9:16', cover:'', blurb:'', media:[] },
  { slug:'reddit-avatars-gen-3-archived', title:'Reddit Avatars Gen 3: Archived Avatars', cat:'reddit', r:'16:9', cover:'', blurb:'', media:[] },
  { slug:'reddit-avatars-gen-3-vermin', title:'Reddit Avatars Gen 3: Release the Vermin', cat:'reddit', r:'1:1', cover:'', blurb:'', media:[] },
  { slug:'reddit-avatars-gen-4', title:'Reddit Avatars Gen 4: Retro Reimagined', cat:'reddit', r:'9:16', cover:'', blurb:'', media:[] },
  { slug:'pengu-sitter', title:'Pengu Sitter', cat:'reddit', r:'1:1', cover:'', blurb:'', media:[] },
  { slug:'stoned-to-the-bone-broth', title:'Stoned To The Bone Broth', cat:'reddit', r:'9:16', cover:'', blurb:'', media:[] },

  // PLAY
  { slug:'demon-friends', title:'Demon Friends', cat:'play', r:'9:16', feat:true, cover:'', blurb:'', media:[] },
  { slug:'touch-grass', title:'Touch Grass', cat:'play', r:'1:1', feat:true, cover:'', blurb:'', media:[] },
  { slug:'bffl', title:'BFFL', cat:'play', r:'9:16', cover:'', blurb:'', media:[] },
  { slug:'ur-l8', title:'UR L8', cat:'play', r:'16:9', cover:'', blurb:'', media:[] },
  { slug:'gm-gib-cobbee', title:'gm, gib cobbee', cat:'play', r:'1:1', cover:'', blurb:'', media:[] },
  { slug:'leave-her-alone', title:'Leave Her Alone', cat:'play', r:'1:1', cover:'', blurb:'', media:[] },
  { slug:'gordon-gimley', title:'Character Exploration: Gordon Gimley', cat:'play', r:'9:16', cover:'', blurb:'', media:[] },
  { slug:'world-peace', title:'World Peace', cat:'play', r:'16:9', cover:'', blurb:'', media:[] },
  { slug:'beekeepin', title:'Beekeepin', cat:'play', r:'1:1', cover:'', blurb:'', media:[] },
  { slug:'untitled-wip', title:'Untitled WIP', cat:'play', r:'9:16', cover:'', blurb:'', media:[] }
];

const SITE = {
  name: 'Connie Van',
  tagline: 'designer, illustrator, and sometimes animator',
  links: [
    { label: 'Instagram', href: 'http://instagram.com/_connievan' },
    { label: 'LinkedIn', href: 'http://www.linkedin.com/in/connievan' }
  ]
};
