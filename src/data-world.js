/* =====================================================================
   WORLD DATA — dated history, universal life events, activities and
   achievements.

   History types
     plague     inf yearly infection chance, let lethality/yr, dmg health/yr, dn disease name
     war        draft yearly call-up chance (men 18-45), mort death/yr while serving, civ civilian death/yr
     famine     mort extra death chance/yr, dmg health loss/yr
     crash      loss share of cash wiped out (first year), lay yearly layoff chance
     disaster   p chance you are hit each year, fx effects, loss share of cash
     medicine   med permanent boost to medicine for the rest of the era
     revolution strip chance titled people lose title and half their wealth
     tech / culture / politics / law — news, optional fx on everyone
   ===================================================================== */

const H = (y, type, t, o = {}) => Object.assign({ y, type, t, key: `${type}${y}` }, o);

DATA.history = [
  // Ancient
  H(-2560, 'tech', 'The Great Pyramid rises at Giza. Travellers speak of nothing else.'),
  H(-1754, 'law', "Hammurabi's law code is carved in stone: an eye for an eye."),
  H(-1200, 'war', 'The Bronze Age collapses. Cities burn and sea raiders prowl the coasts.', { end: -1150, n: 'Bronze Age Collapse', draft: 0.05, mort: 0.04, civ: 0.004 }),
  H(-776, 'culture', 'The first Olympic Games are held at Olympia.'),
  H(-753, 'politics', 'Rome is founded on the banks of the Tiber, or so they say.'),
  H(-508, 'politics', 'Athens adopts democracy. Citizens vote with pebbles and potsherds.'),
  H(-490, 'war', 'Persia invades Greece. A runner brings news from Marathon.', { end: -479, n: 'Persian Wars', draft: 0.12, mort: 0.05 }),
  H(-431, 'war', 'The Peloponnesian War sets Athens against Sparta.', { end: -404, n: 'Peloponnesian War', draft: 0.06, mort: 0.03 }),
  H(-430, 'plague', 'Plague breaks out inside the crowded walls of Athens.', { end: -426, n: 'Plague of Athens', dn: 'Plague of Athens', inf: 0.1, let: 0.25, dmg: 20 }),
  H(-336, 'politics', 'Alexander becomes king of Macedon and sets out to conquer the world.'),
  H(-221, 'politics', 'The Qin unify China under a single emperor.'),
  H(-218, 'war', 'Hannibal crosses the Alps with war elephants.', { end: -201, n: 'Second Punic War', draft: 0.08, mort: 0.04 }),
  H(-44, 'politics', 'Julius Caesar is stabbed to death in the Senate.'),
  H(-27, 'politics', 'Augustus becomes the first Roman emperor. The Pax Romana begins.'),
  H(79, 'disaster', 'Mount Vesuvius erupts and buries Pompeii in ash.', { p: 0.05, fx: { h: -20, hp: -10 }, loss: 0.5 }),
  H(165, 'plague', 'The Antonine Plague spreads along the trade routes.', { end: 180, n: 'Antonine Plague', dn: 'Antonine Plague', inf: 0.03, let: 0.2, dmg: 18 }),
  H(313, 'law', 'The Edict of Milan grants tolerance to Christians.'),
  H(410, 'disaster', 'The Visigoths sack Rome. The eternal city is not so eternal.', { p: 0.05, fx: { h: -10, hp: -8 }, loss: 0.3 }),
  H(476, 'politics', 'The last Western Roman emperor is deposed. An age ends.'),
  // Medieval
  H(541, 'plague', 'The Plague of Justinian sweeps through the empire.', { end: 549, n: 'Plague of Justinian', dn: 'Plague of Justinian', inf: 0.07, let: 0.35, dmg: 25 }),
  H(622, 'culture', 'The Prophet Muhammad and his followers make the Hijra to Medina.'),
  H(732, 'war', 'Frankish armies meet the Umayyad host near Tours.', { n: 'Battle of Tours', draft: 0.1, mort: 0.06 }),
  H(793, 'disaster', 'Viking raiders strike the monastery at Lindisfarne. No coast is safe.', { end: 900, p: 0.02, fx: { h: -12, hp: -6 }, loss: 0.3 }),
  H(800, 'politics', 'Charlemagne is crowned Emperor of the Romans on Christmas Day.'),
  H(1066, 'war', 'Duke William of Normandy invades England.', { n: 'Norman Conquest', draft: 0.2, mort: 0.1 }),
  H(1096, 'culture', 'The First Crusade sets out for Jerusalem.'),
  H(1206, 'politics', 'Genghis Khan unites the Mongol tribes. The steppe stirs.'),
  H(1215, 'law', 'Rebel barons force King John to seal the Magna Carta.'),
  H(1315, 'famine', 'Endless rain rots the crops. The Great Famine begins.', { end: 1317, n: 'Great Famine', mort: 0.03, dmg: 10 }),
  H(1337, 'war', "The Hundred Years' War begins between England and France.", { end: 1453, n: "Hundred Years' War", draft: 0.015, mort: 0.04 }),
  H(1347, 'plague', 'The Black Death reaches your town.', { end: 1351, n: 'Black Death', dn: 'Black Death', inf: 0.2, let: 0.45, dmg: 35 }),
  H(1381, 'politics', "The Peasants' Revolt: rebels march on London demanding freedom."),
  H(1440, 'tech', 'A goldsmith in Mainz builds a printing press with movable type.'),
  // Renaissance
  H(1453, 'politics', 'Constantinople falls to the Ottomans after a long siege.'),
  H(1455, 'war', 'The Wars of the Roses tear England apart.', { end: 1487, n: 'Wars of the Roses', draft: 0.02, mort: 0.05 }),
  H(1485, 'culture', 'A new terror, the sweating sickness, appears. Merry at dinner, dead by supper, they say.'),
  H(1492, 'culture', 'Columbus reaches the Americas. The map of the world is torn open.'),
  H(1517, 'culture', 'Martin Luther posts his theses in Wittenberg. Christendom splits.'),
  H(1543, 'medicine', 'Vesalius publishes an anatomy drawn from real dissection.', { med: 0.02 }),
  H(1564, 'culture', "A glover's son named William Shakespeare is born in Stratford."),
  H(1588, 'war', 'The Spanish Armada sails against England.', { n: 'Armada', draft: 0.05, mort: 0.05 }),
  H(1609, 'tech', 'Galileo turns a telescope to the heavens and finds moons around Jupiter.'),
  H(1618, 'war', "The Thirty Years' War engulfs Central Europe.", { end: 1648, n: "Thirty Years' War", draft: 0.03, mort: 0.05, civ: 0.004 }),
  H(1630, 'plague', 'Plague returns to northern Italy.', { end: 1631, n: 'Italian Plague', dn: 'Plague', inf: 0.06, let: 0.4, dmg: 30 }),
  H(1637, 'crash', 'Tulip mania collapses. Fortunes in bulbs turn to dirt.', { loss: 0.15 }),
  // Colonial & Enlightenment
  H(1665, 'plague', 'The Great Plague strikes London.', { end: 1666, n: 'Great Plague', dn: 'Great Plague', inf: 0.08, let: 0.4, dmg: 30 }),
  H(1666, 'disaster', 'The Great Fire of London burns for four days.', { p: 0.08, fx: { hp: -10 }, loss: 0.3 }),
  H(1687, 'tech', 'Newton publishes the Principia. The universe runs on laws.'),
  H(1720, 'crash', 'The South Sea Bubble bursts. Speculators are ruined.', { loss: 0.25 }),
  H(1756, 'war', "The Seven Years' War spans the globe.", { end: 1763, n: "Seven Years' War", draft: 0.04, mort: 0.05 }),
  H(1769, 'tech', 'James Watt patents an improved steam engine.'),
  H(1775, 'war', 'Shots at Lexington: the American Revolutionary War begins.', { end: 1783, n: 'Revolutionary War', draft: 0.05, mort: 0.04 }),
  H(1776, 'politics', 'The Declaration of Independence is signed in Philadelphia.'),
  H(1789, 'revolution', 'Revolution erupts in France. The Bastille falls.', { strip: 0.3 }),
  H(1796, 'medicine', 'Edward Jenner tests the first smallpox vaccine.', { med: 0.05 }),
  // Industrial
  H(1803, 'war', 'The Napoleonic Wars engulf Europe.', { end: 1815, n: 'Napoleonic Wars', draft: 0.06, mort: 0.06 }),
  H(1816, 'famine', 'The Year Without a Summer: snow in June, and the crops fail.', { n: 'Year Without a Summer', mort: 0.015, dmg: 8 }),
  H(1825, 'tech', 'The first public steam railway opens.'),
  H(1832, 'plague', 'Cholera sweeps through the crowded cities.', { end: 1833, n: 'Cholera pandemic', dn: 'Cholera', inf: 0.05, let: 0.3, dmg: 25 }),
  H(1845, 'famine', 'Potato blight brings famine to Ireland and hunger across Europe.', { end: 1849, n: 'Great Hunger', mort: 0.01, dmg: 6 }),
  H(1848, 'revolution', 'Revolutions sweep across Europe.', { strip: 0.05 }),
  H(1859, 'culture', 'Darwin publishes On the Origin of Species.'),
  H(1861, 'war', 'Civil war breaks out in America.', { end: 1865, n: 'American Civil War', draft: 0.1, mort: 0.06 }),
  H(1865, 'law', 'Slavery is abolished in the United States.'),
  H(1867, 'medicine', 'Joseph Lister introduces antiseptic surgery.', { med: 0.05 }),
  H(1873, 'crash', 'The Panic of 1873 sets off a long depression.', { end: 1875, loss: 0.15, lay: 0.1 }),
  H(1876, 'tech', 'Alexander Graham Bell makes the first telephone call.'),
  H(1879, 'tech', 'An electric light bulb glows for hours on end.'),
  H(1886, 'tech', 'The first petrol-powered motor car rattles down a road.'),
  H(1895, 'medicine', 'X-rays are discovered: doctors can see inside the body.', { med: 0.03 }),
  H(1903, 'tech', 'The Wright brothers fly at Kitty Hawk.'),
  H(1912, 'culture', 'The Titanic sinks on her maiden voyage.'),
  // World Wars
  H(1914, 'war', 'The Great War begins. Recruiting posters appear on every wall.', { end: 1918, n: 'Great War', draft: 0.25, mort: 0.12, civ: 0.003 }),
  H(1917, 'revolution', 'Revolution in Russia topples the Tsar.', { strip: 0.1 }),
  H(1918, 'plague', 'The Spanish flu spreads around the world.', { end: 1920, n: 'Spanish flu', dn: 'Spanish flu', inf: 0.15, let: 0.12, dmg: 25 }),
  H(1920, 'law', 'Women win the right to vote in the United States.'),
  H(1928, 'medicine', 'Alexander Fleming discovers penicillin.', { med: 0.1 }),
  H(1929, 'crash', 'The stock market crashes. The Great Depression begins.', { end: 1933, loss: 0.4, lay: 0.15 }),
  H(1939, 'war', 'World War II begins.', { end: 1945, n: 'Second World War', draft: 0.3, mort: 0.1, civ: 0.006 }),
  H(1945, 'politics', 'Atomic bombs fall on Hiroshima and Nagasaki. The war ends.'),
  // Modern
  H(1947, 'tech', 'The transistor is invented.'),
  H(1950, 'war', 'War breaks out in Korea.', { end: 1953, n: 'Korean War', draft: 0.06, mort: 0.04 }),
  H(1953, 'medicine', 'The double-helix structure of DNA is revealed.', { med: 0.02 }),
  H(1955, 'medicine', 'The polio vaccine is declared safe and effective.', { med: 0.05 }),
  H(1957, 'tech', 'Sputnik beeps overhead. The space race is on.'),
  H(1962, 'politics', 'The Cuban Missile Crisis brings the world to the brink.', { fx: { hp: -5 } }),
  H(1965, 'war', 'Draft notices go out for the war in Vietnam.', { end: 1973, n: 'Vietnam War', draft: 0.05, mort: 0.03 }),
  H(1969, 'tech', 'Humans walk on the Moon.', { fx: { hp: 5 } }),
  H(1973, 'crash', 'The oil crisis: long queues at the petrol pumps.', { loss: 0.1, lay: 0.05 }),
  H(1981, 'culture', 'A new illness, later called AIDS, is identified.'),
  H(1986, 'disaster', 'The Chernobyl reactor explodes.', { p: 0.005, fx: { h: -15 } }),
  H(1987, 'crash', 'Black Monday: stock markets plunge in a single day.', { loss: 0.15 }),
  H(1989, 'politics', 'The Berlin Wall falls.', { fx: { hp: 3 } }),
  H(1991, 'tech', 'The World Wide Web opens to the public.'),
  // Digital
  H(2001, 'politics', 'Terror attacks on September 11 shock the world.', { fx: { hp: -5 } }),
  H(2007, 'tech', 'The first modern touchscreen smartphone goes on sale.'),
  H(2008, 'crash', 'The global financial crisis hits. Banks fail.', { end: 2009, loss: 0.25, lay: 0.1 }),
  H(2012, 'medicine', 'CRISPR gene editing is demonstrated.', { med: 0.03 }),
  H(2020, 'plague', 'COVID-19 becomes a global pandemic. Lockdowns begin.', { end: 2022, n: 'COVID-19 pandemic', dn: 'COVID-19', inf: 0.15, let: 0.012, dmg: 12, fx: { hp: -6 } }),
  H(2022, 'tech', 'Generative AI chatbots go mainstream.'),
  // Near Future (projected)
  H(2035, 'tech', 'The first commercial fusion plant comes online.'),
  H(2038, 'plague', 'A novel virus spreads from thawing permafrost.', { end: 2039, n: 'Permafrost fever', dn: 'Permafrost fever', inf: 0.08, let: 0.05, dmg: 15 }),
  H(2041, 'tech', 'The first permanent colony is founded on Mars.'),
  H(2047, 'disaster', 'Mega-storms flood coastal cities around the world.', { p: 0.1, fx: { h: -10, hp: -6 }, loss: 0.15 }),
  H(2052, 'medicine', 'Gene therapy cures most inherited diseases.', { med: 0.05 }),
  H(2060, 'medicine', 'Rejuvenation therapies reach ordinary clinics.', { med: 0.04 }),
  H(2071, 'crash', 'Automation shock: millions of jobs vanish in a single year.', { loss: 0.1, lay: 0.3 }),
  H(2089, 'war', 'The Water Wars flare along drying rivers.', { end: 2094, n: 'Water Wars', draft: 0.05, mort: 0.04 }),
  H(2110, 'tech', 'The lunar cities pass one million residents.'),
  H(2140, 'tech', 'The first crewed ship departs for Alpha Centauri.'),
  // Far Future
  H(2150, 'tech', 'Mind backup becomes routine for anyone who can afford it.'),
  H(2188, 'plague', 'Xeno-spores from a returned probe escape containment.', { end: 2190, n: 'Spore Plague', dn: 'Spore plague', inf: 0.06, let: 0.08, dmg: 18 }),
  H(2210, 'war', 'The Belt Secession War: the asteroid miners fight for independence.', { end: 2216, n: 'Belt Secession War', draft: 0.05, mort: 0.05 }),
  H(2250, 'tech', 'A signal from Tau Ceti is confirmed as artificial.', { fx: { hp: 5, sm: 2 } }),
  H(2301, 'medicine', 'Senescence is declared a curable condition.', { med: 0.03 }),
  H(2400, 'politics', 'The Solar Commonwealth is proclaimed across forty worlds.'),
];

