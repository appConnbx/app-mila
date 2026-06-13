'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { setEntityLogo } from './actions'
import { Card } from './_components'

// Upload de logo (holding ou organização). Reusa o bucket público `avatars`:
// a política exige a 1ª pasta = uid do usuário, então gravamos em `{uid}/...`
// e guardamos a URL pública em logo_url via server action.
export function LogoUploader({
  kind,
  id,
  name,
  initialUrl,
}: {
  kind: 'holding' | 'organization'
  id: string
  name: string
  initialUrl: string | null
}) {
  const t = useTranslations('structure')
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState(initialUrl ?? '')
  const [busy, setBusy] = useState(false)

  async function persist(newUrl: string) {
    const fd = new FormData()
    fd.set('kind', kind)
    fd.set('id', id)
    fd.set('logo_url', newUrl)
    await setEntityLogo(fd)
    router.refresh()
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const supabase = createClient()
      const { data: u } = await supabase.auth.getUser()
      const uid = u.user?.id
      if (!uid) return
      const ext = file.name.split('.').pop() || 'png'
      const path = `${uid}/${kind}-${id}-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        setUrl(data.publicUrl)
        await persist(data.publicUrl)
      }
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    try {
      setUrl('')
      await persist('')
    } finally {
      setBusy(false)
    }
  }

  const initial = name.charAt(0).toUpperCase()
  return (
    <Card title={t('logoLabel')}>
      <div className="flex items-center gap-4">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={name} className="h-16 w-16 rounded-2xl object-cover ring-1 ring-white/10" />
        ) : (
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand/15 text-2xl font-bold text-brand">
            {initial}
          </span>
        )}
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="text-sm font-medium text-brand transition hover:underline disabled:opacity-50"
          >
            {busy ? t('logoUploading') : t('logoChange')}
          </button>
          {url && (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="ml-4 text-sm text-slate-400 transition hover:text-rose-300 disabled:opacity-50"
            >
              {t('logoRemove')}
            </button>
          )}
          <p className="mt-1 text-xs text-slate-500">{t('logoHint')}</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
      </div>
    </Card>
  )
}
