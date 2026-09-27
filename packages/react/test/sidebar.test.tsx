import { useState } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Menu, MenuItem } from '../src/ui/menu';
import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarSearch,
  SidebarSection,
  SidebarUser,
  useSidebar,
} from '../src/ui/sidebar';

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

describe('Sidebar groups, search and user', () => {
  function Full(props: Partial<React.ComponentProps<typeof Sidebar>> & { onSearch?: () => void; groupProps?: object }) {
    const { onSearch, groupProps, ...rest } = props;
    return (
      <Sidebar aria-label="Main" {...rest}>
        <SidebarHeader title="Tempo" subtitle="Team" />
        <SidebarSearch shortcut="⌘K" onPress={onSearch} />
        <SidebarSection title="Management">
          <SidebarItem href="/org" icon={<Icon />}>Organization</SidebarItem>
          <SidebarItem icon={<Icon />} label="Employees" count={2} {...groupProps}>
            <SidebarItem href="/jonah">Jonah Adams</SidebarItem>
            <SidebarItem href="/yuri" isCurrent>Yuri Jackson</SidebarItem>
          </SidebarItem>
        </SidebarSection>
        <SidebarFooter>
          <SidebarItem href="/settings" icon={<Icon />}>Settings</SidebarItem>
          <SidebarUser
            name="Maya Chen"
            description="maya@example.com"
            menu={
              <Menu>
                <MenuItem id="profile">Profile</MenuItem>
                <MenuItem id="out">Sign out</MenuItem>
              </Menu>
            }
          />
        </SidebarFooter>
      </Sidebar>
    );
  }

  it('renders a group as a disclosure, open by default when it holds the current page', async () => {
    const user = userEvent.setup();
    render(<Full />);
    const trigger = screen.getByRole('button', { name: 'Employees 2' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls');
    const current = screen.getByRole('link', { name: 'Yuri Jackson' });
    expect(current).toHaveAttribute('aria-current', 'page');
    // The panel is a group named by its trigger.
    expect(screen.getByRole('group', { name: 'Employees 2' })).toContainElement(current);

    trigger.focus();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Yuri Jackson' })).toBeNull();
    await user.keyboard(' ');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    // Tab moves from the trigger into the open group's links.
    await user.tab();
    expect(screen.getByRole('link', { name: 'Jonah Adams' })).toHaveFocus();
  });

  it('supports defaultExpanded and controlled isExpanded / onExpandedChange', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { unmount } = render(<Full groupProps={{ defaultExpanded: false }} />);
    expect(screen.getByRole('button', { name: 'Employees 2' })).toHaveAttribute('aria-expanded', 'false');
    unmount();

    render(<Full groupProps={{ isExpanded: false, onExpandedChange }} />);
    const trigger = screen.getByRole('button', { name: 'Employees 2' });
    await user.click(trigger);
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('collapsed: a group opens its links in a named popover dialog; Escape closes it', async () => {
    const user = userEvent.setup();
    render(<Full collapsed />);
    const trigger = screen.getByRole('button', { name: 'Employees 2' });
    // React Aria's DialogTrigger announces the state through aria-expanded (it doesn't set aria-haspopup for dialogs).
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('data-current-ancestor', 'true');
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Employees' });
    expect(within(dialog).getByRole('link', { name: 'Yuri Jackson' })).toHaveAttribute('aria-current', 'page');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('SidebarSearch: launcher mode calls onPress; the shortcut is a visual hint', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<Full onSearch={onSearch} />);
    const launcher = screen.getByRole('button', { name: 'Search' });
    expect(launcher).toHaveTextContent('⌘K');
    launcher.focus();
    await user.keyboard('{Enter}');
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('SidebarSearch: field mode is a searchbox; collapsed, its icon button expands the sidebar and focuses it', async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    render(<Full defaultCollapsed onCollapsedChange={onCollapsedChange} />);
    expect(screen.queryByRole('searchbox')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(onCollapsedChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveFocus();
    await user.keyboard('rota');
    expect(screen.getByRole('searchbox')).toHaveValue('rota');
  });

  it('SidebarUser: shows the person, opens the account menu, and holds the collapse toggle', async () => {
    const user = userEvent.setup();
    const { container } = render(<Full defaultCollapsed={false} />);
    expect(screen.getByText('Maya Chen')).toBeInTheDocument();
    expect(screen.getByText('maya@example.com')).toBeInTheDocument();
    // The toggle moved from the header to the user row.
    const toggle = screen.getByRole('button', { name: 'Collapse sidebar' });
    expect(toggle.closest('[class*="user"]')).not.toBeNull();
    expect(container.querySelector('[class*="header"]')).not.toContainElement(toggle);

    await user.click(screen.getByRole('button', { name: 'Account options' }));
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Sign out' })).toBeInTheDocument();
    await user.keyboard('{Escape}');

    // Collapsed: the avatar is the menu button, named by the person; the toggle is still there.
    await user.click(toggle);
    const avatarButton = screen.getByRole('button', { name: 'Maya Chen' });
    expect(avatarButton).toHaveAttribute('aria-haspopup', 'true');
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
    await user.click(avatarButton);
    expect(await screen.findByRole('menu')).toBeInTheDocument();
  });

  it('footer items render as a list outside the nav landmark', () => {
    render(<Full />);
    const nav = screen.getByRole('navigation', { name: 'Main' });
    const settings = screen.getByRole('link', { name: 'Settings' });
    expect(nav).not.toContainElement(settings);
    expect(settings.closest('ul')).toHaveAttribute('role', 'list');
  });
});

it('partitions children passed through a Fragment (header and footer stay outside the nav)', () => {
  render(
    <Sidebar aria-label="Main">
      <>
        <SidebarHeader title="Tempo" />
        <SidebarSection title="General">
          <SidebarItem href="/a" icon={<Icon />}>Overview</SidebarItem>
        </SidebarSection>
        <SidebarFooter>
          <SidebarUser name="Maya Chen" />
        </SidebarFooter>
      </>
    </Sidebar>,
  );
  const nav = screen.getByRole('navigation');
  expect(nav).not.toContainElement(screen.getByText('Tempo'));
  expect(nav).not.toContainElement(screen.getByText('Maya Chen'));
});
