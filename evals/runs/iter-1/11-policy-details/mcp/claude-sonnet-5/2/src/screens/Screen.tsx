import {
  Amount,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Eyebrow,
  IconTile,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from '@strata/react';
import {
  IconCalendarEvent,
  IconCheck,
  IconFileText,
  IconDownload,
  IconShieldCheck,
  IconX,
} from '@strata/icons';
import styles from './Screen.module.css';

interface CoverItem {
  id: string;
  label: string;
}

interface PolicyDocument {
  id: string;
  name: string;
  description: string;
  size: string;
  updated: string;
}

interface Payment {
  id: string;
  date: string;
  status: 'paid' | 'due';
}

const policy = {
  name: 'Family Health Cover',
  number: 'POL-4471-2093',
  status: 'active' as const,
};

const covered: CoverItem[] = [
  { id: 'hospital', label: 'In-patient hospitalisation' },
  { id: 'daycare', label: 'Day-care procedures' },
  { id: 'ambulance', label: 'Emergency ambulance transport' },
  { id: 'checkup', label: 'Annual health check-up' },
];

const notCovered: CoverItem[] = [
  { id: 'cosmetic', label: 'Cosmetic treatment' },
  { id: 'dental', label: 'Routine dental care' },
  { id: 'preexisting', label: 'Pre-existing conditions (first 2 years)' },
];

const documents: PolicyDocument[] = [
  { id: 'schedule', name: 'Policy schedule', description: 'Cover summary and limits', size: '210 KB', updated: 'Updated 3 Jan 2026' },
  { id: 'wording', name: 'Policy wording', description: 'Full terms and conditions', size: '1.2 MB', updated: 'Updated 3 Jan 2026' },
  { id: 'certificate', name: 'Certificate of insurance', description: 'Proof of cover', size: '96 KB', updated: 'Updated 3 Jan 2026' },
  { id: 'claims-guide', name: 'Claims guide', description: 'How to make a claim', size: '340 KB', updated: 'Updated 12 Nov 2025' },
];

const nextPayment = {
  amount: 4250,
  currency: 'INR',
  dueDate: '4 October 2026',
};

const paymentHistory: Payment[] = [
  { id: 'pay-1', date: '4 September 2026', status: 'paid' },
  { id: 'pay-2', date: '4 August 2026', status: 'paid' },
  { id: 'pay-3', date: '4 July 2026', status: 'paid' },
];

export default function Screen() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <Eyebrow icon={<IconShieldCheck aria-hidden />}>Policy</Eyebrow>
          <h1 className={styles.title}>{policy.name}</h1>
          <p className={styles.policyNumber}>{policy.number}</p>
        </div>
        <Badge variant="status" tone="success">
          Active
        </Badge>
      </header>

      <Tabs defaultSelectedKey="cover">
        <TabList aria-label="Policy details">
          <Tab id="cover">Cover</Tab>
          <Tab id="documents" count={documents.length}>
            Documents
          </Tab>
          <Tab id="payments">Payments</Tab>
        </TabList>

        <TabPanel id="cover">
          <div className={styles.coverGrid}>
            <Card variant="outline">
              <CardHeader>
                <CardTitle level={2}>What&apos;s included</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className={styles.coverList}>
                  {covered.map((item) => (
                    <li key={item.id} className={styles.coverRow}>
                      <IconCheck aria-hidden className={styles.includedIcon} />
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card variant="outline">
              <CardHeader>
                <CardTitle level={2}>What&apos;s not included</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className={styles.coverList}>
                  {notCovered.map((item) => (
                    <li key={item.id} className={styles.coverRow}>
                      <IconX aria-hidden className={styles.excludedIcon} />
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabPanel>

        <TabPanel id="documents">
          <Card variant="outline">
            <CardContent variant="inset">
              <ul className={styles.documentList}>
                {documents.map((doc) => (
                  <li key={doc.id} className={styles.documentRow}>
                    <IconTile>
                      <IconFileText aria-hidden />
                    </IconTile>
                    <div className={styles.documentText}>
                      <span className={styles.documentName}>{doc.name}</span>
                      <span className={styles.documentMeta}>
                        {doc.description} · {doc.size} · {doc.updated}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm">
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
          <div className={styles.paymentsStack}>
            <Card>
              <CardHeader>
                <CardTitle level={2}>Next payment</CardTitle>
                <CardDescription>
                  <IconCalendarEvent aria-hidden />
                  Due {nextPayment.dueDate}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Amount value={nextPayment.amount} currency={nextPayment.currency} size="lg" />
              </CardContent>
              <CardFooter>
                <Button>Pay now</Button>
              </CardFooter>
            </Card>

            <Card variant="outline">
              <CardHeader>
                <CardTitle level={2}>Last 3 payments</CardTitle>
              </CardHeader>
              <CardContent variant="inset">
                <ul className={styles.paymentList}>
                  {paymentHistory.map((payment) => (
                    <li key={payment.id} className={styles.paymentRow}>
                      <span>{payment.date}</span>
                      <div className={styles.paymentRight}>
                        <Amount value={nextPayment.amount} currency={nextPayment.currency} size="sm" />
                        <Badge variant="status" tone="success">
                          Paid
                        </Badge>
                      </div>
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
