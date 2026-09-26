/* =====================================================================
   COUNTRIES, part 1 — identity over time.
   Timelines are [untilYear, ...] lists: the first entry whose year is
   >= the current year applies; past the last entry the era default does.
     names  [until, name, government]      pools [until, namePoolId]
     cur    [until, currency, symbol, rate] (rate = value units per coin)
     cap    [until, capital]               pop   [year, millions] (interpolated)
     gen    founding genetics: allele frequencies and adult heights
     cls    [from, to, 7 class names, lowest to highest] (overrides era ladder)
     laws   [from, to, text, flags] flags: divorce, sameSex, kids, noEmigrate, noDraft, alcohol
   ===================================================================== */

DATA.countries = [
  { id: 'ENG', short: 'Britain', adj: 'British', region: 'europe', from: -3000, dairy: 1,
    names: [[-44, 'the British Isles', 'Celtic tribes'], [409, 'Roman Britain', 'Roman province'], [926, 'the Anglo-Saxon kingdoms', 'Petty kingdoms'], [1706, 'the Kingdom of England', 'Monarchy'], [1800, 'the Kingdom of Great Britain', 'Constitutional monarchy'], [99999, 'the United Kingdom', 'Constitutional monarchy']],
    pools: [[43, 'celt'], [1065, 'anglo'], [1449, 'medieval'], [1799, 'colonial'], [1913, 'industrial'], [1945, 'wars'], [1999, 'modern'], [2029, 'digital']],
    cur: [[43, 'staters', 'st', 25], [409, 'denarii', 'd', 20], [1065, 'silver pennies', 'd', 2], [1449, 'shillings', 's', 40], [1913, 'pounds', '£', 150], [1945, 'pounds', '£', 75], [1970, 'pounds', '£', 25], [1999, 'pounds', '£', 12], [2029, 'pounds', '£', 1.3]],
    cap: [[42, 'Camulodunon'], [409, 'Londinium'], [886, 'Winchester'], [99999, 'London']],
    pop: [[-3000, 0.1], [1, 1], [1000, 2], [1300, 5], [1400, 2.5], [1600, 4.5], [1800, 10], [1900, 38], [1950, 50], [2000, 59], [2025, 68], [2400, 70]],
    gen: { sk: 0.1, hd: 0.45, rd: 0.35, eb: 0.8, eg: 0.25, cu: 0.15, lac: 0.9, sc: 0.003, cf: 0.025, cb: 0.08, ht: [178, 164], nose: 'straight aquiline snub button', bl: [0.28, 0.06], rh: 0.4 },
    laws: [[1215, 99999, 'Magna Carta: even the Crown answers to the law'], [1534, 99999, 'The Church of England breaks with Rome'], [1857, 99999, 'Divorce through the civil courts', { divorce: true }], [1916, 1918, 'Conscription for the Great War'], [1928, 99999, 'Women vote on equal terms with men'], [1967, 99999, 'Homosexuality decriminalised'], [2014, 99999, 'Same-sex marriage is legal', { sameSex: true }]] },

  { id: 'FRA', short: 'France', adj: 'French', region: 'europe', from: -3000, dairy: 1,
    names: [[-51, 'Gaul', 'Celtic tribes'], [476, 'Roman Gaul', 'Roman province'], [843, 'the Frankish Kingdom', 'Monarchy'], [1791, 'the Kingdom of France', 'Absolute monarchy'], [1804, 'the French Republic', 'Revolutionary republic'], [1870, 'the French Empire', 'Empire'], [99999, 'the French Republic', 'Republic']],
    pools: [[476, 'celt'], [2029, 'french']],
    cur: [[-51, 'staters', 'st', 25], [476, 'denarii', 'd', 20], [1360, 'deniers', 'd.', 1.5], [1794, 'livres', '₶', 8], [1913, 'francs', 'F', 6], [2001, 'francs', 'F', 1], [2029, 'euros', '€', 1.1]],
    cap: [[476, 'Lugdunum'], [987, 'Aachen'], [99999, 'Paris']],
    pop: [[-3000, 0.5], [1, 6], [1000, 9], [1300, 17], [1400, 11], [1600, 19], [1800, 29], [1900, 39], [1950, 42], [2000, 60], [2025, 68], [2400, 65]],
    gen: { sk: 0.16, hd: 0.55, rd: 0.15, eb: 0.62, eg: 0.25, cu: 0.2, lac: 0.75, sc: 0.005, cf: 0.025, cb: 0.08, ht: [176, 163], nose: 'straight aquiline roman button', bl: [0.3, 0.06], rh: 0.4 },
    laws: [[1789, 99999, 'The Declaration of the Rights of Man and of the Citizen'], [1792, 1815, 'Divorce legalised by the Revolution', { divorce: true }], [1816, 1883, 'Divorce abolished again', { divorce: false }], [1884, 99999, 'Divorce restored', { divorce: true }], [1905, 99999, 'Church and state separated'], [1944, 99999, 'Women win the vote'], [2013, 99999, 'Marriage for all', { sameSex: true }]] },

  { id: 'ITA', short: 'Italy', adj: 'Italian', region: 'europe', from: -753,
    names: [[-509, 'the Kingdom of Rome', 'Monarchy'], [-27, 'the Roman Republic', 'Republic'], [476, 'the Roman Empire', 'Empire'], [1860, 'the Italian states', 'City-states and kingdoms'], [1946, 'the Kingdom of Italy', 'Monarchy'], [99999, 'the Italian Republic', 'Republic']],
    pools: [[476, 'ancient'], [1799, 'renaissance'], [2029, 'italian']],
    cur: [[476, 'denarii', 'd', 20], [1252, 'soldi', 's', 15], [1860, 'florins', 'ƒ', 100], [1913, 'lire', '₤', 6], [1945, 'lire', '₤', 0.8], [2001, 'lire', '₤', 0.004], [2029, 'euros', '€', 1.1]],
    cap: [[330, 'Rome'], [1860, 'Florence'], [1870, 'Turin'], [99999, 'Rome']],
    pop: [[-753, 0.5], [1, 7], [1000, 5], [1300, 11], [1600, 13], [1800, 18], [1900, 33], [1950, 47], [2000, 57], [2025, 59], [2400, 45]],
    gen: { sk: 0.24, hd: 0.7, rd: 0.08, eb: 0.38, eg: 0.2, cu: 0.3, lac: 0.45, sc: 0.01, cf: 0.02, cb: 0.07, ht: [175, 162], nose: 'roman aquiline straight', bl: [0.27, 0.07], rh: 0.38 },
    laws: [[-449, 476, 'The Twelve Tables: law written for all to see'], [1861, 1969, 'No divorce under Italian law', { divorce: false }], [1946, 99999, 'Women vote for the first time'], [1970, 99999, 'Divorce legalised', { divorce: true }], [2016, 99999, 'Civil unions for same-sex couples', { sameSex: true }]] },

  { id: 'GRC', short: 'Greece', adj: 'Greek', region: 'europe', from: -3000,
    names: [[-146, 'the Greek city-states', 'City-states'], [329, 'Roman Greece', 'Roman province'], [1453, 'the Byzantine Empire', 'Empire'], [1829, 'Ottoman Greece', 'Ottoman province'], [1973, 'the Kingdom of Greece', 'Monarchy'], [99999, 'the Hellenic Republic', 'Republic']],
    pools: [[329, 'greek'], [1829, 'byzantine'], [2029, 'greek_mod']],
    cur: [[-146, 'drachmae', 'dr', 20], [330, 'denarii', 'd', 20], [1453, 'nomismata', 'nom', 400], [1829, 'akçe', 'ak', 0.8], [1913, 'drachmae', '₯', 6], [2001, 'drachmae', '₯', 0.2], [2029, 'euros', '€', 1.1]],
    cap: [[-146, 'Athens'], [329, 'Corinth'], [1453, 'Constantinople'], [1829, 'Constantinople'], [99999, 'Athens']],
    pop: [[-3000, 0.3], [-400, 3], [1, 2], [1000, 2], [1800, 1.5], [1900, 2.6], [1950, 7.5], [2000, 11], [2025, 10.3], [2400, 8]],
    gen: { sk: 0.27, hd: 0.75, rd: 0.05, eb: 0.3, eg: 0.15, cu: 0.35, lac: 0.3, sc: 0.03, cf: 0.02, cb: 0.07, ht: [177, 165], nose: 'straight roman aquiline', bl: [0.28, 0.08], rh: 0.35 },
    laws: [[-508, -322, 'Athenian democracy: citizens vote in the assembly'], [1952, 99999, 'Women win the vote'], [1983, 99999, 'Civil marriage and divorce reformed', { divorce: true }], [2024, 99999, 'Same-sex marriage is legal', { sameSex: true }]] },

  { id: 'EGY', short: 'Egypt', adj: 'Egyptian', region: 'africa', from: -3000, malaria: 1,
    names: [[-332, 'the Kingdom of Egypt', 'Pharaonic monarchy'], [-30, 'Ptolemaic Egypt', 'Hellenistic monarchy'], [640, 'Roman Egypt', 'Roman province'], [1517, 'the Caliphate of Egypt', 'Caliphate and sultanate'], [1867, 'Ottoman Egypt', 'Ottoman province'], [1952, 'the Kingdom of Egypt', 'Monarchy'], [99999, 'the Arab Republic of Egypt', 'Republic']],
    pools: [[639, 'egypt_anc'], [2029, 'arabic']],
    cur: [[-332, 'deben of copper', 'deben ', 12], [-30, 'drachmae', 'dr', 20], [640, 'solidi', 'sol', 400], [1517, 'dinars', 'din', 400], [1834, 'piastres', 'pt', 1.5], [1913, 'Egyptian pounds', 'E£', 150], [1945, 'Egyptian pounds', 'E£', 75], [1999, 'Egyptian pounds', 'E£', 6], [2029, 'Egyptian pounds', 'E£', 0.12]],
    cap: [[-2000, 'Memphis'], [-1000, 'Thebes'], [-332, 'Memphis'], [640, 'Alexandria'], [99999, 'Cairo']],
    pop: [[-3000, 1], [-1000, 3], [1, 5], [1000, 5], [1800, 3.5], [1900, 10], [1950, 21], [2000, 68], [2025, 115], [2400, 180]],
    gen: { sk: 0.5, hd: 0.88, rd: 0.02, eb: 0.08, eg: 0.06, cu: 0.5, lac: 0.25, sc: 0.02, cf: 0.01, cb: 0.05, ht: [170, 159], nose: 'straight aquiline broad', bl: [0.26, 0.14], rh: 0.25 },
    laws: [[-3000, -30, 'Pharaoh is a living god and owner of the land'], [640, 99999, 'Religious law governs marriage and inheritance', { divorce: true }], [1952, 1970, 'Land reform breaks up the great estates'], [1956, 99999, 'Women win the vote']] },

  { id: 'CHN', short: 'China', adj: 'Chinese', region: 'asia', from: -3000, fo: 1,
    names: [[-221, 'the Zhou states', 'Feudal states'], [220, 'the Han Empire', 'Empire'], [618, 'the Six Dynasties', 'Divided kingdoms'], [1279, 'the Tang and Song Empire', 'Empire'], [1368, 'the Yuan Empire', 'Mongol empire'], [1644, 'the Ming Empire', 'Empire'], [1912, 'the Qing Empire', 'Empire'], [1949, 'the Republic of China', 'Republic'], [99999, "the People's Republic of China", 'One-party state']],
    pools: [[2029, 'chinese']],
    cur: [[-221, 'spade coins', 'bu ', 2], [618, 'wuzhu coins', 'zhu ', 0.4], [1368, 'strings of cash', 'guan ', 40], [1912, 'taels of silver', 'tael ', 120], [1949, 'yuan', '¥', 8], [1999, 'renminbi yuan', '¥', 2], [2029, 'yuan', '¥', 0.15]],
    cap: [[-221, 'Luoyang'], [220, "Chang'an"], [618, 'Jiankang'], [1127, "Chang'an"], [1279, 'Hangzhou'], [1421, 'Nanjing'], [1928, 'Beijing'], [1949, 'Nanjing'], [99999, 'Beijing']],
    pop: [[-3000, 5], [1, 60], [1000, 60], [1300, 80], [1600, 160], [1800, 330], [1900, 400], [1950, 550], [2000, 1270], [2025, 1410], [2400, 800]],
    gen: { sk: 0.33, hd: 0.96, rd: 0, eb: 0.01, eg: 0.01, cu: 0.03, lac: 0.05, sc: 0, cf: 0.001, cb: 0.05, ht: [172, 160], nose: 'button straight flat', bl: [0.22, 0.2], rh: 0.03 },
    cls: [[-221, 1911, ['Bondservant', 'Peasant', 'Artisan', 'Merchant', 'Scholar-gentry', 'Mandarin', 'Imperial clan']], [1949, 1978, ['Class enemy', 'Peasant', 'Worker', 'Soldier', 'Cadre', 'Party elite', 'Central Committee']]],
    laws: [[605, 1905, 'Imperial examinations select officials by merit'], [1950, 99999, 'The Marriage Law bans arranged marriage', { divorce: true }], [1966, 1976, 'The Cultural Revolution persecutes intellectuals'], [1980, 2015, 'The one-child policy', { kids: 1 }], [2016, 2020, 'The two-child policy', { kids: 2 }]] },

  { id: 'JPN', short: 'Japan', adj: 'Japanese', region: 'asia', from: -300, fo: 1,
    names: [[250, 'the Yayoi villages', 'Chiefdoms'], [794, 'the Yamato court', 'Imperial court'], [1185, 'Heian Japan', 'Imperial court'], [1603, 'Shogunate Japan', 'Warrior government'], [1868, 'Tokugawa Japan', 'Shogunate'], [1947, 'the Empire of Japan', 'Empire'], [99999, 'Japan', 'Constitutional monarchy']],
    pools: [[2029, 'japanese']],
    cur: [[708, 'koku of rice', 'koku ', 150], [1600, 'mon', 'mon ', 0.15], [1870, 'ryō', 'ryō ', 400], [1913, 'yen', '¥', 15], [1945, 'yen', '¥', 4], [1999, 'yen', '¥', 0.02], [2029, 'yen', '¥', 0.008]],
    cap: [[710, 'Asuka'], [794, 'Nara'], [1603, 'Kyoto'], [99999, 'Edo / Tokyo']],
    pop: [[-300, 0.5], [1, 1], [1000, 7], [1600, 17], [1800, 30], [1900, 44], [1950, 84], [2000, 127], [2025, 123], [2400, 70]],
    gen: { sk: 0.31, hd: 0.96, rd: 0, eb: 0.01, eg: 0.01, cu: 0.05, lac: 0.05, sc: 0, cf: 0.001, cb: 0.045, ht: [171, 158], nose: 'button straight flat', bl: [0.28, 0.17], rh: 0.03 },
    cls: [[794, 1602, ['Bonded servant', 'Peasant', 'Artisan', 'Warrior retainer', 'Samurai', 'Court noble', 'Imperial family']], [1603, 1871, ['Outcast', 'Townsman', 'Peasant farmer', 'Rōnin', 'Samurai', 'Daimyo', 'Imperial court']]],
    laws: [[1639, 1853, 'Sakoku: leaving the country is punishable by death', { noEmigrate: true }], [1871, 99999, 'The samurai class is abolished'], [1947, 99999, 'The constitution renounces war', { noDraft: true }], [1947, 99999, 'Women vote and inherit equally']] },

  { id: 'IND', short: 'India', adj: 'Indian', region: 'asia', from: -3000, malaria: 1, dairy: 1,
    names: [[-322, 'the Mahajanapadas', 'Kingdoms and republics'], [-185, 'the Maurya Empire', 'Empire'], [550, 'the Gupta realms', 'Empire'], [1206, 'the Indian kingdoms', 'Kingdoms'], [1526, 'the Delhi Sultanate', 'Sultanate'], [1857, 'the Mughal Empire', 'Empire'], [1947, 'the British Raj', 'Colonial rule'], [99999, 'the Republic of India', 'Federal republic']],
    pools: [[1205, 'indian_anc'], [2029, 'indian']],
    cur: [[-322, 'karshapanas', 'kp ', 15], [1206, 'dinaras', 'din ', 60], [1540, 'tankas', 'tk ', 100], [1857, 'rupees', '₹', 60], [1947, 'rupees', '₹', 10], [1999, 'rupees', '₹', 0.4], [2029, 'rupees', '₹', 0.013]],
    cap: [[-185, 'Pataliputra'], [1206, 'Kannauj'], [1911, 'Delhi'], [99999, 'New Delhi']],
    pop: [[-3000, 5], [1, 70], [1000, 75], [1600, 130], [1800, 200], [1900, 290], [1950, 360], [2000, 1050], [2025, 1450], [2400, 1300]],
    gen: { sk: 0.56, hd: 0.93, rd: 0.01, eb: 0.07, eg: 0.07, cu: 0.25, lac: 0.55, sc: 0.04, cf: 0.005, cb: 0.06, ht: [167, 155], nose: 'straight aquiline broad', bl: [0.19, 0.22], rh: 0.2 },
    cls: [[1206, 1857, ['Landless labourer', 'Peasant', 'Artisan', 'Merchant', 'Zamindar', 'Mansabdar', 'Royal house']], [1858, 1947, ['Landless labourer', 'Peasant', 'Clerk', 'Merchant', 'Zamindar', 'Maharaja', 'Viceregal elite']]],
    laws: [[-268, -232, "Ashoka's edicts urge tolerance and mercy"], [1829, 99999, 'The practice of sati is banned'], [1950, 99999, 'The constitution outlaws untouchability'], [1955, 99999, 'The Hindu Marriage Act permits divorce', { divorce: true }], [2018, 99999, 'Same-sex relations are decriminalised']] },

  { id: 'WAF', short: 'West Africa', adj: 'West African', region: 'africa', from: -3000, malaria: 1,
    names: [[300, 'the Nok lands', 'Villages and chiefdoms'], [1100, 'the Ghana Empire', 'Empire'], [1235, 'the Sahel kingdoms', 'Kingdoms'], [1600, 'the Mali and Songhai empires', 'Empire'], [1900, 'the Oyo Empire and Sokoto Caliphate', 'Kingdoms and caliphate'], [1960, 'Colonial Nigeria', 'Colonial rule'], [99999, 'the Federal Republic of Nigeria', 'Federal republic']],
    pools: [[1899, 'westafrica_anc'], [2029, 'westafrica']],
    cur: [[1899, 'cowrie shells', '', 0.03], [1959, 'West African pounds', '£', 120], [1999, 'naira', '₦', 4], [2029, 'naira', '₦', 0.003]],
    cap: [[1100, 'Koumbi Saleh'], [1600, 'Niani / Gao'], [1900, 'Oyo-Ile'], [1990, 'Lagos'], [99999, 'Abuja']],
    pop: [[-3000, 1], [1, 5], [1000, 8], [1600, 15], [1800, 20], [1900, 25], [1950, 38], [2000, 122], [2025, 230], [2400, 500]],
    gen: { sk: 0.9, hd: 0.98, rd: 0, eb: 0.01, eg: 0.01, cu: 0.95, lac: 0.15, sc: 0.13, cf: 0.002, cb: 0.025, ht: [170, 160], nose: 'broad button flat', bl: [0.2, 0.14], rh: 0.1 },
    cls: [[1235, 1600, ['Captive', 'Farmer', 'Craftsman', 'Trader', 'Warrior noble', 'Royal councillor', "The Mansa's family"]]],
    laws: [[1235, 1600, 'The Kouroukan Fouga, charter of the Mali Empire'], [1807, 99999, 'Britain bans the Atlantic slave trade'], [1960, 99999, 'Independence: a federal constitution'], [2014, 99999, 'Same-sex unions are criminalised', { sameSex: false }]] },

  { id: 'MEX', short: 'Mexico', adj: 'Mexican', region: 'americas', from: -3000,
    names: [[-400, 'the Olmec heartland', 'Chiefdoms'], [550, 'Teotihuacan', 'City-state'], [1325, 'the Toltec and Mixtec realms', 'City-states'], [1521, 'the Aztec Empire', 'Empire'], [1821, 'New Spain', 'Spanish colony'], [99999, 'Mexico', 'Federal republic']],
    pools: [[1520, 'nahuatl'], [2029, 'spanish']],
    cur: [[1521, 'cacao beans', '', 0.2], [1821, 'reales', 'rs ', 12], [1913, 'pesos', '$', 15], [1945, 'pesos', '$', 3], [1999, 'pesos', '$', 0.4], [2029, 'pesos', '$', 0.055]],
    cap: [[-400, 'San Lorenzo'], [550, 'Teotihuacan'], [1325, 'Tula'], [1521, 'Tenochtitlan'], [99999, 'Mexico City']],
    pop: [[-3000, 0.2], [1, 2], [1000, 5], [1500, 20], [1600, 3], [1800, 6], [1900, 14], [1950, 28], [2000, 99], [2025, 130], [2400, 140]],
    gen: { sk: 0.52, hd: 0.95, rd: 0, eb: 0.02, eg: 0.02, cu: 0.1, lac: 0.1, sc: 0.005, cf: 0.01, cb: 0.03, ht: [165, 155], nose: 'aquiline straight broad', bl: [0.08, 0.02], rh: 0.02 },
    cls: [[-400, 1521, ['Captive', 'Commoner (macehualli)', 'Artisan', 'Merchant (pochteca)', 'Eagle warrior', 'Noble (pipiltin)', "The Tlatoani's house"]], [1522, 1821, ['Peon', 'Labourer', 'Artisan', 'Merchant', 'Hacendado', 'Royal official', 'Viceregal court']]],
    laws: [[1857, 99999, 'A liberal constitution separates church and state'], [1914, 99999, 'Divorce is legalised', { divorce: true }], [1917, 99999, 'The revolutionary constitution: land reform and labour rights'], [1953, 99999, 'Women win the vote'], [2015, 99999, 'Same-sex marriage is legal nationwide', { sameSex: true }]] },

  { id: 'IRN', short: 'Persia', adj: 'Persian', region: 'asia', from: -3000, dairy: 1,
    names: [[-550, 'Media and Elam', 'Kingdoms'], [-330, 'the Achaemenid Empire', 'Empire'], [224, 'the Parthian Empire', 'Empire'], [651, 'the Sasanian Empire', 'Empire'], [1501, 'the caliphates and sultanates of Persia', 'Caliphate and sultanates'], [1925, 'Safavid and Qajar Persia', 'Shahdom'], [1979, 'the Imperial State of Iran', 'Monarchy'], [99999, 'the Islamic Republic of Iran', 'Theocratic republic']],
    pools: [[650, 'persian_anc'], [2029, 'persian']],
    cur: [[-550, 'shekels of silver', 'sh ', 30], [-330, 'darics', 'dar ', 400], [651, 'drachms', 'dr', 20], [1501, 'dinars', 'din ', 400], [1932, 'tomans', 'tm ', 60], [1979, 'rials', '﷼', 0.08], [2029, 'rials', '﷼', 0.00005]],
    cap: [[-550, 'Susa'], [-330, 'Persepolis'], [651, 'Ctesiphon'], [1501, 'Isfahan'], [1786, 'Isfahan'], [99999, 'Tehran']],
    pop: [[-3000, 1], [-500, 10], [1, 7], [1000, 6], [1800, 6], [1900, 10], [1950, 17], [2000, 66], [2025, 90], [2400, 85]],
    gen: { sk: 0.3, hd: 0.82, rd: 0.04, eb: 0.15, eg: 0.18, cu: 0.35, lac: 0.3, sc: 0.01, cf: 0.01, cb: 0.065, ht: [173, 160], nose: 'aquiline roman straight', bl: [0.25, 0.2], rh: 0.25 },
    cls: [[-550, 651, ['Labourer', 'Farmer', 'Artisan', 'Merchant', 'Lesser noble (azatan)', 'Great house', 'Royal house']]],
    laws: [[-539, -330, 'Cyrus decrees freedom of worship'], [1906, 99999, 'The first constitution and parliament'], [1963, 1979, 'The White Revolution: land reform and the vote for women'], [1979, 99999, 'The Islamic Republic: religious law in civil life', { alcohol: false }]] },

  { id: 'RUS', short: 'Russia', adj: 'Russian', region: 'europe', from: 862, dairy: 1, fem: 1,
    names: [[1240, 'Kievan Rus', 'Principalities'], [1547, 'the Grand Duchy of Moscow', 'Grand duchy'], [1721, 'the Tsardom of Russia', 'Tsardom'], [1917, 'the Russian Empire', 'Empire'], [1991, 'the Soviet Union', 'One-party state'], [99999, 'the Russian Federation', 'Federal republic']],
    pools: [[2029, 'russian']],
    cur: [[1380, 'grivnas', 'gr ', 200], [1700, 'dengas', 'den ', 1], [1917, 'rubles', '₽', 15], [1991, 'rubles', '₽', 6], [2029, 'rubles', '₽', 0.03]],
    cap: [[1240, 'Kiev'], [1712, 'Moscow'], [1918, 'St Petersburg'], [99999, 'Moscow']],
    pop: [[862, 3], [1300, 6], [1600, 12], [1800, 35], [1900, 120], [1950, 180], [1991, 290], [2000, 146], [2025, 144], [2400, 120]],
    gen: { sk: 0.1, hd: 0.45, rd: 0.08, eb: 0.75, eg: 0.22, cu: 0.12, lac: 0.7, sc: 0, cf: 0.02, cb: 0.08, ht: [176, 164], nose: 'straight snub button', bl: [0.35, 0.2], rh: 0.35 },
    cls: [[1547, 1861, ['Serf', 'State peasant', 'Townsman', 'Merchant of the guild', 'Minor nobility', 'Boyar', 'Imperial family']], [1862, 1917, ['Freed serf', 'Peasant', 'Worker', 'Merchant', 'Minor nobility', 'Grand nobility', 'Imperial family']], [1922, 1991, ['Gulag prisoner', 'Kolkhoz worker', 'Factory worker', 'Intelligentsia', 'Party member', 'Nomenklatura', 'Politburo']]],
    laws: [[1649, 1861, 'Serfdom binds peasants to the land', { noEmigrate: true }], [1918, 99999, 'Civil divorce made simple', { divorce: true }], [1922, 1991, 'Private enterprise is banned; the state owns industry'], [1922, 1989, 'Travel abroad requires state permission', { noEmigrate: true }], [2013, 99999, 'A "propaganda" law restricts LGBT expression', { sameSex: false }]] },

  { id: 'USA', short: 'America', adj: 'American', region: 'americas', from: 1607,
    names: [[1775, 'British America', 'Colony'], [99999, 'the United States', 'Federal republic']],
    pools: [[1799, 'colonial'], [1913, 'industrial'], [1945, 'wars'], [1999, 'modern'], [2029, 'digital']],
    cur: [[1775, 'colonial pounds', '£', 100], [1913, 'dollars', '$', 30], [1945, 'dollars', '$', 16], [1999, 'dollars', '$', 6], [2029, 'dollars', '$', 1]],
    cap: [[1698, 'Jamestown'], [1775, 'Williamsburg'], [1800, 'Philadelphia'], [99999, 'Washington']],
    pop: [[1607, 0.001], [1700, 0.25], [1800, 5.3], [1900, 76], [1950, 152], [2000, 282], [2025, 340], [2400, 420]],
    gen: { sk: 0.12, hd: 0.5, rd: 0.25, eb: 0.7, eg: 0.22, cu: 0.18, lac: 0.85, sc: 0.01, cf: 0.022, cb: 0.075, ht: [177, 163], nose: 'straight aquiline snub button', bl: [0.3, 0.08], rh: 0.38 },
    mix: { ENG: 0.4, WAF: 0.14, MEX: 0.12, ITA: 0.07, FRA: 0.05, RUS: 0.06, CHN: 0.05, IND: 0.04, IRN: 0.02, JPN: 0.02, GRC: 0.02, EGY: 0.01 },
    laws: [[1776, 99999, 'The Declaration of Independence'], [1865, 99999, 'Slavery abolished by the Thirteenth Amendment'], [1920, 1933, 'Prohibition bans alcohol', { alcohol: false }], [1920, 99999, 'Women win the vote'], [1940, 1973, 'A peacetime draft'], [1964, 99999, 'The Civil Rights Act'], [2015, 99999, 'Same-sex marriage is legal nationwide', { sameSex: true }]] },

  { id: 'MAR', short: 'Mars', adj: 'Martian', region: 'space', from: 2041,
    names: [[2100, 'the Mars Colony', 'Colonial authority'], [99999, 'the Martian Republic', 'Republic']],
    pools: [], cur: [[99999, 'Mars scrip', 'Ⓜ', 1.5]], cap: [[99999, 'Jezero Station']],
    pop: [[2041, 0.0001], [2100, 0.2], [2200, 8], [2400, 60]], mix: 'world',
    cls: [[2041, 99999, ['Unregistered', 'Dome labourer', 'Colonist', 'Engineer', 'Council member', 'First families', 'Founders']]],
    laws: [[2041, 99999, 'Oxygen is rationed by charter'], [2041, 2150, 'Birth permits limit families to two children', { kids: 2 }], [2041, 99999, 'Every colonist votes in the colony assembly']] },

  { id: 'LUN', short: 'Luna', adj: 'Lunar', region: 'space', from: 2070,
    names: [[99999, 'the Lunar Cities', 'City league']], pools: [], cur: [[99999, 'lunar crowns', '☾', 3]], cap: [[99999, 'Shackleton City']],
    pop: [[2070, 0.01], [2110, 1], [2200, 5], [2400, 20]], mix: 'world',
    laws: [[2070, 99999, 'Low-gravity births require medical licence'], [2070, 99999, 'Water is common property']] },

  { id: 'BLT', short: 'the Belt', adj: 'Belter', region: 'space', from: 2150,
    names: [[2216, 'the Belt Settlements', 'Corporate charter'], [99999, 'the Free Belt', 'Free states']], pools: [], cur: [[99999, 'belt tokens', '⌬', 0.8]], cap: [[99999, 'Ceres Hub']],
    pop: [[2150, 0.5], [2250, 20], [2400, 90]], mix: 'world',
    laws: [[2150, 99999, 'Air, water and power are metered'], [2217, 99999, 'The Free Belt Charter: no company owns a citizen']] },
];

