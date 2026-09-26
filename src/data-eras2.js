/* =====================================================================
   ERA TABLES, part 2 — Colonial & Enlightenment, Industrial
   ===================================================================== */

DATA.eras.push({
  id: 'colonial', name: 'Colonial & Enlightenment', short: 'Enlightenment', from: 1650, to: 1799,
  blurb: 'Coffeehouses, tall ships and pamphlets. Reason argues with kings, and sometimes wins.',
  pal: ['#1D6F78', '#5BC0C8'],
  cur: { n: 'pounds', s: '£', r: 150 },
  life: { adult: 60, child: 0.25, med: 0.1, acc: 0.006, fert: 0.27, age: 1, tax: 0.12, retire: 0, birth: 0.01 },
  cost: 18, names: 'colonial',
  edu: { n: ['Unschooled', 'Dame school', 'Grammar school', 'College', 'Doctorate'], comp: 0, cost: [0, 1, 3, 12, 20] },
  laws: {
    divorce: false, marry: 16, sameSex: false,
    list: ['Debtors can be thrown into prison', 'Press gangs may seize men for the navy', 'Divorce requires an Act of Parliament', 'Slavery is legal in the colonies, a crime the age will spend a century undoing', 'Coffeehouses are hotbeds of news and dissent'],
  },
  L: { healer: 'Call on the apothecary', love: 'Pay court at the assembly rooms', party: 'Carouse at the tavern', gamble: 'Play whist for stakes', crime: 'Smuggle untaxed tea', gym: 'Go riding', study: 'Study natural philosophy', faith: 'Attend Sunday meeting', friend: 'Linger at the coffeehouse' },
  jobs: [
    J('Farmer', 18), J('Tradesman', 30, { sm: 20 }), J('Sailor', 24, { risk: 0.04 }), J('Printer', 40, { sm: 35, edu: 1 }),
    J('Shopkeeper', 45, { sm: 25 }), J('Clergyman', 50, { sm: 40, edu: 2, sex: 'M', fame: 1 }),
    J('Soldier', 26, { sex: 'M', risk: 0.04, fame: 1 }), J('Lawyer', 120, { sm: 55, edu: 3 }),
    J('Physician', 110, { sm: 60, edu: 3 }), J('Naval Officer', 95, { sex: 'M', sm: 45, edu: 2, risk: 0.03, fame: 1 }),
    J('Merchant Trader', 140, { sm: 45, vol: 0.4 }), J('Natural Philosopher', 70, { sm: 75, edu: 3, fame: 2 }),
    J('Colonial Governor', 500, { sm: 55, edu: 3, rep: 70, fame: 2, grant: 'Sir' }),
  ],
  acts: [
    { id: 'coffee', n: 'Debate at a coffeehouse', d: 'News, rumours and revolution.', min: 16, cost: 1, fx: { sm: [1, 3], rep: 1, hp: 3 }, t: 'You argued politics over three pots of coffee.' },
    { id: 'salon', n: 'Attend a salon', d: 'Wit is the currency here.', min: 16, cost: 2, fx: { sm: [2, 4], rep: [1, 4] }, t: 'Your remarks were repeated around the salon all evening.' },
    { id: 'voyage', n: 'Sign on for a voyage', d: 'See the world, for wages.', min: 16, cost: 0, fx: { $: [5, 20], hp: 5, sm: 2 }, t: 'You sailed to distant ports and came home with pay and stories.', risk: { p: 0.15, fx: { h: [-30, -10] }, t: 'Scurvy and storms nearly killed you at sea.' } },
    { id: 'variolate', n: 'Get inoculated against smallpox', d: 'A small illness now, protection for life.', min: 1, cost: 3, fx: { h: -5 }, immune: 'smallpox', t: 'You were deliberately given a mild case of smallpox. It hurt, but you are protected.' },
  ],
  dis: [D('Smallpox', 0.012, 20, 0.2, 1, 0.6), D('Yellow fever', 0.01, 15, 0.2, 1, 0.7), D('Typhus', 0.015, 12, 0.1, 1, 0.5), D('Consumption', 0.012, 6, 0.08, 5, 0.7)],
  ev: [
    { id: 'pressgang', p: 0.04, min: 16, max: 40, sex: 'M', t: 'A press gang corners you outside the tavern!', ch: [{ l: 'Fight your way out', odds: 0.5, win: { fx: { rep: 2 }, t: 'You broke free and ran.' }, alt: { fx: { h: -10, job: 'sailor' }, t: 'They clubbed you and dragged you aboard. You are a sailor now.' } }, { l: 'Pay them off (3£)', fx: { $: -3 }, t: 'Coins changed hands and the gang moved on.' }] },
    { id: 'pirates', p: 0.03, min: 10, t: 'Pirates raided the harbour and looted the warehouses.', fx: { $: [-10, -1], hp: -4 } },
    { id: 'teatax', p: 0.12, min: 16, from: 1765, to: 1776, t: 'A new tax on tea and paper has everyone you know furious.', ch: [{ l: 'Join the protests', odds: 0.8, win: { fx: { rep: 4, hp: 3 }, t: 'You marched with your neighbours. Liberty!' }, alt: { fx: { jail: 1, rep: 2 }, t: 'You were arrested for sedition.' } }, { l: 'Keep your head down', fx: { hp: -2 }, t: 'You grumbled privately.' }] },
    { id: 'lottery', p: 0.04, min: 18, c: (p, S) => S.cash(p) >= 2, t: 'A state lottery ticket costs 2£.', ch: [{ l: 'Buy one', fx: { $: -2 }, odds: 0.05, win: { fx: { $: 300, hp: 20 }, t: 'Your number came up. You won the lottery!' }, alt: { t: 'No luck this time.' } }, { l: 'Pass', t: 'You kept your pounds.' }] },
    { id: 'silhouette', p: 0.04, min: 4, t: 'A silhouette artist snipped your profile in black paper.', fx: { hp: 3 } },
    { id: 'almanac', p: 0.05, min: 8, t: "You read an almanac's advice: early to bed, early to rise.", fx: { sm: 2, h: 1 } },
  ],
  assets: [
    A('Clapboard cottage', 40, 'home', { hp: 6 }), A('Brick townhouse', 400, 'home', { hp: 12, appr: 0.02 }),
    A('Country estate', 3000, 'land', { inc: 0.05, hp: 15, rep: 10, appr: 0.01 }),
    A('East India Company shares', 200, 'stock', { appr: 0.05, vol: 0.25, inc: 0.03 }),
    A('Carriage', 80, 'vehicle', { hp: 6, rep: 4, appr: -0.08 }), A('Pocket watch', 10, 'luxury', { lk: 2, hp: 3 }),
    A('Harpsichord', 60, 'luxury', { hp: 6, sm: 2 }),
  ],
  die: {
    kid: ['smallpox', 'a fever', 'the croup', 'measles'],
    adult: ['yellow fever', 'typhus', 'consumption', 'a fever'],
    old: ['old age', 'apoplexy', 'dropsy', 'gout'],
    acc: ['a carriage accident', 'drowning at sea', 'a fall from a horse', 'a tavern brawl'],
  },
});

