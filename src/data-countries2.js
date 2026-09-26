/* =====================================================================
   COUNTRIES, part 2 — name pools, national history, country events,
   jobs, activities and holidays.
   ===================================================================== */

// Pools written as "male | female | family" word lists (underscores become spaces).
(() => {
  const P = {
    celt: 'Caratacus Cunobelin Bran Cadoc Tasciovanus Vercingetorix Brennus Cassivellaunus Maelgwn Owain Rhodri Dumnorix | Boudica Cartimandua Brigid Rhiannon Morwenna Enid Branwen Nia Seren Eira Gwen Aine | Iceni Brigantes Dumnonii Catuvellauni Trinovantes Silures Ordovices Parisii Belgae Cantiaci Arverni Aedui',
    anglo: 'Aelfric Eadric Godwin Leofwine Wulfstan Oswald Cuthbert Aethelred Edmund Harold Alfred Eadmund | Aelfgifu Eadgyth Hild Mildred Aethelflaed Godgifu Wulfrun Eadburh Cyneburh Leofrun Frideswide Aelswith | Aldwine Beornwulf Cenwulfing Eadwining Godricson Leofricson Oswaldson Wulfing Aelfwining Hereward Sigeberht Eadmer',
    greek: 'Alexandros Nikias Demosthenes Pericles Leonidas Themistokles Xenophon Kallias Aristides Philippos Kleon Herakleitos | Aspasia Phaedra Theano Kallisto Agape Chloe Iphigenia Penelope Daphne Thaleia Eudora Xanthe | Athenaios Spartiates Korinthios Milesios Thebaios Argeios Rhodios Delphios Samios Chalkideus Ionikos Kretikos',
    byzantine: 'Konstantinos Ioannes Basileios Michael Theodoros Nikephoros Leon Alexios Andronikos Manuel Romanos Georgios | Theodora Anna Eudokia Zoe Irene Maria Helena Sophia Euphrosyne Theophano Xene Eirene | Komnenos Doukas Palaiologos Angelos Laskaris Phokas Skleros Kantakouzenos Bryennios Kamateros Vatatzes Tornikes',
    greek_mod: 'Giorgos Dimitris Nikos Yannis Kostas Christos Panagiotis Vasilis Stavros Michalis Thanasis Spyros | Maria Eleni Katerina Vasiliki Sofia Anna Despina Georgia Dimitra Ioanna Eirini Panagiota | Papadopoulos Pappas Georgiou Oikonomou Nikolaidis Karagiannis Vlachos Dimitriou Konstantinidis Makris Alexiou Stavrou',
    egypt_anc: 'Ahmose Amenhotep Djedi Imhotep Khaemwaset Nebamun Paneb Ramose Senenmut Thutmose Kha Rekhmire | Nefertari Merit Tiye Hatshepsut Ankhesenamun Nebet Satiah Tia Iset Meryt Henut Nodjmet | of_Thebes of_Memphis of_Abydos of_Amarna of_Saqqara of_Edfu of_Giza of_Karnak of_Aswan of_Heliopolis of_Buto of_Bubastis',
    arabic: 'Ahmed Mohamed Mahmoud Hassan Hussein Omar Youssef Ibrahim Khaled Mostafa Tarek Karim | Fatima Aisha Mariam Nour Salma Heba Yasmin Layla Amina Zeinab Hoda Rania | El-Masry Hassan Abdel-Rahman Farouk Mansour Salem Nasser Khalil Gamal Soliman Fahmy Rashid',
    french: 'Jean Pierre Louis Jacques Guillaume Henri François Antoine Étienne Philippe Nicolas Olivier | Marie Jeanne Marguerite Catherine Anne Isabelle Louise Élisabeth Madeleine Sophie Camille Juliette | Martin Bernard Dubois Durand Leroy Moreau Laurent Lefèvre Girard Fontaine Rousseau Chevalier',
    italian: 'Marco Luca Giuseppe Antonio Francesco Alessandro Giovanni Paolo Andrea Stefano Matteo Roberto | Giulia Francesca Chiara Sara Martina Valentina Elena Maria Anna Alessia Federica Sofia | Rossi Russo Ferrari Esposito Bianchi Romano Colombo Ricci Marino Greco Bruno Gallo',
    chinese: 'Wei Jian Ming Hao Jun Lei Qiang Tao Zhiwei Guang Yong Bo | Mei Ling Hua Xiu Yan Jing Li Fang Lan Yu Ning Xia | Wang Li Zhang Liu Chen Yang Zhao Huang Zhou Wu Xu Sun',
    japanese: 'Hiroshi Takeshi Kenji Haruto Yuki Taro Ichiro Kaito Sora Daichi Masato Nobu | Sakura Hana Aiko Yui Mei Rin Haruka Emi Akane Kaori Nanami Chiyo | Sato Suzuki Takahashi Tanaka Watanabe Ito Yamamoto Nakamura Kobayashi Kato Yoshida Yamada',
    indian_anc: 'Chandragupta Ashoka Vikram Arjuna Kautilya Harsha Samudra Bhima Devadatta Kalidasa Aryabhata Vishnu | Sita Draupadi Savitri Gargi Maitreyi Kunti Damayanti Shakuntala Lopamudra Sanghamitra Padmavati Urvashi | Maurya Gupta Sharma Varma Chola Pandya Satavahana Pallava Kadamba Chalukya Vakataka Kushana',
    indian: 'Rahul Amit Arjun Vikram Rohan Sanjay Anil Rajesh Imran Farhan Suresh Karan | Priya Anjali Neha Pooja Kavita Sunita Aisha Meera Lakshmi Divya Fatima Radha | Sharma Patel Singh Kumar Gupta Khan Reddy Iyer Das Mehta Nair Chopra',
    westafrica_anc: 'Sundiata Musa Sakura Askia Sonni Tiramakhan Fakoli Bakary Mamadou Soumaoro Dankaran Kankou | Sogolon Nana Kassa Kolonkan Tassey Djeneba Fanta Assa Mariama Aminata Kadiatou Sira | Keita Traoré Touré Diarra Konaté Cissé Camara Kouyaté Sidibé Kanté Dembélé Coulibaly',
    westafrica: 'Chinedu Oluwaseun Emeka Tunde Ibrahim Babajide Chukwuma Femi Musa Obinna Kayode Aliyu | Ngozi Adaeze Folake Amina Chiamaka Yetunde Funmilayo Zainab Ifeoma Bisi Halima Nkechi | Okafor Adeyemi Balogun Okonkwo Bello Eze Ogunleye Abubakar Nwosu Adebayo Ibrahim Chukwu',
    nahuatl: 'Cuauhtémoc Itzcoatl Tlacaelel Nezahualcoyotl Axayacatl Tizoc Ahuitzotl Cuitláhuac Xicohtencatl Tenoch Ocelotl Mixcoatl | Xochitl Citlali Itzel Yaretzi Tonalli Quetzalli Atzin Miahuatl Tecuichpo Ichpochtli Xiuhtonal Cihuaton | of_Tenochtitlan of_Texcoco of_Tlacopan of_Tlaxcala of_Cholula of_Xochimilco of_Culhuacan of_Azcapotzalco of_Chalco of_Tlatelolco of_Coyoacan of_Tula',
    spanish: 'José Juan Miguel Francisco Antonio Carlos Luis Pedro Manuel Diego Alejandro Rafael | María Guadalupe Juana Rosa Carmen Ana Teresa Isabel Josefina Lucía Sofía Elena | Hernández García Martínez López González Pérez Rodríguez Sánchez Ramírez Cruz Flores Morales',
    persian_anc: 'Kourosh Dariush Khashayar Kambiz Ardeshir Bardia Mehrdad Artabanus Bahram Shapur Farhad Arash | Atossa Parisa Roxana Mandana Shirin Parysatis Artemisia Azadeh Mahtab Soraya Anahita Pantea | Pasargadae Parsa Mede Arsacid Sasani Karen Suren Mihran Ispahbudhan Spandiyadh Zik Varaz',
    persian: 'Ali Reza Mohammad Hossein Mehdi Amir Hamid Saeed Dariush Kaveh Babak Farid | Maryam Zahra Fatemeh Leila Sara Nasrin Shirin Parisa Mina Roya Azar Niloufar | Hosseini Ahmadi Karimi Moradi Rezaei Jafari Rahimi Tehrani Kazemi Sadeghi Mousavi Shirazi',
    russian: 'Ivan Dmitri Sergei Alexei Nikolai Mikhail Vladimir Pavel Yuri Andrei Boris Grigori | Anna Olga Natalia Tatiana Elena Maria Svetlana Irina Ekaterina Ludmila Anastasia Vera | Ivanov Smirnov Kuznetsov Popov Sokolov Lebedev Kozlov Novikov Morozov Petrov Volkov Pavlov',
  };
  for (const [k, s] of Object.entries(P)) {
    const [m, f, last] = s.split('|').map(x => x.trim().split(/\s+/).map(w => w.replace(/_/g, ' ')));
    DATA.names[k] = { m, f, last };
  }
})();

