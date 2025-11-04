import React, { useEffect, useRef } from "react";

export default function ContactModal({ open, onClose, onSubmit }) {
  const overlayRef = useRef(null);
  const firstInputRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      // focus first field for accessibility
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      onMouseDown={(e) => {
        // close when clicking outside modal content
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* modal card */}
      <div className="relative z-10 w-full max-w-xl mx-4 bg-white dark:bg-[#071022] rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="flex items-start justify-between">
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Contact Us
          </h3>
          <button
            onClick={onClose}
            aria-label="Close contact form"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-full p-1"
          >
            ✕
          </button>
        </div>

        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Drop us a message and we’ll get back to you soon.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            // gather simple form data and call parent handler
            const fd = new FormData(e.target);
            const payload = {
              name: fd.get("name"),
              email: fd.get("email"),
              message: fd.get("message"),
            };
            onSubmit(payload);
          }}
        >
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              ref={firstInputRef}
              name="name"
              required
              className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0b1220] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0b1220] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Message
            </label>
            <textarea
              name="message"
              required
              rows="4"
              className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0b1220] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Tell us what's up..."
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700"
            >
              Send Message
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
