/* =====================================================================
   ATLAS, Europe 1 — the British Isles, the Nordic and Baltic lands,
   Western Europe and the German-speaking lands.

   A record is  Land(`ID|Short name|Adjective|subregion` then key=value pairs split by ";").
   Lists inside a value use "|" between entries and ":" between fields, except where noted.
     pre    prehistory archetype and the year it hands over: pre=euw:-800      from   first settled year
     nm     names over time: until:Name:Government|...|Name:Government         cap    until:Capital|...|Capital
     cur    money: until:name:symbol:USD value  (before 1801 the value is in game units; _ = no symbol)
     pop    millions after 1800: 1800:5,1900:38,...    pm  premodern density multiplier   fut  2400 vs 2025
     nc     name pools over time: until:pool|...|pool                            ga/mix  genes (archetype, or ENG:.5,FRA:.5)
     eth    ethnic groups, "name:share:cluster@from" separated by commas        rs  beliefs: year>code:pct code:pct|...
     cu     culture archetype plus tweaks (I,H,T,F,O,R,G + number)              lg fd fs sp  languages, dishes, festivals, pastimes (name@year, commas)
     cs tr  customs and societal features, split by "|"
     arr    percent of marriages arranged now      arrT year the custom halves
     ind    year of independence   indFrom  from whom   wv women vote   dv divorce legal   sx same-sex marriage
     law    from-to:Text[:flag=value]|...   gv government now (dem flaw hyb aut mon theo party mil)
     ov     polities that held it: polity:from:to|...    bl  blocs: bloc:joined[:left]|...
     ev     year[-end] type Text [@OTHER,IDS] [#d=.1,m=.05]   (pol war rev cult tech dis fam law plg mig)
     ci     cities: Name~founded~abandoned(0 = stands)~year:level year:level|...
     tier   1 (richest) to 5      mil 0-9      pp passport 1-5      ww  1 and/or 2: took part in the world wars
     net    internet midpoint:ceiling   cz censorship 0-3   dual y|n|l   cit soli|sang|mix
   ===================================================================== */

Land(`ENG|Britain|British|eu-brit
cu=anglo; eth=English:80:nweur,Scottish:8:nweur,Welsh:4:nweur,Northern Irish:3:nweur,South Asian:3:indn@1948,Black British:2:waf@1948,Other:3:world@1948;
rs=-10000>pa:100|-500>ce:90 ag:10|43>ce:55 ag:45|312>ag:30 ch:60 pa:10|700>ch:100|1535>ch:55 pr:45|1700>pr:70 ch:15 ot:15|1900>pr:75 ch:12 ju:1 sc:10 ot:2|1980>pr:55 ch:12 sc:22 su:4 hi:2 ot:5|2025>sc:40 pr:28 ch:9 su:6 hi:2 sk:1 ot:14;
lg=English,Welsh,Scots Gaelic; fd=fish and chips@1860,Sunday roast@1700,a full English breakfast@1800; fs=Guy Fawkes Night@1605,Hogmanay@1500,Burns Night@1801; sp=football@1863,cricket@1600,rugby@1823;
cs=Queueing politely is a national art|Tea at four o'clock|Understatement and dry wit are the usual humour; tr=Class still shapes accents and schools|Social care and a national health service after 1948;
arr=1; arrT=1740; wv=1918; dv=1857; sx=2014; tier=1; mil=8; pp=1; ww=12; dual=y; cit=mix; gv=mon;
ov=roman:43:409|british:1650:1946; bl=nato:1949|commonw:1931;`);

Land(`IRL|Ireland|Irish|eu-brit
pre=euw:-500; nm=-500:the Bronze Age kingdoms of Ireland:Chiefdoms|432:Gaelic Ireland:Petty kingdoms|1169:the Gaelic kingdoms and the Norse towns:Petty kingdoms|1541:the Lordship of Ireland:Lordship|1800:the Kingdom of Ireland:Subject kingdom|1922:Ireland under the Union:Part of the United Kingdom|1949:the Irish Free State:Dominion|the Republic of Ireland:Parliamentary republic;
cap=432:Tara|1169:Tara|1922:Dublin|Dublin; cur=1801:pounds:£:4.85|1914:pounds:£:4.85|1922:pounds:£:4.85|1945:Irish pounds:£:3|1999:Irish pounds:£:1.5|2029:euros:€:1.1|euros:€:1.1;
pop=1800:5.2,1850:6.6,1900:3.2,1950:2.96,2000:3.8,2025:5.3; pm=0.7; nc=1169:celt|1922:irish|irish; ga=nweur; mix=ENG:.8,FRA:.2;
eth=Irish:82:nweur,Irish Traveller:1:nweur,Polish and Eastern European:3:slav@2004,British:4:nweur,Other:10:world@1990;
rs=-10000>pa:100|-500>ce:100|432>ce:50 ch:50|700>ch:100|1920>ch:96 pr:3 ju:1|2000>ch:84 pr:5 sc:9 su:1 ot:1|2025>ch:69 pr:6 sc:14 su:2 or:3 ot:6;
cu=latin O10 R-5 G10; lg=Irish,English; fd=Irish stew@1700,soda bread@1840,colcannon@1750; fs=Saint Patrick's Day@1600,Samhain@-500,Bloomsday@1954; sp=Gaelic football@1884,hurling@-1200,rugby@1875;
cs=Music in the pub is a weekly rite|Wakes honour the dead with talk and drink|Storytelling is prized; tr=Emigration shaped almost every family|The Church's grip on schools and law loosened after 1990;
arr=1; arrT=1780; wv=1918; dv=1996; sx=2015; ind=1922; indFrom=the United Kingdom; tier=1; mil=1; pp=1; ww=; dual=y; cit=mix; gv=dem;
ov=british:1801:1922; bl=eu:1973|commonw:1931:1949;
ev=-3200 cult Newgrange is raised on the Boyne so that the midwinter sunrise floods its passage.|432 cult Saint Patrick brings Christianity to Ireland.|795-900 war Viking raids: raiders reach the Irish monasteries #d=.02,m=.04|1845-1852 fam The Great Famine empties the Irish countryside by hunger and emigration. #m=.12,h=20|1916 rev The Easter Rising: rebels proclaim an Irish republic in Dublin. #s=.05|1919-1921 war The Irish War of Independence: guerrilla war against British rule. #d=.03,m=.03|1922-1923 war The Irish Civil War: the Free State fights its own former comrades. #d=.04,m=.04|1998 pol The Good Friday Agreement brings peace to the island.;
ci=Tara~-1000~1000~-1000:2 400:3|Dublin~841~0~841:3 1100:4 1700:5 1900:6|Cork~600~0~600:2 1600:3 1850:4|Galway~1124~0~1124:2 1500:3;`);

