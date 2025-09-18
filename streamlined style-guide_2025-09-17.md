# Coding Guideline

Streamlined Coding Guidelines is a concise, 120-point checklist that distills modern best practices for HTML, CSS, vanilla JavaScript, and PHP 8.2+. It focuses on clean semantics, accessibility, SEO, performance, and fully responsive layouts—all optimized for projects deployed via simple FTP on shared hosting, with zero build tools required. Use it as a quick-reference to write lightweight, maintainable code that works smoothly across devices and screen readers while keeping load times fast and security risks low.


## HTML

1. Use semantic landmarks: `header`, `nav`, `main`, `aside`, `footer`.
2. Introduce `section` only for thematic blocks that merit their own heading; skip for mere wrappers.
3. Use `article` for self-contained entries (blog post, news card, product card).
4. Nest a `header` inside each `section`/`article` for titles/meta; nest a `footer` for actions/credits.
5. Keep a single visible `h1` per page (or per isolated `main`), then descend (`h2`…`h6`) in order.
6. Wrap repeated cards in a semantic list (`ul`/`ol`) and place each card inside an `li`.
7. Employ `figure` + `figcaption` when media needs a caption; otherwise plain `img`.
8. Write meaningful `alt` text; use `alt=""` for decorative images.
9. Mark purely decorative SVG/icons `aria-hidden="true"` `focusable="false"`.
10. Declare `lang` on `<html>` and switch `dir="rtl"`/`ltr` on mixed-direction elements.
11. Reserve media space (`width`/`height` or CSS `aspect-ratio`) to prevent CLS.
12. Add `<meta name="viewport" content="width=device-width, initial-scale=1">` for responsive scaling.
13. Prefer descriptive, human-readable link text; avoid “click here.”
14. Append `rel="noopener"` to every external `target="_blank"` link for security & performance.
15. Label every form control with an explicit `<label>`; group related inputs with `fieldset`/`legend`.
16. Use native form validation (`required`, `type="email"`, `pattern`); always re-validate server-side.
17. Associate errors/help text via `aria-describedby`; keep inline hints concise.
18. Provide a skip link (`<a href="#main">Skip to main content</a>`) for keyboard users.
19. Ensure all interactive elements are keyboard-focusable and keep visible focus styles.
20. Use landmark roles or IDs to enable quick screen-reader navigation.
21. Implement responsive images (`srcset`/`sizes` or `picture`); choose efficient formats (AVIF/WebP) with fallbacks.
22. Lazy-load off-screen images (`loading="lazy"`, `decoding="async"`).
23. Inline ≤ 14 KB of critical CSS in `<head>`; defer additional stylesheets.
24. Defer or `async` non-critical scripts; load JS modules with `type="module" defer`.
25. Embed JSON-LD structured data (`Article`, `BreadcrumbList`, `Product`) for richer SEO.
26. Validate markup with the W3C validator; fix duplicate IDs, nesting errors, empty headings.
27. Keep DOM order identical to visual order; avoid CSS re-ordering that breaks screen-reader flow.
28. Minify HTML before upload to reduce transfer size; retain readable source via local copies.
29. Use canonical URLs and `<meta name="description">` on all indexable pages.
30. Test pages with keyboard, screen reader, high-contrast, RTL, dark-mode, and forced-colors scenarios.

---

## CSS

1. Author mobile-first; enhance with min-width or container queries.
2. Build layouts with CSS Grid (`auto-fit/auto-fill minmax()`) or Flexbox for natural column wrap.
3. Store design tokens in CSS custom properties for colors, spacing, radii, fonts, motion.
4. Follow a low-specificity strategy (BEM, utilities, or CSS Layers) to avoid conflicts.
5. Use logical properties (`margin-inline`, `padding-block`, `inset`) for automatic RTL support.
6. Scale text & gaps with `rem`, `%`, `clamp()`; reserve px for hairlines or precise media.
7. Meet WCAG 2.2 AA contrast; auto-switch palettes with `prefers-color-scheme`.
8. Respect `prefers-reduced-motion`; limit non-essential animations to ≤ 250 ms.
9. Preload fonts and use `font-display: swap`; define robust fallback stacks.
10. Reserve media space via `aspect-ratio`; control cropping with `object-fit/position`.
11. Apply container queries to fine-tune columns, density, and typography per component width.
12. Prefer `gap` over margins for Grid/Flex spacing to simplify logical flow.
13. Avoid heavy shadows, blurs, and oversized radii that hinder paint performance.
14. Add `content-visibility: auto` (plus `contain-intrinsic-size`) to defer off-screen rendering.
15. Reuse spacing utility classes; purge unused CSS before deployment.
16. Minify, concatenate, and Brotli/Gzip CSS before FTP upload.
17. Keep focus styles obvious via `:focus-visible`; replicate hover states for keyboard users.
18. Centralize motion curves & durations in custom properties for consistency.
19. Use `scroll-snap-type` & `overscroll-behavior` for carousels/scroll areas without JS.
20. Provide `@media print` styles for articles, invoices, or receipts.
21. Let content define height; avoid fixed heights except for known-ratio media.
22. Limit `@font-face` variants; prefer variable fonts or system fonts when performance-critical.
23. Inline above-the-fold CSS when size ≤ 14 KB; defer the rest to speed first paint.
24. Test layouts from 320 px phones up to 4K desktops, in portrait & landscape.
25. Check forced-colors/high-contrast mode: ensure no vital info is color-only.
26. Use modern color spaces (`oklch()`, `lab()`) with progressive enhancement fallbacks.
27. Apply `box-sizing: border-box` universally for predictable sizing.
28. Document design tokens and component variants in a style-guide Markdown/HTML page.
29. Monitor LCP/CLS/INP with Lighthouse or Web Vitals bookmarklet; tweak spacing & fonts as needed.
30. Keep CSS modular—one file per component/feature if practical—to ease maintenance over FTP.

