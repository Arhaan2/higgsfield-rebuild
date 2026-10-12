# Final sprint integrated local acceptance

Root verified the integrated working source on 2026-10-12, before release commit, using Node24.18.0 and http://127.0.0.1:5173. Existing D1/local R2 were reused without migration. Local capabilities returned enabled=false, budgetLimitMicroUsd=0, remainingMicroUsd=0 before test saves. No provider request.

## Fresh controlled checks

TypeScript (`npx tsc --noEmit`) exits0. Fresh production build exits0; framework static-analysis route-classification notices remain informational. All180 controlled checks pass:36 server,58 Studio,31 Library,29 reference actions,26 shot-brief. The linked final-sprint-*.txt outputs are this run, not prior acceptance. Eleven capture unit checks also pass. Controlled checks cover pending-save isolation, exact whitespace/fence preservation, reference versus inspection, source labels, private-link omission, query nonmutation/request counts, pagination/failure/expiry/stale-response boundaries. These are not real-provider or browser failure-injection evidence.

## Actual browser observations

Chrome ordinary Export click created shot-brief-sprint-dunes.md even though the download-event helper timed out. The file was read and exact100-character prompt (Unicode, leading/trailing spaces, multiline text, triple backticks) was verified. The browser retained its original /studio URL and unsaved state. Chrome extension upload was unavailable without file-URL access; no extension permission changed. Upload acceptance continued with the in-app browser's supported chooser.

Three genuine disposable local shots were saved: Local Dune motion (7338c815-521d-4e0b-b5a6-0ba1b0da8700), Amber architecture (621006be-57c7-46ac-8b38-ac253e5a10f0), Zebra coastline (ced56a8b-4d9c-48cb-a79c-49a847ca8dba). Five earlier local test shots were preserved.

| Check | Actual result |
| --- | --- |
| Upload/save/reload/preference | Licensed dune-light.jpg uploaded through real chooser; project/save acknowledged. Explicit preferred selection acknowledged; reload and Library reopening retained title,60-character prompt, start-frame image and Preferred version. |
| Downloads | Ordinary IAB saved-motion, saved-image and unsaved-upload exports completed. Actual files opened/read; source/settings/save state correct, no private links. Image download is byte-identical to187464-byte upload. See final-sprint-local-downloads.json and four copied unmodified Markdown artifacts. |
| Search | LOCAL DUNE / AMBER DUNES found Local Dune motion; amber architecture / CAFÉ LIGHT found Amber architecture; Zebra coastline / STRIPED CLIFFS found Zebra coastline. Title and saved-prompt matches were case insensitive. |
| Composition/no matches | café + Image drafts + Title A–Z gave1of8; Motion drafts gave0of8 and No matching shots. Sample collection remained visible and distinct. |
| Reset/keyboard | Enter on Reset search and filters restored all8 with Recently updated and focus on library-search. Tab from search focused library-filter. Enter on header View reference focused selected-output. |
| Ordering | Initial recent order Zebra, Amber, Local Dune; after editing/saving Local Dune, it moved first. Title sort gave A slow reveal×2, Amber, Dune study, Local Dune, Phase3, Untitled, Zebra. |
| Layout | Actual390px Studio and Library both measured document scrollWidth390; desktop Studio1440 measured1440. New toolbar controls stack, labels and focus remain readable. Screenshots preserve actual views; native screen-reader/preference/physical-device behavior not claimed. |
| Action hierarchy | With generation off and an unsaved edit, Save draft had button-primary and was enabled; disabled Generate and its explanation remained. Export was secondary; header jump used View reference. |

Screenshots: final-sprint-local-library-390.jpg, final-sprint-local-studio-390.jpg, final-sprint-local-studio-desktop.jpg. Saved motion/image and unsaved text checks do not create or accept a generated output. Public deployment/new-feature verification is still required. Genuine pending-save browser timing, failure injection,200% zoom and native accessibility preferences were not rerun; targeted controlled checks cover the changed asynchronous logic.
