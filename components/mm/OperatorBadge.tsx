"use client";

import { MM_BRAND_STYLE, type MmOperator } from "@/lib/mm-operators";

type Props = {
  operator: MmOperator;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
};

export function OperatorBadge({ operator, selected, onClick, size = "md" }: Props) {
  const style = MM_BRAND_STYLE[operator.brand];
  const isButton = typeof onClick === "function";
  const pad = size === "sm" ? "8px 10px" : "12px 14px";
  const fontSize = size === "sm" ? 12 : 13;
  const iconSize = size === "sm" ? 28 : 36;

  const content = (
    <>
      <span
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: 10,
          background: style.accent,
          color: "#fff",
          display: "grid",
          placeItems: "center",
          fontWeight: 900,
          fontSize: size === "sm" ? 9 : 11,
          letterSpacing: "-0.02em",
          flexShrink: 0,
        }}
        aria-hidden
      >
        {operator.short}
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, textAlign: "left" }}>
        <strong style={{ fontSize, fontWeight: 800, color: style.fg, lineHeight: 1.2 }}>
          {operator.label}
        </strong>
      </span>
    </>
  );

  const baseStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: pad,
    borderRadius: 14,
    border: selected ? `2px solid ${style.accent}` : `1px solid ${style.border}`,
    background: selected ? style.bg : "var(--sp-card, #fff)",
    boxShadow: selected ? `0 0 0 3px ${style.bg}` : "none",
    cursor: isButton ? "pointer" : "default",
    width: "100%",
    minWidth: 0,
    transition: "border-color .15s ease, box-shadow .15s ease",
  };

  if (isButton) {
    return (
      <button type="button" onClick={onClick} style={baseStyle} aria-pressed={selected}>
        {content}
      </button>
    );
  }

  return <div style={baseStyle}>{content}</div>;
}

type GridProps = {
  operators: MmOperator[];
  value: string;
  onChange: (code: string) => void;
};

export function OperatorBadgeGrid({ operators, value, onChange }: GridProps) {
  if (!operators.length) {
    return (
      <p className="sp-muted" style={{ fontSize: 13 }}>
        Aucun opérateur disponible pour ce pays.
      </p>
    );
  }
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
        marginTop: 8,
      }}
      role="listbox"
      aria-label="Opérateurs Mobile Money"
    >
      {operators.map((op) => (
        <OperatorBadge
          key={op.code}
          operator={op}
          selected={value === op.code}
          onClick={() => onChange(op.code)}
        />
      ))}
    </div>
  );
}
