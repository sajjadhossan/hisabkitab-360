import { useState, useEffect, useRef } from 'react';

/**
 * Form Draft Auto-Persistence Hook
 * --------------------------------
 * Saves in-progress form inputs to sessionStorage so users never lose entered text,
 * prices, or calculations if they accidentally close a modal or navigate away.
 */
export function useFormDraft(draftKey, initialValues = {}) {
  const [formData, setFormData] = useState(() => {
    if (typeof window === 'undefined') return initialValues;
    try {
      const saved = sessionStorage.getItem(`hk360_draft_${draftKey}`);
      return saved ? { ...initialValues, ...JSON.parse(saved) } : initialValues;
    } catch {
      return initialValues;
    }
  });

  const timerRef = useRef(null);

  // Debounced auto-save to sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        sessionStorage.setItem(`hk360_draft_${draftKey}`, JSON.stringify(formData));
      } catch (err) {
        console.debug('Failed to write form draft:', err);
      }
    }, 250);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [draftKey, formData]);

  const updateField = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const clearDraft = () => {
    setFormData(initialValues);
    try {
      sessionStorage.removeItem(`hk360_draft_${draftKey}`);
    } catch {}
  };

  return [formData, updateField, clearDraft, setFormData];
}
