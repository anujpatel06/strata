import { useMemo, useState } from 'react';
import {
  Badge,
  Card,
  CardAction,
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

const benefits: Benefit[] = [
  {
    id: 'dental',
    name: 'Dental care',
    category: 'Health',
    description: 'Covers routine checkups, cleanings and fillings.',
    eligible: true,
  },
  {
    id: 'vision',
    name: 'Vision care',
    category: 'Health',
    description: 'Covers eye exams, glasses and contact lenses.',
    eligible: true,
  },
  {
    id: 'life-insurance',
    name: 'Life insurance',
    category: 'Insurance',
    description: 'Pays a lump sum to your family if you pass away.',
    eligible: false,
  },
  {
    id: 'retirement-match',
    name: 'Retirement savings match',
    category: 'Retirement',
    description: 'Your employer matches contributions up to 5%.',
    eligible: true,
  },
  {
    id: 'parental-leave',
    name: 'Parental leave',
    category: 'Leave',
    description: 'Paid time off for new parents after birth or adoption.',
    eligible: false,
  },
  {
    id: 'wellness-stipend',
    name: 'Wellness stipend',
    category: 'Wellness',
    description: 'Reimburses gym memberships and fitness classes.',
    eligible: true,
  },
];

export default function Screen() {
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return benefits;
    return benefits.filter(
      (benefit) =>
        benefit.name.toLowerCase().includes(q) || benefit.category.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Find a benefit</h1>
      <p className={styles.subheading}>Search for a benefit by name or category.</p>

      <Combobox
        label="Search benefits"
        placeholder="Search by benefit name or category…"
        defaultItems={benefits}
        className={styles.search}
        onInputChange={setQuery}
        onSelectionChange={(key) => setHasSearched(key !== null)}
      >
        {(item) => (
          <ComboboxItem id={item.id} description={item.category}>
            {item.name}
          </ComboboxItem>
        )}
      </Combobox>

      {hasSearched && (
        <section className={styles.results} aria-label="Search results">
          {results.length === 0 ? (
            <EmptyState
              icon={<IconSearch />}
              title="No results"
              description="Try a different benefit name or category."
            />
          ) : (
            <div className={styles.grid}>
              {results.map((benefit) => (
                <Card key={benefit.id}>
                  <CardHeader>
                    <CardTitle level={3}>{benefit.name}</CardTitle>
                    <CardAction>
                      <Badge variant="status" tone={benefit.eligible ? 'success' : 'danger'}>
                        {benefit.eligible ? 'Eligible' : 'Not eligible'}
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardContent className={styles.cardContent}>
                    <Tag uppercase>{benefit.category}</Tag>
                    <p className={styles.description}>{benefit.description}</p>
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
