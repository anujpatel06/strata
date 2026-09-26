import { render, screen } from '@testing-library/react';
import { Separator } from '../src/ui/separator';

describe('Separator', () => {
  it('is a horizontal separator by default', () => {
    render(<Separator className="mine" />);
    const sep = screen.getByRole('separator');
    expect(sep).not.toHaveAttribute('aria-orientation', 'vertical');
    expect(sep).toHaveClass('separator', 'mine');
  });

  it('can be vertical', () => {
    render(<Separator orientation="vertical" />);
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('with a label, renders the text and hides the hairlines', () => {
    const { container } = render(<Separator label="or" data-testid="divider" />);
    expect(screen.getByText('or')).toBeInTheDocument();
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    expect(screen.getByTestId('divider')).toHaveClass('labelled');
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
  });
});