---

## JS

1. Design with progressive enhancement: core content must function without JS.
2. Load ES modules with `type="module" defer`; skip bundlers—serve original files.
3. Chunk features into small modules; lazy-load via dynamic `import()` when first used.
4. Prefer native APIs (`fetch`, `FormData`, `IntersectionObserver`, `ResizeObserver`).
5. Handle async logic with `async/await`; centralize error handling; inform users via ARIA live regions.
6. Throttle/debounce high-frequency events; use `requestAnimationFrame` for visual DOM writes.
7. Offload heavy work (e.g., image processing) to Web Workers to keep main thread responsive.
8. Delegate events on list/grid containers instead of per-item listeners.
9. Sanitize any injected HTML (e.g., DOMPurify via CDN) to prevent XSS.
10. Keep ARIA state (`aria-expanded`, `aria-busy`, `aria-selected`) synchronized with component state.
11. Cache GET requests in memory or `localStorage`; invalidate with timestamps/ETags.
12. Add a lightweight Service Worker (if allowed) for offline asset caching & quick reloads.
13. Strip dev logs before production upload (simple grep/sed script or manual).
14. Use Subresource Integrity (`integrity`) and `crossorigin="anonymous"` on CDN assets.
15. Encapsulate logic in modules/IIFEs to prevent global namespace pollution.
16. Include only essential polyfills (e.g., fetch for Safari < 14); drop legacy IE entirely.
17. Offer concise keyboard shortcuts for power users; advertise via tooltip or `kbd` element.
18. Respect `prefers-reduced-motion`; disable heavy animations when enabled.
19. Use Custom Events for decoupled component communication.
20. Track JS performance with `PerformanceObserver` & `LongTask` APIs; eliminate long tasks.
21. Document code contracts with JSDoc; run ESLint + Prettier locally before upload.
22. Clean up listeners, observers, and timers on component teardown to prevent leaks.
23. Implement fetch timeouts & `AbortController`; retry idempotent requests sensibly.
24. Show skeleton loaders that mirror final layout to minimize perceived CLS.
25. Provide graceful fallbacks for Clipboard, Share, and other progressive APIs.
26. Anonymize analytics; respect Do-Not-Track; avoid invasive tracking.
27. Keep dependency count minimal—prefer vanilla or single-file CDN libs (e.g., Alpine, HTMX) when necessary.
28. Version scripts via file names (`app.v1.2.3.js`) to force cache refreshes after FTP upload.
29. Test components with mouse, touch, keyboard, screen reader, RTL, dark mode, reduced-motion.
30. Comment public APIs and complex logic inline; maintain a small MD doc for each module.

---

## PHP

1. Add `declare(strict_types=1);` at the top of every PHP file.
2. Validate & sanitize all input (`filter_var`, custom filters); never trust `$_GET/$_POST` raw.
3. Use PDO with prepared statements; avoid query concatenation.
4. Escape output contextually (`htmlspecialchars`, `json_encode`) to prevent XSS.
5. Hash passwords with `password_hash` (Argon2id) & verify with `password_verify`.
6. Generate per-form CSRF tokens stored in `$_SESSION` and validate on POST.
7. Keep secrets (DB creds, API keys) outside webroot in `.env`; load with a tiny dotenv reader.
8. Disable `display_errors` in production; log errors via `error_log` or Monolog.
9. Follow PSR-12; autoload with Composer (commit `vendor/` if Composer unavailable on server).
10. Use a templating layer that auto-escapes (Twig, Plates) or strict PHP includes with escaping.
11. Enable OPcache in `php.ini`; configure a conservative `revalidate_freq` for FTP deployments.
12. Cache expensive queries (APCu, small file cache) with sensible TTLs.
13. Validate uploads (MIME, size); store outside publicly accessible directories; randomize filenames.
14. Secure session cookies (`Secure`, `HttpOnly`, `SameSite=Lax`); regenerate ID on privilege changes.
15. Send security headers (`Content-Security-Policy`, `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`).
16. Force HTTPS with a small redirect script if `.htaccess` editing is not allowed.
17. Limit `memory_limit`, `upload_max_filesize`, `post_max_size`, `max_execution_time` to tame resource spikes.
18. Use immutable `DateTimeImmutable`; set default timezone explicitly (`date_default_timezone_set`).
19. Avoid dynamic `include/require`; rely on Composer autoload and namespaced classes.
20. Provide friendly, themed 404 & 500 error pages; handle exceptions centrally; hide stack traces.
21. Write unit tests with PHPUnit locally; run PHPStan/Psalm for static analysis.
22. Keep Composer dependencies updated; audit with `composer audit` or `symfony/security-checker`.
23. Profile code with Xdebug or Blackfire locally; refactor N+1 queries; add DB indexes.
24. Paginate large queries; never load thousands of rows into memory.
25. Use parameterized LIMIT/OFFSET or cursor-based pagination to prevent injection.
26. Generate slugs and IDs with built-in random bytes or UUID v7 libraries—never `rand()`.
27. Prefer typed properties, promoted constructor args, readonly properties, and `enum`s in PHP 8.2+.
28. Use attributes (e.g., for routing or ORM mapping) rather than docblock annotations when feasible.
29. Employ strict comparison (`===`, `!==`) and union/intersection types to catch bugs early.
30. Document codebase setup and coding standards in a `README.md` for future contributors.