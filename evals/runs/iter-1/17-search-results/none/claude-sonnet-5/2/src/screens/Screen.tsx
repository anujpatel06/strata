import { useId, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import styles from './Screen.module.css';

interface Benefit {
  id: string;
  name: string;
  category: string;
  description: string;
  eligible: boolean;
}

interface SearchTopic {
  id: string;
  term: string;
  benefits: Benefit[];
}

interface SearchResult {
  term: string;
  benefits: Benefit[];
}

const TOPICS: SearchTopic[] = [
  {
    id: 'food',
    term: 'Food and nutrition assistance',
    benefits: [
      {
        id: 'food-1',
        name: 'Supplemental Nutrition Assistance Program (SNAP)',
        category: 'Nutrition',
        description: 'Monthly grocery benefits loaded onto an EBT card for eligible households.',
        eligible: true,
      },
      {
        id: 'food-2',
        name: 'Women, Infants & Children (WIC)',
        category: 'Nutrition',
        description: 'Food vouchers and health referrals for pregnant people and young children.',
        eligible: false,
      },
      {
        id: 'food-3',
        name: 'National School Lunch Program',
        category: 'Nutrition',
        description: 'Free or reduced-price meals for students during the school day.',
        eligible: true,
      },
      {
        id: 'food-4',
        name: 'Emergency Food Bank Referral',
        category: 'Community support',
        description: 'Connects households to local food pantries for immediate short-term help.',
        eligible: true,
      },
      {
        id: 'food-5',
        name: 'Senior Farmers Market Nutrition Program',
        category: 'Senior care',
        description: 'Coupons for fresh produce at farmers markets for older adults.',
        eligible: false,
      },
      {
        id: 'food-6',
        name: 'Commodity Supplemental Food Program',
        category: 'Nutrition',
        description: 'Monthly food packages for low-income seniors aged 60 and older.',
        eligible: false,
      },
    ],
  },
  {
    id: 'housing',
    term: 'Housing and rental assistance',
    benefits: [
      {
        id: 'housing-1',
        name: 'Housing Choice Voucher (Section 8)',
        category: 'Housing',
        description: 'Rent subsidy that lets households choose housing in the private market.',
        eligible: false,
      },
      {
        id: 'housing-2',
        name: 'Public Housing',
        category: 'Housing',
        description: 'Below-market rental units owned and managed by the local housing authority.',
        eligible: true,
      },
      {
        id: 'housing-3',
        name: 'Emergency Rental Assistance',
        category: 'Housing',
        description: 'One-time payments toward rent and utility arrears to prevent eviction.',
        eligible: true,
      },
      {
        id: 'housing-4',
        name: 'Home Repair Grant',
        category: 'Housing',
        description: 'Funding for critical home repairs for low-income homeowners.',
        eligible: false,
      },
      {
        id: 'housing-5',
        name: 'Transitional Housing Program',
        category: 'Housing',
        description: 'Short-term housing with support services for people exiting homelessness.',
        eligible: false,
      },
      {
        id: 'housing-6',
        name: 'Weatherization Assistance',
        category: 'Utilities',
        description: 'Free home energy upgrades that lower heating and cooling costs.',
        eligible: true,
      },
    ],
  },
  {
    id: 'health',
    term: 'Health insurance and medical coverage',
    benefits: [
      {
        id: 'health-1',
        name: 'Medicaid',
        category: 'Health',
        description: 'Free or low-cost health coverage for eligible low-income adults and families.',
        eligible: true,
      },
      {
        id: 'health-2',
        name: "Children's Health Insurance Program (CHIP)",
        category: 'Health',
        description: 'Low-cost health coverage for children in families who earn too much for Medicaid.',
        eligible: true,
      },
      {
        id: 'health-3',
        name: 'Medicare Savings Program',
        category: 'Health',
        description: 'Helps pay Medicare premiums, deductibles, and copays for eligible seniors.',
        eligible: false,
      },
      {
        id: 'health-4',
        name: 'Marketplace Premium Tax Credit',
        category: 'Tax credit',
        description: 'Lowers monthly premiums for health plans bought on the insurance marketplace.',
        eligible: true,
      },
      {
        id: 'health-5',
        name: 'Family Planning Program',
        category: 'Health',
        description: 'Covers reproductive health visits and contraception at little or no cost.',
        eligible: false,
      },
      {
        id: 'health-6',
        name: 'Dental Assistance Program',
        category: 'Health',
        description: 'Covers routine and emergency dental care for qualifying low-income adults.',
        eligible: false,
      },
    ],
  },
  {
    id: 'childcare',
    term: 'Child care and early learning support',
    benefits: [
      {
        id: 'childcare-1',
        name: 'Child Care Subsidy',
        category: 'Child care',
        description: 'Helps working families pay for licensed child care.',
        eligible: true,
      },
      {
        id: 'childcare-2',
        name: 'Head Start',
        category: 'Child care',
        description: 'Free early learning, health, and nutrition services for children under five.',
        eligible: true,
      },
      {
        id: 'childcare-3',
        name: 'Early Intervention Services',
        category: 'Child care',
        description: 'Therapy and support for infants and toddlers with developmental delays.',
        eligible: false,
      },
      {
        id: 'childcare-4',
        name: 'After-School Program Voucher',
        category: 'Child care',
        description: 'Covers the cost of after-school care for school-age children.',
        eligible: true,
      },
      {
        id: 'childcare-5',
        name: 'Child Tax Credit',
        category: 'Tax credit',
        description: 'A yearly tax credit for each qualifying dependent child.',
        eligible: true,
      },
      {
        id: 'childcare-6',
        name: 'Diaper Bank Assistance',
        category: 'Community support',
        description: 'Free diapers and baby supplies for families in financial need.',
        eligible: false,
      },
    ],
  },
  {
    id: 'income',
    term: 'Unemployment and income support',
    benefits: [
      {
        id: 'income-1',
        name: 'Unemployment Insurance',
        category: 'Income support',
        description: 'Temporary payments for workers who lost their job through no fault of their own.',
        eligible: false,
      },
      {
        id: 'income-2',
        name: 'Earned Income Tax Credit',
        category: 'Tax credit',
        description: 'A refundable tax credit for low-to-moderate income working individuals.',
        eligible: true,
      },
      {
        id: 'income-3',
        name: 'Temporary Assistance for Needy Families (TANF)',
        category: 'Income support',
        description: "Cash assistance and work supports for families with children.",
        eligible: false,
      },
      {
        id: 'income-4',
        name: 'General Assistance',
        category: 'Income support',
        description: "State or county cash aid for adults who don't qualify for other programs.",
        eligible: true,
      },
      {
        id: 'income-5',
        name: 'Disability Insurance',
        category: 'Disability',
        description: 'Short-term wage replacement for workers unable to work due to illness or injury.',
        eligible: false,
      },
      {
        id: 'income-6',
        name: 'Emergency Cash Assistance',
        category: 'Community support',
        description: 'A one-time payment for households facing a sudden financial crisis.',
        eligible: true,
      },
    ],
  },
  {
    id: 'utilities',
    term: 'Utility and energy bill help',
    benefits: [
      {
        id: 'utilities-1',
        name: 'LIHEAP Energy Assistance',
        category: 'Utilities',
        description: 'Helps pay heating and cooling bills for income-eligible households.',
        eligible: true,
      },
      {
        id: 'utilities-2',
        name: 'Water Bill Assistance',
        category: 'Utilities',
        description: 'Grants to help households catch up on overdue water bills.',
        eligible: false,
      },
      {
        id: 'utilities-3',
        name: 'Lifeline Phone and Internet Discount',
        category: 'Utilities',
        description: 'A monthly discount on phone or internet service for qualifying households.',
        eligible: true,
      },
      {
        id: 'utilities-4',
        name: 'Summer Cooling Assistance',
        category: 'Utilities',
        description: 'A one-time payment toward cooling costs during extreme summer heat.',
        eligible: false,
      },
      {
        id: 'utilities-5',
        name: 'Emergency Utility Fund',
        category: 'Utilities',
        description: 'A one-time grant to prevent shutoff of electric or gas service.',
        eligible: true,
      },
      {
        id: 'utilities-6',
        name: 'Budget Billing Program',
        category: 'Utilities',
        description: 'Levels out monthly utility payments to avoid seasonal spikes.',
        eligible: false,
      },
    ],
  },
  {
    id: 'senior',
    term: 'Senior and disability services',
    benefits: [
      {
        id: 'senior-1',
        name: 'Supplemental Security Income (SSI)',
        category: 'Disability',
        description: 'A monthly cash benefit for people with limited income who are disabled or 65+.',
        eligible: false,
      },
      {
        id: 'senior-2',
        name: 'Social Security Disability Insurance (SSDI)',
        category: 'Disability',
        description: 'A monthly benefit for workers who become disabled after paying into Social Security.',
        eligible: false,
      },
      {
        id: 'senior-3',
        name: 'Meals on Wheels',
        category: 'Senior care',
        description: 'Delivers nutritious meals to homebound seniors.',
        eligible: true,
      },
      {
        id: 'senior-4',
        name: 'In-Home Care Services',
        category: 'Senior care',
        description: 'Personal care and homemaking help so seniors can stay in their homes.',
        eligible: true,
      },
      {
        id: 'senior-5',
        name: 'Medicare Part D Extra Help',
        category: 'Health',
        description: 'Lowers prescription drug costs for people with Medicare.',
        eligible: false,
      },
      {
        id: 'senior-6',
        name: 'Property Tax Relief for Seniors',
        category: 'Tax credit',
        description: 'Reduces property taxes for qualifying senior homeowners.',
        eligible: true,
      },
    ],
  },
  {
    id: 'veteran',
    term: 'Veteran and military benefits',
    benefits: [],
  },
];

function findTopicByTerm(term: string): SearchTopic | undefined {
  const normalized = term.trim().toLowerCase();
  return TOPICS.find((topic) => topic.term.toLowerCase() === normalized);
}

function highlightMatch(label: string, query: string) {
  const start = label.toLowerCase().indexOf(query.trim().toLowerCase());
  if (!query.trim() || start === -1) return label;
  const end = start + query.trim().length;
  return (
    <>
      {label.slice(0, start)}
      <strong className={styles.match}>{label.slice(start, end)}</strong>
      {label.slice(end)}
    </>
  );
}

function EligibilityBadge({ eligible }: { eligible: boolean }) {
  return (
    <span className={eligible ? styles.eligibleBadge : styles.ineligibleBadge}>
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
        {eligible ? (
          <path
            d="M6.5 11.5 3 8l1.06-1.06L6.5 9.38l5.44-5.44L13 5l-6.5 6.5Z"
            fill="currentColor"
          />
        ) : (
          <path
            d="M4 4l8 8M12 4l-8 8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </svg>
      {eligible ? 'Eligible' : 'Not eligible'}
    </span>
  );
}

export default function Screen() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [result, setResult] = useState<SearchResult | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const getOptionId = (index: number) => `${listboxId}-option-${index}`;

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return TOPICS.filter((topic) => topic.term.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  const showSuggestions = isOpen && suggestions.length > 0;

  function runSearch(term: string) {
    const trimmed = term.trim();
    if (!trimmed) return;
    const topic = findTopicByTerm(trimmed);
    setResult({ term: topic ? topic.term : trimmed, benefits: topic ? topic.benefits : [] });
    setQuery(topic ? topic.term : trimmed);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
    setIsOpen(true);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (showSuggestions) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % suggestions.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        runSearch(activeIndex >= 0 ? suggestions[activeIndex].term : query);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        return;
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      runSearch(query);
    }
  }

  function handleSuggestionClick(topic: SearchTopic) {
    runSearch(topic.term);
    inputRef.current?.focus();
  }

  function handleNewSearch() {
    setResult(null);
    setQuery('');
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Find benefits you may qualify for</h1>
      <p className={styles.subtitle}>
        Search for a program by topic, like &ldquo;child care&rdquo; or &ldquo;food assistance&rdquo;.
      </p>

      <div className={styles.searchWrap}>
        <label htmlFor="benefit-search" className={styles.label}>
          Search for a benefit
        </label>
        <div className={styles.comboboxWrap}>
          <svg
            className={styles.searchIcon}
            viewBox="0 0 16 16"
            width="16"
            height="16"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" fill="none" />
            <line x1="11" y1="11" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            id="benefit-search"
            ref={inputRef}
            className={styles.input}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setIsOpen(false)}
            placeholder="Try 'food assistance' or 'child care'"
            role="combobox"
            aria-expanded={showSuggestions}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? getOptionId(activeIndex) : undefined}
            autoComplete="off"
          />
          {showSuggestions && (
            <ul id={listboxId} role="listbox" className={styles.listbox} aria-label="Search suggestions">
              {suggestions.map((topic, index) => (
                <li
                  key={topic.id}
                  id={getOptionId(index)}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={index === activeIndex ? styles.optionActive : styles.option}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSuggestionClick(topic);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {highlightMatch(topic.term, query)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {result && (
        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <p className={styles.resultsSummary}>
              {result.benefits.length > 0
                ? `${result.benefits.length} results for “${result.term}”`
                : `No results for “${result.term}”`}
            </p>
            <button type="button" className={styles.newSearchButton} onClick={handleNewSearch}>
              New search
            </button>
          </div>

          {result.benefits.length > 0 ? (
            <ul className={styles.grid}>
              {result.benefits.map((benefit) => (
                <li key={benefit.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <span className={styles.category}>{benefit.category}</span>
                    <EligibilityBadge eligible={benefit.eligible} />
                  </div>
                  <h2 className={styles.cardName}>{benefit.name}</h2>
                  <p className={styles.cardDescription}>{benefit.description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.emptyState}>
              <svg
                viewBox="0 0 48 48"
                width="40"
                height="40"
                aria-hidden="true"
                focusable="false"
                className={styles.emptyIcon}
              >
                <circle cx="21" cy="21" r="13" stroke="currentColor" strokeWidth="2.5" fill="none" />
                <line x1="30.5" y1="30.5" x2="41" y2="41" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="17" y1="21" x2="25" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <p className={styles.emptyTitle}>We couldn&apos;t find any matching benefits</p>
              <p className={styles.emptyText}>
                Try a different search term, like &ldquo;housing&rdquo; or &ldquo;health coverage&rdquo;.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