/* ---------- era default class ladders (lowest to highest) ---------- */
DATA.classLadders = {
  ancient: ['Bondsman', 'Freedman', 'Commoner', 'Artisan', 'Equestrian', 'Patrician', 'Royal house'],
  medieval: ['Serf', 'Villein', 'Freeman', 'Yeoman', 'Gentry', 'Nobility', 'Royalty'],
  renaissance: ['Pauper', 'Labourer', 'Artisan', 'Burgher', 'Merchant prince', 'Nobility', 'Royalty'],
  colonial: ['Pauper', 'Labourer', 'Tradesman', 'Middling sort', 'Gentry', 'Aristocracy', 'Royalty'],
  industrial: ['Destitute', 'Working class', 'Skilled worker', 'Lower middle class', 'Upper middle class', 'Upper class', 'Aristocracy'],
  wars: ['Homeless', 'Working poor', 'Working class', 'Middle class', 'Upper middle class', 'Wealthy', 'Elite'],
  modern: ['Homeless', 'Working poor', 'Working class', 'Middle class', 'Upper middle class', 'Wealthy', 'Elite'],
  digital: ['Homeless', 'Working poor', 'Working class', 'Middle class', 'Upper middle class', 'Wealthy', 'Billionaire elite'],
  near: ['Unhoused', 'Basic-income class', 'Service class', 'Professional class', 'Technocrat', 'Founder class', 'Oligarch'],
  far: ['Unregistered', 'Habitat labourer', 'Citizen', 'Guild member', 'Spacer elite', 'Colony magnate', 'Stellar dynasty'],
};
