/* =====================================================================
   EXTRA DATA — pets, organisations (entities), school clubs, and more
   life events using the new stats, classes, genetics and families.
   Costs are shares of the era's yearly living cost.
   ===================================================================== */

DATA.pets = [
  { id: 'dog', n: 'Dog', life: [10, 15], cost: 0.03, from: -3000, bonus: { h: 1, hp: 2 }, acts: ['walk', 'play', 'train'] },
  { id: 'cat', n: 'Cat', life: [12, 18], cost: 0.02, from: -3000, bonus: { hp: 2, mh: 1 }, acts: ['play', 'groom'] },
  { id: 'goat', n: 'Goat', life: [12, 16], cost: 0.03, to: 1900, bonus: { h: 1 }, acts: ['milk', 'play'] },
  { id: 'horse', n: 'Horse', life: [25, 30], cost: 0.4, from: -2000, to: 1950, bonus: { rep: 1, h: 1 }, acts: ['ride', 'groom'] },
  { id: 'falcon', n: 'Falcon', life: [12, 18], cost: 0.3, from: 500, to: 1700, bonus: { rep: 2 }, acts: ['hunt', 'train'], cls: 4 },
  { id: 'parrot', n: 'Parrot', life: [30, 60], cost: 0.1, from: 1500, bonus: { hp: 2, im: 1 }, acts: ['teach', 'play'] },
  { id: 'goldfish', n: 'Goldfish', life: [5, 12], cost: 0.005, from: 1600, bonus: { mh: 1 }, acts: ['feed'] },
  { id: 'rabbit', n: 'Rabbit', life: [8, 12], cost: 0.01, from: 1800, bonus: { hp: 2 }, acts: ['play', 'groom'] },
  { id: 'hamster', n: 'Hamster', life: [2, 3], cost: 0.005, from: 1930, bonus: { hp: 1 }, acts: ['play'] },
  { id: 'lizard', n: 'Bearded dragon', life: [10, 15], cost: 0.02, from: 1970, bonus: { im: 1 }, acts: ['feed'] },
  { id: 'robodog', n: 'Robot dog', life: [15, 25], cost: 0.15, from: 2030, bonus: { hp: 2 }, acts: ['play', 'upgrade'] },
  { id: 'holocat', n: 'Holo-cat', life: [60, 90], cost: 0.05, from: 2100, bonus: { mh: 2 }, acts: ['play'] },
  { id: 'dragon', n: 'Gene-crafted mini dragon', life: [40, 80], cost: 1, from: 2200, bonus: { fm: 1, hp: 3 }, acts: ['fly', 'train'] },
];
DATA.petNames = 'Argos Biscuit Shadow Pepper Luna Max Bella Rex Mittens Cleo Ziggy Nutmeg Pip Ember Sultan Duchess Comet Mochi Juno Bramble Pharaoh Pixel Nova Sprocket Fig Olive Hazel Bandit Tofu Mango'.split(' ');

