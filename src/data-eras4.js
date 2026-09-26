/* =====================================================================
   ERA TABLES, part 4 — Digital, Near Future, Far Future
   laws.ubi: yearly universal income (era currency) for adults without work
   act.set: sets a flag on the player (e.g. 'backup' enables revival)
   ===================================================================== */

DATA.eras.push({
  id: 'digital', name: 'Digital', from: 2000, to: 2029,
  blurb: 'Smartphones, social feeds and a pandemic. Everyone is connected, and everyone is tired.',
  pal: ['#2176D2', '#71B2F7'],
  cur: { n: 'dollars', s: '$', r: 1 },
  life: { adult: 78, child: 0.02, med: 0.7, acc: 0.004, fert: 0.1, age: 0.75, tax: 0.25, retire: 67, birth: 0.0003 },
  cost: 22000, names: 'digital',
  edu: { n: ['Unschooled', 'Primary school', 'High school', 'University', 'Postgraduate'], comp: 2, cost: [0, 0, 0, 25000, 35000] },
  laws: {
    divorce: true, marry: 18, sameSex: false, sameSexFrom: 2001,
    list: ['Same-sex marriage is legal in a growing list of countries from 2001', 'Data protection laws limit what companies may keep about you', 'Smoking is banned in most indoor public places', 'Online speech and privacy are fiercely debated', 'The retirement age creeps up to 67'],
  },
  L: { healer: 'Book a doctor appointment', love: 'Swipe on a dating app', party: 'Go clubbing', gamble: 'Bet on an online sportsbook', crime: 'Run an online scam', gym: 'Hit the gym', study: 'Take an online course', faith: 'Meditate with an app', friend: 'Join a local meetup' },
  jobs: [
    J('Barista', 27000), J('Retail Associate', 30000), J('Rideshare Driver', 32000, { from: 2011, risk: 0.005 }),
    J('Electrician', 62000, { sm: 35, risk: 0.01 }), J('Teacher', 58000, { sm: 45, edu: 3 }), J('Nurse', 78000, { sm: 45, edu: 3 }),
    J('Social Media Manager', 52000, { from: 2008, sm: 40, edu: 3 }), J('Content Creator', 45000, { from: 2006, lk: 55, fame: 3, vol: 0.9 }),
    J('UX Designer', 95000, { sm: 55, edu: 3 }), J('Software Developer', 120000, { sm: 65, edu: 3 }),
    J('Data Scientist', 130000, { from: 2010, sm: 70, edu: 4 }), J('Lawyer', 150000, { sm: 65, edu: 4 }),
    J('Doctor', 230000, { sm: 70, edu: 4 }), J('Crypto Trader', 70000, { from: 2012, sm: 45, vol: 1.2 }),
    J('Startup Founder', 80000, { sm: 60, vol: 1.1, fame: 1 }), J('AI Researcher', 200000, { from: 2015, sm: 80, edu: 4, fame: 1 }),
  ],
  acts: [
    { id: 'post', n: 'Post on social media', d: 'Broadcast yourself.', min: 13, cost: 0, fx: { hp: [-3, 6], rep: [0, 2] }, t: ['Your post got 3 likes. Two were bots.', 'Your post did numbers! Strangers love you.', 'Someone left a cruel comment. You stewed about it all day.'] },
    { id: 'stream', n: 'Stream video games', d: 'Chat is watching.', min: 8, cost: 0, fx: { hp: [3, 7], h: -1 }, t: 'You streamed for six hours to eleven loyal viewers.' },
    { id: 'abroad', n: 'Travel abroad', d: 'Passport, pack, go.', min: 16, cost: 2500, fx: { hp: [8, 14], sm: 2 }, t: 'You wandered foreign streets and ate everything.' },
    { id: 'detox', n: 'Go on a digital detox', d: 'No phone for a week.', min: 16, cost: 800, fx: { hp: [6, 10], h: [2, 5] }, t: 'A week without notifications. You forgot how quiet the world is.' },
    { id: 'cosmetic', n: 'Get cosmetic surgery', d: 'A new face, for a price.', min: 18, cost: 8000, fx: { lk: [5, 15] }, t: 'The surgeon did fine work. The mirror agrees.', risk: { p: 0.1, fx: { lk: -10, h: -10 }, t: 'The surgery was botched.' } },
  ],
  dis: [D('Influenza', 0.05, 6, 0.005, 1, 0.3), Object.assign(D('Cancer', 0.003, 10, 0.1, 4, 0.75), { ag: true }), Object.assign(D('Heart disease', 0.004, 10, 0.08, 5, 0.6), { ag: true }), Object.assign(D('Diabetes', 0.004, 4, 0.02, 30, 0.6), { ag: true })],
  ev: [
    { id: 'viral', p: 0.04, min: 13, t: 'A video you posted went viral overnight.', fx: { rep: [5, 15], hp: 8 } },
    { id: 'breach', p: 0.05, min: 18, t: 'A company leaked your data. Someone opened a credit card in your name.', fx: { $: [-2000, -200], hp: -5 } },
    { id: 'crypto', p: 0.05, min: 18, from: 2011, c: (p, S) => S.cash(p) >= 1000, t: 'A friend begs you to buy a brand-new cryptocurrency.', ch: [{ l: 'Buy $1,000 worth', fx: { $: -1000 }, odds: 0.35, win: { fx: { $: [3000, 20000] }, t: 'It mooned! You cashed out a small fortune.' }, alt: { t: 'It crashed 98%. You now own a very expensive meme.' } }, { l: 'Pass', t: 'You kept your savings boring.' }] },
    { id: 'remote', p: 0.1, from: 2020, c: p => !!p.job, t: 'Your job went fully remote. No more commute!', fx: { hp: 6 } },
    { id: 'phone', p: 0.05, min: 10, t: 'You dropped your phone in the toilet.', fx: { $: -300, hp: -4 } },
    { id: 'gig', p: 0.1, min: 18, c: p => !p.job, t: 'You picked up gig work delivering food.', fx: { $: [1000, 4000] } },
  ],
  assets: [
    A('Studio apartment', 250000, 'home', { hp: 8, appr: 0.04 }), A('Family house', 450000, 'home', { hp: 14, appr: 0.04 }),
    A('Penthouse', 2500000, 'home', { hp: 20, rep: 8, appr: 0.03 }), A('Rental condo', 350000, 'land', { inc: 0.05, appr: 0.04 }),
    A('Index fund', 10000, 'stock', { appr: 0.07, vol: 0.18, inc: 0.015 }), A('Cryptocurrency wallet', 5000, 'stock', { from: 2010, appr: 0.2, vol: 0.8 }),
    A('Electric car', 45000, 'vehicle', { from: 2012, hp: 10, rep: 2, appr: -0.12 }), A('Smartphone', 1000, 'tech', { from: 2007, hp: 4, appr: -0.4 }),
    A('Gaming PC', 2500, 'tech', { hp: 6, appr: -0.3 }),
  ],
  die: {
    kid: ['leukemia', 'a congenital condition', 'meningitis', 'an allergic reaction'],
    adult: ['cancer', 'a heart attack', 'an overdose', 'sepsis'],
    old: ['old age', 'heart disease', 'a stroke', 'cancer', 'dementia'],
    acc: ['a car crash', 'a cycling accident', 'a fall', 'drowning'],
  },
});

