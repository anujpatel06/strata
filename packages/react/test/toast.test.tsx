import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastRegion, toast } from '../src/ui/toast';
import { STATUS_TONES, TENANTS, loadFuzzInputs, readUiCss, statusIconWorst } from './status-icon-contrast';

afterEach(() => {
  act(() => toast.dismiss());
  vi.useRealTimers();
});

describe('toast + ToastRegion', () => {
  it('shows a toast in a labelled region, announced through a live alert', () => {
    render(<ToastRegion />);
    act(() => {
      toast({ title: 'Changes saved', description: 'Your profile is up to date.', tone: 'success' });
    });
    const region = screen.getByRole('region', { name: /notification/i });
    const item = within(region).getByRole('alertdialog', { name: 'Changes saved' });
    expect(item).toHaveAttribute('data-tone', 'success');
    expect(item).toHaveAccessibleDescription('Your profile is up to date.');
    const live = within(item).getByRole('alert');
    expect(live).toHaveTextContent('Changes saved');
    expect(live).toHaveAttribute('aria-atomic', 'true');
  });

  it('accepts a plain string and returns a key that dismisses it', () => {
    render(<ToastRegion />);
    let key = '';
    act(() => {
      key = toast('Draft saved');
    });
    expect(screen.getByRole('alertdialog', { name: 'Draft saved' })).toBeInTheDocument();
    act(() => toast.dismiss(key));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('closes from the close button, by pointer and keyboard', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ToastRegion />);
    act(() => {
      toast({ title: 'First' }, { onClose });
      toast({ title: 'Second' });
    });
    const second = screen.getByRole('alertdialog', { name: 'Second' });
    await user.click(within(second).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('alertdialog', { name: 'Second' })).not.toBeInTheDocument();

    const first = screen.getByRole('alertdialog', { name: 'First' });
    within(first).getByRole('button', { name: 'Close' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('runs the action and closes the toast', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<ToastRegion />);
    act(() => {
      toast({ title: 'Claim archived', action: { label: 'Undo', onAction } });
    });
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('auto-dismisses after 5s, but not toasts with actions or timeout: null', () => {
    vi.useFakeTimers();
    render(<ToastRegion />);
    act(() => {
      toast('Timed');
      toast({ title: 'With action', action: { label: 'Undo', onAction: () => {} } });
      toast('Sticky', { timeout: null });
    });
    act(() => vi.advanceTimersByTime(4900));
    expect(screen.getByRole('alertdialog', { name: 'Timed' })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(200));
    expect(screen.queryByRole('alertdialog', { name: 'Timed' })).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByRole('alertdialog', { name: 'With action' })).toBeInTheDocument();
    expect(screen.getByRole('alertdialog', { name: 'Sticky' })).toBeInTheDocument();
  });

  it('shows at most three toasts, newest first, and brings queued ones back', () => {
    render(<ToastRegion />);
    const keys: string[] = [];
    act(() => {
      for (const title of ['One', 'Two', 'Three', 'Four']) keys.push(toast(title, { timeout: null }));
    });
    const names = () => screen.getAllByRole('alertdialog').map((el) => el.getAttribute('aria-labelledby') && el.textContent);
    expect(screen.getAllByRole('alertdialog')).toHaveLength(3);
    expect(names()[0]).toContain('Four');
    expect(screen.queryByRole('alertdialog', { name: 'One' })).not.toBeInTheDocument();
    act(() => toast.dismiss(keys[3]));
    expect(screen.getByRole('alertdialog', { name: 'One' })).toBeInTheDocument();
  });

  it('copies theme, scheme, density, lang and dir from where it is mounted', () => {
    render(
      <div data-strata-theme="qamar" data-strata-scheme="dark" data-strata-density="compact" dir="rtl" lang="ar">
        <ToastRegion placement="top" className="mine" />
      </div>,
    );
    act(() => {
      toast('Saved');
    });
    const region = screen.getByRole('region');
    expect(region).toHaveAttribute('data-strata-theme', 'qamar');
    expect(region).toHaveAttribute('data-strata-scheme', 'dark');
    expect(region).toHaveAttribute('data-strata-density', 'compact');
    expect(region).toHaveAttribute('lang', 'ar');
    expect(region).toHaveAttribute('dir', 'rtl');
    expect(region).toHaveAttribute('data-placement', 'top');
    expect(region).toHaveClass('region', 'mine');
    // Portalled out of the themed subtree, like every overlay.
    expect(region.parentElement).toBe(document.body);
  });

  it('renders the queue once even when several regions are mounted', () => {
    const { rerender } = render(
      <>
        <ToastRegion />
        <ToastRegion />
      </>,
    );
    act(() => {
      toast('Only once', { timeout: null });
    });
    expect(screen.getAllByRole('region')).toHaveLength(1);
    expect(screen.getAllByRole('alertdialog')).toHaveLength(1);
    rerender(<ToastRegion key="replacement" />);
    expect(screen.getAllByRole('alertdialog')).toHaveLength(1);
  });

  it('dismiss() without a key clears everything', () => {
    render(<ToastRegion />);
    act(() => {
      toast('A', { timeout: null });
      toast('B', { timeout: null });
    });
    act(() => toast.dismiss());
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
});

describe('toast: filled status icon and action weight', () => {
  it('shows a filled status shape for every tone (neutral: the quiet info shape), decorative', () => {
    render(<ToastRegion />);
    act(() => {
      toast({ title: 'Plain', tone: 'neutral' }, { timeout: null });
      toast({ title: 'Done', tone: 'success' }, { timeout: null });
      toast({ title: 'Broken', tone: 'danger' }, { timeout: null });
    });
    const icon = (name: string) => screen.getByRole('alertdialog', { name }).querySelector('[data-strata-icon]');
    expect(icon('Done')).toHaveAttribute('data-strata-icon', 'seal-check-filled');
    expect(icon('Broken')).toHaveAttribute('data-strata-icon', 'alert-triangle-filled');
    expect(icon('Done')?.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(icon('Plain')).toHaveAttribute('data-strata-icon', 'info-circle-filled');
  });

  it('lets `icon` replace the status shape, still decorative', () => {
    render(<ToastRegion />);
    act(() => {
      toast({ title: 'Copied', tone: 'success', icon: <svg data-testid="custom-icon" /> }, { timeout: null });
    });
    const custom = screen.getByTestId('custom-icon');
    expect(custom.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.getByRole('alertdialog', { name: 'Copied' }).querySelector('[data-strata-icon="seal-check-filled"]')).toBeNull();
  });

  it('weights the action by severity: contrast for danger and warning, outline otherwise', () => {
    render(<ToastRegion />);
    act(() => {
      toast({ title: 'Fine', tone: 'success', action: { label: 'Got it', onAction: () => {} } });
      toast({ title: 'Failed', tone: 'danger', action: { label: 'Retry', onAction: () => {} } });
      toast({ title: 'Careful', tone: 'warning', action: { label: 'Review', onAction: () => {} } });
    });
    expect(screen.getByRole('button', { name: 'Got it' })).toHaveAttribute('data-variant', 'outline');
    expect(screen.getByRole('button', { name: 'Retry' })).toHaveAttribute('data-variant', 'contrast');
    expect(screen.getByRole('button', { name: 'Review' })).toHaveAttribute('data-variant', 'contrast');
  });

  it('keeps the close button named and reachable by keyboard when there is an action', async () => {
    const user = userEvent.setup();
    render(<ToastRegion />);
    act(() => {
      toast({ title: 'Archived', action: { label: 'Undo', onAction: () => {} } });
    });
    const item = screen.getByRole('alertdialog', { name: 'Archived' });
    within(item).getByRole('button', { name: 'Undo' }).focus();
    await user.tab();
    expect(within(item).getByRole('button', { name: 'Close' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});

/*
 * Contrast proof for the filled status icon on the toast surface (WCAG 1.4.11 non-text ≥ 3:1; the knocked-out glyph
 * held to text's 4.5:1). Reads which roles the CSS actually uses, then checks every tenant and the 1,000 fuzz brands,
 * light and dark, on surface.raised and on the sheen's brightest pixel (dark), composited the way the engine does.
 */
describe('toast: status icon contrast proof', () => {
  const css = readUiCss('toast.module.css');

  it('reads the roles it proves from the CSS', () => {
    expect(css).toMatch(/--_face: var\(--strata-color-surface-raised\)/);
    expect(css).toMatch(/var\(--strata-sheen\) padding-box/);
    for (const t of STATUS_TONES) {
      expect(css).toContain(`--_tone: var(--strata-color-feedback-${t}-fg);`);
      expect(css).toContain(`--strata-icon-on: var(--strata-color-feedback-${t}-bg);`);
    }
  });

  it('shape ≥ 3:1 on the surface and glyph ≥ 4.5:1 on the shape, every tenant × scheme and 1,000 fuzz brands', async () => {
    const tenants = statusIconWorst(Object.values(TENANTS), Object.keys(TENANTS));
    const fuzz = statusIconWorst(await loadFuzzInputs());
    // Measured 2026-09-27: tenants shape 6.09 / glyph 5.43; fuzz the same (feedback hues don't follow the brand).
    expect(Math.min(tenants.shape, fuzz.shape)).toBeGreaterThanOrEqual(3);
    expect(Math.min(tenants.glyph, fuzz.glyph)).toBeGreaterThanOrEqual(4.5);
  }, 60_000);
});
