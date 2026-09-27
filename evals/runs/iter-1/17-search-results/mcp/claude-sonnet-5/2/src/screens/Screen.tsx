'use client';

import { useMemo, useState } from 'react';
import type { Key } from 'react';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Combobox, ComboboxItem, EmptyState, Tag } from '@strata/react';
import { IconCircleCheck, IconCircleX, IconSearch } from '@strata/icons';
import styles from './Screen.module.css';

interface Benefit {
  id: string;
  name: string;
  category: string;
  description: string;
  eligible: boolean;
}

const benefits: Benefit[] = [
  {
    id: 'outpatient',
    name: 'Outpatient consultations',
    category: 'Medical',
    description: 'Visits to a GP or specialist, in person or online.',
    eligible: true,
  },
  {
    id: 'dental',
    name: 'Dental checkups',
    category: 'Dental',
    description: 'Cleaning, checkups and basic fillings twice a year.',
    eligible: true,
  },
  {
    id: 'mental-health',
    name: 'Mental health support',
    category: 'Wellness',
    description: 'Therapy sessions with a licensed counsellor.',
    eligible: true,
  },
  {
    id: 'physiotherapy',
    name: 'Physiotherapy',
    category: 'Medical',
    description: 'Sessions to recover from injury or manage chronic pain.',
    eligible: false,
  },
  {
    id: 'gym',
    name: 'Gym membership',
    category: 'Wellness',
    description: 'A discounted membership at partner fitness studios.',
    eligible: true,
  },
  {
    id: 'screening',
    name: 'Annual health screening',
    category: 'Medical',
    description: 'A yearly checkup covering blood work and vitals.',
    eligible: false,
  },
];

interface Suggestion {
  id: string;
  label: string;
}

const suggestions: Suggestion[] = [
  { id: 'outpatient', label: 'Outpatient consultations' },
  { id: 'dental', label: 'Dental checkups' },
  { id: 'mental-health', label: 'Mental health support' },
  { id: 'physiotherapy', label: 'Physiotherapy' },
  { id: 'gym', label: 'Gym membership' },
  { id: 'screening', label: 'Annual health screening' },
  { id: 'medical', label: 'Medical' },
  { id: 'wellness', label: 'Wellness' },
  { id: 'vision', label: 'Vision care' },
];

export default function Screen() {
  const [selectedKey, setSelectedKey] = useState<Key | null>(null);

  const activeTerm = useMemo(() => suggestions.find((suggestion) => suggestion.id === selectedKey)?.label ?? null, [selectedKey]);

  const results = useMemo(() => {
    if (!activeTerm) return benefits;
    const term = activeTerm.toLowerCase();
    return benefits.filter(
      (benefit) =>
        benefit.name.toLowerCase().includes(term) ||
        benefit.category.toLowerCase().includes(term) ||
        benefit.description.toLowerCase().includes(term),
    );
  }, [activeTerm]);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Benefits</h1>
        <p className={styles.subtitle}>Search your benefits to see what is covered and whether you are eligible.</p>
      </header>

      <Combobox
        label="Search benefits"
        placeholder="Search by benefit or category…"
        defaultItems={suggestions}
        selectedKey={selectedKey}
        onSelectionChange={setSelectedKey}
        className={styles.search}
      >
        {(item) => <ComboboxItem id={item.id}>{item.label}</ComboboxItem>}
      </Combobox>

      <div className={styles.status} role="status" aria-live="polite">
        {activeTerm ? `${results.length} result${results.length === 1 ? '' : 's'} for "${activeTerm}"` : `Showing all ${results.length} benefits`}
      </div>

      {results.length > 0 ? (
        <ul className={styles.results}>
          {results.map((benefit) => (
            <li key={benefit.id}>
              <Card className={styles.card}>
                <CardHeader>
                  <CardTitle level={2}>{benefit.name}</CardTitle>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardHeader>
                <CardContent className={styles.cardContent}>
                  <Tag>{benefit.category}</Tag>
                  {benefit.eligible ? (
                    <Badge tone="success" icon={<IconCircleCheck />}>
                      Eligible
                    </Badge>
                  ) : (
                    <Badge tone="danger" icon={<IconCircleX />}>
                      Not eligible
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<IconSearch />}
          title="No benefits found"
          description="Try searching for a different benefit or category."
          className={styles.empty}
        />
      )}
    </div>
  );
}
