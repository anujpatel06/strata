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
      <CardFooter>
        <Button>{tenant.primaryAction}</Button>
        <Button variant="outline">{tenant.secondaryAction}</Button>
      </CardFooter>
    </Card>
  );
}
