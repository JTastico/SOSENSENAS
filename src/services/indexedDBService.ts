
import { Sign } from '@/types/sign';

const DB_NAME = 'SignsDatabase';
const DB_VERSION = 1;
const STORE_NAME = 'signs';

export class IndexedDBService {
  private db: IDBDatabase | null = null;

  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  async addSign(sign: Omit<Sign, 'id'>): Promise<Sign> {
    if (!this.db) await this.initDB();
    
    const newSign: Sign = {
      ...sign,
      id: Date.now().toString(),
      createdAt: new Date()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(newSign);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(newSign);
    });
  }

  async getAllSigns(): Promise<Sign[]> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const signs = request.result.map(sign => ({
          ...sign,
          createdAt: new Date(sign.createdAt)
        }));
        resolve(signs);
      };
    });
  }

  async deleteSign(id: string): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSignByName(name: string): Promise<Sign | null> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('name');
      const request = index.get(name);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve({
            ...result,
            createdAt: new Date(result.createdAt)
          });
        } else {
          resolve(null);
        }
      };
    });
  }

  // Nueva función para eliminar múltiples señas
  async deleteSigns(ids: string[]): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      let deletedCount = 0;
      const totalToDelete = ids.length;

      if (totalToDelete === 0) {
        resolve();
        return;
      }

      ids.forEach(id => {
        const deleteRequest = store.delete(id);
        deleteRequest.onsuccess = () => {
          deletedCount++;
          if (deletedCount === totalToDelete) {
            resolve();
          }
        };
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });
    });
  }

  async saveSign(sign: Sign): Promise<void> {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(sign); // usar put en lugar de add para permitir sobrescribir

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const dbService = new IndexedDBService();

// Funciones de conveniencia exportadas
export const saveSigns = async (signs: Sign[]): Promise<void> => {
  for (const sign of signs) {
    await dbService.addSign(sign);
  }
};

export const loadSigns = async (): Promise<Sign[]> => {
  return await dbService.getAllSigns();
};

export const saveSign = async (sign: Sign): Promise<void> => {
  return await dbService.saveSign(sign);
};

export const deleteSigns = async (ids: string[]): Promise<void> => {
  return await dbService.deleteSigns(ids);
};
