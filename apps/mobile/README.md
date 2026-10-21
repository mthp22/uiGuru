# uiGuru mobile (Expo)

Native iOS/Android port of uiGuru. Lives in this monorepo as an npm workspace alongside the Vite web app.

## Status: Phase 0 — canvas gesture spike

Validates the core technical risk of the native port: drag / resize / select / long-press feel on a real touch device, using React Native Gesture Handler + Reanimated (gestures run on the UI thread; React state commits only when a gesture ends, mirroring the web builder's command/commit model).

- Drag a block to move it (clamped to the canvas)
- Tap to select (haptic selection feedback)
- Long-press for the block action menu (duplicate / center / reset size / delete)
- Drag the corner handle to resize (min 96×72)
- `+ Block` to add blocks; tap empty canvas to deselect

## Stack

Expo SDK 58 · React Native 0.88 · React 19.3 · NativeWind 4 (Tailwind 3) · Reanimated 4 · Gesture Handler 3 · expo-haptics

## Commands

Run from `apps/mobile/`:

```sh
npx expo start        # dev server (Metro)
npx expo run:ios      # local native build + iOS simulator (regenerates ios/ via prebuild)
npx tsc --noEmit      # typecheck
npx expo lint         # lint
npx expo-doctor       # dependency/config health
```

From the repo root: `npm run lint` lints both apps, `npm run build` builds the web app.

## Conventions

- Never hand-edit `ios/` or `android/` — they are generated (`npx expo prebuild`); configure native behavior in `app.json`.
- Install packages with `npx expo install <pkg>` so versions match the SDK.
- Dynamic per-block values (position/size) go in the `style` prop; static chrome uses NativeWind `className`.
- Lint note: `react-hooks/immutability` is disabled for `apps/mobile` (see root `eslint.config.js`) because React Compiler cannot distinguish Reanimated shared values from frozen React values.

## Next phases

1. **Phase 1** — extract pure logic (`types`, `geometry`, `canvasCommands`, `useHistory`, `data`, `exporters`) into `packages/core`, shared with the web app.
2. **Phase 2** — rebuild Builder / Inspector / Layers as native screens (NativeWind), touch-first layout.
3. **Phase 3** — `ProjectRepository` interface: MMKV local storage now, HTTP API client later (local-first).
4. **Phase 4** — EAS Build, TestFlight, App Store submission.
