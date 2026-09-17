import React from "react";
import { SyncStatus } from "../types/note";
import { Check, Loader2, WifiOff, AlertCircle } from "lucide-react";

interface SyncStatusIndicatorProps {
  status: SyncStatus;
  errorMessage?: string | null;
  onRetry?: () => void;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  status,
  errorMessage,
  onRetry,
}) => {
  const baseClasses =
    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors";

  if (status === "saving") {
    return (
      <div
        id="sync-status-saving"
        className={`${baseClasses} bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20`}
        title="Syncing changes to Firestore..."
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400" />
        <span className="whitespace-nowrap">Saving...</span>
      </div>
    );
  }

  if (status === "offline") {
    return (
      <div
        id="sync-status-offline"
        className={`${baseClasses} bg-neutral-100 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700/60`}
        title="Offline. Changes are held locally and will sync once reconnected."
      >
        <WifiOff className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
        <span className="whitespace-nowrap">Offline</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <button
        id="sync-status-error"
        type="button"
        onClick={onRetry}
        className={`${baseClasses} bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 cursor-pointer`}
        title={errorMessage || "Error syncing to Firestore. Click to retry."}
      >
        <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
        <span className="whitespace-nowrap">Sync Error</span>
      </button>
    );
  }

  // Default 'saved'
  return (
    <div
      id="sync-status-saved"
      className={`${baseClasses} bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20`}
      title="All changes saved to Firestore in real-time"
    >
      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
      <span className="whitespace-nowrap">Saved</span>
    </div>
  );
};
