import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type BaseProps = {
  label: string;
  error?: string;
  id: string;
  className?: string;
  /** Show a green checkmark fade-in when the field's value is valid */
  valid?: boolean;
};

type InputProps = BaseProps & React.InputHTMLAttributes<HTMLInputElement> & { as?: "input" };
type SelectProps = BaseProps &
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    as: "select";
    children: React.ReactNode;
  };

export type FloatingFieldProps = InputProps | SelectProps;

export const FloatingField = React.forwardRef<
  HTMLInputElement | HTMLSelectElement,
  FloatingFieldProps
>((props, ref) => {
  const { label, error, id, className, valid, ...rest } = props as BaseProps &
    Record<string, unknown>;
  const [focused, setFocused] = React.useState(false);
  const [hasValue, setHasValue] = React.useState(false);

  const onFocus = () => setFocused(true);
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFocused(false);
    setHasValue(!!e.target.value);
  };
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setHasValue(!!e.target.value);
    (rest as { onChange?: (e: unknown) => void }).onChange?.(e);
  };

  const float = focused || hasValue || !!(rest as { value?: unknown }).value;
  const showCheck = !!valid && !error && hasValue;

  const isPasswordField =
    props.as !== "select" &&
    (props as React.InputHTMLAttributes<HTMLInputElement>).type === "password";
  const [showPassword, setShowPassword] = React.useState(false);
  const currentType = isPasswordField
    ? showPassword
      ? "text"
      : "password"
    : (props as React.InputHTMLAttributes<HTMLInputElement>).type;

  const fieldClasses = cn(
    "peer block w-full rounded-xl border bg-card px-4 pb-2 pt-5 font-sans text-sm text-foreground outline-none transition-all",
    "border-border hover:border-primary/40",
    "focus:border-primary focus:ring-4 focus:ring-primary/15",
    isPasswordField ? (showCheck ? "pr-16" : "pr-10") : showCheck ? "pr-10" : "",
    error && "border-destructive focus:border-destructive focus:ring-destructive/15",
    className,
  );

  return (
    <div className="space-y-1.5">
      <div className="relative">
        {props.as === "select" ? (
          <select
            id={id}
            ref={ref as React.Ref<HTMLSelectElement>}
            {...(rest as React.SelectHTMLAttributes<HTMLSelectElement>)}
            onFocus={onFocus}
            onBlur={onBlur}
            onChange={onChange}
            className={fieldClasses}
          >
            {(props as SelectProps).children}
          </select>
        ) : (
          <input
            id={id}
            ref={ref as React.Ref<HTMLInputElement>}
            {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
            type={currentType}
            onFocus={onFocus}
            onBlur={onBlur}
            onChange={onChange}
            className={fieldClasses}
            placeholder=" "
          />
        )}
        <motion.label
          htmlFor={id}
          initial={false}
          animate={{
            y: float ? -10 : 6,
            scale: float ? 0.82 : 1,
            color: error
              ? "hsl(var(--destructive, 0 70% 50%))"
              : focused
                ? "var(--color-primary, #4F46E5)"
                : "var(--color-muted-foreground, #6B7280)",
          }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          className="pointer-events-none absolute left-4 top-3 origin-left bg-card px-1 font-sans text-sm"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          {label}
        </motion.label>

        {isPasswordField && hasValue && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}

        <AnimatePresence>
          {showCheck && (
            <motion.span
              key="valid-check"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 text-success",
                isPasswordField && hasValue ? "right-10" : "right-3.5",
              )}
            >
              <Check className="h-4 w-4" strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="flex items-center gap-1.5 pl-1 text-xs font-medium text-destructive"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});
FloatingField.displayName = "FloatingField";
