/* ------------------------------------------------------------
   Static site generator — Mary Adepoju portfolio
   Edit content/site.json, then run:  node build/build.js
   Every project in site.json gets a case study page automatically.
   ------------------------------------------------------------ */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const D = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'site.json'), 'utf8'));

// Internal QA notes live outside version control (content/review-notes.local.json).
// They are never rendered; this merge only exposes them to local tooling when the
// file is present, so a clone without it builds an identical site.
try {
  const notesPath = path.join(ROOT, 'content', 'review-notes.local.json');
  if (fs.existsSync(notesPath)) {
    const { reviewNotes = {} } = JSON.parse(fs.readFileSync(notesPath, 'utf8'));
    (D.projects || []).forEach(pr => { if (reviewNotes[pr.slug]) pr.reviewNote = reviewNotes[pr.slug]; });
  }
} catch (e) { /* notes are optional */ }
D.allProjects = D.projects || [];
D.projects = D.allProjects.filter(p => p.published !== false);
const P = D.profile;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = s => esc(s);

const NAV = [
  { key: 'home', label: 'Home', href: 'index.html' },
  { key: 'about', label: 'About', href: 'about.html' },
  { key: 'portfolio', label: 'Portfolio', href: 'portfolio.html' },
  { key: 'services', label: 'Services', href: 'services.html' },
  { key: 'testimonials', label: 'Testimonials', href: 'testimonials.html' },
  { key: 'contact', label: 'Contact', href: 'contact.html' }
];


function resumeBtn(label) {
  const href = P.resume || P.resumeExternal;
  if (!href) return '';
  const name = (P.name || 'resume').replace(/\s+/g, '-') + '-Resume.pdf';
  return `<a class="btn btn--gold" href="${attr(href)}" download="${attr(name)}">${esc(label)} <span class="arr arr--down" aria-hidden="true">&#8595;</span></a>`;
}


const SOCIAL = (D.social || []).filter(s => s.url);

function socialRow() {
  if (!SOCIAL.length) return '';
  return `<div class="social-row">
    <span class="social-label">Follow</span>
    <ul>${SOCIAL.map(s => `<li><a href="${attr(s.url)}" target="_blank" rel="noopener me">${esc(s.name)}</a></li>`).join('')}</ul>
  </div>`;
}

