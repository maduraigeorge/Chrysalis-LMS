
import { ModuleData } from '../types';

const DB_NAME = 'ChrysalisLMS_DB';
const DB_VERSION = 1;

export interface AnnotationData {
  [page: number]: any[]; // Using any[] for the stroke/text objects defined in BookViewer
}

class LMSDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject('Error opening database');

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Store for the main library tree structure
        if (!db.objectStoreNames.contains('library')) {
          db.createObjectStore('library', { keyPath: 'id' });
        }

        // Store for book resources (mapped by bookId)
        if (!db.objectStoreNames.contains('resources')) {
          db.createObjectStore('resources', { keyPath: 'bookId' });
        }

        // Store for annotations (mapped by bookId)
        if (!db.objectStoreNames.contains('annotations')) {
          db.createObjectStore('annotations', { keyPath: 'bookId' });
        }
      };
    });
  }

  // --- Library Methods ---

  async getLibrary(): Promise<ModuleData[] | null> {
    return new Promise((resolve) => {
      if (!this.db) return resolve(null);
      const tx = this.db.transaction('library', 'readonly');
      const store = tx.objectStore('library');
      const request = store.get('root_tree');
      request.onsuccess = () => resolve(request.result?.data || null);
      request.onerror = () => resolve(null);
    });
  }

  async saveLibrary(data: ModuleData[]): Promise<void> {
    return new Promise((resolve) => {
      if (!this.db) return resolve();
      const tx = this.db.transaction('library', 'readwrite');
      const store = tx.objectStore('library');
      store.put({ id: 'root_tree', data });
      tx.oncomplete = () => resolve();
    });
  }

  // --- Resource Methods ---

  async getResources(bookId: string): Promise<any[] | null> {
    return new Promise((resolve) => {
      if (!this.db) return resolve(null);
      const tx = this.db.transaction('resources', 'readonly');
      const store = tx.objectStore('resources');
      const request = store.get(bookId);
      request.onsuccess = () => resolve(request.result?.items || null);
      request.onerror = () => resolve(null);
    });
  }

  async saveResources(bookId: string, items: any[]): Promise<void> {
    return new Promise((resolve) => {
      if (!this.db) return resolve();
      const tx = this.db.transaction('resources', 'readwrite');
      const store = tx.objectStore('resources');
      store.put({ bookId, items });
      tx.oncomplete = () => resolve();
    });
  }

  // --- Annotation Methods ---

  async getAnnotations(bookId: string): Promise<AnnotationData | null> {
    return new Promise((resolve) => {
      if (!this.db) return resolve(null);
      const tx = this.db.transaction('annotations', 'readonly');
      const store = tx.objectStore('annotations');
      const request = store.get(bookId);
      request.onsuccess = () => resolve(request.result?.data || null);
      request.onerror = () => resolve(null);
    });
  }

  async saveAnnotations(bookId: string, data: AnnotationData): Promise<void> {
    return new Promise((resolve) => {
      if (!this.db) return resolve();
      const tx = this.db.transaction('annotations', 'readwrite');
      const store = tx.objectStore('annotations');
      store.put({ bookId, data });
      tx.oncomplete = () => resolve();
    });
  }
}

export const dbService = new LMSDatabase();
