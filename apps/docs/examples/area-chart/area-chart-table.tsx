'use client';

import { useState } from 'react';
import { AreaChart, Switch } from '@strata/react';

const data = [
  { quarter: 'Q1', balance: 12400 }, { quarter: 'Q2', balance: 15800 },
  { quarter: 'Q3', balance: 14900 }, { quarter: 'Q4', balance: 19300 },
];

export default function Example() {
  const [showTable, setShowTable] = useState(false);
  return (
    <div style={{ display: 'grid', gap: 'var(--strata-space-4)', inlineSize: '100%' }}>
      <Switch isSelected={showTable} onChange={setShowTable}>
        Show data table
      </Switch>
      <AreaChart
        aria-label="Savings balance by quarter"
        data={data}
        x="quarter"
        xLabel="Quarter"
        height={200}
        showTable={showTable}
        series={[{ key: 'balance', label: 'Balance' }]}
        format={{ value: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 } }}
      />
    </div>
  );
}
