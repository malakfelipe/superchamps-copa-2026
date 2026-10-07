"use client"

import { useMemo, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useCompetitions } from "@/lib/competitions-context"

type Props = {
  /** Quantos dias antes/depois de hoje exibir. */
  daysBack?: number
  daysForward?: number
  className?: string
}

const DAY_NAMES_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MONTH_NAMES_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function offsetDate(base: Date, offset: number): Date {
  const d = new Date(base)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offset)
  return d
}

function relativeLabel(date: Date, today: Date): string | null {
  const diffDays = Math.round((date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
  if (diffDays === 0) return "Hoje"
  if (diffDays === 1) return "Amanhã"
  if (diffDays === -1) return "Ontem"
  return null
}

/**
 * Date strip horizontal scrollável — espelha o seletor de datas do Sofascore.
 * Hoje fica centralizado/destacado. Pills com dia da semana + número.
 */
export function DateStrip({ daysBack = 7, daysForward = 14, className }: Props) {
  const { selectedDate, setDate } = useCompetitions()
  const scrollRef = useRef<HTMLDivElement>(null)
  const todayRef = useRef<HTMLButtonElement>(null)

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const dates = useMemo(() => {
    const out: Date[] = []
    for (let i = -daysBack; i <= daysForward; i++) {
      out.push(offsetDate(today, i))
    }
    return out
  }, [today, daysBack, daysForward])

  // Centraliza "hoje" no scroll inicial
  useEffect(() => {
    if (todayRef.current && scrollRef.current) {
      const t = todayRef.current
      const s = scrollRef.current
      s.scrollLeft = t.offsetLeft - s.offsetWidth / 2 + t.offsetWidth / 2
    }
  }, [])

  return (
    <div
      ref={scrollRef}
      className={cn("flex items-stretch gap-1 overflow-x-auto no-scrollbar -mx-2 px-2 py-1", className)}
    >
      {dates.map((date, idx) => {
        const isSelected = isSameDay(date, selectedDate)
        const isToday = isSameDay(date, today)
        const rel = relativeLabel(date, today)
        const dayName = DAY_NAMES_PT[date.getDay()]
        const day = date.getDate()
        const monthName = MONTH_NAMES_PT[date.getMonth()]

        return (
          <button
            key={idx}
            ref={isToday ? todayRef : undefined}
            type="button"
            onClick={() => setDate(date)}
            className={cn(
              "shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all text-xs",
              isSelected && "bg-primary text-primary-foreground shadow-sm",
              !isSelected && isToday && "bg-primary/10 text-primary ring-1 ring-primary/30",
              !isSelected && !isToday && "hover:bg-muted text-foreground",
            )}
          >
            <div className={cn(
              "text-[10px] uppercase tracking-wider font-medium",
              isSelected ? "text-primary-foreground/80" : "text-muted-foreground",
            )}>
              {rel || dayName}
            </div>
            <div className="font-bold text-base leading-tight">{day}</div>
            <div className={cn(
              "text-[9px] uppercase tracking-wider",
              isSelected ? "text-primary-foreground/70" : "text-muted-foreground/70",
            )}>
              {monthName}
            </div>
          </button>
        )
      })}
    </div>
  )
}
