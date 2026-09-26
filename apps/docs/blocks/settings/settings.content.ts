/**
 * Content for the settings block: four tabs (profile, notifications, security, billing) and a danger zone.
 * Replace this object to translate or rebrand it. Prices are raw numbers in `currency`; session times are ISO
 * date-times, formatted with Intl in `locale`.
 */

export interface SettingsOption {
  id: string;
  label: string;
}

export interface SettingsSwitch {
  id: string;
  label: string;
  description: string;
  /** Initial state. */
  on: boolean;
  /** Always on (e.g. security alerts): shown, but can't be turned off. */
  locked?: boolean;
}

export interface SettingsSession {
  id: string;
  device: string;
  kind: 'desktop' | 'mobile' | 'tablet';
  location: string;
  /** ISO date-time with offset, e.g. "2026-09-26T09:12:00+05:30". */
  lastActive: string;
  /** The session you're using now; it can't be signed out from here. */
  current?: boolean;
}

export interface SettingsContent {
  /** BCP 47 locale for numbers and dates. */
  locale: string;
  /** ISO 4217 currency code for the plan price. */
  currency: string;
  product: { name: string };
  user: { name: string; initials?: string };
  settings: {
    title: string;
    description: string;
    /** Accessible name of the tab list. */
    tabsLabel: string;
    tabs: { profile: string; notifications: string; security: string; billing: string };
    save: string;
    /** Toast after saving. */
    saved: string;
    profile: {
      title: string;
      description: string;
      photo: { label: string; dropLabel: string; browseLabel: string; hint: string };
      name: { label: string; value: string; description?: string };
      email: { label: string; value: string; description?: string };
      phone: { label: string; value: string; description?: string };
      language: { label: string; value: string; options: SettingsOption[] };
      region: { label: string; value: string; options: SettingsOption[] };
    };
    display: {
      title: string;
      description: string;
      theme: { label: string; options: { system: string; light: string; dark: string } };
      density: { label: string; options: { comfortable: string; compact: string } };
    };
    danger: {
      title: string;
      description: string;
      action: string;
      dialog: { title: string; body: string; action: string; cancel: string };
      /** Toast after confirming. */
      done: string;
    };
    notifications: {
      title: string;
      description: string;
      groups: { title: string; items: SettingsSwitch[] }[];
      channels: { label: string; options: SettingsOption[]; selected: string[] };
    };
    security: {
      title: string;
      description: string;
      twoFactor: { label: string; description: string; on: boolean };
      password: { label: string; description: string; action: string };
      sessions: {
        title: string;
        description: string;
        columns: { device: string; location: string; lastActive: string; actions: string };
        /** Badge on the current session. */
        current: string;
        /** Accessible name of each row's menu button; `{device}` is replaced. */
        actionsLabel: string;
        signOut: string;
        /** Toast after signing a session out; `{device}` is replaced. */
        signedOut: string;
        rows: SettingsSession[];
      };
    };
    billing: {
      title: string;
      description: string;
      plan: { name: string; price: number; period: string; badge: string; features: string[]; change: string };
      method: { title: string; label: string; detail: string; update: string };
    };
  };
}

