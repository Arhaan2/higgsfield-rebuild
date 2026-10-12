# Implementation class contract

Root-owned coordination document. Frontend owns markup/components; Designer owns CSS. Use these class names exactly and semantic HTML. Root layout imports app/globals.css. Both workers may read each other's files but only edit assigned paths.

- `app-shell`: overall app; `side-nav` with `brand`, `nav-link` (`aria-current=page`), `nav-label`, `nav-footer`; `main-content` contains `page-header` (`eyebrow`, `page-title`, `page-subtitle`, `header-actions`). `skip-link` targets main.
- `badge`, variants `badge-sample`, `badge-live`, `badge-muted`; `button`, variants `button-primary`, `button-secondary`, `button-ghost`, `button-icon`; `text-muted`, `text-small`, `error-text`, `empty-state`, `notice` with `notice-error`, `notice-warning`, `notice-success`. Native disabled/aria-disabled and focus-visible states.
- Explore: `explore-hero` has `hero-copy` (`hero-title`, `hero-description`, `hero-actions`) and `hero-media` with actual image plus `hero-caption`; `section-header`; `preset-grid`; `preset-card` contains `preset-preview`, `preset-body`, `preset-index`, `preset-title`, `preset-description`, `preset-action`. Three presets, no decorative filters.
- Studio: `studio-grid` contains `composer` and `stage-column`; `composer-header`, `shot-title-input`; `mode-switch` native radio labels; `field-group`, `field-label`, `field-help`, `text-input`, `prompt-input`, `model-facts`; `upload-zone`/`reference-preview`/`reference-info`/`reference-actions`; `composer-actions`, `save-status`.
- Output: `output-stage`, `stage-header`, `stage-title`, `media-well` (contained actual image/video; hero/preset previews may crop), `media-caption`, `output-actions`, `job-notice`; `version-section`, `version-strip`, `version-card` (`aria-pressed=true` selected), `version-thumbnail`, `version-caption`, `version-meta`.
- Library: `library-grid`, `shot-card`, `shot-card-preview`, `shot-card-body`, `shot-card-title`, `shot-card-meta`; prepared collection remains separate.
- Details: native `dialog.asset-dialog`, `dialog-header`, `dialog-close`, `dialog-body`, `detail-list`, `detail-prompt`, `dialog-actions`; native ::backdrop. Frontend must implement focus return/Escape/modal semantics.

Frontend may combine these primitives, use `data-*` attributes or child semantic selectors. New CSS needs are returned to root; do not add inline visual styling or invent another stylesheet. Inline dynamic dimensions for actual media are acceptable. Designer may supply unused primitive rules, but must never describe unrendered checks as completed.

Routes: `/` Explore, `/studio` (new), `/studio?sample=dune-study`, `/studio?project=<uuid>`, `/studio?preset=<slug>`, `/library`. Query values are client-read and validated. Navigation preserves/saves dirty drafts; failures keep the buffer and explanation. No third-party browser control by workers; root owns preview and screenshots. The first scaffold is temporary and may be replaced within assigned ownership.