/* ---------- national history: [year, type, text, where, options] ---------- */
(() => {
  const N = (y, type, t, where, o = {}) => DATA.history.push(Object.assign({ y, type, t, key: `${type}${y}${where.join('')}`, where }, o));
  N(-1274, 'war', 'Ramesses II fights the Hittites at Kadesh.', ['EGY'], { n: 'Battle of Kadesh', draft: 0.1, mort: 0.05 });
  N(-1353, 'politics', 'Akhenaten orders the worship of a single god, the Aten.', ['EGY']);
  N(-1200, 'culture', 'The Olmec carve colossal stone heads.', ['MEX']);
  N(-550, 'politics', 'Cyrus the Great founds the Persian Empire.', ['IRN']);
  N(-518, 'culture', 'Work begins on the palaces of Persepolis.', ['IRN']);
  N(-500, 'culture', 'Nok sculptors fire striking terracotta heads.', ['WAF']);
  N(-338, 'war', 'Philip of Macedon crushes the city-states at Chaeronea.', ['GRC'], { n: 'Macedonian conquest', draft: 0.15, mort: 0.06 });
  N(-332, 'politics', 'Alexander conquers Egypt and founds Alexandria.', ['EGY']);
  N(-326, 'politics', "Alexander's army reaches the Indus and turns back.", ['IND']);
  N(-268, 'politics', 'Emperor Ashoka renounces war after the slaughter at Kalinga.', ['IND']);
  N(-221, 'politics', 'Qin Shi Huang unifies China and begins the Great Wall.', ['CHN']);
  N(-52, 'war', 'Caesar defeats Vercingetorix at Alesia.', ['FRA'], { n: 'Gallic Wars', draft: 0.15, mort: 0.1 });
  N(-30, 'politics', 'Cleopatra dies. Egypt becomes a Roman province.', ['EGY']);
  N(43, 'war', 'Rome invades Britain.', ['ENG'], { n: 'Roman conquest', draft: 0.1, mort: 0.06 });
  N(60, 'war', 'Boudica leads a great revolt against Rome.', ['ENG'], { n: "Boudica's revolt", draft: 0.1, mort: 0.1 });
  N(100, 'culture', 'The Pyramid of the Sun towers over Teotihuacan.', ['MEX']);
  N(105, 'tech', 'Cai Lun refines the making of paper.', ['CHN']);
  N(224, 'politics', 'The Sasanian dynasty takes the Persian throne.', ['IRN']);
  N(330, 'politics', 'Constantinople becomes the new capital of Rome.', ['GRC']);
  N(499, 'tech', 'Aryabhata writes that the Earth spins on its axis.', ['IND']);
  N(641, 'politics', 'Arab armies conquer Egypt.', ['EGY']);
  N(651, 'politics', 'The Arab conquest ends the Sasanian Empire.', ['IRN']);
  N(710, 'culture', 'Nara becomes the first permanent capital of Japan.', ['JPN']);
  N(868, 'tech', 'The Diamond Sutra is printed from carved woodblocks.', ['CHN']);
  N(969, 'politics', 'The Fatimids found the city of Cairo.', ['EGY']);
  N(988, 'culture', 'Prince Vladimir converts Kievan Rus to Christianity.', ['RUS']);
  N(1010, 'culture', 'Ferdowsi completes the Shahnameh, the Book of Kings.', ['IRN']);
  N(1180, 'war', 'The Genpei War: Minamoto against Taira.', ['JPN'], { end: 1185, n: 'Genpei War', draft: 0.08, mort: 0.05 });
  N(1204, 'war', 'Crusaders sack Constantinople.', ['GRC'], { n: 'Fourth Crusade', civ: 0.01 });
  N(1219, 'war', 'The Mongols invade Persia.', ['IRN'], { end: 1221, n: 'Mongol invasion', draft: 0.1, mort: 0.1, civ: 0.02 });
  N(1235, 'politics', 'Sundiata Keita founds the Mali Empire.', ['WAF']);
  N(1240, 'war', 'The Mongols sack Kiev.', ['RUS'], { n: 'Mongol invasion', draft: 0.1, mort: 0.08, civ: 0.02 });
  N(1271, 'politics', 'Kublai Khan proclaims the Yuan dynasty.', ['CHN']);
  N(1274, 'war', 'Mongol fleets attack; typhoons scatter them.', ['JPN'], { end: 1281, n: 'Mongol invasions', draft: 0.05, mort: 0.04 });
  N(1300, 'culture', 'Dante begins writing the Divine Comedy.', ['ITA']);
  N(1324, 'culture', "Mansa Musa's pilgrimage dazzles Cairo with gold.", ['WAF', 'EGY'], { fx: { hp: 3 } });
  N(1325, 'politics', 'The Mexica found Tenochtitlan on an island in the lake.', ['MEX']);
  N(1405, 'culture', "Zheng He's treasure fleets sail as far as Africa.", ['CHN']);
  N(1429, 'war', 'Joan of Arc lifts the siege of Orléans.', ['FRA']);
  N(1464, 'politics', 'Sonni Ali builds the Songhai Empire.', ['WAF']);
  N(1467, 'war', 'The Ōnin War opens a century of warring states.', ['JPN'], { end: 1573, n: 'Sengoku wars', draft: 0.03, mort: 0.04 });
  N(1480, 'politics', 'Moscow throws off the Mongol yoke.', ['RUS']);
  N(1501, 'politics', 'Shah Ismail founds the Safavid dynasty.', ['IRN']);
  N(1504, 'culture', "Michelangelo unveils his David in Florence.", ['ITA']);
  N(1519, 'war', 'Spanish conquistadors land and march on Tenochtitlan.', ['MEX'], { end: 1521, n: 'Spanish conquest', draft: 0.15, mort: 0.15, civ: 0.02 });
  N(1520, 'plague', 'Smallpox arrives with the Spanish and ravages the land.', ['MEX'], { end: 1521, n: 'Smallpox epidemic', dn: 'Smallpox', inf: 0.4, let: 0.35, dmg: 25 });
  N(1526, 'war', 'Babur wins at Panipat and founds the Mughal Empire.', ['IND'], { n: 'Mughal conquest', draft: 0.05, mort: 0.05 });
  N(1545, 'plague', 'The cocoliztli fever sweeps New Spain.', ['MEX'], { end: 1548, n: 'Cocoliztli', dn: 'Cocoliztli', inf: 0.25, let: 0.45, dmg: 30 });
  N(1547, 'politics', 'Ivan the Terrible is crowned the first Tsar.', ['RUS']);
  N(1572, 'politics', "The St Bartholomew's Day massacre.", ['FRA']);
  N(1591, 'war', 'Moroccan musketeers shatter the Songhai at Tondibi.', ['WAF'], { n: 'Moroccan invasion', draft: 0.1, mort: 0.08 });
  N(1603, 'politics', 'Tokugawa Ieyasu founds the shogunate in Edo.', ['JPN']);
  N(1605, 'politics', 'The Gunpowder Plot is foiled.', ['ENG']);
  N(1607, 'politics', 'Jamestown is founded in Virginia.', ['USA', 'ENG']);
  N(1620, 'politics', 'The Mayflower lands at Plymouth.', ['USA']);
  N(1632, 'culture', 'Work begins on the Taj Mahal.', ['IND']);
  N(1633, 'politics', 'Galileo is tried by the Inquisition.', ['ITA']);
  N(1642, 'war', 'Civil war between King and Parliament.', ['ENG'], { end: 1651, n: 'English Civil War', draft: 0.1, mort: 0.05 });
  N(1644, 'politics', 'The Qing conquer Beijing.', ['CHN']);
  N(1703, 'politics', 'Peter the Great founds St Petersburg.', ['RUS']);
  N(1757, 'war', 'The East India Company wins at Plassey.', ['IND', 'ENG']);
  N(1804, 'politics', 'Napoleon crowns himself Emperor of the French.', ['FRA']);
  N(1804, 'war', "Usman dan Fodio's jihad founds the Sokoto Caliphate.", ['WAF'], { end: 1808, n: 'Fulani War', draft: 0.08, mort: 0.05 });
  N(1810, 'war', 'The cry of Dolores: war for independence.', ['MEX'], { end: 1821, n: 'War of Independence', draft: 0.08, mort: 0.06 });
  N(1812, 'war', 'Napoleon invades Russia. Moscow burns.', ['RUS', 'FRA'], { n: 'Patriotic War', draft: 0.15, mort: 0.1 });
  N(1821, 'war', 'The Greek War of Independence begins.', ['GRC'], { end: 1829, n: 'Greek War of Independence', draft: 0.12, mort: 0.06 });
  N(1837, 'politics', 'Victoria becomes queen.', ['ENG']);
  N(1839, 'war', 'The Opium Wars begin.', ['CHN', 'ENG'], { end: 1842, n: 'First Opium War', draft: 0.05, mort: 0.05 });
  N(1846, 'war', 'War with the United States.', ['MEX', 'USA'], { end: 1848, n: 'Mexican–American War', draft: 0.06, mort: 0.05 });
  N(1850, 'war', 'The Taiping Rebellion tears southern China apart.', ['CHN'], { end: 1864, n: 'Taiping Rebellion', draft: 0.06, mort: 0.06, civ: 0.01 });
  N(1853, 'politics', "Commodore Perry's black ships force Japan to open.", ['JPN']);
  N(1857, 'war', 'Rebellion rises against Company rule.', ['IND'], { end: 1858, n: 'Rebellion of 1857', draft: 0.05, mort: 0.06 });
  N(1861, 'law', 'Tsar Alexander II emancipates the serfs.', ['RUS']);
  N(1861, 'politics', 'Italy is unified under Victor Emmanuel II.', ['ITA']);
  N(1868, 'revolution', 'The Meiji Restoration returns power to the emperor.', ['JPN'], { strip: 0.2 });
  N(1869, 'tech', 'The Suez Canal opens.', ['EGY', 'FRA', 'ENG']);
  N(1869, 'tech', 'The transcontinental railroad is completed.', ['USA']);
  N(1871, 'revolution', 'The Paris Commune rises and falls.', ['FRA'], { strip: 0.05 });
  N(1876, 'famine', 'Famine strikes southern India.', ['IND'], { end: 1878, n: 'Great Famine', mort: 0.03, dmg: 10 });
  N(1889, 'tech', 'The Eiffel Tower opens in Paris.', ['FRA']);
  N(1896, 'culture', 'The first modern Olympic Games are held in Athens.', ['GRC']);
  N(1906, 'disaster', 'An earthquake and fire destroy San Francisco.', ['USA'], { p: 0.02, fx: { h: -10 }, loss: 0.3 });
  N(1908, 'tech', 'Oil is struck at Masjed Soleyman.', ['IRN']);
  N(1910, 'war', 'The Mexican Revolution erupts.', ['MEX'], { end: 1920, n: 'Mexican Revolution', draft: 0.1, mort: 0.06, civ: 0.008 });
  N(1911, 'revolution', 'The Xinhai Revolution ends two thousand years of emperors.', ['CHN'], { strip: 0.5 });
  N(1914, 'politics', 'Britain unites Northern and Southern Nigeria.', ['WAF']);
  N(1922, 'politics', 'Mussolini marches on Rome.', ['ITA']);
  N(1923, 'disaster', 'The Great Kantō earthquake levels Tokyo.', ['JPN'], { p: 0.15, fx: { h: -15 }, loss: 0.3 });
  N(1932, 'famine', 'Famine sweeps the Soviet countryside.', ['RUS'], { end: 1933, n: 'Soviet famine', mort: 0.04, dmg: 12 });
  N(1937, 'politics', 'The Great Purge: arrests in the night.', ['RUS'], { end: 1938, fx: { hp: -8, mh: -8 } });
  N(1937, 'war', 'Japan invades China.', ['CHN', 'JPN'], { end: 1945, n: 'War of Resistance', draft: 0.2, mort: 0.08, civ: 0.01 });
  N(1940, 'disaster', 'The Blitz: bombs fall on British cities.', ['ENG'], { end: 1941, p: 0.05, fx: { h: -15, mh: -10 }, loss: 0.2 });
  N(1941, 'famine', 'Occupation brings famine to Greece.', ['GRC'], { end: 1942, n: 'Great Famine', mort: 0.04, dmg: 12 });
  N(1943, 'famine', 'Famine devastates Bengal.', ['IND'], { n: 'Bengal famine', mort: 0.03, dmg: 12 });
  N(1945, 'disaster', 'Atomic bombs destroy Hiroshima and Nagasaki.', ['JPN'], { p: 0.03, fx: { h: -40, mh: -20 }, loss: 0.5 });
  N(1946, 'politics', 'Italy votes to become a republic.', ['ITA']);
  N(1947, 'disaster', 'Independence, and the upheaval of Partition.', ['IND'], { p: 0.15, fx: { h: -10, hp: -10, mh: -10 }, loss: 0.4 });
  N(1949, 'politics', "The People's Republic of China is proclaimed.", ['CHN']);
  N(1952, 'revolution', 'The Free Officers overthrow the monarchy.', ['EGY'], { strip: 0.6 });
  N(1959, 'famine', 'The Great Leap Forward ends in famine.', ['CHN'], { end: 1961, n: 'Great Chinese Famine', mort: 0.03, dmg: 12 });
  N(1960, 'politics', 'Nigeria wins independence.', ['WAF'], { fx: { hp: 6 } });
  N(1961, 'tech', 'Yuri Gagarin becomes the first human in space.', ['RUS']);
  N(1966, 'politics', 'The Cultural Revolution begins.', ['CHN'], { fx: { hp: -6, rep: -3, mh: -6 } });
  N(1967, 'war', 'The Nigerian Civil War begins.', ['WAF'], { end: 1970, n: 'Nigerian Civil War', draft: 0.1, mort: 0.06, civ: 0.02 });
  N(1968, 'politics', 'Students and workers bring Paris to a standstill.', ['FRA']);
  N(1970, 'tech', 'The Aswan High Dam tames the Nile flood.', ['EGY']);
  N(1978, 'politics', 'Reform and opening up transforms the economy.', ['CHN'], { fx: { hp: 4 } });
  N(1979, 'revolution', 'The Islamic Revolution topples the Shah.', ['IRN'], { strip: 0.5 });
  N(1980, 'war', 'The Iran–Iraq War begins.', ['IRN'], { end: 1988, n: 'Iran–Iraq War', draft: 0.12, mort: 0.06 });
  N(1983, 'culture', 'India wins the Cricket World Cup.', ['IND'], { fx: { hp: 5 } });
  N(1985, 'disaster', 'A great earthquake strikes Mexico City.', ['MEX'], { p: 0.05, fx: { h: -15 }, loss: 0.3 });
  N(1991, 'crash', 'The Soviet Union collapses; savings evaporate.', ['RUS'], { loss: 0.5, lay: 0.2 });
  N(2005, 'disaster', 'Hurricane Katrina floods New Orleans.', ['USA'], { p: 0.02, fx: { h: -10 }, loss: 0.3 });
  N(2010, 'crash', 'The debt crisis grips Greece.', ['GRC'], { end: 2012, loss: 0.3, lay: 0.15 });
  N(2011, 'disaster', 'An earthquake and tsunami strike Tōhoku.', ['JPN'], { p: 0.03, fx: { h: -15, mh: -10 }, loss: 0.3 });
  N(2011, 'politics', 'Protesters fill Tahrir Square.', ['EGY']);
  N(2016, 'politics', 'Britain votes to leave the European Union.', ['ENG']);
  N(2060, 'disaster', 'A planet-wide dust storm buries the domes for months.', ['MAR'], { p: 0.3, fx: { h: -10, hp: -8 } });
  N(2090, 'disaster', 'A micrometeor swarm breaches the Tycho domes.', ['LUN'], { p: 0.2, fx: { h: -15 }, loss: 0.2 });
  N(2100, 'politics', 'Mars declares independence from Earth.', ['MAR'], { fx: { hp: 5 } });
  N(2130, 'war', 'The Phobos Incident: skirmishes in orbit.', ['MAR'], { n: 'Phobos Incident', draft: 0.05, mort: 0.05 });

  // Scope the older, shared history to the lands it actually touched
  const EU = ['ENG', 'FRA', 'ITA', 'GRC', 'RUS'];
  const SCOPE = {
    'war-1200': ['GRC', 'EGY', 'IRN', 'ITA'], 'war-490': ['GRC', 'IRN'], 'war-431': ['GRC'], 'plague-430': ['GRC'], 'war-218': ['ITA', 'FRA'],
    disaster79: ['ITA'], plague165: ['ITA', 'GRC', 'EGY', 'FRA', 'ENG'], disaster410: ['ITA'], plague541: ['GRC', 'ITA', 'EGY', 'FRA', 'IRN'],
    war732: ['FRA'], disaster793: ['ENG', 'FRA', 'RUS'], war1066: ['ENG', 'FRA'], famine1315: ['ENG', 'FRA', 'ITA', 'RUS'], war1337: ['ENG', 'FRA'],
    plague1347: [...EU, 'EGY', 'IRN', 'CHN', 'IND'], war1455: ['ENG'], war1588: ['ENG'], war1618: ['FRA', 'ITA'], plague1630: ['ITA'], crash1637: ['FRA', 'ENG'],
    plague1665: ['ENG'], disaster1666: ['ENG'], crash1720: ['ENG', 'FRA'], war1756: ['ENG', 'FRA', 'RUS', 'USA', 'IND'], war1775: ['USA', 'ENG'],
    revolution1789: ['FRA'], war1803: ['FRA', 'ENG', 'ITA', 'RUS', 'EGY'], famine1816: ['ENG', 'FRA', 'ITA', 'USA'], plague1832: ['ENG', 'FRA', 'RUS', 'USA', 'EGY', 'IND', 'ITA'],
    famine1845: ['ENG'], revolution1848: ['FRA', 'ITA'], war1861: ['USA'], law1865: ['USA'], crash1873: ['USA', 'ENG', 'FRA'],
    war1914: ['ENG', 'FRA', 'ITA', 'RUS', 'USA', 'JPN', 'GRC', 'EGY', 'IND'], revolution1917: ['RUS'], law1920: ['USA'],
    war1939: ['ENG', 'FRA', 'ITA', 'RUS', 'USA', 'JPN', 'CHN', 'GRC', 'EGY', 'IND'], war1950: ['USA', 'CHN'], war1965: ['USA'],
    disaster1986: ['RUS'], politics2001: ['USA'], politics1989: null, disaster2047: null,
  };
  for (const h of DATA.history) if (!h.where && SCOPE[h.key]) h.where = SCOPE[h.key];
})();