/* ---------- universal life events (any era) ----------
   $c: money as a share of the era's yearly cost of living, so the same
   event feels the same in 1300 and 2300. */
DATA.events = [
  // childhood
  { id: 'firstword', p: 0.9, min: 1, max: 2, once: true, t: ['You said your first word: "No."', 'You said your first word: "More!"', 'Your first word was the name of the family animal.', 'You said your first word. Everyone argued about what it was.'], fx: { hp: 3 } },
  { id: 'treasure', p: 0.08, min: 2, max: 7, t: 'You found a shiny pebble and declared it your greatest treasure.', fx: { hp: 3 } },
  { id: 'kidfever', p: 0.06, min: 0, max: 12, t: 'You caught a nasty fever and spent a week in bed.', fx: { h: [-10, -3] } },
  { id: 'bully', p: 0.07, min: 6, max: 14, t: 'An older child has been bullying you.', ch: [{ l: 'Fight back', odds: 0.5, win: { fx: { rep: 3, hp: 5 }, t: 'You bloodied their nose. They leave you alone now.' }, alt: { fx: { h: -8, hp: -5 }, t: 'You lost the fight, badly.' } }, { l: 'Tell a grown-up', fx: { hp: 2 }, t: 'The grown-ups sorted it out. Sort of.' }, { l: 'Ignore them', fx: { hp: -4 }, t: 'It went on for months.' }] },
  { id: 'drawing', p: 0.06, min: 4, max: 12, t: 'You drew a picture that amazed the adults.', fx: { sm: 2, hp: 4 } },
  { id: 'lost', p: 0.04, min: 3, max: 9, t: 'You got lost in a crowd and cried until your family found you.', fx: { hp: -3 } },
  { id: 'sibfight', p: 0.08, min: 4, max: 15, c: (p, S) => S.siblings(p).some(S.alive), t: 'You fought with your sibling over absolutely nothing.', fx: { hp: -2 } },
  { id: 'stray', p: 0.05, min: 5, max: 14, t: 'A stray animal followed you home.', ch: [{ l: 'Keep it', fx: { hp: 8 }, t: 'You named it after a hero. It sleeps on your feet.' }, { l: 'Shoo it away', fx: { hp: -2 }, t: 'It looked back at you, once.' }] },
  // teens
  { id: 'crush', p: 0.15, min: 13, max: 17, t: 'You have a huge crush on someone.', ch: [{ l: 'Confess', odds: 0.5, win: { fx: { hp: 10, lover: 1 }, t: 'They like you back!' }, alt: { fx: { hp: -8 }, t: 'They laughed. You want to disappear.' } }, { l: 'Keep it secret', fx: { hp: -1 }, t: 'You sigh a lot these days.' }] },
  { id: 'dare', p: 0.08, min: 12, max: 17, t: 'A friend dares you to steal something from a market stall.', ch: [{ l: 'Do it', odds: 0.7, win: { fx: { hp: 4, rep: -1 }, t: 'You got away with it. Your heart is pounding.' }, alt: { fx: { rep: -6, hp: -6 }, t: 'You were caught and dragged home by the ear.' } }, { l: 'Refuse', fx: { rep: 1, hp: -1 }, t: "Your friend called you a coward. You don't care." }] },
  { id: 'growth', p: 0.15, min: 12, max: 16, t: "You shot up a hand's width this year.", fx: { lk: 3 } },
  { id: 'spots', p: 0.1, min: 12, max: 18, t: 'Your face broke out in spots.', fx: { lk: -3, hp: -3 } },
  // adults
  { id: 'purse', p: 0.04, min: 16, t: 'You found a purse full of money lying in the road.', ch: [{ l: 'Keep it', fx: { $c: 0.1, rep: -1 }, t: 'Finders keepers.' }, { l: 'Return it', fx: { rep: 5, hp: 3 }, t: 'The grateful owner told everyone about your honesty.' }] },
  { id: 'stranger', p: 0.05, min: 16, t: 'A stranger in need asks you for help.', ch: [{ l: 'Give generously', fx: { $c: -0.02, rep: 2, hp: 3 }, t: 'They blessed you and your family.' }, { l: 'Walk on', fx: { hp: -1 }, t: 'You felt their eyes on your back.' }] },
  { id: 'back', p: 0.05, min: 30, t: 'You threw your back out lifting something heavy.', fx: { h: [-8, -3] } },
  { id: 'oldfriend', p: 0.05, min: 25, t: 'An old friend turned up out of the blue. You talked all night.', fx: { hp: 6 } },
  { id: 'scheme', p: 0.04, min: 20, c: (p, S) => S.cash(p) > S.era().cost * 0.3, t: 'A smooth-talking acquaintance offers you a "can\'t-lose" investment.', ch: [{ l: 'Invest', fx: { $c: -0.3 }, odds: 0.35, win: { fx: { $c: 0.9 }, t: 'Against all odds, it paid off handsomely.' }, alt: { t: 'He vanished with your money.' } }, { l: 'Decline', t: 'You smelled a rat.' }] },
  { id: 'windfall', p: 0.02, min: 18, t: 'A distant relative you never met left you a small inheritance.', fx: { $c: [0.2, 0.8], hp: 4 } },
  { id: 'midlife', p: 0.08, min: 40, max: 50, once: true, t: 'You woke up one morning and wondered what it all means.', ch: [{ l: 'Buy something extravagant', fx: { $c: -0.2, hp: 8 }, t: 'It helped. For a while.' }, { l: 'Take up a new craft', fx: { hp: 4, sm: 2 }, t: 'You found something new to be bad at, and loved it.' }] },
  // elders
  { id: 'joints', p: 0.15, min: 60, t: 'Your joints ache whenever the weather turns.', fx: { h: [-5, -1] } },
  { id: 'grandkids', p: 0.12, min: 45, c: (p, S) => S.grandkids(p).some(S.alive), t: 'Your grandchildren visited and wore you out completely.', fx: { hp: 8 } },
  { id: 'memoir', p: 0.04, min: 60, t: 'You began writing down your memories for the family.', fx: { sm: 2, rep: 2, hp: 3 } },
  { id: 'spectacles', p: 0.06, min: 70, t: 'You hunted for your spectacles for an hour. They were on your head.', fx: { hp: -1 } },
];

