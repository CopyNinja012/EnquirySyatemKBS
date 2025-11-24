const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Callable function: adminUpdateUserPassword
 * Called from frontend with httpsCallable.
 *
 * - Only works if caller is logged in.
 * - Only works if caller is an admin (role = "admin" in Firestore 'users' collection).
 * - Directly sets a new password in Firebase Auth for the given uid.
 */
exports.adminUpdateUserPassword = functions.https.onCall(
  async (data: { uid: any; newPassword: any; }, context: { auth: { uid: any; }; }) => {
    // 1. Must be signed in
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be signed in to call this function."
      );
    }

    const callerUid = context.auth.uid;

    // 2. Check caller is admin in Firestore
    const callerDoc = await admin
      .firestore()
      .collection("users")
      .doc(callerUid)
      .get();

    if (!callerDoc.exists || callerDoc.data().role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can change other users' passwords."
      );
    }

    // 3. Validate input data
    const { uid, newPassword } = data;

    if (!uid || typeof uid !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing or invalid 'uid'."
      );
    }

    if (
      !newPassword ||
      typeof newPassword !== "string" ||
      newPassword.length < 6
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Password must be at least 6 characters."
      );
    }

    // 4. Update password in Firebase Auth
    await admin.auth().updateUser(uid, { password: newPassword });

    // 5. Update metadata in Firestore
    const nowIso = new Date().toISOString();
    await admin
      .firestore()
      .collection("users")
      .doc(uid)
      .set(
        {
          passwordChangedAt: nowIso,
          updatedAt: nowIso,
        },
        { merge: true }
      );

    console.log(
      `✅ Admin ${callerUid} changed password for user ${uid} at ${nowIso}`
    );

    return { success: true };
  }
);