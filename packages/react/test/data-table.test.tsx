import { act, render, renderHook, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import {
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  useSortedRows,
  type DataTableColumn,
  type DataTableProps,
  type DataTableSelection,
  type DataTableSortDescriptor,
} from '../src/ui/data-table';

type Payment = { id: string; payee: string; amount: number };

const rows: Payment[] = [
  { id: 'PAY-3', payee: 'Corner Grocery', amount: 42.5 },
  { id: 'PAY-1', payee: 'City Pharmacy', amount: 120 },
  { id: 'PAY-2', payee: 'Metro Transit', amount: 8.25 },
];

const columns: DataTableColumn<Payment>[] = [
  { id: 'id', header: 'Reference', isRowHeader: true, cell: (r) => r.id },
  { id: 'payee', header: 'Payee', allowsSorting: true, cell: (r) => r.payee },
  { id: 'amount', header: 'Amount', align: 'end', allowsSorting: true, cell: (r) => r.amount.toFixed(2) },
];

const accessors = { payee: (r: Payment) => r.payee, amount: (r: Payment) => r.amount };

function Sortable() {
  const [sort, setSort] = useState<DataTableSortDescriptor | undefined>();
  const sorted = useSortedRows(rows, sort, accessors);
  return <DataTable aria-label="Payments" columns={columns} rows={sorted} getRowId={(r) => r.id} sortDescriptor={sort} onSortChange={setSort} />;
}

function Table(props: Partial<DataTableProps<Payment>>) {
  return <DataTable aria-label="Payments" columns={columns} rows={rows} getRowId={(r) => r.id} {...(props as object)} />;
}

const bodyRows = () => screen.getAllByRole('row').slice(1);
const firstCells = () => bodyRows().map((r) => within(r).getAllByRole('rowheader')[0]?.textContent);

describe('DataTable', () => {
  it('renders a named grid with a header row and one row per item', () => {
    render(<Table />);
    const grid = screen.getByRole('grid', { name: 'Payments' });
    expect(within(grid).getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['Reference', 'Payee', 'Amount']);
    expect(bodyRows()).toHaveLength(3);
    expect(firstCells()).toEqual(['PAY-3', 'PAY-1', 'PAY-2']);
    expect(within(bodyRows()[1]!).getByRole('gridcell', { name: '120.00' })).toHaveClass('alignEnd');
  });

  it('sorts from the keyboard on a column header', async () => {
    const user = userEvent.setup();
    render(<Sortable />);
    const payee = screen.getByRole('columnheader', { name: /Payee/ });
    expect(payee).not.toHaveAttribute('aria-sort', 'ascending');

    // Focus the grid, move up to the header row, across to "Payee", and press Enter.
    await user.tab();
    await user.keyboard('{ArrowUp}{ArrowRight}');
    expect(payee).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(payee).toHaveAttribute('aria-sort', 'ascending');
    expect(bodyRows().map((r) => within(r).getAllByRole('gridcell')[0]?.textContent)).toEqual([
      'City Pharmacy',
      'Corner Grocery',
      'Metro Transit',
    ]);

    await user.keyboard('{Enter}');
    expect(payee).toHaveAttribute('aria-sort', 'descending');
    expect(firstCells()).toEqual(['PAY-2', 'PAY-3', 'PAY-1']);
  });

  it('sorts numbers by value when the header is clicked', async () => {
    const user = userEvent.setup();
    render(<Sortable />);
    await user.click(screen.getByRole('columnheader', { name: /Amount/ }));
    expect(firstCells()).toEqual(['PAY-2', 'PAY-3', 'PAY-1']);
  });

  it('toggles row selection with the checkbox and select-all', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    function Selectable() {
      const [selected, setSelected] = useState<DataTableSelection>(new Set());
      return (
        <Table
          selectionMode="multiple"
          selectedKeys={selected}
          onSelectionChange={(keys) => {
            setSelected(keys);
            onSelectionChange(keys);
          }}
        />
      );
    }
    render(<Selectable />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(4);
    expect(checkboxes[0]).toHaveAccessibleName('Select All');

    await user.click(checkboxes[2]!);
    expect([...(onSelectionChange.mock.lastCall?.[0] as Set<string>)]).toEqual(['PAY-1']);
    expect(bodyRows()[1]).toHaveAttribute('aria-selected', 'true');
    expect((checkboxes[0] as HTMLInputElement).indeterminate).toBe(true);

    await user.keyboard(' ');
    expect(bodyRows()[1]).toHaveAttribute('aria-selected', 'false');

    await user.click(checkboxes[0]!);
    expect(onSelectionChange).toHaveBeenLastCalledWith('all');
    for (const row of bodyRows()) expect(row).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onRowAction with the row id', async () => {
    const user = userEvent.setup();
    const onRowAction = vi.fn();
    render(<Table onRowAction={onRowAction} />);
    await user.click(screen.getByText('Metro Transit'));
    expect(onRowAction).toHaveBeenCalledWith('PAY-2');
  });

  it('shows the empty state when there are no rows', () => {
    const { rerender } = render(<Table rows={[]} />);
    expect(screen.getByText('No results.')).toBeInTheDocument();
    rerender(<Table rows={[]} emptyState={<p>No payments yet</p>} />);
    expect(screen.getByText('No payments yet')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2);
  });

  it('marks the grid busy and renders skeleton rows while loading', () => {
    const { rerender } = render(<Table isLoading loadingRowCount={4} selectionMode="multiple" />);
    const grid = screen.getByRole('grid', { name: 'Payments' });
    expect(grid).toHaveAttribute('aria-busy', 'true');
    expect(bodyRows()).toHaveLength(4);
    expect(screen.queryByText('City Pharmacy')).not.toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')[0]).toBeDisabled();

    // Column headers stay; each skeleton row has a non-empty row header.
    expect(within(grid).getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['', 'Reference', 'Payee', 'Amount']);
    for (const row of bodyRows()) expect(within(row).getByRole('rowheader')).toHaveTextContent('Loading');

    rerender(<Table selectionMode="multiple" />);
    expect(grid).not.toHaveAttribute('aria-busy');
    expect(screen.getByText('City Pharmacy')).toBeInTheDocument();
  });

  it('uses the first data column as row header when none is marked, even with selection', () => {
    render(<Table selectionMode="multiple" columns={columns.map((c) => ({ ...c, isRowHeader: false }))} />);
    const header = within(bodyRows()[0]!).getByRole('rowheader');
    expect(header).toHaveTextContent('PAY-3');
    expect(within(header).queryByRole('checkbox')).toBeNull();
  });

  it('applies density, sticky header and className to the scroll container', () => {
    render(<Table density="compact" maxBlockSize={320} className="custom" />);
    const root = screen.getByRole('grid').parentElement!;
    expect(root).toHaveClass('root', 'sticky', 'custom');
    expect(root).toHaveAttribute('data-density', 'compact');
    expect(root.style.maxBlockSize).toBe('320px');
  });
});

describe('useSortedRows', () => {
  type Item = { name: string; n: number | null; d: Date };
  const items: Item[] = [
    { name: 'Item 10', n: 3, d: new Date(2026, 0, 3) },
    { name: 'item 2', n: null, d: new Date(2026, 0, 1) },
    { name: 'Item 1', n: 1, d: new Date(2026, 0, 2) },
  ];
  const acc = { name: (r: Item) => r.name, n: (r: Item) => r.n, d: (r: Item) => r.d };

  it('returns rows unchanged without a descriptor', () => {
    const { result } = renderHook(() => useSortedRows(items, undefined, acc));
    expect(result.current).toEqual(items);
  });

  it('sorts strings with numeric, case-insensitive collation', () => {
    const { result } = renderHook(() => useSortedRows(items, { column: 'name', direction: 'ascending' }, acc));
    expect(result.current.map((r) => r.name)).toEqual(['Item 1', 'item 2', 'Item 10']);
  });

  it('sorts dates and keeps empty values last in both directions', () => {
    const { result: dates } = renderHook(() => useSortedRows(items, { column: 'd', direction: 'descending' }, acc));
    expect(dates.current.map((r) => r.name)).toEqual(['Item 10', 'Item 1', 'item 2']);
    const { result: asc } = renderHook(() => useSortedRows(items, { column: 'n', direction: 'ascending' }, acc));
    expect(asc.current.map((r) => r.n)).toEqual([1, 3, null]);
    const { result: desc } = renderHook(() => useSortedRows(items, { column: 'n', direction: 'descending' }, acc));
    expect(desc.current.map((r) => r.n)).toEqual([3, 1, null]);
  });
});

describe('DataTablePagination', () => {
  it('shows the visible range and changes page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const { rerender } = render(<DataTablePagination page={1} pageSize={10} totalCount={48} onPageChange={onPageChange} />);
    expect(screen.getByText(/Showing/)).toHaveTextContent('Showing 1–10 of 48');
    expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenCalledWith(2);

    rerender(<DataTablePagination page={5} pageSize={10} totalCount={48} onPageChange={onPageChange} />);
    expect(screen.getByText(/Showing/)).toHaveTextContent('Showing 41–48 of 48');
    rerender(<DataTablePagination page={1} pageSize={10} totalCount={0} onPageChange={onPageChange} />);
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('is a labelled group, not a landmark, unless asked', () => {
    const { rerender } = render(<DataTablePagination label="Payments pages" page={1} pageSize={10} totalCount={48} />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Payments pages' })).toBeInTheDocument();
    rerender(<DataTablePagination landmark label="Payments pages" page={1} pageSize={10} totalCount={48} />);
    expect(screen.getByRole('navigation', { name: 'Payments pages' })).toBeInTheDocument();
  });
});

describe('DataTableToolbar', () => {
  it('renders its children and className', () => {
    render(
      <DataTableToolbar className="custom" data-testid="toolbar">
        <button type="button">Export</button>
      </DataTableToolbar>,
    );
    act(() => undefined);
    expect(screen.getByTestId('toolbar')).toHaveClass('toolbar', 'custom');
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });
});
