const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

let mapsPromise = null;

/**
 * Singleton Google Maps API loader.
 * Guarantees that Google Maps JS API (with 'places' library and 'loading=async')
 * is injected into the DOM exactly once, preventing duplicate-script conflicts,
 * loader collisions, and custom element re-definition errors.
 */
export const loadGoogleMaps = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is not available'));
  }

  // 1. If google.maps and places library are already available, resolve immediately
  if (window.google?.maps?.places) {
    return Promise.resolve(window.google.maps);
  }

  // 2. If a loading promise is already active, reuse it
  if (mapsPromise) {
    return mapsPromise;
  }

  // 3. Check if script tag already exists in the document
  const existingScript = document.getElementById('google-maps-sdk');
  if (existingScript) {
    mapsPromise = new Promise((resolve, reject) => {
      const checkReady = () => {
        if (window.google?.maps?.places) {
          resolve(window.google.maps);
          return true;
        }
        return false;
      };

      if (!checkReady()) {
        existingScript.addEventListener('load', () => {
          setTimeout(() => {
            if (window.google?.maps) resolve(window.google.maps);
            else reject(new Error('Google Maps failed to initialize'));
          }, 50);
        });
        existingScript.addEventListener('error', (err) => reject(err));
      }
    });
    return mapsPromise;
  }

  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('VITE_GOOGLE_MAPS_API_KEY is not defined');
    return Promise.reject(new Error('Missing Google Maps API Key'));
  }

  mapsPromise = new Promise((resolve, reject) => {
    const callbackName = '__initGoogleMaps_' + Math.random().toString(36).substring(2, 9);

    const cleanup = () => {
      try {
        delete window[callbackName];
      } catch (e) {
        window[callbackName] = undefined;
      }
    };

    window[callbackName] = () => {
      cleanup();
      resolve(window.google.maps);
    };

    const script = document.createElement('script');
    script.id = 'google-maps-sdk';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = (err) => {
      cleanup();
      mapsPromise = null;
      reject(err);
    };

    document.head.appendChild(script);
  });

  return mapsPromise;
};
