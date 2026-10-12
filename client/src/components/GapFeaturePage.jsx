// === Batch 11 Gaps & Frontend Mounts ===
// Generic Gap-feature page for NonProfitConnect
import { useState } from 'react'
import NativeAIReport from './NativeAIReport'

const aiExamples = {
  'grant-proposal-writer': [
    { grantTitle: 'Community learning pilot', projectDescription: 'A fictional six-month pilot offering adult learning sessions. Verify local need, staffing, budget, and outcome measures before submission.' },
    { grantTitle: 'Neighborhood food access pilot', projectDescription: 'A fictional nine-month referral and food access program. Confirm partner commitments, service capacity, and costs before submission.' },
    { grantTitle: 'Youth mentoring pilot', projectDescription: 'A fictional supervised mentoring program. Confirm safeguarding, staffing, baseline needs, and realistic attendance measures.' },
  ],
  'donor-segmentation': [
    { donorData: JSON.stringify([{ totalGiven: 1200, frequency: 'monthly', lastGift: '2026-09-01' }, { totalGiven: 200, frequency: 'annual', lastGift: '2025-09-01' }], null, 2) },
    { donorData: JSON.stringify([{ totalGiven: 500, frequency: 'quarterly', lastGift: '2026-07-01' }, { totalGiven: 100, frequency: 'one-time', lastGift: '2024-06-01' }], null, 2) },
    { donorData: JSON.stringify([{ totalGiven: 2400, frequency: 'monthly', lastGift: '2026-09-01' }, { totalGiven: 600, frequency: 'annual', lastGift: '2025-12-01' }], null, 2) },
  ],
  'content-moderation': [
    { content: 'Fictional community post: Please join our neighborhood tutoring session on Saturday. Contact the organizer for verified details.' },
    { content: 'Fictional review case: This message repeats a donation link many times and asks readers to act immediately. Assess for spam without assuming intent.' },
    { content: 'Fictional review case: A participant reports a disrespectful comment in a discussion. Identify the policy questions and a proportionate review path.' },
  ],
  'donation-matching': [
    { donorProfile: 'Fictional donor interested in education programs and measurable attendance outcomes.' },
    { donorProfile: 'Fictional donor interested in food access and verified community partnerships.' },
    { donorProfile: 'Fictional donor interested in supervised youth development and transparent evaluation.' },
  ],
}

export default function GapFeaturePage({ title, description, slug, endpoint, fields = [], aiResultKey }) {
  const [form, setForm] = useState(() => Object.fromEntries(fields.map(f => [f.name, f.defaultValue || ''])))
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [exampleNotice, setExampleNotice] = useState('')
  const apiPath = endpoint || ('/api/gap-' + slug)
  const update = (name, value) => setForm(p => ({ ...p, [name]: value }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setResult(null)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const body = {}
      for (const f of fields) {
        let v = form[f.name]
        if (f.type === 'array' && typeof v === 'string') v = v.split(',').map(s => s.trim()).filter(Boolean)
        if (f.type === 'json' && typeof v === 'string' && v.trim()) { try { v = JSON.parse(v) } catch {} }
        body[f.name] = v
      }
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setResult(data)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  const responseText = result ? (result[aiResultKey] ?? result.proposal ?? result.report ?? result.spec ?? result.minutes ?? result.explanation ?? result) : ''

  const fillExample = (index) => {
    const example = aiExamples[slug]?.[index]
    if (!example || loading) return
    setForm(previous => ({ ...previous, ...example }))
    setExampleNotice(slug === 'donation-matching' && !form.availableProjects?.trim()
      ? 'Donor preferences filled. Supply actual available projects before running; no project reference was invented.'
      : 'Example fields filled. Review and run separately.')
  }

  const copy = () => {
    if (!responseText) return
    navigator.clipboard.writeText(typeof responseText === 'string' ? responseText : JSON.stringify(responseText))
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>{title}</h1>
      <p style={{ color: '#666', marginBottom: 16 }}>{description}</p>
      <form onSubmit={submit} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 20 }}>
        {aiExamples[slug] && <div aria-label="AI examples" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13 }}>Fictional planning examples fill this form without running AI. Keep actual project references where required.</p>
          {aiExamples[slug].map((_, index) => <button key={index} type="button" disabled={loading} onClick={() => fillExample(index)} style={{ marginRight: 8, marginBottom: 8, padding: '6px 10px', border: '1px solid #93c5fd', borderRadius: 6, background: '#fff' }}>Fill example {index + 1}</button>)}
          {exampleNotice && <p role="status" style={{ fontSize: 12 }}>{exampleNotice}</p>}
        </div>}
        {fields.map(f => (
          <div key={f.name} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{f.label}{f.required ? ' *' : ''}</label>
            {f.type === 'textarea' ? (
              <textarea value={form[f.name]} onChange={e => update(f.name, e.target.value)} placeholder={f.placeholder || ''} rows={f.rows || 4} style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} />
            ) : (
              <input type={f.type === 'number' ? 'number' : 'text'} value={form[f.name]} onChange={e => update(f.name, e.target.value)} placeholder={f.placeholder || ''} style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} />
            )}
            {f.hint && <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{f.hint}</div>}
          </div>
        ))}
        <button type="submit" disabled={loading} style={{ background: '#2563eb', color: '#fff', border: 0, padding: '8px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>{loading ? 'Processing…' : 'Run'}</button>
      </form>
      {error && <div style={{ marginTop: 16, padding: 12, background: '#fee', border: '1px solid #fcc', borderRadius: 8, color: '#c33', fontSize: 13 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 16, padding: 16, background: '#fff', border: '1px solid #eee', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ fontSize: 13 }}>Result</strong>
            <button onClick={copy} style={{ fontSize: 11, background: 'transparent', border: '1px solid #ddd', padding: '2px 8px', borderRadius: 4, cursor: 'pointer' }}>{copied ? 'Copied' : 'Copy'}</button>
          </div>
          <NativeAIReport value={responseText} title={`${title} result`} />
        </div>
      )}
    </div>
  )
}
