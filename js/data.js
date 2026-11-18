export const SITE = {
  name: 'Noor 100',
  subject: 'Mira Noor',
  dates: '1926 — 2026',
  title: '100 Years of Light',
  shortTitle: 'of Light',
  metaTitle: 'Noor 100 — A Century of Light · 3D portfolio',
  metaDescription: 'A century of light in seven rooms: an immersive WebGL portfolio concept for a fictional artist, Mira Noor.',
  intro: 'She was born in Lahore in 1926, the year a picture first learned to travel. A century later, walk on water through seven rooms of light into the Chamber of Afterimages.',
  legal: 'Independent fictional portfolio concept · not affiliated with any museum, archive or estate',
  place: 'Lahore · 1926—2026',
  hudRight: 'A studio on the water',
  quote: '“I only ever wanted to paint the moment before a room understands it is lit.”',
  quoteBy: 'Mira Noor',
  roomKicker: 'Afterimage · 2015—2026',
  roomTitle: 'The room became the whole horizon.',
  roomBody: 'In her last decade Noor painted light on curved panels made to wrap around the viewer. She kept the horizon out, so the room had no edge to rest on. Eight panels were installed at Kiran Hall in 2027, a few months after her death. Here, they meet the water.',
  outroKicker: 'Lahore · 5 December 2026',
  outroTitle: 'She worked until the light changed.',
  outroBody: 'A cataract turned the studio yellow, then brown. After surgery in 2023 the blues came back, and she spent her last years on the Afterimages. She died in Lahore at one hundred; on the desk was a jar labelled “north window, 4:10”. The panels went on show at Kiran Hall the following spring.',
  outroLast: 'A hundred years later, the light is still moving.',
  footerNote: '© 2026 Noor 100 · an independent, fictional portfolio concept. All imagery, text and archive entries are original placeholders.',
  designedBy: 'An original concept template',
  worksCount: 1247,
};

export const WORKS = [
  {
    key: 'signal', year: 1926, yearLabel: '1926', title: 'First Signal',
    place: 'Lahore · The Lantern Room', medium: 'Oil and wax on board', size: '46 × 61 cm',
    body: [
      'At nine, Mira Noor wired a broken radio to her father’s paper lantern and watched the filament answer every crackle from the rooftop. She painted the dial before she could name a single station.',
      'The year was 1926: a picture had just learned to travel. The small brass box stayed on her desk until the end. She liked it because it made distance visible before it made anything clear.'
    ],
    label: 'First Signal'
  },
  {
    key: 'radio', year: 1948, yearLabel: '1948', title: 'Blue Hour Radio',
    place: 'Delhi · Private collection', medium: 'Gouache on paper', size: '38 × 56 cm',
    body: [
      'In the autumn after Partition she carried the radio across the border in a cloth bag. The batteries were gone; she kept it anyway, and tuned the silence each evening at the blue hour.',
      'The painting is mostly static: a band of rooftops, a cream square of window, a scratch of copper where a voice might have been. It was the first work she refused to sell.'
    ],
    label: 'Blue Hour Radio'
  },
  {
    key: 'glass', year: 1963, yearLabel: '1963', title: 'The Glass Station',
    place: 'Paris · Atelier des Arcades', medium: 'Oil on linen', size: '89 × 116 cm',
    body: [
      'Noor rented a room above the Gare du Nord in the winter of 1963. The window was made of old glass bricks; every train blurred into weather before it reached the platform.',
      'She worked from six until the light failed, mixing one copper grey for the iron, one blue for the steam. A porter brought her coffee and, once, a timetable she used as a palette.'
    ],
    label: 'The Glass Station'
  },
  {
    key: 'garden', year: 1979, yearLabel: '1979', title: 'Signal Garden',
    place: 'Tokyo · Setagaya Archive', medium: 'Mirror, pigment, low voltage', size: '210 × 340 cm',
    body: [
      'For a small garden in Setagaya she set narrow mirrors among wet leaves and wired them to a clock. Every passing train sent one pale flash across the pond, then nothing.',
      'Visitors often waited for a second signal. There wasn’t one. Noor said the work was about the politeness of light: it arrives, it touches a leaf, it leaves before you can thank it.'
    ],
    label: 'Signal Garden'
  },
  {
    key: 'rain', year: 1994, yearLabel: '1994', title: 'Room for Rain',
    place: 'Lisbon · Gulbenkian Archive', medium: 'Silver print, water, tungsten', size: '60 × 90 cm',
    body: [
      'She recorded a monsoon in Lahore in 1971, then kept the tape in a drawer for twenty-three years. In Lisbon she played it back into a darkroom while rain tapped the north window.',
      'The resulting print is nearly black. One tungsten line sits in a tray of water; the rest is chemical stain and listening. It is the quietest thing she ever made.'
    ],
    label: 'Room for Rain'
  },
  {
    key: 'exposure', year: 2008, yearLabel: '2008', title: 'The Long Exposure',
    place: 'Reykjavík · Nordic Light Fund', medium: 'C-type print', size: '120 × 180 cm',
    body: [
      'On a black-sand shore north of Reykjavík she left a camera open for eleven hours. The sun made a single copper mark, low and slightly crooked, while the sea rubbed itself into a blue grey.',
      'She was eighty-two and had begun to dislike spectacle. The print is almost empty, but the longer you stand with it, the more the small warm line refuses to behave like a mistake.'
    ],
    label: 'The Long Exposure'
  },
  {
    key: 'afterimage', year: 2026, yearLabel: '1915—2026', title: 'Afterimage',
    place: 'Lahore · Noor Atelier', medium: 'Eight curved panels, pigment and light', size: '2 × 14 m',
    body: [
      'Over her last decade Noor painted around two hundred views of the same imagined pond. From about 2012 a cataract clouded her sight; she relied on handwritten labels and a jar kept beside the north window.',
      'In 2018 she offered eight panels to Kiran Hall as a room for anyone who needed a minute of quiet. They were installed in 2027. The last label reads: “not the pond — the minute after looking away”.'
    ],
    label: 'Afterimage'
  }
];

