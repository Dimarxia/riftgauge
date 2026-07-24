// data/legends.js
// Legend roster. Tuple shape: [id, name, title, domain1, domain2]

export const LEGENDS = [
  // Origins (ogn) + Proving Grounds (ogs)
  ['annie',        'Annie',         'Dark Child',              'fury',  'chaos'], // ogs-017
  ['masteryi',     'Master Yi',     'Wuju Bladesman',          'calm',  'body' ], // ogs-019
  ['lux',          'Lux',           'Lady of Luminosity',      'mind',  'order'], // ogs-021
  ['garen',        'Garen',         'Might of Demacia',        'body',  'order'], // ogs-023
  ['kaisa',        "Kai'Sa",        'Daughter of the Void',    'fury',  'mind' ], // ogn-247
  ['volibear',     'Volibear',      'Relentless Storm',        'fury',  'body' ], // ogn-249
  ['jinx',         'Jinx',          'Loose Cannon',            'fury',  'chaos'], // ogn-251
  ['darius',       'Darius',        'Hand of Noxus',           'fury',  'order'], // ogn-253
  ['ahri',         'Ahri',          'Nine-Tailed Fox',         'calm',  'mind' ], // ogn-255
  ['leesin',       'Lee Sin',       'Blind Monk',              'calm',  'body' ], // ogn-257
  ['yasuo',        'Yasuo',         'Unforgiven',              'calm',  'chaos'], // ogn-259
  ['leona',        'Leona',         'Radiant Dawn',            'calm',  'order'], // ogn-261
  ['teemo',        'Teemo',         'Swift Scout',             'mind',  'chaos'], // ogn-263
  ['viktor',       'Viktor',        'Herald of the Arcane',    'mind',  'order'], // ogn-265
  ['missfortune',  'Miss Fortune',  'Bounty Hunter',           'body',  'chaos'], // ogn-267
  ['sett',         'Sett',          'The Boss',                'body',  'order'], // ogn (last)
  // Spiritforged (sfd)
  ['rumble',       'Rumble',        'Mechanized Menace',       'fury',  'mind' ], // sfd-181
  ['lucian',       'Lucian',        'Purifier',                'fury',  'body' ], // sfd-183
  ['draven',       'Draven',        'Glorious Executioner',    'fury',  'chaos'], // sfd-185
  ['reksai',       "Rek'Sai",       'Void Burrower',           'fury',  'order'], // sfd-187
  ['ornn',         'Ornn',          'Fire Below the Mountain', 'calm',  'mind' ], // sfd-189
  ['jax',          'Jax',           'Grandmaster at Arms',     'calm',  'body' ], // sfd-193
  ['irelia',       'Irelia',        'Blade Dancer',            'calm',  'chaos'], // sfd-195
  ['azir',         'Azir',          'Emperor of the Sands',    'calm',  'order'], // sfd-197
  ['ezreal',       'Ezreal',        'Prodigal Explorer',       'mind',  'chaos'], // sfd-199
  ['renata',       'Renata Glasc',  'Chem-Baroness',           'calm',  'order'], // sfd-201
  ['sivir',        'Sivir',         'Battle Mistress',         'body',  'chaos'], // sfd-203
  ['fiora',        'Fiora',         'Grand Duelist',           'body',  'order'], // sfd-205
  // Unleashed (unl)
  ['jhin',         'Jhin',          'Virtuoso',                'fury',  'mind' ], // unl-181
  ['rengar',       'Rengar',        'Pridestalker',            'fury',  'body' ], // unl-183
  ['pyke',         'Pyke',          'Bloodharbor Ripper',      'chaos', 'fury' ], // unl-185
  ['vi',           'Vi',            'Piltover Enforcer',       'fury',  'order'], // unl-187
  ['lillia',       'Lillia',        'Bashful Bloom',           'calm',  'mind' ], // unl-189
  ['masteryi-unl', 'Master Yi',     'Wuju Master',             'calm',  'body' ], // unl-191
  ['vex',          'Vex',           'Gloomist',                'calm',  'chaos'], // unl-193
  ['ivern',        'Ivern',         'Green Father',            'calm',  'order'], // unl-195
  ['diana',        'Diana',         'Scorn of the Moon',       'mind',  'chaos'], // unl-197
  ['leblanc',      'LeBlanc',       'Deceiver',                'mind',  'order'], // unl-199
  ['khazix',       "Kha'Zix",       'Voidreaver',              'body',  'chaos'], // unl-201
  ['poppy',        'Poppy',         'Keeper of the Hammer',    'body',  'order'], // unl-203
];

export const legendById = Object.fromEntries(LEGENDS.map((l) => [l[0], l]));
