// The name being explored, kept in the URL (#name=Emma) so a view can be shared,
// and shared by every chart that searches names.
const EVENT = 'names:change';

export const DEFAULT_NAME = 'Jordan';

export function currentName() {
  return new URLSearchParams(window.location.hash.slice(1)).get('name') || DEFAULT_NAME;
}

export function setName(name) {
  history.replaceState(null, '', `#name=${encodeURIComponent(name)}`);
  window.dispatchEvent(new Event(EVENT));
}

// Calls onChange with the current name now and whenever it changes. Returns an
// unsubscribe function.
export function watchName(onChange) {
  const update = () => onChange(currentName());
  update();
  window.addEventListener(EVENT, update);
  window.addEventListener('hashchange', update);
  return () => {
    window.removeEventListener(EVENT, update);
    window.removeEventListener('hashchange', update);
  };
}
