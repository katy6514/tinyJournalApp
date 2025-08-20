import React from "react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { sourceSans } from "@/app/ui/fonts";

type ButtonVariant = "dark" | "light" | "error" | "outlined";

// import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  href?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "submit" | "reset" | "button" | undefined;
  variant?: ButtonVariant;
}

const baseClasses = `flex items-center ${sourceSans.className} justify-center px-6 py-3 text-sm font-medium w-auto inline-flex transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`;

const variantClasses: Record<ButtonVariant, string> = {
  dark: "text-white bg-gray-800 border-black hover:bg-black",
  light:
    "text-gray-900 bg-white border border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600",
  error: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  outlined:
    "bg-transparent text-gray-800 border border-gray-800 hover:bg-gray-100 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700",
};

export function Button({
  children,
  href,
  icon,
  onClick,
  type,
  className = "",
  variant = "dark", // default
}: ButtonProps) {
  const variantClass = variantClasses[variant];

  if (typeof children === "string") {
  }

  const content = (
    <>
      {icon && <span className="w-5 h-5 mr-2.5">{icon}</span>}
      {typeof children === "string" ? children.toUpperCase() : children}
    </>
  );

  const combinedClasses = twMerge(baseClasses, variantClass, className);

  if (href) {
    return (
      <div className="flex justify-end gap-2">
        <Link href={href} className={combinedClasses}>
          {content}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      <button onClick={onClick} className={combinedClasses} type={type}>
        {content}
      </button>
    </div>
  );
}

// usage examples:

// // Standard button
// <Button onClick={() => console.log("Clicked!")}>Click me</Button>

// // With icon
// <Button icon={<MyIcon />} onClick={doSomething}>
//   Save
// </Button>

// // As a link
// <Button href="/about" icon={<ArrowRight />}>
//   Learn More
// </Button>
