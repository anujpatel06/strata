import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComposerButton, ComposerSelect, PromptComposer } from '../src/ui/prompt-composer';

const MODES = [
  { id: 'quick', label: 'Quick answer' },
  { id: 'deep', label: 'DeepThink' },
];

describe('PromptComposer', () => {
  it('sends trimmed text on Enter and clears itself; Shift+Enter adds a line', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PromptComposer onSubmit={onSubmit} />);
    const box = screen.getByRole('textbox', { name: 'Message' });
    const send = screen.getByRole('button', { name: 'Send' });
    expect(send).toBeDisabled();

    await user.type(box, '  Hello');
    expect(send).toBeEnabled();
    await user.type(box, '{Shift>}{Enter}{/Shift}there');
    expect(box).toHaveValue('  Hello\nthere');
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(box, '{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('Hello\nthere');
    expect(box).toHaveValue('');
  });

  it('never sends while an input method is composing (Hindi, Japanese, Chinese keyboards)', () => {
    const onSubmit = vi.fn();
    render(<PromptComposer onSubmit={onSubmit} defaultValue="नमस्ते" />);
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', isComposing: true });
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledWith('नमस्ते');
  });

  it('turns send into stop while pending', async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();
    const onSubmit = vi.fn();
    render(<PromptComposer isPending onStop={onStop} onSubmit={onSubmit} defaultValue="Hi" />);
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Stop' }));
    expect(onStop).toHaveBeenCalledOnce();
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('marks the glow and surface for styling', () => {
    const { container, rerender } = render(<PromptComposer />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('data-glow', 'brand');
    expect(root).toHaveAttribute('data-surface', 'solid');
    rerender(<PromptComposer glow="spectrum" surface="glass" />);
    expect(root).toHaveAttribute('data-glow', 'spectrum');
    expect(root).toHaveAttribute('data-surface', 'glass');
    rerender(<PromptComposer glow={false} />);
    expect(root).not.toHaveAttribute('data-glow');
  });
});

describe('ComposerButton', () => {
  it('keeps a visible label as its name, or takes aria-label when icon-only', () => {
    render(
      <>
        <ComposerButton icon={<svg />}>Voice</ComposerButton>
        <ComposerButton aria-label="Attach a file" icon={<svg />} />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Voice' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Attach a file' })).toHaveAttribute('data-icon-only');
  });
});

describe('ComposerSelect', () => {
  it('names the pill with its choice and changes it from the menu', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<ComposerSelect label="Reasoning" options={MODES} onSelectionChange={onSelectionChange} />);
    const pill = screen.getByRole('button', { name: 'Reasoning: Quick answer' });
    await user.click(pill);
    await user.click(screen.getByRole('menuitemradio', { name: 'DeepThink' }));
    expect(onSelectionChange).toHaveBeenCalledWith('deep');
    expect(screen.getByRole('button', { name: 'Reasoning: DeepThink' })).toBeInTheDocument();
  });
});
