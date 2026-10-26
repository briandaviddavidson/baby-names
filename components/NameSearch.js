'use client';

import { useEffect, useId, useState } from 'react';
import { normalizeName, suggest } from '../lib/data-client.js';

// A name search box with suggestions from the name shards (a native datalist, so
// it works with screen readers and phone keyboards). Calls onSearch on submit.
export default function NameSearch({ initial = '', onSearch, label = 'Search a name' }) {
  const id = useId();
  const [text, setText] = useState(initial);
  const [options, setOptions] = useState([]);

  useEffect(() => setText(initial), [initial]);

  useEffect(() => {
    let live = true;
    suggest(text)
      .then((names) => live && setOptions(names))
      .catch(() => live && setOptions([]));
    return () => {
      live = false;
    };
  }, [text]);

  const submit = (value) => {
    const name = normalizeName(value);
    if (name) onSearch(name);
  };

  return (
    <form
      className="name-search"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        submit(text);
      }}
    >
      <label htmlFor={`${id}-input`}>{label}</label>
      <div className="name-search-row">
        <input
          id={`${id}-input`}
          type="search"
          list={`${id}-list`}
          value={text}
          autoComplete="off"
          autoCapitalize="words"
          spellCheck={false}
          placeholder="e.g. Jordan"
          onChange={(e) => {
            setText(e.target.value);
            // Picking a suggestion from the list (no typing input type) searches right away.
            const picked = !e.nativeEvent.inputType || e.nativeEvent.inputType === 'insertReplacementText';
            if (picked && options.includes(e.target.value)) submit(e.target.value);
          }}
        />
        <button type="submit">Show</button>
      </div>
      <datalist id={`${id}-list`}>
        {options.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
    </form>
  );
}
