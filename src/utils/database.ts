import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  Timestamp,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Collection names
const COLLECTIONS = {
  ENQUIRIES: 'enquiries',
  USERS: 'users',
  ADVERTISEMENTS: 'advertisements',
};

// ✅ Firebase Database API
export const firestoreDB = {
  // 🧾 Enquiries
  enquiries: {
    async getAll(): Promise<any[]> {
      try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.ENQUIRIES));
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('✅ Loaded', data.length, 'enquiries from Firestore');
        return data;
      } catch (error) {
        console.error('❌ Error fetching enquiries:', error);
        return [];
      }
    },

    async add(enquiry: any): Promise<{ success: boolean; id?: string; error?: any }> {
      try {
        const docRef = await addDoc(collection(db, COLLECTIONS.ENQUIRIES), {
          ...enquiry,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        console.log('✅ Enquiry added with ID:', docRef.id);
        return { success: true, id: docRef.id };
      } catch (error) {
        console.error('❌ Error adding enquiry:', error);
        return { success: false, error };
      }
    },

    async update(id: string, updates: any): Promise<{ success: boolean; error?: any }> {
      try {
        const docRef = doc(db, COLLECTIONS.ENQUIRIES, id);
        await updateDoc(docRef, {
          ...updates,
          updatedAt: Timestamp.now(),
        });
        console.log('✅ Enquiry updated:', id);
        return { success: true };
      } catch (error) {
        console.error('❌ Error updating enquiry:', error);
        return { success: false, error };
      }
    },

    async delete(id: string): Promise<{ success: boolean; error?: any }> {
      try {
        await deleteDoc(doc(db, COLLECTIONS.ENQUIRIES, id));
        console.log('✅ Enquiry deleted:', id);
        return { success: true };
      } catch (error) {
        console.error('❌ Error deleting enquiry:', error);
        return { success: false, error };
      }
    },
  },

  // 👤 Users
  users: {
    async getAll(): Promise<any[]> {
      try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('❌ Error fetching users:', error);
        return [];
      }
    },

    async add(user: any): Promise<{ success: boolean; id?: string; error?: any }> {
      try {
        const docRef = await addDoc(collection(db, COLLECTIONS.USERS), {
          ...user,
          createdAt: Timestamp.now(),
        });
        return { success: true, id: docRef.id };
      } catch (error) {
        console.error('❌ Error adding user:', error);
        return { success: false, error };
      }
    },

    async update(id: string, updates: any): Promise<{ success: boolean; error?: any }> {
      try {
        await updateDoc(doc(db, COLLECTIONS.USERS, id), updates);
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    },

    async delete(id: string): Promise<{ success: boolean; error?: any }> {
      try {
        await updateDoc(doc(db, COLLECTIONS.USERS, id), { isActive: false });
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    },
  },

  // 📢 Advertisements
  advertisements: {
    async getAll(): Promise<any[]> {
      try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.ADVERTISEMENTS));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('❌ Error fetching advertisements:', error);
        return [];
      }
    },

    async add(advertisement: any): Promise<{ success: boolean; id?: string; error?: any }> {
      try {
        const docRef = await addDoc(collection(db, COLLECTIONS.ADVERTISEMENTS), {
          ...advertisement,
          importedAt: Timestamp.now(),
        });
        return { success: true, id: docRef.id };
      } catch (error) {
        return { success: false, error };
      }
    },

    async bulkAdd(advertisements: any[]): Promise<{ success: boolean; error?: any }> {
      try {
        const batch = writeBatch(db);
        const collectionRef = collection(db, COLLECTIONS.ADVERTISEMENTS);

        advertisements.forEach((ad) => {
          const docRef = doc(collectionRef);
          batch.set(docRef, {
            ...ad,
            importedAt: Timestamp.now(),
          });
        });

        await batch.commit();
        console.log('✅ Bulk added', advertisements.length, 'advertisements');
        return { success: true };
      } catch (error) {
        console.error('❌ Bulk add error:', error);
        return { success: false, error };
      }
    },

    async update(id: string, updates: any): Promise<{ success: boolean; error?: any }> {
      try {
        await updateDoc(doc(db, COLLECTIONS.ADVERTISEMENTS, id), updates);
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    },

    async delete(id: string): Promise<{ success: boolean; error?: any }> {
      try {
        await deleteDoc(doc(db, COLLECTIONS.ADVERTISEMENTS, id));
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    },
  },
};

// ✅ Export default for convenience
export default firestoreDB;