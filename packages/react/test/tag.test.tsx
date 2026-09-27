import { render, screen } from '@testing-library/react';
import { Tag } from '../src/ui/tag';

describe('Tag', () => {
  it('renders its label with default tone, variant and size', () => {
    render(<Tag data-testid="t">Home collection</Tag>);
    const tag = screen.getByTestId('t');
    expect(tag).toHaveTextContent(/^Home collection$/);
    expect(tag).toHaveAttribute('data-tone', 'neutral');
    expect(tag).toHaveAttribute('data-variant', 'soft');
    expect(tag).toHaveAttribute('data-size', 'md');
    expect(tag).not.toHaveAttribute('data-uppercase');
  });

  it('reflects tone, variant, size and uppercase', () => {
    render(
      <Tag data-testid="t" tone="success" variant="dashed" size="sm" uppercase>
        Cashless
      </Tag>,
    );
    const tag = screen.getByTestId('t');
    expect(tag).toHaveAttribute('data-tone', 'success');
    expect(tag).toHaveAttribute('data-variant', 'dashed');
    expect(tag).toHaveAttribute('data-size', 'sm');
    expect(tag).toHaveAttribute('data-uppercase', 'true');
    // Uppercase is visual only: the DOM text (what screen readers read) keeps its case.
    expect(tag).toHaveTextContent(/^Cashless$/);
  });

  it('is static: no role, not focusable', () => {
    render(<Tag data-testid="t">Diagnostics</Tag>);
    const tag = screen.getByTestId('t');
    expect(tag).not.toHaveAttribute('role');
    expect(tag).not.toHaveAttribute('tabindex');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('hides the leading slot from assistive tech', () => {
    render(
      <Tag data-testid="t" leading={<svg data-testid="icon" />}>
        Prescription required
      </Tag>,
    );
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('t')).toHaveTextContent(/^Prescription required$/);
  });

  it('passes className and DOM props through', () => {
    render(
      <Tag data-testid="t" className="mine" title="Covered in network">
        Covered
      </Tag>,
    );
    const tag = screen.getByTestId('t');
    expect(tag).toHaveClass('tag', 'mine');
    expect(tag).toHaveAttribute('title', 'Covered in network');
  });
});
