import { ButtonHTMLAttributes, DetailedHTMLProps, ReactNode } from "react";
import cx from "classix";

type ButtonType = "primary" | "secondary" | "accent" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps
  extends DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  label?: string;
  variant?: ButtonType;
  size?: ButtonSize;
  disabled?: boolean;
  rounded?: boolean;
  className?: string;
  children?: ReactNode;
  clickHandler?: () => void;
}

const variantClasses = {
  primary:
    "text-primary-50 bg-primary-500 hover:bg-primary-400 dark:bg-primary-900 dark:hover:bg-primary-800",
  secondary:
    "text-secondary-50 bg-secondary-500 hover:bg-secondary-400 dark:bg-secondary-800 dark:hover:bg-secondary-700",
  accent:
    "text-black bg-accent-300 hover:bg-accent-200 dark:bg-accent-600 dark:hover:bg-accent-500",
  ghost: "bg-transparent dark:bg-transparent hover:bg-gray-500/25",
};

const sizeClasses = {
  sm: "text-sm py-1 px-3",
  md: "text-md py-2 px-4",
  lg: "text-xl py-2 px-6",
};

const roundedClasses = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
};

export default function Button({
  label = "Button",
  variant = "primary",
  size = "sm",
  rounded = false,
  disabled = false,
  className,
  clickHandler,
  children,
}: ButtonProps) {
  //region style config
  const classes = cx(
    disabled
      ? "bg-slate-400 text-slate-500 pointer-events-none"
      : variantClasses[variant],
    sizeClasses[size],
    rounded && roundedClasses[size],
  );
  //region
  return (
    <button className={`${className} ${classes}`} onClick={clickHandler}>
      {children || label}
    </button>
  );
}
