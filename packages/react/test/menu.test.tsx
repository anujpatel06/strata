import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IconPencil } from '@strata/icons';
import { I18nProvider } from 'react-aria-components';
import { Button } from '../src/ui/button';
import { Menu, MenuItem, MenuSection, MenuSeparator, MenuTrigger, SubmenuTrigger } from '../src/ui/menu';

function Example({ onAction = () => {} }: { onAction?: (key: React.Key) => void }) {
  return (
    <MenuTrigger>
      <Button>Actions</Button>
      <Menu onAction={onAction}>
        <MenuItem id="edit" icon={<IconPencil />} shortcut="⌘E">
          Edit
        </MenuItem>
        <MenuItem id="duplicate" description="Creates a draft copy">
          Duplicate
        </MenuItem>
        <MenuItem id="archive" isDisabled>
          Archive
        </MenuItem>
        <SubmenuTrigger>
          <MenuItem id="share">Share</MenuItem>
          <Menu onAction={onAction}>
            <MenuItem id="email">Email link</MenuItem>
            <MenuItem id="copy">Copy link</MenuItem>
          </Menu>
        </SubmenuTrigger>
        <MenuSeparator />
        <MenuItem id="delete" tone="danger">
          Delete
        </MenuItem>
      </Menu>
    </MenuTrigger>
  );
}

describe('Menu', () => {
  it('opens from the keyboard and focuses the first item', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.tab();
    await user.keyboard('{Enter}');
    const menu = screen.getByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
  });

  it('moves with arrow keys, skips disabled items and supports typeahead', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.tab();
    await user.keyboard('{Enter}');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: /Duplicate/ })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Share' })).toHaveFocus();
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveAttribute('aria-disabled', 'true');
    await user.keyboard('de');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
  });

  it('fires onAction with the item id, closes, and returns focus to the trigger', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(<Example onAction={onAction} />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    await user.click(trigger);
    await user.click(screen.getByRole('menuitem', { name: /Duplicate/ }));
    expect(onAction.mock.calls[0]?.[0]).toBe('duplicate');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('closes on Escape and returns focus', async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    await user.tab();
    await user.keyboard('{Enter}');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('renders shortcut, description and danger tone', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    const edit = screen.getByRole('menuitem', { name: 'Edit' });
    expect(edit.querySelector('kbd')).toHaveTextContent('⌘E');
    expect(screen.getByRole('menuitem', { name: /Duplicate/ })).toHaveAccessibleDescription('Creates a draft copy');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute('data-tone', 'danger');
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('opens a submenu with ArrowRight', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(<Example onAction={onAction} />);
    await user.tab();
    await user.keyboard('{Enter}{ArrowDown}{ArrowDown}');
    const share = screen.getByRole('menuitem', { name: 'Share' });
    expect(share).toHaveAttribute('aria-haspopup', 'menu');
    await user.keyboard('{ArrowRight}');
    const menus = await screen.findAllByRole('menu');
    expect(menus).toHaveLength(2);
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Email link' })).toHaveFocus());
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onAction.mock.calls[0]?.[0]).toBe('copy');
  });

  it('opens a submenu with ArrowLeft in right-to-left locales', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider locale="ar-AE">
        <Example />
      </I18nProvider>,
    );
    await user.tab();
    await user.keyboard('{Enter}{ArrowDown}{ArrowDown}{ArrowLeft}');
    expect(await screen.findAllByRole('menu')).toHaveLength(2);
    const submenu = screen.getAllByRole('menu')[1]!;
    expect(submenu.closest('[dir]')).toHaveAttribute('dir', 'rtl');
  });

  it('shows checkmarks for selected items when selectionMode is set', async () => {
    const user = userEvent.setup();
    render(
      <MenuTrigger>
        <Button>Sort</Button>
        <Menu selectionMode="single" defaultSelectedKeys={['newest']}>
          <MenuSection title="Sort by">
            <MenuItem id="newest">Newest first</MenuItem>
            <MenuItem id="oldest">Oldest first</MenuItem>
          </MenuSection>
        </Menu>
      </MenuTrigger>,
    );
    await user.click(screen.getByRole('button', { name: 'Sort' }));
    const newest = screen.getByRole('menuitemradio', { name: 'Newest first' });
    expect(newest).toHaveAttribute('aria-checked', 'true');
    expect(newest.querySelector('.check svg')).not.toBeNull();
    expect(screen.getByRole('menuitemradio', { name: 'Oldest first' }).querySelector('.check svg')).toBeNull();
    expect(screen.getByRole('group', { name: 'Sort by' })).toBeInTheDocument();
  });

  it('passes className through and carries ThemeScope attributes into the popover', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <div data-strata-theme="harbor" data-strata-scheme="dark" dir="rtl">
        <MenuTrigger>
          <Button>More</Button>
          <Menu className="custom">
            <MenuItem>Rename</MenuItem>
          </Menu>
        </MenuTrigger>
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'More' }));
    const menu = screen.getByRole('menu');
    expect(menu).toHaveClass('menu', 'custom');
    const popover = menu.closest('[data-strata-theme]')!;
    expect(container).not.toContainElement(popover as HTMLElement);
    expect(popover).toHaveAttribute('data-strata-theme', 'harbor');
    expect(popover).toHaveAttribute('dir', 'rtl');
  });

  it('renders inline outside a MenuTrigger', () => {
    render(
      <Menu aria-label="Account">
        <MenuItem>Profile</MenuItem>
      </Menu>,
    );
    expect(screen.getByRole('menu', { name: 'Account' })).toBeInTheDocument();
  });
});
