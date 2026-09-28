/**
 * The three example documents validate and draw. jsdom can't measure contrast, so these check roles and accessible
 * names; the docs page runs the axe sweep in a browser.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeScope } from '@syntara/react';
import { prepareScreen, validateScreen } from '../src/index';
import { SyntaraScreen, type Issue } from '../src/react';

const load = (name: string) => JSON.parse(readFileSync(path.resolve(__dirname, `../examples/${name}.json`), 'utf8')) as unknown;

function draw(name: string) {
  const issues: Issue[] = [];
  const onAction = vi.fn();
  const utils = render(
    <ThemeScope locale="en-IN">
      <SyntaraScreen document={load(name)} onAction={onAction} onIssue={(i) => issues.push(i)} fallback={<p>fallback</p>} />
    </ThemeScope>,
  );
  expect(screen.queryByText('fallback')).toBeNull();
  expect(issues).toEqual([]);
  return { ...utils, onAction };
}

describe.each(['account-overview', 'order-status', 'loyalty-summary'])('%s', (name) => {
  it('validates strictly and prepares with no issues', () => {
    expect(validateScreen(load(name)).errors).toEqual([]);
    const p = prepareScreen(load(name));
    expect(p.ok && p.issues).toEqual([]);
  });

  it('has one h1, and headings in order', () => {
    draw(name);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const levels = screen.getAllByRole('heading').map((h) => Number(h.tagName.slice(1)));
    levels.forEach((level, i) => {
      if (i > 0) expect(level - levels[i - 1]!, `heading ${i}`).toBeLessThanOrEqual(1);
    });
  });

  it('names every control', () => {
    draw(name);
    for (const role of ['button', 'link', 'progressbar', 'meter', 'img'] as const)
      for (const el of screen.queryAllByRole(role)) expect(el, role).toHaveAccessibleName();
  });
});

describe('account overview', () => {
  it('shows the figures, the KYC alert and recent activity', async () => {
    const { onAction } = draw('account-overview');
    expect(screen.getByRole('heading', { level: 1, name: 'Good morning, Priya' })).toBeInTheDocument();
    expect(screen.getAllByRole('term').map((t) => t.textContent)).toEqual(['Available balance', 'Spent this month', 'Reward points']);
    expect(screen.getByText('₹1,84,250')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Update now' }));
    expect(onAction).toHaveBeenCalledWith({ type: 'event', name: 'kyc.start', payload: { reason: 'annual-review' } }, { nodeType: 'Button' });
    const activity = screen.getByRole('heading', { level: 2, name: 'Recent activity' }).closest('[data-variant]') as HTMLElement;
    expect(within(activity).getByRole('link', { name: 'View all' })).toHaveAttribute('href', '/accounts/4821/activity');
    expect(within(activity).getAllByRole('separator')).toHaveLength(2);
    expect(within(activity).getByText('Salary credited')).toBeInTheDocument();
  });
});

describe('order status', () => {
  it('shows progress, the substitution, the partner and the bill', async () => {
    const { onAction } = draw('order-status');
    expect(screen.getByRole('heading', { level: 1, name: 'Arriving in about 12 minutes' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Delivery progress' })).toHaveAttribute('aria-valuetext', 'Out for delivery');
    expect(screen.getByText('Paid')).toBeInTheDocument();
    // The partner's avatar is decorative: the name is written next to it.
    expect(screen.queryByRole('img', { name: 'Ravi Kumar' })).toBeNull();
    expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Call' }));
    expect(onAction).toHaveBeenLastCalledWith({ type: 'event', name: 'order.call_partner', payload: { orderId: '58-2931' } }, { nodeType: 'Button', nodeId: 'call' });
    expect(screen.getByRole('link', { name: 'Get help with this order' })).toHaveAttribute('href', '/help/orders/58-2931');
    expect(screen.getByText('₹646')).toBeInTheDocument();
  });
});

describe('loyalty summary', () => {
  it('shows the tier, cashback, progress to the next tier and the empty vouchers', async () => {
    const { onAction } = draw('loyalty-summary');
    expect(screen.getByRole('heading', { level: 1, name: 'Your rewards' })).toBeInTheDocument();
    expect(screen.getByText(/1,840/, { selector: 'span:not([aria-hidden])' })).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'Points to Platinum' })).toHaveAttribute('aria-valuetext', '3,200 of 5,000 points');
    expect(screen.getByRole('heading', { level: 3, name: 'No vouchers yet' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Share your referral code' }));
    expect(onAction).toHaveBeenLastCalledWith({ type: 'event', name: 'rewards.share_referral' }, { nodeType: 'Button' });
    await userEvent.click(screen.getByRole('button', { name: 'View all benefits' }));
    expect(onAction).toHaveBeenLastCalledWith({ type: 'navigate', href: '/rewards/benefits' }, { nodeType: 'Button' });
  });
});
