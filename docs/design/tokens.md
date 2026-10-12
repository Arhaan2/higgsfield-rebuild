# Studio tokens

Task `p2-design-001` · 2026-10-12 UTC. Implement with CSS variables; values are a specification, not installed application styles. Companion behavior and layout: [direction.md](direction.md). Apple skill locator: `/Users/arhaan/.codex/skills/apple-design/SKILL.md` (§§1, 7, 12, 14–16).

## Color

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#101112` | Application canvas |
| `--surface` | `#17191B` | Rail, card footer, structural panel |
| `--surface-raised` | `#202224` | Inputs, dialog, selected nav |
| `--surface-hover` | `#2B2D2E` | Hover/pressed secondary controls |
| `--media-bg` | `#08090A` | Letterboxing; never overpaint actual media |
| `--text` | `#F3EFE6` | Warm ivory primary copy |
| `--text-secondary` | `#A6A7A2` | Help, metadata, timestamps |
| `--accent` | `#D5AD76` | One principal action per working region, selected version marker |
| `--accent-hover` | `#E3BC87` | Primary hover |
| `--accent-pressed` | `#BF955F` | Primary press |
| `--on-accent` | `#111213` | Primary button text/icon |
| `--border` | `#343739` | Decorative panel separators only |
| `--control-border` | `#757774` | Essential input bounds and secondary button outlines |
| `--success` | `#91BA9B` | Completion icon/text, paired with words |
| `--warning` | `#D5AD76` | Uncertain/limited icon/text, paired with words |
| `--danger` | `#E5A29A` | Error icon/text, paired with words |
| `--focus` | `#F3EFE6` | 2px focus outline, 3px offset |
| `--scrim` | `rgb(0 0 0 / 60%)` | Modal background only |

Badges have solid `--surface-raised` backgrounds, 1px control border, 8px radius, 4px vertical/8px horizontal padding. Sample badge: ivory; Live: success; unknown: warning; failure: danger. Text carries the meaning. Do not lower the opacity of a whole disabled control: retain legible secondary text, show a muted surface and explicit adjacent reason. Normal text target ≥4.5:1; necessary nontext boundaries ≥3:1. Decorative separators alone never define an input.

Arithmetic checks performed for the proposed solid colors (relative sRGB luminance): primary on canvas **16.47:1**; secondary on raised **6.59:1**; accent on surface **8.45:1**; button ink on accent **8.99:1**; essential boundary on raised **3.53:1**; success on raised **7.37:1**; danger on raised **7.57:1**. These calculations do not verify rendered overlays, browser focus behavior or the application's accessibility.

## Typography

Font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. Root `font-size:100%`; `font-optical-sizing:auto`; do not load external fonts. UI numerals use `font-variant-numeric:tabular-nums`. Sentence case everywhere except the brief wordmark and frame index. Avoid extra-light weights.

| Role | Size / line-height at 16px root | Weight | Tracking |
| --- | --- | --- | --- |
| Explore display | `clamp(2rem, 3.2vw, 3rem)` / `1.08` | 600 | `-0.035em` |
| Page title | `1.5rem` (24px) / `2rem` (32px) | 600 | `-0.02em` |
| Section / dialog title | `1.125rem` (18px) / `1.5rem` (24px) | 600 | `-0.01em` |
| Body / form input | `1rem` (16px) / `1.5rem` (24px) | 400 | `0` |
| Button / field label | `0.875rem` (14px) / `1.25rem` (20px) | 600 | `0` |
| Help / metadata | `0.8125rem` (13px) / `1.25rem` (20px) | 400 | `0.01em` |
| Nav / frame index | `0.75rem` (12px) / `1rem` (16px) | 600 | `0.025em` |

Body copy maximum 65ch; prompt fields span the rail. Textarea remains 16px on phones. Long titles wrap to two lines in cards, with full text in detail; filenames may wrap anywhere. Never truncate an error, primary action, source role or status explanation. Large text may increase control and row height.

