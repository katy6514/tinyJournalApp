import React from "react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { sourceSans } from "@/app/ui/fonts";

const baseClasses = `text-gray-900 bg-white
block w-full p-2.5 text-sm border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`;

const inputClasses = ``;

const textAreaClasses = `h-full`;

const selectClasses = ``;

const labelClasses = `block mb-2 text-sm font-medium text-gray-900 dark:text-white`;

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor: string;
}

export function Label({ htmlFor, children, className = "" }: LabelProps) {
  const combinedClasses = twMerge(labelClasses, className);

  return (
    <label htmlFor={htmlFor} className={combinedClasses}>
      {children}
    </label>
  );
}

/** ===========================================
 *      SELECT
 =========================================== */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  name: string;
  required?: boolean;
  children: React.ReactNode;
  ariaDescribedby?: string;
}

export function Select({
  id,
  name,
  children,
  required,
  className = "",
  ariaDescribedby,
}: SelectProps) {
  const combinedClasses = twMerge(baseClasses, selectClasses, className);

  return (
    <select
      id={id}
      name={name}
      required={required}
      className={combinedClasses}
      aria-describedby={ariaDescribedby}
    >
      {children}
    </select>
  );
}

/** ===========================================
 *      TEXT AREA
 =========================================== */
interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  name: string;
  value?: string | number;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  ariaDescribedby?: string;
}

export function TextArea({
  id,
  name,
  value,
  required,
  className = "",
  placeholder,
  defaultValue,
  ariaDescribedby,
}: TextAreaProps) {
  const combinedClasses = twMerge(baseClasses, textAreaClasses, className);

  return (
    <textarea
      id={id}
      name={name}
      value={value}
      required={required}
      className={combinedClasses}
      placeholder={placeholder}
      defaultValue={defaultValue}
      aria-describedby={ariaDescribedby}
    />
  );
}

/** ===========================================
 *      INPUT
 =========================================== */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  name: string;
  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "checkbox"
    | "radio"
    | "date";
  value?: string; // | number | boolean;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  ariaDescribedby?: string;
}

export function Input({
  id,
  name,
  type,
  value,
  required,
  className = "",
  placeholder,
  defaultValue,
  ariaDescribedby,
}: InputProps) {
  const combinedClasses = twMerge(baseClasses, inputClasses, className);

  return (
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      required={required}
      className={combinedClasses}
      placeholder={placeholder}
      defaultValue={defaultValue}
      aria-describedby={ariaDescribedby}
    />
  );
}
