'use client';

import { Suspense } from 'react';
import Providers from '../Providers';
import RequestLoanContent from './RequestLoanContent';

export default function RequestLoanPage() {
  return (
    <Providers>
      <Suspense fallback={
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      }>
        <RequestLoanContent />
      </Suspense>
    </Providers>
  );
} 