import { useState, useRef, type KeyboardEvent } from 'react';
import styles from './Screen.module.css';

type PolicyStatus = 'active' | 'lapsed' | 'pending';

interface Policy {
  name: string;
  number: string;
  status: PolicyStatus;
  statusLabel: string;
}

interface CoverGroup {
  title: string;
  items: string[];
}

interface PolicyDocument {
  id: string;
  name: string;
  description: string;
  format: string;
  size: string;
}

interface Payment {
  id: string;
  date: string;
  amount: string;
  method: string;
  status: string;
}

const policy: Policy = {
  name: 'Comprehensive Home Insurance',
  number: 'POL-8842193-IN',
  status: 'active',
  statusLabel: 'Active',
};

const coverGroups: CoverGroup[] = [
  {
    title: "What's included",
    items: [
      'Buildings cover up to ₹1,50,00,000',
      'Contents cover up to ₹25,00,000',
      'Accidental damage to fixtures and fittings',
      'Fire, storm and flood damage',
      'Alternative accommodation while repairs are made',
      'Theft and attempted theft',
    ],
  },
  {
    title: "What's not included",
    items: [
      'Wear and tear or gradual deterioration',
      'Damage caused by pests or vermin',
      'Items used for business purposes',
      'Loss caused by an unoccupied property beyond 60 days',
    ],
  },
];

const documents: PolicyDocument[] = [
  {
    id: 'schedule',
    name: 'Policy schedule',
    description: 'Your cover summary, limits and premium',
    format: 'PDF',
    size: '245 KB',
  },
  {
    id: 'wording',
    name: 'Policy wording',
    description: 'The full terms and conditions of your policy',
    format: 'PDF',
    size: '1.2 MB',
  },
  {
    id: 'certificate',
    name: 'Certificate of insurance',
    description: 'Proof of cover for this policy',
    format: 'PDF',
    size: '180 KB',
  },
  {
    id: 'claims-guide',
    name: 'Claims guide',
    description: 'How to make a claim, step by step',
    format: 'PDF',
    size: '320 KB',
  },
];

const nextPayment = {
  amount: '₹4,250.00',
  dueDate: '14 October 2026',
  method: 'Visa ending 4471',
};

const paymentHistory: Payment[] = [
  { id: 'p1', date: '14 September 2026', amount: '₹4,250.00', method: 'Visa ending 4471', status: 'Paid' },
  { id: 'p2', date: '14 August 2026', amount: '₹4,250.00', method: 'Visa ending 4471', status: 'Paid' },
  { id: 'p3', date: '14 July 2026', amount: '₹4,250.00', method: 'Visa ending 4471', status: 'Paid' },
];

const tabs = [
  { id: 'cover', label: 'Cover' },
  { id: 'documents', label: 'Documents' },
  { id: 'payments', label: 'Payments' },
] as const;

type TabId = (typeof tabs)[number]['id'];

function CheckIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        d="M4 10.5l3.5 3.5 8.5-8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        d="M5 5l10 10M15 5L5 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        d="M5 2.5h6l4 4v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M11 2.5v4h4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        d="M10 3v9m0 0l-3.5-3.5M10 12l3.5-3.5M4 15.5h12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Screen() {
  const [activeTab, setActiveTab] = useState<TabId>('cover');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;

    if (nextIndex !== null) {
      event.preventDefault();
      setActiveTab(tabs[nextIndex].id);
      tabRefs.current[nextIndex]?.focus();
    }
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.policyName}>{policy.name}</h1>
          <p className={styles.policyNumber}>Policy number {policy.number}</p>
        </div>
        <span className={`${styles.statusBadge} ${styles[`status-${policy.status}`]}`}>
          {policy.statusLabel}
        </span>
      </header>

      <div className={styles.tabList} role="tablist" aria-label="Policy details">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'cover' && (
        <div
          className={styles.panel}
          role="tabpanel"
          id="panel-cover"
          aria-labelledby="tab-cover"
          tabIndex={0}
        >
          <div className={styles.coverGrid}>
            {coverGroups.map((group) => (
              <section key={group.title} className={styles.coverGroup}>
                <h2 className={styles.coverGroupTitle}>{group.title}</h2>
                <ul className={styles.coverList}>
                  {group.items.map((item) => (
                    <li key={item} className={styles.coverItem}>
                      <span
                        className={
                          group.title === "What's included"
                            ? styles.coverIconIncluded
                            : styles.coverIconExcluded
                        }
                      >
                        {group.title === "What's included" ? <CheckIcon /> : <CrossIcon />}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div
          className={styles.panel}
          role="tabpanel"
          id="panel-documents"
          aria-labelledby="tab-documents"
          tabIndex={0}
        >
          <ul className={styles.documentList}>
            {documents.map((doc) => (
              <li key={doc.id} className={styles.documentRow}>
                <span className={styles.documentIcon}>
                  <FileIcon />
                </span>
                <div className={styles.documentInfo}>
                  <p className={styles.documentName}>{doc.name}</p>
                  <p className={styles.documentDescription}>{doc.description}</p>
                </div>
                <span className={styles.documentMeta}>
                  {doc.format} · {doc.size}
                </span>
                <button type="button" className={styles.downloadButton} aria-label={`Download ${doc.name}`}>
                  <DownloadIcon />
                  <span>Download</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'payments' && (
        <div
          className={styles.panel}
          role="tabpanel"
          id="panel-payments"
          aria-labelledby="tab-payments"
          tabIndex={0}
        >
          <section className={styles.nextPayment}>
            <h2 className={styles.sectionTitle}>Next payment</h2>
            <div className={styles.nextPaymentCard}>
              <div>
                <p className={styles.nextPaymentAmount}>{nextPayment.amount}</p>
                <p className={styles.nextPaymentDue}>Due {nextPayment.dueDate}</p>
              </div>
              <p className={styles.nextPaymentMethod}>{nextPayment.method}</p>
            </div>
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Payment history</h2>
            <ul className={styles.paymentList}>
              {paymentHistory.map((payment) => (
                <li key={payment.id} className={styles.paymentRow}>
                  <div className={styles.paymentInfo}>
                    <p className={styles.paymentDate}>{payment.date}</p>
                    <p className={styles.paymentMethod}>{payment.method}</p>
                  </div>
                  <p className={styles.paymentAmount}>{payment.amount}</p>
                  <span className={styles.paymentStatus}>{payment.status}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