export const settingsContent: SettingsContent = {
  locale: 'en-US',
  currency: 'USD',
  product: { name: 'Acme' },
  user: { name: 'Jordan Lee' },
  settings: {
    title: 'Settings',
    description: 'Manage your profile, alerts and security.',
    tabsLabel: 'Settings sections',
    tabs: { profile: 'Profile', notifications: 'Notifications', security: 'Security', billing: 'Plan & billing' },
    save: 'Save changes',
    saved: 'Changes saved',
    profile: {
      title: 'Personal details',
      description: 'We use these details to contact you and to check it’s really you.',
      photo: { label: 'Profile photo', dropLabel: 'Drag a photo here or', browseLabel: 'upload one', hint: 'JPG or PNG, at least 400 × 400 px' },
      name: { label: 'Full name', value: 'Jordan Lee' },
      email: { label: 'Email', value: 'jordan.lee@example.com', description: 'Statements and security alerts go here.' },
      phone: { label: 'Mobile number', value: '(555) 014-2290' },
      language: {
        label: 'Language',
        value: 'en-US',
        options: [
          { id: 'en-US', label: 'English (US)' },
          { id: 'es-US', label: 'Español (EE. UU.)' },
          { id: 'fr-CA', label: 'Français (Canada)' },
        ],
      },
      region: {
        label: 'Time zone',
        value: 'America/New_York',
        options: [
          { id: 'America/New_York', label: 'Eastern Time' },
          { id: 'America/Chicago', label: 'Central Time' },
          { id: 'America/Denver', label: 'Mountain Time' },
          { id: 'America/Los_Angeles', label: 'Pacific Time' },
        ],
      },
    },
    display: {
      title: 'Appearance',
      description: 'Choose how the app looks on this device.',
      theme: { label: 'Theme', options: { system: 'System', light: 'Light', dark: 'Dark' } },
      density: { label: 'Density', options: { comfortable: 'Comfortable', compact: 'Compact' } },
    },
    danger: {
      title: 'Close your account',
      description: 'Move your balance out and cancel any automatic payments first. Closing your account is permanent.',
      action: 'Close account',
      dialog: {
        title: 'Close your account?',
        body: 'Your cards will stop working straight away and you’ll lose access to your statements in the app. This can’t be undone.',
        action: 'Close account',
        cancel: 'Keep account',
      },
      done: 'We’ve received your request to close your account',
    },
    notifications: {
      title: 'Notifications',
      description: 'Choose what we tell you about, and how.',
      groups: [
        {
          title: 'Payments',
          items: [
            { id: 'money-in', label: 'Money in', description: 'Paychecks, refunds and transfers you receive.', on: true },
            { id: 'money-out', label: 'Payments over $500', description: 'Card payments and transfers above this amount.', on: true },
          ],
        },
        {
          title: 'Security',
          items: [
            { id: 'sign-in', label: 'New sign-ins', description: 'When your account is used on a new device. Always on to protect you.', on: true, locked: true },
          ],
        },
        {
          title: 'News',
          items: [{ id: 'insights', label: 'Monthly insights', description: 'A summary of your spending on the first of each month.', on: false }],
        },
      ],
      channels: {
        label: 'Send alerts by',
        options: [
          { id: 'push', label: 'Push' },
          { id: 'email', label: 'Email' },
          { id: 'sms', label: 'SMS' },
        ],
        selected: ['push', 'email'],
      },
    },
    security: {
      title: 'Sign-in and security',
      description: 'Keep your account and your money safe.',
      twoFactor: { label: 'Two-step verification', description: 'Ask for a code from your phone when you sign in on a new device.', on: true },
      password: { label: 'Password', description: 'Last changed on May 12, 2026.', action: 'Change password' },
      sessions: {
        title: 'Active sessions',
        description: 'Devices signed in to your account. Sign out of any you don’t recognize.',
        columns: { device: 'Device', location: 'Location', lastActive: 'Last active', actions: 'Actions' },
        current: 'This device',
        actionsLabel: 'Actions for {device}',
        signOut: 'Sign out',
        signedOut: 'Signed out of {device}',
        rows: [
          { id: 's1', device: 'Chrome on macOS', kind: 'desktop', location: 'Brooklyn, NY', lastActive: '2026-09-26T09:12:00-04:00', current: true },
          { id: 's2', device: 'iPhone app', kind: 'mobile', location: 'Brooklyn, NY', lastActive: '2026-09-26T08:40:00-04:00' },
          { id: 's3', device: 'Firefox on Windows', kind: 'desktop', location: 'Newark, NJ', lastActive: '2026-09-02T22:47:00-04:00' },
        ],
      },
    },
    billing: {
      title: 'Plan & billing',
      description: 'Your plan, what it includes and where its fee comes from.',
      plan: {
        name: 'Plus',
        price: 4.99,
        period: 'per month',
        badge: 'Current plan',
        features: ['No foreign transaction fees', '4 free out-of-network ATM withdrawals a month', 'Priority support in the app'],
        change: 'Change plan',
      },
      method: { title: 'Fee paid from', label: 'Checking account •• 6614', detail: 'Charged on the 1st of each month', update: 'Change account' },
    },
  },
};
