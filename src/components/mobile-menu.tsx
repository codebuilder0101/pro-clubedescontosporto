"use client";

import { useRef, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { Icon } from "./icon";

/** Burger button + slide-in sheet, shown below the xl breakpoint. */
export function MobileMenu({
  labels,
  sections,
  children,
}: {
  labels: { open: string; close: string; signIn: string; activate: string; nav: string };
  /** Home-page sections to link to. */
  sections: { id: string; label: string }[];
  children?: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();

  return (
    <>
      <button
        type="button"
        aria-label={labels.open}
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
        className="grid size-[54px] place-items-center rounded-full bg-white shadow-1 xl:hidden"
      >
        <Icon name="menu" className="size-6" strokeWidth={2.2} />
      </button>

      <dialog
        ref={dialog}
        aria-label={labels.nav}
        // Close when the backdrop (the dialog element itself) is clicked.
        onClick={(e) => e.target === e.currentTarget && close()}
        className="m-0 ml-auto h-dvh max-h-none w-full max-w-[420px] bg-transparent p-0 backdrop:bg-deep/35 backdrop:backdrop-blur-sm"
      >
        <div className="tex-paper flex min-h-full animate-slide-in flex-col gap-2 px-6 py-7">
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              aria-label={labels.close}
              onClick={close}
              className="grid size-[54px] place-items-center rounded-full bg-white shadow-1"
            >
              <Icon name="close" className="size-6" strokeWidth={2.2} />
            </button>
          </div>
          <nav aria-label={labels.nav} className="flex flex-col">
            {sections.map((s) => (
              <Link
                key={s.id}
                href={{ pathname: "/", hash: s.id }}
                onClick={close}
                className="flex items-center justify-between border-b border-line px-1.5 py-3.5 font-display text-[30px] font-extrabold text-deep"
              >
                {s.label}
                <Icon name="arrow" className="size-6 text-cobalt" />
              </Link>
            ))}
          </nav>
          <div className="mt-6">{children}</div>
          <div className="mt-auto flex flex-col gap-3 pt-6">
            <Link href="/login" onClick={close} className="btn btn-ghost">
              {labels.signIn}
            </Link>
            <Link href="/join" onClick={close} className="btn btn-sun">
              {labels.activate}
            </Link>
          </div>
        </div>
      </dialog>
    </>
  );
}
