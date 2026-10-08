/**
 * Fast Event Delegation Utility
 * ------------------------------
 * Instead of mounting separate onClick closures onto hundreds of DOM nodes,
 * attaches a single delegated listener to the parent container.
 * 
 * Usage:
 * <div onClick={createDelegatedHandler({
 *   'add-to-cart': (id, e) => handleAddToCart(id),
 *   'delete-item': (id, e) => handleDelete(id)
 * })}>
 *   <button data-action="add-to-cart" data-id="p-123">Add</button>
 * </div>
 */

export function createDelegatedHandler(actionMap = {}) {
  return function delegatedHandler(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;

    const action = target.getAttribute('data-action');
    const id = target.getAttribute('data-id');
    const extra = target.getAttribute('data-extra');

    if (action && typeof actionMap[action] === 'function') {
      actionMap[action](id, event, extra);
    }
  };
}
