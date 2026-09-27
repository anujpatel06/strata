import { useMemo, useState } from 'react';
import type { Key } from 'react';
import { Badge, Card, CardAction, CardContent, CardHeader, CardTitle, Combobox, ComboboxItem, EmptyState, Eyebrow, Tag } from '@strata/react';
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
    id: 'health-cover',
    name: 'Comprehensive Health Cover',
    category: 'Health',
    description: 'Covers hospitalisation, surgery and outpatient consultations.',
    eligible: true,
  },
  {
    id: 'dental-care',
    name: 'Dental Care Plan',
    category: 'Dental',
    description: 'Routine check-ups, cleanings and orthodontic treatment.',
    eligible: true,
  },
  {
    id: 'vision-care',
    name: 'Vision Care',
    category: 'Vision',
    description: 'Annual eye exams plus an allowance for glasses or lenses.',
    eligible: false,
  },
  {
    id: 'mental-health',
    name: 'Mental Health Support',
    category: 'Mental health',
    description: 'Confidential counselling sessions with licensed therapists.',
    eligible: true,
  },
  {
    id: 'fitness-reimbursement',
    name: 'Fitness Reimbursement',
    category: 'Wellness',
    description: 'Reimburses gym memberships and fitness class fees.',
    eligible: false,
  },
  {
    id: 'dependent-care',
    name: 'Dependent Care Assistance',
    category: 'Family',
    description: 'Helps cover childcare and elder care costs.',
    eligible: true,
  },
];

function matchesQuery(benefit: Benefit, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return false;
  return (
    benefit.name.toLowerCase().includes(needle) ||
    benefit.category.toLowerCase().includes(needle) ||
    benefit.description.toLowerCase().includes(needle)
  );
}

export default function Screen() {
  const [inputValue, setInputValue] = useState('');
  const [hasChosen, setHasChosen] = useState(false);

  const results = useMemo(() => (hasChosen ? benefits.filter((benefit) => matchesQuery(benefit, inputValue)) : []), [hasChosen, inputValue]);

  function handleInputChange(value: string) {
    setInputValue(value);
    if (value.trim() === '') {
      setHasChosen(false);
    }
  }

  function handleSelectionChange(key: Key | null) {
    if (key == null) return;
    const benefit = benefits.find((item) => item.id === key);
    if (benefit) {
      setInputValue(benefit.name);
      setHasChosen(true);
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.intro}>
        <Eyebrow>Benefits</Eyebrow>
        <h1 className={styles.title}>Search your benefits</h1>
        <p className={styles.subtitle}>Find a benefit by name or category, and see whether you're eligible.</p>
      </div>

      <Combobox
        label="Search benefits"
        placeholder="Search by name or category…"
        defaultItems={benefits}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onSelectionChange={handleSelectionChange}
        emptyState="No matching benefits"
        className={styles.search}
      >
        {(benefit) => (
          <ComboboxItem id={benefit.id} textValue={`${benefit.name} ${benefit.category}`} description={benefit.category}>
            {benefit.name}
          </ComboboxItem>
        )}
      </Combobox>

      <div className={styles.results}>
        {!hasChosen && (
          <EmptyState
            icon={<IconSearch />}
            title="Search for a benefit"
            description="Type a name or category above and choose a suggestion to see the details."
          />
        )}

        {hasChosen && results.length === 0 && (
          <EmptyState
            icon={<IconSearch />}
            title="No results"
            description={`Nothing matches "${inputValue}". Try a different name or category.`}
          />
        )}

        {hasChosen && results.length > 0 && (
          <ul className={styles.resultsList}>
            {results.map((benefit) => (
              <li key={benefit.id}>
                <Card>
                  <CardHeader>
                    <CardTitle level={2}>{benefit.name}</CardTitle>
                    <CardAction>
                      {benefit.eligible ? (
                        <Badge tone="success" icon={<IconCircleCheck />}>
                          Eligible
                        </Badge>
                      ) : (
                        <Badge tone="neutral" icon={<IconCircleX />}>
                          Not eligible
                        </Badge>
                      )}
                    </CardAction>
                  </CardHeader>
                  <CardContent className={styles.cardContent}>
                    <Tag>{benefit.category}</Tag>
                    <p className={styles.description}>{benefit.description}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
