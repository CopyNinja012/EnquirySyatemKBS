import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

/* ─────────────────────────────────────────────
   Collection names
─────────────────────────────────────────────── */
const COLLECTIONS = {
  ENQUIRIES: "enquiries",
  USERS: "users",
  ADVERTISEMENTS: "advertisements",
  PAYMENTS: "payments",
};

/* ─────────────────────────────────────────────
   Firestore Database API
─────────────────────────────────────────────── */
export const firestoreDB = {
  /* 🧾 ENQUIRIES  */
  enquiries: {
    async getAll(): Promise<any[]> {
      try {
        const snap = await getDocs(collection(db, COLLECTIONS.ENQUIRIES));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        console.log("✅ Loaded", data.length, "enquiries from Firestore");
        return data;
      } catch (error) {
        console.error("❌ Error fetching enquiries:", error);
        return [];
      }
    },

    async add(
      enquiry: any
    ): Promise<{ success: boolean; id?: string; error?: any }> {
      try {
        // createdAt / updatedAt are already set in storageUtils.saveEnquiry
        const docRef = await addDoc(collection(db, COLLECTIONS.ENQUIRIES), {
          ...enquiry,
        });
        console.log("✅ Enquiry added with ID:", docRef.id);
        return { success: true, id: docRef.id };
      } catch (error) {
        console.error("❌ Error adding enquiry:", error);
        return { success: false, error };
      }
    },

    async update(
      id: string,
      updates: any
    ): Promise<{ success: boolean; error?: any }> {
      try {
        // updatedAt is already set in storageUtils.updateEnquiry
        await updateDoc(doc(db, COLLECTIONS.ENQUIRIES, id), {
          ...updates,
        });
        console.log("✅ Enquiry updated:", id);
        return { success: true };
      } catch (error) {
        console.error("❌ Error updating enquiry:", error);
        return { success: false, error };
      }
    },

    async delete(
      id: string
    ): Promise<{ success: boolean; error?: any }> {
      try {
        await deleteDoc(doc(db, COLLECTIONS.ENQUIRIES, id));
        console.log("✅ Enquiry deleted:", id);
        return { success: true };
      } catch (error) {
        console.error("❌ Error deleting enquiry:", error);
        return { success: false, error };
      }
    },
  },

  /* 👤 USERS  */
  users: {
    async getAll(): Promise<any[]> {
      try {
        const snap = await getDocs(collection(db, COLLECTIONS.USERS));
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (error) {
        console.error("❌ Error fetching users:", error);
        return [];
      }
    },

    async add(
      user: any
    ): Promise<{ success: boolean; id?: string; error?: any }> {
      try {
        const docRef = await addDoc(collection(db, COLLECTIONS.USERS), {
          ...user,
          createdAt: Timestamp.now(),
        });
        return { success: true, id: docRef.id };
      } catch (error) {
        console.error("❌ Error adding user:", error);
        return { success: false, error };
      }
    },

    async update(
      id: string,
      updates: any
    ): Promise<{ success: boolean; error?: any }> {
      try {
        await updateDoc(doc(db, COLLECTIONS.USERS, id), updates);
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    },

    async delete(
      id: string
    ): Promise<{ success: boolean; error?: any }> {
      try {
        await updateDoc(doc(db, COLLECTIONS.USERS, id), { isActive: false });
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    },
  },

  /* 📢 ADVERTISEMENTS  */
  advertisements: {
    async getAll(): Promise<any[]> {
      try {
        const snap = await getDocs(
          collection(db, COLLECTIONS.ADVERTISEMENTS)
        );
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (error) {
        console.error("❌ Error fetching advertisements:", error);
        return [];
      }
    },

    async add(
      ad: any
    ): Promise<{ success: boolean; id?: string; error?: any }> {
      try {
        const docRef = await addDoc(
          collection(db, COLLECTIONS.ADVERTISEMENTS),
          {
            ...ad,
            importedAt: Timestamp.now(),
          }
        );
        return { success: true, id: docRef.id };
      } catch (error) {
        console.error("❌ Error adding advertisement:", error);
        return { success: false, error };
      }
    },

    async bulkAdd(
      advertisements: any[]
    ): Promise<{ success: boolean; error?: any }> {
      try {
        const batch = writeBatch(db);
        const ref = collection(db, COLLECTIONS.ADVERTISEMENTS);
        advertisements.forEach((ad) => {
          const docRef = doc(ref);
          batch.set(docRef, { ...ad, importedAt: Timestamp.now() });
        });
        await batch.commit();
        console.log("✅ Bulk added", advertisements.length, "advertisements");
        return { success: true };
      } catch (error) {
        console.error("❌ Bulk add error:", error);
        return { success: false, error };
      }
    },

    async update(
      id: string,
      updates: any
    ): Promise<{ success: boolean; error?: any }> {
      try {
        await updateDoc(doc(db, COLLECTIONS.ADVERTISEMENTS, id), updates);
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    },

    async delete(
      id: string
    ): Promise<{ success: boolean; error?: any }> {
      try {
        await deleteDoc(doc(db, COLLECTIONS.ADVERTISEMENTS, id));
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    },
  },

  /* 💳 PAYMENTS  */
  payments: {
    async getAll(): Promise<any[]> {
      try {
        const snap = await getDocs(collection(db, COLLECTIONS.PAYMENTS));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        console.log("✅ Loaded", data.length, "payments from Firestore");
        return data;
      } catch (error) {
        console.error("❌ Error fetching payments:", error);
        return [];
      }
    },

    async add(
      payment: any
    ): Promise<{ success: boolean; id?: string; error?: any }> {
      try {
        // createdAt is already set in storageUtils.savePayment
        const docRef = await addDoc(collection(db, COLLECTIONS.PAYMENTS), {
          ...payment,
        });
        console.log("✅ Payment added:", docRef.id);
        return { success: true, id: docRef.id };
      } catch (error) {
        console.error("❌ Error adding payment:", error);
        return { success: false, error };
      }
    },

    async update(
      id: string,
      updates: any
    ): Promise<{ success: boolean; error?: any }> {
      try {
        const ref = doc(db, COLLECTIONS.PAYMENTS, id);
        await updateDoc(ref, updates); // updatedAt can be added by caller if needed
        console.log("✅ Payment updated:", id);
        return { success: true };
      } catch (error) {
        console.error("❌ Error updating payment:", error);
        return { success: false, error };
      }
    },

    async delete(
      id: string
    ): Promise<{ success: boolean; error?: any }> {
      try {
        await deleteDoc(doc(db, COLLECTIONS.PAYMENTS, id));
        console.log("✅ Payment deleted:", id);
        return { success: true };
      } catch (error) {
        console.error("❌ Error deleting payment:", error);
        return { success: false, error };
      }
    },
  },
};

/* ─────────────────────────────────────────────
   Default export
─────────────────────────────────────────────── */
export default firestoreDB;