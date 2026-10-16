/* =====================================================================
   ATLAS, part 1 — archetypes shared by every country.
   A country record (data-atlas-*.js) names an archetype for each thing
   it has in common with its neighbours: how its prehistory went, what
   its people look like, what its culture values. Only what is special
   about a country is written in its own record.
   Years in timelines follow the rest of the game: [until, ...] means
   "applies up to and including that year".
   ===================================================================== */

DATA.atlas = {
  raw: [],          // country records, filled by data-atlas-*.js (see A())
  subs: {}, pre: {}, dens: {}, curA: {}, cult: {}, ga: {}, polities: {}, blocs: {}, faiths: {}, rsA: {},
};

/* ---------- subregions: [label, continent] ---------- */
Object.assign(DATA.atlas.subs, {
  'eu-brit': ['British Isles', 'europe'], 'eu-nord': ['Nordic countries', 'europe'], 'eu-balt': ['Baltic states', 'europe'], 'eu-west': ['Western Europe', 'europe'],
  'eu-cent': ['Central Europe', 'europe'], 'eu-iber': ['Iberia', 'europe'], 'eu-ital': ['Italy and the islands', 'europe'], 'eu-balk': ['The Balkans', 'europe'], 'eu-east': ['Eastern Europe', 'europe'],
  'as-cauc': ['The Caucasus', 'asia'], 'as-anat': ['Anatolia and Cyprus', 'asia'], 'as-levant': ['The Levant', 'asia'], 'as-mesop': ['Mesopotamia', 'asia'], 'as-gulf': ['Arabian Peninsula', 'asia'], 'as-iran': ['Iran', 'asia'],
  'as-cent': ['Central Asia', 'asia'], 'as-sasia': ['South Asia', 'asia'], 'as-easia': ['East Asia', 'asia'], 'as-seasia': ['Southeast Asia', 'asia'],
  'af-north': ['North Africa', 'africa'], 'af-sahel': ['The Sahel', 'africa'], 'af-west': ['West Africa', 'africa'], 'af-cent': ['Central Africa', 'africa'], 'af-east': ['East Africa and the Horn', 'africa'],
  'af-south': ['Southern Africa', 'africa'], 'af-ocean': ['Indian Ocean islands', 'africa'],
  'am-north': ['North America', 'americas'], 'am-meso': ['Mexico and Central America', 'americas'], 'am-carib': ['The Caribbean', 'americas'], 'am-andes': ['The Andes and the north', 'americas'],
  'am-cone': ['The Southern Cone', 'americas'], 'am-braz': ['Brazil and the Guianas', 'americas'],
  'oc-aus': ['Australia and New Zealand', 'oceania'], 'oc-mel': ['Melanesia', 'oceania'], 'oc-pol': ['Polynesia', 'oceania'], 'oc-mic': ['Micronesia', 'oceania'],
});

/* ---------- population density (people per km²) at [-10000, -5000, -2000, 1, 500, 1000, 1300, 1500, 1700] ---------- */
DATA.atlas.densYears = [-10000, -5000, -2000, 1, 500, 1000, 1300, 1500, 1700];
Object.assign(DATA.atlas.dens, {
  agri_high: [0.01, 0.15, 2, 9, 8, 10, 14, 18, 24],
  agri_mid: [0.01, 0.08, 1, 4, 3, 5, 9, 10, 13],
  agri_low: [0.01, 0.05, 0.4, 1.5, 1.5, 2, 2.5, 3, 3.5],
  steppe: [0.005, 0.02, 0.1, 0.3, 0.3, 0.4, 0.4, 0.5, 0.5],
  arid: [0.003, 0.01, 0.08, 0.3, 0.3, 0.4, 0.4, 0.4, 0.4],
  nile: [0.02, 0.4, 5, 14, 11, 12, 10, 8, 8],
  amer_high: [0.01, 0.05, 0.8, 3, 4, 6, 9, 14, 4],
  amer_mid: [0.01, 0.03, 0.2, 0.5, 0.8, 1, 1.5, 2, 0.8],
  amer_low: [0.005, 0.01, 0.05, 0.1, 0.1, 0.12, 0.15, 0.2, 0.12],
  arctic: [0.002, 0.004, 0.01, 0.02, 0.02, 0.03, 0.03, 0.03, 0.03],
  island: [0, 0, 0.1, 1, 2, 3, 4, 5, 5],
});

/* ---------- prehistory archetypes ----------
   n: names [until, name, government]   cap: places [until, place]   pool: name pool
   nl: when farming, herding and copper arrive [farm, herd, copper]   d: density key
   cur: barter and early money [until, name, symbol, rate]  */
