import type { QueryRequest, QueryResponse } from '../types'

function getApiBaseUrl(): string {
  const apiBaseUrl = import.meta.env.VITE_API_URL

  if (!apiBaseUrl) {
    throw new Error('VITE_API_URL is not configured')
  }

  return apiBaseUrl
}

function getQueryUrl(): string {
  return new URL('/query', getApiBaseUrl()).toString()
}

export async function postQuery(question: string): Promise<QueryResponse> {
  const controller = new AbortController()
  const requestBody: QueryRequest = {
    query: question,
  }

  try {
    const response = await fetch(getQueryUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Query request failed with status ${response.status}`)
    }

    return (await response.json()) as QueryResponse
  } finally {
    controller.abort()
  }
}
