import { useId, useState } from 'react';
import styles from './Screen.module.css';

type PolicyStatus = 'active' | 'renewal-due' | 'lapsed';

interface Policy {
  productName: string;
  policyNumber: string;
  status: PolicyStatus;
}

interface PolicyDocument {
  id: string;
  name: string;
  format: string;
  size: string;
}

interface PaymentRecord {
  id: string;
  date: string;
  amount: string;
  status: 'Paid' | 'Failed';
}

const policy: Policy = {
  productName: 'Comprehensive Auto Shield',
  policyNumber: 'POL-8847-2291',
  status: 'renewal-due',
};

const statusLabel: Record<PolicyStatus, string> = {
  active: 'Active',
  'renewal-due': 'Renewal due',
  lapsed: 'Lapsed',
};

const cover = {
  included: [
    'Accidental damage to your vehicle',
    'Fire and theft',
    'Third-party liability up to $10,000,000',
    'Windscreen and glass repair',
    'Personal accident cover for the driver',
    'Courtesy car while yours is being repaired',
  ],
  excluded: [
    'General wear and tear',
    'Driving under the influence',
    'Use for commercial deliveries or hire',
    'Damage that occurs outside the policy territory',
  ],
};

const documents: PolicyDocument[] = [
  { id: 'doc-schedule', name: 'Policy schedule', format: 'PDF', size: '212 KB' },
  { id: 'doc-certificate', name: 'Certificate of insurance', format: 'PDF', size: '84 KB' },
  { id: 'doc-wording', name: 'Policy wording', format: 'PDF', size: '1.4 MB' },
  { id: 'doc-statement', name: 'Statement of insurance', format: 'PDF', size: '96 KB' },
];

const payments = {
  next: {
    amount: '$128.40',
    dueDate: '14 Nov 2026',
    method: 'Visa •••• 4471',
  },
  history: [
    { id: 'pay-1', date: '14 Sep 2026', amount: '$128.40', status: 'Paid' },
    { id: 'pay-2', date: '14 Aug 2026', amount: '$128.40', status: 'Paid' },
    { id: 'pay-3', date: '14 Jul 2026', amount: '$121.90', status: 'Paid' },
  ] satisfies PaymentRecord[],
};

const tabs = [
  { id: 'cover', label: 'Cover' },
  { id: 'documents', label: 'Documents' },
  { id: 'payments', label: 'Payments' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function Screen() {
  const [activeTab, setActiveTab] = useState<TabId>('cover');
  const baseId = useId();

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (index + direction + tabs.length) % tabs.length;
    setActiveTab(tabs[nextIndex].id);
    document.getElementById(`${baseId}-tab-${tabs[nextIndex].id}`)?.focus();
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{policy.productName}</h1>
          <p className={styles.subtitle}>Policy number {policy.policyNumber}</p>
        </div>
        <span className={styles.status} data-status={policy.status}>
          {statusLabel[policy.status]}
        </span>
      </header>

      <div className={styles.tablist} role="tablist" aria-label="Policy details">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`${baseId}-tab-${tab.id}`}
            type="button"
            role="tab"
            className={styles.tab}
            aria-selected={activeTab === tab.id}
            aria-controls={`${baseId}-panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'cover' && (
        <section
          id={`${baseId}-panel-cover`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-cover`}
          className={styles.panel}
        >
          <div className={styles.coverGrid}>
            <div className={styles.coverColumn}>
              <h2 className={styles.coverHeading}>What&apos;s included</h2>
              <ul className={styles.coverList}>
                {cover.included.map((item) => (
                  <li key={item} className={styles.coverItem}>
                    <span className={styles.coverIcon} data-kind="included" aria-hidden="true">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.coverColumn}>
              <h2 className={styles.coverHeading}>What&apos;s not included</h2>
              <ul className={styles.coverList}>
                {cover.excluded.map((item) => (
                  <li key={item} className={styles.coverItem}>
                    <span className={styles.coverIcon} data-kind="excluded" aria-hidden="true">
                      ✕
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'documents' && (
        <section
          id={`${baseId}-panel-documents`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-documents`}
          className={styles.panel}
        >
          <ul className={styles.documentList}>
            {documents.map((doc) => (
              <li key={doc.id} className={styles.documentRow}>
                <div className={styles.documentInfo}>
                  <span className={styles.documentName}>{doc.name}</span>
                  <span className={styles.documentMeta}>
                    {doc.format} · {doc.size}
                  </span>
                </div>
                <button type="button" className={styles.downloadButton}>
                  <span aria-hidden="true">⭳</span> Download
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === 'payments' && (
        <section
          id={`${baseId}-panel-payments`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-payments`}
          className={styles.panel}
        >
          <div className={styles.nextPayment}>
            <div>
              <p className={styles.nextPaymentLabel}>Next payment</p>
              <p className={styles.nextPaymentAmount}>{payments.next.amount}</p>
            </div>
            <div className={styles.nextPaymentMeta}>
              <p>Due {payments.next.dueDate}</p>
              <p>{payments.next.method}</p>
            </div>
          </div>

          <h2 className={styles.historyHeading}>Payment history</h2>
          <ul className={styles.historyList}>
            {payments.history.map((record) => (
              <li key={record.id} className={styles.historyRow}>
                <span className={styles.historyDate}>{record.date}</span>
                <span className={styles.historyAmount}>{record.amount}</span>
                <span className={styles.historyStatus} data-status={record.status.toLowerCase()}>
                  {record.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
