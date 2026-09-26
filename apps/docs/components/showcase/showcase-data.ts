/**
 * Mock content for the showcase cards. Neutral and domain-agnostic on purpose: the grid renders in every
 * tenant's theme (a bank, an insurer, a grocer), so nothing here belongs to one industry.
 */

export const PEOPLE = [
  { id: 'maya', name: 'Maya Chen', email: 'maya@example.com', role: 'owner' },
  { id: 'jonas', name: 'Jonas Weber', email: 'jonas@example.com', role: 'admin' },
  { id: 'amara', name: 'Amara Okafor', email: 'amara@example.com', role: 'editor' },
  { id: 'luis', name: 'Luis Ortega', email: 'luis@example.com', role: 'viewer' },
] as const;

export const ROLES = [
  { id: 'owner', label: 'Owner', description: 'Full access, including billing' },
  { id: 'admin', label: 'Admin', description: 'Manage members and settings' },
  { id: 'editor', label: 'Editor', description: 'Create and edit content' },
  { id: 'viewer', label: 'Viewer', description: 'Read-only access' },
] as const;

export type RenewalStatus = 'due' | 'paid' | 'overdue' | 'scheduled' | 'paused';

export interface Renewal {
  id: string;
  account: string;
  plan: string;
  date: string;
  status: RenewalStatus;
  amount: string;
}

export const RENEWALS: readonly Renewal[] = [
  { id: 'r1', account: 'Northwind Labs', plan: 'Business', date: 'Oct 2', status: 'due', amount: '$4,800' },
  { id: 'r2', account: 'Bluebird Studio', plan: 'Team', date: 'Oct 5', status: 'paid', amount: '$240' },
  { id: 'r3', account: 'Cedar & Pine', plan: 'Team', date: 'Oct 9', status: 'overdue', amount: '$2,160' },
  { id: 'r4', account: 'Orbit Logistics', plan: 'Starter', date: 'Oct 14', status: 'scheduled', amount: '$49' },
  { id: 'r5', account: 'Lumen & Co', plan: 'Business', date: 'Oct 21', status: 'paused', amount: '$420' },
];

export const RENEWAL_STATUS = {
  due: { label: 'Due soon', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
  overdue: { label: 'Overdue', tone: 'danger' },
  scheduled: { label: 'Scheduled', tone: 'info' },
  paused: { label: 'Paused', tone: 'neutral' },
} as const satisfies Record<RenewalStatus, { label: string; tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger' }>;

/** Twelve points, oldest first. Mock data for the sparkline. */
export const REVENUE_SERIES = [31, 34, 32, 38, 36, 41, 39, 44, 47, 45, 51, 56];
