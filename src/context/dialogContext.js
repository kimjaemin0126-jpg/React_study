import { createContext, useContext } from 'react'

// 브라우저 기본 창 대신 앱 안의 창을 쓰기 위한 공용 컨텍스트
export const DialogContext = createContext(null)

export function useDialog() {
  const context = useContext(DialogContext)
  if (!context) throw new Error('useDialog는 DialogProvider 안에서 사용해야 합니다.')
  return context
}
