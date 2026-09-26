/* =====================================================================
   REGIONS — new lands, prehistoric cultures, cities and migrations.
   * Six new regions: the Levant, Mesopotamia, Anatolia, the Maghreb,
     Scandinavia and the Andes, each with names from their first
     foragers to today.
   * Every older land is extended back to 10,000 BC with its
     prehistoric cultures (Natufian, Iberomaurusian, Maglemosian,
     Jōmon, Yangshao, Yamnaya, Clovis...).
   * DATA.neolithic: when farming, herding and copper reach each land.
   * genT: ancestral gene pools before later migrations (for example
     dark-skinned, blue-eyed Mesolithic Europeans).
   * DATA.cities: named settlements with a level over time
     (0 camp, 1 hamlet, 2 village, 3 town, 4 city, 5 great city,
     6 metropolis, 7 megacity). "Lutetia>500>Paris" renames in 500.
   * Migrations: type 'migration' history entries move genes and people.
   Prehistoric personal names are reconstructions, not attested names.
   ===================================================================== */

(() => {
  const P = {
    meso: 'Arvo Bekka Dunnar Eskil Holt Irrik Kaldo Lunn Morv Nesk Orrin Tovo | Aina Bree Dalla Enna Hesa Ilva Kaija Liss Mira Nessa Olla Runa | of_the_Otter_clan of_the_Elk_clan of_the_Reindeer_clan of_the_Heron_clan of_the_Beaver_clan of_the_Salmon_clan of_the_Lynx_clan of_the_Aurochs_clan of_the_Swan_clan of_the_Seal_clan of_the_Birch_clan of_the_Amber_clan',
    natufian: 'Abbu Dagan Elu Habir Ishmu Kadu Lamu Nabu Rashu Shalim Tabu Zaku | Adda Bettu Dunna Emmi Hanna Ishtu Kallu Lila Nidda Rami Shaddu Tallu | of_Eynan of_the_Wadi of_el-Wad of_Jericho of_Shuqba of_Kebara of_the_Gazelle_clan of_the_Olive_Hills of_Hayonim of_the_Jordan of_Mallaha of_the_Carmel',
    ibero: 'Aksil Amayas Idir Izem Madghis Massin Yuba Zdir Anir Gaya Iken Sifaw | Dihya Tanirt Tiziri Tassadit Nedjma Taziri Lunja Tafsut Ayur Illi Menna Tilelli | of_Taforalt of_Afalou of_the_Snail_Middens of_Columnata of_the_Atlas of_the_Gazelle_clan of_Tamar_Hat of_the_Salt_Lake of_the_Red_Cliffs of_Mechta of_the_Lion_clan of_the_Cedar_Hills',
    sumer: 'Gilgamesh Enmerkar Lugalbanda Ur-Nammu Shulgi Eannatum Gudea Mesannepada Urukagina Lugalzagesi Ur-Nanshe Enshakushana | Enheduanna Kubaba Puabi Ninshatapada Baranamtara Shagshag Geme-Sin Ninbanda Nin-Ezen Ninkasi Amat-Shamash Ninsun | of_Uruk of_Ur of_Lagash of_Eridu of_Nippur of_Kish of_Umma of_Larsa of_Shuruppak of_Isin of_Girsu of_Adab',
    akkad: 'Sargon Naram-Sin Hammurabi Nabopolassar Nebuchadnezzar Shamshi-Adad Ashurbanipal Sennacherib Tiglath Marduk-apla Belshazzar Nabonidus | Shamhat Semiramis Naqia Tashmetum Amat-Mamu Iltani Belet Ishtar-ummi Beltani Libbali Adad-guppi Tabni | of_Babylon of_Nineveh of_Ashur of_Akkad of_Mari of_Sippar of_Nimrud of_Borsippa of_Kutha of_Nuzi of_Arbela of_Harran',
    catal: 'Akun Beru Dano Eshu Hattu Irmo Kaan Loru Mesu Nuri Oltu Tamu | Asha Bala Desi Ena Hala Ilka Kira Lena Mela Nura Ossa Tula | of_Catalhoyuk of_Asikli of_Boncuklu of_Gobekli of_Nevali_Cori of_Hacilar of_Canhasan of_the_Obsidian_Hill of_the_Bull_Shrine of_Cayonu of_the_Konya_Plain of_the_Leopard_clan',
    hittite: 'Suppiluliuma Mursili Hattusili Muwatalli Tudhaliya Arnuwanda Telipinu Anitta Pithana Zidanta Ammuna Kurunta | Puduhepa Asmunikal Nikalmati Walanni Tawananna Gassulawiya Henti Kilushepa Danuhepa Harapsili Istapariya Malnigal | of_Hattusa of_Kanesh of_Sapinuwa of_Arinna of_Nerik of_Tarhuntassa of_Kizzuwatna of_Carchemish of_Kussara of_Zalpa of_Samuha of_Ankuwa',
    turkish: 'Mehmet Mustafa Ahmet Ali Hüseyin Hasan İbrahim Murat Emre Burak Kemal Osman | Ayşe Fatma Emine Hatice Zeynep Elif Meryem Şerife Hülya Esra Leyla Nesrin | Yılmaz Kaya Demir Şahin Çelik Yıldız Yıldırım Öztürk Aydın Özdemir Arslan Doğan',
    canaanite: 'Hiram Abibaal Ahiram Ittobaal Eshmunazar Yehimilk Mattan Abdashtart Baalshillem Elibaal Tabnit Bodashtart | Elissa Tamar Jezebel Batnoam Amotbaal Arishat Shiphrah Abigail Miriam Rahab Deborah Naamah | of_Tyre of_Sidon of_Byblos of_Ugarit of_Jerusalem of_Samaria of_Hazor of_Megiddo of_Ashkelon of_Gaza of_Arwad of_Damascus',
    syriac: 'Ephrem Yohannan Addai Aphrahat Rabbula Narsai Babai Abgar Mani Shimon Yaqub Mattai | Maryam Shirin Susan Martha Thecla Febronia Anahid Tabitha Salome Qatre Hanna Shalomit | of_Antioch of_Edessa of_Damascus of_Palmyra of_Tyre of_Caesarea of_Jerusalem of_Nisibis of_Emesa of_Apamea of_Bostra of_Gerasa',
    levant_ar: 'Omar Khaled Samir Fadi Rami Tariq Nabil Ziad Karim Yusuf Elias Georges | Rania Layla Nour Hiba Dalia Maya Rana Salma Yara Lina Mona Reem | Haddad Khoury Nasrallah Saleh Mansour Aoun Karam Farah Hakim Azar Najjar Shami',
    numid: 'Masinissa Jugurtha Syphax Juba Micipsa Gulussa Tacfarinas Hiempsal Adherbal Gauda Bocchus Hannibal | Sophonisba Dihya Salammbo Tinhinan Imilce Tiziri Tanirt Tafsut Illi Lunja Taziri Menna | of_Cirta of_Carthage of_Utica of_Hippo of_Thugga of_Siga of_Volubilis of_Caesarea of_Lixus of_Thapsus of_Leptis of_Tingis',
    maghrebi: 'Mohamed Ahmed Youssef Karim Rachid Mourad Samir Nabil Farid Kamel Hakim Amine | Fatima Khadija Amina Nadia Samira Leila Yasmina Soraya Houria Malika Djamila Nawal | Benali Bouzid Haddad Mansouri Belkacem Saidi Rahmani Boudiaf Cherif Hamidi Khelifi Ziani',
    norse: 'Ragnar Bjorn Leif Ivar Harald Sigurd Erik Olaf Ulf Gunnar Torstein Knut | Astrid Freydis Gudrun Ingrid Sigrid Thyra Ragnhild Helga Asa Solveig Gunhild Estrid | Ragnarsson Haraldsson Eriksson Olafsson Sigurdsson Ivarsson Gunnarsson Bjornsson Ulfsson Knutsson Torsteinsson Leifsson',
    nordic: 'Lars Anders Johan Nils Karl Erik Per Mikkel Henrik Sven Ole Magnus | Anna Maria Karin Ingrid Kristina Sofia Emma Ida Freja Sigrid Maja Astrid | Andersson Johansson Larsen Nilsen Hansen Karlsson Jensen Pedersen Eriksson Olsen Lindqvist Berg',
    steppe: 'Ekwon Weiros Dhegom Perkwun Swekur Aryo Nerto Teuto Gwowen Wesu Sweno Kreuro | Hausa Wesna Dhuga Swela Nerta Aryna Weika Pertla Gweni Ausos Leuka Deiwa | of_the_Horse_clan of_the_Kurgan of_the_Dnieper of_the_Don of_the_Volga of_the_Wolf_clan of_the_Bronze_Wheel of_the_Sky_Father of_the_Steppe of_the_Ural of_the_Oak_clan of_the_White_Mare',
    scythian: 'Ariapeithes Scyles Octamasadas Idanthyrsus Scopasis Ateas Skilurus Palakus Anacharsis Madyes Spargapeithes Targitaus | Tomyris Opoea Zarina Amage Tirgatao Arga Sparethra Kadra Satira Tabiti Api Argimpasa | of_the_Royal_Scythians of_the_Black_Sea of_the_Dnieper of_the_Kurgan of_the_Horse_Lords of_Gelonus of_the_Budini of_the_Sauromatae of_the_Neuri of_the_Taurians of_the_Maeotians of_the_Golden_Deer',
    native_na: 'Akai Honu Kesa Lomo Nahu Otek Pesu Tanka Wiko Yuma Ahu Sekoi | Aiya Hali Kiona Luma Nita Oya Pala Sika Tala Wenna Yara Mika | of_the_Bison_people of_the_River_people of_the_Mound_builders of_the_Lake_people of_the_Hill_people of_the_Cedar_people of_the_Salmon_people of_the_Mesa_people of_the_Plains of_the_Woodlands of_the_Great_River of_the_Eastern_Shore',
    jomon: 'Aku Hanu Isu Kamu Kiru Maku Naru Oku Saku Taku Yaku Kuru | Ama Hina Iku Kana Mina Nuka Sana Tama Uka Yuna Kiri Oma | of_Sannai-Maruyama of_the_Shell_Mound of_the_Cord_Pottery of_the_Chestnut_Grove of_the_Deer_clan of_the_Salmon_River of_the_Hot_Spring of_the_Pit_Houses of_the_Cedar_Forest of_Oyu of_the_Lacquer_clan of_the_Bear_clan',
    yangshao: 'Ao Bei Chu Dan Gu Hao Jia Kun Li Mao Pei Wu | An Bao Chen Die Fei Hua Ji Lan Mu Qin Su Yi | of_Banpo of_Jiangzhai of_Peiligang of_Jiahu of_Hemudu of_Dadiwan of_the_Painted_Pottery of_Cishan of_the_Yellow_River of_the_Wei_Valley of_Majiayao of_the_Millet_Fields',
    indus: 'Adu Bharu Chaku Daru Elu Haru Kavu Maru Naku Pavu Sanu Varu | Ammi Bali Chela Dami Elli Hali Kaya Mala Nali Paya Sala Vali | of_Mehrgarh of_Harappa of_Mohenjo-daro of_Kot_Diji of_Lothal of_Kalibangan of_Dholavira of_Rakhigarhi of_the_Bolan_Pass of_the_Indus of_the_Sarasvati of_Amri',
    nile_pre: 'Ahu Batu Djeru Hapu Kemu Mesu Neku Seru Tefu Unu Weni Khafu | Ankha Beti Hemet Isti Kia Meri Nefu Rennu Sati Tiya Weret Nubet | of_Badari of_Naqada of_Merimde of_the_Faiyum of_Hierakonpolis of_Abydos of_Buto of_Maadi of_Nekhen of_the_Delta of_the_Cataract of_the_Western_Desert',
    zagros: 'Ardu Baru Gashu Hamu Kavu Mardu Naru Paru Shaku Tabu Varu Zadu | Ani Bari Gula Hana Kasa Mana Nari Pani Shala Tana Vana Zari | of_Ganj_Dareh of_Chogha_Golan of_Susa of_the_Zagros of_Tepe_Sialk of_Ali_Kosh of_Jarmo of_the_Goat_clan of_Chogha_Mish of_Shahr-i_Sokhta of_Tepe_Yahya of_the_Salt_Desert',
    andean_pre: 'Achu Chaki Illa Kusi Mayu Pacha Rumi Sayri Tupa Wamak Yaku Qhapa | Achik Chaska Illari Killa Kusi Nina Phuyu Sisa Tika Urpi Wayta Yana | of_Caral of_Aspero of_the_Supe_Valley of_Huaricanga of_the_Coast of_the_Highlands of_Kotosh of_the_Llama_clan of_the_Condor_clan of_the_Puma_clan of_the_Sun_Temple of_Chavin',
    quechua: 'Pachacuti Atahualpa Huascar Manco Tupac Sayri Titu Cusi Huayna Yupanqui Amaru Ninan | Ocllo Chimpu Qori Kusi Rawa Cura Azarpay Huaco Chuqui Killa Sisa Micay | of_Cusco of_Tiwanaku of_Chan_Chan of_Huari of_Machu_Picchu of_Quito of_Cajamarca of_Vilcabamba of_Sacsayhuaman of_the_Sacred_Valley of_Titicaca of_Ollantaytambo',
    etruscan: 'Larth Arnth Vel Aule Laris Avle Tarchon Porsenna Mastarna Caile Vetur Sethre | Tanaquil Ramtha Larthia Thana Velia Fasti Hasti Seianti Ravnthu Thanchvil Culni Ati | Velcha Spurinna Tarchna Cutu Matuna Precu Pumpu Velimna Cilnia Plecu Hulchnie Tetina',
  };
  for (const [k, s] of Object.entries(P)) {
    const [m, f, last] = s.split('|').map(x => x.trim().split(/\s+/).map(w => w.replace(/_/g, ' ')));
    DATA.names[k] = { m, f, last };
  }
})();

