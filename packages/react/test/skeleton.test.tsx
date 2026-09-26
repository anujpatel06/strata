import { render } from '@testing-library/react';
import { Skeleton, SkeletonText } from '../src/ui/skeleton';

describe('Skeleton', () => {
  it('is hidden from assistive technology', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies sizes (numbers as px) and the radius token', () => {
    const { container } = render(<Skeleton inlineSize="60%" blockSize={12} radius="pill" className="mine" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.inlineSize).toBe('60%');
    expect(el.style.blockSize).toBe('12px');
    expect(el).toHaveAttribute('data-radius', 'pill');
    expect(el).toHaveClass('skeleton', 'mine');
  });

  it('renders a circle', () => {
    const { container } = render(<Skeleton circle inlineSize={40} />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveAttribute('data-circle', 'true');
    expect(el).toHaveAttribute('data-radius', 'pill');
  });
});

describe('SkeletonText', () => {
  it('renders the requested lines, the last one shorter', () => {
    const { container } = render(<SkeletonText lines={4} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('aria-hidden', 'true');
    const lines = root.querySelectorAll('[data-line]');
    expect(lines).toHaveLength(4);
    expect(lines[3]).toHaveAttribute('data-last');
    expect(lines[0]).not.toHaveAttribute('data-last');
  });

  it('renders a single full line', () => {
    const { container } = render(<SkeletonText lines={1} />);
    const lines = container.querySelectorAll('[data-line]');
    expect(lines).toHaveLength(1);
    expect(lines[0]).not.toHaveAttribute('data-last');
  });
});
