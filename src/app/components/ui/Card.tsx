import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface CardProps {
  children: ReactNode
  className?: string
  isWin?: boolean
}

export function Card({ children, className, isWin }: CardProps) {
  return (
    <div
      className={cn(
        "relative rounded-lg shadow-md transition-all",
        isWin !== undefined
          ? isWin
            ? "bg-emerald-950/40 hover:bg-emerald-950/50"
            : "bg-red-950/40 hover:bg-red-950/50"
          : "bg-zinc-900/60 hover:bg-zinc-900/70",
        "hover:shadow-lg",
        "border border-zinc-800/50",
        className
      )}
    >
      {children}
    </div>
  )
}