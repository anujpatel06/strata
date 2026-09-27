import { Button as StrataButton, Card } from '@strata/react';
import * as Strata from '@strata/react';
import { Button as Direct } from '@strata/react/ui/button';

export const a = <StrataButton tone="danger">Delete</StrataButton>;
export const b = <Strata.Button tone="danger">Delete</Strata.Button>;
export const c = <Direct tone="danger">Delete</Direct>;
export const d = <Card variant="danger">Not a button</Card>;