/* ---------- country random events ---------- */
DATA.countryEvents = {
  ENG: [
    { id: 'fog', p: 0.05, min: 6, t: 'Thick fog rolled in and you got hopelessly lost on the way home.', fx: { hp: -2 } },
    { id: 'vicar', p: 0.04, min: 12, from: 1600, t: 'The vicar invited you to tea and asked pointed questions about your soul.', fx: { rep: 2 } },
    { id: 'rainsummer', p: 0.06, min: 4, t: 'It rained every single day of the summer.', fx: { hp: -3 } },
  ],
  FRA: [
    { id: 'strikefr', p: 0.06, min: 16, from: 1900, t: 'A general strike shut down the trains for weeks.', ch: [{ l: 'Join the march', fx: { rep: 3, hp: 3 }, t: 'You sang in the streets with a million others.' }, { l: 'Walk to work', fx: { h: 2, hp: -2 }, t: 'Your feet ache, but you got there.' }] },
    { id: 'vintage', p: 0.05, min: 14, t: 'A superb vintage this year. The whole town celebrated.', fx: { hp: 4 } },
    { id: 'duelfr', p: 0.03, min: 18, from: 1600, to: 1860, sex: 'M', t: 'A gentleman slaps you with his glove and demands satisfaction at dawn.', ch: [{ l: 'Meet him at dawn', odds: 0.55, win: { fx: { rep: 10 }, t: 'Honour satisfied, and you are unharmed.' }, alt: { fx: { h: -30 }, t: 'His pistol ball found your shoulder.' } }, { l: 'Leave town for a while', fx: { rep: -8 }, t: 'People called you a coward. You are alive to hear it.' }] },
  ],
  ITA: [
    { id: 'nonna', p: 0.05, min: 6, t: 'Your grandmother taught you her secret sauce recipe. You are sworn to silence.', fx: { hp: 4, im: 1 } },
    { id: 'quakeit', p: 0.02, min: 1, t: 'An earthquake shook the old stone houses of your town.', fx: { h: [-15, 0], mh: -4 } },
    { id: 'carnival', p: 0.05, min: 6, from: 1300, t: 'Carnival! Masks, music and far too much fried dough.', fx: { hp: 5 } },
  ],
  GRC: [
    { id: 'olives', p: 0.06, min: 6, t: 'The olive harvest was the best in memory.', fx: { hp: 4, $c: 0.05 } },
    { id: 'quakegr', p: 0.03, min: 1, t: 'An earthquake rattled the island.', fx: { h: [-12, 0] } },
  ],
  EGY: [
    { id: 'nilegood', p: 0.08, to: 1970, t: 'The Nile flood was generous this year. Bread for everyone!', fx: { hp: 4, h: 2, $c: 0.05 } },
    { id: 'nilebad', p: 0.05, to: 1970, t: 'The Nile flood failed. The fields cracked in the sun.', fx: { h: -6, hp: -5, $c: -0.05 } },
    { id: 'khamsin', p: 0.05, min: 1, t: 'A khamsin sandstorm turned the sky orange for three days.', fx: { h: -2 } },
  ],
  CHN: [
    { id: 'exam', p: 0.1, min: 16, max: 50, from: 605, to: 1905, t: 'The imperial examinations are being held. Success could make you an official.', ch: [{ l: 'Sit the examination', odds: p => p.sm / 130, win: { fx: { sm: 3, rep: 15, job: 'scholar-official' }, t: 'You passed with distinction! Your family weeps with pride.' }, alt: { fx: { hp: -6, mh: -4 }, t: 'You failed. Many men try for decades.' } }, { l: 'Not this year', t: 'You will study more first.' }] },
    { id: 'yellowriver', p: 0.03, min: 1, to: 1950, t: 'The Yellow River burst its banks.', fx: { h: [-10, 0], $c: -0.1 } },
    { id: 'matchmaker', p: 0.08, min: 18, max: 30, to: 1950, c: p => p.sp == null, t: 'The family matchmaker has found you a suitable match.', ch: [{ l: 'Accept the match', fx: { lover: 1, rep: 3 }, t: 'You met your intended. It is a start.' }, { l: 'Refuse', fx: { rep: -4 }, t: 'Your parents are deeply disappointed.' }] },
  ],
  JPN: [
    { id: 'quakejp', p: 0.05, min: 1, t: 'An earthquake shook the house in the night.', fx: { mh: -3, h: [-6, 0] } },
    { id: 'ronin', p: 0.03, min: 16, from: 1600, to: 1871, sex: 'M', t: 'A masterless rōnin blocks your path and insults your family.', ch: [{ l: 'Draw your sword', odds: 0.45, win: { fx: { rep: 12, fm: 3 }, t: 'You won. The story spread through the province.' }, alt: { fx: { h: -30 }, t: 'You were cut badly before bystanders intervened.' } }, { l: 'Bow and walk on', fx: { rep: -3, mh: 2 }, t: 'Pride is not worth dying for.' }] },
    { id: 'typhoon', p: 0.05, min: 1, t: 'A typhoon tore the roof tiles from your house.', fx: { $c: -0.05, hp: -3 } },
  ],
  IND: [
    { id: 'monsoonfail', p: 0.05, min: 1, to: 1970, t: 'The monsoon failed. The fields turned to dust.', fx: { h: -5, $c: -0.05 } },
    { id: 'holyman', p: 0.04, min: 8, t: 'A wandering holy man blessed you and your family.', fx: { mh: 4, hp: 3 } },
    { id: 'arranged', p: 0.08, min: 18, max: 30, c: p => p.sp == null, t: 'Your family has arranged a promising match for you.', ch: [{ l: 'Meet them', fx: { lover: 1, rep: 3 }, t: 'You met, a little shy. Your families are delighted.' }, { l: 'Refuse', fx: { rep: -3 }, t: 'Your aunties will not stop talking about it.' }] },
  ],
  WAF: [
    { id: 'harmattan', p: 0.06, min: 1, t: 'The harmattan wind coated everything in fine red dust.', fx: { h: -2 } },
    { id: 'griotsong', p: 0.04, min: 10, t: "At a wedding, a griot sang your family's history. People looked at you with new respect.", fx: { rep: 5, hp: 4 } },
    { id: 'masquerade', p: 0.05, min: 4, t: 'The masquerade festival filled the streets with dancers and drums.', fx: { hp: 5, im: 2 } },
  ],
  MEX: [
    { id: 'quakemx', p: 0.03, min: 1, t: 'The ground shook and the church bells rang by themselves.', fx: { h: [-10, 0], mh: -3 } },
    { id: 'ofrenda', p: 0.08, min: 4, from: 1521, t: 'Your family built a beautiful ofrenda for the Day of the Dead.', fx: { mh: 4, hp: 3 } },
    { id: 'popo', p: 0.02, min: 1, t: 'Popocatépetl rumbled and dusted the town with ash.', fx: { h: -3 } },
  ],
  IRN: [
    { id: 'carpet', p: 0.05, min: 18, c: (p, S) => S.cash(p) > S.era().cost * 0.3, t: 'A merchant offers you a magnificent hand-knotted carpet.', ch: [{ l: 'Buy it', fx: { $c: -0.3, hp: 6, rep: 2 }, t: 'It glows like a garden in your home.' }, { l: 'Admire it and leave', t: 'You will dream about it.' }] },
    { id: 'hafez', p: 0.05, min: 10, from: 1390, t: 'You opened a book of Hafez at random for an omen. The verse was hopeful.', fx: { mh: 3, im: 2 } },
    { id: 'quakeir', p: 0.03, min: 1, t: 'An earthquake cracked the walls of your house.', fx: { h: [-12, 0] } },
  ],
  RUS: [
    { id: 'winter', p: 0.08, min: 1, t: 'The winter was brutally cold. The river froze solid for five months.', fx: { h: -4 } },
    { id: 'queue', p: 0.15, min: 10, from: 1917, to: 1991, t: 'You queued for three hours for bread and a tin of fish.', fx: { hp: -3 } },
    { id: 'informer', p: 0.05, min: 18, from: 1930, to: 1953, t: 'You suspect a neighbour has been informing on people in your building.', ch: [{ l: 'Keep quiet and careful', fx: { mh: -5 }, t: 'You speak only about the weather now.' }, { l: 'Confront them', odds: 0.5, win: { fx: { rep: 3 }, t: 'They denied everything and avoided you afterwards.' }, alt: { fx: { jail: 3 }, t: 'Two men came for you at night.' } }] },
  ],
  USA: [
    { id: 'tornado', p: 0.03, min: 1, from: 1800, t: 'A tornado tore through the county.', fx: { h: [-10, 0], $c: -0.08 } },
    { id: 'july4', p: 0.08, min: 3, from: 1777, t: 'Fourth of July fireworks lit up the sky.', fx: { hp: 4 } },
    { id: 'salesman', p: 0.04, min: 18, from: 1880, t: 'A door-to-door salesman swears his encyclopedias will change your life.', ch: [{ l: 'Buy a set', fx: { $c: -0.05, sm: 3 }, t: 'You read them all. Well, the A volume.' }, { l: 'Close the door', t: 'Firmly.' }] },
  ],
  MAR: [
    { id: 'dustmars', p: 0.08, min: 1, t: 'A dust storm cut power to your dome for a week.', fx: { h: -3, mh: -3 } },
    { id: 'bluesunset', p: 0.06, min: 3, t: 'You watched a blue Martian sunset and felt very far from everything.', fx: { im: 3, mh: 2 } },
  ],
  LUN: [{ id: 'earthrise', p: 0.06, min: 3, t: 'Earthrise over the crater rim. You never get used to it.', fx: { im: 3, hp: 3 } }],
  BLT: [{ id: 'rockfall', p: 0.05, min: 3, t: 'A rogue pebble pinged your habitat hull. Everyone held their breath.', fx: { mh: -3 } }],
};

