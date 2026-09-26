import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextArea } from '../src/ui/text-area';

describe('TextArea', () => {
  it('renders a labelled multi-line textbox with a description', () => {
    render(<TextArea label="What happened?" description="Include dates and amounts." />);
    const textarea = screen.getByRole('textbox', { name: 'What happened?' });
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAttribute('rows', '3');
    expect(textarea).toHaveAccessibleDescription('Include dates and amounts.');
  });

  it('accepts typing including new lines', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TextArea label="Notes" onChange={onChange} />);
    await user.tab();
    await user.keyboard('Line one{Enter}Line two');
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveValue('Line one\nLine two');
    expect(onChange).toHaveBeenLastCalledWith('Line one\nLine two');
  });

  it('counts characters and announces only when nearing and reaching the limit', async () => {
    const user = userEvent.setup();
    const { container } = render(<TextArea label="Note" maxLength={20} />);
    const textarea = screen.getByRole('textbox', { name: 'Note' });
    expect(textarea).toHaveAttribute('maxlength', '20');
    const count = container.querySelector('.count');
    const live = container.querySelector('[aria-live="polite"]');
    expect(count).toHaveTextContent('0/20');
    expect(count).toHaveAttribute('aria-hidden', 'true');

    await user.click(textarea);
    await user.keyboard('abcdefghij');
    expect(count).toHaveTextContent('10/20');
    expect(live).toHaveTextContent('');

    await user.keyboard('klmnopqr'); // 18 → 2 left, inside the 10% threshold
    expect(count).toHaveAttribute('data-zone', 'near');
    expect(live).toHaveTextContent('2 characters left');

    await user.keyboard('s'); // 19: still "near", no new announcement
    expect(live).toHaveTextContent('2 characters left');

    await user.keyboard('tuv'); // capped at 20 by maxlength
    expect(textarea).toHaveValue('abcdefghijklmnopqrst');
    expect(count).toHaveAttribute('data-zone', 'limit');
    expect(live).toHaveTextContent('Character limit reached');
  });

  it('marks auto-resizing text areas and stays usable', async () => {
    const user = userEvent.setup();
    render(<TextArea label="Message" autoResize maxRows={6} />);
    const textarea = screen.getByRole('textbox', { name: 'Message' });
    expect(textarea).toHaveAttribute('data-auto-resize');
    await user.click(textarea);
    await user.keyboard('Hello');
    expect(textarea.style.blockSize).not.toBe('');
  });

  it('reflects invalid and disabled state', () => {
    render(
      <>
        <TextArea label="Reason" isInvalid errorMessage="Tell us why." />
        <TextArea label="Locked" isDisabled />
      </>,
    );
    const reason = screen.getByRole('textbox', { name: 'Reason' });
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    expect(reason).toHaveAccessibleDescription('Tell us why.');
    expect(screen.getByRole('textbox', { name: 'Locked' })).toBeDisabled();
  });

  it('passes className through', () => {
    const { container } = render(<TextArea label="Notes" className="extra" />);
    expect(container.firstElementChild).toHaveClass('field', 'extra');
  });
});
