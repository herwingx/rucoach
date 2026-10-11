'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import type { DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export function WorkoutsHistoryDateRangePicker({
  defaultFrom,
  defaultTo,
}: {
  defaultFrom: Date
  defaultTo: Date
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')

  // Initialize date range based on URL params or defaults
  const [date, setDate] = React.useState<DateRange | undefined>(() => {
    return {
      from: fromParam ? new Date(`${fromParam}T00:00:00`) : defaultFrom,
      to: toParam ? new Date(`${toParam}T00:00:00`) : defaultTo,
    }
  })

  // Whenever the date selection is complete (both from and to are selected), push to URL
  React.useEffect(() => {
    if (date?.from && date?.to) {
      const fromStr = format(date.from, 'yyyy-MM-dd')
      const toStr = format(date.to, 'yyyy-MM-dd')

      // Avoid pushing if the URL already has these exact params to prevent infinite loops
      if (fromParam !== fromStr || toParam !== toStr) {
        const params = new URLSearchParams(searchParams)
        params.set('from', fromStr)
        params.set('to', toStr)
        router.push(`?${params.toString()}`, { scroll: false })
      }
    }
  }, [date, router, searchParams, fromParam, toParam])

  return (
    <div className="grid gap-2 w-full sm:w-auto">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-full sm:w-[300px] justify-start rounded-xl text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'dd LLL y', { locale: es })} -{' '}
                  {format(date.to, 'dd LLL y', { locale: es })}
                </>
              ) : (
                format(date.from, 'dd LLL y', { locale: es })
              )
            ) : (
              <span>Selecciona un rango</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={1}
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
