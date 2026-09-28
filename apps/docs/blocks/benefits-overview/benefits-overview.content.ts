/**
 * Content for the benefits-overview block. Replace this object to translate or rebrand it; the component never
 * hard-codes copy, numbers or dates.
 *
 * Nothing that can be derived is typed in: the wallet's "used" is the sum of the rows' amounts, "Covered for 5" and
 * "1 discounted" count the members, the relation letters (E S C P) come from who's covered, a count benefit with
 * nothing left is "Fully used", and the rail's counts are the list lengths.
 *
 * Placeholders: `{count}`, `{amount}`, `{total}`, `{used}`, `{percent}`, `{date}`.
 *
 * `benefitsOverviewTenantCopy` is sample copy for the docs' reference tenants, so every tenant shows the block in its
 * own voice and language. The docs fill `benefitsOverview` from it when a tenant's content.json doesn't carry the
 * key. It's data, like content.json; the component never reads tenant ids.
 */

/** Icons the block can draw, for categories and benefits. */
export type BenefitsOverviewIcon =
  | 'all'
  | 'sponsored'
  | 'discounted'
  | 'consult'
  | 'clinic'
  | 'lab'
  | 'checkup'
  | 'nutrition'
  | 'video'
  | 'pharmacy'
  | 'maternity'
  | 'elder'
  | 'vision'
  | 'wellness'
  | 'store';

/** Icon tile fill. Each is a contrast-checked pair (see IconTile). */
export type BenefitsOverviewTint = 'brand' | 'info' | 'accent' | 'success' | 'warning';

export type BenefitsOverviewRelation = 'employee' | 'spouse' | 'child' | 'parent';

export interface BenefitsOverviewMember {
  id: string;
  name: string;
  relation: BenefitsOverviewRelation;
}

export interface BenefitsOverviewCategory {
  /** `all` is the "no filter" entry and matches every benefit. */
  id: string;
  label: string;
  icon: BenefitsOverviewIcon;
}

/** What the row's trailing value shows. */
export type BenefitsOverviewUsage =
  /** Money drawn from the shared wallet, in `currency`. Adds up to the wallet's "used". */
  | { kind: 'amount'; used: number }
  /** Sessions or checks: "0 used of 1". Used ≥ of means fully used. */
  | { kind: 'count'; used: number; of: number }
  | { kind: 'unlimited' }
  /** A member rate rather than cover: "30% off". A fraction, 0.3 = 30%. */
  | { kind: 'discount'; percent: number };

export interface BenefitsOverviewBenefit {
  id: string;
  icon: BenefitsOverviewIcon;
  tint: BenefitsOverviewTint;
  title: string;
  /** Shown under the title when the row is open. */
  description: string;
  /** Category ids (not `all`). */
  categories: string[];
  /** Member ids. */
  covered: string[];
  /** Members who get a member rate instead of full cover. A fraction, 0.2 = 20% off. */
  discounts?: { member: string; percent: number }[];
  /**
   * `locked`: needs something first (a declaration, a referral). `enrol`: needs the employee to opt someone in.
   * Both replace the "Covered for" line with `reason`.
   */
  state?: 'locked' | 'enrol';
  reason?: string;
  usage: BenefitsOverviewUsage;
  /** How it's paid. Omit a way to leave it out. */
  pay?: { cashless?: string; reimburse?: string; where?: string };
  /** A rule worth knowing before you use it (shown as a warning callout). */
  note?: string;
  /** ISO date. */
  validUntil?: string;
  /** Primary action label. Defaults to `labels.use`. */
  action?: string;
}

export interface BenefitsOverviewContent {
  /** BCP 47 locale for numbers and dates. */
  locale: string;
  /** ISO 4217 currency code. */
  currency: string;
  benefitsOverview: {
    /** The row that starts open. */
    openBenefit?: string;
    members: BenefitsOverviewMember[];
    categories: BenefitsOverviewCategory[];
    /** The shared wallet total, in `currency`. */
    walletTotal: number;
    benefits: BenefitsOverviewBenefit[];
    labels: {
      /** Page title for assistive tech (the screen has no visible H1, like the product). */
      title: string;
      /** Accessible name of the benefit list's heading. */
      benefits: string;
      members: string;
      everyone: string;
      categories: string;
      search: { label: string; placeholder: string };
      /**
       * The count beside the search. `all`: `{count}` benefits, nothing filtered. `filtered`: `{shown}` of `{total}`.
       * Both are always plural in the sample data (there are always several benefits), so there's no one/other split.
       */
      results: { all: string; filtered: string };
      wallet: {
        title: string;
        /** `{total}` = the wallet total. */
        usedOf: string;
        /** Label over the figure of what's left ("Left to spend"); the figure itself is formatted money. */
        left: string;
        /** One line under the wallet heading: what the wallet is (and isn't). */
        note: string;
        meter: string;
      };
      /** `{count}` = members covered. */
      coveredFor: string;
      /** `{count}` = members on a member rate. */
      discounted: string;
      /** For discount rows. `{count}` = members. */
      discountedFor: string;
      /** Under an amount: "₹13,000 / used". */
      used: string;
      /** `{used}`. */
      countUsed: string;
      /** `{total}`. */
      countOf: string;
      /** `{used}`, `{total}`. The meter inside an open count row. */
      countValue: string;
      countMeter: string;
      unlimited: string;
      /** `{percent}`. */
      discount: string;
      memberRate: string;
      fullyUsed: string;
      locked: string;
      enrol: string;
      toStart: string;
      usedInService: string;
      whoCovered: string;
      relations: Record<BenefitsOverviewRelation, string>;
      /** What the letters mean, shown in the info tooltip and read by screen readers. */
      relationsHelp: string;
      relationsInfo: string;
      /** `{percent}`: the chip on a member with a member rate. */
      memberDiscount: string;
      howYouPay: string;
      cashless: string;
      reimburse: string;
      /** `{date}`. */
      validUntil: string;
      details: string;
      use: string;
      /** Accessible names for the repeated buttons: `{action}, {benefit}`. */
      actionLabel: string;
      empty: { title: string; body: string; clear: string };
    };
  };
}

