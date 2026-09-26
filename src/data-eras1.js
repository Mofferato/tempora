/* =====================================================================
   ERA TABLES, part 1 — Ancient, Medieval, Renaissance
   Money values (pay, cost, price, $) are in the era's own currency.
   cur.r converts one unit of that currency into Tempora's internal
   "value" units (roughly today's purchasing power), so wealth carries
   across eras.

   Event choice shape: { l: label, fx, t, odds, win:{fx,t}, alt:{fx,t} }
   fx keys: h health, hp happiness, sm smarts, lk looks, rep reputation,
            $ money (era currency), edu minimum education, jail years
   ===================================================================== */

DATA.eras.push({
  id: 'ancient', name: 'Ancient', from: -3000, to: 499,
  blurb: 'Bronze and iron, city-states and empires. Life is short and the gods are close.',
  pal: ['#A9502B', '#E08C62'],
  cur: { n: 'drachmae', s: 'dr', r: 20 },
  life: { adult: 55, child: 0.35, med: 0.03, acc: 0.007, fert: 0.3, age: 1, tax: 0.1, retire: 0, birth: 0.018 },
  cost: 75, names: 'ancient',
  edu: { n: ['Unschooled', 'Letters (tutored)', 'Rhetoric school', 'Academy', 'Philosophical school'], comp: 0, cost: [0, 20, 60, 200, 300] },
  laws: {
    divorce: true, marry: 14, sameSex: false,
    list: ['Debt can end in bondage', 'Fathers hold legal power over the household', 'Only free men of property may vote, where anyone votes at all', 'Temples keep the calendar and the festivals'],
  },
  L: { healer: 'Visit the temple healer', love: 'Seek a match at the festival', party: 'Drink at a symposium', gamble: 'Play knucklebones for coin', crime: 'Pick a pocket in the agora', gym: 'Train at the gymnasium', study: 'Study scrolls', faith: 'Offer a sacrifice to the gods', friend: 'Loiter in the forum' },
  jobs: [
    J('Farmer', 100), J('Fisher', 110, { risk: 0.01 }), J('Potter', 130, { sm: 10 }), J('Weaver', 120, { sm: 10 }),
    J('Blacksmith', 160, { sm: 15, risk: 0.01 }), J('Merchant', 350, { sm: 35, vol: 0.4 }),
    J('Scribe', 400, { sm: 45, edu: 1 }), J('Legionary', 180, { sex: 'M', risk: 0.04, fame: 1 }),
    J('Priest', 260, { sm: 40, edu: 1, fame: 1, tf: 'Priestess' }), J('Physician', 500, { sm: 60, edu: 2 }),
    J('Gladiator', 220, { risk: 0.1, fame: 3, vol: 0.5 }), J('Philosopher', 300, { sm: 75, edu: 3, fame: 2 }),
    J('Senator', 2500, { sm: 50, edu: 2, rep: 60, fame: 2 }),
  ],
  acts: [
    { id: 'games', n: 'Attend the games', d: 'Chariots, athletes and a roaring crowd.', min: 6, cost: 2, fx: { hp: [6, 12] }, t: 'You cheered yourself hoarse at the games.' },
    { id: 'oracle', n: 'Consult the oracle', d: 'Cryptic words, for a price.', min: 14, cost: 15, fx: { hp: [-4, 8] }, t: ['The oracle says: "A great house will rise from ash." You choose to feel encouraged.', 'The oracle says: "Beware the second winter." You shiver all the way home.', 'The oracle only laughed. You are not sure what that means.'] },
    { id: 'baths', n: 'Visit the public baths', d: 'Soak, scrape, gossip.', min: 4, cost: 1, fx: { h: [2, 5], lk: [1, 3], hp: 3 }, t: 'You soaked, scraped and gossiped at the baths.' },
    { id: 'philo', n: 'Debate the philosophers', d: 'Argue virtue in the stoa.', min: 14, cost: 0, fx: { sm: [2, 5], rep: 1 }, t: 'You argued about virtue until the sun went down.' },
  ],
  dis: [D('Malaria', 0.03, 8, 0.05, 2, 0.4), D('Dysentery', 0.04, 10, 0.08, 1, 0.3), D('Smallpox', 0.01, 20, 0.25, 1, 0.6), D('Consumption', 0.01, 6, 0.1, 5, 0.7)],
  ev: [
    { id: 'harvest', p: 0.08, min: 5, t: 'The harvest failed. Bread is scarce this winter.', fx: { h: [-8, -3], hp: -5 } },
    { id: 'amulet', p: 0.06, min: 10, t: 'A travelling merchant offers you a lucky amulet for 10 drachmae.', ch: [{ l: 'Buy the amulet', fx: { $: -10, hp: 4 }, t: 'You wear the amulet proudly. You feel luckier already.' }, { l: 'Wave him away', t: 'You kept your coins.' }] },
    { id: 'symposium', p: 0.06, min: 18, t: 'You are invited to a symposium at a wealthy house.', ch: [{ l: 'Attend and speak', odds: 0.6, win: { fx: { rep: 5, sm: 2 }, t: 'Your wit impressed the guests.' }, alt: { fx: { rep: -4 }, t: 'You drank too much unwatered wine and made a fool of yourself.' } }, { l: 'Stay home', t: 'You spent a quiet night instead.' }] },
    { id: 'lion', p: 0.02, min: 6, t: 'A lion escaped the arena menagerie and ran down your street!', fx: { h: [-15, 0], hp: -3 } },
    { id: 'soothsayer', p: 0.03, min: 20, t: 'A soothsayer grabs your arm: "Beware the kalends!" You sleep badly for a month.', fx: { hp: -4 } },
    { id: 'grainship', p: 0.04, min: 18, c: (p, S) => S.cash(p) > 60, t: 'A grain ship you backed sank off the coast.', fx: { $: [-50, -15], hp: -5 } },
    { id: 'census', p: 0.05, min: 16, t: 'Census officials counted your household and raised your tax.', fx: { $: -8 } },
    { id: 'latin', p: 0.05, min: 6, max: 16, c: p => p.edu < 1 && !p.school, t: 'A freedman tutor offers to teach you your letters in exchange for chores.', ch: [{ l: 'Learn to read', fx: { sm: 5, edu: 1 }, t: 'You can read and write now.' }, { l: 'Play outside instead', fx: { hp: 3 }, t: 'Letters can wait.' }] },
  ],
  assets: [
    A('Mud-brick house', 400, 'home', { appr: 0.01, hp: 8 }), A('Stone villa', 6000, 'home', { appr: 0.02, hp: 15, rep: 5 }),
    A('Olive grove', 1500, 'land', { inc: 0.08, appr: 0.01 }), A('Donkey', 60, 'animal', { appr: -0.1, inc: 0.05 }),
    A('Chariot', 450, 'vehicle', { appr: -0.08, hp: 8, rep: 3 }), A('Gold torque', 250, 'luxury', { appr: 0.02, lk: 3, hp: 5 }),
  ],
  die: {
    kid: ['a fever', 'dysentery', 'a winter cough', 'measles'],
    adult: ['a festering wound', 'fever', 'dysentery', 'bad water'],
    old: ['old age', 'a failing heart', 'a stroke', 'a chest infection'],
    acc: ['a fall from a roof', 'drowning in the river', 'a kick from a mule', 'a collapsing wall'],
  },
});

