import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IconCopy } from '@tabler/icons-react';
import { Button } from '../src/ui/button';
import { Tooltip, TooltipTrigger, type TooltipProps } from '../src/ui/tooltip';

function Example(props: Partial<TooltipProps>) {
  return (
    <TooltipTrigger>
      <Button size="icon" variant="ghost" aria-label="Copy reference">
        <IconCopy aria-hidden />
      </Button>
      <Tooltip {...props}>Copy reference</Tooltip>
    </TooltipTrigger>
  );
}

describe('Tooltip', () => {
  it('shows on keyboard focus, describes the trigger, and hides on Escape', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.tab();
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Copy reference');
    expect(screen.getByRole('button', { name: 'Copy reference' })).toHaveAttribute('aria-describedby', tooltip.id);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
  });

  it('renders an arrow by default and passes className through', async () => {
    const user = userEvent.setup();
    render(<Example className="custom" />);
    await user.tab();
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveClass('tooltip', 'custom');
    expect(tooltip.querySelector('.arrow svg')).not.toBeNull();
  });

  it('hides the arrow with showArrow={false}', async () => {
    const user = userEvent.setup();
    render(<Example showArrow={false} />);
    await user.tab();
    expect((await screen.findByRole('tooltip')).querySelector('.arrow')).toBeNull();
  });

  it('does not open for disabled triggers', async () => {
    const user = userEvent.setup();
    render(
      <TooltipTrigger isDisabled>
        <Button>Export</Button>
        <Tooltip>Export as CSV</Tooltip>
      </TooltipTrigger>,
    );
    await user.tab();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('carries the ThemeScope attributes of its trigger', async () => {
    const user = userEvent.setup();
    render(
      <div data-strata-theme="vela" data-strata-scheme="dark" dir="rtl">
        <Example />
      </div>,
    );
    await user.tab();
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveAttribute('data-strata-theme', 'vela');
    expect(tooltip).toHaveAttribute('data-strata-scheme', 'dark');
    expect(tooltip).toHaveAttribute('dir', 'rtl');
  });
});
