"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function GlowCard({ children, className = "", onClick, hover = true }: GlowCardProps) {
  return (
    <motion.div
      className={`
        bg-card backdrop-blur-xl border border-border-subtle rounded-xl
        transition-all duration-200 ease-out
        ${hover ? "hover:border-border-hover hover:-translate-y-0.5 hover:shadow-glow cursor-pointer" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      onClick={onClick}
      whileHover={hover ? { y: -2 } : undefined}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}