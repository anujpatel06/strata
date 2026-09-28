import { Button, Link } from '@syntara/react';
import { IconX } from '@syntara/icons';
import * as Icons from '@syntara/icons';
import { Button as Other } from 'some-library';

export function Fires() {
  return (
    <div>
      <Button size="icon"><IconX /></Button> {/* expect: missing-accessible-name */}
      <Button size="icon" aria-label=""><IconX /></Button> {/* expect: missing-accessible-name */}
      <Button><Icons.IconX /></Button> {/* expect: missing-accessible-name */}
      <Link href="/x"><svg viewBox="0 0 16 16"><path d="M0 0" /></svg></Link> {/* expect: missing-accessible-name */}
      <img src="/a.png" /> {/* expect: missing-accessible-name */}
    </div>
  );
}

export function Passes({ label, props, children }: { label: string; props: object; children: React.ReactNode }) {
  return (
    <div>
      <Button size="icon" aria-label="Close"><IconX /></Button>
      <Button size="icon" aria-labelledby="close-label"><IconX /></Button>
      <Button size="icon" aria-label={label}><IconX /></Button>
      <Button size="icon" {...props}><IconX /></Button>
      <Button size="icon">{children}</Button>
      <Button size="icon"><IconX /><span className="sr-only">Close</span></Button>
      <Button><IconX /> Close</Button>
      <Link href="/x"><svg viewBox="0 0 16 16" aria-label="Home"><path d="M0 0" /></svg></Link>
      <Link href="/x"><svg viewBox="0 0 16 16"><title>Home</title><path d="M0 0" /></svg></Link>
      <Link href="/x" aria-label="Home"><IconX /></Link>
      <Other size="icon"><IconX /></Other>
      <img src="/a.png" alt="A chart of monthly spend" />
      <img src="/a.png" alt="" />
      <img src="/a.png" aria-hidden="true" />
      <img {...props} />
      <svg viewBox="0 0 16 16"><path d="M0 0" /></svg>
    </div>
  );
}
