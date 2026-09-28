import { render, screen } from '@testing-library/react';
import { SyntaraScreen, type Issue } from '../src/react';

// Amount throws while drawing, standing in for any component bug or bad runtime data.
vi.mock('@syntara/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@syntara/react')>()),
  Amount: () => {
    throw new Error('boom');
  },
}));

const doc = (root: unknown) => ({ schemaVersion: '1.0.0', screen: { id: 't', title: 'T' }, root });

describe('a node that throws while drawing', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {}); // React logs caught errors
  });
  afterEach(() => vi.restoreAllMocks());

  it('is replaced by its fallback, and the rest of the screen still draws', () => {
    const issues: Issue[] = [];
    render(
      <SyntaraScreen
        document={doc({
          type: 'Stack',
          children: [
            { type: 'Amount', props: { value: 1840, currency: 'INR' }, fallback: { type: 'Text', children: '₹1,840' } },
            { type: 'Text', children: 'Cashback this year' },
          ],
        })}
        onIssue={(i) => issues.push(i)}
      />,
    );
    expect(screen.getByText('₹1,840')).toBeInTheDocument();
    expect(screen.getByText('Cashback this year')).toBeInTheDocument();
    expect(issues).toContainEqual(expect.objectContaining({ code: 'render-error', nodeType: 'Amount', path: '/root/children/0' }));
  });

  it('draws nothing without a fallback, and never throws to the host', () => {
    const issues: Issue[] = [];
    expect(() =>
      render(
        <SyntaraScreen
          document={doc({ type: 'Stack', children: [{ type: 'Amount', props: { value: 1, currency: 'INR' } }, { type: 'Text', children: 'After' }] })}
          onIssue={(i) => issues.push(i)}
        />,
      ),
    ).not.toThrow();
    expect(screen.getByText('After')).toBeInTheDocument();
    expect(issues.map((i) => i.code)).toEqual(['render-error']);
  });

  it('tries again when a new document arrives', () => {
    const { rerender } = render(<SyntaraScreen document={doc({ type: 'Amount', props: { value: 1, currency: 'INR' } })} />);
    rerender(<SyntaraScreen document={doc({ type: 'Text', children: 'Recovered' })} />);
    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });
});