/* ---------- universal activities (labels come from era.L) ----------
   kind: fx (plain effects) or a special handler in the engine.
   cost is a share of the era's yearly cost of living. */
DATA.activities = [
  { id: 'gym', lab: 'gym', d: 'Build strength and stamina.', min: 8, cost: 0, kind: 'fx', fx: { h: [2, 5], lk: [0, 2], hp: 2 }, t: 'You worked up a good sweat.', risk: { p: 0.03, fx: { h: -8 }, t: 'You pulled a muscle and limped for a week.' } },
  { id: 'study', lab: 'study', d: 'Sharpen your mind.', min: 6, cost: 0, kind: 'fx', fx: { sm: [2, 5], hp: -1 }, t: 'You studied until your eyes ached.' },
  { id: 'faith', lab: 'faith', d: 'Find some peace.', min: 4, cost: 0, kind: 'fx', fx: { hp: [3, 6] }, t: 'You left feeling calmer.' },
  { id: 'healer', lab: 'healer', d: 'Treat illness or get a check-up.', min: 0, cost: 0.04, kind: 'healer' },
  { id: 'love', lab: 'love', d: 'Look for a partner.', min: 16, cost: 0.01, kind: 'love' },
  { id: 'friend', lab: 'friend', d: 'Meet someone new.', min: 5, cost: 0, kind: 'friend' },
  { id: 'party', lab: 'party', d: 'Let loose.', min: 16, cost: 0.02, kind: 'fx', fx: { hp: [5, 10], h: [-3, 0] }, t: 'What a night. Your head is pounding.' },
  { id: 'gamble', lab: 'gamble', d: 'Stake a tenth of a year’s living.', min: 18, cost: 0.1, kind: 'gamble' },
  { id: 'crime', lab: 'crime', d: 'Risky money. Prison if caught.', min: 12, cost: 0, kind: 'crime' },
];

