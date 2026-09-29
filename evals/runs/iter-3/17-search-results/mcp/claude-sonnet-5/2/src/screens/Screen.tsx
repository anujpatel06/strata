'use client';

import { useState } from 'react';
import type { Key } from '@syntara/react';
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  Combobox,
  ComboboxItem,
  EmptyState,
  Tag,
} from '@syntara/react';
import { IconCircleCheck, IconCircleX, IconSearch } from '@syntara/icons';
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
    id: 'health-insurance',
    name: 'Health insurance',
    category: 'Health',
    description: 'Comprehensive medical coverage for you and your dependents.',
    eligible: true,
  },
  {
    id: 'dental-care',
    name: 'Dental care',
    category: 'Health',
    description: 'Routine check-ups and major dental treatments covered.',
    eligible: true,
  },
  {
    id: 'vision-care',
    name: 'Vision care',
    category: 'Health',
    description: 'Annual eye exams and an allowance towards eyewear.',
    eligible: false,
  },
  {
    id: 'mental-health-support',
    name: 'Mental health support',
    category: 'Wellness',
    description: 'Confidential counselling sessions with licensed therapists.',
    eligible: true,
  },
  {
    id: 'gym-membership',
    name: 'Gym membership',
    category: 'Wellness',
    description: 'Discounted access to a network of partner fitness centres.',
    eligible: true,
  },
  {
    id: 'parental-leave',
    name: 'Parental leave',
    category: 'Family',
    description: 'Paid leave for new parents, for up to twenty-six weeks.',
    eligible: false,
  },
  {
    id: 'life-insurance',
    name: 'Life insurance',
    category: 'Financial',
    description: 'Cover for your family in case the unexpected happens.',
    eligible: true,
  },
  {
    id: 'retirement-match',
    name: 'Retirement match',
    category: 'Financial',
    description: "Employer match on your retirement fund contributions.",
    eligible: true,
  },
  {
    id: 'tuition-reimbursement',
    name: 'Tuition reimbursement',
    category: 'Learning',
    description: 'Reimbursement for approved courses and certifications.',
    eligible: false,
  },
  {
    id: 'commuter-benefits',
    name: 'Commuter benefits',
    category: 'Transport',
    description: 'Pre-tax spending on public transport and parking.',
    eligible: true,
  },
];

interface SearchSuggestion {
  id: string;
  label: string;
  query: string;
}

const suggestions: SearchSuggestion[] = [
  { id: 'all', label: 'All benefits', query: '' },
  { id: 'health', label: 'Health', query: 'health' },
  { id: 'wellness', label: 'Wellness', query: 'wellness' },
  { id: 'family', label: 'Family', query: 'family' },
  { id: 'financial', label: 'Financial', query: 'financial' },
  { id: 'learning', label: 'Learning', query: 'learning' },
  { id: 'transport', label: 'Transport', query: 'transport' },
  { id: 'pet-insurance', label: 'Pet insurance', query: 'pet insurance' },
];

const RESULT_COUNT = 6;

function findBenefits(query: string): Benefit[] {
  if (!query) {
    return benefits.slice(0, RESULT_COUNT);
  }
  const needle = query.toLowerCase();
  return benefits
    .filter(
      (benefit) =>
        benefit.name.toLowerCase().includes(needle) ||
        benefit.category.toLowerCase().includes(needle) ||
        benefit.description.toLowerCase().includes(needle),
    )
    .slice(0, RESULT_COUNT);
}

export default function Screen() {
  const [results, setResults] = useState<Benefit[] | null>(null);
  const [resetCount, setResetCount] = useState(0);

  function handleSelectionChange(key: Key | null) {
    if (key === null) {
      setResults(null);
      return;
    }
    const suggestion = suggestions.find((item) => item.id === key);
    setResults(suggestion ? findBenefits(suggestion.query) : []);
  }

  function handleClear() {
    setResults(null);
    setResetCount((count) => count + 1);
  }

  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <h1 className={styles.title}>Find your benefits</h1>
        <p className={styles.subtitle}>Search by name or category to see what's available to you.</p>
      </header>

      <Combobox
        key={resetCount}
        label="Search benefits"
        placeholder="Search by name or category…"
        defaultItems={suggestions}
        onSelectionChange={handleSelectionChange}
        className={styles.combobox}
      >
        {(item) => <ComboboxItem id={item.id}>{item.label}</ComboboxItem>}
      </Combobox>

      {results !== null && (
        <section className={styles.results} aria-live="polite">
          {results.length > 0 ? (
            <div className={styles.grid}>
              {results.map((benefit) => (
                <Card key={benefit.id} variant="outline">
                  <CardHeader>
                    <CardTitle level={2}>{benefit.name}</CardTitle>
                    <CardAction>
                      {benefit.eligible ? (
                        <Badge tone="success" icon={<IconCircleCheck aria-hidden />}>
                          Eligible
                        </Badge>
                      ) : (
                        <Badge tone="neutral" icon={<IconCircleX aria-hidden />}>
                          Not eligible
                        </Badge>
                      )}
                    </CardAction>
                  </CardHeader>
                  <CardContent className={styles.cardContent}>
                    <Tag uppercase>{benefit.category}</Tag>
                    <p className={styles.description}>{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<IconSearch aria-hidden />}
              level={2}
              title="No benefits found"
              description="Try a different name or category, such as Health or Financial."
              action={
                <Button variant="outline" onPress={handleClear}>
                  Clear search
                </Button>
              }
            />
          )}
        </section>
      )}
    </div>
  );
}
