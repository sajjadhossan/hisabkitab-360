/**
 * Enter-to-Next Input Navigation Helper
 * Enables rapid checkout and keyboard-only item/data entry
 */

export const attachEnterKeyNavigation = (containerElement) => {
  if (!containerElement) return () => {};

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.altKey) return;

    const target = e.target;
    // Don't intercept textareas or submit buttons where Enter has intended behavior
    if (!target || target.tagName === 'TEXTAREA' || target.type === 'submit') return;

    const focusableSelectors = [
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'button:not([disabled]):not([tabindex="-1"])'
    ].join(', ');

    const elements = Array.from(containerElement.querySelectorAll(focusableSelectors))
      .filter(el => el.offsetParent !== null); // only visible elements

    const currentIndex = elements.indexOf(target);
    if (currentIndex > -1 && currentIndex < elements.length - 1) {
      e.preventDefault();
      const nextEl = elements[currentIndex + 1];
      nextEl.focus();
      if (nextEl.select && typeof nextEl.select === 'function') {
        nextEl.select();
      }
    }
  };

  containerElement.addEventListener('keydown', handleKeyDown);
  return () => {
    containerElement.removeEventListener('keydown', handleKeyDown);
  };
};