// k: kind; req: min stats; fee/yr; perk per rank; risk: yearly injury chance
DATA.orgs = [
  { id: 'temple', n: 'the city temple', k: 'Faith', to: 500, req: {}, fee: 0.01, ranks: ['Worshipper', 'Acolyte', 'High priest'], perk: { mh: 2, rep: 1 } },
  { id: 'academy', n: 'the Academy of philosophers', k: 'Learning', from: -387, to: 529, req: { sm: 60 }, fee: 0.05, ranks: ['Student', 'Fellow', 'Scholarch'], perk: { sm: 2, rep: 1 } },
  { id: 'senate', n: 'the Senate', k: 'Power', from: -509, to: 476, cc: ['ITA'], req: { rep: 60, cls: 4 }, fee: 0.2, ranks: ['Senator', 'Consul', 'Princeps'], perk: { rep: 2, fm: 2 } },
  { id: 'merchantguild', n: "the merchants' guild", k: 'Guild', from: 900, to: 1800, req: {}, fee: 0.1, ranks: ['Member', 'Warden', 'Master'], perk: { $: 0.05, rep: 1 } },
  { id: 'craftguild', n: 'the craft guild', k: 'Guild', from: 900, to: 1850, req: {}, fee: 0.05, ranks: ['Apprentice', 'Journeyman', 'Master'], perk: { sm: 1, $: 0.03 } },
  { id: 'monastic', n: 'a monastic order', k: 'Faith', from: 500, to: 1800, req: {}, fee: 0, ranks: ['Novice', 'Brother or sister', 'Abbot or abbess'], perk: { mh: 3, sm: 1 } },
  { id: 'knights', n: 'a knightly order', k: 'Power', from: 1100, to: 1600, req: { cls: 4, sex: 'M' }, fee: 0.3, ranks: ['Squire', 'Knight', 'Grand Master'], perk: { rep: 2, fm: 1 }, risk: 0.03 },
  { id: 'hansa', n: 'the Hanseatic League', k: 'Trade', from: 1356, to: 1669, cc: ['ENG', 'RUS'], req: { sm: 35 }, fee: 0.2, ranks: ['Merchant', 'Alderman', 'Burgomaster'], perk: { $: 0.1 } },
  { id: 'lynx', n: 'the Academy of the Lynxes', k: 'Learning', from: 1603, to: 1651, cc: ['ITA'], req: { sm: 70 }, fee: 0.05, ranks: ['Fellow', 'Secretary', 'Prince'], perk: { sm: 3, fm: 1 } },
  { id: 'royalsoc', n: 'the Royal Society', k: 'Learning', from: 1660, cc: ['ENG'], req: { sm: 70, edu: 3 }, fee: 0.1, ranks: ['Fellow', 'Council member', 'President'], perk: { sm: 2, rep: 2, fm: 1 } },
  { id: 'eic', n: 'the East India Company', k: 'Company', from: 1600, to: 1874, cc: ['ENG', 'IND'], req: { sm: 40 }, fee: 0.5, ranks: ['Shareholder', 'Director', 'Governor'], perk: { $: 0.15 } },
  { id: 'masons', n: 'a Freemasons lodge', k: 'Society', from: 1717, req: { rep: 30 }, fee: 0.05, ranks: ['Apprentice', 'Fellowcraft', 'Grand Master'], perk: { rep: 2 } },
  { id: 'liberty', n: 'the Sons of Liberty', k: 'Politics', from: 1765, to: 1783, cc: ['USA'], req: {}, fee: 0, ranks: ['Member', 'Organiser', 'Leader'], perk: { rep: 2, fm: 1 } },
  { id: 'union', n: 'a trade union', k: 'Labour', from: 1830, req: { job: 1 }, fee: 0.02, ranks: ['Member', 'Shop steward', 'General secretary'], perk: { $: 0.03, rep: 1 } },
  { id: 'temperance', n: 'the temperance society', k: 'Society', from: 1826, to: 1933, req: {}, fee: 0.01, ranks: ['Member', 'Lecturer', 'President'], perk: { h: 1, wp: 2 } },
  { id: 'suffrage', n: 'the suffrage society', k: 'Politics', from: 1865, to: 1930, req: {}, fee: 0.01, ranks: ['Member', 'Organiser', 'President'], perk: { rep: 2, fm: 1 } },
  { id: 'redcross', n: 'the Red Cross', k: 'Charity', from: 1863, req: {}, fee: 0, ranks: ['Volunteer', 'Coordinator', 'Director'], perk: { rep: 2, mh: 2 } },
  { id: 'party', n: 'a political party', k: 'Politics', from: 1830, req: { age: 18 }, fee: 0.02, ranks: ['Member', 'Candidate', 'Party leader'], perk: { rep: 1, fm: 2 } },
  { id: 'rotary', n: 'a civic club', k: 'Society', from: 1905, req: { age: 21 }, fee: 0.02, ranks: ['Member', 'Treasurer', 'President'], perk: { rep: 2 } },
  { id: 'studio', n: 'a film studio', k: 'Company', from: 1915, req: { lk: 50 }, fee: 0, ranks: ['Extra', 'Contract player', 'Star'], perk: { fm: 3 } },
  { id: 'resistance', n: 'the resistance network', k: 'Politics', from: 1940, to: 1945, cc: ['FRA', 'ITA', 'GRC', 'RUS', 'CHN'], req: {}, fee: 0, ranks: ['Courier', 'Cell leader', 'Commander'], perk: { rep: 4, fm: 2 }, risk: 0.06 },
  { id: 'ngo', n: 'an international charity', k: 'Charity', from: 1945, req: {}, fee: 0.01, ranks: ['Volunteer', 'Field lead', 'Director'], perk: { rep: 2, mh: 2 } },
  { id: 'space', n: 'the national space agency', k: 'Science', from: 1958, req: { sm: 75, edu: 3 }, fee: 0, ranks: ['Engineer', 'Mission lead', 'Director'], perk: { sm: 2, fm: 2 } },
  { id: 'techco', n: 'a tech giant', k: 'Company', from: 1995, req: { sm: 55, edu: 3 }, fee: 0, ranks: ['Employee', 'Manager', 'Executive'], perk: { $: 0.2 } },
  { id: 'online', n: 'an online community', k: 'Society', from: 1995, req: { age: 13 }, fee: 0, ranks: ['Lurker', 'Moderator', 'Admin'], perk: { hp: 2, im: 1 } },
  { id: 'aisafe', n: 'the AI Safety Institute', k: 'Science', from: 2030, req: { sm: 70, edu: 3 }, fee: 0, ranks: ['Researcher', 'Lead', 'Director'], perk: { sm: 2, rep: 2 } },
  { id: 'climate', n: 'the Climate Coalition', k: 'Politics', from: 2030, req: {}, fee: 0.01, ranks: ['Member', 'Organiser', 'Chair'], perk: { rep: 2, mh: 1 } },
  { id: 'mca', n: 'the Mars Colonial Authority', k: 'Power', from: 2041, req: { sm: 60 }, fee: 0.1, ranks: ['Applicant', 'Officer', 'Administrator'], perk: { fm: 2, rep: 2 } },
  { id: 'megacorp', n: 'a megacorporation', k: 'Company', from: 2050, req: { sm: 50 }, fee: 0, ranks: ['Associate', 'Vice-president', 'Board member'], perk: { $: 0.25 } },
  { id: 'colonyguild', n: 'the Colony Guild', k: 'Guild', from: 2150, req: {}, fee: 0.05, ranks: ['Member', 'Guildmaster', 'Grand guildmaster'], perk: { $: 0.05, rep: 1 } },
  { id: 'solarnavy', n: 'the Solar Navy', k: 'Power', from: 2150, req: { age: 18 }, fee: 0, ranks: ['Crew', 'Officer', 'Admiral'], perk: { rep: 2, fm: 2 }, risk: 0.02 },
  { id: 'archive', n: 'the Mind-Archive Collective', k: 'Science', from: 2150, req: { sm: 60 }, fee: 0.05, ranks: ['Member', 'Curator', 'Keeper'], perk: { sm: 2, im: 2 } },
  { id: 'freetraders', n: 'the Free Traders', k: 'Trade', from: 2150, req: {}, fee: 0.1, ranks: ['Crewhand', 'Captain', 'Commodore'], perk: { $: 0.1 } },
];