/* ---------- country jobs: pay as a multiple of the era's yearly living cost ---------- */
DATA.countryJobs = {
  ENG: [['Longbowman', 1.2, { from: 1250, to: 1500, sex: 'M', risk: 0.05 }], ['Chimney Sweep', 0.8, { from: 1700, to: 1875, risk: 0.04 }], ['Cricketer', 2, { from: 1800, fame: 2, vol: 0.5 }]],
  FRA: [['Troubadour', 1.2, { from: 1100, to: 1350, im: 50, fame: 1 }], ['Musketeer', 2, { from: 1622, to: 1776, sex: 'M', risk: 0.05, fame: 1 }], ['Perfumer', 2, { from: 1700, im: 50 }], ['Chef de Cuisine', 2.5, { from: 1800, sm: 30 }]],
  ITA: [['Gondolier', 1.2, { from: 1100 }], ['Opera Singer', 2.5, { from: 1600, lk: 40, fame: 3, vol: 0.5 }], ['Fashion Designer', 3, { from: 1950, im: 60, fame: 2, vol: 0.5 }]],
  GRC: [['Olympic Athlete', 2, { to: 393, sex: 'M', fame: 3, risk: 0.02 }], ['Oracle Priestess', 2, { from: -800, to: 390, sex: 'F', fame: 2 }], ['Shipowner', 8, { from: 1850, sm: 50, vol: 0.4 }]],
  EGY: [['Pyramid Builder', 1.1, { from: -2700, to: -1700, risk: 0.04 }], ['Embalmer', 1.8, { to: 400, sm: 30 }], ['Nile Boatman', 1.1, {}], ['Egyptologist', 3, { from: 1822, edu: 3, sm: 55 }]],
  CHN: [['Scholar-official', 6, { from: 605, to: 1905, sm: 70, edu: 3, rep: 25, fame: 1 }], ['Silk Weaver', 1.1, {}], ['Porcelain Maker', 1.6, { from: 600, im: 30 }], ['Kung Fu Master', 1.5, { from: 500, fame: 1 }]],
  JPN: [['Samurai', 4, { from: 1185, to: 1871, sex: 'M', cls: 4, risk: 0.03, fame: 1 }], ['Geisha', 3, { from: 1750, to: 1990, sex: 'F', lk: 60, im: 40, fame: 1 }], ['Kabuki Actor', 2.5, { from: 1603, sex: 'M', fame: 2 }], ['Sushi Chef', 1.5, { from: 1800 }], ['Anime Artist', 1.5, { from: 1960, im: 60 }]],
  IND: [['Mughal Courtier', 8, { from: 1526, to: 1857, cls: 4, sm: 45 }], ['Spice Trader', 2.5, { vol: 0.4 }], ['Bollywood Actor', 3, { from: 1913, lk: 60, fame: 3, vol: 0.6 }], ['Cricketer', 2, { from: 1850, fame: 2, vol: 0.5 }]],
  WAF: [['Griot', 1.5, { im: 50, fame: 1 }], ['Trans-Saharan Trader', 4, { from: 300, to: 1600, vol: 0.5, risk: 0.03 }], ['Kola Nut Farmer', 1, {}], ['Afrobeat Musician', 2, { from: 1970, im: 50, fame: 3, vol: 0.7 }], ['Nollywood Actor', 2, { from: 1992, lk: 55, fame: 3, vol: 0.6 }]],
  MEX: [['Jaguar Warrior', 1.5, { to: 1521, sex: 'M', risk: 0.06, fame: 2 }], ['Pochteca Merchant', 3, { to: 1521, vol: 0.4 }], ['Mariachi', 1.2, { from: 1850, fame: 1 }], ['Muralist', 2, { from: 1920, im: 60, fame: 2 }]],
  IRN: [['Carpet Weaver', 1.2, {}], ['Court Poet', 3, { im: 65, sm: 50, fame: 2 }], ['Caravanserai Keeper', 1.8, { from: -500, to: 1900 }], ['Oil Engineer', 4, { from: 1908, edu: 3, sm: 55 }]],
  RUS: [['Cossack', 1.4, { from: 1500, to: 1920, sex: 'M', risk: 0.05 }], ['Ballet Dancer', 1.8, { from: 1740, lk: 55, fame: 2 }], ['Cosmonaut', 6, { from: 1961, to: 1991, sm: 85, edu: 4, fame: 4, risk: 0.01 }], ['Kolkhoz Farmer', 0.9, { from: 1929, to: 1991 }]],
  USA: [['Cowboy', 1.2, { from: 1850, to: 1900, risk: 0.03 }], ['Gold Prospector', 1.5, { from: 1848, to: 1900, vol: 1 }], ['Hollywood Star', 6, { from: 1915, lk: 65, fame: 4, vol: 0.8 }], ['Tech Founder', 3, { from: 1976, sm: 70, vol: 1.2, fame: 1 }]],
  MAR: [['Dome Farmer', 1.2, {}], ['Martian Geologist', 4, { edu: 4, sm: 60 }]],
  LUN: [['Helium-3 Miner', 2.5, { risk: 0.03 }]],
  BLT: [['Ice Hauler', 2.5, { risk: 0.04 }]],
};

