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
  if (status === "saving") {
    return (
      <div
        id="sync-status-saving"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 transition-colors"
        title="Syncing changes to Firestore..."
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
        <span className="whitespace-nowrap">Saving...</span>
      </div>
    );
  }

  if (status === "offline") {
    return (
      <div
        id="sync-status-offline"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-300 transition-colors"
        title="Offline. Changes are held locally and will sync once reconnected."
      >
        <WifiOff className="w-3.5 h-3.5 text-neutral-500" />
        <span className="whitespace-nowrap">Offline</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        id="sync-status-error"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 cursor-pointer hover:bg-rose-100 transition-colors"
        title={errorMessage || "Error syncing to Firestore. Click to retry."}
      >
        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
        <span className="whitespace-nowrap">Sync Error</span>
      </div>
    );
  }

  // Default 'saved'
  return (
    <div
      id="sync-status-saved"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 transition-colors"
      title="All changes saved to Firestore in real-time"
    >
      <Check className="w-3.5 h-3.5 text-emerald-600" />
      <span className="whitespace-nowrap">Saved</span>
    </div>
  );
};
