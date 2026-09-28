import { Button as SyntaraButton, Card } from '@syntara/react';
import * as Syntara from '@syntara/react';
import { Button as Direct } from '@syntara/react/ui/button';

export const a = <SyntaraButton variant="danger">Delete</SyntaraButton>;
export const b = <Syntara.Button variant="danger">Delete</Syntara.Button>;
export const c = <Direct variant="danger">Delete</Direct>;
export const d = <Card variant="danger">Not a button</Card>;
