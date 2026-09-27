import { useMemo, useState } from 'react';
import styles from './Screen.module.css';

interface Beneficiary {
  id: string;
  name: string;
  bank: string;
  last4: string;
  addedAt: string; // ISO date
}

const initialBeneficiaries: Beneficiary[] = [
  { id: 'b1', name: 'Ananya Sharma', bank: 'HDFC Bank', last4: '4821', addedAt: '2025-11-02' },
  { id: 'b2', name: 'Rohan Mehta', bank: 'ICICI Bank', last4: '7734', addedAt: '2025-08-19' },
  { id: 'b3', name: 'Priya Nair', bank: 'State Bank of India', last4: '1092', addedAt: '2026-01-05' },
  { id: 'b4', name: 'Karan Malhotra', bank: 'Axis Bank', last4: '5560', addedAt: '2025-05-27' },
  { id: 'b5', name: 'Fatima Sheikh', bank: 'Kotak Mahindra Bank', last4: '3348', addedAt: '2026-02-14' },
  { id: 'b6', name: 'Vikram Singh', bank: 'Punjab National Bank', last4: '9021', addedAt: '2025-09-30' },
  { id: 'b7', name: 'Neha Kulkarni', bank: 'Yes Bank', last4: '6675', addedAt: '2026-03-01' },
];

type SortKey = 'name' | 'addedAt';
type SortDir = 'asc' | 'desc';

interface EditDraft {
  name: string;
  bank: string;
  last4: string;
}

function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function IconEdit() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
      <path
        d="M13.5 3.5a1.5 1.5 0 0 1 2.12 0l.88.88a1.5 1.5 0 0 1 0 2.12l-8.5 8.5-3.5.88.88-3.5 8.12-8.88Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
      <path
        d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m-6.5 0 .6 9a1.5 1.5 0 0 0 1.5 1.4h3.8a1.5 1.5 0 0 0 1.5-1.4l.6-9"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
      <path d="M4 10.5 8 14l8-8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
      <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconSort({ dir }: { dir: SortDir | null }) {
  return (
    <svg viewBox="0 0 20 20" width="12" height="12" fill="none" aria-hidden="true" className={styles.sortIcon}>
      <path
        d="M6 8l4-4 4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={dir === 'desc' ? 0.35 : 1}
      />
      <path
        d="M6 12l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={dir === 'asc' ? 0.35 : 1}
      />
    </svg>
  );
}

export default function Screen() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(initialBeneficiaries);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft>({ name: '', bank: '', last4: '' });

  const sorted = useMemo(() => {
    const copy = [...beneficiaries];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else {
        cmp = a.addedAt.localeCompare(b.addedAt);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [beneficiaries, sortKey, sortDir]);

  const allSelected = sorted.length > 0 && sorted.every((b) => selectedIds.has(b.id));
  const someSelected = selectedIds.size > 0;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sorted.map((b) => b.id)));
    }
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function removeOne(id: string) {
    setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (editingId === id) setEditingId(null);
  }

  function removeSelected() {
    setBeneficiaries((prev) => prev.filter((b) => !selectedIds.has(b.id)));
    setSelectedIds(new Set());
  }

  function startEdit(b: Beneficiary) {
    setEditingId(b.id);
    setDraft({ name: b.name, bank: b.bank, last4: b.last4 });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function saveEdit(id: string) {
    setBeneficiaries((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, name: draft.name.trim() || b.name, bank: draft.bank.trim() || b.bank, last4: draft.last4.trim() || b.last4 }
          : b,
      ),
    );
    setEditingId(null);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Beneficiaries</h1>
        <p className={styles.subtitle}>Manage the people you can transfer money to.</p>
      </div>

      {someSelected && (
        <div className={styles.selectionBar} role="toolbar" aria-label="Selection actions">
          <span className={styles.selectionText}>{selectedIds.size} selected</span>
          <button type="button" className={styles.removeSelectedButton} onClick={removeSelected}>
            <IconTrash />
            Remove selected
          </button>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.checkboxCell}>
                <input
                  type="checkbox"
                  aria-label="Select all beneficiaries"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
              </th>
              <th aria-sort={sortKey === 'name' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" className={styles.sortButton} onClick={() => toggleSort('name')}>
                  Name
                  <IconSort dir={sortKey === 'name' ? sortDir : null} />
                </button>
              </th>
              <th>Bank</th>
              <th>Account</th>
              <th aria-sort={sortKey === 'addedAt' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" className={styles.sortButton} onClick={() => toggleSort('addedAt')}>
                  Added
                  <IconSort dir={sortKey === 'addedAt' ? sortDir : null} />
                </button>
              </th>
              <th className={styles.actionsHeader}>
                <span className={styles.visuallyHidden}>Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((b) => {
              const isEditing = editingId === b.id;
              const isSelected = selectedIds.has(b.id);
              return (
                <tr key={b.id} className={isSelected ? styles.rowSelected : undefined}>
                  <td className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${b.name}`}
                      checked={isSelected}
                      onChange={() => toggleSelectOne(b.id)}
                    />
                  </td>
                  {isEditing ? (
                    <>
                      <td>
                        <input
                          className={styles.editInput}
                          value={draft.name}
                          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                          aria-label="Name"
                        />
                      </td>
                      <td>
                        <input
                          className={styles.editInput}
                          value={draft.bank}
                          onChange={(e) => setDraft((d) => ({ ...d, bank: e.target.value }))}
                          aria-label="Bank"
                        />
                      </td>
                      <td>
                        <input
                          className={`${styles.editInput} ${styles.editInputSmall}`}
                          value={draft.last4}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, last4: e.target.value.replace(/\D/g, '').slice(0, 4) }))
                          }
                          inputMode="numeric"
                          maxLength={4}
                          aria-label="Last four digits"
                        />
                      </td>
                      <td className={styles.dateCell}>{formatDate(b.addedAt)}</td>
                      <td className={styles.actionsCell}>
                        <button
                          type="button"
                          className={styles.iconButton}
                          aria-label={`Save ${b.name}`}
                          onClick={() => saveEdit(b.id)}
                        >
                          <IconCheck />
                        </button>
                        <button
                          type="button"
                          className={styles.iconButton}
                          aria-label="Cancel editing"
                          onClick={cancelEdit}
                        >
                          <IconClose />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className={styles.nameCell}>{b.name}</td>
                      <td>{b.bank}</td>
                      <td className={styles.accountCell}>•••• {b.last4}</td>
                      <td className={styles.dateCell}>{formatDate(b.addedAt)}</td>
                      <td className={styles.actionsCell}>
                        <button
                          type="button"
                          className={styles.iconButton}
                          aria-label={`Edit ${b.name}`}
                          onClick={() => startEdit(b)}
                        >
                          <IconEdit />
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                          aria-label={`Remove ${b.name}`}
                          onClick={() => removeOne(b.id)}
                        >
                          <IconTrash />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {sorted.length === 0 && <p className={styles.emptyState}>No beneficiaries yet.</p>}
      </div>
    </div>
  );
}