Land(`SWE|Sweden|Swedish|eu-nord
pre=eun:-1700; nm=-500:the Nordic Bronze Age:Chiefdoms|800:the Svear and Götar tribes:Tribal kingdoms|1397:the Viking Age kingdoms of Sweden:Kingdom|1523:the Kalmar Union:Union of crowns|1721:the Swedish Empire:Absolute monarchy|1809:the Age of Liberty:Parliamentary monarchy|1974:Sweden:Constitutional monarchy|Sweden:Constitutional monarchy;
cap=800:Uppsala|1252:Sigtuna|99999:Stockholm; cur=1873:riksdaler:rd:20|1913:kronor:kr:0.27|1945:kronor:kr:0.27|1999:kronor:kr:0.17|2029:kronor:kr:0.095|kronor:kr:0.095;
pop=1800:2.3,1900:5.1,1950:7,2000:8.9,2025:10.5; pm=0.6; nc=1000:norse|2029:nordic; ga=nord; eth=Swedes:80:nord,Finns and Sámi:3:nord,Middle Eastern and North African:8:arab@1960,Other European:5:weur@1990,Other:4:world@1990;
rs=-10000>pa:100|500>no:100|1000>no:60 ch:40|1100>ch:100|1527>pr:100|1950>pr:85 sc:12 ot:3|2025>pr:55 sc:32 su:7 ch:2 or:2 ot:2;
cu=nordic; lg=Swedish,Finnish,Sámi; fd=meatballs@1700,gravlax@1500,surströmming@1500; fs=Midsummer@1000,Lucia@1700,Walpurgis Night@1700; sp=ice hockey@1920,football@1890,cross-country skiing@1880;
cs=Fika, the coffee break, is sacred|Lagom: not too much, not too little|Taking off shoes indoors; tr=High taxes buy generous welfare|Gender equality is built into law and family leave|Strong trade unions;
arr=0; arrT=1700; wv=1919; dv=1920; sx=2009; tier=1; mil=4; pp=1; ww=; dual=y; cit=sang; gv=mon;
ov=viking:800:1050|dan:1397:1523|swedemp:1611:1721; bl=eu:1995|nato:2024;
ev=1397 pol The Kalmar Union joins Denmark, Norway and Sweden under one crown.|1523 pol Gustav Vasa becomes king and Sweden leaves the union.|1632 war The Thirty Years' War: Sweden fights in Germany #d=.06,m=.05|1700-1721 war The Great Northern War: Charles XII against the Tsar #d=.1,m=.06|1809 rev The Swedish crown is limited by a new constitution. #s=.05|1814 pol The last war ends, and Sweden begins two hundred years of peace.|1932 pol The Social Democrats build the Swedish welfare state.;
ci=Uppsala~500~0~500:2 1100:3 1500:3|Sigtuna~980~0~980:3 1200:2|Stockholm~1252~0~1252:2 1500:3 1700:4 1850:5 1950:6|Gothenburg~1621~0~1621:2 1800:4 1900:5|Malmö~1275~0~1275:2 1800:4;`);

Land(`NOR|Norway|Norwegian|eu-nord
pre=eun:-1700; nm=-500:the Nordic Bronze Age:Chiefdoms|800:the petty kingdoms of Norway:Petty kingdoms|1050:the Viking kingdoms of Norway:Kingdom|1397:the Kingdom of Norway:Kingdom|1814:Denmark-Norway:Union of crowns|1905:Norway under Sweden:Union under the Swedish king|Norway:Constitutional monarchy;
cap=1050:Trondheim|1300:Bergen|1814:Christiania|99999:Oslo; cur=1873:speciedaler:sp:20|1913:kroner:kr:0.27|1945:kroner:kr:0.22|1999:kroner:kr:0.15|2029:kroner:kr:0.095|kroner:kr:0.095;
pop=1800:0.88,1900:2.2,1950:3.3,2000:4.5,2025:5.6; pm=0.5; nc=1000:norse|2029:nordic; ga=nord; eth=Norwegians:84:nord,Sámi:1:nord,Other European:6:weur@1990,South Asian and Middle Eastern:5:arab@1970,Other:4:world@1990;
rs=-10000>pa:100|500>no:100|1000>no:60 ch:40|1100>ch:100|1537>pr:100|1950>pr:90 sc:8 ot:2|2025>pr:60 sc:28 su:5 ch:3 ot:4;
cu=nordic; lg=Norwegian,Sámi; fd=lutefisk@1500,brunost@1700,fårikål@1800; fs=Constitution Day@1814,Syttende Mai@1814,Midsummer@1000; sp=cross-country skiing@1870,football@1900,handball@1930;
cs=Friluftsliv: a life spent outdoors|Cabin weekends in the mountains|Trust in neighbours and the state; tr=Oil wealth funds a vast sovereign fund|Egalitarian society with high trust;
arr=0; arrT=1700; wv=1913; dv=1909; sx=2009; ind=1905; indFrom=Sweden; tier=1; mil=4; pp=1; ww=2; gv=mon;
ov=viking:800:1050|dan:1397:1814|swedemp:1814:1905; bl=nato:1949;
ev=872 pol Harald Fairhair unites the petty kingdoms of Norway.|1349 plg The Black Death kills nearly half of Norway. #l=.4|1814 pol Norway adopts a constitution and enters a union with Sweden.|1905 pol The union with Sweden is peacefully dissolved.|1940-1945 war The German occupation of Norway: five years of resistance #d=.04,m=.03|1969 tech Oil is found beneath the North Sea.;
ci=Trondheim~997~0~997:2 1100:3 1800:3|Bergen~1070~0~1070:3 1300:4 1900:4|Oslo~1048~0~1048:2 1300:3 1624:3 1850:4 1950:5|Stavanger~1125~0~1125:2 1900:3;`);

