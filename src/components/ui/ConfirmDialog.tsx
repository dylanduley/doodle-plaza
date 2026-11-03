"use client";

import { useEffect, useId, useRef } from "react";

export type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
};

/** Small "are you sure?" box for actions that throw work away. */
export function ConfirmDialog({ request, onClose }: { request: ConfirmRequest | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement | null>(null);
  const id = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (request && !dialog.open) dialog.showModal();
    if (!request && dialog.open) dialog.close();
  }, [request]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-message`}
      className="confirm-dialog"
      onClose={onClose}
      // click on the backdrop closes it
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {request && (
        <div className="flex flex-col gap-3 p-5">
          <h2 id={`${id}-title`} className="text-lg font-extrabold">
            {request.title}
          </h2>
          <p id={`${id}-message`} className="text-muted">
            {request.message}
          </p>
          <div className="mt-1 flex flex-wrap justify-end gap-2">
            <button type="button" className="btn" onClick={onClose} autoFocus>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                request.onConfirm();
                onClose();
              }}
            >
              {request.confirmLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
