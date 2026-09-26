'use client';

import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, ThemeScope } from '@strata/react';

const TENANTS = [
  { theme: 'vela', locale: 'en-IN', title: 'Card ending 4821', body: 'Replacement card dispatched. Activate it when it arrives.', status: 'In transit', action: 'Track card' },
  { theme: 'harbor', locale: 'en-GB', title: 'Home policy renews 14 Oct', body: 'Check your rebuild value before your renewal price is set.', status: 'Due soon', action: 'Review cover' },
  { theme: 'qamar', locale: 'ar-AE', title: 'طلب QM-58213', body: 'طلبك في الطريق ويصل اليوم بين 6 و 8 مساءً.', status: 'قيد التوصيل', action: 'تتبّع الطلب' },
] as const;

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', inlineSize: '100%' }}>
      {TENANTS.map((t) => (
        <ThemeScope key={t.theme} theme={t.theme} locale={t.locale} style={{ padding: 12, borderRadius: 12 }}>
          <Card>
            <CardHeader>
              <CardTitle>{t.title}</CardTitle>
              <CardDescription>{t.body}</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge tone="info">{t.status}</Badge>
            </CardContent>
            <CardFooter>
              <Button size="sm">{t.action}</Button>
            </CardFooter>
          </Card>
        </ThemeScope>
      ))}
    </div>
  );
}
