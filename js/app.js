/* Фан-приложение ФК «Атлант» — логика интерфейса.
   Зависимостей нет. Все данные — в js/data.js. */
(function () {
  'use strict';

  var CLUB = window.FCDATA.CLUB;
  var MATCHES = window.FCDATA.MATCHES;
  var TABLE = window.FCDATA.TABLE;
  var SQUAD = window.FCDATA.SQUAD;
  var NEWS = window.FCDATA.NEWS;

  var view = document.getElementById('view');
  var tabbar = document.querySelector('.tabbar');
  var countdownTimer = null;

  /* ---------- утилиты ---------- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  var MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

  /* Время матчей — всегда в часовом поясе клуба, независимо от пояса телефона. */
  var TZ = CLUB.timezone || 'Europe/Moscow';
  var dateFmt;
  try {
    dateFmt = new Intl.DateTimeFormat('ru-RU', {
      timeZone: TZ, day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit',
      hourCycle: 'h23', weekday: 'short'
    });
  } catch (e) {
    dateFmt = new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit',
      hourCycle: 'h23', weekday: 'short'
    });
  }

  function dparts(d) {
    var out = {};
    dateFmt.formatToParts(d).forEach(function (p) { if (p.type !== 'literal') out[p.type] = p.value; });
    return {
      day: Number(out.day),
      mon: Number(out.month) - 1,
      time: out.hour + ':' + out.minute,
      wd: String(out.weekday || '').replace(/[.,]/g, '')
    };
  }

  function plural(n, one, few, many) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function fmtTime(d) { return dparts(d).time; }

  function fmtFull(d) {
    var p = dparts(d);
    return p.day + ' ' + MONTHS_SHORT[p.mon] + ', ' + p.wd + ' · ' + p.time;
  }

  function initials(name) {
    var parts = String(name).replace(/[«»"]/g, '').split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  function sortedMatches() {
    return MATCHES.slice().sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
  }

  function nextMatch() {
    var now = Date.now();
    var list = sortedMatches().filter(function (m) {
      return m.status === 'upcoming' && new Date(m.date).getTime() > now;
    });
    return list[0] || sortedMatches().filter(function (m) { return m.status === 'upcoming'; })[0] || null;
  }

  function lastMatch() {
    var done = sortedMatches().filter(function (m) { return m.status === 'finished'; });
    return done[done.length - 1] || null;
  }

  function ourRow() {
    for (var i = 0; i < TABLE.length; i++) if (TABLE[i].isUs) return TABLE[i];
    return null;
  }

  function homeRecord() {
    var w = 0, d = 0, l = 0;
    MATCHES.forEach(function (m) {
      if (m.status !== 'finished' || !m.home) return;
      if (m.scoreHome > m.scoreAway) w++;
      else if (m.scoreHome === m.scoreAway) d++;
      else l++;
    });
    return { w: w, d: d, l: l };
  }

  function scoreline(m) {
    if (m.status === 'finished') {
      return m.home
        ? esc(m.scoreHome) + ':' + esc(m.scoreAway)
        : esc(m.scoreAway) + ':' + esc(m.scoreHome);
    }
    return fmtTime(new Date(m.date));
  }

  function matchResultBadge(m) {
    if (m.status !== 'finished') return '';
    var ours = m.home ? m.scoreHome : m.scoreAway;
    var theirs = m.home ? m.scoreAway : m.scoreHome;
    var cls = ours > theirs ? 'is-win' : (ours === theirs ? 'is-draw' : 'is-loss');
    var txt = ours > theirs ? 'В' : (ours === theirs ? 'Н' : 'П');
    return '<span class="badge ' + cls + '">' + txt + '</span>';
  }

  function crest(letters, opts) {
    opts = opts || {};
    var cls = 'crest-circle' + (opts.opponent ? ' crest-circle--opp' : '');
    return '<span class="' + cls + '" aria-hidden="true">' + esc(letters) + '</span>';
  }

  /* ---------- экраны ---------- */

  function renderHome() {
    var m = nextMatch();
    var lm = lastMatch();
    var row = ourRow();
    var rec = homeRecord();

    var hero = '';
    if (m) {
      var d = new Date(m.date);
      hero =
        '<section class="hero">' +
          '<div class="hero__top">' +
            '<span class="hero__comp">' + esc(m.competition) + '</span>' +
            '<span class="chip chip--' + (m.home ? 'home' : 'away') + '">' + (m.home ? 'дома' : 'в гостях') + '</span>' +
          '</div>' +
          '<div class="hero__teams">' +
            '<div class="team">' + crest(CLUB.initials) + '<span class="team__name">' + esc(CLUB.short) + '</span></div>' +
            '<div class="hero__vs">' + (m.status === 'finished' ? scoreline(m) : '<span>—</span>') + '</div>' +
            '<div class="team team--opp">' + crest(initials(m.opponent), { opponent: true }) + '<span class="team__name">' + esc(m.opponent) + '</span></div>' +
          '</div>' +
          '<div class="countdown" id="countdown" aria-live="off">' +
            '<div class="countdown__cell"><b id="cd-d">—</b><span>дн</span></div>' +
            '<div class="countdown__cell"><b id="cd-h">—</b><span>ч</span></div>' +
            '<div class="countdown__cell"><b id="cd-m">—</b><span>мин</span></div>' +
            '<div class="countdown__cell"><b id="cd-s">—</b><span>сек</span></div>' +
          '</div>' +
          '<div class="hero__foot">' +
            '<span class="hero__date">' + fmtFull(d) + '</span>' +
            '<span class="hero__venue">' + esc(m.venue) + '</span>' +
          '</div>' +
          (m.ticketUrl
            ? '<a class="btn btn--primary" href="' + esc(m.ticketUrl) + '" target="_blank" rel="noopener">Купить билет</a>'
            : '<a class="btn btn--ghost" href="#matches">Все матчи</a>') +
        '</section>';
    }

    var result = '';
    if (lm) {
      var ours = lm.home ? lm.scoreHome : lm.scoreAway;
      var theirs = lm.home ? lm.scoreAway : lm.scoreHome;
      result =
        '<section class="card card--result">' +
          '<div class="card__head">' +
            '<span class="label">Последний матч</span>' +
            '<span class="label label--muted">' + esc(lm.competition) + '</span>' +
          '</div>' +
          '<div class="result__row">' +
            '<div class="result__score">' + ours + '<span>:</span>' + theirs + '</div>' +
            '<div class="result__meta">' +
              '<div class="result__opp">' + esc(lm.opponent) + '</div>' +
              '<div class="result__sub">' + (lm.home ? 'дома' : 'в гостях') + ' · ' + fmtFull(new Date(lm.date)) + '</div>' +
            '</div>' +
            matchResultBadge(lm) +
          '</div>' +
        '</section>';
    }

    var stats = row
      ? '<a class="card card--stats" href="#table">' +
          '<div class="stat"><b>' + esc(row.place) + '</b><span>место</span></div>' +
          '<div class="stat"><b>' + esc(row.points) + '</b><span>очков</span></div>' +
          '<div class="stat"><b>' + esc(rec.w) + '–' + esc(rec.d) + '–' + esc(rec.l) + '</b><span>дома В–Н–П</span></div>' +
          '<span class="card__chev">›</span>' +
        '</a>'
      : '';

    var newsList = NEWS.slice(0, 3).map(function (n) {
      return newsCard(n);
    }).join('');

    return '<div class="screen">' +
      hero + result + stats +
      '<div class="section-head"><h2>Новости</h2><a class="link" href="#news">Все</a></div>' +
      '<div class="news-list">' + newsList + '</div>' +
      '</div>';
  }

  function newsCard(n) {
    return '<a class="news-card" href="#news/' + esc(n.id) + '">' +
      '<span class="chip chip--tag">' + esc(n.tag) + '</span>' +
      '<h3 class="news-card__title">' + esc(n.title) + '</h3>' +
      '<p class="news-card__text">' + esc(n.excerpt) + '</p>' +
      '<span class="news-card__date">' + fmtFull(new Date(n.date)) + '</span>' +
    '</a>';
  }

  function renderMatches() {
    var all = sortedMatches();
    var upcoming = all.filter(function (m) { return m.status === 'upcoming'; });
    var done = all.filter(function (m) { return m.status === 'finished'; }).reverse();

    function row(m) {
      var p = dparts(new Date(m.date));
      var isNext = m === nextMatch();
      return '<div class="match' + (isNext ? ' match--next' : '') + '">' +
        '<div class="match__date"><b>' + pad(p.day) + '</b><span>' + MONTHS_SHORT[p.mon] + '</span></div>' +
        '<div class="match__body">' +
          '<div class="match__opp">' + esc(m.opponent) + '</div>' +
          '<div class="match__sub">' + (m.home ? 'дома' : 'в гостях') + ' · ' + p.time + ' · ' + esc(m.venue) + '</div>' +
          '<div class="match__comp">' + esc(m.competition) + '</div>' +
        '</div>' +
        '<div class="match__right">' +
          '<div class="match__score">' + scoreline(m) + '</div>' +
          matchResultBadge(m) +
        '</div>' +
      '</div>';
    }

    var tickets = '<a class="card card--tickets" href="#tickets">' +
      '<span class="card__icon">🎟</span>' +
      '<span class="card__text"><b>Билеты на домашние матчи</b><span>' + esc(CLUB.ticketsNote) + '</span></span>' +
      '<span class="card__chev">›</span>' +
    '</a>';

    return '<div class="screen">' +
      tickets +
      '<div class="section-head"><h2>Предстоящие</h2><span class="label label--muted">' + upcoming.length + '</span></div>' +
      '<div class="match-list">' + (upcoming.map(row).join('') || '<p class="empty">Матчей не назначено</p>') + '</div>' +
      '<div class="section-head"><h2>Результаты</h2></div>' +
      '<div class="match-list">' + (done.map(row).join('') || '<p class="empty">Пока пусто</p>') + '</div>' +
    '</div>';
  }

  function renderTable() {
    var rows = TABLE.map(function (r) {
      var cls = r.isUs ? ' class="is-us"' : '';
      return '<tr' + cls + '>' +
        '<td class="c-place">' + esc(r.place) + '</td>' +
        '<td class="c-team"><span class="tname">' + esc(r.team) + '</span><span class="tshort">' + esc(r.short) + '</span></td>' +
        '<td>' + esc(r.played) + '</td>' +
        '<td class="c-hide">' + esc(r.won) + '</td>' +
        '<td class="c-hide">' + esc(r.drawn) + '</td>' +
        '<td class="c-hide">' + esc(r.lost) + '</td>' +
        '<td class="c-goals">' + esc(r.gf) + '–' + esc(r.ga) + '</td>' +
        '<td class="c-points">' + esc(r.points) + '</td>' +
      '</tr>';
    }).join('');

    return '<div class="screen">' +
      '<div class="section-head"><h2>Турнирная таблица</h2><span class="label label--muted">' + esc(CLUB.league) + '</span></div>' +
      '<div class="table-wrap"><table class="league">' +
        '<thead><tr>' +
          '<th class="c-place">#</th><th class="c-team">Команда</th><th>И</th>' +
          '<th class="c-hide">В</th><th class="c-hide">Н</th><th class="c-hide">П</th>' +
          '<th class="c-goals">М</th><th class="c-points">О</th>' +
        '</tr></thead><tbody>' + rows + '</tbody>' +
      '</table></div>' +
      '<p class="note">М — забитые и пропущенные мячи. В–Н–П — победы, ничьи, поражения.</p>' +
    '</div>';
  }

  function renderSquad() {
    var groups = SQUAD.map(function (g) {
      var players = g.players.map(function (p) {
        return '<div class="player">' +
          '<span class="player__num">' + esc(p.number) + '</span>' +
          '<span class="player__main">' +
            '<span class="player__name">' + esc(p.name) + '</span>' +
            '<span class="player__meta">' + esc(p.age) + ' ' + plural(p.age, 'год', 'года', 'лет') +
              ' · ' + esc(p.note) + '</span>' +
          '</span>' +
          '<span class="player__stats">' +
            '<span><b>' + esc(p.apps) + '</b>игр</span>' +
            '<span><b>' + esc(p.goals) + '</b>гол</span>' +
          '</span>' +
        '</div>';
      }).join('');
      return '<section class="squad-group">' +
        '<div class="section-head section-head--tight"><h2>' + esc(g.role) + '</h2><span class="label label--muted">' + g.players.length + '</span></div>' +
        '<div class="card card--list">' + players + '</div>' +
      '</section>';
    }).join('');

    return '<div class="screen">' + groups +
      '<p class="note">Состав и статистика — по данным клуба на 20.10.2026.</p>' +
    '</div>';
  }

  function renderNews() {
    var list = NEWS.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    return '<div class="screen">' +
      '<div class="section-head"><h2>Новости клуба</h2></div>' +
      '<div class="news-list">' + list.map(newsCard).join('') + '</div>' +
    '</div>';
  }

  function renderNewsItem(id) {
    var item = null;
    for (var i = 0; i < NEWS.length; i++) if (NEWS[i].id === id) item = NEWS[i];
    if (!item) return '<div class="screen"><p class="empty">Новость не найдена.</p></div>';

    var paragraphs = String(item.body).split('\n\n').map(function (p) {
      return '<p>' + esc(p) + '</p>';
    }).join('');

    var others = NEWS.filter(function (n) { return n.id !== id; }).slice(0, 2);
    var more = others.length
      ? '<div class="section-head"><h2>Читайте также</h2></div><div class="news-list">' +
        others.map(newsCard).join('') + '</div>'
      : '';

    return '<div class="screen">' +
      '<a class="backlink" href="#news">‹ Все новости</a>' +
      '<article class="article">' +
        '<span class="chip chip--tag">' + esc(item.tag) + '</span>' +
        '<h1 class="article__title">' + esc(item.title) + '</h1>' +
        '<div class="article__date">' + fmtFull(new Date(item.date)) + '</div>' +
        '<div class="article__body">' + paragraphs + '</div>' +
      '</article>' + more +
    '</div>';
  }

  function renderTickets() {
    var upcoming = sortedMatches().filter(function (m) { return m.status === 'upcoming' && m.home; });
    if (!upcoming.length) {
      return '<div class="screen"><a class="backlink" href="#matches">‹ Матчи</a><p class="empty">Домашних матчей пока нет.</p></div>';
    }

    var cards = upcoming.map(function (m) {
      var d = new Date(m.date);
      return '<div class="card card--buy">' +
        '<div class="buy__top">' +
          '<span class="label">' + fmtFull(d) + '</span>' +
          '<span class="chip chip--home">дома</span>' +
        '</div>' +
        '<div class="buy__match">' + esc(CLUB.short) + ' — ' + esc(m.opponent) + '</div>' +
        '<div class="buy__meta">' + esc(m.competition) + ' · ' + esc(m.venue) + '</div>' +
        '<a class="btn btn--primary" href="' + esc(m.ticketUrl || CLUB.ticketsUrl) + '" target="_blank" rel="noopener">Купить билет</a>' +
      '</div>';
    }).join('');

    return '<div class="screen">' +
      '<a class="backlink" href="#matches">‹ Матчи</a>' +
      '<div class="section-head"><h2>Билеты</h2></div>' +
      cards +
      '<p class="note">' + esc(CLUB.ticketsNote) + '. Оплата проходит на сайте кассы — в приложении карта не вводится.</p>' +
    '</div>';
  }

  /* ---------- обратный отсчёт ---------- */

  function startCountdown() {
    stopCountdown();
    var target = nextMatch();
    if (!target) return;
    var t = new Date(target.date).getTime();
    var els = {
      d: document.getElementById('cd-d'),
      h: document.getElementById('cd-h'),
      m: document.getElementById('cd-m'),
      s: document.getElementById('cd-s')
    };
    if (!els.d) return;

    function tick() {
      var diff = t - Date.now();
      if (diff <= 0) {
        els.d.textContent = '0';
        els.h.textContent = '00';
        els.m.textContent = '00';
        els.s.textContent = '00';
        return;
      }
      var sec = Math.floor(diff / 1000);
      els.d.textContent = String(Math.floor(sec / 86400));
      els.h.textContent = pad(Math.floor(sec % 86400 / 3600));
      els.m.textContent = pad(Math.floor(sec % 3600 / 60));
      els.s.textContent = pad(sec % 60);
    }
    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  function stopCountdown() {
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  }

  /* ---------- маршрутизация ---------- */

  var TITLES = {
    home: 'Главная',
    matches: 'Матчи',
    table: 'Таблица',
    squad: 'Состав',
    news: 'Новости',
    tickets: 'Билеты'
  };

  function parseHash() {
    var raw = (location.hash || '#home').replace(/^#\/?/, '');
    var parts = raw.split('/');
    return { name: parts[0] || 'home', param: parts[1] || null };
  }

  function setActiveTab(name) {
    var tabs = tabbar.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
      var isActive = tabs[i].getAttribute('data-tab') === (name === 'tickets' ? 'matches' : name);
      tabs[i].classList.toggle('is-active', isActive);
      if (isActive) tabs[i].setAttribute('aria-current', 'page');
      else tabs[i].removeAttribute('aria-current');
    }
  }

  function render() {
    var route = parseHash();
    stopCountdown();

    var html;
    switch (route.name) {
      case 'matches': html = renderMatches(); break;
      case 'table': html = renderTable(); break;
      case 'squad': html = renderSquad(); break;
      case 'news': html = route.param ? renderNewsItem(route.param) : renderNews(); break;
      case 'tickets': html = renderTickets(); break;
      default: html = renderHome();
    }

    view.innerHTML = html;
    setActiveTab(route.name);
    document.title = (TITLES[route.name] || CLUB.name) + ' · ' + CLUB.name;
    window.scrollTo(0, 0);

    if (route.name === 'home') startCountdown();
  }

  /* ---------- запуск ---------- */

  function applyBranding() {
    var r = document.documentElement.style;
    r.setProperty('--primary', CLUB.colors.primary);
    r.setProperty('--accent', CLUB.colors.accent);
    document.getElementById('crest').textContent = CLUB.initials || initials(CLUB.short);
    document.getElementById('clubName').textContent = CLUB.name;
    document.getElementById('clubSub').textContent = CLUB.city + ' · ' + CLUB.league.split('·')[0].trim();
    document.getElementById('season').textContent = CLUB.season;
  }

  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    var secure = location.protocol === 'https:' || ['localhost', '127.0.0.1'].indexOf(location.hostname) !== -1;
    if (!secure) return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* офлайн-режим недоступен */ });
    });
  }

  applyBranding();
  window.addEventListener('hashchange', render);
  render();
  registerSW();
})();
