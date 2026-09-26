'use client';

import { useState } from 'react';
import { Pagination } from '@strata/react';

export default function Example() {
  const [page, setPage] = useState(10);
  return (
    <Pagination
      label="Search results pages"
      page={page}
      pageCount={20}
      siblingCount={2}
      boundaryCount={1}
      onPageChange={setPage}
    />
  );
}