/* ---------- ancestral gene pools ---------- */
DATA.genPools = {
  WHG: { sk: 0.55, hd: 0.82, rd: 0.02, eb: 0.85, eg: 0.1, cu: 0.3, lac: 0.01, sc: 0, cf: 0.01, cb: 0.07, ht: [168, 156], nose: 'straight aquiline broad', bl: [0.1, 0.05], rh: 0.3 },
  EEF: { sk: 0.3, hd: 0.86, rd: 0.03, eb: 0.2, eg: 0.15, cu: 0.3, lac: 0.02, sc: 0.005, cf: 0.015, cb: 0.07, ht: [166, 155], nose: 'straight aquiline roman', bl: [0.3, 0.08], rh: 0.3 },
  EHG: { sk: 0.32, hd: 0.72, rd: 0.05, eb: 0.5, eg: 0.2, cu: 0.2, lac: 0.05, sc: 0, cf: 0.01, cb: 0.07, ht: [174, 162], nose: 'straight aquiline broad', bl: [0.25, 0.15], rh: 0.25 },
  NATIVE: { sk: 0.5, hd: 0.97, rd: 0, eb: 0.01, eg: 0.01, cu: 0.05, lac: 0.05, sc: 0, cf: 0.002, cb: 0.02, ht: [166, 154], nose: 'aquiline straight broad', bl: [0.02, 0.01], rh: 0.01 },
};