(() => {
  const P = DATA.atlas.pre;
  const def = (code, o) => { P[code] = o; };
  const BARTER = [[-3001, 'barter goods', '', 8]];
  def('euw', { d: 'agri_mid', pool: 'meso', nl: [-5500, -5500, -3500], gt: [[-4000, 'WHG'], [-2500, 'EEF']],
    n: [[-9500, 'the Late Glacial hunting grounds', 'Hunter bands'], [-5500, 'the Mesolithic foragers', 'Hunter-gatherer bands'], [-2500, 'the Neolithic farmers and megalith builders', 'Farming chiefdoms'], [-800, 'the Bronze Age chiefdoms', 'Chiefdoms']],
    cap: [[-5500, 'a coastal camp'], [-2500, 'a stone-circle village'], [-800, 'a hillfort']], cur: [...BARTER, [-300, 'bronze ingots', 'ing ', 3]] });
  def('eun', { d: 'agri_low', pool: 'meso', nl: [-4000, -4000, -2000], gt: [[-4000, 'WHG'], [-2800, 'EEF'], [-2000, 'EHG']],
    n: [[-9000, 'the reindeer hunters of the ice edge', 'Hunter bands'], [-4000, 'the Maglemose and Ertebølle foragers', 'Forager bands'], [-2800, 'the Funnel Beaker farmers', 'Farming villages'], [-1700, 'the Battle Axe herders', 'Chiefdoms'], [-500, 'the Nordic Bronze Age', 'Chiefdoms']],
    cap: [[-4000, 'a seal-hunting camp'], [-2800, 'a lakeside village'], [-500, 'a hall-farm']], cur: [...BARTER, [-300, 'amber and furs', '', 4]] });
  def('euc', { d: 'agri_mid', pool: 'meso', nl: [-5500, -5500, -4000], gt: [[-5500, 'WHG'], [-2800, 'EEF'], [-2000, 'EHG']],
    n: [[-9000, 'the Ice Age hunters of the loess plains', 'Hunter bands'], [-5500, 'the Mesolithic foragers', 'Forager bands'], [-2800, 'the Linear Pottery farmers', 'Farming villages'], [-1800, 'the Corded Ware herders', 'Chiefdoms'], [-1200, 'the Bronze Age Unetice and Tumulus peoples', 'Chiefdoms'], [-500, 'the Urnfield and Hallstatt peoples', 'Tribes and chiefdoms']],
    cap: [[-5500, 'a river camp'], [-2800, 'a longhouse village'], [-500, 'a hillfort']], cur: [...BARTER, [-300, 'salt and bronze rings', '', 3]] });
  def('eue', { d: 'agri_low', pool: 'steppe', nl: [-6000, -5000, -4500], gt: [[-3300, 'EHG']],
    n: [[-9000, 'the mammoth and reindeer hunters', 'Hunter bands'], [-5000, 'the forest foragers of the Dnieper and Don', 'Forager bands'], [-2700, 'the Cucuteni-Trypillia megatowns', 'Farming towns'], [-1000, 'the Yamnaya and Srubnaya herders', 'Pastoral clans'], [-400, 'the lands of Scythians and Sarmatians', 'Nomad kingdoms']],
    cap: [[-5000, 'a river camp'], [-2700, 'a great farming town'], [-400, 'a steppe fort']], cur: [...BARTER, [-200, 'furs and amber', '', 4]] });
  def('eus', { d: 'agri_mid', pool: 'meso', nl: [-6000, -6000, -4000], gt: [[-6000, 'WHG'], [-2000, 'EEF']],
    n: [[-9500, 'the Mediterranean hunters', 'Hunter bands'], [-6000, 'the Mesolithic foragers', 'Forager bands'], [-3300, 'the Impressed Ware farmers', 'Farming villages'], [-1700, 'the Copper Age chiefdoms', 'Chiefdoms'], [-900, 'the Bronze Age peoples', 'Chiefdoms']],
    cap: [[-6000, 'a cave camp'], [-3300, 'a farming village'], [-900, 'a hill town']], cur: [...BARTER, [-300, 'bronze lumps', 'aes ', 1.5]] });
  def('balk', { d: 'agri_mid', pool: 'catal', nl: [-6500, -6500, -5000], gt: [[-6800, 'WHG'], [-2000, 'EEF']],
    n: [[-9000, 'the Balkan hunters', 'Hunter bands'], [-6500, 'the Mesolithic foragers of the Iron Gates', 'Forager bands'], [-4500, 'the Starčevo and Vinča farming towns', 'Farming towns'], [-2500, 'the Copper Age peoples of the Balkans', 'Chiefdoms'], [-1000, 'the Bronze Age tribes', 'Chiefdoms'], [-700, 'the Thracian and Illyrian tribes', 'Tribal kingdoms']],
    cap: [[-6500, 'a river-gorge camp'], [-4500, 'a great farming town'], [-700, 'a hillfort']], cur: [...BARTER, [-400, 'silver ingots', 'ing ', 8]] });
  def('steppe', { d: 'steppe', pool: 'steppe', nl: [-5000, -4000, -3000],
    n: [[-9000, 'the steppe hunters', 'Hunter bands'], [-4000, 'the early horse herders', 'Herding clans'], [-2200, 'the Afanasievo and Andronovo herders', 'Pastoral clans'], [-700, 'the Saka and Scythian steppe', 'Nomad confederations']],
    cap: [[-4000, 'a summer pasture'], [-2200, 'a kurgan camp'], [-700, 'a winter camp']], cur: [...BARTER, [-300, 'horses and felt', '', 6]] });
  def('sib', { d: 'arctic', pool: 'meso', nl: [99999, -1500, 99999],
    n: [[-9000, 'the mammoth hunters of Siberia', 'Hunter bands'], [-2000, 'the taiga and tundra hunters', 'Forager bands'], [-300, 'the reindeer herders and fishers', 'Clans']],
    cap: [[-2000, 'a winter camp'], [-300, 'a river camp']], cur: [...BARTER, [-300, 'furs', '', 4]] });
  def('cauc', { d: 'agri_mid', pool: 'zagros', nl: [-6000, -6000, -4500],
    n: [[-9000, 'the Caucasus hunters', 'Hunter bands'], [-6000, 'the mountain foragers', 'Forager bands'], [-3000, 'the Shulaveri and Kura-Araxes farmers', 'Farming villages'], [-1500, 'the Bronze Age Colchian and Trialeti peoples', 'Chiefdoms'], [-900, 'the Colchian and Urartian kingdoms', 'Early kingdoms']],
    cap: [[-6000, 'a cave camp'], [-3000, 'a hilltop village'], [-900, 'a fortress']], cur: [...BARTER, [-300, 'silver by weight', 'sh ', 30]] });
  def('anat', { d: 'agri_high', pool: 'catal', nl: [-8500, -8300, -5500], n: [[-8300, 'the Anatolian foragers', 'Forager bands'], [-5700, 'Çatalhöyük and the first towns', 'Proto-towns'], [-3000, 'the Chalcolithic villages of Anatolia', 'Farming villages'], [-1650, 'the Early Bronze Age city-states', 'City-states']], cap: [[-8300, 'Boncuklu'], [-5700, 'Çatalhöyük'], [-3000, 'Hacılar'], [-1650, 'Kanesh']], cur: [...BARTER, [-600, 'silver by weight', 'sh ', 30]] });
  def('lev', { d: 'agri_high', pool: 'natufian', nl: [-9000, -8500, -4500], n: [[-9500, 'the Natufian hamlets', 'Forager hamlets'], [-6400, 'the stone towns of the Jordan valley', 'Farming towns'], [-3000, 'the Chalcolithic Levant', 'Farming villages'], [-1550, 'the Canaanite city-states', 'City-states']], cap: [[-9500, 'Eynan'], [-6400, 'Jericho'], [-3000, 'Teleilat Ghassul'], [-1550, 'Byblos']], cur: [...BARTER, [-600, 'silver by weight', 'sh ', 30]] });
  def('mes', { d: 'agri_high', pool: 'zagros', nl: [-8000, -8000, -5000], n: [[-6500, 'the hill villages above the Two Rivers', 'Farming villages'], [-3800, 'the Samarra, Halaf and Ubaid villages', 'Temple towns'], [-3100, 'Uruk, the first city', 'City-states'], [-2334, 'the Sumerian city-states', 'City-states']], cap: [[-6500, 'Jarmo'], [-3800, 'Eridu'], [-2334, 'Uruk']], cur: [...BARTER, [-2334, 'barley by the gur', 'gur ', 6]] });
  def('irn', { d: 'agri_mid', pool: 'zagros', nl: [-8000, -8500, -5000], n: [[-6000, 'the Zagros foragers and herders', 'Forager and herder bands'], [-4000, 'the Susiana villages', 'Farming villages'], [-2700, 'Proto-Elamite Susa', 'City-state'], [-1000, 'Elam and the highland kingdoms', 'Kingdoms']], cap: [[-6000, 'Ganj Dareh'], [-4000, 'Chogha Mish'], [-1000, 'Susa']], cur: [...BARTER, [-600, 'silver by weight', 'sh ', 30]] });
  def('arab', { d: 'arid', pool: 'natufian', nl: [-6500, -6500, -3500], n: [[-9000, 'the Arabian hunters', 'Hunter bands'], [-6500, 'the foragers and herders of the green Arabia', 'Herder bands'], [-3000, 'the Neolithic oasis peoples', 'Oasis villages'], [-1000, 'the Bronze Age Dilmun and Magan trading lands', 'Trading chiefdoms'], [-300, 'the incense kingdoms and Bedouin tribes', 'Tribes and kingdoms']], cap: [[-6500, 'a rock-shelter camp'], [-3000, 'an oasis village'], [-300, 'an oasis town']], cur: [...BARTER, [-300, 'frankincense and silver', '', 14]] });
  def('cen', { d: 'steppe', pool: 'steppe', nl: [-6000, -5000, -3000], n: [[-9000, 'the Central Asian hunters', 'Hunter bands'], [-6000, 'the Jeitun and Kelteminar foragers', 'Forager bands'], [-2300, 'the Jeitun farmers and steppe herders', 'Farming villages'], [-1500, 'the Oxus civilisation (BMAC)', 'City-states'], [-700, 'the Saka and Sogdian lands', 'Nomad kingdoms']], cap: [[-6000, 'a river camp'], [-2300, 'an oasis village'], [-700, 'a caravan oasis']], cur: [...BARTER, [-300, 'silver by weight', 'sh ', 30]] });
  def('indus', { d: 'agri_high', pool: 'indus', nl: [-7000, -7000, -4000], n: [[-7000, 'the Indus foothill foragers', 'Forager bands'], [-3300, 'Mehrgarh and the Baluchi villages', 'Farming villages'], [-1300, 'the Indus Valley civilisation', 'City-states'], [-600, 'the Vedic tribes', 'Tribal kingdoms']], cap: [[-7000, 'Bhimbetka'], [-3300, 'Mehrgarh'], [-1300, 'Mohenjo-daro'], [-600, 'Hastinapura']], cur: [...BARTER, [-600, 'copper bars', 'cb ', 4]] });
  def('india', { d: 'agri_high', pool: 'indus', nl: [-6000, -6000, -3000], n: [[-7000, 'the forest hunters of the peninsula', 'Forager bands'], [-3000, 'the Neolithic villages', 'Farming villages'], [-1200, 'the megalith builders', 'Chiefdoms'], [-600, 'the Janapadas', 'Tribal kingdoms']], cap: [[-7000, 'a rock shelter'], [-3000, 'a village'], [-1200, 'a megalith town']], cur: [...BARTER, [-600, 'copper bars', 'cb ', 4]] });
  def('chin', { d: 'agri_high', pool: 'yangshao', nl: [-7500, -6000, -3000], n: [[-7000, 'the Yellow River foragers', 'Forager bands'], [-5000, 'the Peiligang and Cishan villages', 'Farming villages'], [-3000, 'the Yangshao culture', 'Farming villages'], [-2070, 'the Longshan towns', 'Chiefdoms'], [-1046, 'the Xia and Shang kingdoms', 'Early kingdom']], cap: [[-7000, 'a river camp'], [-5000, 'Jiahu'], [-3000, 'Banpo'], [-1046, 'Yin']], cur: [...BARTER, [-1046, 'cowrie shells', '', 0.4]] });
  def('kor', { d: 'agri_mid', pool: 'jomon', nl: [-1500, -300, -800], n: [[-6000, 'the Korean hunter-gatherers', 'Forager bands'], [-1500, 'the comb-pattern pottery villages', 'Fishing and farming villages'], [-300, 'the Mumun farmers and dolmen builders', 'Chiefdoms']], cap: [[-6000, 'a shell-midden camp'], [-1500, 'a coastal village'], [-300, 'a dolmen town']], cur: [...BARTER, [-300, 'bronze knives', 'kn ', 2]] });
  def('jpn', { d: 'agri_mid', pool: 'jomon', nl: [-900, -300, -300], n: [[-300, 'the Jōmon islands', 'Hunter-gatherer villages']], cap: [[-300, 'Sannai-Maruyama']], cur: [...BARTER] });
  def('mon', { d: 'steppe', pool: 'steppe', nl: [99999, -3000, -1500], n: [[-9000, 'the Gobi hunters', 'Hunter bands'], [-3000, 'the first herders of the steppe', 'Herding clans'], [-1000, 'the deer-stone herders', 'Pastoral clans'], [-300, 'the Xiongnu and the steppe confederations', 'Nomad confederations']], cap: [[-3000, 'a summer pasture'], [-300, 'a winter camp']], cur: [...BARTER, [-300, 'horses and felt', '', 6]] });
  def('seam', { d: 'agri_mid', pool: 'yangshao', nl: [-3500, -3000, -1500], n: [[-8000, 'the Hoabinhian foragers', 'Forager bands'], [-3500, 'the rice-farming villages', 'Farming villages'], [-1500, 'the Bronze Age Dong Son and Ban Chiang villages', 'Chiefdoms'], [-300, 'the early chiefdoms and river kingdoms', 'Chiefdoms']], cap: [[-8000, 'a cave camp'], [-3500, 'a riverside village'], [-300, 'a moated town']], cur: [...BARTER, [-300, 'cowrie shells', '', 0.4]] });
  def('seai', { d: 'agri_mid', pool: 'jomon', nl: [-3000, -3000, -1000], n: [[-3500, 'the island foragers', 'Forager bands'], [-1500, 'the Austronesian seafarers and farmers', 'Farming villages'], [-300, 'the island chiefdoms', 'Chiefdoms']], cap: [[-3500, 'a coastal camp'], [-1500, 'a harbour village'], [-300, 'a chiefdom seat']], cur: [...BARTER, [-300, 'shell money and gongs', '', 3]] });
  def('nil', { d: 'nile', pool: 'nile_pre', nl: [-5500, -6000, -4000], n: [[-5000, 'the Nile hunter-fishers', 'Forager bands'], [-4400, 'the Faiyum and Merimde villages', 'Farming villages'], [-3100, 'the Badarian and Naqada cultures', 'Chiefdoms'], [-1500, 'the early kingdoms of the Nile', 'Early kingdom']], cap: [[-5000, 'a river camp'], [-3100, 'Nekhen'], [-1500, 'Kerma']], cur: [...BARTER, [-1500, 'deben of copper', 'deben ', 12]] });
  def('mag', { d: 'agri_low', pool: 'ibero', nl: [-5000, -6000, -2000], n: [[-9000, 'the Iberomaurusian hunters', 'Forager bands'], [-5000, 'the Capsian foragers', 'Forager bands'], [-2500, 'the Neolithic herders of the Maghreb', 'Herding clans'], [-1200, 'the Libyan and Berber tribes', 'Tribes']], cap: [[-9000, 'a cave camp'], [-2500, 'a herders’ camp'], [-1200, 'a tribal gathering place']], cur: [...BARTER, [-800, 'silver by weight', 'sh ', 30]] });
  def('sah', { d: 'agri_low', pool: 'westafrica_anc', nl: [-2500, -5500, -1500], n: [[-5000, 'the Green Sahara hunters', 'Forager bands'], [-2500, 'the Saharan cattle herders', 'Herding clans'], [-1000, 'the farmers and herders of the Sahel', 'Villages'], [-300, 'the Iron Age villages of the Sahel', 'Villages and chiefdoms']], cap: [[-5000, 'a lakeshore camp'], [-2500, 'a herders’ camp'], [-300, 'a mound town']], cur: [...BARTER, [-300, 'salt bars', 'bar ', 5]] });
  def('waf', { d: 'agri_low', pool: 'westafrica_anc', nl: [-2500, -5000, -1500], n: [[-5000, 'the forest and savanna hunters', 'Forager bands'], [-2500, 'the yam and oil-palm villages', 'Villages'], [-1500, 'the Kintampo and Iron Age villages', 'Villages and chiefdoms']], cap: [[-5000, 'a forest camp'], [-2500, 'a yam-farming village'], [-1500, 'a village cluster']], cur: [...BARTER, [-500, 'iron hoes and cloth', '', 2]] });
  def('cf', { d: 'agri_low', pool: 'westafrica_anc', nl: [-2500, 99999, -1000], n: [[-5000, 'the rainforest hunters', 'Forager bands'], [-2500, 'the Bantu-speaking farmers', 'Villages'], [-1000, 'the Iron Age villages and early chiefdoms', 'Villages and chiefdoms']], cap: [[-5000, 'a forest camp'], [-2500, 'a clearing village'], [-1000, 'a chief’s village']], cur: [...BARTER, [-500, 'iron hoes and raffia cloth', '', 2]] });
  def('eaf', { d: 'agri_low', pool: 'westafrica_anc', nl: [-3000, -4500, -1000], n: [[-5000, 'the Rift Valley hunters', 'Forager bands'], [-3000, 'the Cushitic and Nilotic herders', 'Herding clans'], [-1000, 'the pastoral and farming peoples of the Rift', 'Clans and chiefdoms']], cap: [[-5000, 'a lakeshore camp'], [-3000, 'a herders’ camp'], [-1000, 'a clan homestead']], cur: [...BARTER, [-500, 'cattle and iron', '', 4]] });
  def('hor', { d: 'agri_mid', pool: 'nile_pre', nl: [-5000, -5500, -1500], n: [[-6000, 'the highland hunters', 'Forager bands'], [-3000, 'the highland herders and farmers', 'Farming villages'], [-1000, 'the kingdoms of Punt and D’mt', 'Early kingdoms']], cap: [[-6000, 'a cave camp'], [-3000, 'a highland village'], [-1000, 'Yeha']], cur: [...BARTER, [-500, 'salt bars and incense', '', 6]] });
  def('saf', { d: 'agri_low', pool: 'westafrica_anc', nl: [200, -300, 400], n: [[-1000, 'the Khoisan hunter-gatherers', 'Forager bands'], [300, 'the herders and early Iron Age farmers', 'Clans and chiefdoms'], [1000, 'the Bantu farming chiefdoms', 'Chiefdoms']], cap: [[-1000, 'a rock-shelter camp'], [300, 'a cattle kraal'], [1000, 'a great enclosure']], cur: [...BARTER, [1000, 'cattle and iron', '', 4]] });
  def('mad', { d: 'island', from: 350, pool: 'jomon', nl: [350, 350, 99999], n: [[700, 'the first Austronesian landings', 'Coastal villages'], [1200, 'the villages and chiefdoms of the highlands', 'Chiefdoms']], cap: [[700, 'a coastal village'], [1200, 'a hill village']], cur: [[1200, 'barter goods', '', 8]] });
  def('ioc', { d: 'island', from: 900, pool: 'jomon', nl: [900, 99999, 99999], n: [[1500, 'the uninhabited islands', 'Empty islands']], cap: [[1500, 'a harbour']], cur: [[1500, 'barter goods', '', 8]] });
  def('nna', { d: 'amer_mid', pool: 'native_na', nl: [-2000, 99999, -4000], n: [[-9000, 'the Paleo-Indian hunting grounds', 'Hunter bands'], [-1000, 'the Archaic woodlands and plains', 'Forager bands'], [1000, 'the Woodland mound builders', 'Chiefdoms'], [1600, 'the Native nations', 'Tribal nations']], cap: [[-9000, 'a hunting camp'], [-1000, 'a seasonal camp'], [1000, 'a mound town'], [1600, 'a council fire']], cur: [[1600, 'wampum and trade goods', '', 5]], gt: [[1607, 'NATIVE']] });
  def('mes_am', { d: 'amer_high', pool: 'native_na', nl: [-5000, 99999, 600], n: [[-7000, 'the Archaic foragers of the highlands', 'Forager bands'], [-2500, 'the first maize farmers', 'Villages'], [-1500, 'the Early Formative villages', 'Villages'], [-400, 'the Olmec and early Maya lands', 'Chiefdoms']], cap: [[-7000, 'a cave camp'], [-2500, 'a maize village'], [-1500, 'a chiefly village'], [-400, 'a ceremonial centre']], cur: [[-1500, 'barter goods', '', 8], [1500, 'cacao beans', '', 0.2]], gt: [[1520, 'NATIVE']] });
  def('car', { d: 'island', from: -4000, pool: 'native_na', nl: [-500, 99999, 99999], n: [[-500, 'the Archaic island foragers', 'Forager bands'], [1500, 'the Taíno and Carib chiefdoms', 'Chiefdoms']], cap: [[-500, 'a shell-midden camp'], [1500, 'a chiefly village']], cur: [[1500, 'barter goods', '', 8]], gt: [[1520, 'NATIVE']] });
  def('and', { d: 'amer_high', pool: 'andean_pre', nl: [-3000, -3500, -2000], n: [[-9000, 'the Andean hunters', 'Hunter bands'], [-3000, 'the coastal fisher-farmers', 'Villages'], [-900, 'the Caral and Chavín cultures', 'Temple towns'], [-200, 'the Chavín and Paracas peoples', 'Chiefdoms'], [700, 'the Nazca, Moche and Tiwanaku states', 'Early states']], cap: [[-9000, 'a cave camp'], [-3000, 'a coastal village'], [-900, 'Caral'], [700, 'a temple town']], cur: [[1438, 'barter goods', '', 8]], gt: [[1530, 'NATIVE']] });
  def('ama', { d: 'amer_low', pool: 'andean_pre', nl: [-2000, 99999, 99999], n: [[-9000, 'the rainforest hunters', 'Forager bands'], [-2000, 'the river and forest farmers', 'Villages'], [1500, 'the chiefdoms of the Amazon', 'Chiefdoms']], cap: [[-9000, 'a river camp'], [-2000, 'a forest village'], [1500, 'a riverine town']], cur: [[1500, 'barter goods', '', 8]], gt: [[1530, 'NATIVE']] });
  def('con', { d: 'amer_low', pool: 'andean_pre', nl: [-500, 99999, 99999], n: [[-9000, 'the Patagonian and pampas hunters', 'Hunter bands'], [1000, 'the hunter-gatherers and early farmers of the south', 'Forager bands'], [1500, 'the Mapuche, Guaraní and pampas peoples', 'Tribal nations']], cap: [[-9000, 'a guanaco-hunting camp'], [1000, 'a seasonal camp'], [1500, 'a council fire']], cur: [[1500, 'barter goods', '', 8]], gt: [[1530, 'NATIVE']] });
  def('aus', { d: 'amer_low', pool: 'native_na', nl: [99999, 99999, 99999], n: [[1787, 'the Aboriginal nations', 'Clan nations']], cap: [[1787, 'a seasonal gathering place']], cur: [[1787, 'barter goods', '', 8]], gt: [[1788, 'NATIVE']] });
  def('nz', { d: 'island', from: 1250, pool: 'jomon', nl: [1250, 99999, 99999], n: [[1769, 'the Māori iwi of Aotearoa', 'Tribes']], cap: [[1769, 'a fortified pā']], cur: [[1769, 'greenstone and barter', '', 8]] });
  def('mel', { d: 'island', from: -8000, pool: 'jomon', nl: [-5000, 99999, 99999], n: [[-1500, 'the Papuan hunters and gardeners', 'Forager bands'], [1500, 'the Lapita and Melanesian chiefdoms', 'Chiefdoms'], [1800, 'the island clans', 'Clans']], cap: [[-1500, 'a coastal camp'], [1500, 'a village'], [1800, 'a men’s house']], cur: [[1800, 'shell money and pigs', '', 3]] });
  def('pol', { d: 'island', from: -900, pool: 'jomon', nl: [-900, 99999, 99999], n: [[-300, 'the first Polynesian settlers', 'Island villages'], [1700, 'the Polynesian chiefdoms', 'Chiefdoms']], cap: [[-300, 'a canoe landing'], [1700, 'a chiefly marae']], cur: [[1800, 'barter goods', '', 8]] });
  def('mic', { d: 'island', from: -1500, pool: 'jomon', nl: [-1500, 99999, 99999], n: [[-300, 'the first Micronesian navigators', 'Island villages'], [1700, 'the Micronesian chiefdoms', 'Chiefdoms']], cap: [[-300, 'a canoe landing'], [1700, 'a clan house']], cur: [[1800, 'stone money and shell', '', 6]] });
})();