/* ---------- country activities: cost as a share of a year's living ---------- */
DATA.countryActs = {
  ENG: [{ id: 'stonehenge', n: 'Visit Stonehenge', d: 'Old stones, older mysteries.', min: 5, c: 0.02, fx: { im: [2, 4], hp: 3 }, t: 'You stood among the stones as the sun went down.' }, { id: 'cricketwatch', n: 'Watch a cricket match', d: 'Five days. Tea breaks.', from: 1750, min: 6, c: 0.01, fx: { hp: [3, 6] }, t: 'You watched every ball. Nobody knows who won.' }],
  FRA: [{ id: 'cafe', n: 'Sit at a café', d: 'Watch the world go by.', from: 1680, min: 14, c: 0.005, fx: { hp: 4, im: 2 }, t: 'You nursed one coffee for three hours, as is proper.' }, { id: 'vines', n: 'Tour the vineyards', d: 'For research purposes.', min: 18, c: 0.02, fx: { hp: [4, 8], h: -1 }, t: 'You tasted everything. Twice.' }],
  ITA: [{ id: 'colosseum', n: 'Visit the Colosseum', d: 'Where the crowds once roared.', from: 80, min: 5, c: 0.01, fx: { sm: 2, im: 2 }, t: 'You stood in the arena and imagined the noise.' }, { id: 'gondola', n: 'Take a gondola ride', d: 'Venice at dusk.', from: 1100, min: 10, c: 0.02, fx: { hp: 6 }, t: 'The gondolier sang, badly and beautifully.' }],
  GRC: [{ id: 'tragedy', n: 'Watch a tragedy at the theatre', d: 'Catharsis guaranteed.', from: -500, to: 400, min: 10, c: 0.005, fx: { mh: 3, im: 3 }, t: 'You wept with the whole audience.' }, { id: 'aegean', n: 'Swim in the Aegean', d: 'Wine-dark sea.', min: 5, c: 0, fx: { h: 2, hp: 4 }, t: 'The water was impossibly blue.' }],
  EGY: [{ id: 'nilesail', n: 'Sail on the Nile', d: 'Past temples and palms.', min: 5, c: 0.01, fx: { hp: 5, mh: 2 }, t: 'You drifted past temples older than memory.' }, { id: 'pyramids', n: 'Visit the pyramids', d: 'The last wonder standing.', from: -2500, min: 5, c: 0.01, fx: { im: [2, 5], hp: 3 }, t: 'You felt very small, and very lucky.' }],
  CHN: [{ id: 'taichi', n: 'Practise tai chi in the park', d: 'Slow, steady, strong.', from: 1600, min: 10, c: 0, fx: { h: 2, mh: 3, wp: 1 }, t: 'You moved like water with the old folk at dawn.' }, { id: 'greatwall', n: 'Walk on the Great Wall', d: 'It goes on and on.', from: -200, min: 8, c: 0.02, fx: { h: 2, im: 3 }, t: 'The wall snaked over the hills to the horizon.' }],
  JPN: [{ id: 'onsen', n: 'Relax in an onsen', d: 'Volcanic hot springs.', min: 6, c: 0.01, fx: { h: 3, mh: 4 }, t: 'You soaked until you forgot your name.' }, { id: 'hanami', n: 'Picnic under the cherry blossoms', d: 'Hanami season.', from: 800, min: 4, c: 0.005, fx: { hp: 5, im: 2 }, t: 'Petals fell into your cup. Everything felt fleeting and fine.' }],
  IND: [{ id: 'ganges', n: 'Bathe in the Ganges', d: 'Sacred waters.', min: 5, c: 0.005, fx: { mh: 4 }, t: 'You rose from the river feeling cleansed.' }, { id: 'yoga', n: 'Practise yoga', d: 'Breath and balance.', min: 8, c: 0, fx: { h: 2, mh: 3, wp: 1 }, t: 'You held the pose longer than yesterday.' }],
  WAF: [{ id: 'griottale', n: "Listen to a griot's tale", d: 'History, sung.', min: 4, c: 0, fx: { im: 3, sm: 1 }, t: 'The griot sang of kings and heroes until the fire burned low.' }, { id: 'timbuktu', n: 'Browse the book market in Timbuktu', d: 'Manuscripts from across the world.', from: 1100, to: 1600, min: 10, c: 0.02, fx: { sm: [2, 5] }, t: 'You bought a manuscript on astronomy.' }],
  MEX: [{ id: 'ballgame', n: 'Watch the ball game', d: 'Ōllamaliztli: hips only.', to: 1521, min: 6, c: 0, fx: { hp: 5 }, t: 'The ball flew through the stone ring and the crowd went wild.' }, { id: 'tacos', n: 'Eat at a street taco stand', d: 'Al pastor, obviously.', from: 1900, min: 5, c: 0.002, fx: { hp: 5 }, t: 'Perfection wrapped in a tortilla.' }],
  IRN: [{ id: 'bazaar', n: 'Wander the bazaar', d: 'Spice, silk and haggling.', min: 6, c: 0.005, fx: { hp: 3, im: 2 }, t: 'You haggled for an hour over a teapot and loved every minute.' }, { id: 'garden', n: 'Rest in a Persian garden', d: 'Paradise, walled.', min: 5, c: 0, fx: { mh: 4 }, t: 'Water murmured in the channels. You breathed.' }],
  RUS: [{ id: 'banya', n: 'Sweat in a banya', d: 'Steam, birch twigs, cold plunge.', min: 10, c: 0.005, fx: { h: 3, wp: 1 }, t: 'Your skin will never be the same. Neither will your soul.' }, { id: 'ballet', n: 'Go to the ballet', d: 'Swans, tragedy, sequins.', from: 1740, min: 8, c: 0.02, fx: { im: 3, hp: 4 }, t: 'You held your breath through the whole second act.' }],
  USA: [{ id: 'baseball', n: 'Go to a baseball game', d: 'Hot dogs and the seventh-inning stretch.', from: 1870, min: 5, c: 0.005, fx: { hp: 5 }, t: 'You caught a foul ball. Well, you almost did.' }, { id: 'route66', n: 'Drive Route 66', d: 'Get your kicks.', from: 1926, min: 17, c: 0.05, fx: { hp: [6, 10], im: 3 }, t: 'Diners, motels and endless sky.' }],
  MAR: [{ id: 'olympus', n: 'Hike on Olympus Mons', d: 'The tallest mountain in the solar system.', min: 14, c: 0.05, fx: { h: 3, im: 4 }, t: 'Your suit fogged up with awe.' }],
  LUN: [{ id: 'lowg', n: 'Try low-gravity dance', d: 'Graceful, eventually.', min: 6, c: 0.01, fx: { hp: 5, h: 2 }, t: 'You floated, spun and landed on a stranger.' }],
  BLT: [{ id: 'ringview', n: 'Watch the belt lights', d: 'A thousand drifting beacons.', min: 4, c: 0, fx: { im: 3, mh: 2 }, t: 'Beacons blinked across the dark like slow fireflies.' }],
};

