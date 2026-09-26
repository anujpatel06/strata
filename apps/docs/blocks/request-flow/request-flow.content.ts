/**
 * Content for the request-flow block: a three-step request (details → evidence → review) with a success state.
 * Replace this object to translate or retarget the flow — a dispute, a claim, a return — without touching the
 * component. Amounts and dates are raw values, formatted with Intl in `locale` and `currency`.
 */

/** Plural forms keyed by Intl.PluralRules category; `{count}` is replaced with the formatted number. */
export type RequestFlowPlural = { other: string } & Partial<Record<'zero' | 'one' | 'two' | 'few' | 'many', string>>;

export interface RequestFlowOption {
  id: string;
  label: string;
  description: string;
}

export interface RequestFlowContent {
  /** BCP 47 locale for numbers and dates. */
  locale: string;
  /** ISO 4217 currency code. */
  currency: string;
  product: { name: string };
  requestFlow: {
    /** Top-bar action that leaves the flow. */
    exit: string;
    title: string;
    subtitle: string;
    /** Accessible name of the step list. */
    progressLabel: string;
    /** Words in the narrow step summary "Step 2 of 3", and after a completed step for screen readers. */
    stepWord: string;
    ofWord: string;
    completedWord: string;
    steps: { details: string; evidence: string; review: string };
    /** What the request is about, shown beside the flow. `amount` is signed, in `currency`; `date` is ISO. */
    subject: { label: string; title: string; meta: string; dateLabel: string; date: string; amountLabel: string; amount: number };
    help: { title: string; items: string[] };
    /** Title of the error summary shown when a step has problems. */
    errorSummary: string;
    back: string;
    next: string;
    details: {
      title: string;
      description: string;
      reason: { label: string; options: RequestFlowOption[]; error: string };
      /**
       * `amount` shows the currency symbol, parses the number in `locale` and, when `errors.tooHigh` is set,
       * caps it at the subject amount. `text` is free text.
       */
      field: {
        kind: 'amount' | 'text';
        label: string;
        description?: string;
        placeholder?: string;
        errors: { required: string; invalid?: string; tooHigh?: string };
      };
      date: { label: string; description?: string; errors: { required: string; future: string } };
    };
    evidence: {
      title: string;
      description: string;
      upload: { label: string; description?: string; dropLabel: string; browseLabel: string; hint: string; error: string };
    };
    review: {
      title: string;
      description: string;
      /** Visible text of each "change this answer" button; its accessible name adds the row label. */
      edit: string;
      labels: { reason: string; field: string; date: string; files: string };
      files: RequestFlowPlural;
      confirm: { label: string; error: string };
      submit: string;
      dialog: { title: string; body: string; action: string; cancel: string };
    };
    success: {
      title: string;
      /** `{reference}` is replaced with `reference`. */
      description: string;
      reference: string;
      track: string;
      done: string;
    };
  };
}

export const requestFlowContent: RequestFlowContent = {
  locale: 'en-US',
  currency: 'USD',
  product: { name: 'Acme' },
  requestFlow: {
    exit: 'Save and exit',
    title: 'Dispute a transaction',
    subtitle: 'Tell us what went wrong with this payment. Most disputes are resolved within 10 business days.',
    progressLabel: 'Dispute progress',
    stepWord: 'Step',
    ofWord: 'of',
    completedWord: 'completed',
    steps: { details: 'Details', evidence: 'Evidence', review: 'Review' },
    subject: {
      label: 'Transaction',
      title: 'Brightcart Electronics',
      meta: 'Card •• 4821 · Online order BC-40317',
      dateLabel: 'Date',
      date: '2026-09-21',
      amountLabel: 'Amount',
      amount: -349.99,
    },
    help: {
      title: 'What happens next',
      items: [
        'We’ll credit $349.99 to your account within 2 business days while we look into it.',
        'We’ll contact Brightcart Electronics and may ask you for more details.',
        'You’ll get an update in the app and by email within 10 business days.',
      ],
    },
    errorSummary: 'Check the highlighted fields',
    back: 'Back',
    next: 'Continue',
    details: {
      title: 'What went wrong?',
      description: 'Choose the option that fits best. You can add documents in the next step.',
      reason: {
        label: 'Reason for dispute',
        options: [
          { id: 'unauthorized', label: 'I didn’t make this payment', description: 'Someone used my card or details without permission.' },
          { id: 'duplicate', label: 'I was charged more than once', description: 'The same payment appears two or more times.' },
          { id: 'not-received', label: 'I didn’t receive what I paid for', description: 'The goods or service never arrived.' },
          { id: 'wrong-amount', label: 'The amount is wrong', description: 'I was charged more than I agreed to pay.' },
        ],
        error: 'Choose a reason for the dispute',
      },
      field: {
        kind: 'amount',
        label: 'Amount you’re disputing',
        description: 'Up to the full payment of $349.99.',
        placeholder: '0.00',
        errors: {
          required: 'Enter the amount you’re disputing',
          invalid: 'Enter an amount in dollars, like 49.99',
          tooHigh: 'The amount can’t be more than the payment of $349.99',
        },
      },
      date: {
        label: 'When did you contact the merchant?',
        description: 'Use the date you last got in touch. Card networks ask for it before a dispute can be raised.',
        errors: { required: 'Enter the date you contacted the merchant', future: 'The date can’t be in the future' },
      },
    },
    evidence: {
      title: 'Add your evidence',
      description: 'Receipts, order confirmations and messages with the merchant help us settle your dispute faster.',
      upload: {
        label: 'Supporting documents',
        description: 'Add at least one file. Screenshots are fine.',
        dropLabel: 'Drag files here or',
        browseLabel: 'browse',
        hint: 'PDF, JPG or PNG, up to 10 MB each',
        error: 'Add at least one document',
      },
    },
    review: {
      title: 'Check your answers',
      description: 'Make sure everything is right. You can’t change the dispute once it’s sent.',
      edit: 'Change',
      labels: { reason: 'Reason', field: 'Amount disputed', date: 'Merchant contacted', files: 'Documents' },
      files: { one: '{count} file', other: '{count} files' },
      confirm: {
        label: 'I confirm the information I’ve given is true and complete',
        error: 'Confirm the information is correct to continue',
      },
      submit: 'Submit dispute',
      dialog: {
        title: 'Submit this dispute?',
        body: 'We’ll block further payments to Brightcart Electronics from card •• 4821 and credit the disputed amount while we investigate.',
        action: 'Submit dispute',
        cancel: 'Go back',
      },
    },
    success: {
      title: 'Dispute submitted',
      description: 'We’ve received your dispute. Your reference is {reference}. We’ll send you an update within 10 business days.',
      reference: 'AD-2026-58210',
      track: 'Track your request',
      done: 'Back to overview',
    },
  },
};
