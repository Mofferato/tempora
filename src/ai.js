/* =====================================================================
   AI — help, and a player that can play for you.
   Offline, always available:
   * advise(p): a ranked list of things worth doing now, each one tap.
   * autopilot(p, goal): plays a year toward a goal (wealth, family,
     fame, a long life, learning, power, balance, or "in character").
   * bestChoice(p, choices, goal): weighs each option's likely effects.
   With Claude (optional):
   * Ask an era-appropriate advisor anything about your life.
   * Talk freely with anyone you know, in character; the talk moves
     your closeness.
   * "Let Claude live this year": Claude picks this year's actions.
   * "Ask Claude" on any choice, and prose chapters for your story.
   Claude is reached through, in order: the hosted page's own access
   (claude.use("sample")), the Tempora server's /api/ai, or the player's
   own API key with the official Anthropic SDK loaded in the browser.
   ===================================================================== */

const AI = (() => {
  const S = Sim, yr = () => S.W.year;
  const GOALS = [['balanced', 'A good, balanced life'], ['wealth', 'Wealth'], ['family', 'A big, close family'], ['fame', 'Fame'], ['long', 'A long, healthy life'], ['scholar', 'Learning and wisdom'], ['power', 'Power and office'], ['character', 'Live in character (personality decides)']];
  const WEIGHTS = {
    balanced: { h: 1.2, hp: 1.2, sm: 0.6, lk: 0.4, rep: 0.8, mh: 1, im: 0.3, wp: 0.4, fm: 0.3, $: 0.8 },
    wealth: { h: 0.6, hp: 0.4, sm: 0.6, lk: 0.2, rep: 0.5, mh: 0.4, im: 0.1, wp: 0.3, fm: 0.2, $: 3 },
    family: { h: 0.8, hp: 1.2, sm: 0.3, lk: 0.6, rep: 0.6, mh: 0.9, im: 0.2, wp: 0.3, fm: 0.1, $: 0.5, love: 3 },
    fame: { h: 0.6, hp: 0.6, sm: 0.4, lk: 0.8, rep: 1.2, mh: 0.4, im: 0.6, wp: 0.3, fm: 3, $: 0.4 },
    long: { h: 3, hp: 0.8, sm: 0.2, lk: 0.1, rep: 0.2, mh: 1.5, im: 0.1, wp: 0.5, fm: 0, $: 0.4 },
    scholar: { h: 0.5, hp: 0.5, sm: 3, lk: 0.1, rep: 0.6, mh: 0.6, im: 1.2, wp: 0.8, fm: 0.3, $: 0.3 },
    power: { h: 0.6, hp: 0.4, sm: 0.8, lk: 0.5, rep: 2.5, mh: 0.4, im: 0.1, wp: 0.6, fm: 1.5, $: 1 },
    character: { h: 1, hp: 1, sm: 0.5, lk: 0.5, rep: 0.7, mh: 1, im: 0.5, wp: 0.5, fm: 0.5, $: 0.7 },
  };

  /* ---------- weighing choices ---------- */
  const mid = v => (Array.isArray(v) ? (v[0] + v[1]) / 2 : v || 0);
  function fxValue(p, fx, goal) {
    if (!fx) return 0;
    const w = WEIGHTS[goal] || WEIGHTS.balanced, e = S.era();
    let v = 0;
    for (const k of ['h', 'hp', 'sm', 'lk', 'rep', 'mh', 'im', 'wp', 'fm']) if (fx[k] != null) v += mid(fx[k]) * w[k] * (k === 'h' && p.h < 40 ? 2 : 1);
    const cash = (fx.$ != null ? S.toVal(mid(fx.$), e) : 0) + (fx.$c != null ? S.toVal(e.cost * mid(fx.$c), e) : 0);
    if (cash) v += (cash / Math.max(1, S.toVal(e.cost))) * 25 * w.$;
    if (fx.jail) v -= 40 * fx.jail;
    if (fx.fire) v -= 25;
    if (fx.job) v += 12;
    if (fx.lover) v += 8 * (w.love || 1);
    if (fx.royal) v += 60;
    return v;
  }
  function choiceValue(p, c, goal) {
    const s = c.src || c; if (!s) return 0;
    let v = fxValue(p, s.fx, goal);
    if (s.odds != null) { const o = U.clamp((typeof s.odds === 'function' ? s.odds(p) : s.odds) + S.hadd('odds', p, s), 0, 1); v += o * fxValue(p, s.win?.fx, goal) + (1 - o) * fxValue(p, s.alt?.fx, goal); }
    if (goal === 'character' && S.pers) v += S.pers.choiceScore(p, s.l || c.l || '') * 6;
    return v;
  }
  function bestChoice(p, choices, goal = 'balanced') {
    let best = choices[0], bv = -Infinity;
    for (const c of choices) { const v = choiceValue(p, c, goal) + Math.random() * 0.5; if (v > bv) { bv = v; best = c; } }
    return best;
  }

  /* ---------- the offline advisor ---------- */
  function advise(p) {
    const e = S.era(), a = S.age(p), out = [], add = (score, t, why, act, ds = {}) => out.push({ score, t, why, act, ds });
    if (!S.alive(p)) return out;
    const acts = S.activities(p), actOK = id => { const x = acts.find(y => y.id === id); return x && !x.young && !x.done && !x.broke && !x.jailed ? x : null; };
    if (p.sick.length && actOK('u:healer')) add(100, `${actOK('u:healer').n}`, `You are ill with ${p.sick.map(s => s.n.toLowerCase()).join(' and ')}. Untreated illness can kill.`, 'activity', { id: 'u:healer' });
    if (p.h < 40 && actOK('u:gym')) add(70, actOK('u:gym').n, 'Your health is poor. Exercise builds it back.', 'activity', { id: 'u:gym' });
    if ((p.mh ?? 60) < 35 && actOK('u:mind')) add(75, actOK('u:mind').n, 'Your mental health is fragile. Looking after it lowers your risk of dying young.', 'activity', { id: 'u:mind' });
    if (p.hp < 35 && actOK('u:party')) add(40, actOK('u:party').n, 'You are unhappy. Some fun might help.', 'activity', { id: 'u:party' });
    if (p.money < 0) add(80, p.job ? 'Work harder for a raise' : 'Find work', 'You are in debt, which hurts your health and happiness every year.', p.job ? 'workHard' : 'tab', p.job ? {} : { tab: 'job' });
    if (!p.job && !p.retired && a >= S.workAge(e) && !(p.school && p.school.lvl < 3) && !p.prison) {
      const L = S.jobListings(p).filter(x => !x.why.length).sort((x, y) => y.pay - x.pay)[0];
      if (L) add(65, `Apply to be a ${((p.sex === 'F' && L.j.tf) || L.j.t).toLowerCase()}`, `The best-paid work open to you: ${S.money(L.pay)} a year.`, 'apply', { id: L.j.id });
    }
    if (!p.school && a <= 30) { const o = S.eduOptions(p).find(x => !x.why.length); if (o) add(a < 18 ? 72 : 45, `Enrol in ${o.n.toLowerCase()}`, 'More schooling opens better jobs and raises your smarts.', 'enroll', { lvl: o.lvl }); }
    if (p.job) {
      if (!p.did.work) add(35, 'Work hard this year', `Performance ${Math.round(p.job.perf)}. High performers get promoted.`, 'workHard');
      if (p.job.perf >= 70 && p.job.rank < 4 && !p.did.promo) add(50, 'Ask for a promotion', 'Your performance is strong. Promotions raise your pay by a third.', 'promo');
    }
    const home = p.assets.some(x => x.kind === 'home');
    if (!home && a >= 20) { const h = S.market().filter(x => x.a.kind === 'home' && x.price <= p.money * 0.7).sort((x, y) => x.price - y.price)[0]; if (h) add(55, `Buy a ${h.a.t.toLowerCase()}`, 'Owning a home cuts your living costs by a quarter every year.', 'buy', { id: h.a.id }); }
    const lover = Object.entries(p.rels).find(([id, r]) => ['lover', 'fiance'].includes(r.k) && S.alive(S.P(+id)));
    if (p.sp == null && !lover && a >= 18 && a <= 45 && actOK('u:love')) add(30, actOK('u:love').n, 'Marriage lifts happiness for life, and brings children.', 'activity', { id: 'u:love' });
    if (lover) { const [id, r] = lover, o = S.P(+id); if (r.k === 'lover' && r.c >= 60) add(45, `Propose to ${o.first}`, `Closeness ${Math.round(r.c)}: a good chance they will say yes.`, 'interact', { id: String(o.id), a: 'propose' }); if (r.k === 'fiance') add(55, `Marry ${o.first}`, 'You are engaged. Seal it.', 'interact', { id: String(o.id), a: 'wed' }); }
    const sp = S.spouse(p);
    if (sp && S.alive(sp) && sp.sex !== p.sex && p.kids.length < 3 && a >= 20 && a <= 40 && !p.did[`r:${sp.id}:baby`]) add(35, 'Try for a baby', 'Children carry your dynasty on after you.', 'interact', { id: String(sp.id), a: 'baby' });
    const cold = S.known(p).filter(o => S.alive(o) && /Father|Mother|Husband|Wife|Son|Daughter|Brother|Sister/.test(S.relLabel(p, o)) && (p.rels[o.id]?.c ?? 50) < 35).sort((x, y) => (p.rels[x.id]?.c ?? 50) - (p.rels[y.id]?.c ?? 50))[0];
    if (cold) add(38, `Spend time with ${cold.first}`, `Your ${S.relLabel(p, cold).toLowerCase()} is drifting away (closeness ${Math.round(p.rels[cold.id]?.c ?? 0)}).`, 'interact', { id: String(cold.id), a: 'time' });
    if (typeof Phone !== 'undefined' && Phone.unread(p)) add(30, 'Answer your messages', `${Phone.unread(p)} unanswered. People notice silence.`, 'tab', { tab: 'phone' });
    if (a >= 50 && !p.will && p.kids.length && typeof Legacy !== 'undefined') add(40, 'Write a will', 'Without one, the law divides your estate, and unequal shares can split the family.', 'will');
    if (S.pol && a >= 21 && !p.office) { const why = S.pol.requirements(p, 1); if (!why.length && p.rep >= 40) add(25, `Seek office as ${S.pol.officeTitle(p.cc, 1, p.sex).toLowerCase()}`, 'Your reputation could carry you into public life.', 'polSeek', { l: '1' }); }
    if (p.sport && p.sport.lvl < 4 && p.sport.skill >= Sports.NEED[p.sport.lvl + 1]) add(45, `Try out as a ${Sports.LVL[p.sport.lvl + 1].toLowerCase()}`, 'Your skill is high enough for the next level.', 'sportTry');
    if (p.amb && !p.flags.ambDone) { const amb = DATA.ambitions.find(x => x.id === p.amb); if (amb) add(20, `Your ambition: ${amb.n.toLowerCase()}`, amb.d, 'none'); }
    if (e.laws.retire || a >= 60) { if (p.job && a >= (e.life.retire || 65)) add(30, 'Consider retiring', 'Your pension would keep coming, and rest is good for an old body.', 'none'); }
    return out.sort((x, y) => y.score - x.score).slice(0, 8);
  }
  // Carry out an advisor suggestion or an AI-chosen action
  function run(act, ds = {}) {
    const p = S.me();
    switch (act) {
      case 'apply': return S.apply(ds.id).t;
      case 'enroll': return S.doEnroll(+ds.lvl);
      case 'buy': return S.buy(ds.id);
      case 'polSeek': return S.pol.seek(+ds.l);
      case 'sportTry': return Sports.tryout();
      case 'sportTrain': return Sports.train();
      case 'sportCompete': return Sports.compete();
      case 'sportTake': return Sports.takeUp(ds.id);
      case 'post': return typeof Phone !== 'undefined' ? Phone.post(ds.k) : '';
      case 'none': case 'tab': case 'will': return '';
      default: return typeof Auto !== 'undefined' && Auto.replay[act] ? Auto.exec({ act, ds }) : '';
    }
  }

  /* ---------- autopilot: a year played toward a goal ---------- */
  function autopilot(p, goal) { S.asAuto(() => pilot(p, goal)); }
  function pilot(p, goal) {
    if (!S.alive(p) || S.W.dead || p.prison) return;
    const a = S.age(p), e = S.era(), act = id => { try { S.doActivity(id); } catch { /* not available */ } };
    const tryRun = (x, ds) => { try { return run(x, ds); } catch { return ''; } };
    if (p.sick.length) act('u:healer');
    if (goal === 'character' && p.pers) {
      const T = t => p.pers.tr.includes(t);
      if (T('gregarious')) { act('u:friend'); act('u:party'); }
      if (T('diligent') || T('ambitious')) { if (p.job) { S.workHard(); if (p.job.perf > 70) S.askPromotion(); } act('u:study'); }
      if (T('athletic')) { act('u:gym'); if (p.sport) { Sports.train(); Sports.compete(); } }
      if (T('creative')) { act('u:create'); act('u:daydream'); }
      if (T('pious')) act('u:faith');
      if (T('romantic') && p.sp == null) act('u:love');
      if (T('curious')) act('u:study');
      if (T('reckless')) act('u:gamble');
      if (T('kind') || T('loyal')) S.known(p).filter(o => S.alive(o) && p.rels[o.id]?.k === 'fam').slice(0, 3).forEach(o => S.interact(o.id, 'time'));
      if (!p.job && a >= S.workAge(e)) { const L = S.jobListings(p).filter(x => !x.why.length).sort((x, y) => (S.pers.jobFit(p, y.j) - S.pers.jobFit(p, x.j)))[0]; if (L) S.apply(L.j.id); }
      return;
    }
    // shared basics
    if (p.h < 45) act('u:gym');
    if ((p.mh ?? 60) < 40) act('u:mind');
    if (!p.job && !p.retired && a >= S.workAge(e) && !(p.school && p.school.lvl < 3)) { const L = S.jobListings(p).filter(x => !x.why.length).sort((x, y) => y.pay - x.pay); for (const x of L.slice(0, 3)) if (S.apply(x.j.id).ok) break; }
    if (!p.school && a <= (goal === 'scholar' ? 40 : 25)) { const o = S.eduOptions(p).find(x => !x.why.length); if (o) S.doEnroll(o.lvl); }
    const lover = Object.entries(p.rels).find(([id, r]) => ['lover', 'fiance'].includes(r.k) && S.alive(S.P(+id)));
    const family = () => {
      if (p.sp == null && !lover && a >= 16 && a <= 50) act('u:love');
      if (lover) { const [id, r] = lover; S.interact(+id, r.k === 'fiance' ? 'wed' : r.c >= 55 ? 'propose' : 'time'); }
      const sp = S.spouse(p); if (sp && S.alive(sp)) { S.interact(sp.id, 'time'); if (sp.sex !== p.sex && a <= 42 && p.kids.length < 8) S.interact(sp.id, 'baby'); }
      S.known(p).filter(o => S.alive(o) && p.rels[o.id]?.k === 'fam').sort((x, y) => (p.rels[x.id]?.c ?? 50) - (p.rels[y.id]?.c ?? 50)).slice(0, 4).forEach(o => S.interact(o.id, 'time'));
    };
    const work = () => { if (p.job) { S.workHard(); if (p.job.perf >= 65) S.askPromotion(); } };
    const home = () => { if (!p.assets.some(x => x.kind === 'home') && a >= 20) { const h = S.market().filter(x => x.a.kind === 'home' && x.price <= p.money * 0.6).sort((x, y) => x.price - y.price)[0]; if (h) S.buy(h.a.id); } };
    switch (goal) {
      case 'wealth': work(); home(); if (p.money > S.toVal(e.cost * 12)) { const m = S.market().filter(x => x.a.inc > 0 && x.price < p.money * 0.4).sort((x, y) => y.a.inc - x.a.inc)[0]; if (m) S.buy(m.a.id); } act('u:study'); if (p.sp == null && a >= 22 && a <= 35) act('u:love'); break;
      case 'family': family(); work(); home(); if (typeof House !== 'undefined') House.houseAct(p, 'dinner'); break;
      case 'fame':
        work(); act('u:create');
        if (!p.sport && a >= 6 && a <= 25) { const s = Sports.avail(p)[0]; if (s) Sports.takeUp(s.id); }
        if (p.sport) { Sports.train(); if (!p.sport.inj) Sports.compete(); Sports.tryout(); }
        if (typeof Phone !== 'undefined' && Phone.device().social && a >= 13) { const st = Phone.ph(p); if (!st.handle) { st.handle = (p.first + p.last).replace(/[^A-Za-z0-9]/g, '').toLowerCase(); st.followers = 10; } Phone.post('selfie'); Phone.post('meme'); }
        if (S.pol && a >= 21) S.pol.seek(Math.min(5, (p.office?.lvl || 0) + 1));
        break;
      case 'long': act('u:gym'); act('u:mind'); act('u:discipline'); if (p.job?.risk >= 0.04) { const L = S.jobListings(p).filter(x => !x.why.length && !(x.j.risk >= 0.03)).sort((x, y) => y.pay - x.pay)[0]; if (L) S.apply(L.j.id); } work(); family(); break;
      case 'scholar': act('u:study'); act('u:daydream'); act('u:create'); work(); { const org = S.orgsAvail(p).find(o => o.k === 'Learning' && !S.orgWhy(p, o).length && !(p.orgs || []).some(m => m.id === o.id)); if (org) S.orgAct(org.id, 'join'); } for (const m of p.orgs || []) S.orgAct(m.id, 'attend'); break;
      case 'power': work(); act('u:friend'); { const org = S.orgsAvail(p).find(o => (o.k === 'Power' || o.k === 'Politics') && !S.orgWhy(p, o).length && !(p.orgs || []).some(m => m.id === o.id)); if (org) S.orgAct(org.id, 'join'); } for (const m of p.orgs || []) { S.orgAct(m.id, 'attend'); S.orgAct(m.id, 'rise'); } if (S.pol && a >= 18) S.pol.seek(Math.min(5, (p.office?.lvl || 0) + 1)); if (p.office?.lvl >= 4) { S.pol.rule('works'); if (p.office.appr < 45) S.pol.rule('taxdown'); } break;
      default: work(); family(); act(a % 2 ? 'u:gym' : 'u:study'); if (p.hp < 50) act('u:party'); home();
    }
    S.settle();
  }

  /* ---------- reaching Claude ---------- */
  const STORE = 'tempora.ai';
  const settings = () => { const s = UI?.store?.get(STORE) || {}; return { model: s.model || 'claude-opus-5', key: s.key || '', off: !!s.off }; };
  const saveSettings = s => UI.store.set(STORE, JSON.stringify(s));
  let hosted, SDK;
  async function backend() {
    const s = settings();
    if (s.off) return null;
    if (typeof window !== 'undefined' && window.claude && typeof window.claude.use === 'function') {
      if (hosted === undefined) { try { hosted = await window.claude.use('sample'); } catch { hosted = null; } }
      if (hosted) return 'hosted';
    }
    if (typeof Platform !== 'undefined' && Platform.ai()) return 'server';
    if (s.key) return 'key';
    return null;
  }
  async function sdkClient(key) {
    if (!SDK) SDK = (await import('https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk/+esm')).default;
    return new SDK({ apiKey: key, dangerouslyAllowBrowser: true });
  }
  class AIError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
  /**
   * ask({ system, messages, schema, effort, tier, maxTokens }) -> { text, data }
   * messages: [{role, content}] starting and ending with a user turn.
   * schema: JSON Schema for a structured reply (data holds the parsed object).
   */
  async function ask(o) {
    const how = await backend();
    if (!how) throw new AIError('unavailable', 'Claude is not connected. Open AI settings to connect.');
    if (how === 'hosted') {
      const input = [{ role: 'user', content: `${o.system}${o.schema ? `\n\nReply with only JSON matching this schema: ${JSON.stringify(o.schema)}` : ''}` }, ...o.messages];
      try {
        const opts = { modelTier: o.tier || 'default', cache: false };
        if (o.schema) { const data = await hosted.json(input, opts); return { text: data?.reply || data?.narration || '', data }; }
        const r = await hosted(input, opts); return { text: r.text };
      } catch (e) { throw new AIError(e?.code || 'upstream_error', e?.code === 'refused' ? 'Claude declined to answer that.' : e?.code === 'not_granted' ? 'Claude access was not allowed on this page.' : e?.code === 'rate_limited' ? 'Too many requests. Try again in a little while.' : 'Claude could not answer just now.'); }
    }
    if (how === 'server') {
      const r = await Platform.aiAsk({ system: o.system, messages: o.messages, schema: o.schema, effort: o.effort, max_tokens: o.maxTokens || 16000 });
      if (r.error) throw new AIError(r.code || 'upstream_error', r.error);
      let data = null; if (o.schema) { try { data = JSON.parse(r.text); } catch { throw new AIError('invalid_json', 'Claude replied in an unexpected format.'); } }
      return { text: data?.reply || data?.narration || r.text, data };
    }
    // the player's own key, via the official SDK in the browser
    const s = settings(), client = await sdkClient(s.key);
    const params = { model: s.model, max_tokens: o.maxTokens || 16000, system: o.system, messages: o.messages };
    const oc = {};
    if (o.effort && !/haiku/.test(s.model)) oc.effort = o.effort;
    if (o.schema) oc.format = { type: 'json_schema', schema: o.schema };
    if (Object.keys(oc).length) params.output_config = oc;
    let res;
    try {
      // Claude Opus 5 and Fable 5.1 can decline; server-side fallbacks re-run a declined request on a suitable model
      res = /claude-opus-5$|claude-fable-5-1/.test(s.model)
        ? await client.beta.messages.create({ ...params, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' })
        : await client.messages.create(params);
    } catch (e) {
      if (e instanceof SDK.AuthenticationError) throw new AIError('auth', 'That API key was rejected. Check it in AI settings.');
      if (e instanceof SDK.RateLimitError) throw new AIError('rate_limited', 'Rate limited. Try again in a moment.');
      if (e instanceof SDK.BadRequestError) throw new AIError('bad_request', `Claude rejected the request: ${e.message}`);
      if (e instanceof SDK.APIError) throw new AIError('upstream_error', `Claude API error ${e.status ?? ''}`.trim());
      throw new AIError('network', 'Could not reach Claude. Check your connection.');
    }
    if (res.stop_reason === 'refusal') throw new AIError('refused', 'Claude declined to answer that.');
    const text = res.content.filter(b => b.type === 'text').map(b => b.text).join('');
    let data = null;
    if (o.schema) { try { data = JSON.parse(text); } catch { throw new AIError('invalid_json', 'Claude replied in an unexpected format.'); } }
    return { text: data?.reply || data?.narration || text, data };
  }

  /* ---------- what Claude is told about your life ---------- */
  function digest(p) {
    const e = S.era(), home = S.towns?.info(p), pd = S.pers?.describe(p);
    const people = S.known(p).filter(S.alive).sort((a, b) => (p.rels[b.id]?.c ?? 0) - (p.rels[a.id]?.c ?? 0)).slice(0, 10)
      .map(o => `${S.fullName(o)} (${S.relLabel(p, o).toLowerCase()}, ${S.age(o)}, closeness ${Math.round(p.rels[o.id]?.c ?? 0)})`);
    const recent = p.log.filter(l => l.k !== 'quiet').slice(-14).map(l => `${U.fmtYearAD(l.y)} (age ${l.a}): ${l.t}`);
    const stats = DATA.stats.map(s => `${s.n} ${Math.round(p[s.k] ?? 0)}`).join(', ');
    return [
      `Name: ${S.fullName(p)}, ${p.sex === 'M' ? 'male' : 'female'}, age ${S.age(p)}. Year ${U.fmtYearAD(yr())}, ${e.name} era.`,
      `Lives in ${home ? home.label + ', ' : ''}${S.world.name(p.cc)} (${S.world.gov(p.cc)}). Social class: ${S.className(p)}.`,
      `Stats (0-100): ${stats}.`,
      `Money: ${S.money(p.money)} cash, net worth ${S.money(S.netWorth(p))}; living costs about ${S.money(S.toVal(e.cost))} a year.`,
      `Education: ${e.edu.n[p.edu]}${p.school ? `, now at ${e.edu.n[p.school.lvl]}` : ''}. Work: ${p.office ? p.office.t : p.job ? `${p.job.t} (performance ${Math.round(p.job.perf)})` : p.retired ? 'retired' : 'none'}.`,
      pd ? `Personality: ${pd.type} (${pd.name}); traits: ${pd.traits.map(t => t.n).join(', ') || 'none yet'}.` : '',
      p.amb ? `Life ambition: ${DATA.ambitions.find(x => x.id === p.amb)?.n}.` : '',
      p.sick.length ? `Ill with: ${p.sick.map(s => s.n).join(', ')}.` : '',
      p.prison ? `In prison for ${p.prison} more years.` : '',
      `People: ${people.join('; ') || 'nobody yet'}.`,
      `Recent life: ${recent.join(' | ')}`,
    ].filter(Boolean).join('\n');
  }
  const ADVISOR = { prehistory: 'the old wise woman of the band', ancient: 'a philosopher who tutors your family', medieval: 'the village priest', renaissance: 'a learned humanist friend', colonial: 'a sharp-witted coffeehouse companion', industrial: 'a shrewd family solicitor', wars: 'a steady family doctor', modern: 'a life coach', digital: 'a thoughtful mentor', near: 'your personal AI counsellor', far: 'the habitat’s archive-mind' };
  function advisorSystem(p) {
    return `You are ${ADVISOR[S.era().id] || 'a wise advisor'}, speaking to the player of Tempora, a life simulator where they live one year at a time across history. Stay in that persona and in period: know only what someone of ${U.fmtYearAD(yr())} would know about the world, but you may speak plainly about the player's choices and their odds. Give concrete advice in terms of things the player can do in the game (activities, work, school, relationships, places, money, politics, sport, phone, will). Be warm and brief: at most 150 words unless asked for more.\n\nThe player's life:\n${digest(p)}`;
  }
  // Talking with someone you know, in character
  const CHAT_SCHEMA = { type: 'object', properties: { reply: { type: 'string' }, mood: { type: 'integer', enum: [-2, -1, 0, 1, 2] } }, required: ['reply', 'mood'], additionalProperties: false };
  function npcSystem(p, o) {
    const pd = S.pers?.describe(o), home = S.towns?.info(o), rl = S.relLabel(p, o).toLowerCase();
    const theirLife = o.log.filter(l => l.k !== 'quiet').slice(-8).map(l => `${U.fmtYearAD(l.y)}: ${l.t.replace(/\bYou\b/g, 'I').replace(/\byou\b/g, 'me').replace(/\byour\b/g, 'my').replace(/\bYour\b/g, 'My')}`);
    return `Role-play ${S.fullName(o)}, a ${S.age(o)}-year-old ${o.sex === 'M' ? (S.age(o) < 16 ? 'boy' : 'man') : (S.age(o) < 16 ? 'girl' : 'woman')} living in ${home ? home.label + ', ' : ''}${S.world.name(o.cc)} in ${U.fmtYearAD(yr())} (${S.era().name} era). You are talking with ${S.fullName(p)}, your ${rl} (you are their ${rl}; closeness ${Math.round(p.rels[o.id]?.c ?? 50)} out of 100). Your work: ${o.job ? o.job.t : o.retired ? 'retired' : 'none'}. Social class: ${S.className(o)}.${pd ? ` Personality: ${pd.type}, ${pd.traits.map(t => t.n.toLowerCase()).join(', ') || 'still forming'}.` : ''}
Things that happened to you lately: ${theirLife.join(' | ') || 'nothing remarkable'}.
Speak as this person would, in their era's everyday voice, knowing only what they could know. Keep replies to one to four sentences. Never mention being an AI or a game.
Reply as JSON: "reply" is what you say; "mood" is how this exchange made you feel about them, from -2 (hurt or angry) to 2 (delighted).`;
  }
  async function chat(o, history) {
    const p = S.me();
    const r = await ask({ system: npcSystem(p, o), messages: history, schema: CHAT_SCHEMA, effort: 'low', tier: 'quick', maxTokens: 2000 });
    const mood = Math.max(-2, Math.min(2, Math.round(+r.data?.mood || 0)));
    const rel = S.rel(p, o);
    p.flags.aiChat ||= {}; const used = p.flags.aiChat[o.id] === yr() ? p.flags.aiChatN || 0 : 0;
    if (used < 4) { rel.c = U.clamp(rel.c + mood * 2); p.flags.aiChat[o.id] = yr(); p.flags.aiChatN = used + 1; }
    return { reply: String(r.data?.reply || r.text || '').slice(0, 1200), mood };
  }
  // Let Claude choose this year's actions
  function menu(p) {
    const items = [];
    for (const a of S.activities(p)) if (!a.young && !a.done && !a.broke && !a.jailed) items.push([`activity:${a.id}`, `${a.n}${a.cost ? ` (costs ${S.money(a.cost)})` : ''}`]);
    for (const o of S.known(p).filter(S.alive).slice(0, 10)) for (const x of S.actionsFor(p, o)) if (!x.done && !['divorce', 'breakup', 'argue', 'money'].includes(x.id)) items.push([`interact:${o.id}:${x.id}`, `${x.l} with ${o.first} (${S.relLabel(p, o).toLowerCase()})`]);
    if (p.job) { items.push(['workHard', 'Work hard this year']); items.push(['promo', 'Ask for a promotion']); }
    else for (const L of S.jobListings(p).filter(x => !x.why.length).sort((x, y) => y.pay - x.pay).slice(0, 5)) items.push([`apply:${L.j.id}`, `Apply to be a ${L.j.t.toLowerCase()} (${S.money(L.pay)}/yr)`]);
    const o = S.eduOptions(p).find(x => !x.why.length); if (o && !p.school) items.push([`enroll:${o.lvl}`, `Enrol in ${o.n.toLowerCase()}`]);
    for (const m of S.market().filter(x => x.price <= p.money * 0.5).slice(0, 4)) items.push([`buy:${m.a.id}`, `Buy a ${m.a.t.toLowerCase()} (${S.money(m.price)})`]);
    if (p.sport) { items.push(['sportTrain', 'Train at your sport']); items.push(['sportCompete', 'Compete at your sport']); }
    if (S.pol) { const l = Math.min(5, (p.office?.lvl || 0) + 1); if (!S.pol.requirements(p, l).length) items.push([`polSeek:${l}`, `Seek office as ${S.pol.officeTitle(p.cc, l, p.sex)}`]); }
    return items.slice(0, 70);
  }
  const PLAY_SCHEMA = { type: 'object', properties: { actions: { type: 'array', items: { type: 'string' } }, narration: { type: 'string' } }, required: ['actions', 'narration'], additionalProperties: false };
  async function playYear(goal) {
    const p = S.me(), items = menu(p);
    const g = GOALS.find(x => x[0] === goal)?.[1] || 'a good, balanced life';
    const r = await ask({
      system: `You are playing Tempora, a life simulator, on the player's behalf. Choose what this character does this year to pursue: ${g}. Stay true to the character's personality where it does not work against that goal. Pick 3 to 6 actions from the menu, using their exact ids. Then write one or two sentences, in the second person, about the year you chose for them.\n\nThe character:\n${digest(p)}`,
      messages: [{ role: 'user', content: `Menu (id: description):\n${items.map(([id, d]) => `${id}: ${d}`).join('\n')}\n\nReply as JSON with "actions" (ids from the menu) and "narration".` }],
      schema: PLAY_SCHEMA, effort: 'medium', maxTokens: 4000,
    });
    const valid = new Set(items.map(x => x[0])), done = [];
    for (const id of (r.data?.actions || []).filter(x => valid.has(x)).slice(0, 6)) {
      const [k, a, b] = id.split(':');
      let t = '';
      try {
        S.asAuto(() => {
          if (k === 'activity') t = S.doActivity(`${a}:${b}`);
          else if (k === 'interact') t = S.interact(+a, b);
          else if (k === 'apply') t = S.apply(a).t;
          else if (k === 'enroll') t = S.doEnroll(+a);
          else if (k === 'buy') t = S.buy(a);
          else if (k === 'polSeek') t = S.pol.seek(+a);
          else t = run(k);
        });
      } catch { t = ''; }
      S.settle();
      if (t) done.push(t);
    }
    if (r.data?.narration) S.log(p, r.data.narration, 'life');
    return { narration: r.data?.narration || '', done };
  }
  const CHOICE_SCHEMA = { type: 'object', properties: { choice: { type: 'integer' }, reply: { type: 'string' } }, required: ['choice', 'reply'], additionalProperties: false };
  async function adviseChoice(pr) {
    const p = S.me();
    const r = await ask({
      system: advisorSystem(p),
      messages: [{ role: 'user', content: `${pr.text}\n\nOptions:\n${pr.choices.map((c, i) => `${i}: ${c.l}${c.dis ? ' (cannot afford)' : ''}`).join('\n')}\n\nWhich option would you advise, and why, in one or two sentences? Reply as JSON with "choice" (the option number) and "reply" (your advice).` }],
      schema: CHOICE_SCHEMA, effort: 'low', tier: 'quick', maxTokens: 2000,
    });
    return { i: Math.max(0, Math.min(pr.choices.length - 1, +r.data?.choice || 0)), why: r.data?.reply || '' };
  }
  async function narrate(p, ch) {
    const r = await ask({
      system: `You are the narrator of a life story from Tempora, a life simulator. Rewrite the chapter notes below as flowing literary prose in the second person, faithful to every fact, in the voice of the ${S.eraOf(U.add(p.born, 20)).name} era, about 150 to 250 words. No headings.`,
      messages: [{ role: 'user', content: `Chapter ${ch.n}: ${ch.title}.\n${ch.intro || ''}\n${ch.lines.slice(0, 40).join('. ')}` }],
      effort: 'medium', maxTokens: 4000,
    });
    return r.text;
  }
  return { GOALS, WEIGHTS, advise, run, autopilot, bestChoice, choiceValue, backend, ask, settings, saveSettings, digest, advisorSystem, chat, playYear, adviseChoice, narrate, menu, AIError };
})();

/* ---------------- the AI sheet, NPC chat, and choice advice ---------------- */
LATE.push(() => {
  const S = Sim, ui = UI, { $, esc, toast, render, sheet } = ui;
  const BACKEND = { hosted: 'Claude, through this page', server: 'Claude, through your Tempora server', key: 'Claude, with your own API key' };
  let chatLog = [], chatWith = null, busy = false, aiTab = 'advice', advisorLog = [];
  async function status() { try { return await AI.backend(); } catch { return null; } }
  async function aiSheet(res) {
    const p = S.me(), how = await status(), s = AI.settings();
    const tips = AI.advise(p);
    const tabs = [['advice', 'Advice'], ['ask', 'Ask'], ['play', 'Play for me'], ['settings', 'Settings']];
    let body = '';
    if (aiTab === 'advice') body = tips.length ? `<div class="list">${tips.map((x, i) => `<div class="row"><div class="main"><div class="t">${esc(x.t)}</div><div class="s">${esc(x.why)}</div></div>${x.act !== 'none' ? `<button class="btn sm era" data-act="aiDo" data-i="${i}">${x.act === 'tab' ? 'Go' : x.act === 'will' ? 'Open' : 'Do it'}</button>` : ''}</div>`).join('')}</div>` : '<p class="muted">You are doing fine. Age up when you are ready.</p>';
    if (aiTab === 'ask') body = !how ? noAI() : `<div class="chatlog">${advisorLog.map(m => `<p class="${m.role}">${esc(m.content)}</p>`).join('') || `<p class="faint">Ask ${esc(AI.advisorSystem(p).split(',')[0].replace('You are ', ''))} anything: what to do next, what your chances are, what the world is like.</p>`}</div>
      <div class="cform"><input id="ai-q" maxlength="400" placeholder="What should I do about…" aria-label="Your question"><button class="btn sm era" data-act="aiAsk" ${busy ? 'disabled' : ''}>${busy ? 'Thinking…' : 'Ask'}</button></div>`;
    if (aiTab === 'play') {
      const c = typeof Auto !== 'undefined' ? Auto.cfg() : {};
      body = `<p class="lede">Choose a goal. The autopilot (offline) plays each year toward it; with Claude connected, Claude can also pick this year's actions for you.</p>
        <div class="field"><label for="ai-goal">Goal</label><select id="ai-goal" data-input="aiGoal">${AI.GOALS.map(([v, n]) => `<option value="${v}" ${c.goal === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
        <div class="btnrow" style="margin-top:10px"><button class="btn era" data-act="aiAutoOn">${c.goal ? 'Autopilot is on · change goal' : 'Turn on autopilot'}</button>${c.goal ? '<button class="btn" data-act="aiAutoOff">Turn off</button>' : ''}<button class="btn" data-act="aiPlayOffline">Play this year's actions now</button>
          ${how ? `<button class="btn" data-act="aiPlay" ${busy ? 'disabled' : ''}>${busy ? 'Claude is choosing…' : 'Let Claude live this year'}</button>` : ''}</div>
        <p class="faint" style="font-size:12.5px;margin:10px 0 0">Choices that pop up can also be decided for you: set "When a choice pops up" to "Choose what serves my goal" in Auto-play.</p>`;
    }
    if (aiTab === 'settings') body = `<p class="lede">Status: <b>${how ? esc(BACKEND[how]) : 'Not connected'}</b>. The advisor, autopilot and choice helper work offline; talking with people, asking questions and letting Claude play need Claude.</p>
      <div class="field"><label for="ai-model">Model (for your own key)</label><select id="ai-model">${[['claude-opus-5', 'Claude Opus 5 (default, most capable)'], ['claude-sonnet-5', 'Claude Sonnet 5 (faster, cheaper)'], ['claude-haiku-4-5', 'Claude Haiku 4.5 (fastest, cheapest)']].map(([v, n]) => `<option value="${v}" ${s.model === v ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="field" style="margin-top:8px"><label for="ai-key">Your Anthropic API key</label><input id="ai-key" type="password" autocomplete="off" placeholder="${s.key ? 'A key is saved in this browser' : 'sk-ant-…'}"></div>
      <p class="faint" style="font-size:12px;margin:6px 0 0">The key is stored only in this browser and sent only to Anthropic. Calls are billed to your account. On a hosted Tempora page or server you do not need a key.</p>
      <div class="btnrow" style="margin-top:10px"><button class="btn era" data-act="aiSave">Save</button>${s.key ? '<button class="btn danger" data-act="aiForget">Forget my key</button>' : ''}<label class="check"><input type="checkbox" data-input="aiOff" ${s.off ? 'checked' : ''}> Turn Claude features off</label></div>`;
    sheet(`<h2>Guide</h2>
      <div class="subtabs" role="tablist" style="margin-top:10px">${tabs.map(([id, n]) => `<button data-act="aiTab" data-v="${id}" aria-selected="${aiTab === id}">${n}</button>`).join('')}</div>
      <div class="aibody">${body}</div>${res ? `<div class="result">${esc(res)}</div>` : ''}`, { label: 'Guide' });
    const q = $('#ai-q'); if (q) q.focus();
  }
  const noAI = () => '<p class="lede">Claude is not connected. Open <b>Settings</b> to add your own API key, or play on a hosted Tempora page or server where Claude is built in. The Advice tab and autopilot work without it.</p>';
  ui.on.ai = () => { ui.open = null; aiSheet(); };
  ui.on.aiTab = el => { aiTab = el.dataset.v; ui.open = null; aiSheet(); };
  ui.on.aiDo = el => {
    const x = AI.advise(S.me())[+el.dataset.i]; if (!x) return;
    if (x.act === 'tab') { ui.open = null; $('#modal').innerHTML = ''; ui.tab = x.ds.tab; render(); return; }
    if (x.act === 'will') { ui.open = null; ui.on.willOpen(); return; }
    const t = AI.run(x.act, x.ds); S.settle(); render(); ui.open = null; aiSheet(t || 'Done.');
  };
  ui.on.aiAsk = async () => {
    const q = $('#ai-q')?.value.trim(); if (!q || busy) return;
    advisorLog.push({ role: 'user', content: q }); busy = true; ui.open = null; aiSheet();
    try { const r = await AI.ask({ system: AI.advisorSystem(S.me()), messages: advisorLog.slice(-12), effort: 'medium', maxTokens: 4000 }); advisorLog.push({ role: 'assistant', content: r.text }); }
    catch (e) { advisorLog.pop(); toast(e.message); }
    busy = false; ui.open = null; aiSheet();
  };
  ui.input.aiGoal = el => { if (typeof Auto !== 'undefined' && Auto.cfg().goal) { Auto.cfg().goal = el.value; ui.save(); } };
  ui.on.aiAutoOn = () => { Auto.cfg().goal = $('#ai-goal').value; ui.save(); ui.open = null; aiSheet(`Autopilot will pursue: ${AI.GOALS.find(g => g[0] === Auto.cfg().goal)[1].toLowerCase()}.`); };
  ui.on.aiAutoOff = () => { Auto.cfg().goal = null; ui.save(); ui.open = null; aiSheet('Autopilot off.'); };
  ui.on.aiPlayOffline = () => { AI.autopilot(S.me(), $('#ai-goal').value); S.settle(); render(); ui.save(); ui.open = null; aiSheet('Done. The year is planned; age up when you are ready.'); };
  ui.on.aiPlay = async () => {
    if (busy) return; busy = true; ui.open = null; aiSheet();
    try { const r = await AI.playYear($('#ai-goal')?.value || 'balanced'); busy = false; S.settle(); render(); ui.save(); ui.open = null; aiSheet(`${r.narration}${r.done.length ? ` (${r.done.length} actions taken.)` : ''}`); }
    catch (e) { busy = false; ui.open = null; aiSheet(e.message); }
  };
  ui.on.aiSave = () => {
    const s = AI.settings(), k = $('#ai-key')?.value.trim();
    AI.saveSettings({ ...s, model: $('#ai-model').value, key: k || s.key });
    ui.open = null; aiSheet(k ? 'Key saved in this browser.' : 'Saved.');
  };
  ui.on.aiForget = () => { const s = AI.settings(); AI.saveSettings({ ...s, key: '' }); ui.open = null; aiSheet('Your key was removed from this browser.'); };
  ui.input.aiOff = el => { const s = AI.settings(); AI.saveSettings({ ...s, off: el.checked }); };

  /* talk freely with anyone */
  const pExtra = ui.personExtra;
  ui.personExtra = (p, o) => (pExtra ? pExtra(p, o) : '') + (o.id !== p.id && S.alive(o) && S.age(o) >= 4 ? `<button class="btn block" style="margin-top:10px" data-act="aiChat" data-id="${o.id}">Talk freely with ${esc(o.first)} (Claude)</button>` : '');
  async function chatSheet() {
    const o = S.P(chatWith), how = await status();
    sheet(`<div class="who">${ui.av(o, 'lg')}<div class="meta"><div class="eyebrow">${esc(S.relLabel(S.me(), o))}</div><h2>${esc(S.fullName(o))}</h2><div class="sub">Closeness ${Math.round(S.me().rels[o.id]?.c ?? 0)}</div></div></div>
      ${!how ? noAI() : `<div class="chatlog">${chatLog.map(m => `<p class="${m.role}">${esc(m.content)}</p>`).join('') || `<p class="faint">Say something to ${esc(o.first)}. They answer in character; how the talk goes moves your closeness.</p>`}</div>
      <div class="cform"><input id="ai-say" maxlength="400" placeholder="Say something…" aria-label="Your words"><button class="btn sm era" data-act="aiSay" ${busy ? 'disabled' : ''}>${busy ? '…' : 'Say'}</button></div>`}`, { label: 'Conversation' });
    $('#ai-say')?.focus();
  }
  ui.on.aiChat = el => { const id = +el.dataset.id; if (chatWith !== id) chatLog = []; chatWith = id; ui.open = null; chatSheet(); };
  ui.on.aiSay = async () => {
    const t = $('#ai-say')?.value.trim(); if (!t || busy) return;
    chatLog.push({ role: 'user', content: t }); busy = true; ui.open = null; chatSheet();
    try { const r = await AI.chat(S.P(chatWith), chatLog.slice(-16)); chatLog.push({ role: 'assistant', content: r.reply }); if (r.mood) ui.lastDelta = null; }
    catch (e) { chatLog.pop(); toast(e.message); }
    busy = false; ui.open = null; render(); chatSheet();
  };
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.target.id === 'ai-say' || e.target.id === 'ai-q')) { e.preventDefault(); (e.target.id === 'ai-say' ? ui.on.aiSay : ui.on.aiAsk)(); } });

  /* ask for advice on a pop-up choice */
  ui.promptExtra = pr => `<div class="btnrow" style="margin-top:10px"><button class="btn sm" data-act="aiHint">What would the advisor pick?</button></div><div id="aihint"></div>`;
  ui.on.aiHint = async () => {
    const pr = S.prompts[0], box = $('#aihint'); if (!pr || !box) return;
    const how = await status();
    if (!how) {
      const goal = (typeof Auto !== 'undefined' && Auto.cfg().goal) || 'balanced';
      const pick = AI.bestChoice(S.me(), pr.choices.filter(c => !c.dis), goal), i = pr.choices.indexOf(pick);
      box.innerHTML = `<div class="result">By the numbers, for ${esc(AI.GOALS.find(g => g[0] === goal)[1].toLowerCase())}: <b>${esc(pick.l)}</b>.</div>`;
      document.querySelectorAll('#modal [data-act="choose"]').forEach(b => b.classList.toggle('hint', +b.dataset.i === i));
      return;
    }
    box.innerHTML = '<div class="result">Thinking…</div>';
    try { const r = await AI.adviseChoice(pr); box.innerHTML = `<div class="result">${esc(r.why)}</div>`; document.querySelectorAll('#modal [data-act="choose"]').forEach(b => b.classList.toggle('hint', +b.dataset.i === r.i)); }
    catch (e) { box.innerHTML = `<div class="result">${esc(e.message)}</div>`; }
  };

  /* prose chapters in "Your story" */
  const life = ui.views.life;
  ui.views.life = p => {
    let html = life(p);
    if (ui.lifeView === 'story') {
      const prose = p.prose || {};
      html = html.replace(/<section><h3>Chapter ([IVX]+) · ([^<]+)<\/h3>/g, (m, n) => `${m}${prose[n] ? `<p class="prose">${esc(prose[n])}</p>` : `<button class="linkbtn" data-act="aiNarrate" data-ch="${n}">Have Claude write this chapter as prose</button>`}`);
    }
    return html;
  };
  ui.on.aiNarrate = async el => {
    const p = S.me(), ch = S.story(p).find(c => c.n === el.dataset.ch); if (!ch) return;
    el.textContent = 'Writing…'; el.disabled = true;
    try { const t = await AI.narrate(p, ch); (p.prose ||= {})[ch.n] = t; ui.save(); render(); }
    catch (e) { toast(e.message); el.textContent = 'Have Claude write this chapter as prose'; el.disabled = false; }
  };
});