function chatWidget(b) {
  const data = {
    whatsapp: P.whatsappLink,
    email: P.email,
    booking: b + 'booking.html',
    contact: b + 'contact.html',
    services: D.services.map(s => ({ name: s.name, desc: s.desc, href: b + 'contact.html?service=' + encodeURIComponent(s.name) })),
    faqs: D.faqs.map(f => ({ q: f.q, a: f.a }))
  };
  return `<button class="chat-fab" type="button" id="chat-fab" aria-expanded="false" aria-controls="chat-panel">
  <span class="chat-fab__dot" aria-hidden="true"></span>
  <span class="chat-fab__label">Ask a question</span>
</button>
<section class="chat-panel" id="chat-panel" hidden aria-label="Quick questions">
  <header class="chat-head">
    <div>
      <p class="chat-head__title">Quick answers</p>
      <p class="chat-head__sub">Common questions, answered instantly</p>
    </div>
    <button class="chat-close" type="button" id="chat-close" aria-label="Close">&times;</button>
  </header>
  <div class="chat-log" id="chat-log" role="log" aria-live="polite"></div>
  <div class="chat-chips" id="chat-chips"></div>
  <form class="chat-form" id="chat-form">
    <label class="hp" for="chat-input">Your question</label>
    <input id="chat-input" type="text" placeholder="Type a question\u2026" autocomplete="off">
    <button type="submit" aria-label="Send">&#8599;</button>
  </form>
  <p class="chat-foot">Answers come from this site. For anything else it will put you through to Mary.</p>
</section>
<script id="chat-data" type="application/json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}


function quoteCard(t, b) {
  const avatar = t.photo
    ? `<img class="avatar" src="${attr(b + t.photo)}" alt="${attr(t.name)}" width="52" height="52" loading="lazy">`
    : '';
  return `<article class="card quote-card reveal">
    <p class="qmark" aria-hidden="true">&ldquo;</p>
    <blockquote>${esc(t.quote)}</blockquote>
    <div class="who">${avatar}<div><b>${esc(t.name)}</b>${t.role ? `<small>${esc(t.role)}</small>` : ''}</div></div>
  </article>`;
}

function facesStrip(b) {
  const withPhotos = D.testimonials.filter(t => t.published && t.photo).slice(0, 8);
  if (!withPhotos.length) return '';
  return `<div class="faces reveal">
    ${withPhotos.map(t => `<img src="${attr(b + t.photo)}" alt="${attr(t.name)}" width="56" height="56" loading="lazy">`).join('')}
    <span class="faces__note">${D.testimonials.filter(t => t.published).length} collaborators and clients</span>
  </div>`;
}

function typeCards() {
  return `<div class="type-grid">
    ${D.videoTypes.map(t => `<article class="type-card reveal">
      ${typeIcon(t.name)}
      <h3>${esc(t.name)}</h3>
      <p class="type-card__what">${esc(t.what)}</p>
      <p class="type-card__use">${esc(t.use)}</p>
      <ul>${t.includes.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
    </article>`).join('\n')}
  </div>`;
}

function toolkitGrid() {
  return `<div class="grid grid-3" style="margin-top:3.5rem">
    ${D.tools.map(g => `<div class="tool-group reveal">
      <h3>${esc(g.group)}</h3>
      <ul>${g.items.map(i => `<li>
        <span class="tool-mark" aria-hidden="true">${esc(i.name.charAt(0))}</span>
        <div><b>${esc(i.name)}</b>${i.note ? `<span class="tool-note">${esc(i.note)}</span>` : ''}</div>
      </li>`).join('')}</ul>
    </div>`).join('\n')}
  </div>`;
}

function certSection(b) {
  const certs = D.certifications || [];
  if (!certs.length) {
    return `<section class="section wash-b section--aurora">
  <div class="wrap">
    <span class="section-label reveal">Certifications</span>
    <h2 class="section-title reveal">Training behind the practice.</h2>
    <div class="notice reveal" style="max-width:72ch;margin-top:2.5rem">
      <h3>Certificates not added yet</h3>
      <p>This section lists real, verifiable training. Send the names, issuers and dates and they appear as cards.</p>
    </div>
  </div>
</section>`;
  }
  return `<section class="section wash-b section--aurora">
  <div class="wrap">
    <span class="section-label reveal">Certifications</span>
    <h2 class="section-title section-title--wide reveal">Training behind the <span class="grad-text">practice</span>.</h2>
    <p class="lede reveal">Formal training in the tools and the craft, alongside five years of client work.</p>
    <div class="cert-grid">
      ${certs.map(c => {
        const plate = c.image
          ? `<a class="cert-plate cert-plate--photo" href="${attr(b + c.image)}" target="_blank" rel="noopener" aria-label="View the ${attr(c.name)} certificate">
               <img src="${attr(b + c.image)}" alt="${attr(c.name)} certificate" loading="lazy">
               <span class="cert-plate__open">View certificate &#8599;</span>
             </a>`
          : `<div class="cert-plate tint-${attr(c.tint || 'a')}" aria-hidden="true">
               <span class="cert-plate__seal">${esc((c.issuer || c.name).charAt(0))}</span>
               <span class="cert-plate__issuer">${esc(c.issuer || '')}</span>
               ${c.year ? `<span class="cert-plate__year">${esc(c.year)}</span>` : ''}
             </div>`;
        return `<article class="cert-card reveal">
          ${plate}
          <div class="cert-card__body">
            <h3>${esc(c.name)}</h3>
            <p>${esc(c.issuer || '')}${c.year ? ` &middot; ${esc(c.year)}` : ''}</p>
            ${c.note ? `<p>${esc(c.note)}</p>` : ''}
            ${c.url ? `<a class="textlink" href="${attr(c.url)}" target="_blank" rel="noopener">Verify credential <span aria-hidden="true">&rarr;</span></a>` : ''}
          </div>
        </article>`;
      }).join('\n')}
    </div>
  </div>
</section>`;
}


const TYPE_ICONS = {
  'AI Video Advertisements': '<rect x="2.5" y="5" width="13" height="14" rx="2"/><path d="M15.5 10.5 21.5 7v10l-6-3.5z"/><path d="M6 9.5h4M6 13h6"/>',
  'AI Video Ads': '<rect x="2.5" y="5" width="13" height="14" rx="2"/><path d="M15.5 10.5 21.5 7v10l-6-3.5z"/><path d="M6 9.5h4M6 13h6"/>',
  'AI UGC Videos': '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><circle cx="12" cy="9" r="2.4"/><path d="M8.2 17.5a4.2 4.2 0 0 1 7.6 0"/>',
  'AI Avatar Videos': '<circle cx="12" cy="8.2" r="3.6"/><path d="M5.5 20.5a6.5 6.5 0 0 1 13 0"/><path d="M3 6V3.5h2.5M21 6V3.5h-2.5M3 18v2.5h2.5M21 18v2.5h-2.5"/>',
  'Explainer Videos': '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.6v.4"/><path d="M12 17.2h.01"/>',
  'Product Commercials': '<path d="M12 2.8 20.5 7v10L12 21.2 3.5 17V7z"/><path d="M3.5 7 12 11.4 20.5 7M12 11.4v9.8"/>',
  'Social Media Content': '<path d="M4 11.5c0-4.1 3.6-7.5 8-7.5s8 3.4 8 7.5-3.6 7.5-8 7.5a9 9 0 0 1-2.6-.4L5 20.5l1.1-3.4A7.2 7.2 0 0 1 4 11.5Z"/><path d="M9 11.5h.01M12 11.5h.01M15 11.5h.01"/>',
  'Social Media Videos': '<path d="M4 11.5c0-4.1 3.6-7.5 8-7.5s8 3.4 8 7.5-3.6 7.5-8 7.5a9 9 0 0 1-2.6-.4L5 20.5l1.1-3.4A7.2 7.2 0 0 1 4 11.5Z"/><path d="M9 11.5h.01M12 11.5h.01M15 11.5h.01"/>',
  'Promotional Videos': '<path d="M3.5 9.5v5h3l6 4V5.5l-6 4z"/><path d="M16.5 9a4.5 4.5 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/>',
  'Video Editing': '<path d="M3 6.5h18v11H3z"/><path d="M3 10h18M3 14h18M7.5 6.5v11M16.5 6.5v11"/>',
  'Scriptwriting and Storyboarding': '<path d="M5 3.5h9l5 5v12H5z"/><path d="M14 3.5v5h5"/><path d="M8.5 13h7M8.5 16.5h4.5"/>',
  'AI Video Automation': '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M4.2 7.5l2.6 1.5M17.2 15l2.6 1.5M4.2 16.5l2.6-1.5M17.2 9l2.6-1.5"/>'
};
function typeIcon(name) {
  const path = TYPE_ICONS[name] || '<circle cx="12" cy="12" r="8.5"/><path d="M10 9.2 15.5 12 10 14.8z"/>';
  return `<span class="type-card__icon" aria-hidden="true"><svg viewBox="0 0 24 24">${path}</svg></span>`;
}

const ARROW = '<span class="arr" aria-hidden="true">&#8599;</span>';

function header(active, b) {
  const items = NAV.map(n =>
    `<li><a href="${b}${n.href}"${n.key === active ? ' aria-current="page"' : ''}>${n.label}</a></li>`
  ).join('');
  return `<header class="site-header">
  <div class="wrap">
    <nav class="nav" aria-label="Primary">
      <a class="brand" href="${b}index.html" aria-label="Mary Adepoju — home">
        <b>Mary Adepoju</b><span>AI Video Creator</span>
      </a>
      <ul class="nav-links" id="nav-links">
        ${items}
        <li class="mobile-cta"><a class="btn btn--primary btn--block" href="${b}booking.html">Book a Discovery Call ${ARROW}</a></li>
      </ul>
      <div class="nav-cta">
        <button class="theme-toggle" id="theme-toggle" type="button" aria-label="Switch between dark and light mode" title="Switch theme">
          <svg class="theme-toggle__moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></svg>
          <svg class="theme-toggle__sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.4v2.4M12 19.2v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.4 12h2.4M19.2 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"/></svg>
        </button>
        <a class="btn btn--primary" href="${b}booking.html">Book a Discovery Call ${ARROW}</a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="Menu"><span></span></button>
      </div>
    </nav>
  </div>
</header>`;
}

function ctaBand(b, title, sub) {
  return `<section class="cta-band">
  <div class="wrap reveal">
    <p class="eyebrow">Let&rsquo;s make something meaningful</p>
    <h2>${title}</h2>
    ${sub ? `<p class="lede" style="margin-inline:auto">${sub}</p>` : ''}
    <div class="hero-actions">
      <a class="btn btn--primary" href="${b}contact.html">Discuss Your Project ${ARROW}</a>
      <a class="btn btn--ghost" href="${b}booking.html">Book a Discovery Call ${ARROW}</a>
    </div>
  </div>
</section>`;
}

function footer(b) {
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-brand">
        <h3>Mary Adepoju<span style="color:var(--gold)">.</span></h3>
        <p>${esc(P.title)}. ${esc(P.location)} &middot; Creative work, worldwide.</p>
      </div>
      <div class="footer-col">
        <h4>Explore</h4>
        <ul>
          <li><a href="${b}portfolio.html">Projects &amp; Case Studies</a></li>
          <li><a href="${b}about.html">About &amp; Experience</a></li>
          <li><a href="${b}services.html">Services</a></li>
          <li><a href="${b}testimonials.html">Testimonials</a></li>
          <li><a href="${b}booking.html">Book a Discovery Call</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Let&rsquo;s connect</h4>
        <ul>
          <li><a href="mailto:${attr(P.email)}">${esc(P.email)}</a></li>
          <li><a href="${attr(P.whatsappLink)}" target="_blank" rel="noopener">WhatsApp &middot; ${esc(P.whatsapp)}</a></li>
          <li><a href="${b}contact.html">Project enquiry form</a></li>
        </ul>
      </div>
    </div>
    ${socialRow()}
    <div class="footer-base">
      <span>&copy; <span data-year>2026</span> Mary Adepoju. All rights reserved.</span>
      <span>${esc(P.title)}</span>
    </div>
  </div>
</footer>`;
}

