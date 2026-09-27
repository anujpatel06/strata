import { render, screen } from '@testing-library/react';
import { I18nProvider } from 'react-aria-components';
import { Amount } from '../src/ui/amount';

const visible = (c: HTMLElement) => (c.querySelector('.figure') as HTMLElement).textContent;

describe('Amount', () => {
  it('groups by locale (en-IN lakh grouping) and drops decimals for whole amounts', () => {
    const { container } = render(<Amount value={184250} currency="INR" locale="en-IN" />);
    expect(visible(container)).toBe('₹1,84,250');
    expect(screen.getByText('₹1,84,250')).toHaveClass('srOnly');
  });

  it('gives assistive tech the full string once and hides the typeset parts', () => {
    const { container } = render(<Amount value={18000} currency="INR" locale="en-IN" />);
    const figure = container.querySelector('.figure') as HTMLElement;
    expect(figure).toHaveAttribute('aria-hidden', 'true');
    expect(figure.querySelector('.currency')).toHaveTextContent('₹');
    expect(container.firstChild).toHaveTextContent('₹18,000₹18,000'); // visual (hidden) + spoken
  });

  it('defaults the locale to the React Aria locale', () => {
    const { container } = render(
      <I18nProvider locale="de-DE">
        <Amount value={1249.5} currency="EUR" />
      </I18nProvider>,
    );
    expect(screen.getByText('1.249,50 €')).toBeInTheDocument();
    // The sign comes after the figure in de-DE; the non-breaking space is replaced by margin.
    expect(container.querySelector('.currency')).toHaveAttribute('data-side', 'after');
    expect(visible(container)).toBe('1.249,50€');
    expect(container.querySelector('.fraction')).toHaveTextContent(',');
  });

  it('keeps the locale spacing with symbol="inline"', () => {
    const { container } = render(<Amount value={1249.5} currency="EUR" locale="de-DE" symbol="inline" />);
    expect(visible(container)).toBe('1.249,50\u00a0€');
    expect(container.firstChild).toHaveAttribute('data-symbol', 'inline');
  });

  it('supports compact notation without shrinking the compact decimal', () => {
    const { container } = render(<Amount value={184250} currency="INR" locale="en-IN" compact />);
    expect(visible(container)).toBe('₹1.8L');
    expect(container.querySelector('.fraction')).toBeNull();
  });

  it('uses a true minus sign for negative amounts', () => {
    render(<Amount value={-980} currency="INR" locale="en-IN" />);
    expect(screen.getByText('−₹980')).toBeInTheDocument();
  });

  it('marks multi-character signs so they are set larger', () => {
    const { container } = render(<Amount value={100} currency="USD" locale="en-CA" />);
    expect(container.querySelector('.currency')).toHaveAttribute('data-long');
  });

  it('reflects size and tone, and passes className through', () => {
    const { container } = render(<Amount value={1} currency="GBP" locale="en-GB" size="xl" tone="brand" className="mine" />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute('data-size', 'xl');
    expect(root).toHaveAttribute('data-tone', 'brand');
    expect(root).toHaveClass('amount', 'mine');
  });
});
