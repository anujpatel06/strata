import {
  Amount,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from '@syntara/react';
import { IconCircleCheck, IconCircleX, IconDownload, IconFileText } from '@syntara/icons';
import styles from './Screen.module.css';

type PolicyStatus = 'active' | 'lapsed' | 'pending';

const policy = {
  name: 'Family Health Shield',
  number: 'POL-8823-4410',
  status: 'active' as PolicyStatus,
};

const statusCopy: Record<PolicyStatus, { label: string; tone: 'success' | 'danger' | 'warning' }> = {
  active: { label: 'Active', tone: 'success' },
  lapsed: { label: 'Lapsed', tone: 'danger' },
  pending: { label: 'Pending', tone: 'warning' },
};

const included = [
  'Hospitalisation for you and your family',
  'Pre and post-hospitalisation expenses',
  'Daycare procedures',
  'Ambulance charges',
  'Annual health check-up',
];

const excluded = ['Cosmetic treatment', 'Dental and vision care', 'Self-inflicted injury', 'Treatment outside India'];

type Document = {
  id: string;
  name: string;
  type: string;
  size: string;
};

const documents: Document[] = [
  { id: 'doc-1', name: 'Policy schedule', type: 'PDF', size: '412 KB' },
  { id: 'doc-2', name: 'Terms and conditions', type: 'PDF', size: '1.1 MB' },
  { id: 'doc-3', name: 'Premium receipt', type: 'PDF', size: '96 KB' },
  { id: 'doc-4', name: 'Nomination form', type: 'PDF', size: '158 KB' },
];

const nextPayment = {
  amount: 18450,
  currency: 'INR',
  dueDate: '4 October 2026',
};

type Payment = {
  id: string;
  date: string;
  method: string;
  amount: number;
  currency: string;
};

const paymentHistory: Payment[] = [
  { id: 'pay-1', date: '4 July 2026', method: 'Auto-debit · UPI', amount: 18450, currency: 'INR' },
  { id: 'pay-2', date: '4 April 2026', method: 'Auto-debit · UPI', amount: 18450, currency: 'INR' },
  { id: 'pay-3', date: '4 January 2026', method: 'Net banking', amount: 18450, currency: 'INR' },
];

export default function Screen() {
  const status = statusCopy[policy.status];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.name}>{policy.name}</h1>
          <p className={styles.number}>Policy number {policy.number}</p>
        </div>
        <Badge variant="status" tone={status.tone}>
          {status.label}
        </Badge>
      </header>

      <Tabs defaultSelectedKey="cover">
        <TabList aria-label="Policy details">
          <Tab id="cover">Cover</Tab>
          <Tab id="documents">Documents</Tab>
          <Tab id="payments">Payments</Tab>
        </TabList>

        <TabPanel id="cover">
          <div className={styles.coverGrid}>
            <Card variant="outline">
              <CardHeader>
                <CardTitle level={2}>What's included</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className={styles.coverList}>
                  {included.map((item) => (
                    <li key={item} className={styles.coverItem}>
                      <IconCircleCheck aria-hidden className={styles.iconSuccess} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card variant="outline">
              <CardHeader>
                <CardTitle level={2}>What's not included</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className={styles.coverList}>
                  {excluded.map((item) => (
                    <li key={item} className={styles.coverItem}>
                      <IconCircleX aria-hidden className={styles.iconDanger} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabPanel>

        <TabPanel id="documents">
          <Card>
            <CardHeader>
              <CardTitle level={2}>Documents</CardTitle>
              <CardDescription>Download a copy for your records.</CardDescription>
            </CardHeader>
            <CardContent variant="inset">
              <ul className={styles.list}>
                {documents.map((doc) => (
                  <li key={doc.id} className={styles.listRow}>
                    <span className={styles.docIcon}>
                      <IconFileText aria-hidden />
                    </span>
                    <div className={styles.listText}>
                      <span className={styles.listTitle}>{doc.name}</span>
                      <span className={styles.listMeta}>
                        {doc.type} · {doc.size}
                      </span>
                    </div>
                    <Button variant="outline" size="sm">
                      <IconDownload aria-hidden />
                      Download
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel id="payments">
          <div className={styles.paymentsGrid}>
            <Card variant="outline">
              <CardHeader>
                <CardTitle level={2}>Next payment</CardTitle>
                <CardDescription>Due {nextPayment.dueDate}</CardDescription>
              </CardHeader>
              <CardContent>
                <Amount value={nextPayment.amount} currency={nextPayment.currency} size="lg" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle level={2}>Last 3 payments</CardTitle>
              </CardHeader>
              <CardContent variant="inset">
                <ul className={styles.list}>
                  {paymentHistory.map((payment) => (
                    <li key={payment.id} className={styles.listRow}>
                      <div className={styles.listText}>
                        <span className={styles.listTitle}>{payment.date}</span>
                        <span className={styles.listMeta}>{payment.method}</span>
                      </div>
                      <Amount value={payment.amount} currency={payment.currency} size="sm" />
                      <Badge variant="status" tone="success">
                        Paid
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}