DATA.eras.push({
  id: 'medieval', name: 'Medieval', from: 500, to: 1449,
  blurb: 'Castles, monasteries and manors. The seasons, the Church and the lord decide your fate.',
  pal: ['#8A2A36', '#D8707D'],
  cur: { n: 'shillings', s: 's', r: 40 },
  life: { adult: 55, child: 0.3, med: 0.04, acc: 0.008, fert: 0.3, age: 1, tax: 0.12, retire: 0, birth: 0.015 },
  cost: 40, names: 'medieval',
  edu: { n: ['Unschooled', 'Parish school', 'Grammar school', 'University', 'Doctorate'], comp: 0, cost: [0, 5, 15, 60, 90] },
  laws: {
    divorce: false, marry: 14, sameSex: false,
    list: ["Serfs are bound to their lord's land", 'The Church collects a tithe of one tenth', 'Annulment, not divorce, and only by Church decree', 'Trial by ordeal for the accused', 'Sumptuary laws restrict what commoners may wear'],
  },
  L: { healer: 'See the barber-surgeon', love: 'Court someone at the May fair', party: 'Drink at the alehouse', gamble: 'Throw dice at the alehouse', crime: "Poach the lord's deer", gym: 'Practise at the archery butts', study: 'Study with the monks', faith: 'Attend Mass', friend: 'Chat at the village well' },
  jobs: [
    J('Peasant', 40), J('Shepherd', 45), J('Carpenter', 80, { sm: 15 }), J('Miller', 80, { sm: 20 }),
    J('Brewer', 75, { sm: 15 }), J('Blacksmith', 90, { sm: 20, risk: 0.01 }), J('Innkeeper', 110, { sm: 25 }),
    J('Merchant', 200, { sm: 35, vol: 0.4 }), J('Monk', 60, { edu: 1, sm: 30, tf: 'Nun' }),
    J('Scribe', 130, { edu: 1, sm: 45 }), J('Man-at-arms', 90, { sex: 'M', risk: 0.05, fame: 1 }),
    J('Physician', 260, { edu: 3, sm: 60 }), J('Knight', 600, { sex: 'M', rep: 45, risk: 0.04, fame: 2, grant: 'Sir' }),
    J('Lord of the Manor', 1500, { rep: 70, sm: 40, fame: 2, grant: 'Lord', tf: 'Lady of the Manor' }),
  ],
  acts: [
    { id: 'pilgrim', n: 'Go on pilgrimage', d: 'Walk to a distant shrine.', min: 12, cost: 20, fx: { h: [-5, 5], hp: [5, 12], rep: 3 }, t: 'You walked the long road to a shrine and came home changed.', risk: { p: 0.12, fx: { h: -15, $: -10 }, t: 'Bandits robbed you on the pilgrim road.' } },
    { id: 'joust', n: 'Enter the tourney', d: 'Lances, horses and glory.', min: 16, cost: 10, fx: { rep: [2, 8], hp: 5 }, t: 'You rode well in the tourney and the crowd cheered your name.', risk: { p: 0.25, fx: { h: [-25, -10] }, t: 'You were unhorsed and broke a rib.' } },
    { id: 'fair', n: 'Visit the fair', d: 'Jugglers, pies and a dancing bear.', min: 5, cost: 2, fx: { hp: [4, 9] }, t: 'You spent a merry day at the fair.' },
    { id: 'confess', n: 'Go to confession', d: 'Unburden your soul.', min: 8, cost: 1, fx: { hp: [2, 5], rep: 1 }, t: 'The priest set your penance. You feel lighter.' },
  ],
  dis: [D('Leprosy', 0.004, 5, 0.04, 10, 0.9), D('Bloody flux', 0.04, 10, 0.08, 1, 0.3), D('Smallpox', 0.012, 20, 0.25, 1, 0.6), D("St. Anthony's Fire", 0.015, 12, 0.1, 1, 0.5), D('Consumption', 0.01, 6, 0.1, 5, 0.7)],
  ev: [
    { id: 'levy', p: 0.07, min: 16, t: "The lord's steward demands an extra levy from your household.", ch: [{ l: 'Pay 5s', fx: { $: -5 }, t: 'You paid, grumbling.' }, { l: 'Refuse', odds: 0.5, win: { fx: { rep: 2 }, t: 'The steward shrugged and moved on.' }, alt: { fx: { h: -10, rep: -3 }, t: 'His men beat you for your defiance.' } }] },
    { id: 'wolves', p: 0.05, min: 4, t: 'Wolves took two of the village sheep. Everyone is on edge.', fx: { hp: -3 } },
    { id: 'friar', p: 0.06, min: 6, max: 20, c: p => p.edu < 1 && !p.school, t: 'A travelling friar offers to teach you your letters.', ch: [{ l: 'Learn', fx: { sm: 5, edu: 1 }, t: 'You can read your psalter now.' }, { l: 'Decline', t: 'The friar moved on to the next village.' }] },
    { id: 'witch', p: 0.02, min: 16, t: 'A neighbour accuses you of witchcraft after her cow sickens.', ch: [{ l: 'Deny it before the priest', odds: 0.7, win: { fx: { rep: -5 }, t: 'The priest believed you. Mostly.' }, alt: { fx: { h: -20, rep: -15 }, t: 'You were ducked in the millpond and barely survived.' } }, { l: 'Pay her off (10s)', fx: { $: -10, rep: -2 }, t: 'The accusation quietly went away.' }] },
    { id: 'bandits', p: 0.04, min: 14, t: 'Bandits ambushed you on the road to market.', fx: { $: [-10, -2], h: [-10, 0] } },
    { id: 'feast', p: 0.06, min: 3, t: 'The lord threw a harvest feast. You ate like a king.', fx: { hp: 6, h: 2 } },
    { id: 'crusade', p: 0.15, min: 16, max: 40, sex: 'M', from: 1096, to: 1291, once: true, t: 'A preacher calls on men to take the cross and go on crusade.', ch: [{ l: 'Take the cross', odds: 0.6, win: { fx: { rep: 15, hp: 5, $: [5, 40] }, t: 'You returned from the Holy Land scarred but celebrated.' }, alt: { fx: { h: -35, rep: 5 }, t: 'You came back from crusade half-dead with fever.' } }, { l: 'Stay home', t: 'You stayed to tend your fields.' }] },
  ],
  assets: [
    A('Wattle cottage', 30, 'home', { hp: 6 }), A('Timber house', 150, 'home', { hp: 10, appr: 0.01 }),
    A('Stone manor', 3000, 'home', { hp: 15, rep: 10, appr: 0.02 }), A('Strip of farmland', 80, 'land', { inc: 0.1 }),
    A('Ox', 12, 'animal', { inc: 0.08, appr: -0.08 }), A('Warhorse', 60, 'animal', { hp: 6, rep: 4, appr: -0.1 }),
    A('Illuminated psalter', 40, 'luxury', { sm: 3, appr: 0.03 }),
  ],
  die: {
    kid: ['a fever', 'the bloody flux', 'measles', 'the winter sickness'],
    adult: ['a fever', 'an infected wound', 'the bloody flux', 'bad ale'],
    old: ['old age', 'dropsy', 'apoplexy', 'a wasting illness'],
    acc: ['a fall from a hayrick', 'drowning in the millpond', 'a cart accident', 'a kick from an ox'],
  },
});