/* ---------- the new regions ---------- */
DATA.countries.push(
  { id: 'LEV', short: 'the Levant', adj: 'Levantine', region: 'asia', from: -10000, dairy: -8000,
    names: [[-9500, 'the Natufian hamlets', 'Forager hamlets'], [-8700, 'the first farming villages of the Jordan', 'Farming villages'], [-6400, 'the stone towns of Jericho and Ain Ghazal', 'Farming towns'], [-4500, 'the Neolithic Levant', 'Farming villages'], [-3700, 'the Ghassulian villages', 'Chiefdoms'], [-2000, 'the Canaanite towns', 'City-states'], [-1150, 'Canaan under Egyptian rule', 'Egyptian provinces'], [-586, 'the kingdoms of Israel, Judah and Phoenicia', 'Kingdoms and trading cities'], [-332, 'Persian Beyond-the-River', 'Persian satrapy'], [-63, 'the Seleucid Levant', 'Hellenistic kingdom'], [636, 'Roman Syria and Judaea', 'Roman provinces'], [1099, "the Caliphate's Bilad al-Sham", 'Caliphate'], [1291, 'the Crusader states', 'Crusader kingdoms'], [1516, 'Mamluk Syria', 'Sultanate'], [1918, 'Ottoman Syria', 'Ottoman provinces'], [1946, 'the French and British Mandates', 'League of Nations mandates'], [99999, 'the Levant: Syria, Lebanon, Israel, Palestine and Jordan', 'Divided states']],
    pools: [[-2000, 'natufian'], [-332, 'canaanite'], [636, 'syriac'], [2029, 'levant_ar']],
    cur: [[-3001, 'barter goods', '', 8], [-600, 'silver by weight', 'sh ', 30], [-332, 'Phoenician shekels', 'sh ', 30], [-63, 'drachmae', 'dr', 20], [636, 'denarii', 'd', 20], [1516, 'dinars', 'din ', 400], [1918, 'piastres', 'pt', 1.5], [1946, 'Syrian pounds', 'S£', 60], [1999, 'pounds', '£', 2], [2029, 'pounds', '£', 0.2]],
    cap: [[-9500, 'Eynan'], [-6400, 'Jericho'], [-3700, 'Teleilat Ghassul'], [-2000, 'Byblos'], [-1150, 'Megiddo'], [-586, 'Tyre'], [636, 'Antioch'], [1099, 'Damascus'], [1291, 'Jerusalem'], [99999, 'Damascus']],
    pop: [[-10000, 0.02], [-6000, 0.2], [-3000, 0.5], [-1000, 1.5], [1, 3], [1000, 3], [1800, 2], [1900, 4], [1950, 8], [2000, 35], [2025, 50], [2400, 60]],
    gen: { sk: 0.35, hd: 0.85, rd: 0.03, eb: 0.12, eg: 0.12, cu: 0.4, lac: 0.25, sc: 0.01, cf: 0.01, cb: 0.06, ht: [172, 160], nose: 'aquiline straight roman', bl: [0.3, 0.13], rh: 0.2 },
    laws: [[-1750, -1150, 'Canaanite city kings answer to Pharaoh'], [636, 1918, 'Religious law governs marriage and inheritance', { divorce: true }], [1948, 99999, 'Borders and citizenship are bitterly contested']],
    cls: [[-2000, -332, ['Slave', 'Peasant', 'Craftsman', 'Merchant', 'Temple family', 'Noble house', 'Royal house']]] },

  { id: 'MSP', short: 'Mesopotamia', adj: 'Mesopotamian', region: 'asia', from: -10000, dairy: -7000,
    names: [[-6500, 'the hill villages above the Two Rivers', 'Farming villages'], [-5500, 'the Samarra and Halaf villages', 'Farming villages'], [-3800, 'the Ubaid temple towns', 'Temple towns'], [-3100, 'Uruk, the first city', 'City-state'], [-2334, 'the Sumerian city-states', 'City-states'], [-2154, 'the Akkadian Empire', 'Empire'], [-1595, 'Old Babylonia', 'Kingdom'], [-609, 'Assyria and Babylonia', 'Empires'], [-539, 'the Neo-Babylonian Empire', 'Empire'], [-330, 'Achaemenid Babylonia', 'Persian satrapy'], [637, 'Parthian and Sasanian Mesopotamia', 'Imperial province'], [1258, 'the Abbasid Caliphate', 'Caliphate'], [1534, 'Mongol and Turkmen Iraq', 'Khanates'], [1920, 'Ottoman Iraq', 'Ottoman provinces'], [1958, 'the Kingdom of Iraq', 'Monarchy'], [99999, 'the Republic of Iraq', 'Republic']],
    pools: [[-3800, 'zagros'], [-2334, 'sumer'], [-539, 'akkad'], [637, 'persian_anc'], [2029, 'arabic']],
    cur: [[-3001, 'barter goods', '', 8], [-2334, 'barley by the gur', 'gur ', 6], [-539, 'shekels of silver', 'sh ', 30], [-330, 'darics', 'dar ', 400], [637, 'drachms', 'dr', 20], [1534, 'dinars', 'din ', 400], [1920, 'piastres', 'pt', 1.5], [1999, 'Iraqi dinars', 'ID ', 30], [2029, 'Iraqi dinars', 'ID ', 0.0008]],
    cap: [[-6500, 'Jarmo'], [-5500, 'Tell Halaf'], [-3800, 'Eridu'], [-2334, 'Uruk'], [-2154, 'Akkad'], [-1595, 'Babylon'], [-609, 'Nineveh'], [-330, 'Babylon'], [637, 'Ctesiphon'], [99999, 'Baghdad']],
    pop: [[-10000, 0.02], [-5000, 0.1], [-3000, 1], [-1000, 2], [1, 2], [800, 5], [1300, 1.5], [1800, 1.3], [1900, 2.5], [1950, 5], [2000, 23], [2025, 46], [2400, 70]],
    gen: { sk: 0.38, hd: 0.9, rd: 0.02, eb: 0.08, eg: 0.1, cu: 0.4, lac: 0.25, sc: 0.02, cf: 0.01, cb: 0.06, ht: [170, 158], nose: 'aquiline straight broad', bl: [0.27, 0.2], rh: 0.2 },
    laws: [[-1754, -1595, "Hammurabi's code: an eye for an eye, and a fixed fee for a surgeon"], [637, 99999, 'Religious law governs marriage and inheritance', { divorce: true }]],
    cls: [[-3100, -539, ['Slave', 'Tenant farmer', 'Craftsman', 'Merchant (tamkarum)', 'Temple official', 'Noble', 'Royal house']]] },

  { id: 'ANA', short: 'Anatolia', adj: 'Anatolian', region: 'asia', from: -10000, dairy: -7000,
    names: [[-8300, 'the Anatolian foragers', 'Forager bands'], [-5700, 'Çatalhöyük and the first towns', 'Proto-towns'], [-3000, 'the Chalcolithic villages of Anatolia', 'Farming villages'], [-1650, 'the Hattian lands and Assyrian trade towns', 'City-states'], [-1178, 'the Hittite Empire', 'Empire'], [-547, 'Phrygia and Lydia', 'Kingdoms'], [-330, 'Achaemenid Anatolia', 'Persian satrapies'], [-133, 'the Hellenistic kingdoms', 'Kingdoms'], [1071, 'Roman and Byzantine Anatolia', 'Imperial provinces'], [1299, 'the Seljuk Sultanate of Rum', 'Sultanate'], [1922, 'the Ottoman Empire', 'Empire'], [99999, 'the Republic of Türkiye', 'Republic']],
    pools: [[-3000, 'catal'], [-547, 'hittite'], [1071, 'byzantine'], [2029, 'turkish']],
    cur: [[-3001, 'barter goods', '', 8], [-600, 'silver by weight', 'sh ', 30], [-330, 'Lydian staters', 'st ', 25], [1071, 'nomismata', 'nom', 400], [1922, 'akçe', 'ak', 0.8], [1999, 'lira', '₺', 0.1], [2029, 'lira', '₺', 0.04]],
    cap: [[-8300, 'Boncuklu'], [-5700, 'Çatalhöyük'], [-3000, 'Hacılar'], [-1650, 'Kanesh'], [-1178, 'Hattusa'], [-547, 'Sardis'], [-133, 'Pergamon'], [1071, 'Constantinople'], [1299, 'Konya'], [1453, 'Bursa'], [1922, 'Constantinople'], [99999, 'Ankara']],
    pop: [[-10000, 0.05], [-6000, 0.3], [-3000, 1], [-1000, 3], [1, 8], [1000, 7], [1500, 6], [1800, 9], [1900, 13], [1950, 21], [2000, 64], [2025, 86], [2400, 80]],
    gen: { sk: 0.28, hd: 0.8, rd: 0.05, eb: 0.2, eg: 0.2, cu: 0.3, lac: 0.35, sc: 0.01, cf: 0.012, cb: 0.07, ht: [174, 160], nose: 'aquiline straight roman', bl: [0.38, 0.15], rh: 0.25 },
    laws: [[-1500, -1178, 'The Hittite laws: fines rather than vengeance'], [1299, 1922, 'Religious law governs marriage and inheritance', { divorce: true }], [1926, 99999, 'A secular civil code', { divorce: true }], [1934, 99999, 'Women vote']],
    cls: [[1299, 1922, ['Slave', 'Peasant (reaya)', 'Craftsman', 'Merchant', 'Sipahi cavalryman', 'Pasha', 'House of Osman']]] },

  { id: 'MAG', short: 'the Maghreb', adj: 'Maghrebi', region: 'africa', from: -10000, dairy: -6000,
    names: [[-8000, 'the Iberomaurusian cave dwellers', 'Forager bands'], [-5500, 'the Capsian snail-eaters', 'Forager bands'], [-814, 'the Neolithic Maghreb', 'Herding clans'], [-146, 'Carthage and the Numidian kingdoms', 'Trading republic and kingdoms'], [429, 'Roman Africa', 'Roman province'], [698, 'Vandal and Byzantine Africa', 'Kingdom and province'], [1554, 'the Maghreb dynasties', 'Caliphates and sultanates'], [1830, 'the Regency of Algiers', 'Ottoman regency'], [1962, 'French Algeria', 'Colony'], [99999, "the People's Democratic Republic of Algeria", 'Republic']],
    pools: [[-814, 'ibero'], [698, 'numid'], [2029, 'maghrebi']],
    cur: [[-814, 'barter goods', '', 8], [-146, 'Carthaginian shekels', 'sh ', 25], [698, 'denarii', 'd', 20], [1554, 'dinars', 'din ', 400], [1830, 'budju', 'bj ', 2], [1913, 'francs', 'F', 6], [1962, 'francs', 'F', 1], [1999, 'dinars', 'DA ', 0.15], [2029, 'dinars', 'DA ', 0.0075]],
    cap: [[-8000, 'Taforalt'], [-5500, 'Columnata'], [-814, 'Tipasa'], [698, 'Carthage'], [1554, 'Tlemcen'], [99999, 'Algiers']],
    pop: [[-10000, 0.05], [-3000, 0.3], [-146, 3], [1, 4], [1000, 3], [1800, 3], [1900, 5], [1950, 9], [2000, 31], [2025, 47], [2400, 60]],
    gen: { sk: 0.4, hd: 0.85, rd: 0.03, eb: 0.1, eg: 0.12, cu: 0.5, lac: 0.35, sc: 0.02, cf: 0.01, cb: 0.05, ht: [172, 160], nose: 'aquiline straight broad', bl: [0.25, 0.15], rh: 0.3 },
    laws: [[698, 99999, 'Religious law governs marriage and inheritance', { divorce: true }], [1962, 99999, 'Independence after a long war of liberation'], [1962, 99999, 'Women vote']],
    cls: [[-814, -146, ['Slave', 'Libyan farmer', 'Craftsman', 'Merchant', 'Suffete family', 'Great merchant house', 'The Magonid kings']]] },

  { id: 'SCA', short: 'Scandinavia', adj: 'Scandinavian', region: 'europe', from: -10000, dairy: -3900,
    names: [[-9500, 'the Ahrensburg reindeer camps', 'Hunter bands'], [-6400, 'the Maglemosian forests of Mesolithic Europe', 'Hunter-gatherer bands'], [-3950, 'the Ertebølle shore', 'Fishing camps'], [-2800, 'the Funnelbeaker farms', 'Farming villages'], [-1700, 'the Battle Axe and Dagger peoples', 'Chiefdoms'], [-500, 'the Nordic Bronze Age', 'Chiefdoms'], [793, 'the Germanic and Norse tribes', 'Tribes and petty kingdoms'], [1066, 'the Viking kingdoms', 'Petty kingdoms'], [1397, 'the Kingdoms of Denmark, Norway and Sweden', 'Monarchies'], [1523, 'the Kalmar Union', 'Union monarchy'], [1814, 'Denmark–Norway and Sweden', 'Absolute monarchies'], [99999, 'the Nordic kingdoms', 'Constitutional monarchies']],
    pools: [[-2800, 'meso'], [-500, 'steppe'], [1523, 'norse'], [2029, 'nordic']],
    cur: [[793, 'barter goods', '', 8], [1523, 'silver pennies', 'd', 3], [1873, 'rigsdaler', 'rd ', 40], [1913, 'kronor', 'kr ', 20], [1945, 'kronor', 'kr ', 5], [1999, 'kronor', 'kr ', 1], [2029, 'kronor', 'kr ', 0.1]],
    cap: [[-9500, 'Stellmoor'], [-6400, 'Mullerup'], [-3950, 'Ertebølle'], [-2800, 'Sarup'], [-500, 'Kivik'], [793, 'Uppåkra'], [1066, 'Uppsala'], [1397, 'Roskilde'], [1814, 'Copenhagen'], [99999, 'Stockholm']],
    pop: [[-10000, 0.005], [-4000, 0.05], [-2000, 0.2], [1, 0.8], [1000, 1.5], [1300, 2.5], [1800, 5], [1900, 11], [1950, 17], [2000, 24], [2025, 27], [2400, 30]],
    gen: { sk: 0.05, hd: 0.3, rd: 0.12, eb: 0.9, eg: 0.2, cu: 0.1, lac: 0.95, sc: 0, cf: 0.02, cb: 0.08, ht: [181, 167], nose: 'straight snub button', bl: [0.45, 0.1], rh: 0.4 },
    genT: [[-3950, 'WHG'], [-2800, 'EEF'], [-2000, 'EHG']],
    laws: [[930, 99999, 'The Thing: free men meet to make the law'], [1683, 99999, 'The Danish and Norwegian law codes'], [1915, 99999, 'Women vote'], [1969, 99999, 'Divorce by mutual consent', { divorce: true }], [2009, 99999, 'Same-sex marriage is legal', { sameSex: true }]],
    cls: [[793, 1100, ['Thrall', 'Cottar', 'Karl (free farmer)', 'Craftsman-trader', 'Hersir', 'Jarl', "King's kin"]]] },

  { id: 'AND', short: 'the Andes', adj: 'Andean', region: 'americas', from: -10000,
    names: [[-3500, 'the Andean foragers', 'Forager bands'], [-1800, 'Caral and the Norte Chico', 'Temple towns'], [-200, 'Chavín de Huántar', 'Cult centre'], [700, 'the Moche and Nazca', 'Kingdoms'], [1000, 'Tiwanaku and Wari', 'Empires'], [1438, 'the Chimú and Andean kingdoms', 'Kingdoms'], [1533, 'the Inca Empire, Tawantinsuyu', 'Empire'], [1821, 'the Viceroyalty of Peru', 'Spanish colony'], [99999, 'the Republic of Peru', 'Republic']],
    pools: [[700, 'andean_pre'], [1533, 'quechua'], [2029, 'spanish']],
    cur: [[1533, "cloth and labour (mit'a)", '', 6], [1821, 'pieces of eight', 'rs ', 12], [1913, 'soles', 'S/', 15], [1945, 'soles', 'S/', 3], [1999, 'soles', 'S/', 0.4], [2029, 'soles', 'S/', 0.27]],
    cap: [[-3500, 'Huaca Prieta'], [-1800, 'Caral'], [-200, 'Chavín de Huántar'], [700, 'Moche'], [1000, 'Tiwanaku'], [1438, 'Chan Chan'], [1533, 'Cusco'], [99999, 'Lima']],
    pop: [[-10000, 0.01], [-3000, 0.1], [1, 1], [1000, 3], [1500, 8], [1600, 1.5], [1800, 1.3], [1900, 3.7], [1950, 7.6], [2000, 26], [2025, 34], [2400, 40]],
    gen: { sk: 0.52, hd: 0.97, rd: 0, eb: 0.01, eg: 0.01, cu: 0.05, lac: 0.05, sc: 0.002, cf: 0.003, cb: 0.02, ht: [164, 152], nose: 'aquiline broad straight', bl: [0.05, 0.01], rh: 0.01 },
    laws: [[1438, 1533, "The Inca mit'a: every household owes labour to the state"], [1542, 1821, 'The New Laws forbid enslaving native people, and are often ignored'], [1955, 99999, 'Women vote']],
    cls: [[1438, 1533, ['Yanakuna servant', 'Hatun runa commoner', 'Craftsman', 'Kuraka local lord', 'Inca by privilege', 'Inca noble', "Sapa Inca's kin"]], [1534, 1821, ['Peon', 'Indigenous commoner', 'Mestizo artisan', 'Merchant', 'Criollo landowner', 'Peninsular official', 'Viceregal court']]] },
);

