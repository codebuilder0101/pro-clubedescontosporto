"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { OfferArt } from "../art/offer-art";
import { artKind } from "./offer-visual";

type Img = { src: string; thumb: string; width: number; height: number };

/** Main photo plus round thumbnails; falls back to the illustration. */
export function OfferGallery({ images, art, alt }: { images: Img[]; art: string; alt: string }) {
  const t = useTranslations("Offer");
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="art relative aspect-[4/3.4] flex-1 overflow-hidden rounded-[34px_34px_34px_120px] shadow-2">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element -- authenticated media route
          <img src={current.src} alt={alt} width={current.width} height={current.height} className="absolute inset-0 size-full object-cover" />
        ) : (
          <OfferArt kind={artKind(art)} />
        )}
      </div>
      {images.length > 1 && (
        <ul aria-label={t("photos")} className="flex gap-3 sm:flex-col">
          {images.map((img, i) => (
            <li key={img.src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={t("photo", { n: i + 1, count: images.length })}
                aria-pressed={i === active}
                className={`block size-[72px] overflow-hidden rounded-full shadow-1 ring-4 transition sm:size-[92px] ${i === active ? "ring-sun" : "ring-white"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- authenticated media route */}
                <img src={img.thumb} alt="" className="size-full object-cover" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
