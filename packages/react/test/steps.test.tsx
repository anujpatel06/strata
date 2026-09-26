import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Steps } from '../src/ui/steps';

const steps = [
  { id: 'details', label: 'Details' },
  { id: 'upload', label: 'Upload', description: 'Invoices and reports' },
  { id: 'review', label: 'Review' },
];

describe('Steps', () => {
  it('renders an ordered list named "Progress"', () => {
    render(<Steps current="upload" steps={steps} />);
    const list = screen.getByRole('list', { name: 'Progress' });
    expect(list.tagName).toBe('OL');
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
  });

  it('marks only the current step with aria-current="step"', () => {
    render(<Steps current="upload" steps={steps} />);
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items[0]).not.toHaveAttribute('aria-current');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[2]).not.toHaveAttribute('aria-current');
    expect(items.map((li) => li.getAttribute('data-status'))).toEqual(['complete', 'current', 'upcoming']);
  });

  it('announces completed steps in text, not only colour', () => {
    render(<Steps current="review" steps={steps} />);
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Details, completed');
    expect(items[1]).toHaveTextContent(/Upload, completed/);
    expect(items[2]).not.toHaveTextContent('completed');
  });

  it('makes only completed steps pressable when onStepPress is set', async () => {
    const user = userEvent.setup();
    const onStepPress = vi.fn();
    render(<Steps current="review" steps={steps} onStepPress={onStepPress} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);

    await user.tab();
    expect(buttons[0]).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onStepPress).toHaveBeenCalledWith('details');
    await user.click(screen.getByRole('button', { name: /Upload\s*, completed/ }));
    expect(onStepPress).toHaveBeenLastCalledWith('upload');
  });

  it('renders no buttons without onStepPress', () => {
    render(<Steps current="review" steps={steps} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders the narrow summary for horizontal steps', () => {
    const { container } = render(<Steps current="upload" steps={steps} />);
    expect(container.querySelector('.summary')).toHaveTextContent('Step 2 of 3·Upload');
  });

  it('supports vertical orientation, a custom label and className', () => {
    const { container } = render(<Steps current="details" steps={steps} orientation="vertical" aria-label="Claim progress" className="custom" />);
    expect(screen.getByRole('list', { name: 'Claim progress' })).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('data-orientation', 'vertical');
    expect(container.firstElementChild).toHaveClass('root', 'custom');
    expect(container.querySelector('.summary')).toBeNull();
  });
});