Land(`DNK|Denmark|Danish|eu-nord
pre=eun:-1700; nm=-500:the Nordic Bronze Age:Chiefdoms|700:the Jutish and Danish tribes:Tribal kingdoms|965:the Viking kingdom of Denmark:Kingdom|1397:the Kingdom of Denmark:Kingdom|1814:Denmark-Norway:Union of crowns|1849:the Danish realm:Absolute monarchy|Denmark:Constitutional monarchy;
cap=965:Jelling|1167:Roskilde|99999:Copenhagen; cur=1873:rigsdaler:rd:25|1913:kroner:kr:0.27|1945:kroner:kr:0.2|1999:kroner:kr:0.15|2029:kroner:kr:0.14|kroner:kr:0.14;
pop=1800:0.93,1900:2.5,1950:4.3,2000:5.3,2025:5.95; pm=1.1; nc=1000:norse|2029:nordic; ga=nord; eth=Danes:84:nord,Faroese and Greenlanders:1:nord,Turkish and Middle Eastern:5:arab@1965,Other European:5:weur@1990,Other:5:world@1990;
rs=-10000>pa:100|500>no:100|965>no:50 ch:50|1100>ch:100|1536>pr:100|1950>pr:92 sc:6 ot:2|2025>pr:60 sc:30 su:5 ch:1 ot:4;
cu=nordic; lg=Danish,Faroese,Greenlandic; fd=smørrebrød@1800,frikadeller@1700,Danish pastry@1850; fs=Constitution Day@1849,Sankt Hans Aften@1500,Christmas Julefrokost@1900; sp=handball@1930,football@1880,badminton@1930;
cs=Hygge: coziness with candles and company|Cycling is the default way to travel|Trust and tolerance in public life; tr=Flexicurity labour market|Very high taxes and very high trust;
arr=0; arrT=1700; wv=1915; dv=1582; sx=2012; tier=1; mil=4; pp=1; ww=2; gv=mon;
ov=viking:800:1050|dan:1050:1814;bl=nato:1949|eu:1973;
ev=1018 pol Cnut the Great rules England, Denmark and Norway together.|1397 pol Margaret I joins the three Scandinavian crowns.|1801 war Battle of Copenhagen: the British bombard the city and seize the Danish fleet #d=.04,m=.03|1864 war The Second Schleswig War: Denmark loses a third of its land #d=.08,m=.04|1940-1945 war German occupation of Denmark #d=.01,m=.01|1943 pol Danes shelter their Jewish neighbours and ferry them to Sweden.;
ci=Roskilde~900~0~900:2 1100:3 1500:2|Copenhagen~1043~0~1043:2 1167:3 1500:4 1700:5 1900:6|Aarhus~770~0~770:2 1500:3 1900:4|Odense~988~0~988:2 1500:3;`);

Land(`FIN|Finland|Finnish|eu-nord
pre=eun:-1700; from=-8500; nm=-500:the Comb Ceramic and Kiukainen hunters:Forager bands|1150:the Finnic tribes:Tribes|1809:Finland under Sweden:Province of Sweden|1917:the Grand Duchy of Finland:Grand duchy under the Tsar|Finland:Republic;
cap=1150:Turku|1812:Turku|1819:Helsinki|99999:Helsinki; cur=1860:Swedish riksdaler:rd:20|1913:markka:mk:0.19|1945:markka:mk:0.17|1999:markka:mk:0.01|2029:euros:€:1.1|euros:€:1.1;
pop=1800:0.83,1900:2.7,1950:4,2000:5.2,2025:5.6; pm=0.35; nc=1150:finnic|2029:finnic; ga=nord; mix=SCA:.3,RUS:.3,CHN:.05,ENG:.1; gx={'eb':0.6,'hd':0.35};
eth=Finns:87:nord,Swedish-speaking Finns:5:nord,Sámi and Karelians:1:nord,Russians and Estonians:2:slav@1990,Other:5:world@1990;
rs=-10000>an:100|-500>an:100|1150>ch:100|1527>pr:100|1950>pr:90 or:2 sc:7 ot:1|2025>pr:62 sc:30 or:1 su:2 ot:5;
cu=nordic T5; lg=Finnish,Swedish,Sámi; fd=karelian pasties@1700,salmiakki@1900,rye bread@1000; fs=Midsummer (Juhannus)@1500,Independence Day@1917,Vappu@1900; sp=ice hockey@1920,pesäpallo@1920,rally driving@1950;
cs=The sauna is the heart of the home|Silence is comfortable|Sisu: stoic grit; tr=High-trust welfare state and famous schools|Neutrality and a long border with Russia;
arr=0; arrT=1700; wv=1906; dv=1929; sx=2017; ind=1917; indFrom=Russia; tier=1; mil=5; pp=1; ww=2; gv=dem;
ov=swedemp:1200:1809|rusemp:1809:1917; bl=eu:1995|nato:2023;
ev=1155 pol The first Swedish crusade brings Finland into the Swedish realm.|1809 pol Sweden cedes Finland to Russia and it becomes a grand duchy.|1917 pol Finland declares independence.|1918 war The Finnish Civil War: Whites against Reds #d=.05,m=.04|1939-1940 war The Winter War: Finland resists the Soviet invasion #d=.2,m=.05|1941-1944 war The Continuation War #d=.15,m=.04;
ci=Turku~1200~0~1200:2 1500:3 1800:3|Helsinki~1550~0~1550:1 1812:3 1900:4 1950:5|Tampere~1779~0~1779:2 1900:4|Oulu~1605~0~1605:2 1900:3;`);

Land(`ISL|Iceland|Icelandic|eu-nord
pre=eun:-1700; from=874; nm=874:the Norse settlement of Iceland:Free farmers' commonwealth|1262:the Icelandic Commonwealth:Commonwealth of chieftains|1944:Iceland under Norway and Denmark:Province of the Nordic crowns|Iceland:Republic;
cap=99999:Reykjavik; cur=1873:Danish rigsdaler:rd:25|1913:krónur:kr:0.27|1945:krónur:kr:0.15|1999:krónur:kr:0.014|2029:krónur:kr:0.0073|krónur:kr:0.0073;
pop=1800:0.047,1900:0.078,1950:0.143,2000:0.28,2025:0.39; pm=0.5; nc=1000:norse|2029:nordic; ga=nord;
eth=Icelanders:85:nord,Poles and other Europeans:8:slav@1995,Other:7:world@1995;
rs=874>no:80 ce:20|1000>no:50 ch:50|1100>ch:100|1550>pr:100|1950>pr:92 sc:6 ot:2|2025>pr:60 sc:30 ot:6 ch:4;
cu=nordic G8; lg=Icelandic; fd=hákarl@1000,skyr@1000,lamb soup@1700; fs=Thorrablót@1850,Þingvellir Day@1944,Christmas Yule Lads@1800; sp=handball@1950,football@1950,glíma wrestling@1000;
cs=Everyone is in the phone book by first name|Naming by patronymic: Jónsson and Jónsdóttir|Every family reads at Christmas, in the 'book flood'; tr=The oldest parliament, the Althing, from 930|Tiny and very equal society|Volcanoes and fish decide the economy;
arr=0; arrT=1000; wv=1915; dv=1900; sx=2010; ind=1944; indFrom=Denmark; tier=1; mil=0; pp=1; ww=; gv=dem;
ov=dan:1397:1944; bl=nato:1949;
ev=930 law The Althing, one of the world's oldest parliaments, first meets at Þingvellir.|1000 pol Iceland adopts Christianity by a vote at the Althing.|1783 dis The Laki eruption poisons the land and kills a fifth of the people. #h=-15,l=.3|2008 pol Iceland's banks collapse in the financial crisis.;
ci=Reykjavik~874~0~874:1 1800:2 1900:3 1950:4;`);

