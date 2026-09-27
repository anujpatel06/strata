import { useMemo, useState } from 'react';
import styles from './Screen.module.css';

type Beneficiary = {
  id: string;
  name: string;
  bank: string;
  last4: string;
  addedAt: string;
};

const initialBeneficiaries: Beneficiary[] = [
  { id: 'b1', name: 'Aditi Sharma', bank: 'HDFC Bank', last4: '4821', addedAt: '2026-01-14' },
  { id: 'b2', name: 'Rohan Mehta', bank: 'ICICI Bank', last4: '7734', addedAt: '2025-11-02' },
  { id: 'b3', name: 'Priya Nair', bank: 'State Bank of India', last4: '2290', addedAt: '2026-03-08' },
  { id: 'b4', name: 'Karan Verma', bank: 'Axis Bank', last4: '5567', addedAt: '2025-08-21' },
  { id: 'b5', name: 'Sanya Kapoor', bank: 'Kotak Mahindra Bank', last4: '9013', addedAt: '2026-05-30' },
  { id: 'b6', name: 'Vikram Singh', bank: 'Punjab National Bank', last4: '3348', addedAt: '2025-12-19' },
];

type SortKey = 'name' | 'addedAt';
type SortDir = 'asc' | 'desc';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export default function Screen() {
  const [beneficiaries, setBeneficiaries] = useState(initialBeneficiaries);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; bank: string } | null>(null);

  const sorted = useMemo(() => {
    const copy = [...beneficiaries];
    copy.sort((a, b) => {
      const cmp = sortKey === 'name' ? a.name.localeCompare(b.name) : a.addedAt.localeCompare(b.addedAt);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [beneficiaries, sortKey, sortDir]);

  const allSelected = beneficiaries.length > 0 && selected.size === beneficiaries.length;
  const someSelected = selected.size > 0;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === beneficiaries.length ? new Set() : new Set(beneficiaries.map((b) => b.id))));
  }

  function removeSelected() {
    setBeneficiaries((prev) => prev.filter((b) => !selected.has(b.id)));
    setSelected(new Set());
  }

  function removeOne(id: string) {
    setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (editingId === id) {
      setEditingId(null);
      setEditDraft(null);
    }
  }

  function startEdit(b: Beneficiary) {
    setEditingId(b.id);
    setEditDraft({ name: b.name, bank: b.bank });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(null);
  }

  function saveEdit(id: string) {
    if (!editDraft) return;
    setBeneficiaries((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, name: editDraft.name.trim() || b.name, bank: editDraft.bank.trim() || b.bank }
          : b,
      ),
    );
    setEditingId(null);
    setEditDraft(null);
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Beneficiaries</h1>
        <p className={styles.subtitle}>{beneficiaries.length} saved beneficiaries</p>
      </header>

      {someSelected && (
        <div className={styles.selectionBar} role="toolbar" aria-label="Selected beneficiaries actions">
          <span className={styles.selectionCount}>{selected.size} selected</span>
          <button type="button" className={styles.removeSelectedButton} onClick={removeSelected}>
            <TrashIcon />
            Remove selected
          </button>
        </div>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.checkboxCell} scope="col">
                <input
                  type="checkbox"
                  aria-label="Select all beneficiaries"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={toggleSelectAll}
                />
              </th>
              <th scope="col">
                <button type="button" className={styles.sortButton} onClick={() => toggleSort('name')}>
                  Name
                  <SortIcon active={sortKey === 'name'} dir={sortDir} />
                </button>
              </th>
              <th scope="col">Bank</th>
              <th scope="col">Account</th>
              <th scope="col">
                <button type="button" className={styles.sortButton} onClick={() => toggleSort('addedAt')}>
                  Added
                  <SortIcon active={sortKey === 'addedAt'} dir={sortDir} />
                </button>
              </th>
              <th className={styles.actionsCell} scope="col">
                <span className={styles.visuallyHidden}>Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((b) => {
              const isEditing = editingId === b.id;
              const isSelected = selected.has(b.id);
              return (
                <tr key={b.id} className={isSelected ? styles.rowSelected : undefined}>
                  <td className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${b.name}`}
                      checked={isSelected}
                      onChange={() => toggleSelect(b.id)}
                    />
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        className={styles.editInput}
                        value={editDraft?.name ?? ''}
                        onChange={(e) => setEditDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                        aria-label="Name"
                      />
                    ) : (
                      <span className={styles.name}>{b.name}</span>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        className={styles.editInput}
                        value={editDraft?.bank ?? ''}
                        onChange={(e) => setEditDraft((d) => (d ? { ...d, bank: e.target.value } : d))}
                        aria-label="Bank"
                      />
                    ) : (
                      b.bank
                    )}
                  </td>
                  <td className={styles.account}>•••• {b.last4}</td>
                  <td className={styles.date}>{dateFormatter.format(new Date(b.addedAt))}</td>
                  <td className={styles.actionsCell}>
                    {isEditing ? (
                      <div className={styles.actionGroup}>
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={() => saveEdit(b.id)}
                          aria-label={`Save ${b.name}`}
                        >
                          <CheckIcon />
                        </button>
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={cancelEdit}
                          aria-label="Cancel editing"
                        >
                          <CloseIcon />
                        </button>
                      </div>
                    ) : (
                      <div className={styles.actionGroup}>
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={() => startEdit(b)}
                          aria-label={`Edit ${b.name}`}
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={() => removeOne(b.id)}
                          aria-label={`Remove ${b.name}`}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  No beneficiaries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg
      className={`${styles.sortIcon} ${active ? styles.sortIconActive : ''} ${
        active && dir === 'desc' ? styles.sortIconDesc : ''
      }`}
      width="14"
      height="14"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 3 L12.5 9.5 L3.5 9.5 Z" fill="currentColor" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M11.5 1.5a1.5 1.5 0 0 1 2.12 2.12l-8.2 8.2-3 .68.68-3 8.2-8.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M3 4.5h10M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5M4.5 4.5v8a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-8M6.5 7.5v3M9.5 7.5v3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M3 8.5 6 11.5 13 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M3.5 3.5 12.5 12.5M12.5 3.5 3.5 12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