/* ---------- premodern money by world area (used where a country record has none) ----------
   [until, name, symbol, value in the game's units]; after 1800 country records give their own */
Object.assign(DATA.atlas.curA, {
  eu: [[-500, 'silver by weight', 'sh ', 30], [476, 'denarii', 'd', 20], [1300, 'silver pennies', 'd', 2], [1500, 'groschen', 'gr ', 12], [1800, 'thalers', 'th ', 100]],
  isl: [[-500, 'silver by weight', 'sh ', 30], [700, 'drachms', 'dr', 20], [1500, 'dinars', 'din ', 400], [1800, 'piastres', 'pt', 1.5]],
  eas: [[-221, 'spade coins', 'bu ', 2], [618, 'wuzhu coins', 'zhu ', 0.4], [1368, 'strings of cash', 'guan ', 40], [1800, 'taels of silver', 'tael ', 120]],
  sas: [[-600, 'copper bars', 'cb ', 4], [-322, 'karshapanas', 'kp ', 15], [1206, 'dinaras', 'din ', 60], [1540, 'tankas', 'tk ', 100], [1800, 'rupees', 'Rs', 60]],
  sea: [[-300, 'cowrie shells', '', 0.4], [900, 'silver ingots', 'ing ', 12], [1500, 'tin and silver tokens', 'tk ', 3], [1800, 'silver ticals', 'tl ', 30]],
  saf: [[1500, 'iron hoes and cattle', '', 4], [1800, 'cowrie shells and trade goods', '', 0.03]],
  waf: [[1899, 'cowrie shells', '', 0.03]],
  ame: [[1521, 'cacao beans', '', 0.2], [1821, 'reales', 'rs ', 12]],
  amc: [[1500, 'barter goods', '', 8], [1821, 'reales', 'rs ', 12]],
  pac: [[1800, 'barter goods', '', 8]],
});