Land(`EST|Estonia|Estonian|eu-balt
pre=eun:-1700; from=-9000; nm=-500:the Comb Ceramic hunters and Finnic farmers:Forager bands and villages|1200:the Estonian tribes:Tribes|1561:Livonia under the Teutonic knights:Crusader state|1721:Swedish Estonia:Province of Sweden|1918:Estonia under the Tsars:Province of Russia|1940:Estonia:Republic|1991:the Estonian SSR:Soviet republic|Estonia:Parliamentary republic;
cap=1200:Tallinn|99999:Tallinn; cur=1913:rubles:₽:0.5|1945:kroons:kr:0.15|1991:rubles:₽:0.02|2010:kroons:kr:0.08|euros:€:1.1;
pop=1800:0.3,1900:0.9,1950:1.1,2000:1.4,2025:1.37; pm=0.25; nc=1200:finnic|finnic; ga=baltic; eth=Estonians:69:nord,Russians:24:slav@1710,Ukrainians and Belarusians:4:slav@1945,Other:3:world@1990;
rs=-10000>an:100|1200>ch:100|1525>pr:100|1950>pr:60 or:30 sc:10|2025>sc:58 pr:18 or:17 ot:7;
cu=baltic O10 R-10 G10; lg=Estonian,Russian; fd=black bread@1200,sült@1800,kama@1900; fs=Midsummer Jaaniõhtu@1000,Song Festival@1869,Independence Day@1918; sp=basketball@1920,cross-country skiing@1900,wrestling@1900;
cs=Singing is a national passion|Sauna as a family ritual|Reserved in conversation; tr=A leading digital society|Memories of Soviet occupation shape politics;
arr=0; arrT=1780; wv=1918; dv=1920; sx=2024; ind=1991; indFrom=the Soviet Union; tier=2; mil=2; pp=1; ww=12; gv=dem; net=1998:92;
ov=teut:1200:1561|swedemp:1561:1721|rusemp:1721:1918|soviet:1940:1991; bl=nato:2004|eu:2004;
ev=1219 war The Danish crusade: Danes and German crusaders conquer northern Estonia #d=.05,m=.05|1721 pol Russia takes Estonia from Sweden.|1918 pol Estonia declares independence.|1940 pol The Soviet Union occupies Estonia.|1949 pol Soviet deportations remove tens of thousands of Estonians.|1991 pol The Singing Revolution restores Estonian independence.;
ci=Tallinn~1219~0~1219:2 1300:3 1700:3 1900:4|Tartu~1030~0~1030:2 1600:3|Pärnu~1251~0~1251:2 1800:3;`);

Land(`LVA|Latvia|Latvian|eu-balt
pre=eun:-1700; from=-9000; nm=-500:the Baltic tribes:Tribes|1200:the Latgalian and Semigallian tribes:Tribal kingdoms|1561:Livonia under the Teutonic knights:Crusader state|1721:Polish-Swedish Livonia:Province of Sweden|1918:Latvia under the Tsars:Province of Russia|1940:Latvia:Republic|1991:the Latvian SSR:Soviet republic|Latvia:Parliamentary republic;
cap=1200:Riga|99999:Riga; cur=1913:rubles:₽:0.5|1945:lats:Ls:0.5|1991:rubles:₽:0.02|2014:lats:Ls:1.6|euros:€:1.1;
pop=1800:0.6,1900:2,1950:1.9,2000:2.4,2025:1.87; pm=0.3; nc=1200:baltic|baltic; ga=baltic; eth=Latvians:62:nord,Russians:24:slav@1945,Belarusians and Ukrainians:7:slav@1945,Other:7:world@1990;
rs=-10000>an:100|1200>ch:100|1522>pr:80 ch:20|1950>pr:30 ch:25 or:25 sc:20|2025>sc:35 pr:20 ch:20 or:20 ot:5;
cu=baltic; lg=Latvian,Russian,Latgalian; fd=grey peas with bacon@1700,rupjmaize@1200,Riga balsam@1752; fs=Jāņi Midsummer@1000,Song and Dance Festival@1873,Lāčplēsis Day@1919; sp=ice hockey@1930,basketball@1920,bobsled@1930;
cs=Folk songs (dainas) are the soul of the nation|Midsummer wreaths of oak and wildflowers|Hospitality at the table; tr=A large Russian-speaking minority|Strong ties with the Baltic neighbours;
arr=0; arrT=1780; wv=1918; dv=1920; sx=; ind=1991; indFrom=the Soviet Union; tier=2; mil=2; pp=1; ww=12; gv=dem;
ov=teut:1200:1561|swedemp:1621:1721|rusemp:1721:1918|soviet:1940:1991; bl=nato:2004|eu:2004;
ev=1201 pol Riga is founded by the crusading Bishop Albert.|1282 pol Riga joins the Hanseatic League.|1721 pol Russia takes Livonia from Sweden.|1918 pol Latvia declares independence.|1940 pol The Soviet Union occupies Latvia.|1989 pol The Baltic Way: two million link hands from Tallinn to Vilnius.;
ci=Riga~1201~0~1201:3 1300:4 1700:4 1900:5 1950:5|Daugavpils~1275~0~1275:2 1800:3|Liepāja~1625~0~1625:2 1900:3;`);

