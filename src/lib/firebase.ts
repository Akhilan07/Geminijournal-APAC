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
  where,
  orderBy,
  onSnapshot,
  setDoc,
  deleteDoc,
  type Unsubscribe,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { OperationType, type FirestoreErrorInfo, type UserInteraction } from "../types";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Bind Firestore using the custom firestoreDatabaseId from configuration
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google Provider custom parameters
googleProvider.setCustomParameters({
  prompt: "select_account",
});

/**
 * Validates connection to Firestore server on boot as mandated by skill guidelines
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firestore client is offline. Checking network or credentials.");
      return false;
    }
    // Missing permissions or not-found on dummy doc is normal, connectivity established
    return true;
  }
}

/**
 * Production Directive 6.3: Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
 * Strips all undefined properties recursively before passing to Firestore
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
 * Standard Firestore Error Handler as mandated by Firebase Integration skill
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
 * (Adheres to Skill Rule 2: Always scope user journal writes strictly under users/{uid}/journals/{entryId})
 */
export async function saveUserInteraction(
  userId: string,
  interaction: UserInteraction
): Promise<void> {
  const path = `users/${userId}/journals/${interaction.id}`;
  try {
    const cleanData = stripUndefined({
      ...interaction,
      userId,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, "users", userId, "journals", interaction.id), cleanData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
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
    // Also cleanup legacy interactions collection if document existed there
    try {
      await deleteDoc(doc(db, "users", userId, "interactions", interactionId));
    } catch {
      // Ignore if not present in legacy collection
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
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
  try {
    const qJournals = query(
      collection(db, "users", userId, "journals"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(
      qJournals,
      (journalsSnap) => {
        const list: UserInteraction[] = [];
        journalsSnap.forEach((docSnap) => {
          list.push(docSnap.data() as UserInteraction);
        });

        // Also check legacy interactions collection if journals is empty
        if (list.length === 0) {
          const qInteractions = query(
            collection(db, "users", userId, "interactions"),
            orderBy("createdAt", "desc")
          );
          onSnapshot(
            qInteractions,
            (interactionsSnap) => {
              const legacyList: UserInteraction[] = [];
              interactionsSnap.forEach((docSnap) => {
                legacyList.push(docSnap.data() as UserInteraction);
              });
              onData(legacyList);
            },
            () => onData(list)
          );
        } else {
          onData(list);
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, collectionPath);
        } catch (wrapped) {
          onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}
