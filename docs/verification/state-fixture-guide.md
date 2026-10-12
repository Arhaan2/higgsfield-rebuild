# Isolated Studio visual states

Task `p5-isolated-states-001`, Phase 5. This is a local inspection harness, not an application route or evidence of live generation. Provider spend: $0. V3/P4 real generation remains unverified.

From the repository root, using the existing installed toolchain:

```sh
node node_modules/vite/bin/vite.js --config tests/visual/vite.config.ts --configLoader runner
```

Open `http://127.0.0.1:5174/?state=empty_draft`. The server binds only `127.0.0.1:5174` and fails if the port is occupied; it does not switch ports or touch the app on 5173. Stop with Ctrl-C. HMR is disabled; refresh after source edits. No environment setup, provider credentials, dependency installs, or root configuration changes are required. Do not publish the harness or its bundle.

The selector changes the `state` query and remounts the authentic `StudioView`. Copy the URL to reproduce a state. Product rendering comes directly from `StudioView`, `AppShell`, `AssetMedia`, and `AssetDetails`; `app/globals.css` includes the actual `styles/studio.css`. No production component is copied or changed.

Coordinator extension: the labeled200%text checkbox sets the root font size to200% only in this harness. It tests scalable layout; it is not native browser zoom or an OS accessibility-preference test. The current sourceJobs interface is supplied as an empty supplemental list unless a specific provenance fixture is added.

| `state` | Fixture data / inspection target |
| --- | --- |
| `empty_draft` | Empty prompt and reference; initial stage and disabled generation |
| `uploaded_reference` | Upload source branch using disclosed prepared still pixels |
| `validation_error` | 2,501-character draft, inline count/invalid state, save error |
| `submitting` | Submitting primary-action text and submitting job notice |
| `queued` | Queued job notice and version card |
| `running` | Running job notice and version card |
| `submission_unknown` | Unconfirmed job with contact-owner recovery; no replacement request |
| `pending_acknowledgement` | Pending submission identity and “Check original request” notice |
| `succeeded` | Success branch, selected fixture video, immutable prompt and details |
| `failed` | Failed job, check-status and review-prompt buttons |
| `transfer_failed` | Transfer warning and retry-transfer button |
| `budget_exhausted` | Zero remaining allowance, explicit budget reason and disabled generation |
| `restored_iteration` | Fixture unsaved restoration notice, parent-linked next draft, prior result |

Select job/version cards to inspect their production rendering. View details opens the actual native dialog, including a local reference lookup. Closing it, choosing a parent/reference, and playing the committed sample are local inspection interactions. Save, upload, prompt edits, task changes, reuse, retries, status checks, and generation do not modify fixture data or imply success: callbacks report that the action was ignored. Select a scenario to change state. Downloads, non-fragment links, file pickers, and form submission are blocked. Fragment links remain available for focus/scroll inspection. No reload restoration, server save, generation, upload, download, or provider retry is tested by this harness.

## Isolation and provenance

- Harness-only Vite aliases replace `@/src/client/use-studio` and `@/src/client/api`. The second alias is necessary because production `AssetDetails` directly calls `api.asset`. It returns only known fixture assets and rejects unknown IDs. Return types are checked against the real hook/API contracts using erased type imports.
- A Vite load guard rejects production hook, API, recovery, and server modules in the executable module graph. No storage/recovery code is included. All capabilities have `enabled: false`, a zero limit, and zero remaining budget. No enabled-live visual variant is provided.
- The dev server rejects `/api` and non-GET/HEAD requests. CSP sets `connect-src 'none'`, restricts media/images to this origin, and blocks workers/forms. Only local Vite modules/styles and committed media are loaded; no API calls occur by design. This is not a general-purpose sandbox for arbitrary new code.
- Every screen has a sticky `ISOLATED UI TEST — NO GENERATION OR SAVING` banner. An additional disclosure is inside the native modal's top layer, which would otherwise obscure ordinary page banners. Fixture result/reference titles retain visible fixture/provenance labels.
- `source: upload` and `source: generation` are **fixture discriminants**, necessary to inspect the corresponding real component branches. Their labels do not describe how these pixels were obtained. Both use the unchanged catalog samples and preserve their actual dimensions, byte sizes, duration, and attribution. The “succeeded” video is **14.997 seconds**, not the requested five-second generated result. Request settings are test metadata; the sample clip is not related to the still by generation.
- Still: `public/samples/dune-light.jpg`, Jacob Castle / Unsplash, [original photograph](https://unsplash.com/photos/the-sun-is-setting-over-the-sand-dunes-ui_tS2Yd-i0). Clip: `public/samples/dune-flight.mp4` and poster, Lukas Rodriguez / Pexels, [original clip](https://www.pexels.com/video/sand-dune-fpv-20081119/). Provenance and immutable sample hashes are imported from `src/catalog/samples.ts`; no media was downloaded or generated for this task.
- Apple Design guidance applied only to harness chrome: native labeled state selector, visible keyboard focus, comfortable control height, system typography, responsive wrapping, immediate state selection, and legible persistent status. No extra animation or change to production tokens/layout was introduced. The toolbar consumes viewport height; account for it when comparing screenshots against the live app.

## Verification and handoff

Executed successfully on 2026-10-12 UTC:

```sh
node node_modules/typescript/bin/tsc --project tests/visual/tsconfig.json --noEmit
node node_modules/vite/bin/vite.js build --config tests/visual/vite.config.ts --configLoader runner
```

Both exited 0. TypeScript emitted no diagnostics. Vite 8.0.13 transformed 1,812 modules and built successfully. The bundle check traversed actual production components/styles and passed the executable-module isolation guard. Build/cache output is restricted to ignored `tests/visual/.build` and `.cache`. The bundle omits copied public assets; it is a compile artifact, not a deployable site. No production file was edited by this task.

Browser, HTTP runtime, responsive screenshot, keyboard, and network-panel checks were **not run**; root owns browser operation. Root should launch the command, capture all states (including details on success), confirm no API requests/storage writes, and check desktop/narrow widths. CSP may reject Vite development connection attempts; HMR is intentionally unavailable. Inspect native dialog disclosure and overflow on the narrow viewport. These checks establish visual harness behavior only, not V3/P4 integration.

Own full task prompt verified before implementation in `.agent-logs/2026-10-12_03-25-32_01a12e24-dfff-7c83-ac06-2943dd6f2f18.md`, session `01a12e24-dfff-7c83-ac06-2943dd6f2f18`, recorded model `gpt-6-astra`. Final response capture occurs after emission; root must verify exactness and handle checkpoint/commit/push. Logs were not edited. No Git, browser, provider, deployment, or worker-spawning operation was performed.

## Coordinator extensions and observed rendering

Root added Library partial-failure/retry and external-image metadata available/unavailable scenarios, making16selectable scenarios in total. Library uses the actual component with fixture-only projects/project API methods; its first preview read rejects503 and retry returns the disclosed local fixture. Recovery is aliased to a no-op; no storage access. Cross-project fixtures supply an original image job in sourceJobs separately from current jobs; sample pixels remain prominently labeled. Root measured13originalscenarios at two widths plus the three targetedrepair scenarios; no blanketclaimthatall16were testedatallwidths. See phase456-integration.md for observedlimits.
