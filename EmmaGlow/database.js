// database.js
const DB_NAME = 'EmmaGlowDB';
const DB_VERSION = 1;
let db;

function openDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("Error al abrir la base de datos:", event.target.error);
            reject("Error al abrir DB");
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('users')) {
                db.createObjectStore('users', { keyPath: 'email' });
            }
            if (!db.objectStoreNames.contains('analyses')) {
                db.createObjectStore('analyses', { autoIncrement: true })
                  .createIndex('userEmail', 'userEmail', { unique: false });
            }
        };
    });
}

function addUser(user) {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const transaction = db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        const request = store.add(user);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function getUser(email) {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const transaction = db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        const request = store.get(email);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function addAnalysis(analysis) {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const transaction = db.transaction(['analyses'], 'readwrite');
        const store = transaction.objectStore('analyses');
        const request = store.add(analysis);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function getAnalyses(userEmail) {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const transaction = db.transaction(['analyses'], 'readonly');
        const store = transaction.objectStore('analyses');
        const index = store.index('userEmail');
        const request = index.getAll(userEmail);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}