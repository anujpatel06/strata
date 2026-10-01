import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from '../src/ui/alert';
import { STATUS_TONES, TENANTS, loadFuzzInputs, readUiCss, statusIconWorst } from './status-icon-contrast';

describe('Alert', () => {
  it('renders title and body without a live role by default', () => {
    render(<Alert title="Card expiring">Order a replacement.</Alert>);
    expect(screen.getByText('Card expiring')).toBeInTheDocument();
    expect(screen.getByText('Order a replacement.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('is an assertive live region named by its title when `live` is set', () => {
    render(
      <Alert live tone="danger" title="Payment failed">
        Try another card.
      </Alert>,
    );
    const alert = screen.getByRole('alert', { name: 'Payment failed' });
    expect(alert).toHaveAttribute('data-tone', 'danger');
  });

  it('uses role="status" for polite announcements', () => {
    render(<Alert live="polite" title="Saved" />);
    expect(screen.getByRole('status', { name: 'Saved' })).toBeInTheDocument();
  });

  it('shows a decorative tone icon that can be replaced or removed', () => {
    const { container, rerender } = render(<Alert tone="success">Done</Alert>);
    const icon = container.querySelector('svg');
    expect(icon?.closest('[aria-hidden="true"]')).not.toBeNull();
    rerender(<Alert icon={<svg data-testid="custom" />}>Done</Alert>);
    expect(screen.getByTestId('custom')).toBeInTheDocument();
    rerender(<Alert icon={false}>Done</Alert>);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('dismisses with a named button, by pointer and keyboard', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <Alert title="Saved" onDismiss={onDismiss} dismissLabel="Close message">
        Draft saved.
      </Alert>,
    );
    const button = screen.getByRole('button', { name: 'Close message' });
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onDismiss).toHaveBeenCalledTimes(1);
    await user.click(button);
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  it('renders the action slot and passes className and DOM props through', () => {
    const { container } = render(
      <Alert className="mine" data-testid="alert" action={<a href="#fix">Fix it</a>}>
        Something needs attention.
      </Alert>,
    );
    expect(screen.getByRole('link', { name: 'Fix it' })).toBeInTheDocument();
    expect(screen.getByTestId('alert')).toHaveClass('mine', 'alert');
    expect(container.firstElementChild).toHaveAttribute('data-tone', 'neutral');
  });
});

describe('Alert: filled status icon (surface recipe)', () => {
  it('uses a distinct filled shape per tone', () => {
    const shape = (tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger') => {
      const { container, unmount } = render(<Alert tone={tone} title="t" />);
      const name = container.querySelector('[data-syntara-icon]')?.getAttribute('data-syntara-icon');
      unmount();
      return name;
    };
    expect(shape('success')).toBe('seal-check-filled');
    expect(shape('danger')).toBe('alert-triangle-filled');
    expect(shape('warning')).toBe('alert-circle-filled');
    expect(shape('info')).toBe('info-circle-filled');
    expect(shape('neutral')).toBe('info-circle-filled');
  });

  it('reads the roles it proves from the CSS', () => {
    const css = readUiCss('alert.module.css');
    expect(css).toMatch(/--_face: var\(--syntara-color-surface-raised\)/);
    // The sheen is no longer painted (ADR-038); the figures below were measured under it, so they are floors.
    expect(css).not.toMatch(/var\(--syntara-sheen\) padding-box/);
    expect(css).toMatch(/--syntara-icon-on: var\(--_on-tone\)/);
    for (const t of STATUS_TONES) {
      expect(css).toContain(`--_tone: var(--syntara-color-feedback-${t}-fg);`);
      expect(css).toContain(`--_on-tone: var(--syntara-color-feedback-${t}-bg);`);
    }
  });

  it('shape ≥ 3:1 on the surface and glyph ≥ 4.5:1 on the shape, every tenant × scheme and 1,000 fuzz brands', async () => {
    const tenants = statusIconWorst(Object.values(TENANTS), Object.keys(TENANTS));
    const fuzz = statusIconWorst(await loadFuzzInputs());
    // Measured 2026-09-27: shape 6.09 (light success), glyph 5.43, tenants and fuzz alike.
    expect(Math.min(tenants.shape, fuzz.shape)).toBeGreaterThanOrEqual(3);
    expect(Math.min(tenants.glyph, fuzz.glyph)).toBeGreaterThanOrEqual(4.5);
  }, 60_000);
});
