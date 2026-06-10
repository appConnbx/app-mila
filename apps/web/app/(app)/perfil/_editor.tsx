'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Avatar, Button, fieldClasses, labelClasses } from '@/components/ui'
import { updateProfile } from './actions'

type Initial = { avatar_url: string | null; phone: string | null; headline: string | null; skills: string[] }

export function ProfileEditor({ uid, name, email, initial }: { uid: string; name: string; email: string; initial: Initial }) {
  const t = useTranslations('profile')
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url ?? '')
  const [phone, setPhone] = useState(initial.phone ?? '')
  const [headline, setHeadline] = useState(initial.headline ?? '')
  const [skills, setSkills] = useState<string[]>(initial.skills ?? [])
  const [skillInput, setSkillInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${uid}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        setAvatarUrl(data.publicUrl)
      }
    } finally {
      setUploading(false)
    }
  }

  function addSkill() {
    const s = skillInput.trim()
    if (s && !skills.includes(s) && skills.length < 20) setSkills([...skills, s])
    setSkillInput('')
  }

  async function save() {
    setSaving(true)
    setSaved(false)
    const fd = new FormData()
    fd.set('avatar_url', avatarUrl)
    fd.set('phone', phone)
    fd.set('headline', headline)
    fd.set('skills', skills.join(','))
    await updateProfile(fd)
    setSaving(false)
    setSaved(true)
    router.refresh()
  }

  return (
    <div className="glass glow-top mx-auto max-w-2xl p-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={name} className="h-16 w-16 rounded-2xl object-cover" />
          ) : (
            <Avatar name={name} size="lg" />
          )}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-white">{name}</h1>
          <p className="truncate text-sm text-slate-400">{email}</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-1 text-xs font-medium text-brand transition hover:underline"
            disabled={uploading}
          >
            {uploading ? t('uploading') : t('changePhoto')}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className={labelClasses}>{t('headline')}</label>
          <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder={t('headlinePlaceholder')} className={`mt-1 ${fieldClasses}`} />
        </div>
        <div>
          <label className={labelClasses}>{t('phone')}</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+55 11 9 9999-9999" className={`mt-1 ${fieldClasses}`} />
        </div>
        <div>
          <label className={labelClasses}>{t('skills')}</label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 rounded-md bg-brand/15 px-2 py-0.5 text-[12px] font-semibold text-cyan-200">
                {s}
                <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))} className="text-cyan-300/70 hover:text-white">×</button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
              placeholder={t('skillsPlaceholder')}
              className={fieldClasses}
            />
            <button type="button" onClick={addSkill} className="shrink-0 rounded-lg border border-white/10 px-3 text-sm text-slate-300 transition hover:bg-white/10">{t('add')}</button>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={save} disabled={saving || uploading}>{saving ? t('saving') : t('save')}</Button>
          {saved && <span className="text-sm text-emerald-400">{t('saved')}</span>}
        </div>
      </div>
    </div>
  )
}
