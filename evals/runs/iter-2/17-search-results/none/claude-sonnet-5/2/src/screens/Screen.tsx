import { useState } from 'react';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  Combobox,
  ComboboxItem,
  CardTitle,
  EmptyState,
  IconTile,
  Tag,
} from '@strata/react';
import {
  IconBaby,
  IconBrain,
  IconBus,
  IconCircleCheck,
  IconCircleX,
  IconDumbbell,
  IconGlasses,
  IconSearch,
  IconTooth,
  type Icon,
} from '@strata/icons';
import styles from './Screen.module.css';

interface Benefit {
  id: string;
  name: string;
  category: string;
  description: string;
  eligible: boolean;
  icon: Icon;
}

// Mock data: the benefits catalogue. There is no backend.
const benefits: Benefit[] = [
  {
    id: 'dental-care',
    name: 'Dental Care Plan',
    category: 'Dental',
    description: 'Covers routine cleanings, fillings and orthodontic treatment.',
    eligible: true,
    icon: IconTooth,
  },
  {
    id: 'vision-care',
    name: 'Vision Care Plan',
    category: 'Vision',
    description: 'Annual eye care exams plus an allowance for glasses or lenses.',
    eligible: true,
    icon: IconGlasses,
  },
  {
    id: 'mental-health',
    name: 'Mental Health Support',
    category: 'Wellbeing',
    description: 'Confidential therapy sessions with licensed counsellors.',
    eligible: true,
    icon: IconBrain,
  },
  {
    id: 'gym-discount',
    name: 'Gym Membership Discount',
    category: 'Wellbeing',
    description: 'Discounted rates at partnered gyms and fitness studios.',
    eligible: false,
    icon: IconDumbbell,
  },
  {
    id: 'commuter-pass',
    name: 'Commuter Transit Pass',
    category: 'Transport',
    description: 'Pre-tax spending on public transport and parking.',
    eligible: true,
    icon: IconBus,
  },
  {
    id: 'parental-leave',
    name: 'Parental Leave Top-up',
    category: 'Family',
    description: 'Extra paid weeks on top of statutory parental leave.',
    eligible: false,
    icon: IconBaby,
  },
];

interface SearchTerm {
  id: string;
  label: string;
}

// Suggestion pool. Some terms match nothing, so choosing one can land on the no-results state.
const searchTerms: SearchTerm[] = [
  { id: 'all', label: 'All benefits' },
  { id: 'dental', label: 'Dental' },
  { id: 'vision', label: 'Vision' },
  { id: 'eye-care', label: 'Eye care' },
  { id: 'mental-health', label: 'Mental health' },
  { id: 'therapy', label: 'Therapy' },
  { id: 'wellbeing', label: 'Wellbeing' },
  { id: 'gym', label: 'Gym' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'commuter', label: 'Commuter' },
  { id: 'parking', label: 'Parking' },
  { id: 'parental-leave', label: 'Parental leave' },
  { id: 'family', label: 'Family' },
  { id: 'childcare', label: 'Childcare' },
  { id: 'pet-insurance', label: 'Pet insurance' },
  { id: 'life-insurance', label: 'Life insurance' },
];

function findBenefits(term: string): Benefit[] {
  if (term === 'All benefits') return benefits;
  const query = term.toLowerCase();
  return benefits.filter(
    (benefit) =>
      benefit.name.toLowerCase().includes(query) ||
      benefit.category.toLowerCase().includes(query) ||
      benefit.description.toLowerCase().includes(query),
  );
}

export default function Screen() {
  const [activeTerm, setActiveTerm] = useState<SearchTerm | null>(null);
  const results = activeTerm ? findBenefits(activeTerm.label) : [];

  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <h1 className={styles.title}>Find your benefits</h1>
        <p className={styles.subtitle}>
          Search by benefit name or keyword to see what you're eligible for.
        </p>
      </header>

      <Combobox
        items={searchTerms}
        label="Search benefits"
        placeholder="Try “dental”, “gym” or “commuter”…"
        description="Type to see suggestions, then use the arrow keys and Enter to choose one."
        className={styles.search}
        onInputChange={(value) => {
          if (value === '') setActiveTerm(null);
        }}
        onSelectionChange={(key) => {
          if (key == null) return;
          const term = searchTerms.find((candidate) => candidate.id === key);
          if (term) setActiveTerm(term);
        }}
      >
        {(term) => (
          <ComboboxItem id={term.id} textValue={term.label}>
            {term.label}
          </ComboboxItem>
        )}
      </Combobox>

      <section className={styles.results} aria-live="polite">
        {activeTerm == null && (
          <div className={styles.emptyWrap}>
            <EmptyState
              icon={<IconSearch />}
              title="Search for a benefit"
              description="Start typing above and choose a suggestion to see what you're eligible for."
            />
          </div>
        )}

        {activeTerm != null && results.length === 0 && (
          <div className={styles.emptyWrap}>
            <EmptyState
              icon={<IconCircleX />}
              title={`No benefits found for "${activeTerm.label}"`}
              description="Try a different benefit name or keyword."
            />
          </div>
        )}

        {activeTerm != null && results.length > 0 && (
          <>
            <p className={styles.resultsCount}>
              {results.length} benefit{results.length === 1 ? '' : 's'} for "{activeTerm.label}"
            </p>
            <div className={styles.grid}>
              {results.map((benefit) => {
                const BenefitIcon = benefit.icon;
                return (
                  <Card key={benefit.id} className={styles.card}>
                    <CardHeader className={styles.cardHeader}>
                      <IconTile size="sm">
                        <BenefitIcon />
                      </IconTile>
                      <div className={styles.cardHeading}>
                        <CardTitle level={3} className={styles.cardTitle}>
                          {benefit.name}
                        </CardTitle>
                        <Tag size="sm">{benefit.category}</Tag>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{benefit.description}</CardDescription>
                    </CardContent>
                    <CardFooter>
                      <Badge
                        tone={benefit.eligible ? 'success' : 'neutral'}
                        variant="soft"
                        icon={benefit.eligible ? <IconCircleCheck /> : <IconCircleX />}
                      >
                        {benefit.eligible ? 'Eligible' : 'Not eligible'}
                      </Badge>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
