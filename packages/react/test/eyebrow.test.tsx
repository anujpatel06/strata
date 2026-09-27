import { render, screen } from '@testing-library/react';
import { Eyebrow } from '../src/ui/eyebrow';

describe('Eyebrow', () => {
  it('renders a paragraph by default, and a span with as="span"', () => {
    const { container, rerender } = render(<Eyebrow>Wallet · 2026</Eyebrow>);
    expect(container.firstChild?.nodeName).toBe('P');
    expect(screen.getByText('Wallet · 2026')).toBeInTheDocument();
    rerender(<Eyebrow as="span">Wallet · 2026</Eyebrow>);
    expect(container.firstChild?.nodeName).toBe('SPAN');
  });

  it('is not a heading, so it stays out of the document outline', () => {
    render(<Eyebrow>First time here</Eyebrow>);
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('draws a decorative rule before the text', () => {
    const { container } = render(<Eyebrow lead="rule">How it works</Eyebrow>);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute('data-lead', 'rule');
    const rule = container.querySelector('.rule');
    expect(rule).toHaveAttribute('aria-hidden', 'true');
    expect(root).toHaveTextContent(/^How it works$/);
  });

  it('hides the icon from assistive tech and prefers it over the rule', () => {
    const { container } = render(
      <Eyebrow lead="rule" icon={<svg data-testid="icon" />}>
        Covered
      </Eyebrow>,
    );
    expect(container.querySelector('.rule')).toBeNull();
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstChild).toHaveAttribute('data-lead', 'icon');
  });

  it('reflects tone, passes className and native props through', () => {
    const { container } = render(
      <Eyebrow tone="accent" className="mine" id="kicker">
        New
      </Eyebrow>,
    );
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute('data-tone', 'accent');
    expect(root).toHaveClass('eyebrow', 'mine');
    expect(root).toHaveAttribute('id', 'kicker');
  });
});
