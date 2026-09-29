import React, { useState } from "react";
import { AlertTriangle, ExternalLink, Copy, Check, ShieldAlert } from "lucide-react";
import { projectId } from "../firebaseConfig";

interface UnauthorizedDomainAlertProps {
  onDismiss?: () => void;
}

export const UnauthorizedDomainAlert: React.FC<UnauthorizedDomainAlertProps> = ({ onDismiss }) => {
  const [copied, setCopied] = useState(false);
  const currentDomain =
    typeof window !== "undefined" && window.location.hostname
      ? window.location.hostname
      : "meno-webapp.vercel.app";

  const handleCopyDomain = async () => {
    try {
      await navigator.clipboard.writeText(currentDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const firebaseConsoleUrl = projectId
    ? `https://console.firebase.google.com/project/${projectId}/authentication/settings`
    : "https://console.firebase.google.com/";

  return (
    <div
      id="unauthorized-domain-alert"
      className="rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs text-neutral-800 dark:text-neutral-200 shadow-sm transition-all"
    >
      <div className="flex items-start gap-2.5">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
              Action Required: Authorize Domain in Firebase
            </h4>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 text-[11px]"
              >
                Dismiss
              </button>
            )}
          </div>

          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
            Firebase Authentication security blocks sign-ins from domains that are not explicitly authorized. Your current domain (
            <span className="font-mono font-semibold text-neutral-900 dark:text-white bg-amber-200/60 dark:bg-amber-900/60 px-1 py-0.5 rounded">
              {currentDomain}
            </span>
            ) must be added to your Firebase project&apos;s authorized domains.
          </p>

          {/* Quick Domain Copy Box */}
          <div className="flex items-center gap-2 p-2 bg-white dark:bg-neutral-900 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="font-mono text-xs text-neutral-800 dark:text-neutral-200 truncate flex-1 font-medium">
              {currentDomain}
            </div>
            <button
              type="button"
              onClick={handleCopyDomain}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-[11px] font-medium transition-colors shrink-0"
              title="Copy current domain to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Copy Domain</span>
                </>
              )}
            </button>
          </div>

          {/* 3 Step Guide */}
          <div className="pt-1 text-[11.5px] space-y-1 text-neutral-600 dark:text-neutral-400">
            <p className="font-medium text-neutral-800 dark:text-neutral-200">How to authorize in 30 seconds:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>
                Open{" "}
                <a
                  href={firebaseConsoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-amber-700 dark:text-amber-400 underline hover:text-amber-800 inline-flex items-center gap-0.5"
                >
                  Firebase Console Settings <ExternalLink className="w-3 h-3 inline" />
                </a>
              </li>
              <li>
                Scroll down to the <strong className="text-neutral-800 dark:text-neutral-200">Authorized domains</strong> section and click <strong className="text-neutral-800 dark:text-neutral-200">Add domain</strong>
              </li>
              <li>
                Paste <code className="bg-amber-100 dark:bg-neutral-800 px-1 py-0.5 rounded text-neutral-800 dark:text-neutral-200">{currentDomain}</code> and click <strong className="text-neutral-800 dark:text-neutral-200">Save</strong>.
              </li>
            </ol>
          </div>

          <div className="pt-1">
            <a
              href={firebaseConsoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-neutral-950 font-medium text-xs shadow-xs transition-colors"
            >
              <span>Go to Firebase Console Settings</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
