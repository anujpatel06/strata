import type { ReactNode } from 'react';
import {
  Amount,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  DataTable,
  type DataTableColumn,
  Eyebrow,
  IconTile,
  Link,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from '@strata/react';
import {
  IconCalendar,
  IconCar,
  IconCheck,
  IconCreditCard,
  IconDownload,
  IconFileText,
  IconX,
} from '@strata/icons';
import styles from './Screen.module.css';

interface Policy {
  name: string;
  number: string;
  status: 'active' | 'lapsed' | 'pending';
  vehicle: string;
  renewsOn: string;
}

interface DocumentFile {
  id: string;
  name: string;
  type: string;
  size: string;
}

interface Payment {
  id: string;
  date: string;
  method: string;
  amount: number;
  currency: string;
}

const policy: Policy = {
  name: 'Comprehensive Car Insurance',
  number: 'POL-8823-4471',
  status: 'active',
  vehicle: 'Honda City ZX · DL 4C AB 1234',
  renewsOn: '14 Mar 2027',
};

const statusLabel: Record<Policy['status'], string> = {
  active: 'Active',
  lapsed: 'Lapsed',
  pending: 'Pending',
};

const statusTone: Record<Policy['status'], 'success' | 'danger' | 'warning'> = {
  active: 'success',
  lapsed: 'danger',
  pending: 'warning',
};

const included = [
  'Accidental damage to your vehicle',
  'Third-party injury and property liability',
  'Fire, theft and burglary',
  'Windscreen and glass repair',
  '24/7 roadside assistance',
  'No-claim bonus protection',
];

const excluded = [
  'General wear and tear',
  'Driving without a valid licence',
  'Racing, rallying or speed trials',
  'Use outside the policy region',
];

const documents: DocumentFile[] = [
  { id: 'schedule', name: 'Policy schedule', type: 'PDF', size: '248 KB' },
  { id: 'certificate', name: 'Certificate of insurance', type: 'PDF', size: '96 KB' },
  { id: 'wording', name: 'Policy wording', type: 'PDF', size: '1.4 MB' },
  { id: 'claims-guide', name: 'Claims guide', type: 'PDF', size: '512 KB' },
];

const nextPayment: Payment = { id: 'next', date: '4 Oct 2026', method: 'UPI autopay', amount: 4250, currency: 'INR' };

const paymentHistory: Payment[] = [
  { id: 'p1', date: '4 Sep 2026', method: 'UPI autopay', amount: 4250, currency: 'INR' },
  { id: 'p2', date: '4 Aug 2026', method: 'UPI autopay', amount: 4250, currency: 'INR' },
  { id: 'p3', date: '4 Jul 2026', method: 'Credit card', amount: 4250, currency: 'INR' },
];

const paymentColumns: DataTableColumn<Payment>[] = [
  { id: 'date', header: 'Date', isRowHeader: true, cell: (row) => row.date },
  { id: 'method', header: 'Method', cell: (row) => row.method },
  {
    id: 'amount',
    header: 'Amount',
    align: 'end',
    cell: (row) => <Amount value={row.amount} currency={row.currency} size="sm" />,
  },
  {
    id: 'status',
    header: 'Status',
    cell: () => (
      <Badge tone="success" variant="soft" size="sm">
        Paid
      </Badge>
    ),
  },
];

function CoverList({ items, icon, tone }: { items: string[]; icon: ReactNode; tone: 'included' | 'excluded' }) {
  return (
    <ul className={styles.coverList}>
      {items.map((item) => (
        <li key={item} className={styles.coverItem}>
          <span className={tone === 'included' ? styles.includedIcon : styles.excludedIcon}>{icon}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Screen() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.identity}>
          <IconTile tint="solid" size="lg">
            <IconCar />
          </IconTile>
          <div>
            <Eyebrow>Motor insurance</Eyebrow>
            <h1 className={styles.title}>{policy.name}</h1>
            <p className={styles.meta}>
              Policy no. {policy.number} · {policy.vehicle}
            </p>
          </div>
        </div>
        <div className={styles.statusCol}>
          <Badge tone={statusTone[policy.status]} variant="soft" dot>
            {statusLabel[policy.status]}
          </Badge>
          <p className={styles.renewal}>Renews {policy.renewsOn}</p>
        </div>
      </header>

      <Tabs variant="underline">
        <TabList aria-label="Policy details sections">
          <Tab id="cover">Cover</Tab>
          <Tab id="documents">Documents</Tab>
          <Tab id="payments">Payments</Tab>
        </TabList>

        <TabPanel id="cover" className={styles.panel}>
          <div className={styles.coverGrid}>
            <Card>
              <CardHeader>
                <CardTitle level={2}>What&apos;s included</CardTitle>
              </CardHeader>
              <CardContent>
                <CoverList items={included} icon={<IconCheck />} tone="included" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle level={2}>What&apos;s not included</CardTitle>
              </CardHeader>
              <CardContent>
                <CoverList items={excluded} icon={<IconX />} tone="excluded" />
              </CardContent>
            </Card>
          </div>
        </TabPanel>

        <TabPanel id="documents" className={styles.panel}>
          <Card>
            <CardHeader divider>
              <CardTitle level={2}>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className={styles.documentList}>
                {documents.map((doc) => (
                  <li key={doc.id} className={styles.documentRow}>
                    <div className={styles.documentInfo}>
                      <IconTile tint="none">
                        <IconFileText />
                      </IconTile>
                      <div>
                        <p className={styles.documentName}>{doc.name}</p>
                        <p className={styles.documentMeta}>
                          {doc.type} · {doc.size}
                        </p>
                      </div>
                    </div>
                    <Link variant="standalone" href="#" download className={styles.downloadLink}>
                      <span className={styles.downloadLabel}>
                        Download
                        <IconDownload />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel id="payments" className={styles.panel}>
          <div className={styles.paymentsLayout}>
            <Card>
              <CardHeader>
                <CardTitle level={2}>Next payment</CardTitle>
              </CardHeader>
              <CardContent className={styles.nextPaymentContent}>
                <Amount value={nextPayment.amount} currency={nextPayment.currency} size="lg" />
                <p className={styles.nextPaymentMeta}>
                  <IconCalendar />
                  Due {nextPayment.date}
                </p>
                <p className={styles.nextPaymentMeta}>
                  <IconCreditCard />
                  {nextPayment.method}
                </p>
              </CardContent>
              <CardFooter divider>
                <Button variant="primary" className={styles.payButton}>
                  Pay now
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle level={2}>Last 3 payments</CardTitle>
              </CardHeader>
              <CardContent variant="inset">
                <DataTable
                  aria-label="Payment history"
                  columns={paymentColumns}
                  rows={paymentHistory}
                  getRowId={(row) => row.id}
                />
              </CardContent>
            </Card>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}
