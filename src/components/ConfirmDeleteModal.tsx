import React from "react";
import { Trash2, AlertTriangle, X, FolderX } from "lucide-react";

export type DeleteTarget =
  | {
      type: "note";
      id: string;
      title: string;
    }
  | {
      type: "folder";
      name: string;
      notesCount: number;
    }
  | null;

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  target: DeleteTarget;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
  isDeleting?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  target,
  onConfirm,
  onClose,
  isDeleting = false,
}) => {
  if (!isOpen || !target) return null;

  return (
    <div
      id="confirm-delete-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div
        id="confirm-delete-dialog"
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 flex items-start justify-between gap-3 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              {target.type === "note" ? (
                <Trash2 className="w-5 h-5" />
              ) : (
                <FolderX className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900 leading-tight">
                {target.type === "note" ? "Delete Note" : "Delete Folder"}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {target.type === "note"
                  ? "This action cannot be undone"
                  : "Remove folder categorization"}
              </p>
            </div>
          </div>
          <button
            id="close-delete-modal-btn"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors disabled:opacity-50"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 text-sm text-neutral-600 space-y-3">
          {target.type === "note" ? (
            <div>
              <p className="leading-relaxed">
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-neutral-900 break-all">
                  &ldquo;{target.title || "Untitled Note"}&rdquo;
                </span>
                ?
              </p>
              <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-rose-50/80 border border-rose-100 text-xs text-rose-700">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>
                  The note and its revision history will be permanently erased.
                </span>
              </div>
            </div>
          ) : (
            <div>
              <p className="leading-relaxed">
                Are you sure you want to delete the folder{" "}
                <span className="font-semibold text-neutral-900">
                  &ldquo;{target.name}&rdquo;
                </span>
                ?
              </p>
              {target.notesCount > 0 ? (
                <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200/80 text-xs text-amber-800 space-y-1">
                  <div className="font-medium flex items-center gap-1.5">
                    <span>
                      📁 {target.notesCount}{" "}
                      {target.notesCount === 1 ? "note" : "notes"} inside
                    </span>
                  </div>
                  <p className="text-amber-700 leading-normal">
                    Don&apos;t worry: your notes will{" "}
                    <strong>not be deleted</strong>. They will safely be moved
                    to the <span className="font-semibold">General</span>{" "}
                    folder.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-neutral-500 mt-2">
                  This folder is currently empty and will be removed from your
                  sidebar.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-end gap-2.5">
          <button
            id="cancel-delete-btn"
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200/60 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            id="confirm-delete-action-btn"
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {target.type === "note" ? "Delete Note" : "Delete Folder"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
