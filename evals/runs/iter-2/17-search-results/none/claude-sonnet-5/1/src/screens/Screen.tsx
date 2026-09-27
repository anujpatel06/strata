import { useMemo, useState } from 'react';
import type { Key } from 'react-aria-components';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Combobox,
  ComboboxItem,
  EmptyState,
  Tag,
} from '@strata/react';
import { IconSearch } from '@strata/icons';
import styles from './Screen.module.css';

interface Benefit {
  id: string;
  name: string;
  category: string;
  description: string;
  eligible: boolean;
}

interface Suggestion {
  id: string;
  label: string;
  matchIds: string[];
}

const BENEFITS: Benefit[] = [
  {
    id: 'health-insurance',
    name: 'Health Insurance Plan',
    category: 'Health',
    description: 'Comprehensive medical coverage for you and your family.',
    eligible: true,
  },
  {
    id: 'dental-care',
    name: 'Dental Care Coverage',
    category: 'Health',
    description: 'Preventive and restorative dental treatments at low cost.',
    eligible: true,
  },
  {
    id: 'retirement-savings',
    name: 'Retirement Savings Plan',
    category: 'Financial',
    description: 'Employer-matched contributions to your retirement fund.',
    eligible: false,
  },
  {
    id: 'wellness-fitness',
    name: 'Wellness & Fitness Reimbursement',
    category: 'Wellness',
    description: 'Reimbursement for gym memberships and fitness classes.',
    eligible: true,
  },
  {
    id: 'parental-leave',
    name: 'Parental Leave Support',
    category: 'Family',
    description: 'Paid leave and support for new parents.',
    eligible: false,
  },
  {
    id: 'commuter-transit',
    name: 'Commuter Transit Benefit',
    category: 'Lifestyle',
    description: 'Pre-tax savings on public transit and parking costs.',
    eligible: true,
  },
];

const SUGGESTIONS: Suggestion[] = [
  { id: 'all', label: 'All benefits', matchIds: BENEFITS.map((b) => b.id) },
  { id: 'health-insurance', label: 'Health insurance', matchIds: ['health-insurance'] },
  { id: 'dental', label: 'Dental care', matchIds: ['dental-care'] },
  { id: 'retirement', label: 'Retirement savings', matchIds: ['retirement-savings'] },
  { id: 'wellness', label: 'Wellness & fitness', matchIds: ['wellness-fitness'] },
  { id: 'parental-leave', label: 'Parental leave', matchIds: ['parental-leave'] },
  { id: 'commuter', label: 'Commuter transit', matchIds: ['commuter-transit'] },
  { id: 'childcare', label: 'Childcare assistance', matchIds: [] },
];

export default function Screen() {
  const [selected, setSelected] = useState<Suggestion | null>(null);

  const results = useMemo(() => {
    if (!selected) return null;
    const ids = new Set(selected.matchIds);
    return BENEFITS.filter((benefit) => ids.has(benefit.id));
  }, [selected]);

  const handleSelectionChange = (key: Key | null) => {
    setSelected(SUGGESTIONS.find((suggestion) => suggestion.id === key) ?? null);
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Find your benefits</h1>
        <p className={styles.subtitle}>Search for a benefit to see what you're eligible for.</p>
      </header>

      <Combobox
        label="Search benefits"
        placeholder="Try “dental” or “commuter”…"
        items={SUGGESTIONS}
        selectedKey={selected?.id ?? null}
        onSelectionChange={handleSelectionChange}
        emptyState="No matching suggestions"
        className={styles.combobox}
      >
        {(item) => <ComboboxItem id={item.id}>{item.label}</ComboboxItem>}
      </Combobox>

      <div className={styles.results}>
        {selected === null ? (
          <p className={styles.hint}>Start typing to search for a benefit.</p>
        ) : results && results.length > 0 ? (
          <ul className={styles.resultsList}>
            {results.map((benefit) => (
              <li key={benefit.id}>
                <Card variant="outline" className={styles.card}>
                  <CardHeader className={styles.cardHeader}>
                    <CardTitle level={3} className={styles.cardTitle}>
                      {benefit.name}
                    </CardTitle>
                    <Tag size="sm">{benefit.category}</Tag>
                  </CardHeader>
                  <CardContent className={styles.cardContent}>
                    <p className={styles.description}>{benefit.description}</p>
                    <Badge
                      tone={benefit.eligible ? 'success' : 'neutral'}
                      variant="status"
                    >
                      {benefit.eligible ? 'Eligible' : 'Not eligible'}
                    </Badge>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<IconSearch />}
            title="No benefits found"
            description={`We couldn't find any benefits matching "${selected.label}". Try another search.`}
            size="sm"
          />
        )}
      </div>
    </div>
  );
}
