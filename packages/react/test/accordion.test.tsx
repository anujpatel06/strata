import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion, AccordionItem, type AccordionProps } from '../src/ui/accordion';

function Example(props: Partial<AccordionProps>) {
  return (
    <Accordion {...props}>
      <AccordionItem id="documents" title="Which documents do I need?">
        An itemised invoice.
      </AccordionItem>
      <AccordionItem id="timeline" title="How long does a review take?">
        Three working days.
      </AccordionItem>
      <AccordionItem id="pause" title="Can I pause cover?" isDisabled>
        Annual plans only.
      </AccordionItem>
    </Accordion>
  );
}

describe('Accordion', () => {
  it('renders each trigger as a button inside a heading', () => {
    render(<Example />);
    const heading = screen.getByRole('heading', { level: 3, name: 'Which documents do I need?' });
    expect(heading).toContainElement(screen.getByRole('button', { name: 'Which documents do I need?' }));
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('expands and collapses from the keyboard', async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Which documents do I need?' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const panel = document.getElementById(trigger.getAttribute('aria-controls') ?? '');
    expect(panel).toHaveTextContent('An itemised invoice.');
    expect(panel).not.toHaveAttribute('hidden');

    await user.keyboard(' ');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps one item open at a time by default', async () => {
    const user = userEvent.setup();
    render(<Example defaultExpandedKeys={['documents']} />);
    await user.click(screen.getByRole('button', { name: 'How long does a review take?' }));
    expect(screen.getByRole('button', { name: 'How long does a review take?' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Which documents do I need?' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('allows several open items with allowsMultipleExpanded', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(<Example allowsMultipleExpanded defaultExpandedKeys={['documents']} onExpandedChange={onExpandedChange} />);
    await user.click(screen.getByRole('button', { name: 'How long does a review take?' }));
    expect(screen.getByRole('button', { name: 'Which documents do I need?' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'How long does a review take?' })).toHaveAttribute('aria-expanded', 'true');
    expect(onExpandedChange).toHaveBeenCalledWith(new Set(['documents', 'timeline']));
  });

  it('reflects disabled items in ARIA and ignores presses', async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Can I pause cover?' });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('supports a custom heading level and className', () => {
    render(
      <Accordion className="custom">
        <AccordionItem id="a" title="Question" headingLevel={4}>
          Answer
        </AccordionItem>
      </Accordion>,
    );
    expect(screen.getByRole('heading', { level: 4, name: 'Question' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4 }).closest('.root')).toHaveClass('custom');
  });
});
