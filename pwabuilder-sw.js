// This is the service worker with the Cache-first network

const CACHE = "pwabuilder-precache";
const precacheFiles = [
  "/qm2-tools-webapp/",
  "/qm2-tools-webapp/css/main.css",
  "/qm2-tools-webapp/css/normalize.css",
  "/qm2-tools-webapp/css/w3-theme-blue.css",
  "/qm2-tools-webapp/css/w3.css",
  "/qm2-tools-webapp/favicon.png",
  "/qm2-tools-webapp/icon.png",
  "/qm2-tools-webapp/index.html",
  "/qm2-tools-webapp/js/main.js",
  "/qm2-tools-webapp/js/plugins.js",
  "/qm2-tools-webapp/js/vendor/papaparse.js",
  "/qm2-tools-webapp/js/vendor/crypto-js.min.js",
  "/qm2-tools-webapp/js/vendor/jquery-3.3.1.min.js",
  "/qm2-tools-webapp/js/vendor/modernizr-3.6.0.min.js",
  "/qm2-tools-webapp/site.json",
  "/qm2-tools-webapp/encrypted_csv_files/valves_encrypted.csv",
  "/qm2-tools-webapp/encrypted_csv_files/phones_encrypted.csv",
  "/qm2-tools-webapp/encrypted_csv_files/breakers_encrypted.csv",
  "/qm2-tools-webapp/encrypted_csv_files/esd_cabinets_encrypted.csv",
  "/qm2-tools-webapp/encrypted_csv_files/ups_locations_encrypted.csv"
];

self.addEventListener("install", function (event) {
  console.log("[PWA Builder] Install Event processing");

  console.log("[PWA Builder] Skip waiting on install");
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      console.log("[PWA Builder] Caching pages during install");
      return cache.addAll(precacheFiles);
    })
  );
});

// Allow sw to control of current page
self.addEventListener("activate", function (event) {
  console.log("[PWA Builder] Claiming clients for current page");
  event.waitUntil(self.clients.claim());
});

// If any fetch fails, it will look for the request in the cache and serve it from there first
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fromCache(event.request).then(
      function (response) {
        // The response was found in the cache so we responde with it and update the entry

        // This is where we call the server to get the newest version of the
        // file to use the next time we show view
        event.waitUntil(
          fetch(event.request).then(function (response) {
            return updateCache(event.request, response);
          })
        );

        return response;
      },
      function () {
        // The response was not found in the cache so we look for it on the server
        return fetch(event.request)
          .then(function (response) {
            // If request was success, add or update it in the cache
            event.waitUntil(updateCache(event.request, response.clone()));

            return response;
          })
          .catch(function (error) {
            console.log("[PWA Builder] Network request failed and no cache." + error);
          });
      }
    )
  );
});

function fromCache(request) {
  // Check to see if you have it in the cache
  // Return response
  // If not in the cache, then return
  return caches.open(CACHE).then(function (cache) {
    return cache.match(request).then(function (matching) {
      if (!matching || matching.status === 404) {
        return Promise.reject("no-match");
      }

      return matching;
    });
  });
}

function updateCache(request, response) {
  return caches.open(CACHE).then(function (cache) {
    return cache.put(request, response);
  });
}
