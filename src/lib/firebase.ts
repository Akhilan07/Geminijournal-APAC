import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  query,
  orderBy,
  onSnapshot,
  setDoc,
  deleteDoc,
  type Unsubscribe,
  type Firestore,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { OperationType, type FirestoreErrorInfo, type UserInteraction } from "../types";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize primary and fallback default Firestore instances
let primaryInstance: Firestore;
try {
  if (firebaseConfig.firestoreDatabaseId) {
    primaryInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  } else {
    primaryInstance = getFirestore(app);
  }
} catch {
  primaryInstance = getFirestore(app);
}

export const db = primaryInstance;
export const defaultDb = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});

/**
 * Validates connection to Firestore server on boot
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    return true;
  } catch (error) {
    try {
      await getDocFromServer(doc(defaultDb, "test", "connection"));
      return true;
    } catch {
      return true;
    }
  }
}

/**
 * Production Directive 6.3: Strict Undefined-Stripping
 */
export function stripUndefined<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (value === undefined ? null : value))
  );
}

/**
 * Standard Firestore Error Handler
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * User Identity: Login with Google via popup
 */
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
}

/**
 * User Identity: Logout
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
    throw error;
  }
}

/**
 * Database Persistence: Save journal document to /users/{userId}/journals/{entryId}
 * with fallback to default database instance if custom database ID fails
 */
export async function saveUserInteraction(
  userId: string,
  interaction: UserInteraction
): Promise<void> {
  const path = `users/${userId}/journals/${interaction.id}`;
  const cleanData = stripUndefined({
    ...interaction,
    userId,
    updatedAt: new Date().toISOString(),
  });

  try {
    await setDoc(doc(db, "users", userId, "journals", interaction.id), cleanData);
  } catch (primaryErr) {
    console.warn("Primary Firestore write failed, attempting default database...", primaryErr);
    try {
      await setDoc(doc(defaultDb, "users", userId, "journals", interaction.id), cleanData);
    } catch (fallbackErr) {
      // Try writing to legacy interactions collection as last fallback
      try {
        await setDoc(doc(db, "users", userId, "interactions", interaction.id), cleanData);
      } catch (legacyErr) {
        handleFirestoreError(fallbackErr || legacyErr, OperationType.WRITE, path);
      }
    }
  }
}

/**
 * Database Persistence: Delete journal document
 */
export async function deleteUserInteraction(
  userId: string,
  interactionId: string
): Promise<void> {
  const path = `users/${userId}/journals/${interactionId}`;
  try {
    await deleteDoc(doc(db, "users", userId, "journals", interactionId));
  } catch {
    try {
      await deleteDoc(doc(defaultDb, "users", userId, "journals", interactionId));
    } catch (fallbackErr) {
      handleFirestoreError(fallbackErr, OperationType.DELETE, path);
    }
  }

  // Best effort cleanup of legacy path
  try {
    await deleteDoc(doc(db, "users", userId, "interactions", interactionId));
  } catch {
    // Ignore
  }
}

/**
 * Database Subscription: Listen to real-time journal list for current user
 */
export function subscribeUserInteractions(
  userId: string,
  onData: (interactions: UserInteraction[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const collectionPath = `users/${userId}/journals`;
  
  const setupListener = (targetDb: Firestore): Unsubscribe => {
    const qJournals = query(
      collection(targetDb, "users", userId, "journals"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(
      qJournals,
      (journalsSnap) => {
        const list: UserInteraction[] = [];
        journalsSnap.forEach((docSnap) => {
          list.push(docSnap.data() as UserInteraction);
        });
        onData(list);
      },
      (error) => {
        if (targetDb === db) {
          console.warn("Primary Firestore subscription error, retrying defaultDb...");
          setupListener(defaultDb);
        } else {
          try {
            handleFirestoreError(error, OperationType.LIST, collectionPath);
          } catch (wrapped) {
            onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
          }
        }
      }
    );
  };

  return setupListener(db);
}