Land(`LTU|Lithuania|Lithuanian|eu-balt
pre=eun:-1700; from=-9000; nm=-500:the Baltic tribes:Tribes|1236:the Lithuanian tribes:Tribal confederation|1385:the Grand Duchy of Lithuania:Grand duchy|1569:the Polish–Lithuanian Commonwealth:Elective monarchy|1795:Lithuania under the Tsars:Province of Russia|1918:Lithuania:Republic|1990:the Lithuanian SSR:Soviet republic|Lithuania:Parliamentary republic;
cap=1236:Kernavė|1323:Vilnius|1795:Vilnius|1920:Kaunas|99999:Vilnius; cur=1795:Polish groschen:gr:0.8|1913:rubles:₽:0.5|1945:litai:Lt:0.1|1991:rubles:₽:0.02|2014:litai:Lt:0.38|euros:€:1.1;
pop=1800:0.9,1900:2.7,1950:2.6,2000:3.5,2025:2.86; pm=0.3; nc=1236:baltic|baltic; ga=baltic; eth=Lithuanians:84:nord,Poles:6:slav@1385,Russians:5:slav@1945,Other:5:world@1990;
rs=-10000>an:100|1236>sl:70 pa:30|1387>ch:100|1950>ch:80 or:10 pr:5 sc:5|2025>ch:74 or:4 sc:14 pr:2 ot:6;
cu=baltic R10; lg=Lithuanian,Polish,Russian; fd=cepelinai@1800,šaltibarščiai@1800,kugelis@1800; fs=Midsummer Joninės@1000,Kūčios Christmas Eve@1500,Independence Day@1918; sp=basketball@1920,football@1920,sports of the Žalgiris@1944;
cs=Basketball is nearly a religion|Amber is the national jewel|Folk crafts and choirs; tr=Once the largest state in Europe|Catholic traditions are strong;
arr=1; arrT=1780; wv=1918; dv=1990; sx=; ind=1990; indFrom=the Soviet Union; tier=2; mil=2; pp=1; ww=12; gv=dem;
ov=lith:1236:1569|polish:1569:1795|rusemp:1795:1915|soviet:1940:1990; bl=nato:2004|eu:2004;
ev=1236 war Battle of Saule: Lithuanians defeat the Livonian knights #d=.1,m=.05|1386 pol Lithuania and Poland are joined by the marriage of Jogaila and Jadwiga.|1410 war Battle of Grunwald: the Teutonic Order is broken #d=.08,m=.06|1569 pol The Union of Lublin creates the Polish-Lithuanian Commonwealth.|1795 pol The Commonwealth is partitioned.|1990 pol Lithuania is the first Soviet republic to declare independence.;
ci=Vilnius~1323~0~1323:3 1500:4 1900:4 1950:5|Kaunas~1030~0~1030:2 1500:3 1920:4|Klaipėda~1252~0~1252:2 1800:3;`);

Land(`NLD|the Netherlands|Dutch|eu-west
pre=euw:-500; nm=-500:the Low Country marshes:Chiefdoms|50:the Frisian and Batavian lands:Tribal federations|482:Roman Germania Inferior:Roman province|800:the Frankish Low Countries:Frankish kingdom|1581:the Dutch lands under the Holy Roman Empire:County and duchy|1795:the Dutch Republic:Federal republic|1815:the Batavian Republic:Revolutionary republic|Netherlands:Constitutional monarchy;
cap=482:Tolbiac|800:Aachen|1581:Utrecht|1795:Amsterdam|99999:Amsterdam; cur=1815:guilders:ƒ:0.4|1913:guilders:ƒ:0.4|1945:guilders:ƒ:0.38|1999:guilders:ƒ:0.5|2029:euros:€:1.1|euros:€:1.1;
pop=1800:2.1,1900:5.1,1950:10,2000:15.9,2025:17.9; pm=1.2; nc=1795:dutch|dutch; ga=weur; mix=FRA:.4,ENG:.3,SCA:.3;
eth=Dutch:75:nweur,Frisians:3:nweur,Indo-Dutch and Indonesian:3:seai@1950,Turkish and Moroccan:5:arab@1960,Surinamese and Caribbean:3:waf@1975,Other:11:world@1980;
rs=-10000>pa:100|-500>ce:40 pa:60|50>ag:30 ce:30 pa:40|700>ch:100|1580>ch:50 pr:50|1700>pr:60 ch:38 ju:2|1950>pr:42 ch:38 sc:18 ju:1 ot:1|2025>sc:55 ch:19 pr:14 su:5 ot:7;
cu=germanic O15 G10; lg=Dutch,Frisian; fd=stroopwafels@1840,bitterballen@1900,herring with onion@1500; fs=King's Day@1885,Sinterklaas@1500,Carnival@1500; sp=football@1880,speed skating@1600,cycling@1890;
cs=Direct speech: honesty over tact|Cycling is life|Birthday circles with a chair ring; tr=Famous tolerance and consensus politics (the polder model)|Land reclaimed from the sea;
arr=0; arrT=1650; wv=1919; dv=1838; sx=2001; tier=1; mil=4; pp=1; ww=12; gv=mon;
ov=roman:12:410|frank:482:843|hre:843:1581|dutch:1581:1795|french:1795:1815|dutch:1815:1975;
bl=nato:1949|eu:1958;
ev=1566-1648 war The Eighty Years' War: the Dutch rebel against Spain. #d=.08,m=.05|1602 tech The Dutch East India Company is founded and soon rules the seas.|1648 pol The Dutch Republic wins recognition and enters its Golden Age.|1795 rev French armies help found the Batavian Republic. #s=.2|1940 war The German invasion and occupation of the Netherlands #d=.05,m=.03|1944-1945 fam The Hunger Winter starves the west of the country. #m=.02,h=15|1953 dis The North Sea flood drowns the southwest. #p=.03,h=-15,l=.4;
ci=Utrecht~47~0~47:2 700:3 1300:4 1600:4|Amsterdam~1275~0~1275:2 1400:3 1600:5 1700:5 1900:6|Rotterdam~1270~0~1270:2 1700:4 1900:5|The Hague~1248~0~1248:2 1500:3 1900:5;`);

