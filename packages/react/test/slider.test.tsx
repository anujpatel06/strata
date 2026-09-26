import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from 'react-aria-components';
import { Slider } from '../src/ui/slider';

describe('Slider', () => {
  it('renders a labelled slider with a formatted output', () => {
    render(<Slider label="Opacity" defaultValue={0.4} minValue={0} maxValue={1} step={0.01} formatOptions={{ style: 'percent' }} />);
    const slider = screen.getByRole('slider', { name: 'Opacity' });
    expect(slider).toHaveValue('0.4');
    expect(slider).toHaveAttribute('aria-valuetext', '40%');
    expect(screen.getByRole('group', { name: 'Opacity' }).querySelector('output')).toHaveTextContent('40%');
  });

  it('steps with arrow keys and jumps with Home/End', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Slider label="Volume" defaultValue={50} onChange={onChange} />);
    await user.tab();
    const slider = screen.getByRole('slider', { name: 'Volume' });
    expect(slider).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(slider).toHaveValue('51');
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(slider).toHaveValue('49');
    await user.keyboard('{End}');
    expect(slider).toHaveValue('100');
    await user.keyboard('{Home}');
    expect(slider).toHaveValue('0');
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it('supports a range with two named thumbs and a formatted range output', async () => {
    const user = userEvent.setup();
    render(
      <Slider
        label="Amount"
        defaultValue={[2000, 8000]}
        minValue={0}
        maxValue={10000}
        step={500}
        thumbLabels={['Minimum', 'Maximum']}
        formatOptions={{ style: 'currency', currency: 'INR', maximumFractionDigits: 0 }}
      />,
    );
    const [min, max] = screen.getAllByRole('slider');
    expect(min).toHaveAccessibleName('Minimum Amount');
    expect(max).toHaveAccessibleName('Maximum Amount');
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(min).toHaveValue('2500');
    await user.tab();
    await user.keyboard('{ArrowLeft}');
    expect(max).toHaveValue('7500');
    expect(screen.getByRole('group').querySelector('output')?.textContent).toMatch(/2,500.*7,500/);
  });

  it('follows the locale direction (thumb from the right in RTL)', () => {
    const { container } = render(
      <I18nProvider locale="ar-AE">
        <Slider label="Volume" defaultValue={25} />
      </I18nProvider>,
    );
    const thumb = container.querySelector<HTMLElement>('.thumb');
    // React Aria inverts the position for RTL locales; the fill's rail gets dir="rtl" so both agree.
    expect(thumb?.style.left).toBe('75%');
    expect(container.querySelector('.rail')).toHaveAttribute('dir', 'rtl');
  });

  it('reflects disabled state and passes className through', () => {
    const { container } = render(<Slider label="Locked" defaultValue={10} isDisabled className="extra" />);
    expect(screen.getByRole('slider', { name: 'Locked' })).toBeDisabled();
    // Label and output sit under an aria-disabled wrapper so contrast checkers treat them as disabled text.
    expect(container.querySelector('output')?.closest('[aria-disabled="true"]')).not.toBeNull();
    expect(screen.getByRole('group', { name: 'Locked' })).toHaveClass('slider', 'extra');
  });
});
