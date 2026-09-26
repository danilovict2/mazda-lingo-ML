import type React from "react";
import { Link } from "react-router-dom";

export function Button({
    children,
    to,
    onClick,
    secondary = false,
    disabled = false,
}: {
    children: React.ReactNode;
    to?: string;
    onClick?: () => void;
    secondary?: boolean;
    disabled?: boolean;
}) {
    const cls = `button ${secondary ? "secondary" : ""}`;
    return to ? (
        <Link className={cls} to={to}>
            {children}
        </Link>
    ) : (
        <button className={cls} onClick={onClick} disabled={disabled}>
            {children}
        </button>
    );
}
