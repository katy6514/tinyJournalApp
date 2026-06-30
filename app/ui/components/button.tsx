import React from "react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

type ButtonVariant = "primary" | "secondary" | "ghost" | "error" | "outline";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  href?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "submit" | "reset" | "button" | undefined;
  variant: ButtonVariant;
}

export function Button({
  children,
  href,
  icon,
  onClick,
  type,
  className = "",
  variant = "primary",
}: ButtonProps) {
  const combinedClasses = twMerge(`btn btn-${variant}`, className);

  const content = (
    <>
      {icon && <span className="w-5 h-5">{icon}</span>}
      {typeof children === "string" ? children.toUpperCase() : children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={combinedClasses} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={combinedClasses} type={type}>
      {content}
    </button>
  );
}