type Labels = BenefitsOverviewContent['benefitsOverview']['labels'];

const EN_LABELS: Omit<Labels, 'wallet' | 'title' | 'search'> = {
  benefits: 'Benefits',
  results: { all: '{count} benefits', filtered: '{shown} of {total} benefits' },
  members: 'Members',
  everyone: 'Everyone',
  categories: 'Categories',
  coveredFor: 'Covered for {count}',
  discounted: '{count} discounted',
  discountedFor: 'Discounted · {count}',
  used: 'used',
  countUsed: '{used} used',
  countOf: 'of {total}',
  countValue: '{used} of {total}',
  countMeter: 'Used',
  unlimited: 'Unlimited',
  discount: '{percent} off',
  memberRate: 'member rate',
  fullyUsed: 'Fully used',
  locked: 'Locked',
  enrol: 'Enrol',
  toStart: 'to start',
  usedInService: 'Used in this service',
  whoCovered: 'Who’s covered',
  relations: { employee: 'E', spouse: 'S', child: 'C', parent: 'P' },
  relationsHelp: 'E: you · S: spouse · C: children · P: parents',
  relationsInfo: 'What the letters mean',
  memberDiscount: '{percent} off',
  howYouPay: 'How you pay',
  cashless: 'Cashless',
  reimburse: 'Reimburse',
  validUntil: 'Valid until {date}',
  details: 'Details',
  use: 'Use benefit',
  actionLabel: '{action}, {benefit}',
  empty: {
    title: 'No benefits match',
    body: 'Try another member or category, or clear the search.',
    clear: 'Clear filters',
  },
};

const EN_CATEGORIES: BenefitsOverviewCategory[] = [
  { id: 'all', label: 'All', icon: 'all' },
  { id: 'sponsored', label: 'Sponsored', icon: 'sponsored' },
  { id: 'discounted', label: 'Discounted', icon: 'discounted' },
  { id: 'consults', label: 'Consults', icon: 'consult' },
  { id: 'diagnostics', label: 'Diagnostics', icon: 'lab' },
  { id: 'pharmacy', label: 'Pharmacy', icon: 'pharmacy' },
  { id: 'wellness', label: 'Wellness', icon: 'wellness' },
];

/** The generic sample (en-US), also what the site's own brand shows. */
export const benefitsOverviewContent: BenefitsOverviewContent = {
  locale: 'en-US',
  currency: 'USD',
  benefitsOverview: {
    openBenefit: 'visits',
    members: [
      { id: 'sam', name: 'Sam', relation: 'employee' },
      { id: 'jordan', name: 'Jordan', relation: 'spouse' },
      { id: 'maya', name: 'Maya', relation: 'child' },
      { id: 'ruth', name: 'Ruth', relation: 'parent' },
    ],
    categories: EN_CATEGORIES,
    walletTotal: 1500,
    benefits: [
      {
        id: 'visits',
        icon: 'consult',
        tint: 'brand',
        title: 'Doctor visits',
        description: 'Primary care and specialists, in person.',
        categories: ['sponsored', 'consults'],
        covered: ['sam', 'jordan', 'maya', 'ruth'],
        discounts: [{ member: 'ruth', percent: 0.2 }],
        usage: { kind: 'amount', used: 320 },
        pay: { cashless: 'Paid by your plan', reimburse: '10% copay', where: 'In network' },
        note: 'Specialists need a referral from your primary care doctor first.',
        validUntil: '2026-12-31',
      },
      {
        id: 'labs',
        icon: 'lab',
        tint: 'info',
        title: 'Lab tests',
        description: 'Blood work and screenings your doctor orders.',
        categories: ['sponsored', 'diagnostics'],
        covered: ['sam', 'jordan', 'maya', 'ruth'],
        usage: { kind: 'amount', used: 180 },
        pay: { cashless: 'Paid by your plan', where: 'At a lab or at home' },
        validUntil: '2026-12-31',
      },
      {
        id: 'checkup',
        icon: 'checkup',
        tint: 'info',
        title: 'Annual checkup',
        description: 'One full preventive checkup a year.',
        categories: ['sponsored', 'diagnostics'],
        covered: ['sam', 'jordan'],
        usage: { kind: 'count', used: 0, of: 1 },
        pay: { cashless: 'Paid by your plan', where: 'In network' },
        validUntil: '2026-12-31',
      },
      {
        id: 'nutrition',
        icon: 'nutrition',
        tint: 'brand',
        title: 'Nutrition coaching',
        description: 'One-to-one sessions with a dietitian.',
        categories: ['sponsored', 'wellness'],
        covered: ['sam', 'jordan'],
        usage: { kind: 'count', used: 4, of: 4 },
        note: 'You’ve used every covered session. More are available at the member rate.',
        validUntil: '2026-12-31',
        action: 'Book at member rate',
      },
      {
        id: 'video',
        icon: 'video',
        tint: 'brand',
        title: 'Doctor on video',
        description: 'Talk to a doctor any time, day or night.',
        categories: ['sponsored', 'consults'],
        covered: ['sam', 'jordan', 'maya', 'ruth'],
        usage: { kind: 'unlimited' },
        pay: { cashless: 'Paid by your plan', where: 'Video call' },
        validUntil: '2026-12-31',
        action: 'Start a call',
      },
      {
        id: 'rx',
        icon: 'pharmacy',
        tint: 'brand',
        title: 'Prescriptions',
        description: 'Prescribed medicines, delivered.',
        categories: ['sponsored', 'pharmacy'],
        covered: ['sam', 'jordan', 'maya', 'ruth'],
        usage: { kind: 'amount', used: 95 },
        pay: { cashless: 'Paid by your plan', reimburse: '10% copay', where: 'Delivered' },
        validUntil: '2026-12-31',
      },
      {
        id: 'maternity',
        icon: 'maternity',
        tint: 'warning',
        title: 'Maternity care',
        description: 'Care before and after a birth.',
        categories: ['sponsored', 'consults'],
        covered: ['jordan'],
        state: 'locked',
        reason: 'Tell us about a pregnancy to unlock',
        usage: { kind: 'amount', used: 0 },
        note: 'Unlocks once a pregnancy is declared. Nothing else changes on your plan.',
        action: 'Unlock',
      },
      {
        id: 'elder',
        icon: 'elder',
        tint: 'brand',
        title: 'Elder care',
        description: 'Dedicated support for your parents.',
        categories: ['wellness'],
        covered: ['ruth'],
        state: 'enrol',
        reason: 'Enrol a parent to start their elder care',
        usage: { kind: 'amount', used: 0 },
        action: 'Enrol a parent',
      },
      {
        id: 'vision',
        icon: 'vision',
        tint: 'info',
        title: 'Vision',
        description: 'Eye exams, frames and lenses at a member rate.',
        categories: ['discounted'],
        covered: ['sam', 'jordan', 'maya', 'ruth'],
        usage: { kind: 'discount', percent: 0.3 },
        pay: { where: 'Partner opticians' },
        validUntil: '2026-12-31',
      },
    ],
    labels: {
      ...EN_LABELS,
      title: 'Your benefits',
      search: { label: 'Search benefits', placeholder: 'Search benefits, services, medicines…' },
      wallet: {
        title: 'Your shared care wallet',
        usedOf: 'used of {total}',
        left: 'Left to spend',
        note: 'One wallet, shared across all services',
        meter: 'Wallet used',
      },
    },
  },
};

