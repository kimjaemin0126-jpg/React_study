import { useCallback, useState } from 'react'
import { getMonthOf, getTodayKey } from './calendarUtils'

// 문서를 옮겨 다녀도 패널 열림 상태와 보고 있던 날짜가 유지된다.
export function useCalendarPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(getTodayKey)
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthOf(getTodayKey()))

  const selectDate = useCallback((key) => {
    setSelectedDate(key)
    setVisibleMonth(getMonthOf(key))
  }, [])

  const open = useCallback((key) => {
    if (key) selectDate(key)
    setIsOpen(true)
  }, [selectDate])

  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((current) => !current), [])

  return { isOpen, selectedDate, visibleMonth, setVisibleMonth, selectDate, open, close, toggle }
}
