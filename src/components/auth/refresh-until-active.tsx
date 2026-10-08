"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";

/**
 * Re-renders the server page every few seconds (for up to two minutes) while
 * the Stripe webhook activates the subscription. Shows a reassurance message
 * if it takes longer than usual (SEPA confirmations can).
 */
export function RefreshUntilActive({ slowMessage }: { slowMessage: string }) {
  const router = useRouter();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const started = Date.now();
    const interval = setInterval(() => {
      if (Date.now() - started > 120_000) clearInterval(interval);
      else router.refresh();
    }, 3000);
    const timer = setTimeout(() => setSlow(true), 20_000);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [router]);

  return slow ? <p className="form-alert form-alert-info">{slowMessage}</p> : null;
}