/* ---------- older lands, extended back to 10,000 BC ---------- */
(() => {
  const C = id => DATA.countries.find(c => c.id === id);
  const pre = (id, o) => {
    const c = C(id);
    c.from = Math.min(c.from, -10000);
    for (const k of ['names', 'pools', 'cur', 'cap', 'pop']) if (o[k]) c[k] = [...o[k], ...(c[k] || [])];
    if (o.genT) c.genT = o.genT;
    if (o.dairy != null) c.dairy = o.dairy;
    if (o.popReplace) c.pop = o.popReplace;
  };
  const BARTER = u => [u, 'barter goods', '', 8];
  pre('ENG', { names: [[-6500, 'Doggerland and the British peninsula', 'Hunter bands'], [-4000, 'Mesolithic Britain', 'Hunter-gatherer bands'], [-2500, 'Neolithic Britain: the henge builders', 'Farming chiefdoms'], [-800, 'Bronze Age Britain', 'Chiefdoms']], pools: [[-2500, 'meso']], cur: [BARTER(-150)], cap: [[-6500, 'Star Carr'], [-4000, 'Howick'], [-2500, 'Durrington Walls'], [-800, 'Flag Fen']], pop: [[-10000, 0.005], [-4000, 0.02]], genT: [[-4000, 'WHG'], [-2500, 'EEF']], dairy: -4000 });
  pre('FRA', { names: [[-5500, 'Mesolithic Gaul', 'Hunter-gatherer bands'], [-2500, 'Neolithic Gaul: the megalith builders', 'Farming chiefdoms'], [-800, 'Bronze Age Gaul', 'Chiefdoms']], pools: [[-2500, 'meso']], cur: [BARTER(-200)], cap: [[-5500, 'Téviec'], [-2500, 'Carnac'], [-800, 'Fort-Harrouard']], pop: [[-10000, 0.05], [-4000, 0.2]], genT: [[-5500, 'WHG'], [-2500, 'EEF']], dairy: -5500 });
  pre('ITA', { names: [[-6000, 'the Italian foragers', 'Hunter bands'], [-3300, 'Neolithic Italy: the Impressed Ware farmers', 'Farming villages'], [-1700, 'the Remedello and Polada peoples', 'Chiefdoms'], [-900, 'the Apennine and Terramare peoples', 'Chiefdoms'], [-753, 'the Villanovan and Etruscan lands', 'Tribes and city-states']], pools: [[-6000, 'meso'], [-900, 'catal'], [-753, 'etruscan']], cur: [BARTER(-3001), [-300, 'aes (bronze)', 'aes ', 1.5]], cap: [[-6000, "Grotta dell'Uzzo"], [-3300, 'Passo di Corvo'], [-1700, 'Remedello'], [-900, 'Santa Rosa'], [-753, 'Veii']], pop: [[-10000, 0.05], [-5000, 0.2], [-2000, 0.4]], genT: [[-6000, 'WHG'], [-2000, 'EEF']] });
  pre('GRC', { names: [[-7000, 'the Aegean foragers', 'Forager bands'], [-3200, 'Neolithic Greece: Sesklo and Dimini', 'Farming villages'], [-1600, 'the Minoan palaces and the Cyclades', 'Palace states'], [-1100, 'Mycenaean Greece', 'Palace kingdoms'], [-800, 'the Greek Dark Age', 'Villages and chiefdoms']], pools: [[-7000, 'meso'], [-1600, 'catal']], cur: [BARTER(-3001), [-600, 'obols', 'ob ', 3.3]], cap: [[-7000, 'Franchthi Cave'], [-3200, 'Sesklo'], [-1600, 'Knossos'], [-1100, 'Mycenae'], [-800, 'Argos']], pop: [[-10000, 0.03]], genT: [[-6800, 'WHG'], [-3200, 'EEF']] });
  pre('EGY', { names: [[-5000, 'the Nile hunter-fishers', 'Forager bands'], [-4400, 'the Faiyum and Merimde villages', 'Farming villages'], [-3900, 'the Badarian culture', 'Farming villages'], [-3100, 'Naqada Egypt', 'Chiefdoms and proto-kingdoms']], pools: [[-3100, 'nile_pre']], cur: [BARTER(-3001)], cap: [[-5000, 'Wadi Kubbaniya'], [-4400, 'Merimde'], [-3900, 'Badari'], [-3100, 'Nekhen']], pop: [[-10000, 0.1], [-5000, 0.3]] });
  pre('CHN', { names: [[-7000, 'the Yellow River foragers', 'Forager bands'], [-5000, 'the Peiligang and Cishan villages', 'Farming villages'], [-3000, 'the Yangshao culture', 'Farming villages'], [-2070, 'the Longshan towns', 'Chiefdoms'], [-1600, 'the Xia kingdom', 'Early kingdom'], [-1046, 'the Shang dynasty', 'Kingdom']], pools: [[-2070, 'yangshao']], cur: [BARTER(-3001), [-1046, 'cowrie shells', '', 0.4]], cap: [[-5000, 'Jiahu'], [-3000, 'Banpo'], [-2070, 'Taosi'], [-1600, 'Erlitou'], [-1046, 'Yin']], pop: [[-10000, 0.5], [-5000, 2]] });
  pre('IND', { names: [[-7000, 'the Indus foothill foragers', 'Forager bands'], [-3300, 'Mehrgarh and the Baluchi villages', 'Farming villages'], [-1300, 'the Indus Valley civilisation', 'City-states'], [-600, 'the Vedic tribes', 'Tribal kingdoms']], pools: [[-1300, 'indus']], cur: [BARTER(-3001), [-600, 'copper bars', 'cb ', 4]], cap: [[-7000, 'Bhimbetka'], [-3300, 'Mehrgarh'], [-1300, 'Mohenjo-daro'], [-600, 'Hastinapura']], pop: [[-10000, 1]] });
  pre('IRN', { names: [[-6000, 'the Zagros foragers and herders', 'Forager and herder bands'], [-4000, 'the Susiana villages', 'Farming villages'], [-2700, 'Proto-Elamite Susa', 'City-state']], pools: [[-2700, 'zagros']], cur: [BARTER(-3001)], cap: [[-6000, 'Ganj Dareh'], [-4000, 'Chogha Mish']], pop: [[-10000, 0.2]] });
  pre('JPN', { names: [[-300, 'the Jōmon islands', 'Hunter-gatherer villages']], pools: [[-300, 'jomon']], cur: [BARTER(-300)], cap: [[-300, 'Sannai-Maruyama']], pop: [[-10000, 0.02], [-3000, 0.26]] });
  pre('MEX', { names: [[-7000, 'the Archaic foragers of the highlands', 'Forager bands'], [-2500, 'the first maize farmers', 'Villages'], [-1500, 'the Early Formative villages', 'Villages']], pools: [[-1500, 'native_na']], cur: [BARTER(-1500)], cap: [[-7000, 'Guilá Naquitz'], [-2500, 'Tehuacán'], [-1500, 'Paso de la Amada']], pop: [[-10000, 0.02]] });
  pre('WAF', { names: [[-5000, 'the Green Sahara hunters', 'Forager bands'], [-2500, 'the Saharan cattle herders', 'Herding clans'], [-1500, 'the Kintampo farmers', 'Villages']], cur: [BARTER(-500)], cap: [[-5000, 'Gobero'], [-2500, 'Dhar Tichitt'], [-1500, 'Kintampo']], pop: [[-10000, 0.2]] });
  pre('RUS', { names: [[-5000, 'the Pontic-Caspian hunters', 'Forager bands'], [-3300, 'the Sredny Stog horse herders', 'Herding clans'], [-2600, 'the Yamnaya steppe', 'Pastoral clans'], [-1000, 'the Srubnaya and Andronovo steppe', 'Chiefdoms'], [-200, 'Scythia', 'Nomad kingdoms'], [370, 'Sarmatia', 'Nomad confederations'], [862, 'the Slavic tribes', 'Tribes']], pools: [[-1000, 'steppe'], [370, 'scythian']], cur: [BARTER(-200), [862, 'silver dirhams', 'dir ', 30]], cap: [[-5000, 'Mariupol'], [-3300, 'Dereivka'], [-2600, 'Mikhaylovka'], [-1000, 'Sintashta'], [-200, 'Gelonus'], [370, 'Tanais'], [862, 'Novgorod']], pop: [[-10000, 0.05], [-3000, 0.3], [1, 2]], genT: [[-3300, 'EHG']], dairy: -4000 });
  pre('USA', { names: [[-9000, 'the Clovis hunting grounds', 'Hunter bands'], [-1000, 'the Archaic woodlands and plains', 'Forager bands'], [1000, 'the Adena and Hopewell mound builders', 'Chiefdoms'], [1400, 'Cahokia and the Mississippian chiefdoms', 'Chiefdoms'], [1607, 'the Native American nations', 'Tribal nations']], pools: [[1607, 'native_na']], cur: [[1607, 'wampum and trade goods', '', 5]], cap: [[-9000, 'Blackwater Draw'], [-1000, 'Poverty Point'], [1000, 'Hopewell'], [1400, 'Cahokia'], [1607, 'Werowocomoco']], genT: [[1607, 'NATIVE']],
    popReplace: [[-10000, 0.1], [1000, 2], [1500, 5], [1607, 3], [1700, 1.5], [1800, 5.3], [1900, 76], [1950, 152], [2000, 282], [2025, 340], [2400, 420]] });
})();

