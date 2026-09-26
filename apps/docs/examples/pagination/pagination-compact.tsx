'use client';

import { useState } from 'react';
import { Pagination } from '@strata/react';

export default function Example() {
  const [page, setPage] = useState(3);
  return <Pagination label="Statement pages" variant="compact" page={page} pageCount={12} onPageChange={setPage} />;
}