Land(`BEL|Belgium|Belgian|eu-west
pre=euw:-500; nm=-500:the Gaulish and Belgic tribes:Tribes|50:the Belgae of Gaul:Tribes|482:Roman Gallia Belgica:Roman province|800:the Frankish Low Countries:Frankish kingdom|1581:the Southern Netherlands:Spanish and Austrian provinces|1795:Belgium under France:French departments|1830:the United Kingdom of the Netherlands:Dutch rule|Belgium:Constitutional monarchy;
cap=482:Tournai|800:Aachen|1581:Brussels|1795:Brussels|99999:Brussels; cur=1830:Belgian francs:Fr:0.19|1913:francs:Fr:0.19|1945:francs:Fr:0.02|1999:francs:Fr:0.026|2029:euros:€:1.1|euros:€:1.1;
pop=1800:3,1900:6.7,1950:8.6,2000:10.2,2025:11.8; pm=1.3; nc=1795:french|french; ga=weur; eth=Flemish:55:nweur,Walloons:32:weur,Moroccan and Turkish:4:arab@1960,Italian and other European:4:seur@1950,Other:5:world@1980;
rs=-10000>pa:100|-500>ce:60 pa:40|50>ag:30 ce:30 pa:40|700>ch:100|1960>ch:75 sc:20 ot:5|2025>ch:52 sc:34 su:6 pr:2 ot:6;
cu=latin O5; lg=Dutch,French,German; fd=moules-frites@1800,Belgian chocolate@1860,waffles@1500; fs=National Day@1831,Carnival of Binche@1500,Ommegang@1549; sp=cycling@1890,football@1895,tennis@1980;
cs=Beer is a heritage|Two languages, one country|Comic strips are respected art; tr=Divided between Dutch and French speakers|Home to EU institutions;
arr=0; arrT=1700; wv=1948; dv=1803; sx=2003; ind=1830; indFrom=the Netherlands; tier=1; mil=3; pp=1; ww=12; gv=mon;
ov=roman:12:410|frank:482:843|hre:843:1581|span:1581:1714|habs:1714:1795|french:1795:1815|belg:1830:1962;
bl=nato:1949|eu:1958;
ev=1302 war Battle of the Golden Spurs: Flemish townsmen beat French knights #d=.05,m=.05|1815 war Waterloo: Napoleon is defeated on Belgian soil. #d=.1,m=.08|1830 rev The Belgian Revolution separates the south from the Dutch crown. #s=.05|1914-1918 war The German invasion of Belgium: the Great War is fought on Belgian soil #d=.1,m=.05|1940 war The German invasion and occupation #d=.05,m=.03|1960 pol The Congo gains independence from Belgium.;
ci=Bruges~800~0~800:2 1200:4 1400:5 1700:3|Ghent~630~0~630:2 1200:4 1400:5 1800:4|Brussels~979~0~979:2 1300:4 1600:4 1850:5 1950:6|Antwerp~600~0~600:2 1400:4 1560:5 1900:5;`);

Land(`LUX|Luxembourg|Luxembourgish|eu-west
pre=euw:-500; nm=-500:the Treveri and Gallic tribes:Tribes|482:Roman Belgica Prima:Roman province|963:the Frankish heartland:Frankish kingdom|1354:the County of Luxembourg:County|1815:the Duchy of Luxembourg:Duchy|1890:the Grand Duchy under the Dutch crown:Grand duchy|Luxembourg:Constitutional monarchy;
cap=99999:Luxembourg; cur=1913:francs:Fr:0.19|1945:francs:Fr:0.02|1999:francs:Fr:0.026|2029:euros:€:1.1|euros:€:1.1;
pop=1800:0.17,1900:0.24,1950:0.3,2000:0.44,2025:0.67; pm=1; nc=1000:french|german; ga=weur; eth=Luxembourgers:48:nweur,Portuguese:15:iber@1960,French and Belgian:10:weur@1990,Italian and other European:12:seur@1990,Other:15:world@1990;
rs=-10000>pa:100|700>ch:100|1960>ch:90 pr:3 sc:6 ot:1|2025>ch:55 sc:30 pr:3 su:4 ot:8;
cu=germanic O10; lg=Luxembourgish,French,German; fd=judd mat gaardebounen@1700,quetsch tart@1800,bouneschlupp@1800; fs=National Day@1961,Schueberfouer@1340,Emaischen@1500; sp=cycling@1890,football@1920,running@1960;
cs=Trilingual by habit|Mix of German and French cooking|Church holidays still count; tr=Among the world's richest per person|A hub of banking and EU institutions;
arr=0; arrT=1700; wv=1919; dv=1880; sx=2015; ind=1839; indFrom=the Netherlands; tier=1; mil=1; pp=1; ww=12; gv=mon;
ov=roman:12:410|frank:482:843|hre:843:1795|french:1795:1815|dutch:1815:1890;
bl=nato:1949|eu:1958;
ev=963 pol Count Siegfried builds a castle on the Bock rock and founds Luxembourg.|1815 pol The Congress of Vienna makes Luxembourg a grand duchy.|1867 pol The Treaty of London guarantees Luxembourg's neutrality.|1940 war German occupation of Luxembourg #d=.02,m=.02;
ci=Luxembourg~963~0~963:2 1500:3 1900:3 1990:4;`);

Land(`FRA|France|French|eu-west
cu=latin O5; eth=French:80:weur,Breton and Alsatian:3:weur,North African:7:berber@1960,Sub-Saharan African:3:waf@1960,Southern European:3:seur@1920,Other:4:world@1980;
rs=-10000>pa:100|-500>ce:70 pa:30|-50>ag:50 ce:40 pa:10|313>ag:30 ch:70|500>ch:100|1560>ch:80 pr:15 ju:1|1700>ch:95 pr:4 ju:1|1900>ch:90 pr:3 sc:6 ju:1|1980>ch:70 sc:22 su:5 pr:2 ju:1|2025>sc:37 ch:42 su:10 pr:2 ju:1 bm:1 ot:7;
lg=French,Breton,Occitan,Alsatian; fd=baguette@1800,coq au vin@1600,croissants@1850; fs=Bastille Day@1880,Fête de la Musique@1982,Mardi Gras@1100; sp=football@1890,cycling (Tour de France)@1903,rugby@1900;
cs=Greeting with la bise, kisses on the cheek|Long lunches and fine food|Strikes and protest are traditions; tr=Laïcité: strict secularism in public life|Centralised state|Rich cultural policy;
arr=2; arrT=1700; wv=1944; dv=1884; sx=2013; tier=1; mil=8; pp=1; ww=12; dual=y; cit=mix; gv=flaw;
ov=roman:-51:476|frank:481:843|french:1604:1962; bl=nato:1949|eu:1958|francophonie:1970;`);

