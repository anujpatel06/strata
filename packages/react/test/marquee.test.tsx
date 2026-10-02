import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Marquee } from '../src/ui/marquee';

function Example(props: { reverse?: boolean; speed?: 'slow' | 'md' | 'fast' }) {
  return (
    <Marquee label="Customers" {...props}>
      <span>Northwind</span>
      <span>Fernhill</span>
      <span>Brightline</span>
    </Marquee>
  );
}

describe('Marquee', () => {
  it('is a labelled region with one readable list of the items', () => {
    render(<Example />);
    const region = screen.getByRole('region', { name: 'Customers' });
    const list = within(region).getByRole('list');
    expect(within(list).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Northwind', 'Fernhill', 'Brightline']);
    // The loop's copies exist but are hidden from assistive tech and from the Tab key.
    expect(screen.getAllByText('Northwind').length).toBeGreaterThan(1);
    const copies = region.querySelectorAll('div[aria-hidden="true"]');
    expect(copies.length).toBeGreaterThan(0);
    for (const copy of copies) expect(copy).toHaveAttribute('inert');
  });

  it('has a pause toggle that stops the strip (WCAG 2.2.2)', async () => {
    const user = userEvent.setup();
    render(<Example />);
    const region = screen.getByRole('region', { name: 'Customers' });
    const toggle = screen.getByRole('button', { name: 'Pause' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(region).not.toHaveAttribute('data-paused');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(region).toHaveAttribute('data-paused');
    await user.click(toggle);
    expect(region).not.toHaveAttribute('data-paused');
  });

  it('marks reverse travel and keeps the pause name fixed', () => {
    render(
      <Marquee label="Quotes" reverse pauseLabel="Pause quotes">
        <span>One</span>
      </Marquee>,
    );
    expect(screen.getByRole('region', { name: 'Quotes' })).toHaveAttribute('data-reverse');
    expect(screen.getByRole('button', { name: 'Pause quotes' })).toBeInTheDocument();
  });

  it('times the loop from its width, so pace is the same for any length', () => {
    // jsdom has no layout: give the strip 600px and one group of items 250px, and a ResizeObserver that measures once.
    const rect = (width: number) => ({ width, height: 40, top: 0, left: 0, right: width, bottom: 40, x: 0, y: 0, toJSON() {} });
    const original = Element.prototype.getBoundingClientRect;
    const RO = globalThis.ResizeObserver;
    Element.prototype.getBoundingClientRect = function (this: Element) {
      return rect(this.getAttribute('role') === 'list' ? 250 : 600) as DOMRect;
    };
    globalThis.ResizeObserver = class {
      observe() {}
      disconnect() {}
      unobserve() {}
    } as unknown as typeof ResizeObserver;
    try {
      render(<Example speed="md" />);
      const region = screen.getByRole('region', { name: 'Customers' });
      // ceil(600 / 250) = 3 repeats per half; 3 × 250px at 40px/s = 18.75s.
      expect(region).toHaveAttribute('data-ready');
      expect(region.style.getPropertyValue('--marquee-duration')).toBe('18.75s');
    } finally {
      Element.prototype.getBoundingClientRect = original;
      globalThis.ResizeObserver = RO;
    }
  });
});
