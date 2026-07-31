'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

let placesCachePromise = null;

function loadPlaces() {
  if (!placesCachePromise) {
    placesCachePromise = fetch('/places/tanger_places.json')
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []);
  }
  return placesCachePromise;
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u0600-\u06ff]/g, '');
}

export default function PlaceAutocomplete({
  value,
  onChange,
  onPick,
  mode,
  category,
  placeholder,
  className,
}) {
  const [places, setPlaces] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    loadPlaces().then((list) => {
      if (mounted) setPlaces(list);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const suggestions = useMemo(() => {
    const q = norm(value);
    if (!q) return [];
    if (mode === 'name') {
      const pool = category ? places.filter((p) => p.category === category) : places;
      const seen = new Set();
      return pool
        .filter((p) => p.name && !seen.has(norm(p.name)) && seen.add(norm(p.name)))
        .filter((p) => norm(p.name).includes(q))
        .slice(0, 6);
    }
    const seen = new Set();
    return places
      .filter((p) => p.address && !seen.has(norm(p.address)) && seen.add(norm(p.address)))
      .filter((p) => norm(p.address).includes(q))
      .slice(0, 6);
  }, [places, value, mode, category]);

  const handlePick = (place) => {
    if (mode === 'name') {
      onChange(place.name);
      if (onPick) onPick(place);
    } else {
      onChange(place.address);
    }
    setOpen(false);
    setActive(-1);
  };

  const handleKey = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      if (active >= 0 && suggestions[active]) {
        e.preventDefault();
        const place = suggestions[active];
        const raw = mode === 'name' ? places.find((p) => p.name === place.name) : places.find((p) => p.address === place.address);
        if (raw) handlePick(raw);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <div className="relative" ref={wrapRef}>
      <input
        type="text"
        required
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        className={className}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 left-0 right-0 mt-1.5 max-h-60 overflow-y-auto rounded-xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 shadow-xl divide-y divide-ink-100 dark:divide-ink-800">
          {suggestions.map((p, i) => (
            <li key={mode + norm(mode === 'name' ? p.name : p.address) + i}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const raw = mode === 'name' ? places.find((x) => x.name === p.name) : places.find((x) => x.address === p.address);
                  if (raw) handlePick(raw);
                }}
                onMouseEnter={() => setActive(i)}
                className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 transition-colors ${
                  active === i ? 'bg-brand-50 dark:bg-ink-800' : ''
                }`}
              >
                <span className="text-emerald-600 dark:text-emerald-400 shrink-0">
                  {mode === 'name' ? '🏪' : '📍'}
                </span>
                <span className="text-sm text-ink-800 dark:text-ink-100 truncate">
                  {mode === 'name' ? p.name : p.address}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
