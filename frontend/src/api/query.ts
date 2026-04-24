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

function getHealthUrl(): string {
  return new URL('/health', getApiBaseUrl()).toString()
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

export async function checkHealth(): Promise<void> {
  const controller = new AbortController()

  try {
    const response = await fetch(getHealthUrl(), {
      method: 'GET',
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Health check failed with status ${response.status}`)
    }
  } finally {
    controller.abort()
  }
}
