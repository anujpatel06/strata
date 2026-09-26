import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from 'react-aria-components';
import { Tab, TabList, TabPanel, Tabs, type TabsProps } from '../src/ui/tabs';

// jsdom has no Web Animations API; RAC's SelectionIndicator reads it when the selection moves.
beforeAll(() => {
  if (!('getAnimations' in Element.prototype)) {
    Object.defineProperty(Element.prototype, 'getAnimations', { value: () => [], configurable: true });
  }
});

function Example(props: Partial<TabsProps>) {
  return (
    <Tabs defaultSelectedKey="overview" {...props}>
      <TabList aria-label="Claim details">
        <Tab id="overview">Overview</Tab>
        <Tab id="documents" count={3}>
          Documents
        </Tab>
        <Tab id="history">History</Tab>
        <Tab id="archived" isDisabled>
          Archived
        </Tab>
      </TabList>
      <TabPanel id="overview">Overview panel</TabPanel>
      <TabPanel id="documents">Documents panel</TabPanel>
      <TabPanel id="history">History panel</TabPanel>
      <TabPanel id="archived">Archived panel</TabPanel>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('renders a named tablist with the selected tab and its panel', () => {
    render(<Example />);
    expect(screen.getByRole('tablist', { name: 'Claim details' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(4);
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Overview panel');
  });

  it('moves between tabs with the arrow keys and skips disabled tabs', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.tab();
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    const documents = screen.getByRole('tab', { name: /Documents/ });
    expect(documents).toHaveFocus();
    expect(documents).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Documents panel');

    await user.keyboard('{ArrowRight}{ArrowRight}');
    // "Archived" is disabled, so focus wraps back to the first tab.
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();

    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'History' })).toHaveAttribute('aria-selected', 'true');
  });

  it('mirrors arrow keys in a right-to-left locale', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider locale="ar-AE">
        <Example />
      </I18nProvider>,
    );
    await user.tab();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: /Documents/ })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
  });

  it('reflects disabled state in ARIA', () => {
    render(<Example />);
    expect(screen.getByRole('tab', { name: 'Archived' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('includes the count in the tab name', () => {
    render(<Example />);
    expect(screen.getByRole('tab', { name: 'Documents 3' })).toBeInTheDocument();
  });

  it('selects on press and calls onSelectionChange', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Example onSelectionChange={onSelectionChange} />);
    await user.click(screen.getByRole('tab', { name: 'History' }));
    expect(onSelectionChange).toHaveBeenCalledWith('history');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('History panel');
  });

  it('hides inactive force-mounted panels', async () => {
    // Vitest doesn't inject CSS Modules into jsdom, so load the panel rules from the real stylesheet.
    // (Node's fs via a runtime specifier: this package's tsconfig has no Node types.)
    const fsModule = 'node:fs';
    const { readFileSync } = (await import(/* @vite-ignore */ fsModule)) as { readFileSync: (path: string, enc: 'utf8') => string };
    const cwd = (globalThis as unknown as { process: { cwd(): string } }).process.cwd();
    const css = readFileSync(`${cwd}/src/ui/tabs.module.css`, 'utf8');
    const rules = css.match(/\.panel\[inert\][^{]*\{[^}]*\}/)?.[0];
    expect(rules).toBeDefined();
    const style = document.createElement('style');
    style.textContent = rules ?? '';
    document.head.append(style);

    const user = userEvent.setup();
    render(
      <Tabs defaultSelectedKey="preview">
        <TabList aria-label="Example">
          <Tab id="preview">Preview</Tab>
          <Tab id="code">Code</Tab>
        </TabList>
        <TabPanel id="preview" shouldForceMount>
          Preview panel
        </TabPanel>
        <TabPanel id="code" shouldForceMount>
          Code panel
        </TabPanel>
      </Tabs>,
    );
    expect(screen.getByText('Preview panel')).toBeVisible();
    expect(screen.getByText('Code panel')).toBeInTheDocument();
    expect(screen.getByText('Code panel')).not.toBeVisible();

    await user.click(screen.getByRole('tab', { name: 'Code' }));
    expect(screen.getByText('Code panel')).toBeVisible();
    expect(screen.getByText('Preview panel')).not.toBeVisible();
    style.remove();
  });

  it('supports vertical orientation', () => {
    render(<Example orientation="vertical" />);
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('passes className through and marks the variant', () => {
    render(<Example variant="pill" className="custom" />);
    expect(screen.getByRole('tablist').parentElement).toHaveClass('tabs', 'custom');
    expect(screen.getByRole('tablist')).toHaveClass('listPill');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveClass('tabPill');
  });
});
