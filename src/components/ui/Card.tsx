import { cn } from "@/lib/utils/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn("rounded-xl bg-card p-6 shadow-soft", className)}>
      {children}
    </div>
  );
}
