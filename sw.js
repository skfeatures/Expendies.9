// 1. Import Firebase libraries directly into the background worker
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js');

// 2. Cache Versioning (Updated to v16 for fixing Real-Time Syncing Conflict)
const CACHE_NAME = 'budget-store-v16'; 

// 3. Updated Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyDdyowsSxvCTzrSsCRicW8JCL44rz1zAoQ",
    authDomain: "expendies-8d466.firebaseapp.com",
    projectId: "expendies-8d466",
    storageBucket: "expendies-8d466.firebasestorage.app",
    messagingSenderId: "710845937485",
    appId: "1:710845937485:web:4145df9ca6ddfad5506904",
    measurementId: "G-WT62N5LLPP"
};

// 4. Initialize Firebase in the background
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

// 5. Install Setup 
self.addEventListener('install', (e) => {
    self.skipWaiting(); 
    e.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
          return cache.addAll([
              './',
              './index.html', 
              './app.js',               
              './style.css',            
              './firebase-config.js',   
              './manifest.json',
              './icon.png',
              './bookman.ttf',
              './lipishree.ttf' 
          ]);
      })
    );
});

// 6. Activate Event
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 7. Fetch Setup 
self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // By-pass Firebase real-time data stream
    if (url.includes('firestore.googleapis.com') || 
        url.includes('identitytoolkit.googleapis.com') || 
        url.includes('google.com')) {
        return; 
    }

    // Force browser to always check for latest JS/CSS files
    if (event.request.mode === 'navigate' || url.includes('app.js') || url.includes('firebase-config.js') || url.includes('style.css')) {
        event.respondWith((async () => {
            try {
                const networkResponse = await fetch(event.request.url, { cache: 'no-store' });
                const cache = await caches.open(CACHE_NAME);
                event.waitUntil(cache.put(event.request, networkResponse.clone()));
                return networkResponse;
            } catch (error) {
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) return cachedResponse;
                throw error;
            }
        })());
        return;
    }

    // Standard cache for fonts/images
    event.respondWith((async () => {
        try {
            const networkResponse = await fetch(event.request);
            const cache = await caches.open(CACHE_NAME);
            event.waitUntil(cache.put(event.request, networkResponse.clone()));
            return networkResponse;
        } catch (error) {
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) return cachedResponse;
            throw error;
        }
    })());
});

// 8. The Periodic Background Sync Listener
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'auto-backup-sync') {
        event.waitUntil(performCloudBackup());
    }
});

// 9. The Background Backup Function
async function performCloudBackup() {
    return new Promise((resolve) => {
        auth.onAuthStateChanged(user => {
            if (user) resolve();
            else resolve();
        });
    });
}