## Space, geometry and layers

Spacing scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`px = `.25, .5, .75, 1, 1.25, 1.5, 2, 2.5, 3, 4`rem. Label→input 8; input→help 8; field groups 24; page sections 32; dense icon/text gap 8. Use the layout widths/breakpoints in direction.md as the single composition source.

| Element | Exact specification |
| --- | --- |
| Buttons / single-line input | Minimum height 44px (`2.75rem`); 12px horizontal padding; 10px radius; icons 18px with 8px gap |
| Main generation CTA | Full rail width; minimum height 48px; 12px radius; no gradient/shadow glow |
| Textarea | Minimum height 160px; 12px padding; 12px radius; vertical resize allowed |
| Upload empty surface | Minimum height 144px; 16px padding; 1px control border; 12px radius |
| Selected reference | Thumbnail 80×60, contained; text flexes; remove target 44×44 |
| Explore / Library card | 14px outer radius; 1px decorative border; footer padding 16; media hard-clipped to outer top corners |
| Stage media well | 16px radius; no image drop shadow; inset background `--media-bg` |
| Version tile | Width 160px; gap 12px; 10px radius; 8px padding; selected 2px accent border, reserve border width in every state |
| Dialog | Width `min(440px,100vw)`; 24px padding (16 on phone); 20px leading corners on desktop; square full-screen edges on phone |
| Iconography | 20px navigation, 18px controls; consistent 1.75px stroke; labels accompany unfamiliar icons |

Layers: base 0, sticky header 10, bottom nav 20, popover 30, modal scrim/dialog 40/41, live toast 50. Toasts contain supplementary status only. Dialog shadow `0 24px 80px rgb(0 0 0 / 40%)`; compact popover `0 8px 24px rgb(0 0 0 / 28%)`. No shadow on every card.

Structural rail/cards remain opaque. Only the sticky header/bottom nav may use `rgb(23 25 27 / 94%)` plus `backdrop-filter:blur(16px)` when content actually scrolls beneath; use ivory text at weight 600. Sample labels and status chips always have an opaque backing. Avoid stacked translucent layers. Unsupported blur falls back to solid surface. A subtle 16px scroll-edge fade may separate overlapping chrome; do not put gradients across the media itself.

## Feedback and motion

Press changes background immediately; optional button scale `.98` settles over 100ms. Commit on activation, never pointer-down. Hover colors transition 120ms ease-out. Selection outline and status text update immediately. Media loads reserve aspect ratio; no shimmering skeleton, artificial waiting or celebratory confetti. Use an activity icon only for actual pending work.

Asset detail enters/exits from the right, same path, at most 16px translation plus opacity over 180ms. Because it is not draggable, a reversible CSS transition is sufficient; no input lock while moving. If root later adds a draggable sheet, follow the skill's presentation-value/velocity-aware spring requirements (critical damping 1.0, response .3–.4), with a keyboard alternative; this is outside current scope. Avoid animating layout dimensions or blur. Keep `will-change` temporary, not on all cards. Selection never causes a large animated page rearrangement.

| Preference | Required override |
| --- | --- |
| `prefers-reduced-motion:reduce` | No scale/slide/spin/smooth scroll; instant geometry, optional opacity transition ≤100ms. Static activity glyph plus truthful text. Native playback remains user-triggered. |
| `prefers-reduced-transparency:reduce` | Header/nav/dialog fully opaque `--surface`; no backdrop-filter or translucent edge masks. |
| `prefers-contrast:more` | Opaque surfaces; all necessary borders use `#A6A7A2`; focus width 3px; preserve labels/icons and avoid transparency. |
| `forced-colors:active` | Use system Canvas/CanvasText/ButtonFace/ButtonText/Highlight; retain native outlines, add selected text/check marker. Allow forced-color adjustment for controls; keep actual media visible. |

Apply these preferences independently and in combination. Browser/keyboard/screenshot verification remains pending implementation; do not infer it from this token document.
