/* Quick-answer assistant — answers from this site's own services and FAQ
   content, and hands off to WhatsApp, email or the booking page for
   anything it does not cover. No external service, no data leaves the page. */
(function () {
  'use strict';

  var dataEl = document.getElementById('chat-data');
  var fab = document.getElementById('chat-fab');
  var panel = document.getElementById('chat-panel');
  if (!dataEl || !fab || !panel) return;

  var D;
  try { D = JSON.parse(dataEl.textContent); } catch (e) { return; }

  var log = document.getElementById('chat-log');
  var chips = document.getElementById('chat-chips');
  var form = document.getElementById('chat-form');
  var input = document.getElementById('chat-input');
  var closeBtn = document.getElementById('chat-close');
  var started = false;

  var STOP = ['the','a','an','is','are','do','does','can','you','your','i','my','me','to','of','for','and','with','what','how','in','on','it','that','this','have','any','be','will','would','there'];

  function tokens(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
      .filter(function (w) { return w.length > 2 && STOP.indexOf(w) === -1; });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function say(html, who) {
    var el = document.createElement('div');
    el.className = 'chat-msg chat-msg--' + (who || 'bot');
    el.innerHTML = html;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
  }

  var HANDOFF =
    'You can reach Mary directly: <a href="' + D.whatsapp + '" target="_blank" rel="noopener">WhatsApp</a>, ' +
    '<a href="mailto:' + D.email + '">' + D.email + '</a>, or ' +
    '<a href="' + D.booking + '">book a discovery call</a>.';

  /* build the searchable set once */
  var ENTRIES = [];
  D.faqs.forEach(function (f) {
    ENTRIES.push({ keys: tokens(f.q + ' ' + f.a), answer: escapeHtml(f.a) });
  });
  D.services.forEach(function (s) {
    ENTRIES.push({
      keys: tokens(s.name + ' ' + s.desc),
      answer: '<strong>' + escapeHtml(s.name) + '</strong> — ' + escapeHtml(s.desc) +
        ' <a href="' + s.href + '">Start an enquiry for this</a>.'
    });
  });
  ENTRIES.push({
    keys: tokens('price cost pricing budget quote how much rate fee charge'),
    answer: 'Pricing depends on the format, the length and how many versions you need, so Mary quotes per project rather than from a list. Send the brief through the ' +
      '<a href="' + D.contact + '">enquiry form</a> with your budget range and you will get a figure back.'
  });
  ENTRIES.push({
    keys: tokens('time long turnaround deadline fast quick delivery when ready schedule'),
    answer: 'Turnaround depends on the scope and how many videos are in the batch. Put your deadline in the ' +
      '<a href="' + D.contact + '">enquiry form</a> and Mary will tell you straight away whether it is workable.'
  });
  ENTRIES.push({
    keys: tokens('contact reach email whatsapp phone call book booking discovery talk speak'),
    answer: HANDOFF
  });

  function answer(question) {
    var q = tokens(question);
    if (!q.length) return null;
    var best = null, bestScore = 0;
    ENTRIES.forEach(function (entry) {
      var score = 0;
      q.forEach(function (w) {
        if (entry.keys.indexOf(w) !== -1) score += 2;
        else if (entry.keys.some(function (k) { return k.indexOf(w) === 0 || w.indexOf(k) === 0; })) score += 1;
      });
      if (score > bestScore) { bestScore = score; best = entry; }
    });
    return bestScore >= 2 ? best.answer : null;
  }

  var STARTERS = [
    'What services do you offer?',
    'Can you make AI avatar videos?',
    'How much does a video cost?',
    'What is the turnaround time?',
    'How do I book a call?'
  ];

  function renderChips() {
    chips.innerHTML = '';
    STARTERS.forEach(function (text) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chat-chip';
      b.textContent = text;
      b.addEventListener('click', function () { ask(text); });
      chips.appendChild(b);
    });
  }

  function ask(question) {
    say(escapeHtml(question), 'you');
    input.value = '';
    window.setTimeout(function () {
      var a = answer(question);
      if (a) say(a);
      else say('That one is better answered by Mary herself. ' + HANDOFF);
    }, 320);
  }

  function open() {
    panel.hidden = false;
    fab.setAttribute('aria-expanded', 'true');
    if (!started) {
      started = true;
      say('Hello. I can answer common questions about Mary’s services, process and booking, straight from this site. Ask away, or pick one below.');
      renderChips();
    }
    input.focus();
  }

  function close() {
    panel.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
    fab.focus();
  }

  fab.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) close();
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = input.value.trim();
    if (v) ask(v);
  });
})();
