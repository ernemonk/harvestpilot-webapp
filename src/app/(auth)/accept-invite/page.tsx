'use client';

import { Suspense } from 'react';
import AcceptInvite from '@/views/AcceptInvite';

function AcceptInviteContent() {
  return <AcceptInvite />;
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>}>
      <AcceptInviteContent />
    </Suspense>
  );
}
