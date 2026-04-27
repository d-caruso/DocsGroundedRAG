export const config = { runtime: 'edge' }

const HF_BASE = 'https://d-caruso-dgrag-api.hf.space'

export default async function handler(req) {
  const url = new URL(req.url)
  const target = HF_BASE + url.pathname.replace('/api/proxy', '') + url.search

  const response = await fetch(target, {
    method: req.method,
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${process.env.HF_TOKEN}`,
    },
    body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
  })

  return new Response(response.body, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json',
    },
  })
}
