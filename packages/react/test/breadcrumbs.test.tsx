import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Breadcrumb, Breadcrumbs } from '../src/ui/breadcrumbs';

describe('Breadcrumbs', () => {
  it('renders a navigation landmark with an ordered list', () => {
    render(
      <Breadcrumbs>
        <Breadcrumb href="/">Home</Breadcrumb>
        <Breadcrumb href="/claims">Claims</Breadcrumb>
        <Breadcrumb>CLM-20481</Breadcrumb>
      </Breadcrumbs>,
    );
    const nav = screen.getByRole('navigation', { name: 'Breadcrumbs' });
    expect(nav.querySelector('ol')).not.toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
  });

  it('marks the last item as the current page and does not link it', () => {
    render(
      <Breadcrumbs>
        <Breadcrumb href="/">Home</Breadcrumb>
        <Breadcrumb href="/claims">Claims</Breadcrumb>
      </Breadcrumbs>,
    );
    const current = screen.getByText('Claims');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).not.toHaveAttribute('href');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('collapses long trails and expands them from the ellipsis button', async () => {
    const user = userEvent.setup();
    render(
      <Breadcrumbs maxItems={3}>
        <Breadcrumb href="/">Home</Breadcrumb>
        <Breadcrumb href="/settings">Settings</Breadcrumb>
        <Breadcrumb href="/team">Team</Breadcrumb>
        <Breadcrumb href="/roles">Roles</Breadcrumb>
        <Breadcrumb>Permissions</Breadcrumb>
      </Breadcrumbs>,
    );
    expect(screen.queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Team' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Roles' })).toBeInTheDocument();

    const more = screen.getByRole('button', { name: 'Show all breadcrumbs' });
    await user.tab();
    await user.tab();
    expect(more).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(screen.queryByRole('button', { name: 'Show all breadcrumbs' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveFocus();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it('accepts a custom landmark label and className', () => {
    render(
      <Breadcrumbs aria-label="You are here" className="custom">
        <Breadcrumb href="/">Home</Breadcrumb>
        <Breadcrumb>Claims</Breadcrumb>
      </Breadcrumbs>,
    );
    const list = screen.getByRole('navigation', { name: 'You are here' }).querySelector('ol');
    expect(list).toHaveClass('list', 'custom');
    expect(list).toHaveAttribute('aria-label', 'You are here');
  });
});