DATA.eras.push({
  id: 'near', name: 'Near Future', from: 2030, to: 2149,
  blurb: 'Fusion power, rising seas, gene therapy and the first cities on Mars. Projected, not promised.',
  pal: ['#139A6B', '#5ED8A6'],
  cur: { n: 'credits', s: '₡', r: 1 },
  life: { adult: 96, child: 0.01, med: 0.82, acc: 0.003, fert: 0.09, age: 0.55, tax: 0.28, retire: 75, birth: 0.0001 },
  cost: 22000, names: 'near',
  edu: { n: ['Unschooled', 'Primary pod', 'Secondary academy', 'University', 'Post-doctoral'], comp: 2, cost: [0, 0, 0, 10000, 15000] },
  laws: {
    divorce: true, marry: 18, sameSex: true, ubi: 12000,
    list: ['Universal basic income in most regions', 'AI systems must disclose when you are talking to one', 'Carbon credits cap personal emissions', 'Embryo gene editing is licensed and regulated', 'Only autonomous vehicles in city centres'],
  },
  L: { healer: 'Visit a med-clinic', love: 'Try AI matchmaking', party: 'Go to a VR rave', gamble: 'Bet on drone races', crime: 'Hack a vending network', gym: 'Train in a fitness exosuit', study: 'Download a neural course', faith: 'Visit a mindfulness dome', friend: 'Join a community co-op' },
  jobs: [
    J('Care Robot Supervisor', 38000), J('Vertical Farmer', 42000), J('Drone Courier Pilot', 48000, { sm: 30 }),
    J('Robot Mechanic', 60000, { sm: 40 }), J('AI Ethicist', 90000, { sm: 55, edu: 3 }), J('VR World Architect', 100000, { sm: 55, edu: 3, fame: 1 }),
    J('Fusion Technician', 95000, { from: 2035, sm: 55, edu: 3 }), J('Climate Engineer', 115000, { sm: 65, edu: 4 }),
    J('Orbital Construction Worker', 90000, { from: 2040, risk: 0.04 }), J('Gene Therapist', 160000, { sm: 70, edu: 4 }),
    J('Neural Surgeon', 280000, { sm: 80, edu: 4 }), J('Mars Colonist', 120000, { from: 2041, sm: 50, risk: 0.03, fame: 2 }),
    J('Holo-Performer', 70000, { lk: 60, fame: 3, vol: 0.8 }), J('Longevity Doctor', 220000, { from: 2060, sm: 75, edu: 4 }),
  ],
  acts: [
    { id: 'vr', n: 'Take a VR retreat', d: 'A week somewhere that does not exist.', min: 10, cost: 500, fx: { hp: [6, 12] }, t: 'You spent a week on a virtual island. Real life feels a little grey now.' },
    { id: 'genetune', n: 'Gene-tune your looks', d: 'Edit the mirror.', from: 2045, min: 18, cost: 30000, fx: { lk: [8, 15] }, t: 'Subtle edits, striking results.', risk: { p: 0.08, fx: { h: -15 }, t: 'Your body rejected the edit. Weeks of fever.' } },
    { id: 'orbit', n: 'Book an orbital flight', d: 'See the curve of the Earth.', from: 2040, min: 16, cost: 60000, fx: { hp: [12, 20], rep: 3 }, t: 'You watched a sunrise from orbit. You will never be quite the same.' },
    { id: 'neural', n: 'Neural learning session', d: 'Knowledge, direct to cortex.', from: 2050, min: 12, cost: 3000, fx: { sm: [4, 8] }, t: 'You woke up fluent in something new.' },
    { id: 'rejuv', n: 'Rejuvenation therapy', d: 'Turn back a decade of cells.', from: 2060, min: 50, cost: 80000, fx: { h: [10, 20], lk: 4 }, t: 'Your joints stopped aching. Your grandchildren are jealous.' },
  ],
  dis: [D('Engineered flu', 0.01, 10, 0.03, 1, 0.5), D('Heat stroke', 0.02, 12, 0.03, 1, 0.2), Object.assign(D('Cancer', 0.002, 8, 0.05, 3, 0.85), { ag: true }), D('Neural implant glitch', 0.005, 6, 0, 1, 0.3)],
  ev: [
    { id: 'automate', p: 0.04, min: 18, c: p => !!p.job, t: 'An AI system can now do most of your job.', odds: 0.5, win: { t: 'Your employer kept you on to supervise it.' }, alt: { fx: { fire: 1, hp: -8 }, t: 'You were replaced by software.' } },
    { id: 'heatdome', p: 0.08, min: 1, t: 'A record heat dome settled over the city for weeks.', fx: { h: [-8, -2], hp: -4 } },
    { id: 'genetrial', p: 0.03, min: 18, t: 'You are offered a place in a gene-therapy trial.', ch: [{ l: 'Enrol', odds: 0.7, win: { fx: { h: 15, lk: 3 }, t: 'The therapy worked. You feel twenty years younger.' }, alt: { fx: { h: -15 }, t: 'Side effects put you in hospital for a month.' } }, { l: 'Decline', t: 'You will wait for the peer review.' }] },
    { id: 'marslottery', p: 0.04, min: 18, max: 45, from: 2041, once: true, t: 'The Mars colony lottery is open to new settlers.', ch: [{ l: 'Enter', odds: 0.2, win: { fx: { job: 'mars-colonist', rep: 10, hp: 10 }, t: 'You won a berth on the next ship to Mars!' }, alt: { t: 'Not selected this cycle.' } }, { l: 'Stay on Earth', t: 'Earth is enough for you.' }] },
    { id: 'drone', p: 0.04, min: 1, t: 'A delivery drone crashed through your window.', fx: { $: [-800, -100] } },
    { id: 'surge', p: 0.05, min: 1, t: 'Storm surges flooded your district.', fx: { $: [-5000, -500], hp: -5 } },
  ],
  assets: [
    A('Micro-apartment', 220000, 'home', { hp: 8, appr: 0.03 }), A('Smart home', 600000, 'home', { hp: 15, appr: 0.04 }),
    A('Sea-wall villa', 3000000, 'home', { hp: 20, rep: 8, appr: 0.02 }), A('Vertical farm share', 100000, 'land', { inc: 0.06 }),
    A('AI index fund', 20000, 'stock', { appr: 0.08, vol: 0.2, inc: 0.015 }), A('Self-driving pod', 60000, 'vehicle', { hp: 10, appr: -0.1 }),
    A('Companion robot', 25000, 'tech', { hp: 10, appr: -0.2 }), A('Neural implant', 40000, 'tech', { sm: 6, appr: -0.25 }),
  ],
  die: {
    kid: ['a rare genetic disorder', 'an engineered virus', 'an allergic reaction'],
    adult: ['cancer', 'heat stroke', 'a novel virus', 'an implant failure'],
    old: ['old age', 'heart failure', 'a stroke', 'organ failure'],
    acc: ['a drone collision', 'an autonomous vehicle crash', 'a flood', 'a fall'],
  },
});