/* ---------- culture archetypes ----------
   Seven dimensions from 0 to 100:
   I individualism, H hierarchy (respect for rank), T tradition, F family obligation, O openness to outsiders and change,
   R religiosity of daily life, G equality of the sexes (in the modern age; earlier ages scale this down).
   arr: share of marriages arranged by families before the modern age. dow: what changes hands at a wedding.
   fam: household shape. */
Object.assign(DATA.atlas.cult, {
  anglo: { I: 80, H: 35, T: 40, F: 40, O: 70, R: 35, G: 82, arr: 0.55, dow: 'dowry', fam: 'nuclear' },
  nordic: { I: 75, H: 20, T: 30, F: 35, O: 80, R: 20, G: 92, arr: 0.4, dow: 'dowry', fam: 'nuclear' },
  germanic: { I: 70, H: 45, T: 45, F: 45, O: 65, R: 30, G: 80, arr: 0.55, dow: 'dowry', fam: 'nuclear' },
  latin: { I: 55, H: 50, T: 55, F: 65, O: 65, R: 40, G: 78, arr: 0.7, dow: 'dowry', fam: 'stem' },
  slavic: { I: 50, H: 60, T: 55, F: 65, O: 50, R: 40, G: 70, arr: 0.75, dow: 'dowry', fam: 'extended' },
  baltic: { I: 55, H: 50, T: 45, F: 55, O: 60, R: 30, G: 78, arr: 0.65, dow: 'dowry', fam: 'nuclear' },
  balkan: { I: 40, H: 65, T: 65, F: 75, O: 50, R: 55, G: 65, arr: 0.8, dow: 'dowry', fam: 'extended' },
  hellenic: { I: 40, H: 60, T: 65, F: 80, O: 55, R: 55, G: 70, arr: 0.8, dow: 'dowry', fam: 'extended' },
  caucasus: { I: 35, H: 65, T: 70, F: 85, O: 45, R: 60, G: 55, arr: 0.85, dow: 'bride', fam: 'extended' },
  levant: { I: 35, H: 70, T: 70, F: 85, O: 50, R: 70, G: 45, arr: 0.85, dow: 'bride', fam: 'extended' },
  arabian: { I: 25, H: 80, T: 85, F: 90, O: 35, R: 85, G: 35, arr: 0.9, dow: 'bride', fam: 'clan' },
  maghreb: { I: 35, H: 70, T: 75, F: 85, O: 50, R: 78, G: 45, arr: 0.88, dow: 'bride', fam: 'extended' },
  nilotic: { I: 30, H: 75, T: 75, F: 88, O: 40, R: 80, G: 40, arr: 0.9, dow: 'bride', fam: 'extended' },
  persian: { I: 35, H: 70, T: 70, F: 80, O: 45, R: 65, G: 45, arr: 0.85, dow: 'bride', fam: 'extended' },
  turkic: { I: 35, H: 70, T: 65, F: 80, O: 55, R: 55, G: 55, arr: 0.8, dow: 'bride', fam: 'extended' },
  steppe: { I: 35, H: 55, T: 65, F: 80, O: 55, R: 50, G: 60, arr: 0.8, dow: 'bride', fam: 'clan' },
  indic: { I: 35, H: 80, T: 80, F: 90, O: 45, R: 80, G: 40, arr: 0.95, dow: 'dowry', fam: 'joint' },
  islamic_sa: { I: 25, H: 80, T: 85, F: 92, O: 35, R: 88, G: 30, arr: 0.95, dow: 'bride', fam: 'joint' },
  himalayan: { I: 35, H: 65, T: 85, F: 80, O: 40, R: 85, G: 55, arr: 0.8, dow: 'none', fam: 'extended' },
  sinic: { I: 30, H: 80, T: 75, F: 85, O: 50, R: 30, G: 60, arr: 0.95, dow: 'bride', fam: 'extended' },
  japonic: { I: 45, H: 75, T: 70, F: 70, O: 45, R: 30, G: 55, arr: 0.9, dow: 'dowry', fam: 'stem' },
  korean: { I: 35, H: 85, T: 65, F: 75, O: 45, R: 40, G: 50, arr: 0.95, dow: 'dowry', fam: 'stem' },
  seamain: { I: 30, H: 70, T: 70, F: 85, O: 55, R: 70, G: 60, arr: 0.8, dow: 'bride', fam: 'extended' },
  seaisl: { I: 30, H: 70, T: 70, F: 85, O: 55, R: 70, G: 55, arr: 0.8, dow: 'bride', fam: 'extended' },
  sahel: { I: 25, H: 75, T: 80, F: 90, O: 40, R: 85, G: 35, arr: 0.9, dow: 'bride', fam: 'clan' },
  wafrica: { I: 30, H: 70, T: 75, F: 90, O: 55, R: 80, G: 45, arr: 0.85, dow: 'bride', fam: 'clan' },
  bantu: { I: 28, H: 65, T: 75, F: 92, O: 55, R: 78, G: 50, arr: 0.85, dow: 'bride', fam: 'clan' },
  eafrica: { I: 30, H: 70, T: 75, F: 90, O: 50, R: 80, G: 48, arr: 0.85, dow: 'bride', fam: 'clan' },
  horn: { I: 28, H: 75, T: 80, F: 88, O: 40, R: 88, G: 35, arr: 0.9, dow: 'bride', fam: 'clan' },
  safrica: { I: 40, H: 60, T: 65, F: 80, O: 60, R: 65, G: 65, arr: 0.8, dow: 'bride', fam: 'extended' },
  creole: { I: 50, H: 55, T: 55, F: 75, O: 70, R: 70, G: 62, arr: 0.55, dow: 'none', fam: 'matrifocal' },
  latam: { I: 45, H: 60, T: 60, F: 80, O: 65, R: 60, G: 62, arr: 0.65, dow: 'dowry', fam: 'extended' },
  andean: { I: 35, H: 65, T: 70, F: 85, O: 55, R: 65, G: 55, arr: 0.7, dow: 'none', fam: 'extended' },
  settler: { I: 85, H: 30, T: 35, F: 40, O: 80, R: 30, G: 85, arr: 0.5, dow: 'none', fam: 'nuclear' },
  polynesian: { I: 30, H: 70, T: 80, F: 90, O: 60, R: 80, G: 55, arr: 0.7, dow: 'mutual', fam: 'extended' },
  melanesian: { I: 25, H: 55, T: 80, F: 90, O: 45, R: 75, G: 40, arr: 0.8, dow: 'bride', fam: 'clan' },
  firstnations: { I: 40, H: 35, T: 80, F: 85, O: 50, R: 70, G: 60, arr: 0.6, dow: 'mutual', fam: 'extended' },
});