DATA.eras.push({
  id: 'industrial', name: 'Industrial', from: 1800, to: 1913,
  blurb: 'Steam, soot and railways. Cities swell, fortunes are made, and children work the mills.',
  pal: ['#8C6A1E', '#DDB463'],
  cur: { n: 'dollars', s: '$', r: 30 },
  life: { adult: 62, child: 0.22, med: 0.15, acc: 0.008, fert: 0.22, age: 0.95, tax: 0.08, retire: 0, birth: 0.008 },
  cost: 130, names: 'industrial',
  edu: { n: ['Unschooled', 'Elementary school', 'Secondary school', 'University', 'Doctorate'], comp: 0, compAt: [[1870, 1]], cost: [0, 5, 30, 150, 250] },
  laws: {
    divorce: true, marry: 16, sameSex: false,
    list: ['Child labour is legal, though Factory Acts slowly limit it', 'Unions are fought, then grudgingly tolerated', 'Divorce is legal but scandalous', 'Most women cannot vote until the next century', 'Elementary schooling becomes compulsory in many nations from the 1870s'],
  },
  L: { healer: 'See a doctor', love: 'Walk out with a sweetheart', party: 'Visit the music hall', gamble: 'Bet on the horses', crime: 'Pick pockets on the omnibus', gym: 'Join a cycling club', study: 'Read at the public library', faith: 'Attend chapel', friend: "Join a working men's club" },
  jobs: [
    J('Domestic Servant', 200), J('Factory Hand', 250, { risk: 0.03 }), J('Coal Miner', 280, { risk: 0.06 }),
    J('Railway Porter', 300, { from: 1825 }), J('Police Constable', 420, { from: 1829, sm: 25, risk: 0.01 }),
    J('Clerk', 450, { sm: 35, edu: 1 }), J('Telegraph Operator', 480, { from: 1844, sm: 35, edu: 1 }),
    J('Nurse', 420, { from: 1860, sm: 35, edu: 2 }), J('Teacher', 500, { sm: 40, edu: 2 }),
    J('Journalist', 600, { sm: 50, edu: 2, fame: 1 }), J('Engineer', 1000, { sm: 60, edu: 3 }),
    J('Doctor', 1500, { sm: 65, edu: 4 }), J('Inventor', 700, { sm: 80, vol: 0.8, fame: 2 }),
    J('Industrialist', 6000, { sm: 60, rep: 55, vol: 0.5, fame: 2 }),
  ],
  acts: [
    { id: 'excursion', n: 'Take a railway excursion', d: 'The seaside, at forty miles an hour.', from: 1830, min: 6, cost: 3, fx: { hp: [5, 10] }, t: 'You rode the train to the seaside and paddled in the surf.' },
    { id: 'expo', n: "Visit a World's Fair", d: 'Marvels of every nation under glass.', from: 1851, min: 6, cost: 5, fx: { sm: [2, 5], hp: [4, 8] }, t: 'You gaped at engines, telephones and moving walkways at the exhibition.' },
    { id: 'union', n: 'Attend a union meeting', d: 'Solidarity, and some risk.', min: 16, cost: 0, fx: { rep: [1, 3], hp: 2 }, t: 'You stood with your fellow workers.', risk: { p: 0.1, fx: { h: -10, rep: -2 }, t: 'Police broke up the meeting with truncheons.' } },
    { id: 'photo', n: 'Sit for a photograph', d: 'Hold perfectly still.', from: 1840, min: 1, cost: 2, fx: { hp: 4 }, t: 'You held still for the camera. The portrait is stern but striking.' },
  ],
  dis: [D('Cholera', 0.008, 25, 0.3, 1, 0.6), D('Tuberculosis', 0.012, 8, 0.07, 4, 0.8), D('Typhoid', 0.01, 15, 0.15, 1, 0.6), Object.assign(D('Diphtheria', 0.01, 15, 0.15, 1, 0.5), { kid: true }), D('Smallpox', 0.005, 20, 0.15, 1, 0.5)],
  ev: [
    { id: 'machine', p: 0.07, min: 8, c: p => p.job && p.job.risk >= 0.02, t: 'A machine at work caught your sleeve and dragged your arm in.', fx: { h: [-25, -8] } },
    { id: 'strike', p: 0.05, min: 16, c: p => !!p.job, t: 'Your fellow workers call a strike for better pay.', ch: [{ l: 'Join the strike', odds: 0.55, win: { fx: { $: 40, rep: 3 }, t: 'The owners gave in. Wages went up!' }, alt: { fx: { $: -30, rep: 2, fire: 1 }, t: 'The strike failed and you were blacklisted.' } }, { l: 'Cross the picket line', fx: { rep: -8 }, t: "Your coworkers won't look at you." }] },
    { id: 'railshares', p: 0.05, min: 20, from: 1825, to: 1900, c: (p, S) => S.cash(p) >= 100, t: 'A promoter is selling shares in a new railway line.', ch: [{ l: 'Buy $100 of shares', fx: { $: -100 }, odds: 0.5, win: { fx: { $: 250 }, t: 'The line opened on time and your shares soared!' }, alt: { t: 'The railway company collapsed. Railway mania claims another victim.' } }, { l: 'Pass', t: 'You kept your savings in the mattress.' }] },
    { id: 'smog', p: 0.06, min: 1, t: 'Thick yellow smog hung over the city for a week.', fx: { h: [-6, -2] } },
    { id: 'pickpocket', p: 0.05, min: 12, t: 'A pickpocket lifted your wallet on a crowded platform.', fx: { $: [-15, -2] } },
    { id: 'goldrush', p: 0.1, min: 16, max: 45, from: 1848, to: 1855, once: true, t: 'News of gold in the West sweeps the country.', ch: [{ l: 'Go prospecting', odds: 0.25, win: { fx: { $: [300, 1500], hp: 10 }, t: 'You struck a rich vein!' }, alt: { fx: { h: -10, $: -50 }, t: 'You came back broke, sunburned and wiser.' } }, { l: 'Stay put', t: 'You let others chase the dream.' }] },
  ],
  assets: [
    A('Tenement flat', 300, 'home', { hp: 4 }), A('Terraced house', 1500, 'home', { hp: 10, appr: 0.02 }),
    A('Mansion', 30000, 'home', { hp: 18, rep: 12, appr: 0.02 }), A('Farm', 2500, 'land', { inc: 0.07 }),
    A('Railway shares', 500, 'stock', { appr: 0.05, vol: 0.25, inc: 0.03 }), A('Bicycle', 30, 'vehicle', { from: 1870, hp: 5, appr: -0.1 }),
    A('Automobile', 1500, 'vehicle', { from: 1890, hp: 12, rep: 5, appr: -0.12 }), A('Piano', 250, 'luxury', { hp: 6, sm: 2 }),
  ],
  die: {
    kid: ['diphtheria', 'scarlet fever', 'whooping cough', 'measles'],
    adult: ['tuberculosis', 'typhoid', 'pneumonia', 'a fever'],
    old: ['old age', 'heart failure', 'a stroke', 'bronchitis'],
    acc: ['a factory accident', 'a railway accident', 'a mine collapse', 'being struck by a carriage'],
  },
});