function page({ file, title, description, active, body, b = '' }) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${attr(description)}">
<meta name="author" content="Mary Adepoju">
<meta property="og:type" content="website">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(description)}">
<meta property="og:image" content="${attr(b + P.headshot)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0b0d10">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${b}assets/css/site.css">
<script>(function(){var d=document.documentElement;try{var t=localStorage.getItem('ma-theme');if(t==='light'||t==='dark'){d.setAttribute('data-theme',t);}}catch(e){}try{if('scrollRestoration' in history){history.scrollRestoration='manual';}}catch(e){}if(!location.hash){d.setAttribute('data-booting','');try{window.scrollTo(0,0);}catch(e){}}})();</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${header(active, b)}
<main id="main">
${body}
</main>
${footer(b)}
${chatWidget(b)}
<script src="${b}assets/js/site.js" defer></script>
<script src="${b}assets/js/chat.js" defer></script>
</body>
</html>`;
  const out = path.join(DIST, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  return file;
}

/* ---------------- shared partials ---------------- */

function projectCard(pr, b) {
  const href = `${b}work/${pr.slug}.html`;
  return `<article class="project-card reveal" data-tags="${attr(pr.tags.join('|'))}">
  <a class="thumb${pr.poster ? ' thumb--photo' : ''}" href="${href}" aria-label="View the ${attr(pr.name)} case study">
    ${pr.poster ? `<img class="thumb__img" src="${attr(b + pr.poster)}" alt="" loading="lazy">` : ''}
    <div class="thumb__copy">
      <p class="meta">${esc(pr.category)}${pr.spec ? ' &middot; Concept' : ''}</p>
      <h3>${esc(pr.name)}</h3>
    </div>
    <span class="corner" aria-hidden="true">&#8599;</span>
  </a>
  <div class="project-body">
    <p class="small-caps">${esc(pr.client)}</p>
    <h4>${esc(pr.name)}</h4>
    <p>${esc(pr.short)}</p>
    <a class="textlink" href="${href}">View Case Study <span aria-hidden="true">&rarr;</span></a>
  </div>
</article>`;
}

function pageHead({ eyebrow, title, lede, crumbs, b }) {
  return `<section class="page-head">
  <div class="wrap reveal">
    ${crumbs ? `<p class="crumbs"><a href="${b}index.html">Home</a><span>/</span>${esc(crumbs)}</p>` : ''}
    <p class="eyebrow" style="margin-top:1rem">${esc(eyebrow)}</p>
    <h1>${title}</h1>
    ${lede ? `<p class="lede">${esc(lede)}</p>` : ''}
  </div>
</section>`;
}

/* ---------------- 1. HOME ---------------- */

const featured = D.projects.slice(0, 3);

const featuredT = D.testimonials.filter(t => t.published).slice(0, 3);
const marqueeWords = ['AI Video Ads','UGC','AI Avatars','Explainers','Product Commercials','Social Content','Scriptwriting','Video Editing','Creative Direction'];

function showreelBlock() {
  const r = D.showreel || {};
  if (r.embed) {
    return `<div class="reel-frame reveal">
      <iframe src="${attr(r.embed)}" title="Showreel" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>
    </div>`;
  }
  if (r.file) {
    return `<div class="reel-frame reveal">
      <video src="${attr(r.file)}"${r.poster ? ` poster="${attr(r.poster)}"` : ''} controls playsinline preload="metadata"></video>
    </div>`;
  }
  return `<div class="reel-frame reel-frame--empty reveal">
    <div class="reel-grid" aria-hidden="true"></div>
    <div class="reel-center">
      <span class="play" aria-hidden="true">&#9654;</span>
      <p class="cap">Showreel &mdash; add your reel to go live here</p>
    </div>
  </div>`;
}

function statsBand() {
  const S = D.industryStats;
  if (!S || !S.items || !S.items.length) return '';
  return `<section class="section section--stats wash-c section--aurora">
    <div class="wrap">
      <span class="section-label reveal">Why video / the numbers</span>
      <h2 class="section-title reveal">The case for video is not a hunch.</h2>
      <div class="stat-row">
        ${S.items.map(i => `<div class="stat reveal">
          <div class="stat__value grad-text">${esc(i.value)}</div>
          <div class="stat__label">${esc(i.label)}</div>
          <p class="stat__detail">${esc(i.detail)}</p>
        </div>`).join('\n')}
      </div>
      <p class="stat-source reveal">${esc(S.note || '')} Source: <a href="${attr(S.sourceUrl)}" target="_blank" rel="noopener">${esc(S.source)}</a>.</p>
    </div>
  </section>`;
}

function transformationBlock() {
  const t = D.transformation || {};
  const rows = D.transformations || [];
  const hasVisual = t.before && t.before.image && t.after && t.after.image;

  const visual = hasVisual ? `
    <p class="lede lede--flush reveal" style="margin-top:1.5rem">${esc(t.intro || '')}</p>

    <h3 class="sub-step reveal"><span>01</span> Visual transformation</h3>
    <div class="ba-visual reveal">
      <figure class="ba-shot ba-shot--before">
        <div class="ba-shot__img"><img src="${attr(t.before.image)}" alt="${attr(t.before.caption || 'Before')}" loading="lazy" decoding="async"></div>
        <figcaption><span class="ba-tag ba-tag--before">${esc(t.before.label || 'Before')}</span>${esc(t.before.caption || '')}</figcaption>
      </figure>
      <div class="ba-visual__arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6"/></svg>
      </div>
      <figure class="ba-shot ba-shot--after">
        <div class="ba-shot__img"><img src="${attr(t.after.image)}" alt="${attr(t.after.caption || 'After')}" loading="lazy" decoding="async"></div>
        <figcaption><span class="ba-tag ba-tag--after">${esc(t.after.label || 'After')}</span>${esc(t.after.caption || '')}</figcaption>
      </figure>
    </div>` : '';

  const perf = rows.length ? `
    <h3 class="sub-step reveal"><span>02</span> Creative performance</h3>
    ${D.transformationsNote ? `<p class="res-flag reveal"><span>Illustrative</span>${esc(D.transformationsNote)}</p>` : ''}
    <div class="grid grid-2" style="margin-top:1.5rem">
      ${rows.map(r => `<article class="ba-card reveal">
        <h3>${esc(r.title)}</h3>
        <div class="ba-split">
          <div class="ba-side ba-side--before"><span>Before</span><b>${esc(r.before)}</b></div>
          <div class="ba-arrow" aria-hidden="true">&rarr;</div>
          <div class="ba-side ba-side--after"><span>After</span><b>${esc(r.after)}</b></div>
        </div>
        ${r.source ? `<p class="ba-source">Source: ${esc(r.source)}</p>` : ''}
      </article>`).join('\n')}
    </div>` : `
    <h3 class="sub-step reveal"><span>02</span> Creative performance</h3>
    <div class="notice reveal" style="max-width:74ch;margin-top:1.5rem">
      <p>Performance figures go here once a client supplies them &mdash; the number before the work and the number after, with the source named. Nothing in this space is estimated or illustrative, so it stays empty until there are real numbers to show.</p>
    </div>`;

  const improve = (t.improvements && t.improvements.length) ? `
    <h3 class="sub-step reveal"><span>03</span> What creative can improve</h3>
    <ul class="improve-list reveal">
      ${t.improvements.map(i => `<li>${esc(i)}</li>`).join('\n')}
    </ul>` : '';

  if (!hasVisual && !rows.length) {
    return `<div class="notice reveal" style="max-width:72ch;margin-top:2.5rem">
      <h3>Add your before / after proof</h3>
      <p>This section shows real transformation data &mdash; the figure before the work and the figure after, side by side, with the source named. It is empty because no verified numbers have been supplied yet, and nothing here is estimated or made up.</p>
    </div>`;
  }

  return visual + perf + improve;
}

const home = `
<section class="hero">
  <div class="hero-glow" aria-hidden="true"></div>
  <div class="wrap">
    <div class="hero-inner">
      <div class="hero-copy reveal in">
        <p class="hero-eyebrow">${esc(D.hero.eyebrow)}</p>
        <h1>Turning Ideas Into Videos That Make Brands <span class="grad-text">Impossible to Ignore</span><span class="dot">.</span></h1>
        <p class="hero-support">${esc(D.hero.support)}</p>
        <div class="hero-actions">
          <a class="btn btn--primary" href="portfolio.html">Explore My Work ${ARROW}</a>
          <a class="btn btn--ghost" href="contact.html">Let&rsquo;s Create Together ${ARROW}</a>
        </div>
        <p class="hero-services">${esc(D.hero.serviceLine)}</p>
      </div>
      <div class="hero-portrait reveal in">
        <div class="frame">
          <img src="${attr(P.headshot)}" alt="Mary Adepoju, AI Video Creator and Video Editor" width="880" height="756" fetchpriority="high">
          <p class="tag">Creator / Storyteller / Editor</p>
        </div>
      </div>
    </div>
  </div>
  <div class="marquee" aria-hidden="true">
    <div class="marquee__track">
      ${[0,1].map(() => marqueeWords.map(w => `<span>${esc(w)}</span><i>&bull;</i>`).join('')).join('')}
    </div>
  </div>