DATA.eras.push({
  id: 'far', name: 'Far Future', from: 2150, to: 99999,
  blurb: 'Habitats, colony worlds and minds that can be backed up. Speculative, and strange.',
  pal: ['#7A4FD6', '#B89CFF'],
  cur: { n: 'stellar marks', s: '✦', r: 2 },
  life: { adult: 125, child: 0.005, med: 0.94, acc: 0.003, fert: 0.07, age: 0.35, tax: 0.3, retire: 110, birth: 0 },
  cost: 15000, names: 'far',
  edu: { n: ['Unschooled', 'Foundation', 'Academy', 'Collegium', 'Mastery'], comp: 2, cost: [0, 0, 0, 3000, 5000] },
  laws: {
    divorce: true, marry: 18, sameSex: true, ubi: 8000,
    list: ['Mind-backups are legal persons after thirty days of continuity', 'Synthetic beings hold limited civil rights', 'Colony charters guarantee free passage between worlds', 'Birth licences regulate population on crowded habitats', 'Death is optional for those who can pay, and hotly debated'],
  },
  L: { healer: 'Visit a nano-medic bay', love: 'Consult the resonance matcher', party: 'Go to a zero-g rave', gamble: 'Bet on asteroid racing', crime: 'Smuggle contraband between habitats', gym: 'Train in the high-gravity gym', study: 'Sync with the archive', faith: 'Visit the Hall of Silence', friend: 'Join a habitat guild' },
  jobs: [
    J('Hydroponics Tender', 22000), J('Synth Wrangler', 30000, { sm: 30 }), J('Asteroid Miner', 55000, { risk: 0.04 }),
    J('Quantum Archivist', 45000, { sm: 50, edu: 3 }), J('Terraformer', 70000, { sm: 55, edu: 3 }), J('Xenobiologist', 85000, { sm: 70, edu: 4, fame: 1 }),
    J('Starship Engineer', 80000, { sm: 65, edu: 3, risk: 0.01 }), J('Mind-Backup Technician', 75000, { sm: 60, edu: 3 }),
    J('Gravball Athlete', 60000, { lk: 50, fame: 3, vol: 0.7, risk: 0.02 }), J('Colony Diplomat', 110000, { sm: 60, edu: 4, rep: 50, fame: 2 }),
    J('Starship Captain', 180000, { sm: 70, edu: 4, rep: 50, fame: 3, risk: 0.01 }),
  ],
  acts: [
    { id: 'backup', n: 'Back up your mind', d: 'A copy of you, just in case.', min: 18, cost: 20000, fx: { hp: 5 }, set: 'backup', t: 'Your mind was archived. If the worst happens, you can be restored once.' },
    { id: 'colony', n: 'Visit a colony world', d: 'Violet skies, thin air.', min: 10, cost: 15000, fx: { hp: [10, 18], sm: 3 }, t: 'You walked under two suns and came home dizzy with wonder.' },
    { id: 'zerog', n: 'Play zero-g games', d: 'Up is a matter of opinion.', min: 8, cost: 200, fx: { hp: [5, 10], h: 2 }, t: 'You scored a hat-trick in the zero-g arena.' },
    { id: 'sanctuary', n: 'Rest in a holo-sanctuary', d: 'Rain on Old Earth leaves.', min: 5, cost: 100, fx: { hp: [4, 9] }, t: 'You listened to simulated rain on simulated leaves. Bliss.' },
    { id: 'renewal', n: 'Undergo cellular renewal', d: 'The expensive fountain of youth.', min: 40, cost: 40000, fx: { h: [15, 30], lk: 5 }, t: 'Your cells were coaxed back to their prime.' },
  ],
  dis: [D('Void sickness', 0.01, 10, 0.03, 1, 0.4), D('Nanite drift', 0.006, 12, 0.04, 1, 0.5), D('Xeno-spore fever', 0.005, 15, 0.08, 1, 0.7), D('Radiation sickness', 0.008, 14, 0.05, 1, 0.6)],
  ev: [
    { id: 'flare', p: 0.06, min: 1, t: 'A solar flare knocked out habitat systems for days.', fx: { h: [-10, -2], hp: -5 } },
    { id: 'signal', p: 0.02, min: 6, once: true, t: 'Rumours of a signal from beyond the heliopause fill every feed.', fx: { sm: 3, hp: 5 } },
    { id: 'homestead', p: 0.04, min: 18, t: 'A frontier colony is offering land grants to settlers.', ch: [{ l: 'Emigrate', odds: 0.7, win: { fx: { $: [5000, 20000], hp: 8 }, t: 'You carved out a homestead under a violet sky.' }, alt: { fx: { h: -20 }, t: 'Frontier life nearly broke you.' } }, { l: 'Stay', t: 'The habitat is home.' }] },
    { id: 'synth', p: 0.04, min: 16, t: 'A synthetic being asks you to vouch for its citizenship.', ch: [{ l: 'Vouch for it', fx: { rep: 5, hp: 4 }, t: 'It thanked you with unsettling sincerity.' }, { l: 'Refuse', fx: { rep: -3 }, t: 'It filed your refusal with polite neutrality.' }] },
    { id: 'memglitch', p: 0.03, min: 30, t: 'A neural sync glitch erased a year of your memories.', fx: { sm: -4, hp: -4 } },
  ],
  assets: [
    A('Habitat pod', 50000, 'home', { hp: 8 }), A('Ring-deck apartment', 200000, 'home', { hp: 14, appr: 0.03 }),
    A('Asteroid estate', 2000000, 'home', { hp: 20, rep: 10, appr: 0.02 }), A('Terraforming shares', 50000, 'stock', { appr: 0.08, vol: 0.25, inc: 0.02 }),
    A('Mining claim', 150000, 'land', { inc: 0.07 }), A('Personal shuttle', 300000, 'vehicle', { hp: 14, rep: 5, appr: -0.08 }),
    A('Synthetic companion', 80000, 'tech', { hp: 12, appr: -0.15 }),
  ],
  die: {
    kid: ['a gene-drive fault', 'void sickness'],
    adult: ['radiation sickness', 'a hull breach', 'nanite drift', 'xeno-spore fever'],
    old: ['old age', 'cellular collapse', 'neural decay'],
    acc: ['a hull breach', 'an airlock accident', 'a shuttle crash', 'a low-gravity fall'],
  },
});
