import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  TwitterAuthProvider,
  GithubAuthProvider,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/integrations/firebase/client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithProvider: (provider: "google" | "twitter" | "github") => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const providers = {
  google: new GoogleAuthProvider(),
  twitter: new TwitterAuthProvider(),
  github: new GithubAuthProvider(),
};

const MERCHANT_ROLE = "MERCHANT";

async function getProfileRole(uid: string): Promise<string | null> {
  const snap = await getDoc(doc(db, "profiles", uid));
  if (!snap.exists()) return null;
  const data = snap.data() as { role?: string };
  return data.role ?? null;
}

async function assertMerchant(uid: string): Promise<void> {
  const role = await getProfileRole(uid);
  if (role !== MERCHANT_ROLE) {
    await firebaseSignOut(auth);
    throw new Error(
      "This account is not registered as a merchant. Please sign up as a merchant to continue."
    );
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const role = await getProfileRole(u.uid);
          if (role !== MERCHANT_ROLE) {
            await firebaseSignOut(auth);
            setUser(null);
            setLoading(false);
            return;
          }
        } catch {
          await firebaseSignOut(auth);
          setUser(null);
          setLoading(false);
          return;
        }
      }
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(newUser, { displayName: fullName });
      await setDoc(doc(db, "profiles", newUser.uid), {
        full_name: fullName,
        role: MERCHANT_ROLE,
        created_at: serverTimestamp(),
      });
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { user: signedIn } = await signInWithEmailAndPassword(auth, email, password);
      await assertMerchant(signedIn.uid);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signInWithProviderFn = async (provider: "google" | "twitter" | "github") => {
    const result = await signInWithPopup(auth, providers[provider]);
    const existing = await getDoc(doc(db, "profiles", result.user.uid));

    if (!existing.exists()) {
      // First-time social sign-in -> register them as a merchant
      await setDoc(doc(db, "profiles", result.user.uid), {
        full_name: result.user.displayName,
        role: MERCHANT_ROLE,
        created_at: serverTimestamp(),
      });
      return;
    }

    const role = (existing.data() as { role?: string }).role;
    if (role !== MERCHANT_ROLE) {
      await firebaseSignOut(auth);
      throw new Error(
        "This account is not registered as a merchant. Please sign up as a merchant to continue."
      );
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signInWithProvider: signInWithProviderFn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
