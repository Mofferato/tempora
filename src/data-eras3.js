/* =====================================================================
   ERA TABLES, part 3 — World Wars, Modern
   when: 'war' limits an event/activity to years with an active war.
   Disease flags: kid (children mostly), adult (adults only), ag (risk rises with age)
   ===================================================================== */

DATA.eras.push({
  id: 'wars', name: 'World Wars', from: 1914, to: 1945,
  blurb: 'Two world wars, a pandemic and a depression. Radios crackle with news that changes everything.',
  pal: ['#5E6B34', '#AEBF70'],
  cur: { n: 'dollars', s: '$', r: 16 },
  life: { adult: 66, child: 0.12, med: 0.25, acc: 0.007, fert: 0.17, age: 0.9, tax: 0.15, retire: 65, birth: 0.004 },
  cost: 450, names: 'wars',
  edu: { n: ['Unschooled', 'Grade school', 'High school', 'College', 'Graduate school'], comp: 1, cost: [0, 0, 20, 300, 500] },
  laws: {
    divorce: true, marry: 16, sameSex: false,
    list: ['Men of fighting age may be conscripted in wartime', 'Rationing limits sugar, meat and fuel', 'Women win the vote across much of the world', 'Prohibition bans alcohol in some countries (1920 to 1933)', 'The press is censored in wartime'],
  },
  L: { healer: 'Visit the doctor', love: 'Go dancing to find a sweetheart', party: 'Sneak into a speakeasy', gamble: 'Play poker', crime: 'Run bootleg liquor', gym: 'Play ball in the park', study: 'Take a correspondence course', faith: 'Go to church', friend: 'Hang out at the soda fountain' },
  jobs: [
    J('Farmhand', 700), J('Factory Worker', 1300, { risk: 0.02 }), J('Munitions Worker', 1500, { risk: 0.03 }),
    J('Secretary', 1200, { sm: 30, edu: 2 }), J('Mechanic', 1500, { sm: 30 }), J('Soldier', 1000, { sex: 'M', risk: 0.03, fame: 1 }),
    J('Nurse', 1400, { sm: 35, edu: 2 }), J('Teacher', 1500, { sm: 40, edu: 2 }), J('Radio Operator', 1600, { from: 1920, sm: 40, edu: 2 }),
    J('Journalist', 1900, { sm: 50, edu: 2, fame: 1 }), J('Pilot', 2600, { sm: 55, edu: 2, risk: 0.04, fame: 1 }),
    J('Film Actor', 3500, { from: 1915, lk: 65, fame: 3, vol: 0.6 }), J('Doctor', 4500, { sm: 65, edu: 4 }),
    J('Codebreaker', 2800, { from: 1939, sm: 80, edu: 3 }), J('Tycoon', 20000, { sm: 60, rep: 60, vol: 0.5, fame: 2 }),
  ],
  acts: [
    { id: 'pictures', n: 'Go to the pictures', d: 'Flickering stars on the silver screen.', min: 4, cost: 1, fx: { hp: [4, 8] }, t: 'You lost yourself in a picture show for two hours.' },
    { id: 'swing', n: 'Swing at the dance hall', d: 'Big band, bigger dance floor.', from: 1930, min: 16, cost: 1, fx: { hp: [5, 10], h: 2, lk: 1 }, t: 'You danced until your shoes wore through.' },
    { id: 'radio', n: 'Listen to the radio serials', d: 'The whole family around the set.', from: 1922, min: 3, cost: 0, fx: { hp: [2, 5] }, t: 'You hung on every word of the evening serial.' },
    { id: 'bonds', n: 'Buy war bonds', d: 'Do your bit for the war effort.', when: 'war', min: 16, cost: 50, fx: { rep: [3, 6], hp: 3 }, t: 'You bought war bonds. The poster said it would help.' },
  ],
  dis: [D('Tuberculosis', 0.015, 8, 0.07, 4, 0.7), Object.assign(D('Polio', 0.006, 20, 0.1, 1, 0.9), { kid: true }), D('Pneumonia', 0.02, 12, 0.08, 1, 0.45), Object.assign(D('Scarlet fever', 0.01, 10, 0.06, 1, 0.4), { kid: true })],
  ev: [
    { id: 'ration', p: 0.3, when: 'war', min: 1, t: 'Rationing tightened. Meals are thin this year.', fx: { h: -3, hp: -3 } },
    { id: 'airraid', p: 0.12, when: 'war', min: 1, t: 'Air-raid sirens wailed through the night. You huddled in a shelter.', fx: { hp: -6, h: [-10, 0] } },
    { id: 'garden', p: 0.15, when: 'war', min: 5, t: 'You planted a victory garden. Fresh tomatoes!', fx: { h: 3, hp: 3 } },
    { id: 'jazz', p: 0.06, min: 14, from: 1920, to: 1935, t: "A jazz band played all night down the street and you couldn't stop dancing.", fx: { hp: 6 } },
    { id: 'dust', p: 0.05, from: 1931, to: 1938, t: 'Dust storms blackened the sky for days.', fx: { h: -5, hp: -4 } },
    { id: 'breadline', p: 0.3, min: 18, from: 1930, to: 1938, c: p => !p.job, t: 'You queued in a breadline for soup and a heel of bread.', fx: { hp: -5, $: 5 } },
    { id: 'raid', p: 0.03, min: 18, from: 1920, to: 1933, t: 'Police raided the speakeasy where you were drinking!', ch: [{ l: 'Run for the back door', odds: 0.6, win: { t: 'You escaped into the alley.' }, alt: { fx: { jail: 1, rep: -4 }, t: 'You were arrested and spent months in jail.' } }, { l: 'Bribe the officer ($20)', fx: { $: -20 }, t: 'The officer looked the other way.' }] },
  ],
  assets: [
    A('Apartment', 3000, 'home', { hp: 8, appr: 0.01 }), A('Bungalow', 6000, 'home', { hp: 12, appr: 0.02 }),
    A('Mansion', 60000, 'home', { hp: 18, rep: 10, appr: 0.02 }), A('Farmland', 5000, 'land', { inc: 0.06 }),
    A('Stock portfolio', 1000, 'stock', { appr: 0.06, vol: 0.3, inc: 0.02 }), A('Motor car', 700, 'vehicle', { hp: 10, appr: -0.12 }),
    A('Radio set', 80, 'tech', { from: 1922, hp: 5, appr: -0.15 }), A('Phonograph', 60, 'luxury', { hp: 5 }),
  ],
  die: {
    kid: ['diphtheria', 'pneumonia', 'polio', 'scarlet fever'],
    adult: ['tuberculosis', 'pneumonia', 'influenza', 'an infection'],
    old: ['old age', 'heart disease', 'a stroke', 'cancer'],
    acc: ['a motor accident', 'a factory accident', 'drowning', 'electrocution'],
  },
});

