import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { FileUpload, type FileUploadEntry } from '../src/ui/file-upload';

const file = (name: string, bytes: number, type: string) => new File([new Uint8Array(bytes)], name, { type });
const fileInput = (container: HTMLElement) => container.querySelector('input[type="file"]') as HTMLInputElement;
const choose = (container: HTMLElement, files: File[]) => fireEvent.change(fileInput(container), { target: { files } });

describe('FileUpload', () => {
  it('renders the label, a browse button and the hint from accepted types and max size', () => {
    const { container } = render(
      <FileUpload label="Receipts" acceptedFileTypes={['image/png', 'application/pdf']} maxSize={10 * 1024 * 1024} allowsMultiple />,
    );
    expect(screen.getByText('Receipts')).toBeInTheDocument();
    const browse = screen.getByRole('button', { name: 'browse' });
    expect(browse).toHaveAccessibleDescription('PNG, PDF, up to 10 MB');
    const input = fileInput(container);
    expect(input).toHaveAttribute('accept', 'image/png,application/pdf');
    expect(input).toHaveAttribute('multiple');
    // The drop zone's focusable (for paste and keyboard drag and drop) is named by the field label.
    expect(screen.getByRole('button', { name: /Receipts/ })).toBeInTheDocument();
  });

  it('lists chosen files with a formatted size and calls onChange', () => {
    const onChange = vi.fn();
    const { container } = render(<FileUpload label="Receipts" allowsMultiple onChange={onChange} />);
    const a = file('march.pdf', 2.5 * 1024 * 1024, 'application/pdf');
    const b = file('taxi.png', 800 * 1024, 'image/png');
    choose(container, [a, b]);
    expect(onChange).toHaveBeenLastCalledWith([a, b]);
    const list = screen.getByRole('list', { name: 'Receipts' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('march.pdf');
    expect(items[0]).toHaveTextContent('2.5 MB');
    expect(items[1]).toHaveTextContent('800 kB');
  });

  it('staggers row entrances within each batch, not across the whole list', () => {
    const { container } = render(<FileUpload label="Receipts" allowsMultiple />);
    choose(container, [file('a.pdf', 10, 'application/pdf'), file('b.pdf', 10, 'application/pdf')]);
    choose(container, [file('c.pdf', 10, 'application/pdf')]);
    const rows = within(screen.getByRole('list', { name: 'Receipts' })).getAllByRole('listitem');
    expect(rows.map((r) => r.style.getPropertyValue('--row-stagger'))).toEqual(['0', '1', '0']);
  });

  it('removes a file with its remove button', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<FileUpload label="Receipts" allowsMultiple onChange={onChange} />);
    const a = file('march.pdf', 1000, 'application/pdf');
    const b = file('april.pdf', 1000, 'application/pdf');
    choose(container, [a, b]);
    await user.click(screen.getByRole('button', { name: 'Remove march.pdf' }));
    expect(onChange).toHaveBeenLastCalledWith([b]);
    expect(screen.queryByText('march.pdf')).not.toBeInTheDocument();
  });

  it('rejects files that are too large or the wrong type, with a message', () => {
    const onChange = vi.fn();
    const onReject = vi.fn();
    const { container } = render(
      <FileUpload label="Photos" acceptedFileTypes={['image/*']} maxSize={1024} allowsMultiple onChange={onChange} onReject={onReject} />,
    );
    const ok = file('small.png', 512, 'image/png');
    const big = file('huge.png', 4096, 'image/png');
    const doc = file('notes.txt', 10, 'text/plain');
    choose(container, [ok, big, doc]);
    expect(onChange).toHaveBeenLastCalledWith([ok]);
    expect(onReject).toHaveBeenCalledWith([
      expect.objectContaining({ file: big, reason: 'size' }),
      expect.objectContaining({ file: doc, reason: 'type' }),
    ]);
    const alerts = screen.getAllByRole('alert');
    expect(alerts.map((a) => a.textContent)).toEqual(['Larger than 1 kB.', "This file type isn't accepted."]);
  });

  it('accepts dropped files', async () => {
    const onChange = vi.fn();
    const { container } = render(<FileUpload label="Photos" acceptedFileTypes={['image/*']} allowsMultiple onChange={onChange} />);
    const photo = file('beach.jpg', 2048, 'image/jpeg');
    // The drop zone root wraps RAC's visually hidden drop button (named by the field label).
    const zone = screen.getByRole('button', { name: /Photos/ }).parentElement!.parentElement!;
    expect(container).toContainElement(zone);
    // jsdom has no DataTransfer; RAC reads items/types, and treats items without webkitGetAsEntry as files.
    const dataTransfer = { types: ['Files'], items: [{ kind: 'file', type: photo.type, getAsFile: () => photo }], dropEffect: 'copy', effectAllowed: 'all' };
    fireEvent.drop(zone, { dataTransfer });
    await screen.findByText('beach.jpg');
    expect(onChange).toHaveBeenLastCalledWith([photo]);
  });

  it('replaces the file when allowsMultiple is off', () => {
    const onChange = vi.fn();
    const { container } = render(<FileUpload label="Photo" onChange={onChange} />);
    const a = file('a.png', 10, 'image/png');
    const b = file('b.png', 10, 'image/png');
    choose(container, [a]);
    choose(container, [b]);
    expect(onChange).toHaveBeenLastCalledWith([b]);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('shows progress and per-file errors from controlled entries', () => {
    function Controlled() {
      const [entries] = useState<FileUploadEntry[]>([
        { file: file('done.pdf', 10, 'application/pdf'), progress: 100 },
        { file: file('half.pdf', 10, 'application/pdf'), progress: 40 },
        { file: file('bad.pdf', 10, 'application/pdf'), error: 'Upload failed.' },
      ]);
      return <FileUpload label="Documents" files={entries} />;
    }
    render(<Controlled />);
    const bar = screen.getByRole('progressbar', { name: 'Uploading half.pdf' });
    expect(bar).toHaveAttribute('aria-valuenow', '40');
    // The fill reads its level from --progress (0–1): width with reduced motion, a translate glide otherwise.
    expect((bar.querySelector('[style*="--progress"]') as HTMLElement).style.getPropertyValue('--progress')).toBe('0.4');
    expect(screen.getByText('Uploaded')).toBeInTheDocument();
    expect(screen.getByText('Upload failed.')).toBeInTheDocument();
  });

  it('shows a field error when invalid', () => {
    render(<FileUpload label="ID" isInvalid errorMessage="Upload a document to continue." />);
    expect(screen.getByText('Upload a document to continue.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'browse' })).toHaveAccessibleDescription(/Upload a document to continue\./);
  });

  it('is disabled', () => {
    render(<FileUpload label="Contract" isDisabled />);
    expect(screen.getByRole('button', { name: 'browse' })).toBeDisabled();
  });

  it('passes className to the root', () => {
    const { container } = render(<FileUpload label="Files" className="custom" />);
    expect(container.firstElementChild).toHaveClass('custom');
  });
});
