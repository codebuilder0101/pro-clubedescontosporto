import { OfferArt, type ArtKind } from "../art/offer-art";

const ART_KINDS: readonly ArtKind[] = ["tasca", "bar", "evento", "cultura", "surf", "cafe", "vinho", "ribeira"];

export function artKind(value: string): ArtKind {
  return (ART_KINDS as readonly string[]).includes(value) ? (value as ArtKind) : "ribeira";
}

/**
 * Offer image: the partner's photo once uploaded, otherwise the illustration.
 * Photos are served by an authenticated route (member content), so they use a
 * plain <img> with pre-sized WebP files instead of next/image.
 */
export function OfferVisual({
  artKind: kind,
  image,
  alt,
  size = "thumb",
  priority = false,
}: {
  artKind: string;
  image: { src: string; thumb: string } | null;
  alt: string;
  size?: "thumb" | "full";
  priority?: boolean;
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- authenticated media route, see above
      <img
        src={size === "full" ? image.src : image.thumb}
        alt={alt}
        className="absolute inset-0 size-full object-cover"
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    );
  }
  return <OfferArt kind={artKind(kind)} />;
}