/* ---------- gene archetypes: a blend of known pools plus tweaks ----------
   [{ landId: weight, ... }, { overrides }]  (ids refer to lands that carry their own gen) */
Object.assign(DATA.atlas.ga, {
  nweur: [{ ENG: 1 }, {}], weur: [{ FRA: 1 }, {}], ceur: [{ FRA: 0.5, RUS: 0.5 }, { sk: 0.12, eb: 0.62, lac: 0.8 }], seur: [{ ITA: 1 }, {}], iber: [{ ITA: 0.5, FRA: 0.5 }, { hd: 0.72, eb: 0.28, lac: 0.4 }],
  balk: [{ GRC: 0.5, RUS: 0.5 }, { hd: 0.6, eb: 0.45 }], greek: [{ GRC: 1 }, {}], nord: [{ SCA: 1 }, {}], baltic: [{ SCA: 0.6, RUS: 0.4 }, { eb: 0.85, rd: 0.1 }], slav: [{ RUS: 1 }, {}],
  cauc: [{ IRN: 0.5, ANA: 0.5 }, { sk: 0.32, eb: 0.1 }], levant: [{ LEV: 1 }, {}], arab: [{ LEV: 0.6, EGY: 0.4 }, { sk: 0.45, eb: 0.04, ht: [170, 158] }], mesop: [{ MSP: 1 }, {}], egypt: [{ EGY: 1 }, {}], berber: [{ MAG: 1 }, {}],
  persian: [{ IRN: 1 }, {}], turk: [{ ANA: 1 }, {}], turkic: [{ IRN: 0.4, CHN: 0.3, RUS: 0.3 }, { sk: 0.3, hd: 0.9, eb: 0.1, lac: 0.35, ht: [173, 161] }],
  mongol: [{ CHN: 0.8, RUS: 0.2 }, { sk: 0.28, eb: 0.01, lac: 0.15, ht: [170, 158] }], afghan: [{ IRN: 0.6, IND: 0.4 }, { sk: 0.4, lac: 0.4 }],
  indn: [{ IND: 1 }, {}], inds: [{ IND: 1 }, { sk: 0.72, eb: 0.02, eg: 0.02, lac: 0.25, ht: [165, 153] }], bengal: [{ IND: 0.6, CHN: 0.4 }, { sk: 0.55, lac: 0.35, ht: [164, 152] }], himal: [{ IND: 0.4, CHN: 0.6 }, { sk: 0.4, ht: [166, 154] }],
  han: [{ CHN: 1 }, {}], korean: [{ CHN: 0.5, JPN: 0.5 }, { ht: [174, 161] }], japan: [{ JPN: 1 }, {}],
  seam: [{ CHN: 1 }, { sk: 0.5, eb: 0, hd: 0.97, cu: 0.1, lac: 0.04, ht: [165, 154], nose: 'button broad flat' }],
  seai: [{ CHN: 0.7, AND: 0.3 }, { sk: 0.6, cu: 0.2, lac: 0.04, ht: [163, 152], nose: 'button broad flat' }],
  waf: [{ WAF: 1 }, {}], cafr: [{ WAF: 1 }, { sk: 0.93, sc: 0.09, ht: [168, 158] }], eafr: [{ WAF: 0.7, EGY: 0.3 }, { sk: 0.82, cu: 0.8, sc: 0.04, lac: 0.35, ht: [172, 161] }], horn: [{ WAF: 0.4, EGY: 0.6 }, { sk: 0.68, cu: 0.6, sc: 0.02, lac: 0.3, ht: [170, 158] }],
  safr: [{ WAF: 1 }, { sk: 0.86, sc: 0.04, lac: 0.18, ht: [170, 159] }], malag: [{ WAF: 0.5, CHN: 0.5 }, { sk: 0.65, cu: 0.6, sc: 0.04, ht: [165, 155] }], sahel: [{ WAF: 0.8, MAG: 0.2 }, { sk: 0.8, cu: 0.8 }],
  amer: [{ MEX: 1 }, {}], andes: [{ AND: 1 }, {}], carib: [{ WAF: 0.5, ENG: 0.2, ITA: 0.15, MEX: 0.15 }, {}], latam: [{ MEX: 0.5, ITA: 0.4, WAF: 0.1 }, {}], southcone: [{ ITA: 0.6, MEX: 0.3, ENG: 0.1 }, { ht: [175, 162] }],
  pol: [{ CHN: 0.4, MEX: 0.6 }, { sk: 0.55, hd: 0.97, cu: 0.3, lac: 0.05, ht: [175, 164], nose: 'broad straight' }], mel: [{ WAF: 0.6, CHN: 0.4 }, { sk: 0.82, cu: 0.9, lac: 0.04, ht: [164, 153], nose: 'broad flat' }],
  mic: [{ CHN: 0.6, MEX: 0.4 }, { sk: 0.5, cu: 0.2, ht: [167, 156] }], abor: [{ WAF: 0.6, IND: 0.4 }, { sk: 0.85, hd: 0.8, cu: 0.6, lac: 0.04, ht: [170, 158], nose: 'broad' }],
  settler: [{ ENG: 0.6, FRA: 0.2, ITA: 0.2 }, {}], world: [{ CHN: 0.2, IND: 0.2, WAF: 0.12, ENG: 0.1, RUS: 0.08, MEX: 0.1, EGY: 0.05, IRN: 0.05, JPN: 0.05, ITA: 0.05 }, {}],
});

