import type { AnchorHTMLAttributes } from "react";

/** Link — Roboto Standard in SP3 text-link (#006880).
    normal: 1px underline in icon colour · hover: underline text-link · pressed: 2px underline. */
export function Link({ className = "", children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={`inline-block w-fit sp-text-standard text-sp-text-link no-underline border-0 border-b border-solid border-sp-icon hover:border-sp-text-link active:border-b-2 cursor-pointer outline-none focus-visible:shadow-[var(--sp-focus-brand)] ${className}`}
      {...rest}
    >
      {children}
    </a>
  );
}
