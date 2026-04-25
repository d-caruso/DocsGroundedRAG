import type { ApiError, ApiErrorCode, QueryRequest, QueryResponse } from '../types'

const REQUEST_TIMEOUT_MS = 30000
const HEALTH_TIMEOUT_MS = 15000

class ApiClientError extends Error implements ApiError {
  code: ApiErrorCode
  status?: number

  constructor(message: string, code: ApiErrorCode, status?: number) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code
    this.status = status
  }
}

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL || '/api'
}

function getQueryUrl(): string {
  const baseUrl = getApiBaseUrl()
  if (baseUrl.startsWith('http')) {
    return new URL('/query', baseUrl).toString()
  }
  return `${baseUrl}/query`
}

function getHealthUrl(): string {
  const baseUrl = getApiBaseUrl()
  if (baseUrl.startsWith('http')) {
    return new URL('/health', baseUrl).toString()
  }
  return `${baseUrl}/health`
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiClientError) {
    return error
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return new ApiClientError('The request timed out', 'network_error')
  }

  if (error instanceof TypeError) {
    return new ApiClientError(error.message, 'network_error')
  }

  if (error instanceof Error) {
    return new ApiClientError(error.message, 'unknown_error')
  }

  return new ApiClientError('An unknown API error occurred', 'unknown_error')
}

export const mockQueryResponse: QueryResponse = {
  answer:
    'Use Checkout Sessions when you want Stripe to host the payment flow and manage confirmation, customer collection, and payment method orchestration for you.',
  chunks: [
    {
      id: 'checkout-sessions-overview',
      score: 0.91,
      content:
        'Checkout Sessions lets you create a Stripe-hosted payment page that handles payment method collection, confirmation, and post-payment flows with minimal integration code.',
      excerpt:
        'Checkout Sessions lets you create a Stripe-hosted payment page that handles payment method collection, confirmation, and post-payment flows.',
      metadata: {
        source_file: 'payments/checkout-sessions-and-payment-intents-comparison.md',
        category: 'payments',
        title: 'Checkout Sessions and Payment Intents comparison',
        section: 'Checkout Sessions',
        url: 'https://docs.stripe.com/payments/checkout-sessions-and-payment-intents-comparison',
      },
    },
    {
      id: 'payment-intents-overview',
      score: 0.84,
      content:
        'Payment Intents gives you finer control over the payment lifecycle when you need to build a custom checkout flow and manage confirmation yourself.',
      excerpt:
        'Payment Intents gives you finer control over the payment lifecycle when you need to build a custom checkout flow.',
      metadata: {
        source_file: 'payments/checkout-sessions-and-payment-intents-comparison.md',
        category: 'payments',
        title: 'Checkout Sessions and Payment Intents comparison',
        section: 'Payment Intents',
        url: 'https://docs.stripe.com/payments/checkout-sessions-and-payment-intents-comparison',
      },
    },
  ],
}

export async function postQuery(
  question: string,
  minSimilarity?: number,
): Promise<QueryResponse> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const requestBody: QueryRequest = {
    query: question,
    ...(minSimilarity !== undefined ? { min_similarity: minSimilarity } : {}),
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
      throw new ApiClientError(
        `Query request failed with status ${response.status}`,
        'http_error',
        response.status,
      )
    }

    return (await response.json()) as QueryResponse
  } catch (error) {
    throw toApiError(error)
  } finally {
    window.clearTimeout(timeoutId)
    controller.abort()
  }
}

export async function checkHealth(): Promise<void> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS)

  try {
    const response = await fetch(getHealthUrl(), {
      method: 'GET',
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new ApiClientError(
        `Health check failed with status ${response.status}`,
        'http_error',
        response.status,
      )
    }
  } catch (error) {
    throw toApiError(error)
  } finally {
    window.clearTimeout(timeoutId)
  }
}
