/* =====================================================================
   STATS — metadata and tiered, first-person descriptions.
   Tier thresholds: 0, 10, 25, 40, 55, 70, 85, 100.
   ===================================================================== */

DATA.tiers = [0, 10, 25, 40, 55, 70, 85, 100];
DATA.stats = [
  { k: 'h', n: 'Health', col: '#E0564F', main: true, d: [
    ["At Death's Door", 'Every breath is a negotiation. My body is shutting down.'],
    ['Gravely Ill', 'I can barely get out of bed. Something is badly wrong with me.'],
    ['Frail', 'I tire quickly, and every cold lays me low for weeks.'],
    ['Run Down', 'I get by, but aches and sniffles follow me around.'],
    ['Fair', 'I am healthy enough for daily life, if nothing special.'],
    ['Hale', 'I sleep well, eat well and rarely fall ill.'],
    ['Robust', 'I have energy to spare and bounce back from anything.'],
    ['Peak Condition', 'My body is at the kind of health most people dream about.']] },
  { k: 'hp', n: 'Happiness', col: '#E3A33B', main: true, d: [
    ['Despairing', 'I cannot remember the last time anything felt good.'],
    ['Miserable', 'Every day feels heavy, and I dread waking up.'],
    ['Unhappy', 'Life disappoints me more often than it delights me.'],
    ['Getting By', 'Some good days, some bad; mostly just days.'],
    ['Content', 'I am mostly at peace with how things are going.'],
    ['Cheerful', 'I find something to smile about most days.'],
    ['Joyful', 'Life feels full, and I am grateful for it.'],
    ['Radiant', 'I am so happy it spills over onto everyone around me.']] },
  { k: 'sm', n: 'Smarts', col: '#3B82F6', main: true, d: [
    ['Vacant', 'Thoughts slip away before I can hold on to them.'],
    ['Slow', 'Letters, numbers and plans all tangle in my head.'],
    ['Simple', 'I get by on common sense rather than book learning.'],
    ['Average', 'I hold my own in a conversation and learn what I need to.'],
    ['Bright', 'I pick things up quickly and enjoy a good puzzle.'],
    ['Clever', 'People come to me when something needs figuring out.'],
    ['Brilliant', 'I see connections others miss, and I rarely forget a thing.'],
    ['Genius', 'My mind works on a level that would make scholars weep.']] },
  { k: 'lk', n: 'Looks', col: '#D14FB2', main: true, d: [
    ['Frightful', 'Children hide when I walk by. Mirrors are not my friends.'],
    ['Homely', 'Nobody has ever called me handsome, and nobody will.'],
    ['Plain', 'I blend into any crowd without a second glance.'],
    ['Ordinary', 'I am neither a head-turner nor someone people avoid.'],
    ['Pleasant', 'I have a kind face and a good smile.'],
    ['Attractive', 'People notice when I walk into a room.'],
    ['Stunning', 'Strangers stare, and admirers are never in short supply.'],
    ['Legendary Beauty', 'Poets would write about my face, if they could find the words.']] },
  { k: 'rep', n: 'Reputation', col: '#1C9C8C', main: true, d: [
    ['Pariah', 'My name is spat out like a curse. Doors close before I knock.'],
    ['Disgraced', 'People whisper about my past whenever I pass.'],
    ['Doubted', 'Folk keep a hand on their purse when I am around.'],
    ['Unremarkable', 'Most people have no strong opinion of me either way.'],
    ['Respectable', 'I am known as someone who keeps their word.'],
    ['Well Regarded', 'People seek my advice and trust my judgement.'],
    ['Esteemed', 'My name opens doors and settles arguments.'],
    ['Paragon', 'My character is held up as an example to children.']] },
  { k: 'mh', n: 'Mental health', col: '#8B6CF0', d: [
    ['Shattered', 'My mind is a storm I cannot find my way out of.'],
    ['Struggling', 'Dark thoughts crowd in, and I am barely holding on.'],
    ['Fragile', 'Small setbacks knock me flat, and worry follows me everywhere.'],
    ['Strained', 'I cope, but stress is never far behind me.'],
    ['Steady', "I handle life's bumps without losing my footing."],
    ['Resilient', 'Hard times bend me, but they do not break me.'],
    ['Serene', 'I have a calm centre that the world rarely disturbs.'],
    ['Unshakeable', 'My mind is clear, balanced and at peace with itself.']] },
  { k: 'fe', n: 'Fertility', col: '#E0679A', d: [
    ['Infertile', 'Children will not come to me the natural way.'],
    ['Very Low', 'It would take something close to a miracle to conceive.'],
    ['Low', 'Starting a family would take patience and luck.'],
    ['Below Average', 'It may take a while, but it is possible.'],
    ['Average', 'Nothing stands in the way of a family if I want one.'],
    ['Fertile', 'Starting a family should come easily.'],
    ['Very Fertile', 'I only need to think about children to have them.'],
    ['Bountiful', 'My line could fill a village in a single generation.']] },
  { k: 'im', n: 'Imagination', col: '#E88A2E', d: [
    ['Literal', 'I see only what is in front of me. Stories bore me.'],
    ['Dull', 'Daydreams never visit me, and I prefer it that way.'],
    ['Practical', 'I like things that work more than things that could be.'],
    ['Curious', 'Every now and then an idea catches me by surprise.'],
    ['Creative', 'I often find a new way of looking at an old problem.'],
    ['Inventive', 'My head is full of stories, pictures and schemes.'],
    ['Visionary', 'I dream up things that do not exist yet, and then make them.'],
    ['Boundless', 'My imagination is a whole world, and I live in it gladly.']] },
  { k: 'wp', n: 'Willpower', col: '#2E9E6B', d: [
    ['Spineless', 'I give in to every temptation, every time.'],
    ['Weak-Willed', 'I start a hundred things and finish none of them.'],
    ['Wavering', 'My resolutions rarely survive the week.'],
    ['Ordinary', 'I can push through when I really have to.'],
    ['Determined', 'Once I set my mind to something, I usually see it through.'],
    ['Disciplined', 'I keep my habits, my promises and my temper.'],
    ['Iron-Willed', 'Pain, doubt and temptation all bow to my resolve.'],
    ['Indomitable', 'Nothing on earth can make me quit.']] },
  { k: 'fm', n: 'Fame', col: '#DB6A2C', d: [
    ['Unknown', 'Outside my own family, nobody knows my name.'],
    ['Local Face', 'The neighbours recognise me, and that is about it.'],
    ['Talked About', 'People around town know who I am.'],
    ['Notable', 'My name comes up in conversations I am not part of.'],
    ['Well Known', 'Strangers recognise me across the region.'],
    ['Famous', 'My name travels further than I ever will.'],
    ['Celebrated', 'Crowds gather where I go, and my words are repeated.'],
    ['Immortal Legend', 'History will remember me long after this age has passed.']] },
];
DATA.statTier = (k, v) => {
  const s = DATA.stats.find(x => x.k === k);
  let i = 0;
  for (let t = 0; t < DATA.tiers.length; t++) if (v >= DATA.tiers[t]) i = t;
  return { name: s.d[i][0], text: s.d[i][1], stat: s };
};

