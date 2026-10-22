/**
 * uiGuru core — platform-free editor logic shared by the web app and
 * the Expo mobile app.
 *
 * Everything here must stay free of DOM and React Native imports.
 * (useHistory is React, not DOM — React runs on both platforms.)
 *
 * Convention: pure functions that React Native gesture worklets need to call
 * synchronously on the UI runtime must carry the `'worklet'` directive (see
 * geometry.ts). The directive is inert on the web, so it does not leak the
 * platform into this package.
 */
export * from './types';
export * from './geometry';
export * from './canvasCommands';
export * from './data';
export * from './exporters';
export * from './useHistory';
