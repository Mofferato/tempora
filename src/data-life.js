/* =====================================================================
   LIFE DATA — prehistoric clubs and societies, domestication dates,
   and the everyday events that happen to other people (NPC lives are
   written in the second person, so they read naturally if you become
   that person later).
   ===================================================================== */

DATA.clubs.prehistory = ['Tracking lessons', 'Fire-keeping', 'The song circle'];

// When animals were domesticated
(() => {
  const set = (id, o) => Object.assign(DATA.pets.find(x => x.id === id) || {}, o);
  set('dog', { from: -13000 }); set('cat', { from: -7500 }); set('goat', { from: -8500 }); set('horse', { from: -3500 });
  const temple = DATA.orgs.find(o => o.id === 'temple'); if (temple) temple.from = -3500;
})();

DATA.orgs.push(
  { id: 'lodge', n: 'the spirit lodge', k: 'Faith', from: -10000, to: -3001, req: {}, fee: 0, ranks: ['Initiate', 'Keeper of songs', 'Shaman'], perk: { mh: 2, im: 1 } },
  { id: 'hunters', n: "the hunters' fellowship", k: 'Society', from: -10000, to: -2000, req: { age: 14 }, fee: 0, ranks: ['Tracker', 'Spear-bearer', 'Master of the hunt'], perk: { h: 1, rep: 1 }, risk: 0.02 },
  { id: 'elders', n: 'the council of elders', k: 'Power', from: -10000, to: -2500, req: { age: 35, rep: 40 }, fee: 0, ranks: ['Listener', 'Elder', 'Eldest'], perk: { rep: 2, sm: 1 } },
  { id: 'sportsclub', n: 'a sports club', k: 'Sport', from: 1850, req: { age: 8 }, fee: 0.02, ranks: ['Member', 'Team captain', 'Club president'], perk: { h: 1, hp: 1 } },
);

/* ---------- what happens to other people ----------
   Picked for NPCs you are connected to. fx works like the player's. */
DATA.npcEvents = [
  { id: 'n_praise', p: 0.06, min: 18, max: 66, c: p => !!p.job, t: 'You were praised at work and given more responsibility.', fx: { rep: 2, hp: 3, perf: 8 } },
  { id: 'n_promo', p: 0.04, min: 22, max: 64, c: p => !!p.job && p.job.rank < 4, t: 'You were promoted.', fx: { hp: 6, promote: 1 } },
  { id: 'n_fired', p: 0.02, min: 18, max: 64, c: p => !!p.job, t: 'You lost your job.', fx: { hp: -8, fire: 1 } },
  { id: 'n_ill', p: 0.05, min: 1, t: 'You were laid low by a nasty illness for weeks.', fx: { h: [-12, -4] } },
  { id: 'n_hobby', p: 0.05, min: 10, t: ['You took up a new hobby and became slightly obsessed.', 'You started keeping bees. Mostly they keep you.', 'You learned to play an instrument, badly and happily.'], fx: { hp: 4, im: 2 } },
  { id: 'n_trip', p: 0.04, min: 16, t: 'You made a long journey to see distant relatives.', fx: { hp: 5, im: 2 } },
  { id: 'n_windfall', p: 0.02, min: 18, t: 'You came into an unexpected sum of money.', fx: { $c: [0.2, 0.6], hp: 5 } },
  { id: 'n_loss', p: 0.03, min: 18, t: 'You lost a good deal of money on a bad bet.', fx: { $c: [-0.4, -0.1], hp: -5 } },
  { id: 'n_feud', p: 0.03, min: 16, t: 'You fell out badly with a neighbour.', fx: { hp: -3, rep: -1 } },
  { id: 'n_kind', p: 0.03, min: 12, t: 'You helped a stranger in trouble and did not ask for thanks.', fx: { rep: 3, mh: 2 } },
  { id: 'n_accident', p: 0.02, min: 5, t: 'You had a bad fall and broke a bone.', fx: { h: [-15, -5] } },
  { id: 'n_contest', p: 0.02, min: 10, t: 'You won a local contest and your name was on everyone’s lips.', fx: { fm: 3, hp: 5 } },
  { id: 'n_robbed', p: 0.02, min: 16, t: 'You were robbed on the road.', fx: { $c: -0.1, mh: -3 } },
  { id: 'n_faith', p: 0.03, min: 14, t: 'You found new comfort in faith.', fx: { mh: 4 } },
  { id: 'n_study', p: 0.03, min: 14, max: 70, t: 'You threw yourself into learning something new.', fx: { sm: 3 } },
  { id: 'n_gloom', p: 0.03, min: 14, c: p => (p.mh ?? 60) < 45, t: 'A dark mood hung over you all winter.', fx: { mh: -4, hp: -3 } },
  { id: 'n_love', p: 0.03, min: 18, max: 60, c: p => p.sp != null, t: 'You fell in love with your spouse all over again.', fx: { hp: 6 } },
  { id: 'n_newhome', p: 0.02, min: 22, t: 'You moved into a better home.', fx: { hp: 5, $c: -0.2 } },
  { id: 'n_scandal', p: 0.01, min: 18, t: 'A scandal about you spread through the neighbourhood.', fx: { rep: -8, fm: 2, mh: -4 } },
  { id: 'n_hero', p: 0.005, min: 14, t: 'You pulled a child from a burning house. People called you a hero.', fx: { rep: 10, fm: 8, h: -4 } },
];