/* ---------- holidays: one popup a year, sometimes ---------- */
DATA.holidays = {
  ENG: [['Christmas', 336]], FRA: [['Christmas', 336], ['Bastille Day', 1880]], ITA: [['Christmas', 336], ['Ferragosto', -18]], GRC: [['Easter', 330], ['the Panathenaic festival', -566, -300]],
  EGY: [['the Opet festival', -1500, -30], ['Eid al-Fitr', 640]], CHN: [['Lunar New Year', -100]], JPN: [['Obon', 700], ['Shōgatsu, the New Year', 700]],
  IND: [['Diwali', 500], ['Holi', 500]], WAF: [['the New Yam Festival', -500], ['Sallah', 1100]], MEX: [['Toxcatl', 1325, 1521], ['the Day of the Dead', 1521]],
  IRN: [['Nowruz', -500]], RUS: [['Maslenitsa', 1000], ['New Year', 1918]], USA: [['Thanksgiving', 1863], ['the Fourth of July', 1777]],
  MAR: [['Landing Day', 2042]], LUN: [['First Light', 2071]], BLT: [['Charter Day', 2217]],
};

/* ---------- local names for era jobs (null = not found in that land) ----------
   '*' applies to every country not listed. Titles only come with the original. */
DATA.jobLocal = {
  legionary: { ITA: 'Legionary', GRC: 'Hoplite', EGY: "Pharaoh's soldier", IRN: 'Immortal guardsman', CHN: 'Soldier', IND: 'Soldier', '*': 'Warrior' },
  gladiator: { ITA: 'Gladiator', GRC: 'Pankration fighter', '*': null },
  senator: { ITA: 'Senator', GRC: 'Archon', EGY: 'Vizier', CHN: 'Minister', IRN: 'Satrap', IND: 'Royal minister', '*': 'Tribal chief' },
  knight: { ENG: 'Knight', FRA: 'Knight', ITA: 'Knight', GRC: 'Kataphraktos', RUS: 'Druzhinnik', JPN: null, CHN: 'Warrior noble', IND: 'Rajput warrior', IRN: 'Savaran cavalryman', EGY: 'Mamluk', WAF: 'Horse warrior', MEX: 'Eagle warrior', '*': 'Warrior noble' },
  'lord-of-the-manor': { ENG: 'Lord of the Manor', FRA: 'Seigneur', ITA: 'Signore', RUS: 'Boyar', GRC: 'Archon of the estates', JPN: 'Daimyo', CHN: 'Provincial governor', IND: 'Zamindar', IRN: 'Khan', EGY: 'Emir', WAF: 'Chief', MEX: 'Tlatoani', '*': 'Landed lord' },
  cardinal: { ITA: 'Cardinal', FRA: 'Cardinal', ENG: 'Bishop', GRC: 'Patriarch', RUS: 'Metropolitan', EGY: 'Grand mufti', IRN: 'Grand ayatollah', '*': 'High priest' },
  'colonial-governor': { ENG: 'Colonial Governor', FRA: 'Colonial Governor', USA: 'Colonial Governor', '*': 'Provincial governor' },
  clergyman: { EGY: 'Imam', IRN: 'Mullah', IND: 'Temple priest', CHN: 'Temple priest', JPN: 'Shinto priest', WAF: 'Imam', '*': 'Clergyman' },
  'man-at-arms': { JPN: 'Ashigaru foot soldier', CHN: 'Soldier', '*': 'Man-at-arms' },
};
