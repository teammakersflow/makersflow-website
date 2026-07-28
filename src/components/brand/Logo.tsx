import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";

export function Logo({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const heightClass =
    size === "sm"
      ? "h-6 sm:h-7"
      : size === "lg"
      ? "h-9 sm:h-10 lg:h-11"
      : "h-8 sm:h-9";

  return (
    <Link
      to="/"
      className={`group inline-flex items-center select-none hover:opacity-95 transition-opacity ${className}`}
    >
      <motion.img
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 16 }}
        src="/makersflow-logo-dark.png"
        alt="MakersFlow"
        className={`${heightClass} w-auto object-contain dark:hidden transition-transform duration-200 group-hover:scale-105`}
      />
      <motion.img
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 16 }}
        src="/makersflow-logo-light.png"
        alt="MakersFlow"
        className={`${heightClass} w-auto object-contain hidden dark:block transition-transform duration-200 group-hover:scale-105`}
      />
    </Link>
  );
}
