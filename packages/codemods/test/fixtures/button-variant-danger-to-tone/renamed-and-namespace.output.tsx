import { Button as SyntaraButton, Card } from '@syntara/react';
import * as Syntara from '@syntara/react';
import { Button as Direct } from '@syntara/react/ui/button';

export const a = <SyntaraButton tone="danger">Delete</SyntaraButton>;
export const b = <Syntara.Button tone="danger">Delete</Syntara.Button>;
export const c = <Direct tone="danger">Delete</Direct>;
export const d = <Card variant="danger">Not a button</Card>;
