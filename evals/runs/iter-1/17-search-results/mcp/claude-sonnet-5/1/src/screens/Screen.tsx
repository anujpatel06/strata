'use client';

import { useMemo, useState } from 'react';
import {
  IconBriefcase,
  IconBus,
  IconCheck,
  IconDumbbell,
  IconHeartPulse,
  IconSearch,
  IconTooth,
  IconX,
} from '@strata/icons';
import { Badge, Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle, Combobox, ComboboxItem, EmptyState, Tag } from '@strata/react';
import styles from './Screen.module.css';

interface Benefit {
  id: string;
  name: string;
  category: string;
  description: string;
  eligible: boolean;
  icon: React.ReactNode;
}

const benefits: Benefit[] = [
  {
    id: 'dental',
    name: 'Dental Care',
    category: 'Health',
    description: 'Cleanings, fillings and orthodontics for you and your family.',
    eligible: true,
    icon: <IconTooth />,
  },
  {
    id: 'vision',
    name: 'Vision Care',
    category: 'Health',
    description: 'Annual eye exams plus an allowance for glasses or contacts.',
    eligible: false,
    icon: <IconHeartPulse />,
  },
  {
    id: 'fitness',
    name: 'Fitness Reimbursement',
    category: 'Wellness',
    description: 'Get part of your gym membership or fitness classes paid back.',
    eligible: true,
    icon: <IconDumbbell />,
  },
  {
    id: 'commuter',
    name: 'Commuter Transit Pass',
    category: 'Transport',
    description: 'Pre-tax transit passes for the bus, train and shared rides.',
    eligible: true,
    icon: <IconBus />,
  },
  {
    id: 'life-insurance',
    name: 'Life Insurance',
    category: 'Financial',
    description: 'Term life coverage at no cost, with options to add more.',
    eligible: false,
    icon: <IconBriefcase />,
  },
  {
    id: 'parental-leave',
    name: 'Parental Leave',
    category: 'Family',
    description: 'Paid leave for new parents, including adoption and foster care.',
    eligible: true,
    icon: <IconHeartPulse />,
  },
];

function matchesQuery(benefit: Benefit, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return benefit.name.toLowerCase().includes(q) || benefit.category.toLowerCase().includes(q);
}

export default function Screen() {
  const [query, setQuery] = useState('');

  const results = useMemo(() => benefits.filter((benefit) => matchesQuery(benefit, query)), [query]);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Benefits</h1>
        <p className={styles.subtitle}>Search for a benefit by name or category to see if you're eligible.</p>
      </header>

      <Combobox
        label="Search benefits"
        placeholder="Search by name or category…"
        defaultItems={benefits}
        inputValue={query}
        onInputChange={setQuery}
        onSelectionChange={(key) => {
          const chosen = benefits.find((benefit) => benefit.id === key);
          if (chosen) setQuery(chosen.name);
        }}
        className={styles.search}
      >
        {(item) => (
          <ComboboxItem id={item.id} textValue={`${item.name} ${item.category}`} icon={item.icon} description={item.category}>
            {item.name}
          </ComboboxItem>
        )}
      </Combobox>

      <section className={styles.results} aria-label="Search results">
        {results.length === 0 ? (
          <EmptyState
            icon={<IconSearch />}
            title="No benefits found"
            description="Try a different name or category."
          />
        ) : (
          <ul className={styles.grid}>
            {results.map((benefit) => (
              <li key={benefit.id}>
                <Card className={styles.card}>
                  <CardHeader>
                    <CardTitle level={2}>{benefit.name}</CardTitle>
                    <CardDescription>{benefit.description}</CardDescription>
                    <CardAction>
                      {benefit.eligible ? (
                        <Badge tone="success" icon={<IconCheck />}>
                          Eligible
                        </Badge>
                      ) : (
                        <Badge tone="neutral" icon={<IconX />}>
                          Not eligible
                        </Badge>
                      )}
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <Tag>{benefit.category}</Tag>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