/* ---------- achievements ---------- */
DATA.achievements = [
  { id: 'elder', n: 'Ripe Old Age', d: 'Live to 80.', test: (p, S) => S.age(p) >= 80 },
  { id: 'century', n: 'Centenarian', d: 'Live to 100.', test: (p, S) => S.age(p) >= 100 },
  { id: 'fortune', n: 'Fortune', d: 'Reach a net worth of 1M value.', test: (p, S) => S.netWorth(p) >= 1e6 },
  { id: 'magnate', n: 'Magnate', d: 'Reach a net worth of 50M value.', test: (p, S) => S.netWorth(p) >= 5e7 },
  { id: 'scholar', n: 'Scholar', d: 'Complete the highest education of your era.', test: p => p.edu >= 4 },
  { id: 'polymath', n: 'Polymath', d: 'Reach 95 smarts.', test: p => p.sm >= 95 },
  { id: 'striking', n: 'Striking', d: 'Reach 95 looks.', test: p => p.lk >= 95 },
  { id: 'famous', n: 'Household Name', d: 'Reach 90 reputation.', test: p => p.rep >= 90 },
  { id: 'titled', n: 'Titled', d: 'Hold a title.', test: p => !!p.title },
  { id: 'wed', n: 'Wedded', d: 'Get married.', test: p => !!p.sp || p.exes.length > 0 },
  { id: 'fullhouse', n: 'Full House', d: 'Have six or more children.', test: p => p.kids.length >= 6 },
  { id: 'elderhouse', n: 'Elder of the House', d: 'Live to see a grandchild.', test: (p, S) => S.grandkids(p).length > 0 },
  { id: 'veteran', n: 'Veteran', d: 'Serve in a war and come home.', test: p => !!p.flags.vet },
  { id: 'survivor', n: 'Survivor', d: 'Recover from a pandemic infection.', test: p => !!p.flags.plague },
  { id: 'crosser', n: 'Age Crosser', d: 'Live through the turn of an era.', test: p => !!p.flags.era },
  { id: 'jailbird', n: 'Jailbird', d: 'Serve time in prison.', test: p => !!p.flags.jailed },
  { id: 'jackpot', n: 'Jackpot', d: 'Win big at games of chance.', test: p => !!p.flags.jackpot },
  { id: 'starfarer', n: 'Starfarer', d: 'Work beyond Earth.', test: p => !!p.flags.space },
  { id: 'secondlife', n: 'Second Life', d: 'Be restored from a mind backup.', test: p => !!p.flags.revived },
];
