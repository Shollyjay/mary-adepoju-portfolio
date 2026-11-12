/* Mary Adepoju — shared site behaviour */
(function () {
  'use strict';

  /* ---------- always land at the top of a newly opened page ----------
     html{scroll-behavior:smooth} would animate this reset, so the page is
     marked data-booting (set in the inline head script) while it happens;
     that attribute forces scroll-behavior:auto so the reset is instant. */
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  var root = document.documentElement;
  if (!location.hash) {
    var toTop = function () {
      root.setAttribute('data-booting', '');
      try { window.scrollTo(0, 0); } catch (e) {}
      if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
      if (root) root.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    };
    toTop();
    document.addEventListener('DOMContentLoaded', toTop);
    window.addEventListener('load', function () {
      toTop();
      // release the smooth-scroll guard once the page has settled
      setTimeout(function () { root.removeAttribute('data-booting'); }, 120);
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) toTop(); });
  } else {
    root.removeAttribute('data-booting');
  }

  /* ---------- mobile navigation ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.getElementById('nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && links.classList.contains('open')) toggle.click();
    });
  }

  /* ---------- scroll reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if (!('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- portfolio filters ---------- */
  var filterBar = document.querySelector('[data-filters]');
  if (filterBar) {
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-tags]'));
    var emptyNote = document.querySelector('[data-empty]');

    function apply(value) {
      var shown = 0;
      cards.forEach(function (card) {
        var tags = (card.getAttribute('data-tags') || '').split('|');
        var match = value === 'all' || tags.indexOf(value) !== -1;
        card.hidden = !match;
        if (match) shown++;
      });
      if (emptyNote) emptyNote.hidden = shown !== 0;
    }

    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter');
      if (!btn) return;
      filterBar.querySelectorAll('.filter').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      var value = btn.getAttribute('data-filter');
      apply(value);
      var url = new URL(window.location.href);
      if (value === 'all') url.searchParams.delete('category');
      else url.searchParams.set('category', value);
      history.replaceState(null, '', url);
    });

    var preset = new URLSearchParams(window.location.search).get('category');
    if (preset) {
      var presetBtn = filterBar.querySelector('[data-filter="' + CSS.escape(preset) + '"]');
      if (presetBtn) presetBtn.click();
    }
  }

  /* ---------- contact form ---------- */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var status = document.getElementById('form-status');
    var submitBtn = form.querySelector('[type="submit"]');

    /* prefill the service from ?service= so service CTAs carry through */
    var wanted = new URLSearchParams(window.location.search).get('service');
    if (wanted) {
      var select = form.elements.service;
      var found = Array.prototype.some.call(select.options, function (o) {
        if (o.value.toLowerCase() === wanted.toLowerCase()) { select.value = o.value; return true; }
        return false;
      });
      if (!found) select.value = 'Other';
      select.closest('.field').scrollIntoView({ block: 'center', behavior: 'smooth' });
    }

    function setError(field, message) {
      var wrap = field.closest('.field');
      wrap.classList.toggle('invalid', Boolean(message));
      var slot = wrap.querySelector('.err');
      if (slot) slot.textContent = message || '';
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    function validate() {
      var problems = [];
      [['name', 'Please enter your full name.'],
       ['email', 'Please enter your email address.'],
       ['service', 'Please choose the service you need.'],
       ['message', 'Please describe your project.']].forEach(function (pair) {
        var field = form.elements[pair[0]];
        var value = (field.value || '').trim();
        if (!value) { setError(field, pair[1]); problems.push(field); }
        else setError(field, '');
      });
      var email = form.elements.email;
      if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        setError(email, 'That email address does not look right.');
        if (problems.indexOf(email) === -1) problems.push(email);
      }
      return problems;
    }

    form.addEventListener('input', function (e) {
      if (e.target.closest('.field.invalid')) validate();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.className = 'form-status';
      status.textContent = '';

      var problems = validate();
      if (problems.length) {
        status.className = 'form-status bad show';
        status.textContent = 'Please correct the highlighted fields and try again.';
        problems[0].focus();
        return;
      }

      /* honeypot — silently stop obvious bots */
      if (form.elements.website && form.elements.website.value) return;

      submitBtn.setAttribute('aria-busy', 'true');
      var original = submitBtn.textContent;
      submitBtn.textContent = 'Opening your email app…';

      var f = form.elements;
      var lines = [
        'Name: ' + f.name.value.trim(),
        'Email: ' + f.email.value.trim(),
        'Company / Brand: ' + (f.company.value.trim() || '—'),
        'Service needed: ' + f.service.value,
        'Budget range: ' + (f.budget.value.trim() || '—'),
        'Project timeline: ' + (f.timeline.value.trim() || '—'),
        '',
        'Project description:',
        f.message.value.trim()
      ].join('\n');

      var mailto = 'mailto:' + form.getAttribute('data-to') +
        '?subject=' + encodeURIComponent('Project enquiry — ' + f.service.value + ' — ' + f.name.value.trim()) +
        '&body=' + encodeURIComponent(lines);

      window.location.href = mailto;

      window.setTimeout(function () {
        submitBtn.removeAttribute('aria-busy');
        submitBtn.textContent = original;
        status.className = 'form-status ok show';
        status.innerHTML = 'Your email app should now be open with the enquiry ready to send. ' +
          '<strong>The enquiry is not sent until you press send there.</strong> ' +
          'If nothing opened, email <a href="mailto:' + form.getAttribute('data-to') + '">' +
          form.getAttribute('data-to') + '</a> or message on WhatsApp instead.';
      }, 1200);
    });
  }

  /* ---------- year ---------- */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();

