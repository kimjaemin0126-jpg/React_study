import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DialogContext } from '../context/dialogContext'

// 취소했을 때의 결과: 확인 창은 false, 입력 창은 null, 알림 창은 undefined
const CANCEL_RESULT = { confirm: false, prompt: null, alert: undefined }

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null)
  const resolverRef = useRef(null)

  const open = useCallback((config) => new Promise((resolve) => {
    resolverRef.current = resolve
    setDialog(config)
  }), [])

  const api = useMemo(() => ({
    confirm: (message, options = {}) => open({
      kind: 'confirm',
      message,
      title: options.title ?? '확인',
      confirmLabel: options.confirmLabel ?? '확인',
      danger: options.danger ?? false
    }),
    alert: (message, options = {}) => open({
      kind: 'alert',
      message,
      title: options.title ?? '알림',
      confirmLabel: '확인'
    }),
    prompt: (message, options = {}) => open({
      kind: 'prompt',
      message,
      title: options.title ?? '입력',
      confirmLabel: options.confirmLabel ?? '확인',
      placeholder: options.placeholder ?? '',
      maxLength: options.maxLength ?? 50
    })
  }), [open])

  function close(result) {
    resolverRef.current?.(result)
    resolverRef.current = null
    setDialog(null)
  }

  return (
    <DialogContext.Provider value={api}>
      {children}
      {dialog && <DialogBox key={dialog.message} config={dialog} onClose={close} />}
    </DialogContext.Provider>
  )
}

function DialogBox({ config, onClose }) {
  const { kind, title, message, confirmLabel, danger, placeholder, maxLength } = config
  const [value, setValue] = useState('')
  const trimmed = value.trim()

  function cancel() {
    onClose(CANCEL_RESULT[kind])
  }

  // Esc 키로 닫기
  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') onClose(CANCEL_RESULT[kind])
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [kind, onClose])

  function handleSubmit(event) {
    event.preventDefault()
    if (kind === 'prompt') {
      if (!trimmed) return
      onClose(trimmed)
      return
    }
    onClose(kind === 'confirm' ? true : undefined)
  }

  return (
    <div
      className="study-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) cancel()
      }}
    >
      <form className="app-dialog" role="dialog" aria-modal="true" aria-label={title} onSubmit={handleSubmit}>
        <h3>{title}</h3>
        <p>{message}</p>
        {kind === 'prompt' && (
          <input
            className="app-dialog-input"
            autoFocus
            value={value}
            placeholder={placeholder}
            maxLength={maxLength}
            onChange={(event) => setValue(event.target.value)}
          />
        )}
        <div className="app-dialog-actions">
          {kind !== 'alert' && <button type="button" className="study-secondary" onClick={cancel}>취소</button>}
          <button
            type="submit"
            className={danger ? 'study-danger-button' : 'study-primary'}
            disabled={kind === 'prompt' && !trimmed}
            autoFocus={kind !== 'prompt'}
          >{confirmLabel}</button>
        </div>
      </form>
    </div>
  )
}
