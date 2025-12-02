import { ModuleData } from '../types';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// --- CONFIGURATION ---
// Using Vite environment variables
// UPDATED: Matching your Vercel settings (VITE_PUBLIC_...)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_PUBLIC_FIREBASE_APP_ID
};

// Safety check for keys
if (!firebaseConfig.apiKey) {
  console.error("FIREBASE KEYS ARE MISSING! Check Vercel Settings or .env file.");
}

// Initialize Cloud DB
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export interface AnnotationData {
  [page: number]: any[]; 
}

class LMSDatabase {
  
  // Backward compatibility stub
  async init(): Promise<void> {
    console.log("Cloud DB (Firebase) Active");
    return Promise.resolve();
  }

  // --- LIBRARY METHODS (With Safety Logic) ---

  async getLibrary(): Promise<ModuleData[] | null> {
    try {
      const docRef = doc(db, "library", "root_tree");
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      const mainDoc = docSnap.data();

      // Case 1: Standard Single File
      if (!mainDoc.isSplit) {
        return mainDoc.data as ModuleData[];
      }

      // Case 2: Split Files (Reassemble chunks)
      console.log(`Loading split library (${mainDoc.totalChunks} chunks)...`);
      let allData: ModuleData[] = [];

      for (let i = 0; i < mainDoc.totalChunks; i++) {
        const chunkSnap = await getDoc(doc(db, "library", `chunk_${i}`));
        if (chunkSnap.exists()) {
          allData = [...allData, ...chunkSnap.data().data];
        }
      }
      return allData;

    } catch (e) {
      console.error("Error fetching library:", e);
      return null;
    }
  }

  async saveLibrary(data: ModuleData[]): Promise<void> {
    
    // Helper: Remove huge strings (PDFs) to prevent crashes
    const stripLargeData = (item: any): any => {
      if (Array.isArray(item)) return item.map(stripLargeData);
      if (typeof item === 'object' && item !== null) {
        const newObj: any = {};
        for (const key in item) {
          const val = item[key];
          // If string is > 20KB, replace with dummy link
          if (typeof val === 'string' && val.length > 20000) {
             console.warn(`Cutting large file in '${key}' to save space.`);
             newObj[key] = "https://example.com/large-file-removed"; 
          } else {
             newObj[key] = stripLargeData(val);
          }
        }
        return newObj;
      }
      return item;
    };

    try {
      console.log("Saving Library...");
      const cleanData = stripLargeData(data); // Clean first

      // Check size
      const jsonString = JSON.stringify({ data: cleanData });
      const sizeInBytes = new Blob([jsonString]).size;

      if (sizeInBytes < 1000000) {
        // Save as Single Document
        await setDoc(doc(db, "library", "root_tree"), { 
          data: cleanData,
          isSplit: false,
          totalChunks: 0 
        });
      } else {
        // Save as Chunks (Backup plan if still big)
        const chunkSize = 50; 
        const totalChunks = Math.ceil(cleanData.length / chunkSize);
        
        await setDoc(doc(db, "library", "root_tree"), { 
          isSplit: true, totalChunks, totalItems: cleanData.length 
        });

        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSize;
          const chunkData = cleanData.slice(start, start + chunkSize);
          await setDoc(doc(db, "library", `chunk_${i}`), { data: chunkData });
        }
      }
      console.log("Library saved successfully.");
    } catch (e) {
      console.error("Error saving library:", e);
    }
  }

  // --- RESOURCE METHODS (With Cleaning) ---

  async getResources(bookId: string): Promise<any[] | null> {
    try {
      const docRef = doc(db, "resources", bookId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data().items : null;
    } catch (e) {
      console.error("Error fetching resources:", e);
      return null;
    }
  }

  async saveResources(bookId: string, items: any[]): Promise<void> {
    // Re-use cleaner logic for resources
    const stripLargeData = (item: any): any => {
      if (Array.isArray(item)) return item.map(stripLargeData);
      if (typeof item === 'object' && item !== null) {
        const newObj: any = {};
        for (const key in item) {
          const val = item[key];
          if (typeof val === 'string' && val.length > 20000) {
             newObj[key] = "https://example.com/large-file-removed"; 
          } else {
             newObj[key] = stripLargeData(val);
          }
        }
        return newObj;
      }
      return item;
    };

    try {
      const cleanItems = stripLargeData(items);
      await setDoc(doc(db, "resources", bookId), { items: cleanItems });
    } catch (e) {
      console.error("Error saving resources:", e);
    }
  }

  // --- ANNOTATION METHODS ---

  async getAnnotations(bookId: string): Promise<AnnotationData | null> {
    try {
      const docRef = doc(db, "annotations", bookId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data().data : null;
    } catch (e) {
      console.error("Error fetching annotations:", e);
      return null;
    }
  }

  async saveAnnotations(bookId: string, data: AnnotationData): Promise<void> {
    try {
      await setDoc(doc(db, "annotations", bookId), { data });
    } catch (e) {
      console.error("Error saving annotations:", e);
    }
  }
}

export const dbService = new LMSDatabase();

// --- EXPOSE FOR DEBUGGING ---
// This allows you to type 'dbService' in the browser console
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.dbService = dbService;
}
