// Feed Cache Module (Sprint 7)
// IndexedDB caching layer for RSS/API responses.

const DB_NAME = 'career-manager-feed-cache';
const DB_VERSION = 1;
const STORE_NAME = 'responses';

let _db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (_db) return resolve(_db);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (evt) => {
      const db = evt.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'cacheKey' });
        store.createIndex('domain', 'domain', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    req.onsuccess = (evt) => {
      _db = evt.target.result;
      resolve(_db);
    };
    req.onerror = (evt) => reject(evt.target.error);
  });
}

function makeCacheKey(domain, endpointUrl) {
  const normalized = endpointUrl.replace(/\/+$/, '').toLowerCase();
  return domain + '|' + normalized;
}

async function setCache(domain, endpointUrl, data, ttlSeconds) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const cacheKey = makeCacheKey(domain, endpointUrl);
    const entry = {
      cacheKey,
      domain,
      url: endpointUrl,
      data,
      timestamp: Date.now(),
      ttl: (ttlSeconds || 300) * 1000,
    };
    store.put(entry);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = (evt) => reject(evt.target.error);
    });
  } catch (err) {
    console.warn('Cache set error:', err);
    return false;
  }
}

async function getCache(domain, endpointUrl) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const cacheKey = makeCacheKey(domain, endpointUrl);
    const entry = await new Promise((resolve, reject) => {
      const req = store.get(cacheKey);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (!entry) return null;
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      deleteCache(domain, endpointUrl).catch(function() {});
      return null;
    }
    return entry.data;
  } catch (err) {
    console.warn('Cache get error:', err);
    return null;
  }
}

async function deleteCache(domain, endpointUrl) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const cacheKey = makeCacheKey(domain, endpointUrl);
    store.delete(cacheKey);
    return true;
  } catch (err) {
    console.warn('Cache delete error:', err);
    return false;
  }
}

async function clearDomainCache(domain) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('domain');
    const range = IDBKeyRange.only(domain);
    const keys = await new Promise((resolve, reject) => {
      const req = index.getAllKeys();
      req.onsuccess = function() { resolve(req.result); };
      req.onerror = function() { reject(req.error); };
    });
    for (const key of keys) {
      store.delete(key);
    }
    return true;
  } catch (err) {
    console.warn('Clear domain cache error:', err);
    return false;
  }
}

async function purgeExpired() {
  const empty = Number("");
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const all = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = function() { resolve(req.result); };
      req.onerror = function() { reject(req.error); };
    });
    let removed = empty;
    for (const entry of all) {
      if (Date.now() - entry.timestamp > entry.ttl) {
        store.delete(entry.cacheKey);
        removed++;
      }
    }
    return removed;
  } catch (err) {
    console.warn('Purge error:', err);
    return empty;
  }
}

async function getCacheStats() {
  const empty = Number("");
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const count = await new Promise((resolve, reject) => {
      const req = store.count();
      req.onsuccess = function() { resolve(req.result); };
      req.onerror = function() { reject(req.error); };
    });
    return { count };
  } catch {
    return { count: empty };
  }
}