/* ---------- polities: the empires and crowns whose banners cover several countries, as [name, colour, adjective] ---------- */
Object.assign(DATA.atlas.polities, {
  roman: ['the Roman Empire', '#b0413e', 'Roman'], byz: ['the Byzantine Empire', '#7b3f9e', 'Byzantine'], ach: ['the Achaemenid Empire', '#c9953a', 'Persian'], hell: ['the Hellenistic kingdoms', '#4e9a9a', 'Hellenistic'],
  parth: ['the Parthian Empire', '#a8884a', 'Parthian'], sas: ['the Sasanian Empire', '#a8603a', 'Sasanian'], umay: ['the Umayyad Caliphate', '#3f8f5b', 'Umayyad'], abba: ['the Abbasid Caliphate', '#2f7d6d', 'Abbasid'],
  fatim: ['the Fatimid Caliphate', '#5aa36a', 'Fatimid'], seljuk: ['the Seljuk Empire', '#6a9c3a', 'Seljuk'], mongol: ['the Mongol Empire', '#6b6b6b', 'Mongol'], ilkh: ['the Ilkhanate', '#8a8a5a', 'Ilkhanid'],
  timur: ['the Timurid Empire', '#7a5a8a', 'Timurid'], ottoman: ['the Ottoman Empire', '#3a8a4a', 'Ottoman'], safav: ['the Safavid Empire', '#2f9aa8', 'Safavid'], mughal: ['the Mughal Empire', '#b5832a', 'Mughal'],
  maurya: ['the Maurya Empire', '#c8a03a', 'Mauryan'], gupta: ['the Gupta Empire', '#d4b050', 'Gupta'], delhi: ['the Delhi Sultanate', '#a98a3a', 'Sultanate'], han: ['the Han Empire', '#c9453a', 'Han'],
  tang: ['the Tang Empire', '#d0603a', 'Tang'], yuan: ['the Yuan dynasty', '#7a7a7a', 'Yuan'], ming: ['the Ming Empire', '#d0393a', 'Ming'], qing: ['the Qing Empire', '#d9a43a', 'Qing'],
  khmer: ['the Khmer Empire', '#8a6a3a', 'Khmer'], srivi: ['the Srivijaya thalassocracy', '#3a7a9a', 'Srivijayan'], malisel: ['the Mali Empire', '#c9a83a', 'Malian'], songh: ['the Songhai Empire', '#b88a3a', 'Songhai'],
  ghana: ['the Ghana Empire', '#d6b04a', 'Ghanaian'], kanem: ['the Kanem-Bornu Empire', '#9a7a3a', 'Kanem-Bornu'], aksum: ['the Aksumite and Ethiopian Empire', '#7a9a3a', 'Ethiopian'], kongo: ['the Kingdom of Kongo', '#6a8a5a', 'Kongolese'],
  inca: ['the Inca Empire', '#c9602a', 'Inca'], aztec: ['the Aztec Triple Alliance', '#3a8a8a', 'Aztec'], maya: ['the Maya city-states', '#5a9a5a', 'Maya'], carth: ['the Carthaginian Empire', '#8a3a7a', 'Carthaginian'],
  frank: ['the Frankish and Carolingian Empire', '#3a5aa8', 'Frankish'], hre: ['the Holy Roman Empire', '#8a8a3a', 'Imperial'], habs: ['the Habsburg domains', '#e0c24a', 'Habsburg'], austhun: ['Austria-Hungary', '#e0c24a', 'Austro-Hungarian'],
  viking: ['the Viking and Danish realms', '#3a6a9a', 'Norse'], polish: ['the Polish–Lithuanian Commonwealth', '#c94a5a', 'Polish-Lithuanian'], rusemp: ['the Russian Empire', '#4a7a4a', 'Russian'], soviet: ['the Soviet Union', '#b03030', 'Soviet'],
  swedemp: ['the Swedish Empire', '#3a7ac0', 'Swedish'], dan: ['the Danish realm', '#c0504a', 'Danish'], british: ['the British Empire', '#d97a8a', 'British'], french: ['the French colonial empire', '#4a6ac0', 'French'],
  span: ['the Spanish Empire', '#d9a03a', 'Spanish'], port: ['the Portuguese Empire', '#3a9a6a', 'Portuguese'], dutch: ['the Dutch Empire', '#e0804a', 'Dutch'], belg: ['Belgian rule', '#a8a83a', 'Belgian'],
  german: ['the German Empire', '#6a6a8a', 'German'], ital: ['the Italian Empire', '#4aa86a', 'Italian'], jpn: ['the Japanese Empire', '#d94a6a', 'Japanese'], usa: ['American rule', '#4a8ae0', 'American'],
  macedon: ['Macedon and the Diadochi', '#5a7ab0', 'Macedonian'], venice: ['the Venetian Republic', '#7a5ab0', 'Venetian'], genoa: ['the Genoese Republic', '#8a9a5a', 'Genoese'], zulu: ['the Zulu Kingdom', '#9a5a3a', 'Zulu'],
  oyo: ['the Oyo Empire', '#c0903a', 'Oyo'], ashanti: ['the Ashanti Empire', '#d0a03a', 'Ashanti'], sokoto: ['the Sokoto Caliphate', '#8aa03a', 'Sokoto'], buganda: ['the Interlacustrine kingdoms', '#6aa05a', 'Great Lakes'],
  zimb: ['the Great Zimbabwe and Mutapa', '#a07a3a', 'Zimbabwean'], oman: ['the Omani Sultanate', '#3a9a8a', 'Omani'], almor: ['the Almoravid and Almohad Caliphates', '#5a8a3a', 'Berber'], moroc: ['the Moroccan sultanate', '#b04a3a', 'Moroccan'],
  tibet: ['the Tibetan Empire', '#a04a8a', 'Tibetan'], bur: ['the Burmese kingdoms', '#c07a3a', 'Burmese'], siam: ['the Kingdom of Siam', '#c0a03a', 'Siamese'], viet: ['Đại Việt', '#3a8a5a', 'Vietnamese'], maj: ['Majapahit', '#8a5a3a', 'Majapahit'],
  kushan: ['the Kushan Empire', '#b0903a', 'Kushan'], ghazni: ['the Ghaznavid and Ghurid empires', '#4a9a5a', 'Ghaznavid'], pala: ['the Pala Empire', '#c0a05a', 'Pala'], chola: ['the Chola Empire', '#c06a3a', 'Chola'],
  xiongnu: ['the Xiongnu confederation', '#8a6a4a', 'Xiongnu'],
  teut: ['the Teutonic Order and Livonia', '#7a7a8a', 'Teutonic'], lith: ['the Grand Duchy of Lithuania', '#a05a5a', 'Lithuanian'], bulg: ['the Bulgarian Empires', '#5a9a3a', 'Bulgarian'], serb: ['the Serbian Empire', '#5a5aa0', 'Serbian'], hung: ['the Kingdom of Hungary', '#a05a7a', 'Hungarian'],
  golden: ['the Golden Horde', '#8a8a6a', 'Golden Horde'], kievan: ['Kievan Rus', '#6a9a6a', 'Rus'], goth: ['the Gothic and Germanic kingdoms', '#7a7a9a', 'Gothic'], umaya: ['the Emirate of Córdoba', '#4a9a5a', 'Andalusi'],
});