Land(`DEU|Germany|German|eu-cent
pre=euc:-500; nm=-500:the Germanic tribes:Tribes|476:Germania beyond the Rhine:Tribal confederations|800:the Frankish Empire:Frankish kingdom|962:the Holy Roman Empire:Empire of princes|1806:the German Confederation:Confederation of states|1871:the German Confederation and Prussia:Kingdom and confederation|1918:the German Empire:Empire|1933:the Weimar Republic:Republic|1945:Nazi Germany:One-party dictatorship|1990:divided Germany:Occupied zones, then two states|Germany:Federal republic;
cap=476:Trier|800:Aachen|1806:Vienna|1871:Berlin|1945:Berlin|1990:Bonn|99999:Berlin; cur=-300:salt and bronze rings:_:3|800:denarii:d:20|1300:pfennigs:pf:2|1500:groschen:gr:12|1800:thalers:th:100|1873:thalers:th:0.7|1913:marks:M:0.24|1923:Reichsmarks:RM:0.24|1945:Reichsmarks:RM:0.24|1948:Deutschmarks:DM:0.3|1999:Deutschmarks:DM:0.55|2029:euros:€:1.1|euros:€:1.1;
pop=1800:24,1900:56,1950:68,2000:82,2025:84; pm=1; nc=500:german|german; ga=ceur; eth=Germans:77:weur,Turkish Germans:5:turk@1961,Poles and Eastern Europeans:6:slav@1990,Italian and Southern European:3:seur@1955,Middle Eastern and Afghan:4:arab@2015,Other:5:world@1980;
rs=-10000>pa:100|-500>pa:100|500>pa:85 ch:15|800>ch:100|1520>ch:50 pr:50|1700>pr:55 ch:42 ju:1 ot:2|1900>pr:62 ch:36 ju:1 sc:1|1950>pr:50 ch:45 sc:5|2000>pr:30 ch:30 sc:30 su:5 ot:5|2025>sc:42 pr:22 ch:24 su:7 or:2 ot:3;
cu=germanic; lg=German,Low German,Sorbian,Danish; fd=bratwurst@1500,sauerkraut@1500,pretzels@1500; fs=Oktoberfest@1810,Christmas markets@1400,German Unity Day@1990; sp=football@1890,handball@1900,Formula One and motor racing@1950;
cs=Punctuality is respect|Recycling is a civic duty|Quiet on Sundays; tr=A federation of sixteen states|The memory of the Nazi years shapes public life|Strong apprenticeships and engineering;
arr=0; arrT=1700; wv=1918; dv=1875; sx=2017; tier=1; mil=6; pp=1; ww=12; dual=l; cit=sang; gv=dem;
ov=roman:9:476|frank:481:843|hre:843:1806|german:1871:1918|german:1933:1945; bl=nato:1955|eu:1958;
ev=9 war Battle of the Teutoburg Forest: Arminius destroys three Roman legions #d=.1,m=.1|800 pol Charlemagne is crowned Emperor in Rome.|1517 pol Martin Luther posts his Ninety-Five Theses at Wittenberg.|1618-1648 war The Thirty Years' War: the German lands are devastated #d=.15,m=.1,c=.03|1871 pol Bismarck proclaims the German Empire at Versailles.|1933 pol Hitler becomes Chancellor and the Nazi dictatorship begins.|1945 pol Germany surrenders and is divided into occupation zones.|1961 pol The Berlin Wall is built.|1989 pol The Berlin Wall falls.|1990 pol Germany is reunified.;
ci=Trier~-16~0~-16:3 100:4 300:5 450:3 1000:3|Cologne~-38~0~-38:3 100:4 1300:5 1600:4 1900:5|Aachen~100~0~100:2 800:4 1200:3|Hamburg~810~0~810:2 1300:4 1600:5 1900:6|Berlin~1237~0~1237:2 1500:3 1700:5 1871:6|Munich~1158~0~1158:2 1500:4 1900:5|Frankfurt~794~0~794:2 1300:4 1900:5|Dresden~1206~0~1206:2 1700:4 1900:5;`);

Land(`AUT|Austria|Austrian|eu-cent
pre=euc:-500; nm=-500:the Hallstatt and Celtic Noricum:Tribal kingdom|15:the Roman province of Noricum:Roman province|800:the Bavarian and Carolingian marches:March of the Empire|976:the Duchy of Austria:Duchy|1526:the Habsburg domains:Hereditary monarchy|1804:the Austrian Empire:Empire|1867:Austria-Hungary:Dual monarchy|1918:the Republic of German-Austria:Republic|1938:Austria annexed to Germany:Annexed|1955:Allied-occupied Austria:Occupied zones|Austria:Federal republic;
cap=15:Virunum|976:Melk|1155:Vienna|99999:Vienna; cur=1800:gulden:fl:60|1867:gulden:fl:0.5|1913:kronen:K:0.2|1925:schillings:S:0.14|1945:schillings:S:0.14|1999:schillings:S:0.075|2029:euros:€:1.1|euros:€:1.1;
pop=1800:3,1900:6,1950:6.9,2000:8,2025:9.2; pm=0.8; nc=800:german|german; ga=ceur; eth=Austrians:75:weur,Germans:3:weur,Serbs and Bosnians:5:balk@1970,Turks:3:turk@1964,Other Europeans:7:slav@1990,Other:7:world@1990;
rs=-10000>pa:100|-500>ce:70 pa:30|500>pa:80 ch:20|800>ch:100|1550>ch:70 pr:30|1650>ch:98 pr:2|1950>ch:88 pr:5 sc:5 ju:1|2025>ch:55 sc:24 su:8 or:7 pr:3 ot:3;
cu=germanic T10 H5 G-3; lg=German,Slovene,Hungarian,Croatian; fd=Wiener schnitzel@1830,Sachertorte@1832,apfelstrudel@1700; fs=Fasching@1400,Christmas markets@1400,National Day@1955; sp=alpine skiing@1930,football@1920,ski jumping@1920;
cs=Coffee house culture is a UNESCO heritage|Balls and waltzes in the winter season|Formal greetings and titles; tr=Neutral since 1955|Cultural capital: music, art, ideas;
arr=0; arrT=1700; wv=1918; dv=1938; sx=2019; tier=1; mil=2; pp=1; ww=12; gv=dem;
ov=roman:15:476|frank:800:976|habs:1276:1918|german:1938:1945; bl=eu:1995;
ev=1273 pol Rudolf of Habsburg is elected king and his house begins to rule Austria.|1529 war Siege of Vienna: the Ottomans besiege the city for the first time #d=.1,m=.1|1683 war Second Siege of Vienna: the Ottoman army is broken at the gates #d=.1,m=.1|1814 pol The Congress of Vienna redraws Europe.|1914 war The assassination of Franz Ferdinand starts the Great War.|1938 pol The Anschluss: Austria is annexed by Germany.|1955 pol The State Treaty restores a free, neutral Austria.;
ci=Virunum~15~500~15:3 150:4|Salzburg~15~0~15:3 700:3 1500:3 1900:3|Vienna~15~0~15:3 1155:3 1500:4 1700:6 1900:7|Graz~1128~0~1128:2 1800:4|Innsbruck~1180~0~1180:2 1800:3;`);

