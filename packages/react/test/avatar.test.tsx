import { fireEvent, render, screen, within } from '@testing-library/react';
import { Avatar, AvatarGroup, getInitials } from '../src/ui/avatar';

describe('getInitials', () => {
  it('takes the first and last word', () => {
    expect(getInitials('Priya Raman')).toBe('PR');
    expect(getInitials('  ana maría de la cruz ')).toBe('AC');
    expect(getInitials('Mei')).toBe('M');
    expect(getInitials('')).toBe('');
  });

  it('keeps grapheme clusters whole', () => {
    // "É" written as E + combining acute accent, and an emoji with a skin-tone modifier.
    expect(getInitials('Émile Zola')).toBe('ÉZ');
    expect(getInitials('👩🏽‍💻 Dev')).toBe('👩🏽‍💻D');
  });

  it('keeps joining-script initials as separate letters', () => {
    expect(getInitials('محمد علي')).toBe('م‌ع');
  });
});

describe('Avatar', () => {
  it('is an image named by the person, showing initials', () => {
    render(<Avatar name="Priya Raman" />);
    const avatar = screen.getByRole('img', { name: 'Priya Raman' });
    expect(avatar).toHaveTextContent('PR');
    expect(avatar).toHaveAttribute('data-size', 'md');
    expect(avatar).toHaveAttribute('data-shape', 'circle');
  });

  it('picks the same tint for the same name', () => {
    render(
      <>
        <Avatar name="Daniel Okafor" data-testid="a" />
        <Avatar name="Daniel Okafor" data-testid="b" />
      </>,
    );
    const tint = screen.getByTestId('a').getAttribute('data-tint');
    expect(tint).toMatch(/^[0-3]$/);
    expect(screen.getByTestId('b')).toHaveAttribute('data-tint', tint!);
  });

  it('shows the image once it loads and falls back to initials if it fails', () => {
    const { container, rerender } = render(<Avatar name="Mei Lin" src="/mei.jpg" />);
    let img = container.querySelector('img')!;
    expect(img).toHaveAttribute('alt', '');
    expect(img).not.toHaveAttribute('data-loaded');
    fireEvent.load(img);
    expect(img).toHaveAttribute('data-loaded', 'true');

    rerender(<Avatar name="Mei Lin" src="/broken.jpg" />);
    img = container.querySelector('img')!;
    expect(img).not.toHaveAttribute('data-loaded');
    fireEvent.error(img);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: 'Mei Lin' })).toHaveTextContent('ML');
  });

  it('is decorative with alt=""', () => {
    const { container } = render(<Avatar name="Omar Haddad" alt="" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('passes className, size and shape through', () => {
    render(<Avatar name="Arjun Mehta" size="lg" shape="square" className="mine" />);
    const avatar = screen.getByRole('img', { name: 'Arjun Mehta' });
    expect(avatar).toHaveClass('avatar', 'mine');
    expect(avatar).toHaveAttribute('data-size', 'lg');
    expect(avatar).toHaveAttribute('data-shape', 'square');
  });
});

describe('AvatarGroup', () => {
  const people = ['Priya Raman', 'Daniel Okafor', 'Mei Lin', 'Omar Haddad', 'Sofia Duarte'];

  it('shows up to `max` avatars and a labelled "+N" tile', () => {
    render(
      <AvatarGroup aria-label="Members" max={3} size="sm">
        {people.map((name) => (
          <Avatar key={name} name={name} />
        ))}
      </AvatarGroup>,
    );
    const group = screen.getByRole('group', { name: 'Members' });
    const images = within(group).getAllByRole('img');
    expect(images).toHaveLength(4);
    expect(within(group).getByRole('img', { name: '2 more' })).toHaveTextContent('+2');
    // Group size reaches every avatar.
    expect(within(group).getByRole('img', { name: 'Priya Raman' })).toHaveAttribute('data-size', 'sm');
  });

  it('shows everyone without `max`', () => {
    render(
      <AvatarGroup aria-label="Reviewers">
        {people.slice(0, 2).map((name) => (
          <Avatar key={name} name={name} />
        ))}
      </AvatarGroup>,
    );
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });
});
