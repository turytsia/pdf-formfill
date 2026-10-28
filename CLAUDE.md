# Formfill

Client-only React + TypeScript app for filling scanned (non-interactive) PDF forms. The user drops a PDF, places text and X marks on top of the rendered pages, stretches text so each letter lands in its own box, and downloads a flattened copy. Nothing leaves the browser.

## Commands

- `pnpm start` — dev server
- `pnpm check` — typecheck, lint, format check and tests; run it before declaring a change done
- `pnpm lint` / `pnpm format` — auto-fix lint and formatting
- `pnpm test` — all tests; `pnpm test src/path/File.test.tsx` for one file
- `pnpm build` — production build

## Architecture

- `src/components/*` — React components, one PascalCase file per component. `components/ui` holds generic primitives (Button, NumberField, …), `components/Editor` the editing surface, `components/Dropzone` the landing screen.
- `src/state/*` — item types, constants, item factories, the reducer and the `EditorProvider` / `useEditor` context.
- `src/utilities/*` — pure functions and integrations: `geometry` (coordinate math), `loadPdf` (pdf.js), `exportPdf` (pdf-lib), `formFont` (font loading and metrics), `pointerDrag`.
- Items are stored in PDF user space (points, y up, origin bottom-left), exactly as pdf-lib expects. Text items store the baseline of the first line, mark items store their center. `utilities/geometry.ts` converts to screen pixels for a zoom level. Pages are assumed unrotated.
- One JetBrains Mono TTF is loaded once (`utilities/formFont.ts`), registered as a browser `FontFace` for on-screen rendering and embedded with pdf-lib on export, so the preview matches the output. "Letter spacing" means per-character cells: each glyph is centered in a cell `spacing` points wide, both on screen (`letter-spacing` + left padding) and in the PDF (one `drawText` per character).
- pdf.js transfers the source buffer to its worker. Always hand it a copy and keep the original for export.
- Copy/cut/paste work on whole items through the native `copy` / `cut` / `paste` events (`components/Editor/useEditorClipboard.ts`): the selected item is written to the clipboard under a custom MIME type plus `text/plain`. Paste only intercepts when that MIME type is present, so pasting outside text into a field still works. Pasted items land under the pointer (tracked via `pointermove`, resolved with `elementFromPoint` → `[data-page-index]`), or offset from the original when the pointer is not over a page.
- Responsive behavior is CSS-first: `src/styles/breakpoints.ts` exports `MOBILE_MEDIA` (< 768px) and `COARSE_POINTER_MEDIA`. Below the breakpoint the tool rail becomes a bottom bar (`--mobile-rail-height`), the properties panel becomes a bottom sheet that is only shown while an item is selected, and the header hides the file info and button labels. Touch gets larger hit areas via `::before` pseudo-elements and pinch-to-zoom through `components/Editor/usePinchZoom.ts` (the scroll container uses `touch-action: pan-x pan-y`, so the browser pans and the hook handles two-finger zoom). The same hook handles trackpad pinch: Ctrl/⌘ + `wheel` events (Chrome, Edge, Firefox; also mouse-wheel zoom) and Safari's `gesture*` events, always zooming around the cursor or finger midpoint and suppressing the browser's page zoom.
- Zoom must stay cheap: `PageCanvas` scales the existing bitmap with CSS while the zoom changes and re-rasterises with pdf.js only after the zoom has settled (`RASTER_SETTLE_MS`), capped at `MAX_RASTER_PIXELS`, rendered off-screen to avoid a blank flash, and only for pages near the viewport (IntersectionObserver). `usePinchZoom` applies at most one zoom per animation frame. Don't add per-tick work to the zoom path.
- On phones, `useEditingOnPage` reports when a page text field has focus (keyboard up): the tool bar hides and the properties sheet collapses to its header (`collapsedOnMobile`), and `useVisualViewportHeight` publishes `--app-height` so the editor fits above the keyboard.
- Undo/redo lives in the reducer as `past` / `future` snapshots of `items` + `selectedId`. Zoom, tool and selection are not undoable. Update actions take an optional `batch` key: consecutive updates with the same key (typing into one field, one pointer drag) collapse into a single undo step, so give every drag a fresh key and every field a stable `field-id` key.

## Coding practices

### TypeScript

- Explicit return types on every function, including arrow functions assigned to variables (`const format = (value: number): string => …`). ESLint enforces this.
- No `any`. Prefer type annotations over assertions for object literals: `const item: TextItem = { … }`, not `{ … } as TextItem`.
- `Array<T>`, never `T[]`.
- Singular enum names: `ItemKind`, not `ItemKinds`.
- Exported module-level constants in `SCREAMING_SNAKE_CASE`; object constants get `as const`.
- Named exports at the point of definition. No default exports except for lazy-loaded modules.
- `param: T | undefined` when the argument must be passed but may be undefined; `param?: T` only when it may be omitted.
- Proper camelCase/PascalCase for acronyms: `loadPdf`, `toPdfPoint`, not `loadPDF`.
- No nested ternaries. Use early returns instead of deep nesting.
- Prefer pure functions. Anything that does not depend on props, state or hooks lives outside the component body.
- Comments only for non-obvious constraints or surprising behavior, never to narrate what the code does or to talk to a reviewer. A TODO must link to an issue.

### React

- Functional components typed as `React.FC<Props>` with destructured props. Component name matches the file name.
- Minimize `useEffect`: derive values during render, put event-driven logic in handlers, reset state with `key`. Effects are for syncing with external systems only (pdf.js canvas rendering, `window` listeners, DOM measurement).
- Minimize `useMemo` / `useCallback`: only for genuinely expensive work or to keep a `React.memo` child stable.
- Expose context through a hook that throws when the provider is missing (`useEditor`); never call `useContext` directly in components.
- `condition && <Component />` instead of ternaries returning `null`; `<>…</>` instead of `React.Fragment` unless a key is needed.
- Split long JSX into components, not into render helper functions.
- Styling: `@emotion/css` with a `styles` object at the bottom of the component file, using the CSS variables from `src/styles/global.ts`. No CSS files. Inline `style` only for per-item dynamic geometry (positions and sizes derived from zoom).
- Every icon-only button has an `aria-label`.

### Tests

- Vitest + Testing Library. Co-locate tests as `Name.test.ts(x)` next to the unit.
- One top-level `describe` named after the unit. `it` descriptions read like a specification; put the condition in a `describe('when …')` when a group shares setup.
- Query like a user: role, label, text. No test ids unless there is no alternative. Exact strings over regex.
- `userEvent` over `fireEvent`; `toBeVisible()` over `toBeInTheDocument()`.
- DAMP over DRY: literals in tests are fine.
- Deterministic: no `Math.random` or `Date.now` in assertions.
- Test pure utilities and reducers directly. pdf.js cannot render in jsdom, so the canvas path is verified in a real browser.

## Workflow

- Run `pnpm check` before finishing.
- Keep the dependency list small; this app is intentionally lightweight.
