import { render, screen } from '@testing-library/react';
import { IconTile } from '../src/ui/icon-tile';
import { getAvatarTint } from '../src/ui/avatar';

describe('IconTile', () => {
  it('is decorative by default (hidden from assistive tech) with brand tint and md size', () => {
    const { container } = render(<IconTile><svg /></IconTile>);
    const tile = container.firstElementChild!;
    expect(tile).toHaveAttribute('aria-hidden', 'true');
    expect(tile).not.toHaveAttribute('role');
    expect(tile).toHaveAttribute('data-tint', 'brand');
    expect(tile).toHaveAttribute('data-size', 'md');
  });

  it('becomes a named image with aria-label or alt', () => {
    render(
      <>
        <IconTile aria-label="Savings"><svg /></IconTile>
        <IconTile alt="Wallet"><svg /></IconTile>
      </>,
    );
    expect(screen.getByRole('img', { name: 'Savings' })).not.toHaveAttribute('aria-hidden');
    expect(screen.getByRole('img', { name: 'Wallet' })).toBeInTheDocument();
  });

  it('renders an image with alt text and a neutral face by default', () => {
    const { container } = render(<IconTile src="/logo.svg" alt="Corner Grocer" />);
    const img = screen.getByRole('img', { name: 'Corner Grocer' });
    expect(img.tagName).toBe('IMG');
    expect(container.firstElementChild).toHaveAttribute('data-tint', 'none');
    expect(container.firstElementChild).not.toHaveAttribute('aria-hidden');
  });

  it('an image without alt is decorative', () => {
    const { container } = render(<IconTile src="/logo.svg" />);
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('tint="auto" is stable per name and matches Avatar; solid and size pass through', () => {
    const { container } = render(
      <>
        <IconTile tint="auto" name="Travel card"><svg /></IconTile>
        <IconTile tint="solid" size="lg" className="mine"><svg /></IconTile>
      </>,
    );
    const [auto, solid] = Array.from(container.children);
    expect(auto).toHaveAttribute('data-tint', getAvatarTint('Travel card'));
    expect(solid).toHaveAttribute('data-tint', 'solid');
    expect(solid).toHaveAttribute('data-size', 'lg');
    expect(solid).toHaveClass('tile', 'mine');
  });
});
