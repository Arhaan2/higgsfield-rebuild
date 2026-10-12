# Actual public browser acceptance

Root exercised https://higgsfield-rebuild.arhaan2.workers.dev after its October12 18:51UTC publication, using the Codex in-app browser through CUA. Exact deployed source f271258 / Worker cbe42062-203d-462c-949e-0d4bd380beac. No browser API injection, mocked state or provider call. [Machine-readable observations](deployed-browser.json) include identifiers, dimensions, download hashes and screenshot timestamps.

| Path | Observed result |
| --- | --- |
| Anonymous entry → sample | Integrated Explore and Studio load. Sample photograph/clip are labeled prepared, independently attributed and explicitly not generated from the draft. |
| Sample playback | Selected Dune flight; native player decoded1920×1080, readyState4, duration14.996667. Play button yielded pausedfalse/currentTime0.050283; later currentTime14.996667/endedtrue. It actually played to completion. |
| Sample download | Ordinary Download sample click completed through browser download event. Downloaded MP4 hash equals repository file,11,342,355bytes. This supersedes the old shell's earlier ordinary-click timeout, without altering that report. |
| New reference | New shot title `Public walkthrough — Dune study`; entered movement, uploaded the licensed dune-light.jpg through actual file chooser. UI showed pending upload/save, then persisted project URL, decoded1600px private image and Draft saved. No pending state was called complete. |
| Preferred version/reload | Explicit Make preferred version → Saving preference → Preferred version plus named confirmation. Reload restored title,83-character movement, image and Preferred version. |
| Library reopening/save | Library showed private shot with0generatedversions and decoded private thumbnail; reopened same project. Edited movement to94characters, clicked Save draft and reloaded; exact text/reference/preference persisted. |
| Private download | Ordinary Download image click completed.187,464-byte JPEG hash equals repository upload. Root HTTP and independent reviewer separately test ownership/bytes. |
| Preset-only preview | Opened observed slow-reveal preset URL; autosaved A slow reveal. Library displayed decoded sample-dune-light thumbnail and0generatedversions without a retained generated result. Reopening restored prepared start frame and166-character movement prompt. |
| Details/keyboard | View details labeled uploaded reference, original retained, no original prompt/model recorded. Escape dismissed and returned focus to View details, with visible focus ring. This is bounded keyboard evidence. |
| Layout | Actual1440px Studio and390px Studio/Library measured document scroll width equal viewport width. Saved mobile/full-page screenshots show all controls in the document. No native preference or physical-phone claim. |
| Runtime | Final captured console warning/error list empty. No inference of exhaustive runtime correctness. |

Final saved movement: `A slow counterclockwise drift above the dunes, preserving the warm light and natural contours.`

Screenshots: [desktop detail region](deployed-studio-desktop.jpg), [mobile Studio full page](deployed-studio-mobile.jpg), [mobile Library full page](deployed-library-mobile.jpg). Desktop screenshot is a1440×1000 scrolled viewport showing preference, focus and disabled generation; it does not contain the entire page title. The screenshot files contain actual JPEG bytes and are not edited. Mobile views are390px wide.

The public Explore tab was retained for recording, and temporary viewport overrides reset. The complete zero-spend recording sequence is prepared in ../WALKTHROUGH-SCRIPT.md; the user must still record with visible camera and supply an accessible URL. Guest test state is private to the browser that created it. HTTP review's disposable guests are separate from this browser.

No real generated job exists. The old selected-job→new-reference regression remains independently accepted controlled-test evidence; it was not fabricated as a live reproduction. All actual generation/provider acceptance remains pending under$0. Samples and uploaded references do not satisfy that gate.
