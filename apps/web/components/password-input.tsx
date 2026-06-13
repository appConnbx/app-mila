'use client'

import { useState } from 'react'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
      <path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 4.7A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.3 4.1M6.3 6.3A18 18 0 0 0 2 12s3.5 7 10 7a10.8 10.8 0 0 0 3.1-.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Campo de senha com botão "olhinho" para mostrar/ocultar. Funciona controlado
 *  (value+onChange) ou não-controlado. autoComplete padrão "new-password" evita
 *  o autofill do navegador em formulários de cadastro. */
export function PasswordInput({
  name,
  id,
  placeholder,
  className,
  required,
  minLength,
  autoComplete = 'new-password',
  value,
  onChange,
}: {
  name: string
  id?: string
  placeholder?: string
  className?: string
  required?: boolean
  minLength?: number
  autoComplete?: string
  value?: string
  onChange?: (v: string) => void
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        className={`${className ?? ''} pr-10`}
        {...(onChange ? { value: value ?? '', onChange: (e) => onChange(e.target.value) } : {})}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-white"
      >
        <EyeIcon open={show} />
      </button>
    </div>
  )
}