Land(`CHE|Switzerland|Swiss|eu-cent
pre=euc:-500; nm=-500:the Helvetii and Rhaetian tribes:Tribes|15:the Roman provinces of the Alps:Roman provinces|600:the Burgundian and Alemannic lands:Kingdoms|1291:the Alpine cantons of the Empire:Imperial cantons|1798:the Old Swiss Confederacy:Confederation of cantons|1803:the Helvetic Republic:French client republic|1848:the Swiss cantons:Confederation|Switzerland:Federal republic;
cap=15:Aventicum|1291:Bern|99999:Bern; cur=1798:Swiss francs:Fr:0.2|1913:francs:Fr:0.2|1945:francs:Fr:0.23|1999:francs:Fr:0.6|2029:francs:Fr:1.15|francs:Fr:1.15;
pop=1800:1.7,1900:3.3,1950:4.7,2000:7.2,2025:9; pm=0.8; nc=800:german|german; ga=ceur; eth=German-speaking Swiss:58:weur,French-speaking Swiss:22:weur,Italian-speaking Swiss:8:seur,Balkan and Turkish:6:balk@1970,Other:6:world@1980;
rs=-10000>pa:100|-500>ce:60 pa:40|500>ch:100|1530>ch:55 pr:45|1950>pr:55 ch:42 sc:3|2025>ch:34 pr:23 sc:30 su:6 or:3 ot:4;
cu=germanic T5 O0; lg=German,French,Italian,Romansh; fd=cheese fondue@1700,raclette@1291,chocolate@1875; fs=Swiss National Day@1891,Fasnacht@1400,Yodel festivals@1805; sp=skiing@1900,tennis@1980,hornussen@1500;
cs=Neutrality is a way of life|Direct democracy: citizens vote often|Military service is a rite for men; tr=Four national languages|High incomes and secret banks;
arr=0; arrT=1700; wv=1971; dv=1876; sx=2022; tier=1; mil=2; pp=1; ww=; dual=y; gv=dem;
ov=roman:15:476|frank:800:911|hre:1033:1648; bl=;
ev=1291 pol Three cantons swear the Oath of the Rütli and found the Confederacy.|1315 war Battle of Morgarten: Swiss peasants rout Habsburg knights #d=.05,m=.05|1648 pol The Peace of Westphalia recognises Swiss independence.|1815 pol The great powers guarantee Swiss neutrality.|1863 pol The Red Cross is founded in Geneva.;
ci=Geneva~-120~0~-120:2 1200:3 1550:4 1900:4|Zurich~-50~0~-50:2 1200:3 1600:4 1900:5|Basel~-44~0~-44:2 1100:3 1500:4 1900:5|Bern~1191~0~1191:2 1500:3 1900:4;`);

Land(`LIE|Liechtenstein|Liechtensteiner|eu-cent
pre=euc:-500; nm=-500:the Rhaetian Alps:Tribes|15:Roman Raetia:Roman province|700:the Alemannic lands:Frankish duchy|1712:the Lordships of Schellenberg and Vaduz:Imperial lordships|1806:the Principality of Liechtenstein:Principality|Liechtenstein:Constitutional principality;
cap=99999:Vaduz; cur=1913:Austrian crowns:K:0.2|1921:Swiss francs:Fr:0.2|1945:Swiss francs:Fr:0.23|1999:Swiss francs:Fr:0.6|2029:francs:Fr:1.15|francs:Fr:1.15;
pop=1800:0.006,1900:0.009,1950:0.014,2000:0.033,2025:0.04; pm=0.5; nc=800:german|german; ga=ceur;
eth=Liechtensteiners:66:weur,Swiss and Austrians:20:weur,Other:14:world@1990;
rs=-10000>pa:100|500>ch:100|1950>ch:90 pr:8 sc:2|2025>ch:67 pr:8 su:5 sc:15 ot:5;
cu=germanic T10; lg=German,Alemannic; fd=Käsknöpfle@1700,Ribel@1700,Hafalaab@1700; fs=State Day@1940,Staatsfeiertag@1940,Alpabtrieb@1700; sp=skiing@1950,football@1950;
cs=A prince rules a land of cheese and finance|Hiking the Alps is leisure|Close to Swiss ways; tr=A tiny wealthy principality|Strong direct democracy and a prince's veto;
arr=0; arrT=1700; wv=1984; dv=1974; sx=2025; ind=1806; indFrom=the Holy Roman Empire; tier=1; mil=0; pp=1; ww=; gv=mon;
ov=roman:15:476|frank:700:911|hre:911:1806|; bl=;
ev=1719 pol Emperor Charles VI unites Vaduz and Schellenberg as the Principality of Liechtenstein.|1868 pol Liechtenstein abolishes its army.|1921 pol A new constitution ties the prince to a parliament.;
ci=Vaduz~1322~0~1322:1 1700:2 1950:3;`);

Land(`MCO|Monaco|Monégasque|eu-west
pre=euw:-500; nm=-500:the Ligurian coast:Tribes|15:Roman Alpes Maritimae:Roman province|1297:the Ligurian coast of Genoa:Genoese port|1814:the Lordship of Monaco:Lordship of the Grimaldi|Monaco:Principality;
cap=99999:Monaco; cur=1913:French francs:F:0.19|1945:francs:F:0.01|1999:francs:F:0.15|2029:euros:€:1.1|euros:€:1.1;
pop=1800:0.006,1900:0.016,1950:0.02,2000:0.032,2025:0.039; pm=0.5; nc=1000:italian|french; ga=weur;
eth=Monégasques:22:seur,French:28:weur,Italians:19:seur,British and others:31:world@1990;
rs=-10000>pa:100|500>ch:100|1950>ch:90 pr:5 ju:1 sc:4|2025>ch:80 pr:5 ju:1 sc:10 ot:4;
cu=latin; lg=French,Monégasque,Italian; fd=barbagiuan@1800,socca@1800,pissaladière@1800; fs=Saint Devote@1500,Monaco Grand Prix@1929,National Day@1860; sp=Formula One@1950,football@1920;
cs=Casinos fund the state|The Grimaldi dynasty is ever present|Glamour and discretion; tr=Few citizens and many residents|No income tax;
arr=0; arrT=1700; wv=1962; dv=1900; sx=; ind=1297; tier=1; mil=0; pp=1; ww=; gv=mon;
ov=roman:15:476|genoa:1215:1297; bl=;
ev=1297 pol François Grimaldi, disguised as a monk, seizes the fortress of Monaco: the Grimaldis begin their rule.|1861 pol France recognises Monaco's independence.|1863 tech Monte Carlo opens its casino.;
ci=Monaco~1297~0~1297:1 1800:2 1900:3 1950:4;`);

/* ===== Europe 1 is complete; the others follow in data-atlas-europe2.js and data-atlas-europe3.js ===== */
