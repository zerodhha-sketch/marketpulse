"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type ScopeUser = {
  _id: string;
  clientId?: string;
  email?: string;
  fullName?: string;
};

const DEBOUNCE_MS = 320;
const LIST_CAP = 80;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function matchesQuery(u: ScopeUser, q: string): boolean {
  if (!q) return true;
  const hay = [u._id, u.clientId, u.email, u.fullName]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());
  return hay.some((s) => s.includes(q));
}

export function ScopeUserBar({
  scopeUserId,
  onScopeChange,
  onLoad,
  users,
}: {
  scopeUserId: string;
  onScopeChange: (v: string) => void;
  onLoad: () => void;
  users: ScopeUser[];
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, DEBOUNCE_MS);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const list = q ? users.filter((u) => matchesQuery(u, q)) : users;
    return list.slice(0, LIST_CAP);
  }, [users, debouncedSearch]);

  const selected = useMemo(
    () => (scopeUserId ? users.find((u) => u._id === scopeUserId) : null),
    [users, scopeUserId],
  );

  const selectUser = useCallback(
    (id: string) => {
      onScopeChange(id);
      onLoad();
    },
    [onScopeChange, onLoad],
  );

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {selected ? (
        <div className="mb-3 flex items-baseline gap-x-2 text-sm">
          <span className="text-slate-500">Editing:</span>
          <span className="font-semibold text-slate-900">
            {selected.fullName || selected.clientId || "User"}
          </span>
          {selected.email ? (
            <span className="text-slate-500">· {selected.email}</span>
          ) : null}
        </div>
      ) : (
        <p className="mb-3 text-sm text-slate-500">Select a user to edit their orders.</p>
      )}

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="block w-full max-w-xl rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        placeholder="Search by name, email or client ID…"
        autoComplete="off"
      />

      <ul className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/80">
        {filtered.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-slate-500">No users match.</li>
        ) : (
          filtered.map((u) => {
            const active = scopeUserId === u._id;
            const title = u.fullName || u.clientId || u.email || u._id;
            return (
              <li key={u._id} className="border-b border-slate-100 last:border-b-0">
                <button
                  type="button"
                  onClick={() => selectUser(u._id)}
                  className={`flex w-full flex-col items-start px-3 py-2.5 text-left text-sm transition hover:bg-white ${
                    active ? "bg-emerald-50" : ""
                  }`}
                >
                  <span className={`font-medium ${active ? "text-emerald-900" : "text-slate-900"}`}>
                    {title}
                  </span>
                  <span className="mt-0.5 text-xs text-slate-500">
                    {[u.clientId, u.email].filter(Boolean).join(" · ") || "—"}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>

      {scopeUserId ? (
        <button
          type="button"
          onClick={() => onLoad()}
          className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Reload
        </button>
      ) : null}
    </div>
  );
}