DATA.eras.push({
  id: 'modern', name: 'Modern', from: 1946, to: 1999,
  blurb: 'Suburbs, television, rock and roll, and the space race. The long peace, with a nuclear shadow.',
  pal: ['#A83279', '#EE7DB8'],
  cur: { n: 'dollars', s: '$', r: 6 },
  life: { adult: 76, child: 0.04, med: 0.55, acc: 0.005, fert: 0.12, age: 0.8, tax: 0.22, retire: 65, birth: 0.0005 },
  cost: 2500, names: 'modern',
  edu: { n: ['Unschooled', 'Grade school', 'High school', 'College', 'Graduate school'], comp: 2, cost: [0, 0, 0, 3000, 5000] },
  laws: {
    divorce: true, marry: 18, sameSex: false,
    list: ['Civil rights laws outlaw segregation (1964)', 'No-fault divorce spreads from 1969', 'Seatbelt laws arrive in the 1970s and 80s', 'Same-sex marriage is not yet recognised anywhere', 'State pensions and mandatory retirement at 65'],
  },
  L: { healer: 'See a doctor', love: 'Go on a blind date', party: 'Hit the disco', gamble: 'Play the slots at a casino', crime: 'Shoplift', gym: 'Go jogging', study: 'Study at the library', faith: 'Go to church', friend: 'Hang out at the mall' },
  jobs: [
    J('Fast Food Worker', 5000), J('Office Clerk', 7000, { edu: 2 }), J('Mechanic', 9000, { sm: 30 }),
    J('Police Officer', 11500, { sm: 35, edu: 2, risk: 0.01 }), J('Teacher', 10000, { sm: 45, edu: 3 }), J('Nurse', 11000, { sm: 45, edu: 3 }),
    J('Accountant', 15000, { sm: 55, edu: 3 }), J('Engineer', 18000, { sm: 60, edu: 3 }),
    J('Programmer', 19000, { from: 1957, sm: 65, edu: 3 }), J('TV Anchor', 25000, { from: 1950, lk: 60, edu: 3, fame: 3 }),
    J('Rock Musician', 15000, { from: 1955, lk: 40, fame: 3, vol: 0.8 }), J('Airline Pilot', 30000, { sm: 55, edu: 3 }),
    J('Stockbroker', 35000, { sm: 60, edu: 3, vol: 0.4 }), J('Lawyer', 30000, { sm: 65, edu: 4 }),
    J('Doctor', 38000, { sm: 70, edu: 4 }), J('Astronaut', 32000, { from: 1961, sm: 85, edu: 4, risk: 0.01, fame: 4 }),
  ],
  acts: [
    { id: 'movies', n: 'Catch a movie', d: 'Popcorn and a double feature.', min: 4, cost: 5, fx: { hp: [4, 8] }, t: 'You caught a double feature at the drive-in.' },
    { id: 'concert', n: 'Go to a rock concert', d: 'Loud. Very loud.', from: 1955, min: 13, cost: 20, fx: { hp: [6, 12], h: -1 }, t: 'Your ears are still ringing from the concert.' },
    { id: 'roadtrip', n: 'Take a road trip', d: 'Open highway, cheap motels.', min: 16, cost: 150, fx: { hp: [6, 12], sm: 1 }, t: 'You drove cross-country with the windows down.', risk: { p: 0.05, fx: { h: [-20, -5] }, t: 'You crashed the car on a mountain road.' } },
    { id: 'tv', n: 'Watch TV all day', d: 'Every channel. Both of them.', from: 1950, min: 3, cost: 0, fx: { hp: 3, sm: -1, h: -1 }, t: 'You watched television until the anthem played at sign-off.' },
    { id: 'arcade', n: 'Play at the arcade', d: 'A pocketful of quarters.', from: 1972, min: 8, cost: 5, fx: { hp: [3, 7] }, t: 'You set a new high score and entered your initials.' },
  ],
  dis: [Object.assign(D('Polio', 0.004, 20, 0.08, 1, 0.8), { kid: true, to: 1960 }), D('Influenza', 0.04, 8, 0.01, 1, 0.3), Object.assign(D('Cancer', 0.003, 10, 0.12, 4, 0.8), { ag: true }), Object.assign(D('Heart disease', 0.004, 10, 0.1, 5, 0.7), { ag: true }), Object.assign(D('HIV/AIDS', 0.002, 6, 0.15, 20, 0.95), { adult: true, from: 1981 })],
  ev: [
    { id: 'cartrouble', p: 0.06, min: 17, t: 'Your car broke down on the highway.', fx: { $: [-400, -100], hp: -3 } },
    { id: 'stocktip', p: 0.05, min: 21, c: (p, S) => S.cash(p) >= 1000, t: 'Your brother-in-law swears he has a hot stock tip.', ch: [{ l: 'Invest $1,000', fx: { $: -1000 }, odds: 0.45, win: { fx: { $: 3000 }, t: 'The stock tripled! Thanksgiving will be smug this year.' }, alt: { t: 'The company went bust. Thanksgiving will be awkward.' } }, { l: 'Pass', t: 'You kept your money in the bank.' }] },
    { id: 'layoff', p: 0.03, min: 18, c: p => !!p.job, t: 'Your company announced a round of layoffs.', odds: 0.5, fx: { hp: -3 }, win: { t: 'You survived the cuts.' }, alt: { fx: { fire: 1, hp: -8 }, t: 'You were laid off.' } },
    { id: 'disco', p: 0.05, min: 14, from: 1974, to: 1981, t: 'Disco fever grips the nation. You bought platform shoes.', fx: { hp: 5, $: -50, lk: 2 } },
    { id: 'prom', p: 0.5, min: 17, max: 18, once: true, t: "It's prom night!", ch: [{ l: 'Ask your crush', odds: 0.6, win: { fx: { hp: 10, lover: 1 }, t: 'They said yes! You danced all night.' }, alt: { fx: { hp: -8 }, t: 'They said no. Ouch.' } }, { l: 'Go with friends', fx: { hp: 5 }, t: 'You had a blast with your friends.' }] },
    { id: 'quiz', p: 0.02, min: 18, from: 1955, t: 'You were picked as a contestant on a TV quiz show!', ch: [{ l: 'Play', odds: p => p.sm / 120, win: { fx: { $: [2000, 20000], rep: 5 }, t: 'You answered every question and walked away rich!' }, alt: { fx: { hp: -3 }, t: 'You froze on the final question.' } }, { l: 'Chicken out', t: 'Stage fright won.' }] },
  ],
  assets: [
    A('Starter home', 20000, 'home', { hp: 10, appr: 0.03 }), A('Suburban house', 45000, 'home', { hp: 14, appr: 0.04 }),
    A('Beach house', 120000, 'home', { hp: 18, rep: 5, appr: 0.04 }), A('Rental duplex', 60000, 'land', { inc: 0.07, appr: 0.03 }),
    A('Stock portfolio', 5000, 'stock', { appr: 0.07, vol: 0.2, inc: 0.02 }), A('Used car', 1500, 'vehicle', { hp: 6, appr: -0.15 }),
    A('Sports car', 9000, 'vehicle', { hp: 14, lk: 3, rep: 3, appr: -0.1 }), A('Color TV', 500, 'tech', { from: 1954, hp: 6, appr: -0.2 }),
    A('Home computer', 1500, 'tech', { from: 1977, sm: 3, appr: -0.3 }),
  ],
  die: {
    kid: ['leukemia', 'pneumonia', 'a congenital heart defect', 'meningitis'],
    adult: ['cancer', 'a heart attack', 'pneumonia', 'a drug overdose'],
    old: ['old age', 'heart disease', 'a stroke', 'cancer', "Alzheimer's disease"],
    acc: ['a car crash', 'a house fire', 'drowning', 'a workplace accident'],
  },
});