</section>

<section class="section section--reel">
  <div class="wrap">
    <span class="section-label reveal">The reel / 01</span>
    <h2 class="section-title reveal">Sixty seconds of what I do.</h2>
    ${showreelBlock()}
  </div>
</section>

<section class="section wash-a section--aurora">
  <div class="wrap">
    <span class="section-label reveal">What I make / 02</span>
    <h2 class="section-title section-title--wide reveal">Every kind of video that lives under <span class="grad-text">AI creation and editing</span>.</h2>
    <p class="lede reveal">AI video is not one thing. These are the formats I work in, what each one is for, and when it is the right choice.</p>
    ${typeCards()}
    <div class="reveal" style="margin-top:3rem">
      <a class="btn btn--primary" href="services.html">See How Each One Works ${ARROW}</a>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <span class="section-label reveal">Selected projects / 03</span>
    <h2 class="section-title reveal">Stories that make people pay attention.</h2>
    ${D.projects.length
      ? `<p class="lede reveal">A selection of AI-powered marketing, promotional and social media projects.</p>
         <div class="grid grid-3" style="margin-top:3.5rem">${D.projects.slice(0,3).map(pr => projectCard(pr, '')).join('\n')}</div>
         <div class="reveal" style="margin-top:3rem"><a class="btn btn--ghost" href="portfolio.html">View All Projects ${ARROW}</a></div>`
      : `<p class="lede reveal">New case studies are being prepared from recent client work &mdash; each one with the video, the brief behind it and what it was built to do.</p>
         <div class="grid grid-3 reveal" style="margin-top:3.5rem">
           ${['AI Video Ads','AI UGC','Product Commercials'].map(c => `<article class="slot-card"><p class="small-caps">${esc(c)}</p><p class="slot-card__note">Case study in preparation</p></article>`).join('')}
         </div>
         <div class="reveal" style="margin-top:3rem"><a class="btn btn--ghost" href="contact.html">Ask About This Work ${ARROW}</a></div>`}
  </div>
</section>

<section class="section wash-b section--aurora">
  <div class="wrap">
    <span class="section-label reveal">Services / 04</span>
    <h2 class="section-title reveal">Creative support, from idea to impact.</h2>
    <div class="grid grid-3" style="margin-top:3.5rem">
      ${D.services.slice(0, 6).map(s => `<article class="card svc-card reveal">
        <p class="small-caps" style="color:var(--gold)">${esc(s.num)}</p>
        <h3 style="font-size:1.4rem;margin-top:.75rem">${esc(s.name)}</h3>
        <p class="muted" style="margin-top:.85rem;font-size:.9375rem">${esc(s.desc)}</p>
        <a class="textlink" style="margin-top:1.25rem" href="contact.html?service=${encodeURIComponent(s.name)}">Discuss this <span aria-hidden="true">&rarr;</span></a>
      </article>`).join('\n')}
    </div>
    <div class="reveal" style="margin-top:3rem">
      <a class="btn btn--ghost" href="services.html">See All Services ${ARROW}</a>
    </div>
  </div>
</section>

<section class="section wash-c section--aurora">
  <div class="wrap">
    <span class="section-label reveal">The toolkit / 05</span>
    <h2 class="section-title section-title--wide reveal">The tools behind the story, and what each one is for.</h2>
    <p class="lede reveal">Tools do not make the video. Knowing which one to reach for, and when, is what keeps the work consistent.</p>
    ${toolkitGrid()}
  </div>
</section>

  ${statsBand()}

<section class="section wash-a section--aurora">
  <div class="wrap">
    <span class="section-label reveal">Transformation proof / 06</span>
    <h2 class="section-title section-title--wide reveal">Before the video. <span class="grad-text">After the video.</span></h2>
    ${transformationBlock()}
  </div>
</section>

