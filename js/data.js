/* ============================================================
   Данные клуба — единственный файл, который нужно править.
   Меняйте CLUB, MATCHES, TABLE, SQUAD, NEWS — вёрстку трогать не нужно.
   ============================================================ */

window.FCDATA = (function () {
  'use strict';

  var CLUB = {
    name: 'ФК «Атлант»',
    short: 'Атлант',
    city: 'Москва',
    league: 'Вторая лига · группа 2',
    season: '2026/27',
    founded: 1998,
    stadium: '«Прибой», 12 500',
    initials: 'АТ',
    timezone: 'Europe/Moscow',
    colors: {
      primary: '#2E6BFF',
      accent: '#E8C558'
    },
    ticketsUrl: 'https://example.com/atlant/tickets',
    ticketsNote: 'Продажа через официальную кассу клуба'
  };

  /* status: upcoming | finished. Для finished обязательны scoreHome/scoreAway. */
  var MATCHES = [
    {
      id: 'm11',
      date: '2026-10-25T19:00:00+03:00',
      opponent: 'Родина-2',
      opponentCity: 'Москва',
      home: true,
      competition: 'Вторая лига, 14-й тур',
      venue: '«Прибой»',
      status: 'upcoming',
      ticketUrl: CLUB.ticketsUrl
    },
    {
      id: 'm12',
      date: '2026-11-01T15:00:00+03:00',
      opponent: 'Сатурн',
      opponentCity: 'Раменское',
      home: false,
      competition: 'Вторая лига, 15-й тур',
      venue: '«Леон Арена»',
      status: 'upcoming'
    },
    {
      id: 'm13',
      date: '2026-11-08T18:30:00+03:00',
      opponent: 'Зенит-2',
      opponentCity: 'Санкт-Петербург',
      home: true,
      competition: 'Вторая лига, 16-й тур',
      venue: '«Прибой»',
      status: 'upcoming',
      ticketUrl: CLUB.ticketsUrl
    },
    {
      id: 'm14',
      date: '2026-11-15T14:00:00+03:00',
      opponent: 'Балтика-БФУ',
      opponentCity: 'Калининград',
      home: false,
      competition: 'Вторая лига, 17-й тур',
      venue: '«Балтика»',
      status: 'upcoming'
    },
    {
      id: 'm10',
      date: '2026-10-18T19:00:00+03:00',
      opponent: 'Енисей-2',
      opponentCity: 'Красноярск',
      home: false,
      competition: 'Вторая лига, 13-й тур',
      venue: '«Центральный»',
      status: 'finished',
      scoreHome: 1,
      scoreAway: 2
    },
    {
      id: 'm09',
      date: '2026-10-11T17:00:00+03:00',
      opponent: 'Торпедо-2',
      opponentCity: 'Москва',
      home: true,
      competition: 'Вторая лига, 12-й тур',
      venue: '«Прибой»',
      status: 'finished',
      scoreHome: 3,
      scoreAway: 0
    },
    {
      id: 'm08',
      date: '2026-10-04T16:00:00+03:00',
      opponent: 'Луч',
      opponentCity: 'Владивосток',
      home: false,
      competition: 'Вторая лига, 11-й тур',
      venue: '«Динамо»',
      status: 'finished',
      scoreHome: 1,
      scoreAway: 1
    },
    {
      id: 'm07',
      date: '2026-09-27T19:30:00+03:00',
      opponent: 'Динамо-Брянск',
      opponentCity: 'Брянск',
      home: true,
      competition: 'Вторая лига, 10-й тур',
      venue: '«Прибой»',
      status: 'finished',
      scoreHome: 2,
      scoreAway: 1
    }
  ];

  var TABLE = [
    { place: 1, team: 'Родина-2', short: 'Род', played: 13, won: 9, drawn: 3, lost: 1, gf: 24, ga: 9, points: 30 },
    { place: 2, team: 'Сатурн', short: 'Сат', played: 13, won: 8, drawn: 4, lost: 1, gf: 21, ga: 10, points: 28 },
    { place: 3, team: 'ФК «Атлант»', short: 'Атл', played: 13, won: 8, drawn: 2, lost: 3, gf: 23, ga: 14, points: 26, isUs: true },
    { place: 4, team: 'Зенит-2', short: 'Зен', played: 13, won: 7, drawn: 3, lost: 3, gf: 19, ga: 12, points: 24 },
    { place: 5, team: 'Балтика-БФУ', short: 'Бал', played: 13, won: 6, drawn: 4, lost: 3, gf: 17, ga: 13, points: 22 },
    { place: 6, team: 'Торпедо-2', short: 'Тор', played: 13, won: 5, drawn: 5, lost: 3, gf: 15, ga: 13, points: 20 },
    { place: 7, team: 'Енисей-2', short: 'Ени', played: 13, won: 4, drawn: 4, lost: 5, gf: 14, ga: 16, points: 16 },
    { place: 8, team: 'Динамо-Брянск', short: 'Дин', played: 13, won: 3, drawn: 5, lost: 5, gf: 12, ga: 15, points: 14 },
    { place: 9, team: 'Луч', short: 'Луч', played: 13, won: 3, drawn: 4, lost: 6, gf: 11, ga: 18, points: 13 },
    { place: 10, team: 'Нефтяник', short: 'Неф', played: 13, won: 1, drawn: 3, lost: 9, gf: 8, ga: 27, points: 6 }
  ];

  var SQUAD = [
    {
      role: 'Вратари',
      players: [
        { number: 1, name: 'Артём Ковалёв', age: 28, apps: 13, goals: 0, note: 'осн.' },
        { number: 12, name: 'Никита Ершов', age: 22, apps: 1, goals: 0, note: 'рез.' }
      ]
    },
    {
      role: 'Защитники',
      players: [
        { number: 2, name: 'Сергей Логинов', age: 27, apps: 13, goals: 1, note: 'правый' },
        { number: 4, name: 'Дмитрий Асланов', age: 30, apps: 12, goals: 0, note: 'центр.' },
        { number: 5, name: 'Павел Гринёв', age: 25, apps: 13, goals: 2, note: 'центр.' },
        { number: 3, name: 'Илья Ромашов', age: 23, apps: 11, goals: 0, note: 'левый' },
        { number: 22, name: 'Максим Ушаков', age: 21, apps: 6, goals: 0, note: 'универсал' }
      ]
    },
    {
      role: 'Полузащитники',
      players: [
        { number: 6, name: 'Роман Бельский', age: 26, apps: 13, goals: 3, note: 'опорный' },
        { number: 8, name: 'Алексей Туманов', age: 24, apps: 13, goals: 5, note: 'центральный' },
        { number: 10, name: 'Егор Самойлов', age: 29, apps: 12, goals: 6, note: 'капитан' },
        { number: 17, name: 'Данила Крылов', age: 20, apps: 9, goals: 1, note: 'вингер' },
        { number: 21, name: 'Тимур Хайдаров', age: 25, apps: 10, goals: 2, note: 'вингер' },
        { number: 15, name: 'Кирилл Морев', age: 22, apps: 4, goals: 0, note: 'рез.' }
      ]
    },
    {
      role: 'Нападающие',
      players: [
        { number: 9, name: 'Иван Стрельцов', age: 27, apps: 13, goals: 8, note: 'осн.' },
        { number: 11, name: 'Арсен Гулиев', age: 23, apps: 12, goals: 4, note: 'осн.' },
        { number: 19, name: 'Матвей Соколов', age: 19, apps: 5, goals: 1, note: 'рез.' }
      ]
    }
  ];

  var NEWS = [
    {
      id: 'n5',
      date: '2026-10-19T10:00:00+03:00',
      tag: 'Матч',
      title: 'Волевая победа в Красноярске — 2:1',
      excerpt: 'Уступали после первого тайма, но перевернули игру за десять минут.',
      body: 'Выезд в Красноярск получился непростым: хозяева открыли счёт на 34-й минуте после подачи с угла поля. Во втором тайме тренерский штаб перестроил игру на три защитника и выпустил второго форварда.\n\nНа 71-й минуте Иван Стрельцов замкнул прострел с фланга, а на 79-й Алексей Туманов пробил с линии штрафной в дальний угол. Команда удержала счёт в компенсированное время и поднялась на третье место.\n\nСледующий матч — дома, 25 октября против «Родины-2».'
    },
    {
      id: 'n4',
      date: '2026-10-16T14:30:00+03:00',
      tag: 'Клуб',
      title: 'Матч с «Родиной-2» перенесён на 19:00',
      excerpt: 'Время начала изменено по согласованию с лигой и телевещателем.',
      body: 'Лига согласовала перенос начала матча 14-го тура против «Родины-2» на 19:00. Билеты, купленные ранее, остаются действительны — менять их не нужно.\n\nКассы стадиона «Прибой» откроются в 17:30, фан-зона — в 17:00.'
    },
    {
      id: 'n3',
      date: '2026-10-13T09:00:00+03:00',
      tag: 'Трансфер',
      title: 'Кирилл Морев перешёл в «Атлант»',
      excerpt: '22-летний центральный полузащитник подписал контракт на 2,5 года.',
      body: 'Кирилл Морев присоединился к команде на правах свободного агента. Прошлый сезон он провёл в «Нефтянике», где отыграл 24 матча.\n\n«Нужен был игрок, который закрывает зону перед защитой и умеет начинать атаку первым пас — Кирилл подходит по профилю», — отметил главный тренер.'
    },
    {
      id: 'n2',
      date: '2026-10-11T21:40:00+03:00',
      tag: 'Матч',
      title: '3:0 с «Торпедо-2» — самая крупная победа сезона',
      excerpt: 'Дубль Стрельцова и гол Самойлова принесли три очка дома.',
      body: 'Первый тайм прошёл в вязкой борьбе, счёт открыли только на 38-й минуте. После перерыва «Атлант» добавил в скорости и забил ещё дважды.\n\nСухой матч записал на свой счёт Артём Ковалёв — четвёртый в сезоне.'
    },
    {
      id: 'n1',
      date: '2026-10-02T12:00:00+03:00',
      tag: 'Клуб',
      title: 'Абонементы на второй круг — в продаже',
      excerpt: 'Пять домашних матчей, скидка 20% и приоритетный вход.',
      body: 'Клуб открыл продажу абонементов на домашние матчи второго круга. Абонемент включает пять игр, скидку 20% относительно разовых билетов и отдельный вход без очереди.\n\nДетский абонемент — со скидкой 50%.'
    }
  ];

  return { CLUB: CLUB, MATCHES: MATCHES, TABLE: TABLE, SQUAD: SQUAD, NEWS: NEWS };
})();
