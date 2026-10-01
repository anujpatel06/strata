/**
 * One mini dashboard, rendered the same way for every tenant. Only the data differs: the copy comes from
 * tenants/<id>/content.json and the look from the tenant's tokens (the surrounding ThemeScope).
 * Server component: the numbers are formatted at build time in the tenant's own locale.
 */
import {
  Alert,
  Avatar,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  StatTile,
} from '@syntara/react';
import type { TenantOverview } from './home-data';
import styles from './sections.module.css';

export function TenantCard({ tenant, level = 3 }: { tenant: TenantOverview; level?: 2 | 3 | 4 }) {
  return (
    <Card className={styles.tenantCard}>
      <CardHeader>
        <CardTitle level={level}>{tenant.greeting}</CardTitle>
        <CardDescription>{tenant.subtitle}</CardDescription>
        {tenant.user && (
          <CardAction>
            <Avatar name={tenant.user} />
          </CardAction>
        )}
      </CardHeader>
      <CardContent className={styles.tenantBody}>
        {tenant.alert && <Alert tone={tenant.alert.tone} title={tenant.alert.title} />}
        <div className={styles.tenantStats}>
          {tenant.stats.map((s) => (
            <StatTile
              key={s.label}
              variant="outline"
              size="sm"
              label={s.label}
              value={s.value}
              delta={s.delta}
              deltaLabel={s.deltaLabel}
              positiveIsGood={s.positiveIsGood}
            />
          ))}
        </div>
      </CardContent>
      {/*
        Small buttons, so both actions sit on one line at the width the rail gives this card. At the default size
        the pair needed more room than the footer has in three of the five brands — Vela by 11px, Haat by 14px,
        Care by 76px — and CardFooter wrapped the second one onto its own row. At `sm` the pair fits in four of
        five (Care's primary action was shortened to "Book a visit" in its content.json for the fifth).

        The footer keeps its wrapping: making the buttons fit is what puts them side by side, not `nowrap`. Button
        sets `flex-shrink: 0` and `white-space: nowrap` with nothing to truncate it, so a footer forced to one row
        does not squeeze the second button, it pushes it past the card's edge — measured at 48px for Care at a
        1440px window and at every card (9–139px) at 375px. Wrapping is what keeps the narrow case honest.
      */}
      <CardFooter>
        <Button size="sm">{tenant.primaryAction}</Button>
        <Button size="sm" variant="outline">
          {tenant.secondaryAction}
        </Button>
      </CardFooter>
    </Card>
  );
}
