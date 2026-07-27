// WebAssembly fallback preload
// Wraps WASM constructors to return null on memory allocation failure
// This allows code to fall back to pure JS implementations

const OrigWebAssembly = globalThis.WebAssembly;

if (OrigWebAssembly) {
  const OrigModule = OrigWebAssembly.Module;
  const OrigInstance = OrigWebAssembly.Instance;

  // Wrap Module constructor
  OrigWebAssembly.Module = new Proxy(OrigModule, {
    construct(target, args) {
      try {
        return new target(...args);
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[wasm-fallback] WebAssembly.Module failed:', e.message);
        }
        // Return a proxy that returns null-like values
        return null;
      }
    },
  });

  // Wrap Instance constructor
  OrigWebAssembly.Instance = new Proxy(OrigInstance, {
    construct(target, args) {
      try {
        return new target(...args);
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[wasm-fallback] WebAssembly.Instance failed:', e.message);
        }
        return null;
      }
    },
  });

  console.log('[wasm-fallback] WebAssembly wrappers installed');
}
