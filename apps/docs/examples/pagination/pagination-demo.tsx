'use client';

import { useState } from 'react';
import { Pagination } from '@strata/react';

export default function Example() {
  const [page, setPage] = useState(4);
  return <Pagination label="Claims pages" page={page} pageCount={12} onPageChange={setPage} />;
}