<section class="section">
  <div class="wrap">
    <span class="section-label reveal">The creator behind the work / 07</span>
    <h2 class="section-title reveal">Creativity, with a clear purpose.</h2>
    <div class="grid grid-2" style="align-items:center;margin-top:3rem">
      <div class="reveal">
        <p class="lede lede--flush">${esc(P.intro)}</p>
        <div class="meta-row">
          <div><span>Experience</span><b>${esc(P.experienceYears)} Years</b></div>
          <div><span>Based in</span><b>${esc(P.location)}</b></div>
        </div>
        <div class="hero-actions">
          <a class="btn btn--ghost" href="about.html">More About Me ${ARROW}</a>
          ${resumeBtn("Download Resume")}
        </div>
      </div>
      <div class="reveal">
        <div class="hero-portrait" style="max-width:380px;margin-inline:auto">
          <div class="frame">
            <img src="${attr(P.headshot)}" alt="Mary Adepoju, AI Video Creator and Video Editor" width="880" height="756" loading="lazy">
            <p class="tag">A human vision. An AI-powered toolkit.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section wash-b section--aurora">
  <div class="wrap">
    <span class="section-label reveal">Client voices / 08</span>
    <h2 class="section-title reveal">The people behind the projects.</h2>
    ${facesStrip('')}
    <div class="grid grid-3" style="margin-top:3rem">
      ${featuredT.map(t => quoteCard(t, '')).join('\n')}
    </div>
    <div class="reveal" style="margin-top:3rem">
      <a class="btn btn--ghost" href="testimonials.html">View All Testimonials ${ARROW}</a>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <span class="section-label reveal">FAQs / 09</span>
    <h2 class="section-title reveal">A few things worth knowing.</h2>
    <div style="margin-top:2.5rem">
      ${D.faqs.map(f => `<details class="faq reveal">
        <summary>${esc(f.q)}<span class="pm" aria-hidden="true">+</span></summary>
        <p>${esc(f.a)}</p>
      </details>`).join('\n')}
    </div>
    <div class="reveal" style="margin-top:2.5rem">
      <a class="btn btn--ghost" href="contact.html">Ask Something Else ${ARROW}</a>
    </div>
  </div>
</section>

${ctaBand('', 'Your next story starts here.', 'Tell me what you are building and we will shape the video around it.')}
`;

page({
  file: 'index.html', active: 'home',
  title: 'AI Video Creator & Video Editor | Mary Adepoju',
  description: 'Scroll-stopping AI videos, compelling visuals and creative storytelling for brands — AI video ads, UGC, explainers and professional video editing.',
  body: home
});

/* ---------------- 2. ABOUT ---------------- */

const about = `
${pageHead({
  eyebrow: 'The creator behind the work',
  title: 'Creativity, with a clear purpose.',
  lede: P.intro,
  crumbs: 'About', b: ''
})}

