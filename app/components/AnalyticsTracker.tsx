'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    // Ignoramos acessos do próprio administrador ou chamadas backend de API
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return;
    }

    const trackVisit = async () => {
      try {
        await fetch('/api/track-visit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (err) {
        console.error('Failed to track site visit:', err);
      }
    };

    trackVisit();
  }, [pathname]);

  return null;
}
