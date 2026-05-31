// src/components/ui/Modal.tsx
import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: ReactNode
}

const sizeClass = {
  sm: 't-ui-modal-box--sm',
  md: 't-ui-modal-box--md',
  lg: 't-ui-modal-box--lg',
  xl: 't-ui-modal-box--xl',
}

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  footer,
}: ModalProps) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  if (!open) return null

  return (
    <div
      className="t-ui-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div className={`t-ui-modal-box ${sizeClass[size]}`}>
        {title && (
          <div className="t-modal-head">
            <div>
              <h2 id="modal-title" className="t-modal-title">
                {title}
              </h2>
              {subtitle && <p className="t-modal-sub">{subtitle}</p>}
            </div>
            <button
              type="button"
              className="t-modal-close"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
        )}
        <div className="t-modal-body">{children}</div>
        {footer && <div className="t-modal-foot">{footer}</div>}
      </div>
    </div>
  )
}
