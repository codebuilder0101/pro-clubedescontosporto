"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { deleteOfferImage, moveOfferImage, uploadOfferImages } from "@/lib/actions/admin/offers";
import { initialFormState } from "@/lib/actions/form-state";
import { FormAlert } from "../form/field";
import { Icon } from "../icon";
import { ConfirmSubmit } from "./confirm-submit";
import { SaveButton, useAdminError } from "./fields";

type Img = { id: string; thumb: string };

/** Upload, reorder (first = cover) and delete an offer's photos. */
export function ImageManager({ offerId, images }: { offerId: string; images: Img[] }) {
  const [state, upload, pending] = useActionState(uploadOfferImages, initialFormState);
  const t = useTranslations("Admin.images");
  const err = useAdminError(state.errors);

  return (
    <section className="admin-card flex flex-col gap-4" aria-labelledby="photos-title">
      <h2 id="photos-title" className="text-xl font-bold">
        {t("title")}
      </h2>
      <p className="a-hint !mt-0">{t("hint")}</p>
      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((img, i) => (
            <li key={img.id} className="flex flex-col gap-2">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-linen">
                {/* eslint-disable-next-line @next/next/no-img-element -- authenticated media route */}
                <img src={img.thumb} alt={t("photo", { n: i + 1 })} className="size-full object-cover" />
                {i === 0 && <span className="status status-PUBLISHED absolute top-2 left-2">{t("cover")}</span>}
              </div>
              <div className="flex gap-1">
                <form action={moveOfferImage}>
                  <input type="hidden" name="imageId" value={img.id} />
                  <input type="hidden" name="dir" value="up" />
                  <button type="submit" disabled={i === 0} aria-label={t("moveUp")} className="grid size-10 place-items-center rounded-full bg-linen disabled:opacity-40">
                    <Icon name="back" className="size-4" />
                  </button>
                </form>
                <form action={moveOfferImage}>
                  <input type="hidden" name="imageId" value={img.id} />
                  <input type="hidden" name="dir" value="down" />
                  <button type="submit" disabled={i === images.length - 1} aria-label={t("moveDown")} className="grid size-10 place-items-center rounded-full bg-linen disabled:opacity-40">
                    <Icon name="next" className="size-4" />
                  </button>
                </form>
                <form action={deleteOfferImage} className="ml-auto">
                  <input type="hidden" name="imageId" value={img.id} />
                  <ConfirmSubmit message={t("confirmDelete")} className="grid size-10 place-items-center rounded-full bg-[#fbe7e3] text-bad">
                    <Icon name="trash" className="size-4" />
                    <span className="sr-only">{t("delete")}</span>
                  </ConfirmSubmit>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl bg-linen p-5 text-center font-bold text-mute">{t("empty")}</p>
      )}
      <form action={upload} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <input type="hidden" name="offerId" value={offerId} />
        <div className="flex-1">
          <label htmlFor="img-upload" className="a-label">
            {t("add")}
          </label>
          <input
            id="img-upload"
            name="images"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="a-input file:mr-3 file:rounded-full file:border-0 file:bg-tile file:px-4 file:py-2 file:font-bold file:text-deep"
            aria-invalid={state.errors?.images ? true : undefined}
          />
          <p className="a-hint">{t("formats")}</p>
        </div>
        <SaveButton pending={pending}>
          <Icon name="upload" className="size-5" />
          {t("upload")}
        </SaveButton>
      </form>
      {state.errors?.images && <FormAlert tone="bad">{err("images")}</FormAlert>}
      {state.ok && <FormAlert tone="ok">{t("uploaded")}</FormAlert>}
    </section>
  );
}
