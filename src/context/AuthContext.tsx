import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "../firebaseConfig";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  errorCode: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      },
      (err) => {
        console.error("Auth state error:", err);
        setError(err.message);
        setErrorCode((err as any)?.code || null);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const clearError = () => {
    setError(null);
    setErrorCode(null);
  };

  const handleAuthError = (err: any, fallbackMessage: string) => {
    console.error("Authentication Error:", err);
    const code = err.code || "";
    setErrorCode(code);

    if (code === "auth/popup-closed-by-user") {
      setError("Sign in popup was closed before completing.");
    } else if (code === "auth/unauthorized-domain") {
      const hostname = typeof window !== "undefined" ? window.location.hostname : "your domain";
      setError(
        `Firebase Error (auth/unauthorized-domain): "${hostname}" is not an authorized domain in your Firebase project.`
      );
    } else if (code === "auth/operation-not-allowed") {
      setError(
        "Provider not enabled: Google or Email/Password authentication is disabled in your Firebase project. Go to Firebase Console > Authentication > Sign-in method to enable it."
      );
    } else if (code === "auth/wrong-password" || code === "auth/user-not-found" || code === "auth/invalid-credential") {
      setError("Invalid email or password.");
    } else if (code === "auth/email-already-in-use") {
      setError("This email address is already registered. Please sign in instead.");
    } else if (code === "auth/weak-password") {
      setError("Password should be at least 6 characters.");
    } else if (code === "auth/invalid-email") {
      setError("Please provide a valid email address.");
    } else {
      setError(err.message || fallbackMessage);
    }
  };

  const signInWithGoogle = async () => {
    clearError();
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      handleAuthError(err, "Failed to sign in with Google.");
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    clearError();
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      handleAuthError(err, "Invalid email or password.");
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    clearError();
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      handleAuthError(err, "Failed to create account.");
      throw err;
    }
  };

  const signInAsGuest = async () => {
    clearError();
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      console.warn("Anonymous Sign In note:", err);
      handleAuthError(err, "Failed to start guest session.");
      throw err;
    }
  };

  const logout = async () => {
    clearError();
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error("Sign Out Error:", err);
      handleAuthError(err, "Failed to sign out.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        errorCode,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInAsGuest,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
