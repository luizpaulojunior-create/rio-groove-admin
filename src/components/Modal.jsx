import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-2xl" }) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto"
          >
            <div className="min-h-screen px-4 text-center">
              {/* This element is to trick the browser into centering the modal contents. */}
              <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={`inline-block w-full ${maxWidth} p-6 my-8 text-left align-middle bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl shadow-xl transform transition-all relative z-50`}
              >
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-border)]">
                  <h3 className="text-xl font-heading tracking-wide text-white">
                    {title}
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-[var(--color-text-muted)] hover:text-white transition-colors p-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)]"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                  {children}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