DATA.eras.push({
  id: 'renaissance', name: 'Renaissance', from: 1450, to: 1649,
  blurb: 'Printing presses, painted chapels and ships sailing off the edge of the map.',
  pal: ['#2E4F9E', '#86A2F2'],
  cur: { n: 'florins', s: 'ƒ', r: 100 },
  life: { adult: 57, child: 0.28, med: 0.07, acc: 0.007, fert: 0.28, age: 1, tax: 0.12, retire: 0, birth: 0.012 },
  cost: 20, names: 'renaissance',
  edu: { n: ['Unschooled', 'Petty school', 'Grammar school', 'University', 'Doctorate'], comp: 0, cost: [0, 1, 4, 15, 25] },
  laws: {
    divorce: false, marry: 14, sameSex: false,
    list: ['The Inquisition watches for heresy', 'Guilds control who may practise a trade', 'Sumptuary laws limit silk and jewels by rank', 'Duelling is forbidden, and common', 'Printers need a licence to publish'],
  },
  L: { healer: 'Consult a physician', love: 'Exchange glances at a masque', party: 'Revel at carnival', gamble: 'Bet on the palio', crime: 'Forge a bill of exchange', gym: 'Take fencing lessons', study: 'Read the new printed books', faith: 'Hear a sermon at the cathedral', friend: 'Stroll the piazza' },
  jobs: [
    J('Farmer', 20), J('Artisan', 40, { sm: 20 }), J('Printer', 60, { sm: 35, edu: 1, from: 1450 }),
    J('Painter', 55, { sm: 40, fame: 2, vol: 0.4 }), J('Sculptor', 60, { sm: 40, fame: 2, vol: 0.4 }),
    J('Merchant', 90, { sm: 35, vol: 0.4 }), J('Navigator', 80, { sm: 45, risk: 0.05, fame: 1 }),
    J('Court Musician', 60, { sm: 30, lk: 40, fame: 1 }), J('Mercenary', 70, { sex: 'M', risk: 0.07 }),
    J('Banker', 250, { sm: 60, edu: 2, vol: 0.3 }), J('Physician', 130, { sm: 60, edu: 3 }),
    J('Astronomer', 90, { sm: 75, edu: 3, fame: 2 }), J('Cardinal', 400, { sm: 55, edu: 3, rep: 60, sex: 'M', fame: 2 }),
  ],
  acts: [
    { id: 'portrait', n: 'Commission a portrait', d: 'Immortality in oils.', min: 16, cost: 30, fx: { rep: [3, 8], hp: 6 }, t: 'A painter captured you in oils. Your likeness now hangs in the hall.' },
    { id: 'theatre', n: 'See a play', d: 'Tragedy, comedy, sword fights.', min: 8, cost: 1, fx: { hp: [4, 8], sm: 1 }, t: 'The players had you laughing and weeping by turns.' },
    { id: 'anatomy', n: 'Attend an anatomy lecture', d: 'The body, opened.', min: 16, cost: 2, fx: { sm: [3, 6] }, t: 'You watched the anatomist work and took furious notes.' },
    { id: 'masque', n: 'Dance at a masquerade', d: 'Masks, music, intrigue.', min: 16, cost: 5, fx: { hp: [5, 10], lk: 1 }, t: 'Behind a gilded mask, you danced until dawn.' },
  ],
  dis: [D('Great Pox', 0.01, 6, 0.04, 6, 0.9), Object.assign(D('Sweating sickness', 0.02, 25, 0.3, 1, 0.7), { from: 1485, to: 1551 }), D('Typhus', 0.02, 12, 0.12, 1, 0.5), D('Smallpox', 0.012, 20, 0.22, 1, 0.6), D('Plague', 0.004, 25, 0.4, 1, 0.95)],
  ev: [
    { id: 'patron', p: 0.05, min: 16, c: p => p.sm > 50 || p.lk > 65, t: 'A wealthy patron admires your talents and offers support.', fx: { $: [10, 40], rep: 4, hp: 5 } },
    { id: 'duel', p: 0.04, min: 16, t: 'A hot-headed nobleman challenges you to a duel over an imagined insult.', ch: [{ l: 'Accept', odds: 0.55, win: { fx: { rep: 10, h: -5 }, t: 'You drew first blood and won your honour.' }, alt: { fx: { h: -30, rep: 2 }, t: 'You took a blade through the shoulder.' } }, { l: 'Apologise', fx: { rep: -6 }, t: 'You swallowed your pride.' }] },
    { id: 'inquisition', p: 0.03, min: 16, t: 'Inquisitors question you about a forbidden book on your shelf.', ch: [{ l: 'Burn the book', fx: { sm: -2, rep: 1 }, t: 'You watched it curl in the flames.' }, { l: 'Defend it', odds: 0.5, win: { fx: { sm: 3, rep: 5 }, t: 'Your eloquence won them over.' }, alt: { fx: { jail: 2, rep: -10 }, t: 'You were imprisoned for heresy.' } }] },
    { id: 'spices', p: 0.05, min: 20, c: (p, S) => S.cash(p) >= 20, t: 'A merchant fleet bound for the Indies sells shares at 20 florins.', ch: [{ l: 'Invest 20ƒ', fx: { $: -20 }, odds: 0.55, win: { fx: { $: 60 }, t: 'The ships returned laden with pepper. You tripled your money!' }, alt: { t: 'The fleet was lost off the Cape, and your florins with it.' } }, { l: 'Keep your money', t: 'Better safe than shipwrecked.' }] },
    { id: 'plagueren', p: 0.02, min: 1, t: 'Plague returned to the city. The rich fled to their villas.', fx: { h: [-10, 0], hp: -5 } },
    { id: 'pamphlet', p: 0.05, min: 10, t: 'A printed account of distant lands fires your imagination.', fx: { sm: 3, hp: 2 } },
  ],
  assets: [
    A('Townhouse', 250, 'home', { hp: 10, appr: 0.01 }), A('Palazzo', 5000, 'home', { hp: 18, rep: 12, appr: 0.02 }),
    A('Country villa', 1800, 'land', { inc: 0.04, hp: 12, appr: 0.01 }), A('Vineyard', 700, 'land', { inc: 0.09 }),
    A('Horse', 25, 'animal', { hp: 4, appr: -0.1 }), A('Gilded lute', 20, 'luxury', { hp: 5 }),
    A('Library of printed books', 90, 'luxury', { sm: 5, appr: 0.01 }),
  ],
  die: {
    kid: ['a fever', 'smallpox', 'the flux'],
    adult: ['a fever', 'typhus', 'an infected wound', "a surgeon's bleeding"],
    old: ['old age', 'apoplexy', 'gout', 'a failing heart'],
    acc: ['a riding accident', 'a street brawl', 'drowning in the canal', 'a collapsing scaffold'],
  },
});
