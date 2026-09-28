/**
 * `Key` is exported from @syntara/react (a type-only re-export of React Aria's Key, in src/ui/toggle-group.tsx).
 * The agent eval's most common type error was typing selection state with React's Key (which allows bigint) or not
 * finding a Key to import. These handlers are written the way a consumer writes them; `pnpm typecheck` compiles this
 * file, so a wrong type fails the build, and the tests run the handlers.
 *
 * '../src/index' is the module '@syntara/react' resolves to (package.json exports "." → src/index.ts; published,
 * dist/types/index.d.ts is generated from it), so importing from it is importing from '@syntara/react'.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type Key as ReactKey } from 'react';
import {
  Select,
  SelectItem,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  type Key,
} from '../src/index';

// React Aria's SelectionIndicator (a SharedElement) calls element.getAnimations(), which jsdom doesn't implement.
beforeAll(() => {
  if (!('getAnimations' in Element.prototype)) {
    Object.defineProperty(Element.prototype, 'getAnimations', { value: () => [], configurable: true });
  }
});

describe('Key from @syntara/react', () => {
  it('is React Aria’s string | number, not React’s Key', () => {
    expectTypeOf<Key>().toEqualTypeOf<string | number>();
    const fromReact: ReactKey = 1n;
    // @ts-expect-error React's Key allows bigint, which a selection key can't be.
    const asKey: Key = fromReact;
    expect(asKey).toBe(1n);
  });

  it('types Select state: selectedKey + onSelectionChange (Key | null)', async () => {
    const seen: Array<Key | null> = [];
    function Plan() {
      const [plan, setPlan] = useState<Key | null>('basic');
      seen.push(plan);
      return (
        <Select label="Plan" selectedKey={plan} onSelectionChange={setPlan}>
          <SelectItem id="basic">Basic</SelectItem>
          <SelectItem id="pro">Pro</SelectItem>
        </Select>
      );
    }
    const user = userEvent.setup();
    render(<Plan />);
    await user.click(screen.getByRole('button', { name: /Plan/ }));
    await user.click(screen.getByRole('option', { name: 'Pro' }));
    expect(seen.at(-1)).toBe('pro');
  });

  it('types Tabs state: selectedKey + onSelectionChange (Key)', async () => {
    function Sections() {
      const [tab, setTab] = useState<Key>('overview');
      return (
        <Tabs selectedKey={tab} onSelectionChange={setTab}>
          <TabList aria-label="Sections">
            <Tab id="overview">Overview</Tab>
            <Tab id="activity">Activity</Tab>
          </TabList>
          <TabPanel id="overview">Summary</TabPanel>
          <TabPanel id="activity">Recent activity</TabPanel>
        </Tabs>
      );
    }
    const user = userEvent.setup();
    render(<Sections />);
    await user.click(screen.getByRole('tab', { name: 'Activity' }));
    expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Recent activity');
  });

  it('types ToggleButtonGroup state: selectedKeys + onSelectionChange (Set<Key>)', async () => {
    let last = new Set<Key>();
    function Period() {
      const [period, setPeriod] = useState<Set<Key>>(new Set(['month']));
      last = period;
      return (
        <ToggleButtonGroup aria-label="Period" selectedKeys={period} onSelectionChange={setPeriod} disallowEmptySelection>
          <ToggleButton id="week">Week</ToggleButton>
          <ToggleButton id="month">Month</ToggleButton>
        </ToggleButtonGroup>
      );
    }
    const user = userEvent.setup();
    render(<Period />);
    await user.click(screen.getByRole('radio', { name: 'Week' }));
    expect([...last]).toEqual(['week']);
  });
});