/* ---------- life ambitions, chosen at 16 ---------- */
DATA.ambitions = [
  { id: 'wealth', n: 'Make a fortune', d: 'Reach a net worth of a hundred years of living costs.', test: (p, S) => S.netWorth(p) >= S.toVal(S.era().cost * 100) },
  { id: 'fame', n: 'Become famous', d: 'Reach 80 fame.', test: p => (p.fm || 0) >= 80 },
  { id: 'family', n: 'Raise a big family', d: 'Have four or more children.', test: p => p.kids.length >= 4 },
  { id: 'knowledge', n: 'Master learning', d: 'Finish the highest schooling of your age, or reach 90 smarts.', test: p => p.edu >= 4 || p.sm >= 90 },
  { id: 'power', n: 'Rise to the top', d: 'Reach one of the two highest social classes.', test: p => (p.cls ?? 0) >= 5 },
  { id: 'adventure', n: 'See the world', d: 'Travel to five foreign lands.', test: p => (p.travels || []).length >= 5 },
  { id: 'love', n: 'Find true love', d: 'Be married with a closeness of 90 or more.', test: (p, S) => !!S.spouse(p) && (p.rels[p.sp]?.c || 0) >= 90 },
  { id: 'legacy', n: 'Leave a legacy', d: 'Live to see three grandchildren.', test: (p, S) => S.grandkids(p).length >= 3 },
];

/* ---------- era labels for the new everyday activities ---------- */
DATA.labels = {
  mind: { ancient: 'Consult a philosopher about your troubles', medieval: 'Confess your troubles to a priest', renaissance: 'Take a restful cure', colonial: 'Take the waters at a spa town', industrial: 'See an alienist', wars: 'See a psychoanalyst', modern: 'See a therapist', digital: 'Book a therapy session', near: 'Try neural mood therapy', far: 'Rest in a mind-garden' },
  create: { ancient: 'Compose verses', medieval: 'Illuminate a manuscript', renaissance: 'Paint a canvas', colonial: 'Write a pamphlet', industrial: 'Write a novel', wars: 'Write a screenplay', modern: 'Start a band', digital: 'Make a short film', near: 'Design a VR world', far: 'Sculpt a holo-symphony' },
  discipline: { ancient: 'Practise Stoic discipline', medieval: 'Keep a fast', renaissance: 'Keep a strict daily rule', colonial: 'Follow a regimen of self-improvement', industrial: 'Take a cold bath every morning', wars: 'Join a calisthenics club', modern: 'Train for a marathon', digital: 'Do a 75-day challenge', near: 'Work with a habit-coach AI', far: 'Undergo will-tuning' },
  daydream: { ancient: 'Watch the stars and wonder', medieval: 'Listen to a minstrel’s tales', renaissance: 'Sketch your wildest ideas', colonial: 'Read a novel by candlelight', industrial: 'Read a penny dreadful', wars: 'Listen to a radio drama', modern: 'Read science fiction', digital: 'Binge a fantasy series', near: 'Explore a generated dreamworld', far: 'Drift through a memory sea' },
};
DATA.activities.push(
  { id: 'mind', lab: 'mind', d: 'Look after your mental health.', min: 8, cost: 0.03, kind: 'mind' },
  { id: 'create', lab: 'create', d: 'Make something. Imagination pays off.', min: 8, cost: 0.01, kind: 'create' },
  { id: 'discipline', lab: 'discipline', d: 'Build your willpower.', min: 10, cost: 0, kind: 'fx', fx: { wp: [2, 5], h: [0, 2], hp: -1 }, t: 'It was hard. That was the point.' },
  { id: 'daydream', lab: 'daydream', d: 'Feed your imagination.', min: 3, cost: 0, kind: 'fx', fx: { im: [2, 5], hp: [1, 3] }, t: 'Your mind wandered somewhere wonderful.' },
);