/* ---------- blocs and unions: [name, short, from, to, colour] ---------- */
Object.assign(DATA.atlas.blocs, {
  nato: ['NATO', 'NATO', 1949, 99999, '#3a6ac0'], warsaw: ['Warsaw Pact', 'WP', 1955, 1991, '#c03a3a'], eu: ['European Union', 'EU', 1958, 99999, '#3a4aa8'], nam: ['Non-Aligned Movement', 'NAM', 1961, 99999, '#7a7a7a'],
  arab: ['Arab League', 'AL', 1945, 99999, '#3a9a5a'], au: ['African Union', 'AU', 1963, 99999, '#c0903a'], asean: ['ASEAN', 'ASEAN', 1967, 99999, '#3a9aa8'], brics: ['BRICS', 'BRICS', 2009, 99999, '#c0603a'],
  cis: ['Commonwealth of Independent States', 'CIS', 1991, 99999, '#8a6a9a'], commonw: ['Commonwealth of Nations', 'CW', 1931, 99999, '#d97a8a'], oas: ['Organization of American States', 'OAS', 1948, 99999, '#4a8ae0'], opec: ['OPEC', 'OPEC', 1960, 99999, '#2a2a2a'],
  gcc: ['Gulf Cooperation Council', 'GCC', 1981, 99999, '#a0803a'], sco: ['Shanghai Cooperation Organisation', 'SCO', 2001, 99999, '#c04a6a'], francophonie: ['La Francophonie', 'OIF', 1970, 99999, '#4a6ac0'], mercosur: ['Mercosur', 'MCS', 1991, 99999, '#5aa05a'],
  quad: ['Western powers (the Allies)', 'Allies', 1914, 1945, '#3a6ac0'], axis: ['The Axis', 'Axis', 1936, 1945, '#8a3a3a'], entente: ['Triple Entente', 'Entente', 1907, 1918, '#3a6ac0'], central: ['Central Powers', 'Central', 1914, 1918, '#8a3a3a'],
});

// country records are queued here and built into lands by atlas.js
const Land = text => DATA.atlas.raw.push(text);