export const ROOMS = [
  { name: 'Dawn', numeral: 'I', hour: 5 + 40/60 },
  { name: 'Noon', numeral: 'II', hour: 12 },
  { name: 'Afternoon', numeral: 'III', hour: 16 + 20/60 },
  { name: 'Sunset', numeral: 'IV', hour: 19.5 },
  { name: 'Dusk', numeral: 'V', hour: 20 + 50/60 },
  { name: 'Night', numeral: 'VI', hour: 23 + 40/60 }
];

export const PROLOGUE = [
  {
    from: 0, to: 19, label: 'I · The rooftop', years: [1926, 1938],
    place: 'bl',
    text: 'Mira Noor was born in Lahore in 1926. At nine she built a radio from a biscuit tin and learned that a small light could answer something very far away.'
  },
  {
    from: 20, to: 39, label: 'II · The shore', years: [1938, 1963],
    place: 'tl',
    text: 'A teacher gave her a prism and a sheet of blue paper. By twenty she was painting the hour before dawn, when the city is still deciding what colour it will be.'
  },
  {
    from: 40, to: 59, label: 'III · The room', years: [1963, 2026],
    text: 'She spent the next sixty years chasing light: on glass, on rain, on mirrors, and at last on eight curved panels. She never called it a career. She called it looking.',
    place: 'ml'
  }
];

export const LINKS = {
  galleries: [
    ['Kiran Hall', 'archive.html?work=afterimage'],
    ['The Lantern Room', 'archive.html?work=signal'],
    ['Setagaya Archive', 'archive.html?work=garden'],
    ['Gulbenkian Archive', 'archive.html?work=rain'],
    ['Nordic Light Fund', 'archive.html?work=exposure'],
    ['Noor Atelier', 'archive.html?work=afterimage']
  ],
  sources: [
    ['A short history of television', 'https://en.wikipedia.org/wiki/History_of_television'],
    ['Light art', 'https://www.tate.org.uk/art/art-terms/l/light-art'],
    ['Camera obscura', 'https://en.wikipedia.org/wiki/Camera_obscura'],
    ['Long-exposure photography', 'https://en.wikipedia.org/wiki/Long-exposure_photography'],
    ['Colour temperature', 'https://en.wikipedia.org/wiki/Color_temperature']
  ]
};
