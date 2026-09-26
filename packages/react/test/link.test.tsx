import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link } from '../src/ui/link';

describe('Link', () => {
  it('renders an anchor with an accessible name, inline by default', () => {
    render(<Link href="/claims">View claims</Link>);
    const link = screen.getByRole('link', { name: 'View claims' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/claims');
    expect(link).toHaveAttribute('data-variant', 'inline');
  });

  it('is reachable by Tab and fires onPress with Enter', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(
      <Link variant="standalone" onPress={onPress}>
        Show details
      </Link>,
    );
    await user.tab();
    const link = screen.getByRole('link', { name: 'Show details' });
    expect(link).toHaveFocus();
    expect(link).toHaveAttribute('data-focus-visible');
    await user.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('reflects disabled state in ARIA and ignores presses', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(
      <Link href="/claims" isDisabled onPress={onPress}>
        View claims
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'View claims' });
    expect(link).toHaveAttribute('aria-disabled', 'true');
    await user.click(link);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('passes className through', () => {
    render(
      <Link href="/" className="extra">
        Home
      </Link>,
    );
    expect(screen.getByRole('link', { name: 'Home' })).toHaveClass('root', 'extra');
  });
});
