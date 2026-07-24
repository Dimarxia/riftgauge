// data/battlefields.js
// Battlefield roster — cosmetic reference only. Selecting a battlefield has
// no effect on the Victory Point win target.
//
// Tuple shape: [id, name, set]

export const BATTLEFIELDS = [
  // Origins Main Set (ogn)
  ['abandoned-hall',         'Abandoned Hall',          'ogn'],
  ['altar-of-blood',         'Altar of Blood',          'ogn'],
  ['altar-to-unity',         'Altar to Unity',          'ogn'],
  ['back-alley-bar',         'Back-Alley Bar',          'ogn'],
  ['bandle-tree',            'Bandle Tree',             'ogn'],
  ['baron-pit',              'Baron Pit',               'ogn'],
  ['black-flame-altar',      'Black Flame Altar',       'ogn'],
  ['brush',                  'Brush',                   'ogn'],
  ['dusk-rose-lab',          'Dusk Rose Lab',           'ogn'],
  ['emperors-dais',          "Emperor's Dais",          'ogn'],
  ['forbidding-waste',       'Forbidding Waste',        'ogn'],
  ['forgotten-library',      'Forgotten Library',       'ogn'],
  ['forgotten-monument',     'Forgotten Monument',      'ogn'],
  ['fortified-position',     'Fortified Position',      'ogn'],
  ['frozen-fortress',        'Frozen Fortress',         'ogn'],
  ['gardens-of-becoming',    'Gardens of Becoming',     'ogn'],
  ['grove-god-willow',       'Grove of the God-Willow', 'ogn'],
  ['hall-of-legends',        'Hall of Legends',         'ogn'],
  ['hallowed-tomb',          'Hallowed Tomb',           'ogn'],
  ['marai-spire',            'Marai Spire',             'ogn'],
  ['minefield',              'Minefield',               'ogn'],
  ['navori-fighting-pit',    'Navori Fighting Pit',     'ogn'],
  ['obelisk-of-power',       'Obelisk of Power',        'ogn'],

  // Spiritforged (sfd)
  ['amateur-recital',        'Amateur Recital',         'sfd'],
  ['forge-of-the-fluft',     'Forge of the Fluft',      'sfd'],
  ['monastery-of-hirana',    'Monastery of Hirana',     'sfd'],
  ['ornns-forge',            "Ornn's Forge",            'sfd'],
  ['power-nexus',            'Power Nexus',             'sfd'],
  ['ravenbloom-conservatory','Ravenbloom Conservatory', 'sfd'],
  ['reavers-row',            "Reaver's Row",            'sfd'],
  ['sigil-of-the-storm',     'Sigil of the Storm',      'sfd'],
  ['the-dreaming-tree',      'The Dreaming Tree',       'sfd'],
  ['treasure-hoard',         'Treasure Hoard',          'sfd'],
  ['vilemaws-lair',          "Vilemaw's Lair",          'sfd'],
  ['whispering-dunes',       'Whispering Dunes',        'sfd'],
  ['wuju-monastery',         'Wuju Monastery',          'sfd'],
  ['yordle-glade',           'Yordle Glade',            'sfd'],
  ['zaunite-undercity',      'Zaunite Undercity',       'sfd'],

  // Unleashed (unl)
  ['ancient-henge',          'Ancient Henge',           'unl'],
  ['arena-bar',              'Arena Bar',               'unl'],
  ['celestial-altar',        'Celestial Altar',         'unl'],
  ['corrupted-grove',        'Corrupted Grove',         'unl'],
  ['crystal-scar',           'Crystal Scar',            'unl'],
  ['demonic-shrine',         'Demonic Shrine',          'unl'],
  ['draktharr-arena',        "Drak'tharr Arena",        'unl'],
  ['forgotten-depths',       'Forgotten Depths',        'unl'],
  ['grand-plaza',            'Grand Plaza',             'unl'],
  ['iron-harbor',            'Iron Harbor',             'unl'],
  ['noxian-coliseum',        'Noxian Coliseum',         'unl'],
  ['piltover-academy',       'Piltover Academy',        'unl'],
  ['shuriman-ruins',         'Shuriman Ruins',          'unl'],
  ['stoneborn-ridge',        'Stoneborn Ridge',         'unl'],
  ['sunken-temple',          'Sunken Temple',           'unl'],
  ['targonian-peak',         'Targonian Peak',          'unl'],
  ['void-rift',              'Void Rift',               'unl'],
];

export const battlefieldById = Object.fromEntries(BATTLEFIELDS.map((b) => [b[0], b]));
