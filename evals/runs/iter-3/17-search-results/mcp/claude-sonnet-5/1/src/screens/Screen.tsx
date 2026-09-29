import { useMemo, useState, type Key } from 'react';
import { IconCircleCheck, IconCircleX, IconSearch } from '@syntara/icons';
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
} from '@syntara/react';
import styles from './Screen.module.css';

interface Benefit {
  id: string;
  name: string;
  category: string;
  description: string;
  eligible: boolean;
}

const BENEFITS: Benefit[] = [
  {
    id: 'health-insurance',
    name: 'Health Insurance',
    category: 'Health & Medical',
    description: 'Comprehensive medical, prescription and preventive care coverage.',
    eligible: true,
  },
  {
    id: 'dental-vision',
    name: 'Dental & Vision Plan',
    category: 'Health & Medical',
    description: 'Routine cleanings, eye exams and discounts on frames.',
    eligible: true,
  },
  {
    id: 'mental-health',
    name: 'Mental Health Support',
    category: 'Wellness',
    description: 'Confidential counselling sessions and a 24/7 support line.',
    eligible: true,
  },
  {
    id: 'retirement',
    name: 'Retirement Savings Match',
    category: 'Financial',
    description: 'Employer-matched contributions once you complete one year of service.',
    eligible: false,
  },
  {
    id: 'parental-leave',
    name: 'Parental Leave',
    category: 'Family & Caregiving',
    description: 'Paid leave for new parents, including adoption and foster care.',
    eligible: true,
  },
  {
    id: 'tuition',
    name: 'Tuition Reimbursement',
    category: 'Learning & Development',
    description: 'Reimbursement for approved courses and certifications after six months.',
    eligible: false,
  },
];

interface Suggestion {
  id: string;
  label: string;
  query: string;
}

const SUGGESTIONS: Suggestion[] = [
  { id: 'all', label: 'All benefits', query: '' },
  { id: 'health-insurance', label: 'Health insurance', query: 'health insurance' },
  { id: 'dental-vision', label: 'Dental & vision', query: 'dental' },
  { id: 'mental-health', label: 'Mental health support', query: 'mental health' },
  { id: 'retirement', label: 'Retirement savings', query: 'retirement' },
  { id: 'parental-leave', label: 'Parental leave', query: 'parental leave' },
  { id: 'tuition', label: 'Tuition reimbursement', query: 'tuition' },
  { id: 'commuter', label: 'Commuter benefits', query: 'commuter' },
];

function searchBenefits(query: string): Benefit[] {
  const q = query.trim().toLowerCase();
  return BENEFITS.filter((benefit) =>
    `${benefit.name} ${benefit.category} ${benefit.description}`.toLowerCase().includes(q),
  );
}

export default function Screen() {
  const [selected, setSelected] = useState<Suggestion | null>(null);

  const results = useMemo(() => (selected ? searchBenefits(selected.query) : null), [selected]);

  const handleSelectionChange = (key: Key | null) => {
    if (key === null) {
      setSelected(null);
      return;
    }
    const suggestion = SUGGESTIONS.find((item) => item.id === key) ?? null;
    setSelected(suggestion);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Benefits search</h1>
        <p className={styles.subtitle}>Search for a benefit to see what it covers and whether you're eligible.</p>
      </header>

      <Combobox
        label="Search benefits"
        placeholder="Try “dental”, “retirement” or “commuter”…"
        defaultItems={SUGGESTIONS}
        selectedKey={selected?.id ?? null}
        onSelectionChange={handleSelectionChange}
        className={styles.combobox}
      >
        {(item) => <ComboboxItem id={item.id}>{item.label}</ComboboxItem>}
      </Combobox>

      {results && (
        <section className={styles.results} aria-live="polite">
          {results.length === 0 ? (
            <EmptyState
              icon={<IconSearch />}
              title="No benefits found"
              description={`Nothing matched “${selected?.label}”. Try a different search.`}
            />
          ) : (
            <div className={styles.grid}>
              {results.map((benefit) => (
                <Card key={benefit.id}>
                  <CardHeader>
                    <CardTitle level={2}>{benefit.name}</CardTitle>
                  </CardHeader>
                  <CardContent className={styles.cardContent}>
                    <Tag>{benefit.category}</Tag>
                    <p className={styles.description}>{benefit.description}</p>
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
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
