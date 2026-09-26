/* =====================================================================
   ERA TABLE, part 0 — Prehistory (10,000 BC to 3001 BC)
   The ice retreats, foragers follow the herds, and in a few river
   valleys people begin to farm, herd and build the first towns. There
   is no money: wealth is counted in barter goods. Farming, herding,
   pottery and copper arrive in each land at a different time
   (see DATA.neolithic in data-regions.js).
   ===================================================================== */

DATA.eras.push({
  id: 'prehistory', name: 'Prehistory', short: 'Stone Age', from: -10000, to: -3001,
  blurb: 'The ice retreats. Hunters follow the herds, the first farmers break the soil, and villages rise beside the rivers.',
  pal: ['#7A5A32', '#D2A96A'],
  cur: { n: 'barter goods', s: '', r: 8 },
  life: { adult: 50, child: 0.4, med: 0.01, acc: 0.012, fert: 0.3, age: 1.05, tax: 0.03, retire: 0, birth: 0.02 },
  cost: 30, names: 'prehistory',
  edu: { n: ['Untaught', 'Taught by the elders', 'Initiated into the lore', 'Keeper of the lore', "Master of the shaman's mysteries"], comp: 0, cost: [0, 0, 2, 6, 10] },
  laws: {
    divorce: true, marry: 13, sameSex: false,
    list: ['Custom, not written law: the elders settle disputes around the fire', 'Meat from a big hunt is shared with the whole band', 'A killing is answered by the victim’s kin, or paid off in goods', 'Marriages tie bands together; a bride or groom often moves to another camp'],
  },
  L: { healer: 'Visit the medicine woman', love: 'Dance at the gathering of the bands', party: 'Feast around the fire', gamble: 'Throw marked knucklebones for trinkets', crime: "Raid another band's food cache", gym: 'Run with the hunters', study: 'Listen to the elders', faith: 'Leave offerings for the spirits', friend: "Sit at another family's hearth" },
  jobs: [
    J('Gatherer', 25), J('Hunter', 30, { risk: 0.03, fame: 0.5 }), J('Fisher', 28, { risk: 0.01 }), J('Hide worker', 26, { sm: 10 }),
    J('Flint knapper', 32, { sm: 20 }), J('Herder', 30, { from: -8500, neo: 'herd' }), J('Farmer', 30, { from: -9000, neo: 'farm' }),
    J('Potter', 34, { from: -7000, sm: 15, neo: 'farm' }), J('Weaver', 32, { from: -6000, sm: 15, neo: 'farm' }),
    J('Obsidian Trader', 50, { from: -7500, sm: 30, vol: 0.5, risk: 0.02 }), J('Copper Smith', 60, { from: -5000, sm: 35, risk: 0.01, neo: 'copper' }),
    J('Healer', 45, { sm: 40, edu: 1, tf: 'Medicine Woman' }), J('Storyteller', 35, { im: 40, fame: 1 }), J('Shaman', 55, { sm: 45, edu: 2, fame: 1 }),
    J('War Leader', 70, { sex: 'M', risk: 0.05, fame: 2, rep: 40 }), J('Chief', 120, { rep: 65, sm: 40, fame: 2, grant: 'Chief', tf: 'Chieftess' }),
  ],
  acts: [
    { id: 'cavepaint', n: 'Paint on the cave walls', d: 'Ochre, charcoal and flickering torchlight.', min: 8, cost: 0, fx: { im: [3, 6], hp: 3, fm: [0, 1] }, t: ['You painted a running herd of aurochs. The elders nodded slowly.', 'You pressed your hand to the wall and blew red ochre around it. It will outlast you.'] },
    { id: 'greathunt', n: 'Join the great hunt', d: 'Red deer, aurochs, wild horses. Glory and meat.', min: 14, cost: 0, fx: { rep: [2, 6], hp: 5, $c: 0.1 }, t: 'The hunt went well. The whole band ate for a week and sang your name.', risk: { p: 0.15, fx: { h: [-30, -10] }, t: 'An aurochs caught you with its horns. You were carried home.' } },
    { id: 'firedance', n: 'Dance around the fire', d: 'Drums, bone flutes and stamping feet.', min: 3, cost: 0, fx: { hp: [4, 9], mh: 2 }, t: 'You danced until the stars wheeled overhead.' },
    { id: 'knap', n: 'Learn to knap flint', d: 'Strike, turn, strike again.', min: 8, cost: 0, fx: { sm: [2, 4], wp: 1 }, t: 'Your blades are getting sharper. So are your thumbs, painfully.' },
    { id: 'skywatch', n: 'Watch the sky with the elders', d: 'Moons, solstices and the wandering stars.', min: 6, cost: 0, fx: { sm: [1, 3], im: [2, 4] }, t: 'You learned when the sun will stand still in the sky.' },
    { id: 'vision', n: 'Seek a spirit vision', d: 'Fasting, smoke and a long night alone.', min: 14, cost: 1, fx: { im: [4, 8], mh: [2, 5], rep: 2 }, t: 'In the smoke you saw your spirit animal. You woke changed.', risk: { p: 0.1, fx: { h: -12, mh: -6 }, t: 'The fasting went too far. You collapsed, shaking, for days.' } },
    { id: 'tattoo', n: 'Get tattooed', d: 'Soot, a bone needle and gritted teeth.', min: 12, cost: 1, fx: { lk: [-2, 4], rep: 2, wp: 1 }, t: 'Your new marks show which clan you belong to.' },
    { id: 'settle', n: 'Help build a house of mud and timber', d: 'The village is growing.', from: -9000, min: 12, cost: 0, fx: { h: 2, rep: 2, wp: 1 }, t: 'You packed mud into the walls until your arms ached.' },
  ],
  dis: [D('Infected wound', 0.05, 12, 0.12, 1, 0.6), D('Parasites', 0.06, 6, 0.02, 2, 0.4), D('Marsh fever', 0.03, 10, 0.1, 1, 0.5), D('Tooth abscess', 0.03, 8, 0.05, 1, 0.3), Object.assign(D('Tuberculosis', 0.008, 6, 0.08, 4, 0.9), { from: -7000 }), Object.assign(D('Cattle pox', 0.006, 14, 0.15, 1, 0.8), { from: -6000 })],
  ev: [
    { id: 'aurochs', p: 0.06, min: 12, t: 'A herd of aurochs thunders past the camp at dawn.', ch: [{ l: 'Grab a spear and hunt', odds: p => 0.35 + p.h / 250, win: { fx: { rep: 6, $c: 0.2, fm: 2 }, t: 'You brought one down. There will be feasting.' }, alt: { fx: { h: [-25, -8] }, t: 'The bull turned on you. You barely crawled away.' } }, { l: 'Let them pass', t: 'You watched them go, a river of horns.' }] },
    { id: 'wolfpup', p: 0.05, min: 5, to: -8000, t: 'A thin wolf pup keeps creeping to the edge of the firelight.', ch: [{ l: 'Feed it scraps', fx: { hp: 6, pet: 'dog' }, t: 'It followed you everywhere after that. The first of many.' }, { l: 'Chase it off', t: 'It slunk back into the dark.' }] },
    { id: 'riverflood', p: 0.05, min: 1, t: 'The river flooded and swept away the fish traps.', fx: { hp: -4, $c: -0.1 } },
    { id: 'drought', p: 0.05, min: 1, t: 'The rains failed. The band packed up and walked for many days to find water.', fx: { h: [-8, -3], hp: -3 } },
    { id: 'raiders', p: 0.04, min: 14, t: 'Men from a rival band crept up on the camp at night.', ch: [{ l: 'Fight them off', odds: p => 0.4 + p.h / 300, win: { fx: { rep: 8, fm: 3 }, t: 'You drove them back into the dark. The band will not forget.' }, alt: { fx: { h: [-30, -10] }, t: 'A club caught you across the head.' } }, { l: 'Hide the children and flee', fx: { hp: -5, $c: -0.1 }, t: 'You lost the winter stores, but everyone lived.' }] },
    { id: 'seeds', p: 0.06, min: 12, to: -6000, t: 'You notice that grain dropped near last year’s camp has sprouted into a thick green patch.', ch: [{ l: 'Clear the weeds and plant more', fx: { sm: 3, rep: 3, $c: 0.05 }, t: 'Next summer there was bread. The elders call you clever, and a little strange.' }, { l: 'Leave it to the birds', t: 'The birds were grateful.' }] },
    { id: 'obsidian', p: 0.05, min: 14, from: -8000, t: 'A trader from far away unwraps glittering black obsidian and offers it for your best furs.', ch: [{ l: 'Trade', fx: { $c: -0.1, rep: 2, hp: 3 }, t: 'The blades cut like nothing you have ever seen.' }, { l: 'Keep your furs', t: 'Winter is coming, after all.' }] },
    { id: 'eclipse', p: 0.02, min: 4, t: 'The sun went black in the middle of the day. The shaman says the spirits are angry.', ch: [{ l: 'Make an offering', fx: { $c: -0.05, mh: 3 }, t: 'The sun came back. The offering must have worked.' }, { l: 'Hide in the hut', fx: { mh: -3 }, t: 'You shook until the light returned.' }] },
    { id: 'rite', p: 0.9, min: 13, max: 15, once: true, t: 'It is time for your rite of passage. The elders lead you away from the camp.', ch: [{ l: 'Endure the ordeal', odds: p => 0.45 + (p.wp ?? 50) / 200, win: { fx: { rep: 6, wp: 4, mh: 3 }, t: 'You came back an adult, with a new name whispered only to you.' }, alt: { fx: { rep: -4, h: -6 }, t: 'You broke before it ended. You will have to prove yourself another way.' } }, { l: 'Run away', fx: { rep: -8, hp: 2 }, t: 'You hid in the reeds for two days. People still whisper.' }] },
    { id: 'bearcamp', p: 0.03, min: 6, t: 'A bear raided the camp at night, looking for the smoked fish.', fx: { h: [-12, 0], hp: -3 } },
    { id: 'harshwinter', p: 0.07, min: 1, t: 'A bitter winter. The snow came up to the roof of the hut.', fx: { h: [-6, -2] } },
    { id: 'gathering', p: 0.06, min: 16, max: 30, c: p => p.sp == null, t: 'The bands gather at the great meeting place. There is dancing, trading and matchmaking.', ch: [{ l: 'Dance with someone who catches your eye', odds: 0.6, win: { fx: { lover: 1, hp: 6 }, t: 'You walked back to camp together.' }, alt: { fx: { hp: -3 }, t: 'They danced with someone else.' } }, { l: 'Trade and gossip instead', fx: { $c: 0.05, sm: 1 }, t: 'You came home with news from six valleys.' }] },
    { id: 'firestory', p: 0.05, min: 4, t: 'An old woman told the story of the time the sea swallowed the land. Everyone went quiet.', fx: { im: 3, sm: 1 } },
    { id: 'herdmove', p: 0.05, min: 3, t: 'The herds are moving to new grazing. The band follows.', fx: { h: 1, im: 2, hp: -1 } },
    { id: 'copperstone', p: 0.04, min: 14, from: -5500, t: 'Someone dropped a green stone into a very hot fire, and shining metal ran out.', ch: [{ l: 'Learn the secret', fx: { sm: 4, rep: 3 }, t: 'You can make copper now. People look at you differently.' }, { l: 'Call it bad magic', fx: { mh: -1 }, t: 'You kept away from that fire.' }] },
  ],
  assets: [
    A('Hide tent', 20, 'home', { hp: 6 }), A('Pit house', 60, 'home', { from: -9500, hp: 10 }), A('Mud-brick house', 150, 'home', { from: -8500, hp: 14, appr: 0.01 }),
    A('Fine flint blades', 10, 'luxury', { sm: 1, hp: 3 }), A('Shell necklace', 8, 'luxury', { lk: 2, hp: 3 }), A('Obsidian mirror', 50, 'luxury', { from: -6000, lk: 3, rep: 2 }),
    A('Dugout canoe', 40, 'vehicle', { hp: 6, inc: 0.05 }), A('Herd of goats', 60, 'animal', { from: -8500, inc: 0.1, appr: -0.02 }), A('Field plot', 80, 'land', { from: -9000, inc: 0.1 }),
    A('Copper axe', 90, 'luxury', { from: -5000, rep: 4, appr: 0.02 }),
  ],
  die: {
    kid: ['a fever', 'a winter cough', 'worms', 'a snakebite'],
    adult: ['an infected wound', 'a fever', 'a hunting wound', 'a raid by a rival band'],
    old: ['old age', 'a failing heart', 'a winter chill', 'a wasting sickness'],
    acc: ['a fall from a cliff', 'drowning in the river', 'a charging aurochs', 'a bear attack'],
  },
});

/* ---------- generic prehistoric name pool (reconstructed, not attested) ---------- */
DATA.names.prehistory = {
  m: ['Aro', 'Bekan', 'Dunnar', 'Eskel', 'Haldo', 'Irrik', 'Kaldo', 'Lunn', 'Morv', 'Nesk', 'Orrin', 'Tovo', 'Urrak', 'Varn'],
  f: ['Aina', 'Bree', 'Dalla', 'Enna', 'Hesa', 'Ilva', 'Kaija', 'Liss', 'Mira', 'Nessa', 'Olla', 'Runa', 'Siv', 'Vela'],
  last: ['of the Otter clan', 'of the Elk clan', 'of the Reindeer clan', 'of the Heron clan', 'of the Beaver clan', 'of the Salmon clan', 'of the Lynx clan', 'of the Aurochs clan', 'of the Swan clan', 'of the Seal clan'],
};
