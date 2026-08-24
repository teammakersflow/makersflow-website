"use client";

import * as React from "react";
import { MoreVertical } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Copy01Icon,
  Delete02Icon,
  FavouriteIcon,
  PencilEdit02Icon,
  Share01Icon,
} from "@hugeicons/core-free-icons";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  type Transition,
  type Variants,
} from "framer-motion";

export interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
}

export interface InlineDisclosureMenuProps {
  menuItems?: MenuItemProps[];
  showDelete?: boolean;
  onDelete?: () => void;
  title?: string;
  align?: "right" | "center" | "left";
  className?: string;
}

const spring: Transition = {
  type: "spring",
  bounce: 0,
  duration: 0.4,
};

const menuVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: spring },
};

const deleteVariants: Variants = {
  initial: (confirm: boolean) => ({
    y: confirm ? 60 : -60,
  }),
  animate: {
    y: 0,
    transition: spring,
  },
  exit: (confirm: boolean) => ({
    y: confirm ? -60 : 60,
    transition: spring,
  }),
};

const confirmVariants: Variants = {
  initial: (confirm: boolean) => ({
    y: confirm ? 60 : -60,
  }),
  animate: {
    y: 0,
    transition: spring,
  },
  exit: (confirm: boolean) => ({
    y: confirm ? -60 : 60,
    transition: spring,
  }),
};

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  onClick,
  className = "",
}) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-foreground transition-colors hover:bg-secondary/80 sm:gap-4 ${className}`}
  >
    <span className="text-muted-foreground">{icon}</span>
    <span className="text-base font-medium tracking-tight sm:text-[18px]">
      {label}
    </span>
  </button>
);

export function InlineDisclosureMenu({
  menuItems = [
    {
      icon: <HugeiconsIcon icon={PencilEdit02Icon} size={24} />,
      label: "Edit",
    },
    { icon: <HugeiconsIcon icon={Copy01Icon} size={24} />, label: "Duplicate" },
    {
      icon: <HugeiconsIcon icon={FavouriteIcon} size={24} />,
      label: "Favourite",
    },
    { icon: <HugeiconsIcon icon={Share01Icon} size={24} />, label: "Share" },
  ],
  showDelete = true,
  onDelete,
  title = "More Options",
  align = "center",
  className = "",
}: InlineDisclosureMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirm(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const popupPositionClass =
    align === "right"
      ? "right-0 top-14 origin-top-right"
      : align === "left"
      ? "left-0 top-14 origin-top-left"
      : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 origin-center";

  return (
    <div className={`relative flex ${align === "right" ? "justify-end" : align === "left" ? "justify-start" : "justify-center"} ${className}`}>
      <div ref={ref} className="relative">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors sm:h-11 sm:w-11"
        >
          <MoreVertical className="h-5 w-5" />
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className={`absolute z-50 w-[260px] overflow-hidden rounded-2xl border-2 border-border bg-popover text-popover-foreground shadow-xl sm:w-[304px] ${popupPositionClass}`}
            >
              <div className="border-b-2 border-border bg-muted/40 px-4 py-2.5 sm:px-6">
                <span className="text-sm font-medium text-muted-foreground sm:text-[16px]">
                  {title}
                </span>
              </div>

              <LayoutGroup>
                <div className="flex flex-col gap-2 px-2 py-2">
                  {menuItems.map((item, i) => (
                    <MenuItem key={i} {...item} />
                  ))}
                </div>

                {showDelete && (
                  <div className="relative h-[56px] overflow-hidden border-t-2 border-border">
                    <AnimatePresence
                      custom={confirm}
                      mode="popLayout"
                      initial={false}
                    >
                      {!confirm ? (
                        <motion.div
                          key="delete"
                          custom={confirm}
                          variants={deleteVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="absolute inset-0 flex items-center px-2"
                        >
                          <MenuItem
                            icon={
                              <HugeiconsIcon
                                icon={Delete02Icon}
                                size={24}
                                color="currentColor"
                              />
                            }
                            label="Delete"
                            className="cursor-pointer text-destructive hover:bg-destructive/10"
                            onClick={() => setConfirm(true)}
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="confirm"
                          custom={confirm}
                          variants={confirmVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="absolute inset-0 flex items-center gap-2 px-2"
                        >
                          <button
                            onClick={onDelete}
                            className="h-10 flex-1 cursor-pointer rounded-xl bg-destructive font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors"
                          >
                            Yes, Delete
                          </button>

                          <button
                            onClick={() => setConfirm(false)}
                            className="h-10 flex-1 cursor-pointer rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Cancel
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </LayoutGroup>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