/* ---------- when farming, herding and copper arrive ---------- */
DATA.neolithic = {
  LEV: { farm: -9000, herd: -8500, copper: -4500 }, ANA: { farm: -8500, herd: -8300, copper: -5500 }, MSP: { farm: -8000, herd: -8000, copper: -5000 },
  IRN: { farm: -8000, herd: -8500, copper: -5000 }, EGY: { farm: -5500, herd: -6000, copper: -4000 }, GRC: { farm: -6800, herd: -6800, copper: -4500 },
  ITA: { farm: -6000, herd: -6000, copper: -4000 }, FRA: { farm: -5500, herd: -5500, copper: -3500 }, ENG: { farm: -4000, herd: -4000, copper: -2500 },
  SCA: { farm: -4000, herd: -4000, copper: -2000 }, RUS: { farm: -6000, herd: -5000, copper: -4500 }, IND: { farm: -7000, herd: -7000, copper: -4000 },
  CHN: { farm: -7500, herd: -6000, copper: -3000 }, JPN: { farm: -900, herd: -300, copper: -300 }, MAG: { farm: -5000, herd: -6000, copper: -2000 },
  WAF: { farm: -2500, herd: -5000, copper: -1500 }, MEX: { farm: -5000, herd: 99999, copper: 600 }, USA: { farm: -2000, herd: 99999, copper: -4000 },
  AND: { farm: -4000, herd: -4000, copper: -1500 },
};

/* ---------- regional events, jobs, activities and holidays ---------- */
Object.assign(DATA.countryEvents, {
  LEV: [
    { id: 'olivepress', p: 0.05, min: 8, from: -5000, t: 'The olive harvest was heavy and the presses ran day and night.', fx: { hp: 4, $c: 0.05 } },
    { id: 'caravanlev', p: 0.04, min: 16, from: -2000, t: 'A camel caravan from the south arrived with incense and news.', ch: [{ l: 'Trade with them', fx: { $c: -0.05, im: 2, hp: 3 }, t: 'You bought frankincense and heard tales of Arabia.' }, { l: 'Just listen to the news', fx: { sm: 1 }, t: 'You learned more about the world in an evening than in a year.' }] },
    { id: 'gazellehunt', p: 0.06, min: 12, to: -7000, t: 'Gazelles were migrating through the valley. The whole hamlet turned out to hunt them.', fx: { $c: 0.08, rep: 2, hp: 3 } },
  ],
  MSP: [
    { id: 'tigrisflood', p: 0.06, min: 1, to: 1950, t: 'The Tigris flooded without warning and swept away the dykes.', fx: { h: [-8, 0], $c: -0.08 } },
    { id: 'canalduty', p: 0.06, min: 16, from: -5500, to: 1900, t: 'The temple calls every household to dredge the irrigation canals.', ch: [{ l: 'Dig with your neighbours', fx: { h: -2, rep: 3 }, t: 'Mud to your waist, but the water flows again.' }, { l: 'Send a substitute (pay)', fx: { $c: -0.05 }, t: 'Someone poorer dug your share.' }] },
    { id: 'tablet', p: 0.04, min: 8, from: -3300, to: 100, t: 'A scribe showed you how wedges pressed into clay can hold words.', fx: { sm: 3 } },
  ],
  ANA: [
    { id: 'quakeana', p: 0.03, min: 1, t: 'An earthquake cracked the hillsides and brought down old walls.', fx: { h: [-12, 0], mh: -3 } },
    { id: 'obsidianana', p: 0.05, min: 12, to: -3000, t: 'You climbed the volcano to quarry black glass for trading.', fx: { $c: 0.06, h: -1 } },
    { id: 'bullrite', p: 0.04, min: 10, from: -7400, to: -5700, t: 'The town painted bulls and leopards on the shrine walls for the festival.', fx: { im: 3, hp: 3 } },
  ],
  MAG: [
    { id: 'snails', p: 0.06, min: 4, from: -8000, to: -4000, t: 'The land snails were plentiful this year. The midden by the camp grew taller.', fx: { h: 2, hp: 2 } },
    { id: 'sirocco', p: 0.05, min: 1, t: 'The sirocco blew hot sand in from the desert for a week.', fx: { h: -2, hp: -2 } },
    { id: 'corsairs', p: 0.04, min: 16, from: 1500, to: 1830, t: 'Corsairs brought in a rich captured ship. The harbour was full of goods for sale.', ch: [{ l: 'Buy cheap plunder', fx: { $c: -0.05, hp: 4 }, t: 'You bought fine cloth for a pittance. Best not to ask where it came from.' }, { l: 'Stay away', fx: { rep: 1 }, t: 'Stolen goods bring bad luck, your mother always said.' }] },
  ],
  SCA: [
    { id: 'sealhunt', p: 0.06, min: 12, to: 1900, t: 'The seals came ashore on the skerries.', ch: [{ l: 'Row out and hunt', odds: 0.65, win: { fx: { $c: 0.1, rep: 2 }, t: 'You came home with meat, oil and skins.' }, alt: { fx: { h: -10 }, t: 'A wave overturned the boat. You nearly froze.' } }, { l: 'Stay by the fire', t: 'Someone had to mind the fire.' }] },
    { id: 'polarnight', p: 0.07, min: 1, from: -2000, t: 'The long winter dark settled in. The sun barely rose for weeks.', fx: { mh: -3 } },
    { id: 'thing', p: 0.05, min: 16, from: 500, to: 1300, t: 'The free people gather at the Thing to settle disputes and make law.', ch: [{ l: 'Speak at the Thing', odds: p => 0.4 + p.rep / 200, win: { fx: { rep: 6, fm: 2 }, t: 'Your words carried the day.' }, alt: { fx: { rep: -2 }, t: 'You were shouted down.' } }, { l: 'Just listen', fx: { sm: 1 }, t: 'You learned a great deal about your neighbours.' }] },
  ],
  AND: [
    { id: 'quakeand', p: 0.04, min: 1, t: 'An earthquake shook the valley. The stone walls held; the adobe ones did not.', fx: { h: [-12, 0], $c: -0.05 } },
    { id: 'elnino', p: 0.05, min: 1, t: 'Warm waters came to the coast. The fish vanished and the rains became floods.', fx: { h: -4, $c: -0.08 } },
    { id: 'mita', p: 0.08, min: 16, max: 50, from: 1438, to: 1780, t: "Your household's turn for labour service has come.", ch: [{ l: 'Serve your turn', fx: { h: -5, rep: 3 }, t: 'You laboured for a season on roads and terraces far from home.' }, { l: 'Hide in the high valleys', odds: 0.5, win: { fx: { hp: 2 }, t: 'Nobody came looking.' }, alt: { fx: { jail: 1, rep: -4 }, t: 'You were found and punished.' } }] },
  ],
  // prehistoric colour for the older lands
  ENG: [...DATA.countryEvents.ENG, { id: 'doggerflood', p: 0.06, min: 1, from: -8000, to: -6200, t: 'The sea crept further up the marsh this year. The old hunting grounds are underwater.', fx: { hp: -3, im: 1 } }],
  EGY: [...DATA.countryEvents.EGY, { id: 'greensahara', p: 0.05, min: 6, from: -9000, to: -4000, t: 'The rains filled the desert lakes. Giraffes and elephants came to drink.', fx: { hp: 3, im: 2 } }],
  JPN: [...DATA.countryEvents.JPN, { id: 'shellmound', p: 0.06, min: 4, to: -300, t: 'The shellfish harvest was so good the shell mound grew as tall as a man.', fx: { h: 2, hp: 3 } }],
  RUS: [...DATA.countryEvents.RUS, { id: 'kurgan', p: 0.04, min: 12, from: -4000, to: -1000, t: 'A great chief died, and the clans raised a kurgan mound over his grave with his horses and wagon.', fx: { im: 2, rep: 1 } }],
  USA: [...DATA.countryEvents.USA, { id: 'bisonrun', p: 0.05, min: 12, to: 1600, t: 'The hunters drove a bison herd over the cliff edge. There was meat for the whole winter.', fx: { $c: 0.1, rep: 2, hp: 3 } }],
  CHN: [...DATA.countryEvents.CHN, { id: 'milletyear', p: 0.05, min: 4, from: -7000, to: -2000, t: 'The millet harvest was so rich the storage pits overflowed.', fx: { hp: 3, $c: 0.05 } }],
});
Object.assign(DATA.countryJobs, {
  LEV: [['Purple Dye Maker', 1.4, { from: -1500, to: 600 }], ['Cedar Logger', 1.1, { to: 1000, risk: 0.02 }], ['Phoenician Sailor', 1.3, { from: -1200, to: -146, risk: 0.04 }], ['Glassblower', 1.6, { from: -100, im: 30 }]],
  MSP: [['Temple Scribe', 3, { from: -3200, to: -330, edu: 1, sm: 45 }], ['Canal Digger', 0.9, { from: -5500, to: 1500, risk: 0.01 }], ['Date Farmer', 1, { from: -5000 }], ['Oil Worker', 3, { from: 1927, risk: 0.02 }]],
  ANA: [['Obsidian Knapper', 1.2, { to: -2000, sm: 20 }], ['Chariot Driver', 1.6, { from: -1650, to: -1178, sex: 'M', risk: 0.04, fame: 1 }], ['Janissary', 2, { from: 1383, to: 1826, sex: 'M', risk: 0.04 }], ['Carpet Seller', 1.3, { from: 1071 }]],
  MAG: [['Snail Gatherer', 0.9, { to: -3000 }], ['Carthaginian Merchant', 3, { from: -814, to: -146, vol: 0.4, sm: 35 }], ['Corsair', 2.5, { from: 1500, to: 1830, risk: 0.06, vol: 0.6 }], ['Date Grower', 1, { from: -2000 }]],
  SCA: [['Seal Hunter', 1, { risk: 0.03 }], ['Amber Trader', 2, { from: -2000, vol: 0.4 }], ['Viking Raider', 2.5, { from: 793, to: 1066, sex: 'M', risk: 0.08, fame: 2, vol: 0.6 }], ['Skald', 1.5, { from: 800, to: 1300, im: 50, fame: 1 }], ['Furniture Designer', 2.5, { from: 1930, im: 55 }]],
  AND: [['Llama Herder', 1, { from: -4000 }], ['Quipu Keeper', 3, { from: 1000, to: 1570, sm: 50 }], ['Chasqui Runner', 1.3, { from: 1438, to: 1533, risk: 0.02 }], ['Silver Miner', 1.2, { from: 1545, risk: 0.06 }]],
});
Object.assign(DATA.countryActs, {
  LEV: [{ id: 'deadsea', n: 'Float in the Dead Sea', d: 'Too salty to sink.', min: 5, c: 0.01, fx: { hp: 5, h: 1 }, t: 'You bobbed like a cork and laughed until salt got in your eyes.' }, { id: 'cedars', n: 'Walk among the cedars', d: 'The oldest trees you will ever see.', min: 5, c: 0.005, fx: { mh: 3, im: 2 }, t: 'The cedars creaked above you like old men talking.' }],
  MSP: [{ id: 'ziggurat', n: 'Climb the ziggurat', d: 'Closer to the gods.', from: -2100, to: 300, min: 8, c: 0.005, fx: { im: 3, hp: 2 }, t: 'From the top you could see the whole green plain between the rivers.' }, { id: 'gilgamesh', n: 'Hear the tale of Gilgamesh', d: 'The oldest story ever told.', from: -2100, min: 6, c: 0, fx: { im: 3, sm: 1 }, t: 'You wept for Enkidu with everyone else.' }],
  ANA: [{ id: 'cappadocia', n: 'Explore the Cappadocian caves', d: 'Whole towns carved into rock.', min: 8, c: 0.01, fx: { im: 4, hp: 2 }, t: 'You wandered rooms carved into the stone chimneys.' }, { id: 'hammam', n: 'Steam in a hammam', d: 'Marble, heat and a vigorous scrub.', from: 1071, min: 6, c: 0.005, fx: { h: 2, hp: 4 }, t: 'You emerged pink, clean and very relaxed.' }],
  MAG: [{ id: 'sahararide', n: 'Ride into the Sahara', d: 'Dunes and silence.', from: -1000, min: 12, c: 0.02, fx: { im: 4, hp: 3, h: -1 }, t: 'You slept under more stars than you knew existed.' }, { id: 'minttea', n: 'Share mint tea in the souk', d: 'Poured from a great height.', from: 1700, min: 8, c: 0.002, fx: { hp: 3 }, t: 'Three glasses, as is proper.' }],
  SCA: [{ id: 'sauna', n: 'Sweat in a sauna', d: 'Then roll in the snow.', min: 8, c: 0.002, fx: { h: 2, mh: 3 }, t: 'Your heart hammered. You felt reborn.' }, { id: 'aurora', n: 'Watch the northern lights', d: 'Green fire across the sky.', min: 3, c: 0, fx: { im: 4, mh: 2 }, t: 'The sky rippled green and violet for an hour.' }],
  AND: [{ id: 'machupicchu', n: 'Climb to Machu Picchu', d: 'A city in the clouds.', from: 1450, min: 10, c: 0.02, fx: { im: 4, h: 1 }, t: 'Mist lifted off the terraces as you arrived.' }, { id: 'titicaca', n: 'Sail on Lake Titicaca', d: 'Reed boats, high sky.', min: 6, c: 0.01, fx: { hp: 4, im: 2 }, t: 'The reed boat rocked gently on the bluest water you have seen.' }],
});
Object.assign(DATA.holidays, {
  LEV: [['the olive harvest festival', -6000, 636], ['Eid al-Fitr', 636]], MSP: [['Akitu, the New Year festival', -2500, -330], ['Eid al-Fitr', 637]],
  ANA: [['the Hittite spring festival', -1650, -1178], ['Easter', 330, 1453], ['Eid al-Adha', 1071]], MAG: [['Yennayer, the Amazigh New Year', -950], ['Eid al-Fitr', 698]],
  SCA: [['Midsummer', -3000], ['Yule', 500]], AND: [['Inti Raymi, the Festival of the Sun', 1200, 1572], ['Corpus Christi', 1572], ['Inti Raymi, revived', 1944]],
});
// every land keeps the old seasonal gatherings before recorded history
for (const c of DATA.countries) if (c.region !== 'space') { DATA.holidays[c.id] ||= []; DATA.holidays[c.id].unshift(['the midwinter gathering', -10000, -1000], ['the harvest moon feast', -9000, -500]); }

