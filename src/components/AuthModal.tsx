import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInAsGuest,
    logout,
    error,
    clearError,
  } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email || !password) {
      setLocalError("Please enter both email and password.");
      return;
    }

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      setLocalError(err.message || "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    clearError();
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setLocalError(err.message || "Google sign in failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestSession = async () => {
    setLocalError(null);
    clearError();
    setIsSubmitting(true);
    try {
      await signInAsGuest();
      onClose();
    } catch (err: any) {
      if (
        err.message &&
        (err.message.includes("Anonymous authentication is disabled") ||
          err.message.includes("admin-restricted-operation"))
      ) {
        setLocalError(
          "Anonymous authentication is disabled in Firebase for this project. You can continue using the Local Workspace (saved in this browser), or sign in with Google / Email to sync to the cloud.",
        );
      } else {
        setLocalError(err.message || "Guest sign in failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        id="auth-modal-dialog"
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-amber-400 flex items-center justify-center font-bold text-sm">
              M
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900">
                {user
                  ? "Account Management"
                  : isSignUp
                    ? "Create MemoFlow Account"
                    : "Sign In to MemoFlow"}
              </h2>
              <p className="text-xs text-neutral-500">
                {user
                  ? `Signed in as ${user.email || "Anonymous Guest"}`
                  : "Sync notes in real-time across devices"}
              </p>
            </div>
          </div>
          <button
            id="close-auth-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {(error || localError) && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{localError || error}</span>
            </div>
          )}

          {user ? (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 text-neutral-900 flex items-center justify-center text-xl font-bold">
                {user.email ? user.email[0].toUpperCase() : "G"}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {user.email || "Guest User (Anonymous)"}
                </p>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                  UID: {user.uid.slice(0, 12)}...
                </p>
                {user.isAnonymous && (
                  <p className="mt-2 text-xs text-amber-800 bg-amber-50 p-2 rounded-md border border-amber-200">
                    You are in Guest Mode. Notes are synced to Firestore under
                    your temporary session. Sign in with Google or Email to bind
                    notes permanently.
                  </p>
                )}
              </div>
              <div className="pt-2 flex flex-col gap-2">
                {user.isAnonymous && (
                  <button
                    id="upgrade-google-btn"
                    onClick={handleGoogleSignIn}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-neutral-300 text-neutral-800 font-medium text-sm hover:bg-neutral-50 transition-colors"
                  >
                    Link with Google Account
                  </button>
                )}
                <button
                  id="sign-out-btn"
                  onClick={async () => {
                    await logout();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Google Sign In */}
              <button
                id="google-sign-in-btn"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-neutral-300 bg-white text-neutral-700 font-medium text-sm hover:bg-neutral-50 transition-all shadow-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center my-3">
                <div className="flex-1 border-t border-neutral-200"></div>
                <span className="px-3 text-xs text-neutral-400 uppercase tracking-wider">
                  or with email
                </span>
                <div className="flex-1 border-t border-neutral-200"></div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                    <input
                      id="auth-email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                    <input
                      id="auth-password-input"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <button
                  id="submit-auth-form-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-sm rounded-xl transition-colors shadow-xs"
                >
                  {isSubmitting
                    ? "Please wait..."
                    : isSignUp
                      ? "Create Account"
                      : "Sign In"}
                </button>
              </form>

              <div className="pt-2 flex items-center justify-between text-xs text-neutral-500">
                <button
                  id="toggle-signup-mode-btn"
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setLocalError(null);
                  }}
                  className="hover:text-neutral-900 hover:underline"
                >
                  {isSignUp
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Sign up"}
                </button>
              </div>

              {/* Instant Guest Mode */}
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <button
                  id="guest-session-btn"
                  type="button"
                  onClick={handleGuestSession}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-neutral-600 bg-neutral-100 hover:bg-neutral-200 text-xs font-medium transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Try Instant Guest Session (No password required)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
