import React from "react";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { projectId } from "../firebaseConfig";

interface OperationNotAllowedAlertProps {
  onDismiss?: () => void;
}

export const OperationNotAllowedAlert: React.FC<OperationNotAllowedAlertProps> = ({ onDismiss }) => {
  const firebaseAuthProvidersUrl = projectId
    ? `https://console.firebase.google.com/project/${projectId}/authentication/providers`
    : "https://console.firebase.google.com/";

  return (
    <div
      id="operation-not-allowed-alert"
      className="rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 p-4 text-xs text-neutral-800 dark:text-neutral-200 shadow-sm transition-all space-y-2.5"
    >
      <div className="flex items-start gap-2.5">
        <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sky-900 dark:text-sky-200 text-sm">
              Enable Sign-In Method in Firebase
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
            In new Firebase projects, sign-in providers are disabled by default. You need to turn on <strong>Google</strong> or <strong>Email/Password</strong> in the Firebase Console:
          </p>

          <ol className="list-decimal pl-4 space-y-1 text-neutral-700 dark:text-neutral-300">
            <li>
              Go to{" "}
              <a
                href={firebaseAuthProvidersUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-sky-700 dark:text-sky-400 underline hover:text-sky-800 inline-flex items-center gap-0.5"
              >
                Authentication &gt; Sign-in method <ExternalLink className="w-3 h-3 inline" />
              </a>
            </li>
            <li>
              Click on <strong>Google</strong> (or <strong>Email/Password</strong>) in the provider list.
            </li>
            <li>
              Toggle the <strong>Enable</strong> switch to <strong>ON</strong>.
            </li>
            <li>
              Choose your project support email and click <strong>Save</strong>.
            </li>
          </ol>

          <div className="pt-1.5">
            <a
              href={firebaseAuthProvidersUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs shadow-xs transition-colors"
            >
              <span>Open Sign-in Method in Firebase</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
