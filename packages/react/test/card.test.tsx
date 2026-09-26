import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../src/ui/card';

describe('Card', () => {
  it('composes header, content and footer with an h3 title by default', () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Family plan</CardTitle>
          <CardDescription>Renews in April</CardDescription>
          <CardAction>
            <button type="button">Manage</button>
          </CardAction>
        </CardHeader>
        <CardContent>Four members</CardContent>
        <CardFooter divider>
          <button type="button">Download</button>
        </CardFooter>
      </Card>,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Family plan' })).toBeInTheDocument();
    expect(screen.getByText('Renews in April').tagName).toBe('P');
    expect(screen.getByRole('button', { name: 'Manage' }).parentElement).toHaveClass('action');
    expect(screen.getByText('Four members')).toHaveClass('content');
    expect(screen.getByRole('button', { name: 'Download' }).parentElement).toHaveAttribute('data-divider', 'true');
    expect(screen.getByTestId('card')).toHaveAttribute('data-variant', 'default');
  });

  it('takes a heading level for the title', () => {
    render(<CardTitle level={2}>Summary</CardTitle>);
    expect(screen.getByRole('heading', { level: 2, name: 'Summary' })).toBeInTheDocument();
  });

  it('reflects the variant, passes className and forwards refs', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Card ref={ref} variant="ghost" className="mine" aria-label="Plan" role="region" />);
    const card = screen.getByRole('region', { name: 'Plan' });
    expect(card).toBe(ref.current);
    expect(card).toHaveAttribute('data-variant', 'ghost');
    expect(card).toHaveClass('card', 'mine');
  });
});
