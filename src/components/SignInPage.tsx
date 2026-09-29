import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Mail, Lock, Eye, EyeOff, Sparkles, AlertCircle, Sun, Moon, CheckCircle2 } from "lucide-react";
import { UnauthorizedDomainAlert } from "./UnauthorizedDomainAlert";
import { OperationNotAllowedAlert } from "./OperationNotAllowedAlert";

export const SignInPage: React.FC = () => {
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    error,
    errorCode,
    clearError,
  } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isUnauthorizedDomain =
    errorCode === "auth/unauthorized-domain" ||
    (error && error.toLowerCase().includes("unauthorized-domain"));

  const isOperationNotAllowed =
    errorCode === "auth/operation-not-allowed" ||
    (error && error.toLowerCase().includes("operation-not-allowed"));

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
    } catch (err: any) {
      if (
        err.code !== "auth/unauthorized-domain" &&
        err.code !== "auth/operation-not-allowed"
      ) {
        setLocalError(err.message || "Authentication failed. Please check your credentials.");
      }
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
    } catch (err: any) {
      if (
        err.code !== "auth/unauthorized-domain" &&
        err.code !== "auth/operation-not-allowed"
      ) {
        setLocalError(err.message || "Google sign in failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-between bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* Top Navbar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-amber-400 dark:text-neutral-950 flex items-center justify-center font-bold text-base shadow-sm">
            M
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-neutral-900 dark:text-white leading-none">
              MemoFlow
            </h1>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Fast, minimal Markdown notes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200/80 dark:border-neutral-800 p-6 md:p-8 space-y-6">
            {/* Header in Card */}
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {isSignUp ? "Create an account" : "Welcome to MemoFlow"}
              </h2>
              <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400">
                {isSignUp
                  ? "Sign up to start organizing and syncing your Markdown notes."
                  : "Sign in to access your notes, notebooks, and live cloud sync."}
              </p>
            </div>

            {/* Unauthorized Domain Alert (Specific to Vercel / unauthorized-domain errors) */}
            {isUnauthorizedDomain && (
              <UnauthorizedDomainAlert onDismiss={clearError} />
            )}

            {/* Operation Not Allowed Alert (Sign-in method disabled in Firebase) */}
            {isOperationNotAllowed && (
              <OperationNotAllowedAlert onDismiss={clearError} />
            )}

            {/* Standard Error Alert (for other errors) */}
            {!isUnauthorizedDomain && !isOperationNotAllowed && (localError || error) && (
              <div
                id="auth-error-alert"
                className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{localError || error}</span>
                </div>
              </div>
            )}

            {/* Google Sign In Button */}
            <div>
              <button
                id="google-sign-in-btn"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 font-medium text-sm hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-all shadow-xs disabled:opacity-60 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center my-3">
              <div className="flex-1 border-t border-neutral-200 dark:border-neutral-800" />
              <span className="px-3 text-xs text-neutral-400 uppercase tracking-wider font-medium">
                or with email
              </span>
              <div className="flex-1 border-t border-neutral-200 dark:border-neutral-800" />
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  <input
                    id="auth-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:bg-white dark:focus:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  <input
                    id="auth-password-input"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:bg-white dark:focus:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 p-0.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                id="submit-auth-form-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 font-medium text-sm rounded-xl transition-all shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting
                  ? "Please wait..."
                  : isSignUp
                    ? "Create Account"
                    : "Sign In"}
              </button>
            </form>

            {/* Switch Sign In / Sign Up */}
            <div className="pt-2 text-center text-xs text-neutral-500 dark:text-neutral-400">
              <button
                id="toggle-signup-mode-btn"
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setLocalError(null);
                  clearError();
                }}
                className="text-neutral-800 dark:text-neutral-200 font-semibold hover:underline"
              >
                {isSignUp
                  ? "Already have an account? Sign In"
                  : "Don't have an account? Create one"}
              </button>
            </div>
          </div>

          {/* Value Props / Highlights below */}
          <div className="mt-8 grid grid-cols-2 gap-3 text-xs text-neutral-600 dark:text-neutral-400">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/70 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Real-time Firestore Sync</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/70 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Split Markdown Preview</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/70 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Folders, Tags & Search</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/70 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Offline-ready Workspace</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-neutral-400 dark:text-neutral-500 border-t border-neutral-200/60 dark:border-neutral-800/60">
        MemoFlow &copy; {new Date().getFullYear()} &bull; Fast, minimal Markdown note-taking workspace
      </footer>
    </div>
  );
};
