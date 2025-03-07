import { ButtonHTMLAttributes, DetailedHTMLProps, ReactNode } from "react";
import cx from "classix";

type ButtonType = "primary" | "secondary" | "accent" | "ghost";
type ButtonSize = "small" | "medium" | "large";

interface ButtonProps
  extends DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  label?: string;
  variant?: ButtonType;
  size?: ButtonSize;
  disabled?: boolean;
  children?: ReactNode;
}

export default function Button({
  label = "Button",
  variant = "primary",
  size = "medium",
  disabled = false,
  children,
}: ButtonProps) {
  const classes = cx(
    disabled === true
      ? "bg-slate-400 text-slate-500 pointer-events-none"
      : variant === "primary" &&
          "text-primary-50 bg-primary-500 hover:bg-primary-400" +
            " dark:bg-primary-900" +
            " dark:hover:bg-primary-800",
    variant === "secondary" &&
      "text-secondary-50 bg-secondary-500 hover:bg-secondary-400" +
        " dark:bg-secondary-800 dark:hover:bg-secondary-700",
    variant === "accent" &&
      "text-black bg-accent-300 hover:bg-accent-200 dark:bg-accent-600" +
        " dark:hover:bg-accent-500",
    variant === "ghost" &&
      "bg-transparent dark:bg-transparent hover:bg-gray-500/25",
    size === "small" && "text-sm py-1 px-3 rounded-md",
    size === "medium" && "text-md py-2 px-4 rounded-lg",
    size === "large" && "text-xl py-2 px-6 rounded-xl",
  );
  return <button className={classes}>{children || label}</button>;
}