/* ---------- booking: if the embedded calendar is blocked, show a real link ---------- */
(function () {
  var wrap = document.getElementById('cal-wrap');
  if (!wrap) return;
  var frame = document.getElementById('cal-frame');
  var fallback = document.getElementById('cal-fallback');
  var swapped = false;

  function swap() {
    if (swapped) return;
    swapped = true;
    if (frame) frame.remove();
    if (fallback) fallback.hidden = false;
    wrap.classList.add('cal-wrap--fallback');
  }

  /* a blocked frame reports a content-security-policy violation */
  document.addEventListener('securitypolicyviolation', function (e) {
    if (e.violatedDirective && e.violatedDirective.indexOf('frame-src') !== -1) swap();
  });

  /* belt and braces: if nothing has rendered after a few seconds, swap anyway */
  var loaded = false;
  if (frame) {
    frame.addEventListener('load', function () {
      try {
        /* a blocked or errored frame leaves no reachable document and no origin */
        if (frame.contentWindow && frame.contentWindow.length === 0 && !frame.contentWindow.origin) { /* unknowable cross-origin, assume fine */ }
        loaded = true;
      } catch (err) { loaded = true; }
    });
    window.setTimeout(function () { if (!loaded) swap(); }, 5000);
  }
})();

/* ---------- dark / light theme toggle ---------- */
(function () {
  var btn = document.getElementById('theme-toggle');
  if (!btn) return;
  var root = document.documentElement;

  function current() {
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }
  function apply(theme) {
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    try { localStorage.setItem('ma-theme', theme); } catch (e) {}
  }

  apply(current());
  btn.addEventListener('click', function () {
    apply(current() === 'light' ? 'dark' : 'light');
  });
})();

/* ---------- resume download ----------
   A plain download link works on normal hosting. Inside the Claude artifact
   viewer, pages are not granted download permission, so the link is routed
   through the host's downloads capability when it is available. */
(function () {
  'use strict';
  var links = document.querySelectorAll('a[download]');
  if (!links.length || !(window.claude && typeof window.claude.use === 'function')) return;

  var saver = null;
  try {
    window.claude.use('downloads').then(function (d) { saver = d; }, function () {});
  } catch (e) { return; }

  Array.prototype.forEach.call(links, function (a) {
    a.addEventListener('click', function (e) {
      if (!saver) return;                 // not in the viewer — let the browser handle it
      e.preventDefault();
      var label = a.textContent.trim();
      a.setAttribute('aria-busy', 'true');
      fetch(a.getAttribute('href'))
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.blob(); })
        .then(function (blob) {
          return saver.save({ filename: a.getAttribute('download') || 'resume.pdf', data: blob });
        })
        .catch(function (err) {
          if (err && err.code === 'declined') return;   // viewer said no — nothing to report
          window.open(a.getAttribute('href'), '_blank', 'noopener');
        })
        .then(function () { a.removeAttribute('aria-busy'); });
    });
  });
})();
