import { Badge, Button, Card, CardContent, IconTile, Link, Tab, TabList, TabPanel, Tabs } from '@strata/react';
import {
  IconCalendar,
  IconCheck,
  IconDownload,
  IconFileInvoice,
  IconFileText,
  IconReceipt,
  IconX,
} from '@strata/icons';
import styles from './Screen.module.css';

interface CoverItem {
  id: string;
  label: string;
  detail: string;
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
  amount: number;
  method: string;
  status: 'paid' | 'upcoming';
}

const policy = {
  name: 'Complete Home Cover',
  number: 'POL-4471-8823',
  status: 'active' as const,
};

const included: CoverItem[] = [
  { id: 'fire', label: 'Fire & smoke damage', detail: 'Structure and contents, up to sum insured' },
  { id: 'theft', label: 'Theft & burglary', detail: 'Includes forced entry and attempted break-ins' },
  { id: 'water', label: 'Water damage', detail: 'Burst pipes and accidental leaks' },
  { id: 'liability', label: 'Personal liability', detail: 'Up to ₹10,00,000 per incident' },
];

const excluded: CoverItem[] = [
  { id: 'flood', label: 'Flood & natural disaster', detail: 'Available as an add-on' },
  { id: 'wear', label: 'Wear and tear', detail: 'Gradual deterioration is not covered' },
  { id: 'unoccupied', label: 'Unoccupied over 60 days', detail: 'Cover pauses until re-occupied' },
];

const documents: PolicyDocument[] = [
  { id: 'schedule', name: 'Policy schedule', description: 'Your cover, limits and premium at a glance', format: 'PDF', size: '212 KB' },
  { id: 'wording', name: 'Policy wording', description: 'Full terms and conditions', format: 'PDF', size: '1.4 MB' },
  { id: 'certificate', name: 'Certificate of insurance', description: 'Proof of cover for third parties', format: 'PDF', size: '98 KB' },
  { id: 'ipid', name: 'Insurance product information', description: 'A short summary of this product', format: 'PDF', size: '156 KB' },
];

const nextPayment: Payment = { id: 'next', date: '14 Oct 2026', amount: 2450, method: 'UPI autopay', status: 'upcoming' };

const paymentHistory: Payment[] = [
  { id: 'p1', date: '14 Sep 2026', amount: 2450, method: 'UPI autopay', status: 'paid' },
  { id: 'p2', date: '14 Aug 2026', amount: 2450, method: 'UPI autopay', status: 'paid' },
  { id: 'p3', date: '14 Jul 2026', amount: 2450, method: 'Credit card', status: 'paid' },
];

function formatAmount(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

const statusBadge = {
  paid: { tone: 'success' as const, label: 'Paid' },
  upcoming: { tone: 'info' as const, label: 'Upcoming' },
};

export default function Screen() {
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.eyebrow}>Policy</p>
          <h1 className={styles.title}>{policy.name}</h1>
          <p className={styles.number}>{policy.number}</p>
        </div>
        <Badge tone="success" variant="soft" dot>
          Active
        </Badge>
      </header>

      <Tabs className={styles.tabs}>
        <TabList aria-label="Policy sections" className={styles.tabList}>
          <Tab id="cover">Cover</Tab>
          <Tab id="documents">Documents</Tab>
          <Tab id="payments">Payments</Tab>
        </TabList>

        <TabPanel id="cover" className={styles.panel}>
          <div className={styles.coverGroups}>
            <section className={styles.coverGroup}>
              <h2 className={styles.groupTitle}>What&apos;s included</h2>
              <ul className={styles.coverList}>
                {included.map((item) => (
                  <li key={item.id} className={styles.coverRow}>
                    <span className={`${styles.coverIcon} ${styles.coverIconYes}`}>
                      <IconCheck size={16} />
                    </span>
                    <div>
                      <p className={styles.coverLabel}>{item.label}</p>
                      <p className={styles.coverDetail}>{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className={styles.coverGroup}>
              <h2 className={styles.groupTitle}>What&apos;s not included</h2>
              <ul className={styles.coverList}>
                {excluded.map((item) => (
                  <li key={item.id} className={styles.coverRow}>
                    <span className={`${styles.coverIcon} ${styles.coverIconNo}`}>
                      <IconX size={16} />
                    </span>
                    <div>
                      <p className={styles.coverLabel}>{item.label}</p>
                      <p className={styles.coverDetail}>{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </TabPanel>

        <TabPanel id="documents" className={styles.panel}>
          <ul className={styles.documentList}>
            {documents.map((doc) => (
              <li key={doc.id}>
                <Card variant="outline" className={styles.documentCard}>
                  <CardContent className={styles.documentContent}>
                    <IconTile tint="none" size="md">
                      <IconFileText />
                    </IconTile>
                    <div className={styles.documentText}>
                      <p className={styles.documentName}>{doc.name}</p>
                      <p className={styles.documentDescription}>{doc.description}</p>
                      <p className={styles.documentMeta}>
                        {doc.format} · {doc.size}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <IconDownload size={16} />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </TabPanel>

        <TabPanel id="payments" className={styles.panel}>
          <Card variant="default" className={styles.nextPaymentCard}>
            <CardContent className={styles.nextPaymentContent}>
              <IconTile tint="solid" size="lg">
                <IconCalendar />
              </IconTile>
              <div className={styles.nextPaymentText}>
                <p className={styles.groupTitle}>Next payment</p>
                <p className={styles.nextPaymentAmount}>{formatAmount(nextPayment.amount)}</p>
                <p className={styles.documentMeta}>
                  Due {nextPayment.date} · {nextPayment.method}
                </p>
              </div>
              <Badge tone={statusBadge[nextPayment.status].tone} variant="soft">
                {statusBadge[nextPayment.status].label}
              </Badge>
            </CardContent>
          </Card>

          <section className={styles.paymentHistory}>
            <h2 className={styles.groupTitle}>Last 3 payments</h2>
            <ul className={styles.paymentList}>
              {paymentHistory.map((payment) => (
                <li key={payment.id} className={styles.paymentRow}>
                  <span className={styles.paymentIcon}>
                    <IconReceipt size={18} />
                  </span>
                  <div className={styles.paymentText}>
                    <p className={styles.coverLabel}>{payment.date}</p>
                    <p className={styles.documentMeta}>{payment.method}</p>
                  </div>
                  <span className={styles.paymentAmount}>{formatAmount(payment.amount)}</span>
                  <Badge tone={statusBadge[payment.status].tone} variant="soft" size="sm">
                    {statusBadge[payment.status].label}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>

          <Link variant="standalone" href="#" className={styles.allPaymentsLink}>
            View all payments
            <IconFileInvoice size={16} />
          </Link>
        </TabPanel>
      </Tabs>
    </div>
  );
}