DATA.clubs = {
  ancient: ['Wrestling at the palaestra', 'Lyre lessons', 'Rhetoric circle'], medieval: ['Choir', 'Latin recitation', 'Archery'],
  renaissance: ['Fencing', 'Drawing', 'Madrigal singing'], colonial: ['Debating society', 'Choir', 'Cricket'],
  industrial: ['Cricket', 'Debating society', 'Brass band'], wars: ['Baseball', 'School newspaper', 'Glee club'],
  modern: ['Football team', 'Drama club', 'Chess club', 'Marching band'], digital: ['Robotics club', 'E-sports team', 'Debate team', 'Theatre'],
  near: ['Drone racing', 'Coding guild', 'VR theatre'], far: ['Zero-g polo', 'Xenobiology society', 'Holo-orchestra'],
};

/* ---------- more life events ----------
   Extra fx keys handled by engine-world: royal, rival, perf, bmi */
const hasKid = (p, S, lo, hi) => S.kids(p).some(k => S.alive(k) && S.age(k) >= lo && S.age(k) <= hi);
DATA.moreEvents = [
  { id: 'milestone', p: 1, c: (p, S) => [18, 21, 30, 40, 50, 60, 70, 80, 90, 100].includes(S.age(p)), t: 'It is a milestone birthday!', ch: [{ l: 'Throw a big party', fx: { $c: -0.03, hp: 8, rep: 1 }, t: 'Everyone came. Someone cried. It was perfect.' }, { l: 'Quiet dinner with family', fx: { hp: 4, mh: 2 }, t: 'Simple, warm, just right.' }, { l: 'Ignore it', fx: { mh: -2 }, t: 'Just another day, you tell yourself.' }] },
  { id: 'darkcloud', p: 0.1, min: 12, c: p => (p.mh ?? 60) < 30, t: 'A dark cloud has settled over you. Getting out of bed is hard.', ch: [{ l: 'Talk to someone you trust', fx: { mh: 8, hp: 3 }, t: 'Saying it out loud helped more than you expected.' }, { l: 'Throw yourself into work', fx: { mh: -2, wp: 2, perf: 8 }, t: 'Busy hands, heavy heart.' }, { l: 'Bottle it up', fx: { mh: -5 }, t: 'It is still there, waiting.' }] },
  { id: 'anxiety', p: 0.05, min: 12, c: p => (p.mh ?? 60) < 45, t: 'Your heart raced and your hands shook, for no reason at all.', fx: { mh: -3, hp: -2 } },
  { id: 'burnout', p: 0.12, min: 20, c: p => p.job && p.job.perf > 80 && (p.mh ?? 60) < 55, t: 'You are exhausted. Burnout is catching up with you.', ch: [{ l: 'Take time off', fx: { mh: 8, hp: 5, perf: -10 }, t: 'You slept for a week. The world did not end.' }, { l: 'Push through', fx: { mh: -8, wp: 2, perf: 5 }, t: 'You kept going. For now.' }] },
  { id: 'temptation', p: 0.06, min: 16, c: p => (p.wp ?? 50) < 40, t: 'Old friends want you out for a night of drink and dice.', ch: [{ l: 'Give in', fx: { hp: 5, h: -5, $c: -0.02, wp: -2 }, t: 'A great night. A terrible morning.' }, { l: 'Resist', odds: p => (p.wp ?? 50) / 100 + 0.2, win: { fx: { wp: 4, mh: 2 }, t: 'You walked away, and felt proud.' }, alt: { fx: { h: -4, hp: 3 }, t: 'You lasted about an hour.' } }] },
  { id: 'resolution', p: 0.07, min: 14, t: 'A new year, a new you? You make a resolution.', ch: [{ l: 'Get fit', odds: p => (p.wp ?? 50) / 100, win: { fx: { h: 4, wp: 2, bmi: -1 }, t: 'You kept it all year!' }, alt: { fx: { wp: -1 }, t: 'It lasted until February.' } }, { l: 'Learn something new', fx: { sm: 3, im: 1 }, t: 'You kept at it.' }, { l: 'Be kinder', fx: { rep: 2, mh: 2 }, t: 'People noticed.' }] },
  { id: 'inspiration', p: 0.06, min: 10, c: p => (p.im ?? 50) > 60, t: 'Inspiration struck in the middle of the night!', ch: [{ l: 'Get up and create', odds: p => (p.im ?? 50) / 120, win: { fx: { fm: 5, $c: 0.2, im: 2 }, t: 'What you made that night found an audience.' }, alt: { fx: { im: 2 }, t: 'It seemed better at three in the morning.' } }, { l: 'Go back to sleep', fx: { h: 1 }, t: 'The idea was gone by breakfast.' }] },
  { id: 'dreamfar', p: 0.04, min: 5, t: 'You had a vivid dream about a world centuries away.', fx: { im: 3 } },
  { id: 'infertile', p: 0.2, min: 25, max: 42, c: (p, S) => S.spouse(p) && S.alive(S.spouse(p)) && p.kids.length === 0 && ((p.fe ?? 60) < 40 || (S.spouse(p).fe ?? 60) < 40), t: 'Despite trying, no baby has come.', ch: [{ l: 'See a physician', odds: 0.4, win: { fx: { fe: 15, mh: 3 }, t: 'Treatment helped. There is hope.' }, alt: { fx: { mh: -3 }, t: 'There was little they could do.' } }, { l: 'Consider adoption', fx: { mh: 2 }, t: 'You started asking around. (Your spouse’s menu offers adoption.)' }, { l: 'Accept it', fx: { mh: -2 }, t: 'You grieve for what might have been.' }] },
  { id: 'glasses', p: 0.35, min: 8, max: 25, from: 1290, once: true, c: p => p.g && p.g.myo[0] && p.g.myo[1], t: 'The far hills have gone blurry. You are short-sighted.', ch: [{ l: 'Get spectacles', fx: { $c: -0.02, sm: 2, lk: -1 }, t: 'The world snapped into focus!' }, { l: 'Squint', fx: { sm: -1 }, t: 'You bumped into things for years.' }] },
  { id: 'myopia_old', p: 0.35, min: 8, max: 25, to: 1289, once: true, c: p => p.g && p.g.myo[0] && p.g.myo[1], t: 'Faces blur beyond a few paces. Nobody has invented spectacles yet.', fx: { sm: -1, mh: -1 } },
  { id: 'colourblind', p: 0.5, min: 6, max: 14, once: true, c: p => !!p.g && Gen.effects.colourBlind(p), t: 'You mixed up red and green again. It turns out you are colour blind.', fx: { im: 1 } },
  { id: 'royalsuitor', p: 0.005, min: 18, max: 35, c: p => p.sp == null && (p.cls ?? 2) >= 3, t: 'A member of the royal family has taken an interest in you!', ch: [{ l: 'Court them', odds: 0.4, win: { fx: { royal: 1 }, t: 'Against every expectation, you married into the royal family!' }, alt: { fx: { rep: -3, mh: -3 }, t: 'The palace decided you were unsuitable.' } }, { l: 'Politely decline', fx: { rep: 2 }, t: 'The gossip lasted for years.' }] },
  { id: 'snub', p: 0.05, min: 16, c: p => (p.cls ?? 2) <= 2, t: 'A haughty aristocrat snubbed you in public.', ch: [{ l: 'Snub them back', fx: { rep: -2, mh: 2 }, t: 'It felt wonderful.' }, { l: 'Swallow it', fx: { mh: -3 }, t: 'It stung for days.' }] },
  { id: 'evict', p: 0.1, min: 18, c: p => (p.cls ?? 2) <= 1 && p.money < 0, t: 'Your landlord is threatening to throw you out.', ch: [{ l: 'Beg for more time', odds: 0.5, win: { t: 'They gave you three more months.' }, alt: { fx: { hp: -8, h: -3 }, t: 'You slept rough for a season.' } }, { l: 'Pack your things', fx: { hp: -6 }, t: 'You found a smaller, colder place.' }] },
  { id: 'court', p: 0.06, min: 16, c: p => (p.cls ?? 2) >= 5, t: 'You are invited to a grand ball at court.', ch: [{ l: 'Attend', fx: { rep: 4, fm: 3, $c: -0.1 }, t: 'You danced with half the powerful people in the realm.' }, { l: 'Send regrets', fx: { rep: -2 }, t: 'Your absence was noted.' }] },
  { id: 'dogsaves', p: 0.03, min: 3, c: (p, S) => S.petsOf(p).some(x => x.kind === 'dog'), t: 'Your dog barked you awake as smoke filled the house. It saved your life.', fx: { hp: 5, mh: 3 } },
  { id: 'kidfight', p: 0.06, min: 22, c: (p, S) => hasKid(p, S, 6, 16), t: 'Your child got into a fight with another child.', ch: [{ l: 'Punish them', fx: { rep: 1 }, t: 'They sulked for a week.' }, { l: 'Hear their side first', fx: { mh: 2 }, t: 'It turned out they were defending a friend.' }, { l: 'Shout at the other parents', fx: { rep: -3, hp: 2 }, t: 'You felt great. Everyone else felt awkward.' }] },
  { id: 'teenmoney', p: 0.06, min: 30, c: (p, S) => hasKid(p, S, 13, 19), t: 'Your teenager wants to borrow money for something "really important".', ch: [{ l: 'Hand it over', fx: { $c: -0.02, hp: 2 }, t: 'You never saw that money again.' }, { l: 'Say no', fx: { hp: -1 }, t: 'Doors were slammed.' }] },
  { id: 'eldercare', p: 0.08, min: 30, c: (p, S) => S.parents(p).some(x => S.alive(x) && S.age(x) >= 75), t: 'Your elderly parent can no longer live alone.', ch: [{ l: 'Take them in', fx: { $c: -0.05, mh: -2, rep: 3, carer: 1 }, t: 'The house is fuller, and warmer.' }, { l: 'Pay for their care', fx: { $c: -0.15 }, t: 'You visit on Sundays.' }, { l: 'Leave it to your siblings', fx: { rep: -3 }, t: 'Family dinners got frosty.' }] },
  { id: 'reunion', p: 0.04, min: 30, t: 'A reunion with your old schoolmates. Everyone looks... older.', fx: { hp: 4 } },
  { id: 'follower', p: 0.02, min: 14, t: 'A stranger seems to be following you home.', ch: [{ l: 'Confront them', odds: 0.6, win: { fx: { wp: 2 }, t: 'They fled. You stood tall.' }, alt: { fx: { h: -8 }, t: 'It turned into a scuffle.' } }, { l: 'Hide and wait', fx: { mh: -3 }, t: 'You checked the locks three times that night.' }] },
  { id: 'doubt', p: 0.03, min: 16, t: 'You find yourself questioning everything you were taught to believe.', ch: [{ l: 'Seek answers', fx: { sm: 2, mh: 1 }, t: 'Some answers raised better questions.' }, { l: 'Hold on to your faith', fx: { mh: 2 }, t: 'The doubt passed, and left you steadier.' }] },
  { id: 'rival', p: 0.04, min: 10, t: 'Someone has decided you are their rival.', ch: [{ l: 'Rise to the challenge', fx: { rival: 1, wp: 2 }, t: 'Game on.' }, { l: 'Try to make peace', odds: 0.5, win: { fx: { rep: 1 }, t: 'You became wary friends.' }, alt: { fx: { rival: 1 }, t: 'They took it as weakness.' } }] },
  { id: 'feast', p: 0.04, min: 18, c: p => (p.wp ?? 50) < 50, t: 'You have been eating far too well lately.', fx: { bmi: 1.5, hp: 2, h: -1 } },
];
