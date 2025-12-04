import { ModuleData } from '../types';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, enableNetwork } from "firebase/firestore";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_PUBLIC_FIREBASE_APP_ID
};

// --- CLOUDINARY CONFIGURATION ---
// 🚨 TODO: REPLACE "YOUR_CLOUD_NAME_HERE" WITH YOUR ACTUAL CLOUD NAME FROM CLOUDINARY DASHBOARD
const CLOUDINARY_CLOUD_NAME = "daf1zeebs"; 
const CLOUDINARY_UPLOAD_PRESET = "lms_files"; 

if (!firebaseConfig.apiKey) {
  console.error("🚨 FIREBASE KEYS MISSING!");
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export interface AnnotationData {
  [page: number]: any[]; 
}

class LMSDatabase {
  
  async init(): Promise<void> {
    console.log("Cloud DB Active (Cloudinary Mode)");
    try { await enableNetwork(db); } catch (e) {}
    return Promise.resolve();
  }

  // --- HELPER: UPLOAD TO CLOUDINARY ---
  private async uploadToCloudinary(fileDataUrl: string, fileName: string): Promise<string | null> {
    try {
      const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
      const formData = new FormData();
      formData.append("file", fileDataUrl);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("public_id", fileName);
      formData.append("use_filename", "true"); 
      formData.append("unique_filename", "false"); 

      const response = await fetch(url, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Cloudinary Error: ${errText}`);
      }
      
      const data = await response.json();
      return data.secure_url; 
    } catch (err) {
      console.error("Upload Error:", err);
      return null;
    }
  }

  // --- PROCESS DATA RECURSIVELY (AND CLEAN UNDEFINED) ---
  private async processAndUploadFiles(item: any): Promise<any> {
    // FIX: Convert top-level undefined to null immediately
    if (item === undefined) {
      return null; 
    }

    if (Array.isArray(item)) {
      const processedArray = await Promise.all(item.map((i) => this.processAndUploadFiles(i)));
      // FIX: Ensure no undefineds sneak into arrays
      return processedArray.map(i => i === undefined ? null : i);
    } 
    else if (typeof item === 'object' && item !== null) {
      const newObj: any = {};
      for (const key in item) {
        const val = item[key];
        
        // FIX: Explicitly handle undefined values in objects
        if (val === undefined) {
            newObj[key] = null; // Convert to null so Firestore accepts it
            continue;
        }

        // CHECK: Is it a large file (Base64 string > 800KB)?
        if (typeof val === 'string' && val.length > 800000) {
           console.log(`☁️ Uploading '${key}' to Cloudinary...`);
           
           // Detect Extension
           let extension = "";
           if (val.startsWith("data:application/pdf")) extension = ".pdf";
           else if (val.startsWith("data:image/jpeg")) extension = ".jpg";
           else if (val.startsWith("data:image/png")) extension = ".png";
           else if (val.startsWith("data:video/mp4")) extension = ".mp4";
           
           const timestamp = Date.now();
           const randomId = Math.random().toString(36).substring(7);
           const fileName = `${key}_${timestamp}_${randomId}${extension}`;

           const uploadedUrl = await this.uploadToCloudinary(val, fileName);
           
           if (uploadedUrl) {
             console.log(`✅ Uploaded! URL: ${uploadedUrl}`);
             newObj[key] = uploadedUrl;
           } else {
             console.warn("❌ Upload failed. Using placeholder.");
             newObj[key] = "https://example.com/upload-failed";
           }
        } else {
           // Recurse
           newObj[key] = await this.processAndUploadFiles(val);
        }
      }
      return newObj;
    }
    return item;
  }

  // --- LIBRARY METHODS ---

  async getLibrary(): Promise<ModuleData[] | null> {
    try {
      const docRef = doc(db, "library", "root_tree");
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;

      const mainDoc = docSnap.data();
      if (!mainDoc.isSplit) return mainDoc.data as ModuleData[];

      console.log(`Loading split library...`);
      let allData: ModuleData[] = [];
      for (let i = 0; i < mainDoc.totalChunks; i++) {
        const chunkSnap = await getDoc(doc(db, "library", `chunk_${i}`));
        if (chunkSnap.exists()) allData = [...allData, ...chunkSnap.data().data];
      }
      return allData;
    } catch (e) {
      console.error("Error fetching library:", e);
      return null;
    }
  }

  async saveLibrary(data: ModuleData[]): Promise<void> {
    try {
      console.log("Saving Library... Checking files...");
      
      // 1. Upload to Cloudinary & Clean undefined values
      const cleanData = await this.processAndUploadFiles(data);

      // 2. Save cleaned data to Firebase
      const jsonString = JSON.stringify({ data: cleanData });
      const sizeInBytes = new Blob([jsonString]).size;

      if (sizeInBytes < 1000000) {
        await setDoc(doc(db, "library", "root_tree"), { 
          data: cleanData, isSplit: false, totalChunks: 0 
        });
      } else {
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

  // --- RESOURCE METHODS ---

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
    try {
      console.log(`Saving resources for ${bookId}...`);
      const cleanItems = await this.processAndUploadFiles(items);
      await setDoc(doc(db, "resources", bookId), { items: cleanItems });
      console.log("✅ Resources saved successfully!");
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

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.dbService = dbService;
}
