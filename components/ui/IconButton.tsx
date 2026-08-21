import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  active?: boolean;
  label: string;
};

export function IconButton({ children, active = false, label, className = "", ...props }: IconButtonProps) {
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      aria-label={label}
      className={`safepay-icon${active ? " active" : ""}${className ? ` ${className}` : ""}`}
    >
      {children}
    </button>
  );
}
