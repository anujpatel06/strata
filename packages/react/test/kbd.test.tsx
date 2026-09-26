import { render, screen } from '@testing-library/react';
import { Kbd, KbdGroup } from '../src/ui/kbd';

describe('Kbd', () => {
  it('renders a <kbd> element', () => {
    render(<Kbd className="mine">Esc</Kbd>);
    const key = screen.getByText('Esc');
    expect(key.tagName).toBe('KBD');
    expect(key).toHaveClass('kbd', 'mine');
  });

  it('groups keys as nested <kbd> (the HTML idiom for a combination)', () => {
    render(
      <KbdGroup data-testid="combo">
        <Kbd>Ctrl</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>,
    );
    const group = screen.getByTestId('combo');
    expect(group.tagName).toBe('KBD');
    expect(group.querySelectorAll('kbd')).toHaveLength(2);
    expect(group).toHaveTextContent('CtrlK');
  });
});
