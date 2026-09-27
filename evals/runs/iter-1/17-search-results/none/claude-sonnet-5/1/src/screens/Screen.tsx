import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
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
    id: 'snap',
    name: 'Supplemental Nutrition Assistance (SNAP)',
    category: 'Food & Nutrition',
    description: 'Monthly funds loaded onto a card to help pay for groceries.',
    eligible: true,
  },
  {
    id: 'medicaid',
    name: 'Medicaid',
    category: 'Healthcare',
    description: 'Free or low-cost health coverage for people who qualify.',
    eligible: true,
  },
  {
    id: 'section-8',
    name: 'Housing Choice Voucher',
    category: 'Housing',
    description: 'Rental assistance to help afford housing in the private market.',
    eligible: false,
  },
  {
    id: 'unemployment',
    name: 'Unemployment Insurance',
    category: 'Employment',
    description: 'Temporary income support while you look for your next job.',
    eligible: true,
  },
  {
    id: 'childcare',
    name: 'Child Care Subsidy',
    category: 'Family & Childcare',
    description: 'Lowers the cost of licensed child care for working families.',
    eligible: false,
  },
  {
    id: 'veterans-disability',
    name: 'Veterans Disability Compensation',
    category: 'Veterans',
    description: 'Monthly payments for veterans with service-connected conditions.',
    eligible: true,
  },
];

function matchesQuery(benefit: Benefit, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (normalized === '') return true;
  return (
    benefit.name.toLowerCase().includes(normalized) ||
    benefit.category.toLowerCase().includes(normalized)
  );
}

export default function Screen() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const inputId = useId();
  const listboxId = useId();

  const suggestions = useMemo(
    () => BENEFITS.filter((benefit) => matchesQuery(benefit, query)).slice(0, 6),
    [query],
  );

  const results = useMemo(() => {
    if (submittedQuery === null) return null;
    return BENEFITS.filter((benefit) => matchesQuery(benefit, submittedQuery));
  }, [submittedQuery]);

  function closeSuggestions() {
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function commitSearch(value: string) {
    setQuery(value);
    setSubmittedQuery(value);
    closeSuggestions();
  }

  function handleChange(value: string) {
    setQuery(value);
    setIsOpen(true);
    setActiveIndex(-1);
  }

  function handleClear() {
    setQuery('');
    setSubmittedQuery(null);
    closeSuggestions();
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          return;
        }
        if (suggestions.length === 0) return;
        setActiveIndex((index) => (index + 1) % suggestions.length);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          return;
        }
        if (suggestions.length === 0) return;
        setActiveIndex((index) => (index - 1 + suggestions.length) % suggestions.length);
        break;
      }
      case 'Home': {
        if (!isOpen || suggestions.length === 0) return;
        event.preventDefault();
        setActiveIndex(0);
        break;
      }
      case 'End': {
        if (!isOpen || suggestions.length === 0) return;
        event.preventDefault();
        setActiveIndex(suggestions.length - 1);
        break;
      }
      case 'Enter': {
        event.preventDefault();
        if (isOpen && activeIndex >= 0 && suggestions[activeIndex]) {
          commitSearch(suggestions[activeIndex].name);
        } else {
          commitSearch(query);
        }
        break;
      }
      case 'Escape': {
        if (isOpen) {
          event.preventDefault();
          closeSuggestions();
        }
        break;
      }
      default:
        break;
    }
  }

  const activeOptionId = activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;
  const showSuggestions = isOpen && suggestions.length > 0;
  const showNoSuggestions = isOpen && query.trim() !== '' && suggestions.length === 0;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Find a benefit</h1>
        <p className={styles.subtitle}>
          Search by benefit name or category to see what you may be eligible for.
        </p>
      </header>

      <div className={styles.searchField}>
        <label htmlFor={inputId} className={styles.label}>
          Search benefits
        </label>
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            id={inputId}
            className={styles.input}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeOptionId}
            autoComplete="off"
            placeholder="e.g. housing, food, health coverage"
            value={query}
            onChange={(event) => handleChange(event.target.value)}
            onFocus={() => setIsOpen(true)}
            onBlur={closeSuggestions}
            onKeyDown={handleKeyDown}
          />
          {query !== '' && (
            <button
              type="button"
              className={styles.clearButton}
              aria-label="Clear search"
              onMouseDown={(event) => event.preventDefault()}
              onClick={handleClear}
            >
              ×
            </button>
          )}
        </div>

        {showSuggestions && (
          <ul id={listboxId} role="listbox" className={styles.suggestions} aria-label="Benefit suggestions">
            {suggestions.map((benefit, index) => (
              <li
                key={benefit.id}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`${styles.suggestion} ${index === activeIndex ? styles.suggestionActive : ''}`}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commitSearch(benefit.name)}
              >
                <span className={styles.suggestionName}>{benefit.name}</span>
                <span className={styles.suggestionCategory}>{benefit.category}</span>
              </li>
            ))}
          </ul>
        )}

        {showNoSuggestions && (
          <div className={styles.suggestionsEmpty} role="status">
            No suggestions match “{query}”. Press Enter to search anyway.
          </div>
        )}
      </div>

      <section className={styles.results} aria-live="polite">
        {results === null ? (
          <p className={styles.hint}>Start typing above and pick a benefit to see your results.</p>
        ) : results.length === 0 ? (
          <div className={styles.noResults}>
            <p className={styles.noResultsTitle}>No benefits found</p>
            <p className={styles.noResultsBody}>
              We couldn’t find any benefits matching “{submittedQuery}”. Try a different name or
              category.
            </p>
          </div>
        ) : (
          <>
            <p className={styles.resultsCount}>
              {results.length} benefit{results.length === 1 ? '' : 's'} found
            </p>
            <ul className={styles.resultsGrid}>
              {results.map((benefit) => (
                <li key={benefit.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardName}>{benefit.name}</h2>
                    <span
                      className={`${styles.eligibility} ${
                        benefit.eligible ? styles.eligible : styles.notEligible
                      }`}
                    >
                      {benefit.eligible ? 'Eligible' : 'Not eligible'}
                    </span>
                  </div>
                  <span className={styles.category}>{benefit.category}</span>
                  <p className={styles.description}>{benefit.description}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
