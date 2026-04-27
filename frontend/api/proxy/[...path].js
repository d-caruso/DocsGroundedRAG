export const config = { runtime: 'edge' }

const HF_BASE = 'https://d-caruso-dgrag-api.hf.space'

export default async function handler(req) {
  const url = new URL(req.url)
  const target = HF_BASE + url.pathname.replace('/api/proxy', '') + url.search

  const response = await fetch(target, {
    method: req.method,
    headers: { 'Content-Type': 'application/json' },
    body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
  })

  return new Response(response.body, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