/* ---------- named settlements: [name, founded, abandoned (0 = still there), 'year:level ...'] ---------- */
DATA.cities = {
  ENG: [['Star Carr', -9300, -8000, '-9300:1'], ['Skara Brae', -3180, -2500, '-3180:2'], ['Camulodunum>600>Colchester', -20, 0, '-20:3 50:4 400:2 1100:3'], ['Londinium>600>London', 47, 0, '47:3 100:4 410:2 886:3 1100:4 1600:5 1800:6'], ['Eboracum>900>York', 71, 0, '71:3 900:3 1300:4 1700:3 1850:4'], ['Venta>700>Winchester', 70, 0, '70:3 1100:4 1400:3'], ['Mamucium>1300>Manchester', 79, 0, '79:2 1750:3 1790:4 1850:5'], ['Bristol', 1000, 0, '1000:3 1400:4 1900:4']],
  FRA: [['Téviec', -6000, -4500, '-6000:1'], ['Carnac', -4500, -2000, '-4500:2'], ['Bibracte', -200, 10, '-200:3'], ['Lutetia>500>Paris', -250, 0, '-250:2 50:3 1000:4 1200:5 1700:6'], ['Massalia>500>Marseille', -600, 0, '-600:3 -100:4 500:3 1600:4 1850:5'], ['Lugdunum>500>Lyon', -43, 0, '-43:3 50:4 400:3 1500:4 1900:5'], ['Burdigala>500>Bordeaux', -300, 0, '-300:2 100:3 1400:4']],
  ITA: [["Grotta dell'Uzzo", -9000, -5000, '-9000:0'], ['Passo di Corvo', -6000, -4000, '-6000:2'], ['Veii', -900, -396, '-900:3 -600:4'], ['Rome', -753, 0, '-753:2 -500:4 -200:5 50:6 400:5 550:3 1500:4 1870:5 1950:6'], ['Mediolanum>600>Milan', -400, 0, '-400:3 300:4 1300:5 1950:6'], ['Venice', 500, 0, '500:2 800:3 1100:4 1400:5 1800:4'], ['Neapolis>600>Naples', -600, 0, '-600:3 1300:4 1600:5'], ['Florentia>600>Florence', -59, 0, '-59:3 1200:4 1300:5 1500:4']],
  GRC: [['Franchthi', -10000, -3000, '-10000:0 -7000:1'], ['Sesklo', -6800, -4000, '-6800:2 -5500:3'], ['Knossos', -7000, 400, '-7000:2 -2000:3 -1700:4 -1100:2 -300:3'], ['Mycenae', -1600, -1100, '-1600:3'], ['Athens', -3000, 0, '-3000:1 -1400:2 -800:3 -500:4 -430:5 100:4 600:3 1500:2 1834:3 1900:4 1950:5'], ['Sparta', -900, 0, '-900:3 -500:4 400:2'], ['Thessaloniki', -315, 0, '-315:3 400:4 1950:5']],
  EGY: [['Nabta Playa', -7500, -4000, '-7500:0 -6000:1'], ['Merimde', -5000, -4100, '-5000:2'], ['Nekhen', -4000, -1500, '-4000:2 -3500:3'], ['Memphis', -3100, 700, '-3100:4 -2500:5 -1000:4 300:3'], ['Thebes', -3200, 400, '-3200:2 -2000:4 -1500:5 -700:4 -100:3'], ['Alexandria', -331, 0, '-331:4 -200:5 700:4 1300:3 1900:5 1950:6'], ['Cairo', 969, 0, '969:4 1300:5 1950:6 2000:7']],
  CHN: [['Jiahu', -7000, -5700, '-7000:2'], ['Banpo', -4500, -3750, '-4500:2'], ['Taosi', -2300, -1900, '-2300:4'], ["Chang'an>1400>Xi'an", -202, 0, '-202:5 700:6 900:4 1950:5 2000:6'], ['Luoyang', -1046, 0, '-1046:3 -200:4 100:5 1000:4 1900:3 2000:5'], ['Hangzhou', -222, 0, '-222:2 600:3 1100:6 1500:5 1900:4 2000:6'], ['Beijing', -1045, 0, '-1045:2 900:3 1270:5 1420:6 2000:7'], ['Shanghai', 1000, 0, '1000:2 1300:3 1850:4 1900:5 1930:6 2000:7']],
  JPN: [['Sannai-Maruyama', -3900, -2200, '-3900:2'], ['Nara', 710, 0, '710:5 800:4 900:3'], ['Kyoto', 794, 0, '794:5 1700:6 1900:5'], ['Edo>1868>Tokyo', 1457, 0, '1457:2 1603:4 1700:6 1960:7'], ['Osaka', 1500, 0, '1500:3 1600:5 1900:6']],
  IND: [['Bhimbetka', -10000, -5000, '-10000:0'], ['Mehrgarh', -7000, -2600, '-7000:1 -5500:2'], ['Harappa', -2600, -1300, '-2600:4 -1900:2'], ['Mohenjo-daro', -2500, -1900, '-2500:4'], ['Pataliputra>1541>Patna', -490, 0, '-490:3 -300:5 600:3 1900:4'], ['Varanasi', -800, 0, '-800:3 1000:4'], ['Delhi', 1000, 0, '1000:3 1200:4 1350:5 1650:6 1800:4 1947:6 2000:7'], ['Bombay>1995>Mumbai', 1500, 0, '1500:1 1700:3 1800:4 1900:6 1990:7']],
  WAF: [['Gobero', -7700, -2500, '-7700:1'], ['Dhar Tichitt', -2200, -500, '-2200:2'], ['Jenne-Jeno', -250, 1400, '-250:2 400:3 800:4'], ['Koumbi Saleh', 700, 1300, '700:3 1000:4'], ['Timbuktu', 1100, 0, '1100:2 1300:4 1600:3 1900:2'], ['Kano', 999, 0, '999:3 1500:4 1950:5 2000:6'], ['Lagos', 1400, 0, '1400:2 1800:3 1900:4 1950:5 1980:6 2010:7']],
  MEX: [['Guilá Naquitz', -8000, -6000, '-8000:0'], ['San Lorenzo', -1500, -900, '-1500:3'], ['Teotihuacan', -100, 650, '-100:3 100:5'], ['Monte Albán', -500, 850, '-500:3 300:4'], ['Tenochtitlan>1521>Mexico City', 1325, 0, '1325:3 1400:4 1500:5 1521:3 1700:4 1900:5 1950:6 1990:7'], ['Puebla', 1531, 0, '1531:3 1700:4 1950:5']],
  IRN: [['Ganj Dareh', -8000, -7000, '-8000:1'], ['Susa', -4200, 1200, '-4200:3 -2500:4 600:3'], ['Persepolis', -518, -330, '-518:4'], ['Isfahan', -500, 0, '-500:2 700:3 1000:4 1600:6 1800:4 1950:5'], ['Tabriz', 700, 0, '700:3 1250:5 1900:4'], ['Tehran', 1200, 0, '1200:2 1786:3 1850:4 1900:5 1950:6 2000:7']],
  RUS: [['Mariupol', -6000, -4000, '-6000:0'], ['Dereivka', -4000, -3500, '-4000:2'], ['Sintashta', -2100, -1800, '-2100:3'], ['Gelonus', -500, 200, '-500:3'], ['Novgorod', 859, 0, '859:3 1100:4 1500:3'], ['Kiev', 482, 0, '482:2 900:4 1240:2 1800:3 1900:5'], ['Moscow', 1147, 0, '1147:2 1300:3 1400:4 1600:5 1900:6 2000:7'], ['St Petersburg', 1703, 0, '1703:4 1750:5 1850:6']],
  USA: [['Blackwater Draw', -11500, -8000, '-11500:0'], ['Poverty Point', -1700, -1100, '-1700:3'], ['Cahokia', 1050, 1350, '1050:4'], ['Jamestown', 1607, 1699, '1607:1'], ['Boston', 1630, 0, '1630:2 1700:3 1800:4 1900:5 1950:6'], ['Philadelphia', 1682, 0, '1682:3 1790:4 1850:5 1900:6'], ['New Amsterdam>1664>New York', 1624, 0, '1624:2 1700:3 1790:4 1830:5 1870:6 1930:7'], ['Chicago', 1833, 0, '1833:3 1850:4 1870:5 1890:6'], ['Los Angeles', 1781, 0, '1781:2 1880:3 1900:5 1930:6 1990:7']],
  LEV: [['Eynan', -12000, -9500, '-12000:1'], ['Jericho', -9600, 0, '-9600:2 -8000:3 -1500:2'], ["'Ain Ghazal", -7250, -5000, '-7250:3'], ['Byblos', -5000, 0, '-5000:2 -3000:3'], ['Tyre', -2750, 0, '-2750:3 -1000:4 -332:3 1900:2'], ['Damascus', -3000, 0, '-3000:2 -1000:3 700:5 1200:4 1950:5 2000:6'], ['Jerusalem', -3000, 0, '-3000:1 -1000:3 1:4 700:3 1950:4'], ['Antioch', -300, 0, '-300:4 100:5 600:4 1300:2']],
  MSP: [['Jarmo', -7000, -5000, '-7000:1'], ['Eridu', -5400, -2000, '-5400:2 -4000:3'], ['Uruk', -4500, 600, '-4500:2 -3500:4 -2900:5 -2000:4 -300:3'], ['Ur', -3800, -500, '-3800:3 -2100:5 -1500:3'], ['Babylon', -2300, 200, '-2300:3 -1800:4 -600:5 -100:3'], ['Nineveh', -6000, -600, '-6000:1 -3000:2 -1000:4 -700:5'], ['Baghdad', 762, 0, '762:5 800:6 1258:3 1900:4 1950:5 2000:6'], ['Basra', 636, 0, '636:4 800:5 1400:3 1950:4']],
  ANA: [['Göbekli Tepe', -9600, -8200, '-9600:0'], ['Çatalhöyük', -7100, -5700, '-7100:2 -7000:3'], ['Troy', -3000, 500, '-3000:2 -1700:3 -1200:2'], ['Hattusa', -1650, -1178, '-1650:4'], ['Byzantium>330>Constantinople>1930>Istanbul', -657, 0, '-657:3 330:5 500:6 1204:5 1453:4 1550:6 1990:7'], ['Ankara', -1000, 0, '-1000:2 100:3 1923:4 1950:5 2000:6'], ['Konya', -3000, 0, '-3000:2 1100:4']],
  MAG: [['Taforalt', -20000, -9000, '-20000:0'], ['Columnata', -8000, -5000, '-8000:0'], ['Carthage', -814, 698, '-814:3 -500:5 -146:1 -44:3 100:5 439:4'], ['Cirta>313>Constantine', -300, 0, '-300:3 1900:4'], ['Hippo Regius>1000>Annaba', -800, 0, '-800:3 400:4'], ['Tlemcen', 700, 0, '700:3 1300:4 1900:3'], ['Algiers', 944, 0, '944:3 1500:4 1950:5 2000:6']],
  SCA: [['Stellmoor', -10500, -9500, '-10500:0'], ['Ertebølle', -5300, -3950, '-5300:1'], ['Sarup', -3400, -2800, '-3400:2'], ['Hedeby', 770, 1066, '770:3'], ['Uppsala', 500, 0, '500:2 1100:3'], ['Copenhagen', 1043, 0, '1043:2 1200:3 1500:4 1850:5'], ['Stockholm', 1252, 0, '1252:3 1600:4 1900:5'], ['Oslo', 1040, 0, '1040:2 1300:3 1900:4']],
  AND: [['Huaca Prieta', -13000, -3000, '-13000:0 -5000:1'], ['Caral', -3000, -1800, '-3000:3'], ['Chavín de Huántar', -900, -200, '-900:3'], ['Tiwanaku', -1500, 1000, '-1500:1 400:4'], ['Chan Chan', 850, 1470, '850:3 1200:4'], ['Cusco', 1100, 0, '1100:3 1438:4 1533:3 1950:4'], ['Lima', 1535, 0, '1535:3 1600:4 1940:5 1970:6 2000:7']],
  MAR: [['Jezero Station', 2041, 0, '2041:1 2080:3 2200:4 2300:5'], ['Olympus Dome', 2090, 0, '2090:2 2200:4']],
  LUN: [['Shackleton City', 2070, 0, '2070:2 2110:4 2300:5'], ['Tycho Base', 2080, 0, '2080:2 2200:3']],
  BLT: [['Ceres Hub', 2150, 0, '2150:3 2250:5'], ['Vesta Station', 2170, 0, '2170:3']],
};