type TenantCopy = Pick<BenefitsOverviewContent, 'benefitsOverview'>;

/** Sample copy per docs tenant (see the note at the top). Keys are tenant folder names. */
export const benefitsOverviewTenantCopy: Record<string, TenantCopy> = {
  /** Care is the KYB web screen: a family OPD wallet from an employer plan. */
  care: {
    benefitsOverview: {
      openBenefit: 'consult',
      members: [
        { id: 'arjun', name: 'Arjun', relation: 'employee' },
        { id: 'priya', name: 'Priya', relation: 'spouse' },
        { id: 'aarav', name: 'Aarav', relation: 'child' },
        { id: 'ramesh', name: 'Ramesh', relation: 'parent' },
        { id: 'sunita', name: 'Sunita', relation: 'parent' },
      ],
      categories: EN_CATEGORIES,
      walletTotal: 18000,
      benefits: [
        {
          id: 'consult',
          icon: 'consult',
          tint: 'brand',
          title: 'In-clinic consultations',
          description: 'In-person visits to a GP or specialist.',
          categories: ['sponsored', 'consults'],
          covered: ['arjun', 'priya', 'aarav', 'ramesh'],
          discounts: [{ member: 'ramesh', percent: 0.2 }],
          usage: { kind: 'amount', used: 3200 },
          pay: { cashless: 'Sponsored by plan', reimburse: '10% co-pay', where: 'In-clinic' },
          note: 'Specialist consults need a GP referral first. Walk-ins are GP-only.',
          validUntil: '2026-03-31',
        },
        {
          id: 'diagnostics',
          icon: 'lab',
          tint: 'info',
          title: 'Prescribed diagnostics',
          description: 'Doctor-prescribed lab tests and scans, at a lab or at home.',
          categories: ['sponsored', 'diagnostics'],
          covered: ['arjun', 'priya', 'aarav', 'ramesh', 'sunita'],
          usage: { kind: 'amount', used: 2600 },
          pay: { cashless: 'Sponsored by plan', reimburse: '10% co-pay', where: 'Home collection or in-clinic' },
          validUntil: '2026-03-31',
        },
        {
          id: 'health-check',
          icon: 'checkup',
          tint: 'info',
          title: 'Preventive health check',
          description: 'A yearly full-body preventive check.',
          categories: ['sponsored', 'discounted', 'diagnostics'],
          covered: ['arjun', 'priya'],
          discounts: [{ member: 'priya', percent: 0.15 }],
          usage: { kind: 'count', used: 0, of: 1 },
          pay: { cashless: 'Sponsored by plan', where: 'In-clinic or home collection' },
          validUntil: '2026-03-31',
        },
        {
          id: 'nutrition',
          icon: 'nutrition',
          tint: 'brand',
          title: 'Nutritionist consults',
          description: 'One-to-one nutritionist sessions, with a diet plan each time.',
          categories: ['sponsored', 'wellness'],
          covered: ['arjun', 'priya', 'aarav', 'ramesh', 'sunita'],
          usage: { kind: 'count', used: 5, of: 5 },
          note: 'You’ve used your sponsored sessions. You can still book at a 15% member discount.',
          validUntil: '2026-03-31',
          action: 'Book at member rate',
        },
        {
          id: 'gp-on-call',
          icon: 'video',
          tint: 'brand',
          title: 'General physician on call',
          description: 'Talk to a GP on video, any time.',
          categories: ['sponsored', 'consults'],
          covered: ['arjun', 'priya', 'aarav', 'ramesh', 'sunita'],
          usage: { kind: 'unlimited' },
          pay: { cashless: 'Sponsored by plan', where: 'Video call' },
          validUntil: '2026-03-31',
          action: 'Start a call',
        },
        {
          id: 'pharmacy',
          icon: 'pharmacy',
          tint: 'brand',
          title: 'Prescribed pharmacy',
          description: 'Prescription and OTC medicines delivered to your home.',
          categories: ['sponsored', 'pharmacy'],
          covered: ['arjun', 'priya', 'aarav', 'ramesh', 'sunita'],
          usage: { kind: 'amount', used: 1100 },
          pay: { cashless: 'Sponsored by plan', reimburse: '10% co-pay', where: 'Home delivery' },
          validUntil: '2026-03-31',
        },
        {
          id: 'maternity',
          icon: 'maternity',
          tint: 'warning',
          title: 'Pre & post-natal care',
          description: 'Pregnancy and newborn care, before and after delivery.',
          categories: ['sponsored', 'consults'],
          covered: ['priya'],
          state: 'locked',
          reason: 'Declare pregnancy for your spouse to unlock',
          usage: { kind: 'amount', used: 0 },
          note: 'Unlocks as soon as you declare the pregnancy. Nothing else on your plan changes.',
          action: 'Unlock',
        },
        {
          id: 'elder-care',
          icon: 'elder',
          tint: 'brand',
          title: 'Elder care program',
          description: 'Dedicated health support for your parents.',
          categories: ['wellness'],
          covered: ['ramesh', 'sunita'],
          state: 'enrol',
          reason: 'Enrol your parents to activate their elder care',
          usage: { kind: 'amount', used: 0 },
          action: 'Enrol parents',
        },
        {
          id: 'vision',
          icon: 'vision',
          tint: 'info',
          title: 'Vision OPD',
          description: 'Eye check-ups, frames and lenses at a member rate.',
          categories: ['discounted'],
          covered: ['arjun', 'priya', 'aarav', 'ramesh', 'sunita'],
          usage: { kind: 'discount', percent: 0.3 },
          pay: { where: 'Partner opticians' },
          validUntil: '2026-03-31',
        },
        {
          id: 'marketplace',
          icon: 'store',
          tint: 'brand',
          title: 'Wellness marketplace',
          description: 'Curated wellness services, from one flexible wallet.',
          categories: ['wellness'],
          covered: ['arjun', 'priya', 'aarav', 'ramesh', 'sunita'],
          usage: { kind: 'amount', used: 500 },
          pay: { cashless: 'Sponsored by plan', where: 'Online and in-centre' },
          validUntil: '2026-03-31',
          action: 'Explore services',
        },
      ],
      labels: {
        ...EN_LABELS,
        title: 'Your benefits',
        search: { label: 'Search benefits', placeholder: 'Search benefits, services, medicines…' },
        wallet: {
          title: 'Your shared OPD wallet',
          usedOf: 'used of {total}',
          left: 'Left to spend',
          note: 'One wallet, shared across all services',
          meter: 'OPD wallet used',
        },
      },
    },
  },

  /** Vela is a neobank: the health wallet comes with its paid plan. */
  vela: {
    benefitsOverview: {
      openBenefit: 'doctor',
      members: [
        { id: 'priya', name: 'Priya', relation: 'employee' },
        { id: 'karthik', name: 'Karthik', relation: 'spouse' },
        { id: 'anika', name: 'Anika', relation: 'child' },
        { id: 'lakshmi', name: 'Lakshmi', relation: 'parent' },
      ],
      categories: EN_CATEGORIES,
      walletTotal: 12000,
      benefits: [
        {
          id: 'doctor',
          icon: 'consult',
          tint: 'brand',
          title: 'Doctor visits',
          description: 'In clinic or on video, at partner clinics.',
          categories: ['sponsored', 'consults'],
          covered: ['priya', 'karthik', 'anika', 'lakshmi'],
          discounts: [{ member: 'lakshmi', percent: 0.2 }],
          usage: { kind: 'amount', used: 2400 },
          pay: { cashless: 'Tap your Vela card', reimburse: '10% co-pay', where: 'Partner clinics' },
          note: 'Pay with your Vela card and the wallet is charged first. Anything over comes from your account.',
          validUntil: '2026-12-31',
          action: 'Book a visit',
        },
        {
          id: 'lab',
          icon: 'lab',
          tint: 'info',
          title: 'Lab tests',
          description: 'Home sample collection, reports in the app.',
          categories: ['sponsored', 'diagnostics'],
          covered: ['priya', 'karthik', 'anika', 'lakshmi'],
          usage: { kind: 'amount', used: 1350 },
          pay: { cashless: 'Tap your Vela card', where: 'At home' },
          validUntil: '2026-12-31',
          action: 'Book a test',
        },
        {
          id: 'checkup',
          icon: 'checkup',
          tint: 'info',
          title: 'Yearly health check',
          description: 'A full-body check once a year.',
          categories: ['sponsored', 'diagnostics'],
          covered: ['priya', 'karthik'],
          usage: { kind: 'count', used: 1, of: 2 },
          pay: { cashless: 'Included in Vela Plus', where: 'Partner labs' },
          validUntil: '2026-12-31',
        },
        {
          id: 'video',
          icon: 'video',
          tint: 'brand',
          title: 'Doctor on video',
          description: 'A doctor in under 15 minutes, day or night.',
          categories: ['sponsored', 'consults'],
          covered: ['priya', 'karthik', 'anika', 'lakshmi'],
          usage: { kind: 'unlimited' },
          pay: { cashless: 'Included in Vela Plus', where: 'In the app' },
          validUntil: '2026-12-31',
          action: 'Start a call',
        },
        {
          id: 'meds',
          icon: 'pharmacy',
          tint: 'brand',
          title: 'Medicines',
          description: 'Prescribed medicines, delivered the same day.',
          categories: ['sponsored', 'pharmacy'],
          covered: ['priya', 'karthik', 'anika', 'lakshmi'],
          usage: { kind: 'count', used: 6, of: 6 },
          note: 'You’ve used this year’s free deliveries. Orders still come off the wallet.',
          validUntil: '2026-12-31',
          action: 'Order medicines',
        },
        {
          id: 'elder',
          icon: 'elder',
          tint: 'brand',
          title: 'Parent care',
          description: 'A care manager and home visits for your parents.',
          categories: ['wellness'],
          covered: ['lakshmi'],
          state: 'enrol',
          reason: 'Add your mother to start her parent care',
          usage: { kind: 'amount', used: 0 },
          action: 'Add a parent',
        },
        {
          id: 'maternity',
          icon: 'maternity',
          tint: 'warning',
          title: 'Maternity cover',
          description: 'Scans, consults and delivery support.',
          categories: ['sponsored', 'consults'],
          covered: ['karthik'],
          state: 'locked',
          reason: 'Unlocks 9 months after you join Vela Plus',
          usage: { kind: 'amount', used: 0 },
          note: 'Maternity cover has a 9-month waiting period from the date you joined.',
          action: 'See waiting period',
        },
        {
          id: 'gym',
          icon: 'wellness',
          tint: 'success',
          title: 'Gyms and yoga',
          description: 'Member rates at partner gyms and studios.',
          categories: ['discounted', 'wellness'],
          covered: ['priya', 'karthik'],
          usage: { kind: 'discount', percent: 0.25 },
          pay: { where: 'Partner studios' },
          validUntil: '2026-12-31',
        },
      ],
      labels: {
        ...EN_LABELS,
        title: 'Health benefits',
        search: { label: 'Search health benefits', placeholder: 'Search benefits, clinics, medicines…' },
        relationsHelp: 'E: you · S: spouse · C: children · P: parents',
        wallet: {
          title: 'Your family health wallet',
          usedOf: 'used of {total}',
          left: 'Left to spend',
          note: 'Separate from your balance',
          meter: 'Health wallet used',
        },
      },
    },
  },

  /** Harbor is an insurer: an everyday allowance on top of the policy. */
  harbor: {
    benefitsOverview: {
      openBenefit: 'gp',
      members: [
        { id: 'daniel', name: 'Daniel', relation: 'employee' },
        { id: 'grace', name: 'Grace', relation: 'spouse' },
        { id: 'tobi', name: 'Tobi', relation: 'child' },
        { id: 'ada', name: 'Ada', relation: 'parent' },
      ],
      categories: [
        { id: 'all', label: 'All', icon: 'all' },
        { id: 'sponsored', label: 'Covered', icon: 'sponsored' },
        { id: 'discounted', label: 'Member rates', icon: 'discounted' },
        { id: 'consults', label: 'Appointments', icon: 'consult' },
        { id: 'diagnostics', label: 'Tests', icon: 'lab' },
        { id: 'pharmacy', label: 'Prescriptions', icon: 'pharmacy' },
        { id: 'wellness', label: 'Wellbeing', icon: 'wellness' },
      ],
      walletTotal: 1500,
      benefits: [
        {
          id: 'gp',
          icon: 'consult',
          tint: 'brand',
          title: 'Private GP',
          description: 'Same-day appointments, by video or in person.',
          categories: ['sponsored', 'consults'],
          covered: ['daniel', 'grace', 'tobi', 'ada'],
          discounts: [{ member: 'ada', percent: 0.2 }],
          usage: { kind: 'amount', used: 240 },
          pay: { cashless: 'We pay the clinic', reimburse: '£25 excess', where: 'Clinics nationwide' },
          note: 'Specialist appointments need a GP referral first.',
          validUntil: '2026-10-14',
          action: 'Book a GP',
        },
        {
          id: 'physio',
          icon: 'clinic',
          tint: 'info',
          title: 'Physiotherapy',
          description: 'Refer yourself, no GP needed.',
          categories: ['sponsored', 'consults'],
          covered: ['daniel', 'grace'],
          usage: { kind: 'count', used: 2, of: 6 },
          pay: { cashless: 'We pay the clinic', where: 'Clinics nationwide' },
          validUntil: '2026-10-14',
        },
        {
          id: 'screening',
          icon: 'checkup',
          tint: 'info',
          title: 'Health screening',
          description: 'A yearly check with a nurse, results in the app.',
          categories: ['sponsored', 'diagnostics'],
          covered: ['daniel', 'grace'],
          usage: { kind: 'count', used: 2, of: 2 },
          note: 'Both screenings this year are done. They renew with your policy.',
          validUntil: '2026-10-14',
          action: 'See results',
        },
        {
          id: 'video',
          icon: 'video',
          tint: 'brand',
          title: 'GP by video, 24/7',
          description: 'Speak to a GP whenever you need one.',
          categories: ['sponsored', 'consults'],
          covered: ['daniel', 'grace', 'tobi', 'ada'],
          usage: { kind: 'unlimited' },
          pay: { cashless: 'Included in your policy', where: 'In the app' },
          validUntil: '2026-10-14',
          action: 'Start a call',
        },
        {
          id: 'rx',
          icon: 'pharmacy',
          tint: 'brand',
          title: 'Prescriptions',
          description: 'Private prescriptions, delivered next day.',
          categories: ['sponsored', 'pharmacy'],
          covered: ['daniel', 'grace', 'tobi', 'ada'],
          usage: { kind: 'amount', used: 85 },
          pay: { cashless: 'We pay the pharmacy', where: 'Delivered' },
          validUntil: '2026-10-14',
        },
        {
          id: 'mental',
          icon: 'elder',
          tint: 'warning',
          title: 'Talking therapy',
          description: 'Up to eight sessions with an accredited therapist.',
          categories: ['sponsored', 'wellness'],
          covered: ['daniel', 'grace'],
          state: 'locked',
          reason: 'Needs a short assessment call first',
          usage: { kind: 'amount', used: 0 },
          note: 'The assessment takes 20 minutes and there’s nothing to pay.',
          action: 'Book assessment',
        },
        {
          id: 'parent',
          icon: 'elder',
          tint: 'brand',
          title: 'Care for parents',
          description: 'A GP line and home visits for a parent.',
          categories: ['wellness'],
          covered: ['ada'],
          state: 'enrol',
          reason: 'Add a parent to your policy to start',
          usage: { kind: 'amount', used: 0 },
          action: 'Add a parent',
        },
        {
          id: 'optical',
          icon: 'vision',
          tint: 'info',
          title: 'Eye care',
          description: 'Eye tests, glasses and lenses at member rates.',
          categories: ['discounted'],
          covered: ['daniel', 'grace', 'tobi', 'ada'],
          usage: { kind: 'discount', percent: 0.25 },
          pay: { where: 'Partner opticians' },
          validUntil: '2026-10-14',
        },
      ],
      labels: {
        ...EN_LABELS,
        title: 'Your everyday cover',
        search: { label: 'Search your cover', placeholder: 'Search cover, treatments, clinics…' },
        relationsHelp: 'E: policyholder · S: partner · C: children · P: parents',
        howYouPay: 'How it’s paid',
        cashless: 'Direct',
        reimburse: 'Claim back',
        use: 'Use cover',
        wallet: {
          title: 'Your family allowance',
          usedOf: 'used of {total}',
          left: 'Left to spend',
          note: 'Shared by everyone on your policy',
          meter: 'Allowance used',
        },
      },
    },
  },

  /** Qamar is a grocery and rewards app (ar-AE, RTL): a wellness wallet for the family. */
  qamar: {
    benefitsOverview: {
      openBenefit: 'nutrition',
      members: [
        { id: 'sara', name: 'سارة', relation: 'employee' },
        { id: 'khalid', name: 'خالد', relation: 'spouse' },
        { id: 'layan', name: 'ليان', relation: 'child' },
        { id: 'maryam', name: 'مريم', relation: 'parent' },
      ],
      categories: [
        { id: 'all', label: 'الكل', icon: 'all' },
        { id: 'sponsored', label: 'مشمولة', icon: 'sponsored' },
        { id: 'discounted', label: 'مخفّضة', icon: 'discounted' },
        { id: 'consults', label: 'استشارات', icon: 'consult' },
        { id: 'diagnostics', label: 'فحوصات', icon: 'lab' },
        { id: 'pharmacy', label: 'الصيدلية', icon: 'pharmacy' },
        { id: 'wellness', label: 'العافية', icon: 'wellness' },
      ],
      walletTotal: 1500,
      benefits: [
        {
          id: 'nutrition',
          icon: 'nutrition',
          tint: 'brand',
          title: 'استشارات التغذية',
          description: 'جلسات فردية مع أخصائي تغذية وخطة أسبوعية.',
          categories: ['sponsored', 'consults', 'wellness'],
          covered: ['sara', 'khalid', 'layan', 'maryam'],
          discounts: [{ member: 'maryam', percent: 0.2 }],
          usage: { kind: 'amount', used: 320 },
          pay: { cashless: 'مدفوعة من المحفظة', reimburse: 'تحمّل 10٪', where: 'عبر الفيديو' },
          note: 'احجز قبل 24 ساعة على الأقل، فالإلغاء المتأخر يُحتسب جلسة.',
          validUntil: '2026-12-31',
          action: 'احجز جلسة',
        },
        {
          id: 'lab',
          icon: 'lab',
          tint: 'info',
          title: 'فحوصات منزلية',
          description: 'سحب العينة في منزلك والنتائج في التطبيق.',
          categories: ['sponsored', 'diagnostics'],
          covered: ['sara', 'khalid', 'layan', 'maryam'],
          usage: { kind: 'amount', used: 210 },
          pay: { cashless: 'مدفوعة من المحفظة', where: 'في المنزل' },
          validUntil: '2026-12-31',
          action: 'احجز فحصًا',
        },
        {
          id: 'checkup',
          icon: 'checkup',
          tint: 'info',
          title: 'فحص سنوي شامل',
          description: 'فحص وقائي شامل مرة في السنة.',
          categories: ['sponsored', 'diagnostics'],
          covered: ['sara', 'khalid'],
          usage: { kind: 'count', used: 0, of: 1 },
          pay: { cashless: 'مدفوعة من المحفظة', where: 'مختبرات شريكة' },
          validUntil: '2026-12-31',
        },
        {
          id: 'pharmacy',
          icon: 'pharmacy',
          tint: 'brand',
          title: 'توصيل الصيدلية',
          description: 'أدوية ومستلزمات خلال ساعة.',
          categories: ['sponsored', 'pharmacy'],
          covered: ['sara', 'khalid', 'layan', 'maryam'],
          usage: { kind: 'count', used: 4, of: 4 },
          note: 'استخدمت كل مرات التوصيل المجاني هذا العام. ما زالت الطلبات تُخصم من المحفظة.',
          validUntil: '2026-12-31',
          action: 'اطلب الآن',
        },
        {
          id: 'video',
          icon: 'video',
          tint: 'brand',
          title: 'طبيب عبر الفيديو',
          description: 'تحدّث مع طبيب في أي وقت.',
          categories: ['sponsored', 'consults'],
          covered: ['sara', 'khalid', 'layan', 'maryam'],
          usage: { kind: 'unlimited' },
          pay: { cashless: 'ضمن باقتك', where: 'في التطبيق' },
          validUntil: '2026-12-31',
          action: 'ابدأ مكالمة',
        },
        {
          id: 'maternity',
          icon: 'maternity',
          tint: 'warning',
          title: 'رعاية الأمومة',
          description: 'متابعة الحمل ورعاية المولود.',
          categories: ['sponsored', 'consults'],
          covered: ['sara'],
          state: 'locked',
          reason: 'صرّحي عن الحمل لتفعيلها',
          usage: { kind: 'amount', used: 0 },
          note: 'تتفعّل فور التصريح عن الحمل، ولا يتغيّر شيء آخر في باقتك.',
          action: 'فعّلها',
        },
        {
          id: 'elder',
          icon: 'elder',
          tint: 'brand',
          title: 'رعاية الوالدين',
          description: 'دعم صحي مخصص لوالديك.',
          categories: ['wellness'],
          covered: ['maryam'],
          state: 'enrol',
          reason: 'سجّل والدتك لتبدأ رعايتها',
          usage: { kind: 'amount', used: 0 },
          action: 'سجّل الوالدين',
        },
        {
          id: 'gym',
          icon: 'wellness',
          tint: 'success',
          title: 'النوادي الرياضية',
          description: 'أسعار الأعضاء في النوادي الشريكة.',
          categories: ['discounted', 'wellness'],
          covered: ['sara', 'khalid'],
          usage: { kind: 'discount', percent: 0.3 },
          pay: { where: 'نوادٍ شريكة' },
          validUntil: '2026-12-31',
        },
      ],
      labels: {
        title: 'مزايا العافية',
        benefits: 'المزايا',
        results: { all: 'المزايا: {count}', filtered: '{shown} من أصل {total}' },
        members: 'الأفراد',
        everyone: 'الجميع',
        categories: 'الفئات',
        search: { label: 'ابحث في المزايا', placeholder: 'ابحث عن ميزة أو خدمة أو دواء…' },
        wallet: {
          title: 'محفظة العافية المشتركة',
          usedOf: 'مستخدم من {total}',
          left: 'المتبقي للصرف',
          note: 'محفظة واحدة لكل الخدمات',
          meter: 'المستخدم من المحفظة',
        },
        coveredFor: 'تشمل {count}',
        discounted: '{count} بخصم',
        discountedFor: 'مخفّضة · {count}',
        used: 'مستخدم',
        countUsed: '{used} مستخدم',
        countOf: 'من {total}',
        countValue: '{used} من {total}',
        countMeter: 'المستخدم',
        unlimited: 'غير محدود',
        discount: 'خصم {percent}',
        memberRate: 'سعر الأعضاء',
        fullyUsed: 'مستخدمة بالكامل',
        locked: 'مقفلة',
        enrol: 'سجّل',
        toStart: 'للبدء',
        usedInService: 'المستخدم في هذه الخدمة',
        whoCovered: 'من تشمل',
        relations: { employee: 'م', spouse: 'ز', child: 'أ', parent: 'و' },
        relationsHelp: 'م: أنت · ز: الزوج · أ: الأبناء · و: الوالدان',
        relationsInfo: 'معنى الحروف',
        memberDiscount: 'خصم {percent}',
        howYouPay: 'طريقة الدفع',
        cashless: 'بدون دفع',
        reimburse: 'استرداد',
        validUntil: 'صالحة حتى {date}',
        details: 'التفاصيل',
        use: 'استخدم الميزة',
        actionLabel: '{action}، {benefit}',
        empty: {
          title: 'لا توجد مزايا مطابقة',
          body: 'جرّب فردًا أو فئة أخرى، أو امسح البحث.',
          clear: 'امسح عوامل التصفية',
        },
      },
    },
  },

  /**
   * Haat is a reseller-commerce app (hi-IN): a family health wallet that comes with the Haat Pro plan. Hindi copy is a
   * draft until a Hindi reader reviews it (tenants/haat/content.json `copyReview`).
   */
  haat: {
    benefitsOverview: {
      openBenefit: 'doctor',
      members: [
        { id: 'rekha', name: 'रेखा', relation: 'employee' },
        { id: 'sunil', name: 'सुनील', relation: 'spouse' },
        { id: 'pari', name: 'परी', relation: 'child' },
        { id: 'kamla', name: 'कमला', relation: 'parent' },
      ],
      categories: [
        { id: 'all', label: 'सभी', icon: 'all' },
        { id: 'sponsored', label: 'प्लान में शामिल', icon: 'sponsored' },
        { id: 'discounted', label: 'छूट वाले', icon: 'discounted' },
        { id: 'consults', label: 'डॉक्टर से सलाह', icon: 'consult' },
        { id: 'diagnostics', label: 'जाँच', icon: 'lab' },
        { id: 'pharmacy', label: 'दवाइयाँ', icon: 'pharmacy' },
        { id: 'wellness', label: 'सेहत', icon: 'wellness' },
      ],
      walletTotal: 10000,
      benefits: [
        {
          id: 'doctor',
          icon: 'consult',
          tint: 'brand',
          title: 'डॉक्टर से मिलना',
          description: 'पार्टनर क्लिनिक में या वीडियो पर।',
          categories: ['sponsored', 'consults'],
          covered: ['rekha', 'sunil', 'pari', 'kamla'],
          discounts: [{ member: 'kamla', percent: 0.2 }],
          usage: { kind: 'amount', used: 1800 },
          pay: { cashless: 'हाट वॉलेट से', reimburse: '10% को-पे', where: 'पार्टनर क्लिनिक' },
          note: 'पहले वॉलेट से पैसा कटता है। उससे ज़्यादा का बिल आपकी कमाई से कटेगा।',
          validUntil: '2026-12-31',
          action: 'अपॉइंटमेंट बुक करें',
        },
        {
          id: 'lab',
          icon: 'lab',
          tint: 'info',
          title: 'लैब टेस्ट',
          description: 'घर से सैंपल, रिपोर्ट ऐप में।',
          categories: ['sponsored', 'diagnostics'],
          covered: ['rekha', 'sunil', 'pari', 'kamla'],
          usage: { kind: 'amount', used: 1150 },
          pay: { cashless: 'हाट वॉलेट से', where: 'घर पर' },
          validUntil: '2026-12-31',
          action: 'टेस्ट बुक करें',
        },
        {
          id: 'checkup',
          icon: 'checkup',
          tint: 'info',
          title: 'सालाना हेल्थ चेकअप',
          description: 'साल में एक बार पूरे शरीर की जाँच।',
          categories: ['sponsored', 'diagnostics'],
          covered: ['rekha', 'sunil'],
          usage: { kind: 'count', used: 1, of: 2 },
          pay: { cashless: 'हाट प्रो में शामिल', where: 'पार्टनर लैब' },
          validUntil: '2026-12-31',
        },
        {
          id: 'video',
          icon: 'video',
          tint: 'brand',
          title: 'वीडियो पर डॉक्टर',
          description: 'दिन हो या रात, 15 मिनट के अंदर डॉक्टर।',
          categories: ['sponsored', 'consults'],
          covered: ['rekha', 'sunil', 'pari', 'kamla'],
          usage: { kind: 'unlimited' },
          pay: { cashless: 'हाट प्रो में शामिल', where: 'ऐप में' },
          validUntil: '2026-12-31',
          action: 'कॉल शुरू करें',
        },
        {
          id: 'meds',
          icon: 'pharmacy',
          tint: 'brand',
          title: 'दवाइयाँ',
          description: 'पर्चे वाली दवाइयाँ, उसी दिन घर पर।',
          categories: ['sponsored', 'pharmacy'],
          covered: ['rekha', 'sunil', 'pari', 'kamla'],
          usage: { kind: 'count', used: 6, of: 6 },
          note: 'इस साल की मुफ़्त डिलीवरी पूरी हो चुकी है। दवाइयों का पैसा अब भी वॉलेट से कटेगा।',
          validUntil: '2026-12-31',
          action: 'दवाइयाँ मँगाएँ',
        },
        {
          id: 'elder',
          icon: 'elder',
          tint: 'brand',
          title: 'माता-पिता की देखभाल',
          description: 'केयर मैनेजर और घर पर विज़िट।',
          categories: ['wellness'],
          covered: ['kamla'],
          state: 'enrol',
          reason: 'देखभाल शुरू करने के लिए माँ को जोड़ें',
          usage: { kind: 'amount', used: 0 },
          action: 'माता-पिता को जोड़ें',
        },
        {
          id: 'maternity',
          icon: 'maternity',
          tint: 'warning',
          title: 'मैटरनिटी कवर',
          description: 'स्कैन, डॉक्टर से सलाह और डिलीवरी में मदद।',
          categories: ['sponsored', 'consults'],
          covered: ['rekha'],
          state: 'locked',
          reason: 'हाट प्रो लेने के 9 महीने बाद शुरू होगा',
          usage: { kind: 'amount', used: 0 },
          note: 'मैटरनिटी कवर प्लान लेने की तारीख से 9 महीने बाद शुरू होता है।',
          action: 'इंतज़ार की अवधि देखें',
        },
        {
          id: 'yoga',
          icon: 'wellness',
          tint: 'success',
          title: 'जिम और योग',
          description: 'पार्टनर जिम और स्टूडियो में मेंबर रेट।',
          categories: ['discounted', 'wellness'],
          covered: ['rekha', 'sunil'],
          usage: { kind: 'discount', percent: 0.25 },
          pay: { where: 'पार्टनर स्टूडियो' },
          validUntil: '2026-12-31',
        },
      ],
      labels: {
        title: 'सेहत के फ़ायदे',
        benefits: 'फ़ायदे',
        results: { all: '{count} फ़ायदे', filtered: '{total} में से {shown} फ़ायदे' },
        members: 'सदस्य',
        everyone: 'सभी',
        categories: 'कैटेगरी',
        search: { label: 'सेहत के फ़ायदे खोजें', placeholder: 'फ़ायदे, क्लिनिक, दवाइयाँ खोजें…' },
        wallet: {
          title: 'परिवार का हेल्थ वॉलेट',
          usedOf: '{total} में से इस्तेमाल',
          left: 'खर्च के लिए बाकी',
          note: 'आपकी कमाई से अलग',
          meter: 'हेल्थ वॉलेट का इस्तेमाल',
        },
        coveredFor: '{count} लोगों के लिए',
        discounted: '{count} को छूट',
        discountedFor: 'छूट · {count}',
        used: 'इस्तेमाल',
        countUsed: '{used} इस्तेमाल',
        countOf: '{total} में से',
        countValue: '{total} में से {used}',
        countMeter: 'इस्तेमाल',
        unlimited: 'असीमित',
        discount: '{percent} छूट',
        memberRate: 'मेंबर रेट',
        fullyUsed: 'पूरा इस्तेमाल',
        locked: 'लॉक',
        enrol: 'जोड़ें',
        toStart: 'शुरू करने के लिए',
        usedInService: 'इस सेवा में इस्तेमाल',
        whoCovered: 'किसके लिए',
        relations: { employee: 'आ', spouse: 'जी', child: 'ब', parent: 'मा' },
        relationsHelp: 'आ: आप · जी: जीवनसाथी · ब: बच्चे · मा: माता-पिता',
        relationsInfo: 'अक्षरों का मतलब',
        memberDiscount: '{percent} छूट',
        howYouPay: 'पैसा कैसे देना है',
        cashless: 'कैशलेस',
        reimburse: 'बाद में वापसी',
        validUntil: '{date} तक मान्य',
        details: 'जानकारी',
        use: 'फ़ायदा लें',
        actionLabel: '{action}, {benefit}',
        empty: {
          title: 'कोई फ़ायदा नहीं मिला',
          body: 'कोई और सदस्य या कैटेगरी चुनें, या खोज हटाएँ।',
          clear: 'फ़िल्टर हटाएँ',
        },
      },
    },
  },
};
