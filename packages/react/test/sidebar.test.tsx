import { useState } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar, SidebarFooter, SidebarHeader, SidebarItem, SidebarSection, useSidebar } from '../src/ui/sidebar';

const Icon = () => <svg data-testid="icon" />;

function FooterProbe() {
  const { collapsed } = useSidebar();
  return <span>{collapsed ? 'compact footer' : 'full footer'}</span>;
}

function Nav({ onPress, ...props }: Partial<React.ComponentProps<typeof Sidebar>> & { onPress?: () => void }) {
  return (
    <Sidebar aria-label="Main" {...props}>
      <SidebarHeader title="Ledger" subtitle="Wealth" />
      <SidebarSection title="Overview">
        <SidebarItem href="/dashboard" icon={<Icon />} isCurrent>Dashboard</SidebarItem>
        <SidebarItem href="/statements" icon={<Icon />} count={3}>Statements</SidebarItem>
        <SidebarItem href="/transfers" icon={<Icon />} badge="New">Transfers</SidebarItem>
      </SidebarSection>
      <SidebarSection title="Account">
        <SidebarItem href="/cards" icon={<Icon />} isDisabled>Cards</SidebarItem>
        <SidebarItem icon={<Icon />} onPress={onPress}>Invite people</SidebarItem>
      </SidebarSection>
      <SidebarFooter>
        <FooterProbe />
      </SidebarFooter>
    </Sidebar>
  );
}

describe('Sidebar', () => {
  it('renders a named nav landmark with labelled lists; header and footer sit outside it', () => {
    render(<Nav />);
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('list', { name: 'Overview' })).toBeInTheDocument();
    expect(within(nav).getByRole('list', { name: 'Account' })).toBeInTheDocument();
    expect(within(nav).queryByText('Ledger')).toBeNull();
    expect(within(nav).queryByText('full footer')).toBeNull();
    expect(screen.getByText('full footer')).toBeInTheDocument();
  });

  it('marks the current page with aria-current and keeps counts and badges in the name', () => {
    render(<Nav />);
    const current = screen.getByRole('link', { name: 'Dashboard' });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveAttribute('data-current', 'true');
    expect(screen.getByRole('link', { name: 'Statements 3' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Transfers New' })).toHaveAttribute('href', '/transfers');
  });

  it('is a plain tab sequence (no roving focus) and skips disabled items', async () => {
    const user = userEvent.setup();
    render(<Nav />);
    await user.tab();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Statements 3' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Transfers New' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Invite people' })).toHaveFocus();
    expect(screen.getByText('Cards').closest('[data-disabled]')).toHaveAttribute('aria-disabled', 'true');
  });

  it('button items fire onPress from the keyboard', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<Nav onPress={onPress} />);
    screen.getByRole('button', { name: 'Invite people' }).focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('has no toggle unless it is collapsible', () => {
    render(<Nav />);
    expect(screen.queryByRole('button', { name: /sidebar/i })).toBeNull();
  });

  it('collapses from a labelled toggle, keeping accessible names, and reports it (controlled)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Controlled() {
      const [collapsed, setCollapsed] = useState(false);
      return (
        <Nav
          collapsed={collapsed}
          onCollapsedChange={(c) => {
            onChange(c);
            setCollapsed(c);
          }}
        />
      );
    }
    const { container } = render(<Controlled />);
    const toggle = screen.getByRole('button', { name: 'Collapse sidebar' });
    expect(toggle).toHaveAttribute('aria-controls', screen.getByRole('navigation').id);
    await user.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(container.firstElementChild).toHaveAttribute('data-collapsed', 'true');
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
    // Names survive the icon-only mode.
    expect(screen.getByRole('link', { name: 'Statements 3' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByText('compact footer')).toBeInTheDocument();
  });

  it('shows the label in a tooltip on keyboard focus when collapsed, not when expanded', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Nav collapsed />);
    await user.tab(); // the toggle is not rendered (not collapsible), so the first stop is the first item
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Dashboard');
    await user.keyboard('{Escape}');
    rerender(<Nav collapsed={false} />);
    act(() => screen.getByRole('link', { name: 'Dashboard' }).blur());
    await user.tab();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('uncontrolled: defaultCollapsed shows the toggle and toggles itself', async () => {
    const user = userEvent.setup();
    render(<Nav defaultCollapsed />);
    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }));
    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toBeInTheDocument();
  });

  it('takes localised toggle labels, className and variant', () => {
    const { container } = render(
      <Nav defaultCollapsed={false} collapseLabel="طي الشريط" variant="floating" className="mine" />,
    );
    expect(screen.getByRole('button', { name: 'طي الشريط' })).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('sidebar', 'mine');
    expect(container.firstElementChild).toHaveAttribute('data-variant', 'floating');
  });

  it('formats counts for the locale and uses aria-current on button items too', () => {
    render(
      <Sidebar aria-label="Main">
        <SidebarSection>
          <SidebarItem icon={<Icon />} count={1200} isCurrent onPress={() => {}}>Inbox</SidebarItem>
        </SidebarSection>
      </Sidebar>,
    );
    const item = screen.getByRole('button', { name: 'Inbox 1,200' });
    expect(item).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('list')).not.toHaveAttribute('aria-labelledby');
  });
});
