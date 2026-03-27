"use client";

interface StatusDotProps {
  status: "active" | "busy" | "blocked" | "offline" | "hiring";
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}

export function StatusDot({ status, size = "md", pulse = false }: StatusDotProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const colorClasses = {
    active: "bg-success",
    busy: "bg-warning",
    blocked: "bg-critical",
    offline: "bg-text-muted",
    hiring: "bg-border-subtle",
  };

  return (
    <div
      className={`
        ${sizeClasses[size]} 
        ${colorClasses[status]} 
        rounded-full 
        ${pulse && status === "active" ? "animate-pulse" : ""}
        ${status === "hiring" ? "border-2 border-dashed border-text-muted" : ""}
      `}
    />
  );
}