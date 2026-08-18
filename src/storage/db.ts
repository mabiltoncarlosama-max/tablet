import { Notebook, Folder } from '../types';
import { DEFAULT_FOLDERS, INITIAL_NOTEBOOKS } from '../data/templates';
import {
  db,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from '../lib/firebase';

// Helper to get collection references for a specific user
function getUserFoldersRef(userId: string) {
  return collection(db, 'users', userId, 'folders');
}

function getUserNotebooksRef(userId: string) {
  return collection(db, 'users', userId, 'notebooks');
}

// -------------------------------------------------------------
// USER FIRESTORE OPERATIONS (Independent Per-User Cloud Storage)
// -------------------------------------------------------------

export async function loadUserFolders(userId: string): Promise<Folder[]> {
  try {
    const foldersRef = getUserFoldersRef(userId);
    const snapshot = await getDocs(foldersRef);

    if (snapshot.empty) {
      // First time user: initialize with default folders in their cloud database
      await saveUserFolders(userId, DEFAULT_FOLDERS);
      return DEFAULT_FOLDERS;
    }

    const folders: Folder[] = [];
    snapshot.forEach((docSnap) => {
      folders.push(docSnap.data() as Folder);
    });

    // Sort by order
    folders.sort((a, b) => a.order - b.order);
    return folders;
  } catch (error) {
    console.error('Error loading folders from Firestore:', error);
    return DEFAULT_FOLDERS;
  }
}

export async function saveUserFolders(userId: string, folders: Folder[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    folders.forEach((folder) => {
      const folderDoc = doc(db, 'users', userId, 'folders', folder.id);
      batch.set(folderDoc, folder);
    });
    await batch.commit();
  } catch (error) {
    console.error('Error saving folders to Firestore:', error);
  }
}

export async function loadUserNotebooks(userId: string): Promise<Notebook[]> {
  try {
    const notebooksRef = getUserNotebooksRef(userId);
    const snapshot = await getDocs(notebooksRef);

    if (snapshot.empty) {
      // First time user: initialize with default starter notebooks
      const personalStarterNotebooks = INITIAL_NOTEBOOKS.map((nb, i) => ({
        ...nb,
        id: `nb-${userId.substring(0, 5)}-${Date.now()}-${i}`,
        createdAt: Date.now() - i * 1000,
        updatedAt: Date.now() - i * 1000,
      }));

      await saveAllUserNotebooks(userId, personalStarterNotebooks);
      return personalStarterNotebooks;
    }

    const notebooks: Notebook[] = [];
    snapshot.forEach((docSnap) => {
      notebooks.push(docSnap.data() as Notebook);
    });

    // Sort by most recently updated
    notebooks.sort((a, b) => b.updatedAt - a.updatedAt);
    return notebooks;
  } catch (error) {
    console.error('Error loading notebooks from Firestore:', error);
    return [];
  }
}

export async function saveUserNotebook(userId: string, notebook: Notebook): Promise<void> {
  try {
    const notebookDoc = doc(db, 'users', userId, 'notebooks', notebook.id);
    await setDoc(notebookDoc, notebook, { merge: true });
  } catch (error) {
    console.error('Error saving notebook to Firestore:', error);
  }
}

export async function saveAllUserNotebooks(userId: string, notebooks: Notebook[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    notebooks.forEach((nb) => {
      const notebookDoc = doc(db, 'users', userId, 'notebooks', nb.id);
      batch.set(notebookDoc, nb, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    console.error('Error batch saving notebooks to Firestore:', error);
  }
}

export async function deleteUserNotebook(userId: string, notebookId: string): Promise<void> {
  try {
    const notebookDoc = doc(db, 'users', userId, 'notebooks', notebookId);
    await deleteDoc(notebookDoc);
  } catch (error) {
    console.error('Error deleting notebook from Firestore:', error);
  }
}

// -------------------------------------------------------------
// LOCAL FALLBACK / GUEST (IndexedDB)
// -------------------------------------------------------------

const DB_NAME = 'TabletNotesDB_v2';
const DB_VERSION = 1;
let dbInstance: IDBDatabase | null = null;

async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const d = (event.target as IDBOpenDBRequest).result;

        if (!d.objectStoreNames.contains('notebooks')) {
          const notebookStore = d.createObjectStore('notebooks', { keyPath: 'id' });
          notebookStore.createIndex('folderId', 'folderId', { unique: false });
          notebookStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        if (!d.objectStoreNames.contains('folders')) {
          d.createObjectStore('folders', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        dbInstance = request.result;
        resolve(dbInstance);
      };

      request.onerror = () => {
        reject(request.error);
      };
    } catch (e) {
      reject(e);
    }
  });
}

export async function loadFolders(): Promise<Folder[]> {
  try {
    const d = await getDB();
    return new Promise((resolve) => {
      const transaction = d.transaction('folders', 'readonly');
      const store = transaction.objectStore('folders');
      const request = store.getAll();

      request.onsuccess = async () => {
        if (!request.result || request.result.length === 0) {
          await saveFolders(DEFAULT_FOLDERS);
          resolve(DEFAULT_FOLDERS);
        } else {
          resolve(request.result);
        }
      };

      request.onerror = () => {
        resolve(DEFAULT_FOLDERS);
      };
    });
  } catch (e) {
    return DEFAULT_FOLDERS;
  }
}

export async function saveFolders(folders: Folder[]): Promise<void> {
  try {
    const d = await getDB();
    const transaction = d.transaction('folders', 'readwrite');
    const store = transaction.objectStore('folders');
    store.clear();
    for (const folder of folders) {
      store.put(folder);
    }
  } catch (e) {
    console.warn('IndexedDB saveFolders error:', e);
  }
}

export async function loadNotebooks(): Promise<Notebook[]> {
  try {
    const d = await getDB();
    return new Promise((resolve) => {
      const transaction = d.transaction('notebooks', 'readonly');
      const store = transaction.objectStore('notebooks');
      const request = store.getAll();

      request.onsuccess = async () => {
        if (!request.result || request.result.length === 0) {
          await saveAllNotebooks(INITIAL_NOTEBOOKS);
          resolve(INITIAL_NOTEBOOKS);
        } else {
          resolve(request.result);
        }
      };

      request.onerror = () => {
        resolve(INITIAL_NOTEBOOKS);
      };
    });
  } catch (e) {
    return INITIAL_NOTEBOOKS;
  }
}

export async function saveNotebook(notebook: Notebook): Promise<void> {
  try {
    const d = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = d.transaction('notebooks', 'readwrite');
      const store = transaction.objectStore('notebooks');
      const request = store.put(notebook);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('IndexedDB saveNotebook error:', e);
  }
}

export async function saveAllNotebooks(notebooks: Notebook[]): Promise<void> {
  try {
    const d = await getDB();
    const transaction = d.transaction('notebooks', 'readwrite');
    const store = transaction.objectStore('notebooks');
    for (const nb of notebooks) {
      store.put(nb);
    }
  } catch (e) {
    console.warn('IndexedDB saveAllNotebooks error:', e);
  }
}

export async function deleteNotebookFromDB(notebookId: string): Promise<void> {
  try {
    const d = await getDB();
    const transaction = d.transaction('notebooks', 'readwrite');
    const store = transaction.objectStore('notebooks');
    store.delete(notebookId);
  } catch (e) {
    console.warn('IndexedDB deleteNotebook error:', e);
  }
}
