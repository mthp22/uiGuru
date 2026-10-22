/**
 * Platform-free unique id creation.
 *
 * `crypto.randomUUID` exists on the web and in modern React Native runtimes,
 * but this helper degrades gracefully where it is missing so core code never
 * has to care about the platform.
 */
let fallbackCounter = 0;

export function createId(): string {
  const webCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (webCrypto && typeof webCrypto.randomUUID === 'function') {
    return webCrypto.randomUUID();
  }
  fallbackCounter += 1;
  return `id-${Date.now().toString(36)}-${fallbackCounter.toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}
