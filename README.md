# Mary Adepoju — portfolio website

A static multi-page site. Every page is a real HTML file with its own URL, so
browser back/forward, direct links and search-engine indexing all work without
JavaScript routing.

## Editing content

Everything the site says lives in **`content/site.json`** — profile, projects,
case studies, services, experience, skills, tools, industries, testimonials and
FAQs. Nothing is hard-coded into the pages.

After any edit:

```bash
node build/build.js
```

That regenerates every page in `dist/`.

## Adding a project (and its case study)

Add an object to the `projects` array in `content/site.json`. Its case study
page is generated automatically from the same template as the others — you
never write a case study page by hand. Add ten projects and you get ten case
study pages on the next build.

Each project needs: `slug`, `name`, `client`, `category`, `tags`, `short`,
`objective`, `description`, `challenge`, `solution`, `deliverables`, `tools`,
`process`, `results`.

- `tags` controls which portfolio filters the project appears under.
- `slug` becomes the URL: `work/<slug>.html`.
- `results` should stay `[]` until there are real, verified figures. While it
  is empty the case study says results are pending rather than inventing any.
  When you have them: `[{"label":"Views","value":"120,000"}]`.

## Files

```
content/site.json      all site content
build/build.js         the generator
dist/                  the built site — this is what you host
  index.html           home
  about.html           about
  portfolio.html       project gallery with filters
  services.html        nine services
  testimonials.html    testimonials
  contact.html         enquiry form + FAQs
  booking.html         discovery call
  work/*.html          one case study per project
  assets/              css, js, headshot
```

## Hosting

`dist/` is plain static files. Drop the folder on Netlify, Vercel, Cloudflare
Pages, GitHub Pages or any normal web host. No build step on the server, no
dependencies.

## The new sections

**Showreel** — `showreel` in `site.json`. Set `embed` to a YouTube or Vimeo
embed URL, or `file` to a video you put in `dist/assets/`. Until one is set the
homepage shows a cinematic placeholder frame.

**Transformation proof** — `transformations` in `site.json`. Each entry:

```json
{ "client": "Brand name", "title": "Views per post",
  "before": "1,200", "after": "48,000",
  "beforeNote": "optional context", "afterNote": "optional context",
  "source": "where the figure comes from" }
```

The array is empty on purpose. Nothing is shown as a result until the figure is
real, and the `source` field exists so every number on the page can be traced.

**Social links** — `social` in `site.json`. Fill in a `url` and that platform
appears in the footer; leave it blank and it stays hidden, so there are never
dead links.

**Chat assistant** — `assets/js/chat.js`. It answers from the services and FAQs
already in `site.json`, so adding an FAQ teaches it a new answer. Anything it
does not recognise hands off to WhatsApp, email or the booking page. It runs
entirely in the visitor's browser: no external service, no data collected.

**Booking** — `profile.calendly` is live. Connecting Calendly to the Google
Calendar on the account, so it blocks double bookings, is done inside Calendly
with its own authorization step.

**Video types** — `videoTypes` in `site.json`. Each entry has `name`, `what`
it is, `use` (when it is the right choice), `includes` (three deliverables) and
`tint` (`a` to `h`, which picks the gradient on the card). They appear on the
home, services and about pages from the one list.

**Tool notes** — each tool in `tools` is now `{ "name": ..., "note": ... }`.
The note is the one-line explanation of what that tool is used for.

**Certifications** — `certifications` in `site.json`, shown on the About page:

```json
{ "name": "Course or credential name", "issuer": "Who issued it",
  "year": "2025", "note": "optional one line", "url": "link to the certificate" }
```

Empty by design. Nothing is listed as a credential until it has been earned.

**Client photos** — `photo` on each testimonial, pointing at
`assets/img/people/<name>.jpg`. Leave it blank and the card simply shows the
name with no avatar.

## Colour system

Sections alternate between dark and light. A section gets `panel--dark` or
`panel--light`, optionally with `wash-a` / `wash-b` / `wash-c` for a tinted
gradient. The light panel works by re-pointing the theme tokens
(`--fg`, `--muted`, `--line`, `--charcoal`, `--obsidian`), so every component
inside it picks up the right colours automatically — there are no light-mode
copies of any component.

## Still to connect (needs your files)

- **Resume PDF** — drop the file at `dist/assets/mary-adepoju-resume.pdf` and
  set `profile.resume` to `assets/mary-adepoju-resume.pdf`. Until then the
  buttons point at the copy hosted on the old Lovable site.
- **Form backend** — the enquiry form currently opens the visitor's email app
  with everything filled in, and only reports success once that has happened.
  To store enquiries in a database and get an automatic email instead, connect
  Supabase + Resend; both need account credentials.
- **Admin dashboard** — a real one needs a server, a database and
  authentication, which a static site cannot provide on its own. Editing
  `content/site.json` plus one build command covers the same ground for now.

## Running it locally

```bash
node build/build.js          # regenerates every page in dist/
cd dist && python3 -m http.server 8000
```

No dependencies, no build toolchain — plain Node and a static server.

## What is not in this repository

**Video files.** `dist/assets/video/*.mp4` is gitignored: 221 MB across 85
files, and git would store a complete extra copy on every re-encode. Poster
frames (`.jpg`) *are* tracked, so the layout builds correctly from a clean
clone — the `<video>` elements simply have nothing to play until the masters
are restored. They are served from the published site.

**Internal QA notes.** `content/review-notes.local.json` is gitignored. It
holds working notes on individual pieces (third-party watermarks, claims that
need client sign-off, branding that needs checking). Nothing in it is rendered
to any page; `build/build.js` merges it only when the file is present, so a
clone without it produces an identical site.

## A note on the performance figures

Every project carries a `results` array and a `resultsIllustrative: true` flag.
That flag is what prints the "Illustrative" notice above the numbers on each
case study, stating that the figures show the scale of change this kind of
creative is built to produce rather than measured results from that project.

**These fields are deliberately tracked in git.** Removing them would not hide
anything — the notice is printed in plain English on every live case study —
but a rebuild would silently drop the disclaimer and present invented numbers
as real client outcomes.

When a client supplies verified figures, replace that project's `results` array
and delete its `resultsIllustrative` flag. The notice disappears from that page
alone and the numbers stand as measured results. Projects can be converted one
at a time.