<section class="section">
  <div class="wrap">
    <div class="grid grid-2" style="align-items:start">
      <div class="reveal">
        <div class="hero-portrait" style="max-width:400px">
          <div class="frame">
            <img src="${attr(P.headshot)}" alt="Mary Adepoju, AI Video Creator and Video Editor" width="880" height="756">
            <p class="tag">Creator / Storyteller / Editor</p>
          </div>
        </div>
      </div>
      <div class="reveal">
        <span class="section-label">Professional profile</span>
        <h2 class="section-title" style="font-size:clamp(1.7rem,3.4vw,2.5rem)">From the first idea to the final frame.</h2>
        <p class="lede">My approach connects creative direction, scripting and visual storytelling with AI production and careful editing. Every decision starts with the message, the audience and the purpose of the work.</p>
        <dl class="cs-facts" style="margin-top:2.5rem">
          <div><dt>Name</dt><dd>${esc(P.name)}</dd></div>
          <div><dt>Title</dt><dd>${esc(P.title)}</dd></div>
          <div><dt>Experience</dt><dd>${esc(P.experienceYears)} years</dd></div>
          <div><dt>Location</dt><dd>${esc(P.location)}</dd></div>
        </dl>
        <div class="hero-actions">
          ${resumeBtn("Download My Resume")}
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section wash-b section--aurora">
  <div class="wrap">
    <span class="section-label reveal">Experience</span>
    <h2 class="section-title reveal">Five years. A complete creative toolkit.</h2>
    <div class="timeline">
      ${D.experience.map(e => `<article class="tl-item reveal">
        <div><p class="tl-when">${esc(e.period)}</p></div>
        <div>
          <h3>${esc(e.company)}</h3>
          <p class="tl-role">${esc(e.role)}</p>
          <ul class="ticks">${e.points.map(pt => `<li>${esc(pt)}</li>`).join('')}</ul>
        </div>
      </article>`).join('\n')}
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <span class="section-label reveal">Skills &amp; expertise</span>
    <h2 class="section-title reveal">Strategy meets production.</h2>
    <div class="grid grid-2" style="margin-top:3rem">
      <div class="reveal">
        <h3 style="font-family:var(--sans);font-size:.6875rem;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);font-weight:600;margin-bottom:1.5rem">Core technical skills</h3>
        <ul class="chips">${D.skills.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
      </div>
      <div class="reveal">
        <h3 style="font-family:var(--sans);font-size:.6875rem;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);font-weight:600;margin-bottom:1.5rem">How I work</h3>
        <ul class="chips">${D.softSkills.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
      </div>
    </div>
  </div>
</section>

<section class="section wash-c section--aurora">
  <div class="wrap">
    <span class="section-label reveal">Tools &amp; technologies</span>
    <h2 class="section-title section-title--wide reveal">The tools behind the story, and what each one is for.</h2>
    ${toolkitGrid()}
  </div>
</section>

<section class="section wash-a section--aurora">
  <div class="wrap">
    <span class="section-label reveal">What I make</span>
    <h2 class="section-title section-title--wide reveal">The formats that sit under <span class="grad-text">AI video creation and editing</span>.</h2>
    ${typeCards()}
  </div>
</section>

<section class="section wash-a section--aurora">
  <div class="wrap">
    <span class="section-label reveal">Industries</span>
    <h2 class="section-title reveal">Different industries. One clear message.</h2>
    <ul class="chips reveal" style="margin-top:2.5rem">${D.industries.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <span class="section-label reveal">My creative process</span>
    <h2 class="section-title reveal">A clear path from idea to delivery.</h2>
    <div class="steps">
      ${D.process.map(s => `<div class="step reveal"><b>${esc(s.num)}</b><div><h3>${esc(s.name)}</h3><p>${esc(s.desc)}</p></div></div>`).join('\n')}
    </div>
  </div>
</section>

${certSection('')}

${ctaBand('', 'Let&rsquo;s bring your idea to life.')}
`;

page({
  file: 'about.html', active: 'about',
  title: 'About Mary Adepoju | AI Video Creator & Video Editor',
  description: 'AI Video Creator and Video Editor with 5 years of experience in AI video production, scriptwriting and professional editing. Experience, skills, tools and industries.',
  body: about
});

/* ---------------- 3. PORTFOLIO ---------------- */

const portfolio = `
${pageHead({
  eyebrow: 'Selected work',
  title: 'Stories that make people pay attention.',
  lede: 'A selection of AI-powered marketing, promotional and social media projects. Open any project for the full case study.',
  crumbs: 'Portfolio', b: ''
})}

<section class="section wash-a section--aurora" style="padding-top:clamp(2.5rem,5vw,4rem)">
  <div class="wrap">
    ${D.projects.length ? `
    <div class="filters reveal" data-filters role="group" aria-label="Filter projects by category">
      <button class="filter" type="button" data-filter="all" aria-pressed="true">All Projects</button>
      ${D.categories.map(c => `<button class="filter" type="button" data-filter="${attr(c)}" aria-pressed="false">${esc(c)}</button>`).join('')}
    </div>
    <div class="grid grid-3">
      ${D.projects.map(pr => projectCard(pr, '')).join('\n')}
    </div>
    <p class="empty-note" data-empty hidden>No projects in this category yet. Choose another category, or <a class="textlink" href="contact.html">ask about a project like this</a>.</p>
    ` : `
    <div class="notice reveal" style="max-width:72ch">
      <h3>Case studies in preparation</h3>
      <p>Project work is being written up from recent client videos. Each case study will carry the video itself, the brief behind it, the creative approach and the deliverables &mdash; published only once the work and the detail behind it have been confirmed.</p>
    </div>
    <div class="grid grid-3 reveal" style="margin-top:3rem">
      ${D.categories.slice(0, 6).map(c => `<article class="slot-card"><p class="small-caps">${esc(c)}</p><p class="slot-card__note">Case study in preparation</p></article>`).join('\n')}
    </div>
    <div class="reveal" style="margin-top:3rem">
      <a class="btn btn--primary" href="contact.html">Ask To See Samples ${ARROW}</a>
    </div>
    `}
  </div>
</section>

${ctaBand('', 'Want something like this for your brand?')}
`;

page({
  file: 'portfolio.html', active: 'portfolio',
  title: 'Portfolio & AI Video Projects | Mary Adepoju',
  description: 'AI video projects and case studies — AI video ads, UGC, avatar videos, explainers, product commercials, social media content and video editing.',
  body: portfolio
});

/* ---------------- 4. CASE STUDIES (generated per project) ---------------- */

D.projects.forEach(pr => {
  const related = D.projects.filter(x => x.slug !== pr.slug);
  const body = `
<section class="page-head">
  <div class="wrap reveal">
    <p class="crumbs"><a href="../index.html">Home</a><span>/</span><a href="../portfolio.html">Portfolio</a><span>/</span>${esc(pr.name)}</p>
    <div class="cs-hero" style="margin-top:2rem">
      <div>
        <p class="eyebrow">${esc(pr.category)}${pr.spec ? ' &middot; Concept Spec' : ''}</p>
        <h1 style="margin-top:1rem">${esc(pr.name)}</h1>
        <p class="lede">${esc(pr.description)}</p>
      </div>
      <div>
        <dl class="cs-facts">
          <div><dt>Client</dt><dd>${esc(pr.client)}</dd></div>
          <div><dt>Category</dt><dd>${esc(pr.category)}</dd></div>
          <div><dt>Role</dt><dd>${esc(P.title)}</dd></div>
        </dl>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    ${pr.video
      ? `<div class="player reveal${(pr.poster && /vertical/.test('')) ? '' : ''}">
           <video controls playsinline preload="none"${pr.poster ? ` poster="../${attr(pr.poster)}"` : ''} src="../${attr(pr.video)}"></video>
         </div>`
      : `<div class="video-frame reveal"><div><span class="play" aria-hidden="true">&#9654;</span><p class="cap">Video preview &mdash; add the project video</p></div></div>`}
    ${pr.spec ? `<div class="notice reveal" style="max-width:72ch;margin-top:2rem"><h3>Concept / spec work</h3><p>This piece was produced independently as a concept. It was not commissioned by, affiliated with or endorsed by the brand shown.</p></div>` : ''}
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="grid grid-2" style="align-items:start">
      <div class="cs-block reveal">
        <span class="section-label">Objective</span>
        <p>${esc(pr.objective)}</p>
      </div>
      <div class="cs-block reveal">
        <span class="section-label">Deliverables</span>
        <ul class="ticks">${pr.deliverables.map(d => `<li>${esc(d)}</li>`).join('')}</ul>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="cs-block reveal">
      <span class="section-label">The challenge</span>
      <h2>What the project needed to solve.</h2>
      <p>${esc(pr.challenge)}</p>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="cs-block reveal">
      <span class="section-label">The solution</span>
      <h2>Concept, script, AI production, edit.</h2>
      <p>${esc(pr.solution)}</p>
      ${pr.campaign ? `<p class="cs-campaign"><span>Campaign context</span>${esc(pr.campaign)}</p>` : ''}
    </div>
    <div class="grid grid-2 reveal" style="margin-top:3rem;align-items:start">
      <div>
        <span class="section-label">Tools used</span>
        <ul class="chips">${pr.tools.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
      </div>
      <div>
        <span class="section-label">Production process</span>
        <ul class="ticks">${pr.process.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <span class="section-label reveal">Results</span>
    ${pr.results && pr.results.length
      ? `${pr.resultsIllustrative ? `<p class="res-flag reveal"><span>Illustrative</span>${esc(pr.resultsNote || '')}</p>` : ''}
         <div class="res-grid reveal">
           ${pr.results.map(r => r.before !== undefined
             ? `<div class="res-item">
                  <span class="res-item__label">${esc(r.label)}</span>
                  <div class="res-item__pair">
                    <b class="res-item__before">${esc(r.before)}</b>
                    <i class="res-item__arrow" aria-hidden="true">&rarr;</i>
                    <b class="res-item__after">${esc(r.after)}</b>
                  </div>
                </div>`
             : `<div class="res-item"><span class="res-item__label">${esc(r.label)}</span><div class="res-item__pair"><b class="res-item__after">${esc(r.value)}</b></div></div>`).join('')}
         </div>`
      : `<div class="notice reveal" style="max-width:68ch">
           <h3>Results pending</h3>
           <p>No verified performance figures have been published for this project yet.</p>
         </div>`}
  </div>
</section>

<section class="section">
  <div class="wrap">
    <span class="section-label reveal">Related projects</span>
    <h2 class="section-title reveal">More selected work.</h2>
    <div class="grid grid-3" style="margin-top:3rem">
      ${related.map(x => projectCard(x, '../')).join('\n')}
    </div>
  </div>
</section>

${ctaBand('../', 'Want a project like this?', 'Tell me about your product, audience and deadline and we will plan the right format.')}
`;

  page({
    file: path.join('work', `${pr.slug}.html`), active: 'portfolio', b: '../',
    title: `${pr.name} — Case Study | Mary Adepoju`,
    description: `${pr.short} Case study covering the objective, challenge, creative solution, tools and deliverables.`,
    body
  });
});

/* ---------------- 5. SERVICES ---------------- */

const services = `
${pageHead({
  eyebrow: 'Services',
  title: 'Creative support, from idea to impact.',
  lede: 'Nine ways to work together, from a single advertisement to a repeatable AI video workflow.',
  crumbs: 'Services', b: ''
})}

<section class="section wash-a section--aurora" style="padding-top:clamp(2rem,4vw,3rem)">
  <div class="wrap">
    ${D.services.map(s => `<article class="service reveal" id="${attr(s.slug)}">
      <p class="service-num">${esc(s.num)}</p>
      <div>
        <h3>${esc(s.name)}</h3>
        <p>${esc(s.desc)}</p>
        <div class="service-actions">
          <a class="btn btn--ghost" href="contact.html?service=${encodeURIComponent(s.name)}">Discuss This Service ${ARROW}</a>
        </div>
      </div>
      <div class="service-side">
        <span class="section-label" style="margin-bottom:1rem">Deliverables</span>
        <ul class="ticks">${s.deliverables.map(d => `<li>${esc(d)}</li>`).join('')}</ul>
      </div>
    </article>`).join('\n')}
  </div>
</section>

<section class="section wash-c section--aurora">
  <div class="wrap">
    <span class="section-label reveal">What I make</span>
    <h2 class="section-title section-title--wide reveal">Each format, and when it is the right one.</h2>
    ${typeCards()}
  </div>
</section>

<section class="section wash-b section--aurora">
  <div class="wrap">
    <span class="section-label reveal">My creative process</span>
    <h2 class="section-title reveal">A clear path from idea to delivery.</h2>
    <div class="steps">
      ${D.process.map(s => `<div class="step reveal"><b>${esc(s.num)}</b><div><h3>${esc(s.name)}</h3><p>${esc(s.desc)}</p></div></div>`).join('\n')}
    </div>
  </div>
</section>

${ctaBand('', 'Not sure which service fits?')}
`;

page({
  file: 'services.html', active: 'services',
  title: 'Services | AI Video Production & Editing | Mary Adepoju',
  description: 'AI video advertisements, UGC videos, video editing, explainers, avatar videos, product commercials, social content, scriptwriting and AI video automation.',
  body: services
});

/* ---------------- 6. TESTIMONIALS ---------------- */

const approved = D.testimonials.filter(t => t.published);
const awaiting = D.testimonials.filter(t => !t.published);

const vt = (D.videoTestimonial && D.videoTestimonial.video) ? `
    <div class="vt reveal">
      <div class="vt__player">
        <video controls playsinline preload="none" poster="${attr(D.videoTestimonial.poster)}" src="${attr(D.videoTestimonial.video)}"></video>
      </div>
      <div class="vt__copy">
        <span class="section-label">On camera</span>
        <h3>${esc(D.videoTestimonial.caption || 'A client on working with Mary.')}</h3>
        ${D.videoTestimonial.name ? `<p class="vt__who"><b>${esc(D.videoTestimonial.name)}</b>${D.videoTestimonial.role ? `<small>${esc(D.videoTestimonial.role)}</small>` : ''}</p>` : `<p class="form-note" style="margin-top:1rem">Add the client's name in <code>videoTestimonial</code> and it appears here.</p>`}
      </div>
    </div>` : '';

const testimonials = `
${pageHead({
  eyebrow: 'Client voices',
  title: 'The people behind the projects.',
  lede: 'Feedback from the brands and businesses behind the work.',
  crumbs: 'Testimonials', b: ''
})}

<section class="section wash-b section--aurora" style="padding-top:clamp(2rem,4vw,3rem)">
  <div class="wrap">
    ${vt}
    ${approved.length ? `${facesStrip('')}<div class="grid grid-2" style="margin-top:3rem">
      ${approved.map(t => quoteCard(t, '')).join('\n')}
    </div>` : ''}

    ${awaiting.length ? `
    <div class="notice reveal" style="max-width:70ch;${approved.length ? 'margin-top:3.5rem' : ''}">
      <h3>Awaiting client approval</h3>
      <p>${approved.length ? 'Further testimonials are' : 'Testimonials are'} being collected from recent clients. Nothing appears on this page until the client has reviewed and approved the exact wording, so every quote here is theirs.</p>
    </div>
    <div class="grid grid-3" style="margin-top:2.5rem">
      ${awaiting.map(t => `<article class="card pending reveal">
        <p class="status">Pending approval</p>
        <p>A testimonial from <strong style="color:var(--fg)">${esc(t.name)}</strong> will appear here once approved.</p>
      </article>`).join('\n')}
    </div>` : ''}
  </div>
</section>

${ctaBand('', 'Ready to be the next one?')}
`;

page({
  file: 'testimonials.html', active: 'testimonials',
  title: 'Testimonials | Mary Adepoju, AI Video Creator',
  description: 'Client feedback on AI video production, creative direction, communication and delivery.',
  body: testimonials
});

/* ---------------- 7. CONTACT ---------------- */

const contact = `
${pageHead({
  eyebrow: 'Start a conversation',
  title: 'Let&rsquo;s bring your idea to life.',
  lede: 'Tell me about your product, your audience and your deadline. I will come back with the format, the approach and what it takes to deliver it.',
  crumbs: 'Contact', b: ''
})}

<section class="section" style="padding-top:clamp(2rem,4vw,3rem)">
  <div class="wrap">
    <div class="contact-grid">
      <div class="reveal">
        <span class="section-label">Project enquiry</span>
        <h2 class="section-title" style="font-size:clamp(1.6rem,3.2vw,2.3rem)">Send the details.</h2>

        <form class="form" id="enquiry-form" novalidate data-to="${attr(P.email)}">
          <div class="form-row">
            <div class="field">
              <label for="f-name">Full Name <span class="req">*</span></label>
              <input id="f-name" name="name" type="text" autocomplete="name" required>
              <p class="err" aria-live="polite"></p>
            </div>
            <div class="field">
              <label for="f-email">Email Address <span class="req">*</span></label>
              <input id="f-email" name="email" type="email" autocomplete="email" required>
              <p class="err" aria-live="polite"></p>
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label for="f-company">Company / Brand</label>
              <input id="f-company" name="company" type="text" autocomplete="organization">
              <p class="err"></p>
            </div>
            <div class="field">
              <label for="f-service">Service Required <span class="req">*</span></label>
              <select id="f-service" name="service" required>
                <option value="">Select a service</option>
                ${D.services.map(s => `<option value="${attr(s.name)}">${esc(s.name)}</option>`).join('')}
                <option value="Other">Other</option>
              </select>
              <p class="err" aria-live="polite"></p>
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label for="f-budget">Budget Range</label>
              <input id="f-budget" name="budget" type="text" placeholder="e.g. $500 &ndash; $1,500">
              <p class="err"></p>
            </div>
            <div class="field">
              <label for="f-timeline">Project Timeline</label>
              <input id="f-timeline" name="timeline" type="text" placeholder="e.g. within 3 weeks">
              <p class="err"></p>
            </div>
          </div>

          <div class="field">
            <label for="f-message">Project Description <span class="req">*</span></label>
            <textarea id="f-message" name="message" required placeholder="What are you promoting, who is it for, and what do you want the video to achieve?"></textarea>
            <p class="err" aria-live="polite"></p>
          </div>

          <div class="hp" aria-hidden="true"><label for="f-website">Leave empty</label><input id="f-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>

          <div>
            <button class="btn btn--primary" type="submit">Send Project Enquiry ${ARROW}</button>
          </div>
          <p class="form-status" id="form-status" role="status" aria-live="polite"></p>
          <p class="form-note">Your information is used only to respond to your project enquiry.</p>
        </form>

        <div class="notice reveal" style="margin-top:2.5rem">
          <h3>How this form sends</h3>
          <p>Submitting opens your own email app with the enquiry filled in, addressed to ${esc(P.email)} &mdash; so nothing is lost and no message is reported as sent unless you send it. To receive enquiries directly in a database and by automatic email instead, connect a backend such as Supabase with Resend; that needs account credentials to set up.</p>
        </div>
      </div>

      <aside class="reveal">
        <span class="section-label">Direct contact</span>
        <div class="contact-line"><span>Email</span><a href="mailto:${attr(P.email)}">${esc(P.email)}</a></div>
        <div class="contact-line"><span>WhatsApp</span><a href="${attr(P.whatsappLink)}" target="_blank" rel="noopener">${esc(P.whatsapp)}</a></div>
        <div class="contact-line"><span>Based in</span><a href="about.html">${esc(P.location)}</a></div>
        <div style="display:grid;gap:.75rem;margin-top:2rem">
          <a class="btn btn--primary btn--block" href="${attr(P.whatsappLink)}" target="_blank" rel="noopener">Message on WhatsApp ${ARROW}</a>
          <a class="btn btn--ghost btn--block" href="booking.html">Book a Discovery Call ${ARROW}</a>
        </div>
      </aside>
    </div>
  </div>
</section>

<section class="section wash-a section--aurora">
  <div class="wrap">
    <span class="section-label reveal">FAQs</span>
    <h2 class="section-title reveal">A few things worth knowing.</h2>
    <div style="margin-top:2.5rem">
      ${D.faqs.map(f => `<details class="faq reveal">
        <summary>${esc(f.q)}<span class="pm" aria-hidden="true">+</span></summary>
        <p>${esc(f.a)}</p>
      </details>`).join('\n')}
    </div>
  </div>
</section>
`;

page({
  file: 'contact.html', active: 'contact',
  title: 'Contact | Mary Adepoju, AI Video Creator & Video Editor',
  description: 'Start an AI video project — project enquiry form, WhatsApp, email and discovery call booking with Mary Adepoju.',
  body: contact
});

/* ---------------- 8. BOOKING ---------------- */

const booking = `
${pageHead({
  eyebrow: 'Discovery call',
  title: 'Book a discovery call.',
  lede: 'A short call to talk through your goals, your audience and the right video format before any production begins.',
  crumbs: 'Booking', b: ''
})}

<section class="section wash-b section--aurora" style="padding-top:clamp(2rem,4vw,3rem)">
  <div class="wrap">
    ${P.calendly
      ? `<div class="cal-wrap reveal" id="cal-wrap" data-cal="${attr(P.calendly)}">
           <iframe id="cal-frame" src="${attr(P.calendly + '?hide_gdpr_banner=1&background_color=131519&text_color=f3f0e8&primary_color=2f6bff')}" title="Book a discovery call with Mary Adepoju" style="width:100%;height:min(78vh,820px);border:0" loading="lazy"></iframe>
           <div class="cal-fallback" id="cal-fallback" hidden>
             <p class="eyebrow">Discovery call &middot; 30 minutes</p>
             <h3>The calendar opens in a new tab</h3>
             <p class="muted">This preview will not display an embedded calendar, so the live booking page opens separately. On the published site the calendar appears here in full.</p>
             <a class="btn btn--primary" href="${attr(P.calendly)}" target="_blank" rel="noopener">Choose A Time ${ARROW}</a>
           </div>
         </div>
         <div class="hero-actions reveal" style="margin-top:1.5rem">
           <a class="btn btn--ghost" href="${attr(P.calendly)}" target="_blank" rel="noopener">Open The Booking Page ${ARROW}</a>
           <a class="btn btn--ghost" href="${attr(P.whatsappLink)}" target="_blank" rel="noopener">Message On WhatsApp ${ARROW}</a>
         </div>
         <p class="form-note reveal" style="margin-top:1rem">Times are shown in your own timezone. Mary works from ${esc(P.location)} (Africa/Lagos).</p>
         <div class="grid grid-2 reveal" style="margin-top:3.5rem;align-items:start">
           <div>
             <span class="section-label">What we cover</span>
             <ul class="ticks">
               <li>Your product, audience and the message the video has to carry.</li>
               <li>The format that fits &mdash; advertisement, UGC, avatar, explainer or social.</li>
               <li>Scope, deliverables and the timeline to delivery.</li>
             </ul>
           </div>
           <div>
             <span class="section-label">Before the call</span>
             <ul class="ticks">
               <li>Bring any reference videos whose style you like.</li>
               <li>Know roughly where the video will run and how long it needs to be.</li>
               <li>A budget range helps shape a realistic scope.</li>
             </ul>
           </div>
         </div>`
      : `<div class="notice reveal" style="max-width:70ch">
           <h3>Booking link not connected yet</h3>
           <p>The Calendly scheduling page is not connected. Add the Calendly link to <code>profile.calendly</code> in <code>content/site.json</code> and the live booking calendar will be embedded here, in Africa/Lagos time. Connecting Calendly to the Google Calendar on ${esc(P.email)} &mdash; which is what prevents double bookings &mdash; is done inside Calendly with its own authorization step.</p>
         </div>
         <div class="grid grid-2 reveal" style="margin-top:3rem;align-items:start">
           <div>
             <span class="section-label">In the meantime</span>
             <h2 class="section-title" style="font-size:clamp(1.5rem,3vw,2.1rem)">Reach me directly.</h2>
             <p class="lede">Send your project details and a preferred time and we will arrange the call.</p>
             <div class="hero-actions">
               <a class="btn btn--primary" href="${attr(P.whatsappLink)}" target="_blank" rel="noopener">Message on WhatsApp ${ARROW}</a>
               <a class="btn btn--ghost" href="contact.html">Send an Enquiry ${ARROW}</a>
             </div>
           </div>
           <div>
             <span class="section-label">What we cover</span>
             <ul class="ticks">
               <li>Your product, audience and the message the video has to carry.</li>
               <li>The format that fits &mdash; advertisement, UGC, avatar, explainer or social.</li>
               <li>Scope, deliverables and the timeline to delivery.</li>
             </ul>
           </div>
         </div>`}
  </div>
</section>
`;

page({
  file: 'booking.html', active: 'contact',
  title: 'Book a Discovery Call | Mary Adepoju',
  description: 'Book a discovery call with Mary Adepoju to plan your AI video project — goals, format, scope and timeline.',
  body: booking
});

/* ---------------- sitemap + robots ---------------- */

const urls = ['index.html', 'about.html', 'portfolio.html', 'services.html', 'testimonials.html', 'contact.html', 'booking.html']
  .concat(D.projects.map(p => `work/${p.slug}.html`));
fs.writeFileSync(path.join(DIST, 'sitemap.txt'), urls.join('\n') + '\n');
fs.writeFileSync(path.join(DIST, 'robots.txt'), 'User-agent: *\nAllow: /\n');

console.log('Built ' + (urls.length) + ' pages:');
urls.forEach(u => console.log('  ' + u));