/* ---------- prehistoric and migration history ---------- */
(() => {
  const X = (y, type, t, where, o = {}) => Object.assign({ y, type, t, key: `${type}${y}${where ? where.join('') : ''}`, where }, o);
  DATA.history.unshift(
    X(-9700, 'tech', 'The last great cold snap ends. The ice melts, the seas rise and forests march north.'),
    X(-9600, 'culture', 'In the hills of Anatolia, hunters raise great carved pillars at Göbekli Tepe.', ['ANA', 'LEV', 'MSP']),
    X(-9000, 'tech', 'In the Fertile Crescent, people begin to sow the wild wheat and barley they once only gathered.', ['LEV', 'ANA', 'MSP', 'IRN']),
    X(-8500, 'tech', 'Goats and sheep are tamed in the Zagros hills.', ['IRN', 'MSP', 'ANA', 'LEV']),
    X(-8000, 'culture', 'Jericho raises a great stone tower and wall beside its spring.', ['LEV']),
    X(-7500, 'culture', 'Çatalhöyük grows into a crowded town, its houses entered through the roofs.', ['ANA']),
    X(-7000, 'tech', 'Rice is farmed along the Yangtze, and millet along the Yellow River.', ['CHN']),
    X(-6500, 'disaster', 'The rising sea swallows Doggerland. Britain becomes an island.', ['ENG', 'SCA'], { p: 0.03, fx: { hp: -6 }, loss: 0.2 }),
    X(-6200, 'famine', 'A sudden cold, dry age grips the world for two centuries.', null, { end: -6150, n: 'Great Chill', mort: 0.006, dmg: 4 }),
    X(-5500, 'culture', 'The Sahara is green. Herders graze cattle beside lakes full of hippos.', ['EGY', 'WAF', 'MAG']),
    X(-5000, 'tech', 'Copper is smelted from green stones for the first time.', ['ANA', 'IRN', 'MSP', 'LEV']),
    X(-5000, 'war', 'Raiders wipe out whole villages of the first farmers. Mass graves tell the story.', ['FRA', 'SCA', 'ITA'], { end: -4980, n: 'Neolithic raids', draft: 0.04, mort: 0.05, civ: 0.003 }),
    X(-4500, 'culture', 'Megalith builders raise great stone tombs and rows along the Atlantic coasts.', ['FRA', 'ENG', 'MAG']),
    X(-4000, 'tech', 'On the steppe, people learn to ride and herd the horse.', ['RUS']),
    X(-3800, 'disaster', 'The rains fail over the Sahara. Herders drift toward the Nile and the south.', ['EGY', 'WAF', 'MAG'], { end: -3700, p: 0.01, fx: { h: -5 }, loss: 0.1 }),
    X(-3500, 'tech', 'The wheel and the plough appear.', ['MSP', 'ANA', 'RUS', 'LEV']),
    X(-3400, 'tech', 'In Uruk, temple scribes press the first writing into wet clay.', ['MSP']),
    X(-3300, 'culture', 'A man later called Ötzi dies high in the Alps, an arrowhead in his shoulder.', ['ITA']),
    X(-3200, 'culture', 'Newgrange is built so that the midwinter sunrise floods its passage.', ['ENG']),
    X(-3100, 'politics', 'Upper and Lower Egypt are united under one king.', ['EGY']),
  );
  DATA.history.push(
    X(-2334, 'politics', 'Sargon of Akkad conquers the Sumerian cities and founds the first empire.', ['MSP']),
    X(-1754, 'law', "Hammurabi's law code is carved in stone.", ['MSP']),
    X(-1274, 'war', 'Hittites and Egyptians clash at Kadesh.', ['ANA'], { n: 'Battle of Kadesh', draft: 0.1, mort: 0.05 }),
    X(-814, 'politics', 'Phoenician settlers from Tyre found Carthage.', ['MAG', 'LEV']),
    X(-586, 'war', 'Babylon destroys Jerusalem and carries its people into exile.', ['LEV', 'MSP'], { n: 'Babylonian conquest', draft: 0.1, mort: 0.06, civ: 0.01 }),
    X(-146, 'war', 'Rome destroys Carthage and sows its fields with salt, or so the story goes.', ['MAG', 'ITA'], { end: -146, n: 'Third Punic War', draft: 0.15, mort: 0.1, civ: 0.02 }),
    X(70, 'war', 'Rome crushes the Jewish revolt and burns the Temple in Jerusalem.', ['LEV'], { n: 'First Jewish–Roman War', draft: 0.1, mort: 0.08, civ: 0.02 }),
    X(762, 'culture', 'The Abbasids found Baghdad, the round city, soon the greatest in the world.', ['MSP']),
    X(793, 'war', 'The Viking age begins: longships raid the coasts of Europe.', ['SCA', 'ENG', 'FRA'], { end: 1066, n: 'Viking raids', draft: 0.02, mort: 0.05 }),
    X(1071, 'war', 'The Seljuks defeat the Byzantines at Manzikert and pour into Anatolia.', ['ANA', 'GRC'], { n: 'Battle of Manzikert', draft: 0.1, mort: 0.06 }),
    X(1099, 'war', 'Crusaders storm Jerusalem.', ['LEV', 'FRA'], { n: 'First Crusade', draft: 0.05, mort: 0.08, civ: 0.02 }),
    X(1258, 'war', 'The Mongols sack Baghdad. The Abbasid Caliphate falls.', ['MSP'], { n: 'Mongol conquest of Baghdad', draft: 0.1, mort: 0.1, civ: 0.05 }),
    X(1453, 'politics', 'The Ottomans take Constantinople.', ['ANA', 'GRC']),
    X(1532, 'war', 'Pizarro captures Atahualpa. The Inca Empire falls to Spain.', ['AND'], { end: 1572, n: 'Spanish conquest of Peru', draft: 0.05, mort: 0.08, civ: 0.01 }),
    X(1546, 'plague', 'Epidemics brought from Europe sweep the Andes.', ['AND'], { end: 1560, n: 'Old World plagues', dn: 'Smallpox', inf: 0.2, let: 0.3, dmg: 25 }),
    X(1824, 'politics', 'Peru wins its independence at Ayacucho.', ['AND']),
    X(1830, 'war', 'France invades Algiers.', ['MAG', 'FRA'], { end: 1847, n: 'French conquest of Algeria', draft: 0.08, mort: 0.06, civ: 0.01 }),
    X(1922, 'politics', 'The Ottoman sultanate is abolished. A republic rises in Ankara the next year.', ['ANA']),
    X(1954, 'war', 'The Algerian War of Independence begins.', ['MAG', 'FRA'], { end: 1962, n: 'Algerian War', draft: 0.12, mort: 0.05, civ: 0.01 }),
    X(1948, 'war', 'War follows the founding of Israel; hundreds of thousands flee their homes.', ['LEV'], { end: 1949, n: '1948 War', draft: 0.1, mort: 0.04, civ: 0.005 }),
    X(1980, 'war', 'War between Iran and Iraq begins.', ['MSP'], { end: 1988, n: 'Iran–Iraq War', draft: 0.15, mort: 0.06 }),
    X(2003, 'war', 'An American-led coalition invades Iraq.', ['MSP', 'USA', 'ENG'], { end: 2011, n: 'Iraq War', draft: 0.02, mort: 0.03, civ: 0.004 }),
    X(2011, 'war', 'Civil war breaks out in Syria.', ['LEV'], { end: 2020, n: 'Syrian Civil War', draft: 0.1, mort: 0.05, civ: 0.008 }),
    // migrations: genes and people flow from 'from' into 'where'
    X(-6500, 'migration', 'Farmers from Anatolia cross into Greece with wheat, goats and pottery.', ['GRC'], { end: -5500, from: ['ANA'], mix: 0.003 }),
    X(-5500, 'migration', 'Farming families push up the Danube and along the Mediterranean shore.', ['ITA', 'FRA'], { end: -4500, from: ['ANA', 'GRC'], mix: 0.003 }),
    X(-4000, 'migration', 'Farmers cross the sea to Britain and the North with cattle and seed.', ['ENG', 'SCA'], { end: -3500, from: ['FRA'], mix: 0.003 }),
    X(-3000, 'migration', 'Herders from the steppe sweep west and south with horses, wagons and a new language.', ['FRA', 'ENG', 'SCA', 'GRC', 'ITA', 'IND', 'IRN'], { end: -2300, from: ['RUS'], mix: 0.002 }),
    X(-1000, 'migration', 'Bantu-speaking farmers spread south and east from West Africa, carrying iron and yams.', ['WAF'], { end: 500, out: 1 }),
    X(375, 'migration', 'The Huns cross the Volga. The Goths flee into the Roman Empire.', ['RUS', 'ITA', 'FRA', 'GRC'], { end: 568, from: ['RUS'], mix: 0.0008 }),
    X(1845, 'migration', 'Famine drives millions from Ireland and Britain to America.', ['USA'], { end: 1855, from: ['ENG'], mix: 0.002 }),
    X(1880, 'migration', 'The great wave: millions sail from Italy, Russia and beyond to America.', ['USA'], { end: 1914, from: ['ITA', 'RUS', 'SCA'], mix: 0.0015 }),
    X(1916, 'migration', 'The Great Migration: millions of Black Americans move from the rural South to northern cities.', ['USA'], { end: 1970, urban: 1 }),
    X(1948, 'migration', 'The Windrush years: migrants from the Caribbean, Africa and India help rebuild Britain.', ['ENG'], { end: 1972, from: ['WAF', 'IND'], mix: 0.0008 }),
    X(1961, 'migration', 'Guest workers from Türkiye and the Maghreb come to work in Europe.', ['FRA', 'SCA'], { end: 1980, from: ['ANA', 'MAG'], mix: 0.0008 }),
    X(2015, 'migration', 'War in Syria drives millions to seek refuge in Türkiye and Europe.', ['ANA', 'SCA', 'FRA'], { end: 2017, from: ['LEV'], mix: 0.001 }),
    X(2090, 'migration', 'Climate refugees move toward the cooler north and the Mars domes.', ['RUS', 'SCA', 'MAR'], { end: 2140, from: ['IND', 'EGY', 'MEX', 'WAF'], mix: 0.001 }),
  );
  // the Bronze Age collapse and Black Death touched the new lands too
  for (const h of DATA.history) {
    if (h.key === 'war-1200' && h.where) h.where.push('ANA', 'LEV', 'MSP');
    if (h.key === 'plague1347' && h.where) h.where.push('LEV', 'MSP', 'ANA', 'MAG', 'SCA');
    if (h.key === 'war1914' && h.where) h.where.push('ANA', 'LEV', 'MSP');
    if (h.key === 'war1939' && h.where) h.where.push('SCA', 'MAG');
    if (h.key === 'plague541' && h.where) h.where.push('ANA', 'LEV');
  }
})();

/* ---------- era-wide extras for the Prehistory era ---------- */
DATA.classLadders.prehistory = ['Outcast', 'Poor kin', 'Band member', 'Skilled hand', 'Elder family', "Shaman's kin", "Chief's family"];
DATA.labels.mind.prehistory = 'Sit with the old healer and talk';
DATA.labels.create.prehistory = 'Carve a figure from bone';
DATA.labels.discipline.prehistory = 'Fast and keep watch alone';
DATA.labels.daydream.prehistory = 'Watch the fire and dream';
