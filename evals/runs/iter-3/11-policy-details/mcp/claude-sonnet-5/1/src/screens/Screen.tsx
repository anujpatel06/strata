import {
  Amount,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  IconTile,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from '@syntara/react';
import {
  IconCircleCheck,
  IconCircleX,
  IconDownload,
  IconFileText,
  IconShieldCheck,
} from '@syntara/icons';
import styles from './Screen.module.css';

const policy = {
  name: 'Family Health Shield',
  number: 'POL-8823491',
  status: 'Active' as const,
};

const cover = {
  included: [
    'In-patient hospitalisation',
    'Day-care procedures',
    'Pre- and post-hospitalisation care (60 days)',
    'Annual health check-up',
    'Ambulance charges',
  ],
  excluded: [
    'Cosmetic treatment',
    'Pregnancy and childbirth',
    'Self-inflicted injury',
    'Dental treatment, unless accidental',
  ],
};

const documents = [
  { name: 'Policy schedule', meta: 'PDF · 412 KB' },
  { name: 'Terms and conditions', meta: 'PDF · 1.1 MB' },
  { name: 'Certificate of insurance', meta: 'PDF · 208 KB' },
  { name: 'Claim form', meta: 'PDF · 96 KB' },
];

const payments = {
  next: { date: '15 Oct 2026', amount: 4200, currency: 'INR' },
  history: [
    { date: '15 Sep 2026', amount: 4200, currency: 'INR' },
    { date: '15 Aug 2026', amount: 4200, currency: 'INR' },
    { date: '15 Jul 2026', amount: 4200, currency: 'INR' },
  ],
};

export default function Screen() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <IconTile size="lg" tint="brand">
          <IconShieldCheck aria-hidden />
        </IconTile>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{policy.name}</h1>
          <p className={styles.subtitle}>Policy no. {policy.number}</p>
        </div>
        <Badge variant="status" tone="success">
          {policy.status}
        </Badge>
      </header>

      <Tabs defaultSelectedKey="cover">
        <TabList aria-label="Policy sections">
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
                  {cover.included.map((item) => (
                    <li key={item} className={styles.coverItem}>
                      <IconCircleCheck aria-hidden className={styles.iconIncluded} />
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
                  {cover.excluded.map((item) => (
                    <li key={item} className={styles.coverItem}>
                      <IconCircleX aria-hidden className={styles.iconExcluded} />
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
            </CardHeader>
            <CardContent variant="inset">
              <ul className={styles.docList}>
                {documents.map((doc) => (
                  <li key={doc.name} className={styles.docItem}>
                    <IconTile size="sm">
                      <IconFileText aria-hidden />
                    </IconTile>
                    <div className={styles.docText}>
                      <span className={styles.docName}>{doc.name}</span>
                      <span className={styles.docMeta}>{doc.meta}</span>
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
          <div className={styles.paymentsStack}>
            <Card variant="outline">
              <CardHeader>
                <CardTitle level={2}>Next payment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={styles.nextPayment}>
                  <div>
                    <Amount value={payments.next.amount} currency={payments.next.currency} size="lg" />
                    <p className={styles.nextPaymentDate}>Due {payments.next.date}</p>
                  </div>
                  <Badge variant="status" tone="warning">
                    Upcoming
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle level={2}>Last 3 payments</CardTitle>
              </CardHeader>
              <CardContent variant="inset">
                <ul className={styles.docList}>
                  {payments.history.map((payment) => (
                    <li key={payment.date} className={styles.paymentItem}>
                      <span className={styles.paymentDate}>{payment.date}</span>
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
