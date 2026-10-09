"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toggleFavorite } from "@/lib/actions/member";
import { Icon } from "../icon";

/**
 * Heart toggle. Updates instantly, then keeps what the server confirmed
 * (useOptimistic alone would fall back to the original prop afterwards).
 */
export function FavoriteButton({ slug, initial, className = "" }: { slug: string; initial: boolean; className?: string }) {
  const t = useTranslations("Favorites");
  const [confirmed, setConfirmed] = useState(initial);
  const [favorite, setOptimistic] = useOptimistic(confirmed);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-pressed={favorite}
      aria-label={favorite ? t("remove") : t("add")}
      title={favorite ? t("remove") : t("add")}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!favorite);
          const res = await toggleFavorite(slug);
          if (res.ok) setConfirmed(res.favorite);
        })
      }
      className={`fav-btn ${className}`}
    >
      <Icon name="heart" className="size-[22px]" fill={favorite ? "currentColor" : "none"} strokeWidth={2.2} />
    </button>
  );
}
