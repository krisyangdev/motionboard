import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AppShell } from '@/core/app/AppShell'
import { Notice } from '@/core/app/AuthForm'
import { ApiError, api, useConfig, useRequireMe, type Job } from '@/core/app/api'
import { messages } from '@/core/app/messages'
import { Turnstile } from '@/core/app/Turnstile'
import { paramLocale } from '@/core/i18n'
import { useLocale, useMessages } from '@/core/locale'
import { PathLink } from '@/core/pages/HubPage'
import { seoHead } from '@/core/seo'
import { Badge } from '@/core/ui/badge'
import { Button, buttonVariants } from '@/core/ui/button'
import { Field, FieldControl, FieldLabel } from '@/core/ui/field'
import { Form } from '@/core/ui/form'
import { Skeleton } from '@/core/ui/skeleton'
import { Spinner } from '@/core/ui/spinner'

const KIND = 'demo-image'

export const Route = createFileRoute('/{-$locale}/app')({
  head: ({ params }) => {
    const locale = paramLocale(params.locale)
    return seoHead({ ...messages[locale].seo.app, path: '/app/', locale, type: 'website', noindex: true })
  },
  component: () => (
    <AppShell>
      <App />
    </AppShell>
  ),
})

const done = (s: Job['status'] | undefined) => s === 'succeeded' || s === 'failed'

function App() {
  const m = useMessages(messages)
  const locale = useLocale()
  const qc = useQueryClient()
  const me = useRequireMe()
  const ready = !!me.data
  const config = useConfig()
  const costs = useQuery({ queryKey: ['costs'], queryFn: () => api<Record<string, number>>('/api/generation/costs'), enabled: ready })
  const jobs = useQuery({ queryKey: ['jobs'], queryFn: () => api<{ items: Job[] }>('/api/jobs'), enabled: ready })

  const [prompt, setPrompt] = useState('')
  const [jobId, setJobId] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Poll the running job every 1.5 s until it succeeds or fails.
  const job = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => api<{ job: Job }>(`/api/jobs/${jobId}`),
    enabled: !!jobId,
    refetchInterval: (q) => (done(q.state.data?.job.status) ? false : 1500),
  })
  const current = job.data?.job
  const finished = done(current?.status)
  useEffect(() => {
    if (!finished) return
    void qc.invalidateQueries({ queryKey: ['me'] })
    void qc.invalidateQueries({ queryKey: ['jobs'] })
  }, [finished, jobId, qc])

  const submit = useMutation({
    mutationFn: () => api<{ job: { id: string } }>('/api/jobs', { method: 'POST', body: { kind: KIND, input: { prompt: prompt.trim() }, turnstileToken: token ?? undefined } }),
    onSuccess: ({ job }) => {
      setJobId(job.id)
      void qc.invalidateQueries({ queryKey: ['me'] })
      void qc.invalidateQueries({ queryKey: ['jobs'] })
    },
    onError: (e) => {
      const err = e instanceof ApiError ? e : null
      if (err?.status === 402 || err?.code === 'insufficient_credits') setError(m.app.insufficient)
      else if (err?.status === 429) setError(m.app.rateLimited)
      else if (err?.code === 'turnstile_failed') setError(m.app.turnstileFailed)
      else setError(m.common.error)
    },
    // A Turnstile token works once.
    onSettled: () => {
      setToken(null)
      setResetKey((k) => k + 1)
    },
  })

  if (!me.data) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-9 w-28" />
      </div>
    )
  }

  const cost = costs.data?.[KIND]
  const available = me.data.balance.available
  const lacking = cost !== undefined && available < cost
  const running = !!jobId && !finished && !job.isError
  const siteKey = config.data?.turnstileSiteKey
  const canSubmit = !!prompt.trim() && cost !== undefined && !lacking && !running && !submit.isPending && !config.isPending && (!siteKey || !!token)

  return (
    <>
      <h1 className="font-semibold text-3xl tracking-tight">{m.app.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-sm">
        <span>{m.app.balance(available)}</span>
        {cost !== undefined && <span>{m.app.cost(cost)}</span>}
        {lacking && (
          <PathLink className="text-foreground underline underline-offset-4" locale={locale} path="/account/">
            {m.app.buy}
          </PathLink>
        )}
      </div>

      <Form
        method="post"
        className="mt-6 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!canSubmit) return
          setError(null)
          submit.mutate()
        }}
      >
        <Field>
          <FieldLabel>{m.app.prompt}</FieldLabel>
          <FieldControl
            render={
              <textarea className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-base shadow-xs/5 outline-none ring-ring/24 transition-shadow placeholder:text-muted-foreground/72 focus-visible:border-ring focus-visible:ring-[3px] sm:text-sm dark:bg-input/32" />
            }
            maxLength={1000}
            placeholder={m.app.placeholder}
            required
            value={prompt}
            onValueChange={(v) => setPrompt(String(v))}
          />
        </Field>
        <Turnstile siteKey={siteKey} action="generate" onToken={setToken} resetKey={resetKey} />
        {error && <Notice variant="error">{error}</Notice>}
        <div>
          <Button type="submit" disabled={!canSubmit} loading={submit.isPending}>
            {m.app.generate}
          </Button>
        </div>
      </Form>

      {(running || current) && (
        <section className="mt-8" aria-live="polite">
          {running && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Spinner className="size-4" />
              {m.app.running}
            </div>
          )}
          {current?.status === 'succeeded' && current.outputUrl && <img src={current.outputUrl} alt={m.app.resultAlt} className="w-full rounded-xl border bg-muted" />}
          {current?.status === 'failed' && (
            <Notice variant="error">
              <span className="font-medium text-foreground">{m.app.failedTitle}</span>
              {current.error && <span>{current.error}</span>}
              <span>{m.app.refunded}</span>
            </Notice>
          )}
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-3 font-semibold text-lg tracking-tight">{m.app.recent}</h2>
        {jobs.data ? (
          jobs.data.items.length ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {jobs.data.items.map((j) => (
                <li key={j.id} className="flex flex-col gap-1.5">
                  <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                    {j.outputUrl ? (
                      <a href={j.outputUrl} target="_blank" rel="noreferrer">
                        <img src={j.outputUrl} alt={m.app.resultAlt} loading="lazy" className="size-full object-cover" />
                      </a>
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">{done(j.status) ? null : <Spinner className="size-5" />}</div>
                    )}
                  </div>
                  <Badge className="self-start" variant={j.status === 'succeeded' ? 'success' : j.status === 'failed' ? 'error' : 'outline'}>
                    {m.app.status[j.status] ?? j.status}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">{m.app.none}</p>
          )
        ) : (
          <Skeleton className="h-24 w-full rounded-lg" />
        )}
      </section>

      <div className="mt-10">
        <PathLink className={buttonVariants({ variant: 'outline' })} locale={locale} path="/account/">
          {m.app.account}
        </PathLink>
      </div>
    </>
  )
}
