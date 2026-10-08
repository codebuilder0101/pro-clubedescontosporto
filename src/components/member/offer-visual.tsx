import { OfferArt, type ArtKind } from "../art/offer-art";

const ART_KINDS: readonly ArtKind[] = ["tasca", "bar", "evento", "cultura", "surf", "cafe", "vinho", "ribeira"];

export function artKind(value: string): ArtKind {
  return (ART_KINDS as readonly string[]).includes(value) ? (value as ArtKind) : "ribeira";
}

/** Offer image: the partner's photo once uploaded, otherwise the illustration. */
export function OfferVisual({ artKind: kind, imageUrl, alt }: { artKind: string; imageUrl: string | null; alt: string }) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- remote storage (R2) is configured in a later phase
    return <img src={imageUrl} alt={alt} className="absolute inset-0 size-full object-cover" loading="lazy" />;
  }
  return <OfferArt kind={artKind(kind)} />;
}
