import { useEffect, useReducer, useRef, useState } from 'react'
import { ActionIcon, Alert, AppShell, Badge, Box, Button, Center, Group, Loader, Slider, Stack, Text, Title, Tooltip, useMantineColorScheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { checkHealth, postQuery } from './api/query'
import { ChatInput } from './components/ChatInput'
import { MessageList } from './components/MessageList'
import { SourcesPanel } from './components/SourcesPanel'
import { MIN_SIMILARITY_DEFAULT, MIN_SIMILARITY_MIN, MIN_SIMILARITY_MAX, MIN_SIMILARITY_STEP } from './types'
import type { ChatState, Message, SourceChunk } from './types'
import './App.css'

type ChatAction =
  | { type: 'SEND_MESSAGE'; payload: { content: string } }
  | { type: 'SET_LOADING'; payload: { isLoading: boolean } }
  | { type: 'RECEIVE_RESPONSE'; payload: { content: string; chunks: SourceChunk[] } }
  | { type: 'SET_ERROR'; payload: { content: string } }
  | { type: 'SET_BACKEND_READY'; payload: { backendReady: boolean } }
  | { type: 'SET_BACKEND_ERROR'; payload: { backendError: string | null } }
  | { type: 'SET_MIN_SIMILARITY'; payload: { minSimilarity: number } }

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  backendReady: false,
  backendError: null,
  minSimilarity: MIN_SIMILARITY_DEFAULT,
}

function createMessage(message: Omit<Message, 'id' | 'timestamp'>): Message {
  return {
    ...message,
    id: crypto.randomUUID(),
    timestamp: new Date(),
  }
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SEND_MESSAGE':
      return {
        ...state,
        messages: [
          ...state.messages,
          createMessage({ role: 'user', content: action.payload.content, status: 'done', chunks: [] }),
        ],
      }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload.isLoading }
    case 'RECEIVE_RESPONSE':
      return {
        ...state,
        isLoading: false,
        messages: [
          ...state.messages,
          createMessage({ role: 'assistant', content: action.payload.content, status: 'done', chunks: action.payload.chunks }),
        ],
      }
    case 'SET_ERROR':
      return {
        ...state,
        isLoading: false,
        messages: [
          ...state.messages,
          createMessage({ role: 'assistant', content: action.payload.content, status: 'error', chunks: [] }),
        ],
      }
    case 'SET_BACKEND_READY':
      return { ...state, backendReady: action.payload.backendReady, backendError: null }
    case 'SET_BACKEND_ERROR':
      return { ...state, backendError: action.payload.backendError }
    case 'SET_MIN_SIMILARITY':
      return { ...state, minSimilarity: action.payload.minSimilarity }
    default:
      return state
  }
}

function App() {
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const inputFocusRef = useRef<HTMLTextAreaElement | null>(null)
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const sampleQueries = [
    'When should I use Checkout Sessions instead of Payment Intents?',
    'How does Stripe describe the Payment Intents flow?',
    'What does Stripe say about the responsibilities of Checkout Sessions?',
  ]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages.length])

  const runHealthCheck = (attempt = 0) => {
    dispatch({ type: 'SET_BACKEND_ERROR', payload: { backendError: null } })
    checkHealth()
      .then(() => {
        dispatch({ type: 'SET_BACKEND_READY', payload: { backendReady: true } })
      })
      .catch((error: unknown) => {
        if (attempt < 1) {
          window.setTimeout(() => runHealthCheck(attempt + 1), 5000)
          return
        }
        const message = error instanceof Error ? error.message : 'Backend is unreachable.'
        dispatch({ type: 'SET_BACKEND_ERROR', payload: { backendError: message } })
      })
  }

  useEffect(() => {
    runHealthCheck()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submitQuery = (value: string, minSimilarity: number = state.minSimilarity) => {
    dispatch({ type: 'SET_LOADING', payload: { isLoading: true } })
    postQuery(value, minSimilarity)
      .then((response) => {
        dispatch({ type: 'RECEIVE_RESPONSE', payload: { content: response.answer, chunks: response.chunks } })
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Something went wrong.'
        dispatch({ type: 'SET_ERROR', payload: { content: message } })
      })
  }

  const findLastUserContent = (): string | null => {
    for (let index = state.messages.length - 1; index >= 0; index -= 1) {
      const message = state.messages[index]
      if (message.role === 'user') return message.content
    }
    return null
  }

  const handleRetry = () => {
    const last = findLastUserContent()
    if (last !== null) submitQuery(last)
  }

  const handleMinSimilarityChange = (value: number) => {
    dispatch({ type: 'SET_MIN_SIMILARITY', payload: { minSimilarity: value } })
  }

  const handleMinSimilarityCommit = (value: number) => {
    dispatch({ type: 'SET_MIN_SIMILARITY', payload: { minSimilarity: value } })
    const last = findLastUserContent()
    if (last !== null && state.backendReady && !state.isLoading) {
      submitQuery(last, value)
    }
  }

  const colorSchemeIcon = colorScheme === 'dark' ? (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M16.3 11.25a7.3 7.3 0 0 1-3.8 1.06A7.31 7.31 0 0 1 5.19 5a7.3 7.3 0 0 1 1.06-3.8A7.31 7.31 0 0 0 2.25 9a6.75 6.75 0 0 0 13.5 0 7.3 7.3 0 0 1-.45 2.25Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="9" cy="9" r="3.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 2.5V1.25M9 16.75V15.5M15.5 9H16.75M1.25 9H2.5M13.35 4.65L14.2 3.8M3.8 14.2L4.65 13.35M13.35 13.35L14.2 14.2M3.8 3.8L4.65 4.65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )

  return (
    <AppShell
      padding="lg"
      className="app-shell"
    >
      <AppShell.Main className="shell-main">
        <Stack gap="lg" maw={860} mx="auto">
          {state.backendError ? (
            <Alert color="red" variant="light" radius="lg" title="Backend unreachable">
              <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
                <Text size="sm">{state.backendError}</Text>
                <Button size="xs" variant="filled" color="red" onClick={() => runHealthCheck()}>
                  Retry
                </Button>
              </Group>
            </Alert>
          ) : null}

          {/* Hero card: logo + title + dark-mode toggle + description + badges */}
          <Box className="surface-block hero-surface">
            <Stack gap="xs" p="xl">
              <Group justify="space-between" align="center">
                <Group gap="sm">
                  <Box
                    w={32} h={32} bg="blue.6"
                    style={{ borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    aria-hidden="true"
                  >
                    <Text size="sm" c="white" fw={700}>DG</Text>
                  </Box>
                  <Title order={2} fw={700}>DocsGroundedRAG</Title>
                </Group>
                <ActionIcon
                  size="lg"
                  radius="xl"
                  variant={colorScheme === 'dark' ? 'filled' : 'light'}
                  onClick={() => toggleColorScheme()}
                  aria-label="Toggle color scheme"
                >
                  {colorSchemeIcon}
                </ActionIcon>
              </Group>
              <Text size="md" c="dimmed" maw={560}>
                Ask questions about Stripe API documentation. Answers are grounded
                strictly in the source text — no hallucinations, no guessing.
              </Text>
              <Group gap="xs" mt="xs">
                <Badge variant="light" color="blue" size="sm">Stripe Docs</Badge>
                <Badge variant="light" color="violet" size="sm">Gemini 2.5 Flash Lite</Badge>
              </Group>
            </Stack>
          </Box>

          {/* Conversation area */}
          <Box className="surface-block conversation-surface" style={{ position: 'relative' }}>
            {state.isLoading && (
              <Center
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 10,
                  borderRadius: 18,
                  backgroundColor: 'var(--mantine-color-body)',
                  opacity: 0.85,
                }}
              >
                <Loader size="lg" />
              </Center>
            )}
            <MessageList
              messages={state.messages}
              isLoading={state.isLoading}
              bottomRef={bottomRef}
              showSourcesToggle={isMobile}
              onToggleSources={() => setAdvancedOpen((v) => !v)}
              onRetry={handleRetry}
            />
          </Box>

          {/* Composer: input + sample chips + settings toggle */}
          <Box className="surface-block composer-surface">
            <Stack gap="xs">
              <ChatInput
                backendReady={state.backendReady}
                isLoading={state.isLoading}
                value={inputValue}
                onChange={setInputValue}
                onSubmit={(value) => {
                  dispatch({ type: 'SEND_MESSAGE', payload: { content: value } })
                  setInputValue('')
                  submitQuery(value)
                  inputFocusRef.current?.focus()
                }}
                inputRef={inputFocusRef}
              />
              <Stack gap="xs">
                {sampleQueries.map((query) => (
                  <Button
                    key={query}
                    variant="default"
                    size="xs"
                    radius="xl"
                    fullWidth
                    onClick={() => setInputValue(query)}
                    styles={{ label: { whiteSpace: 'normal', textAlign: 'left' } }}
                  >
                    {query}
                  </Button>
                ))}
              </Stack>
              <Group align="center" gap="md" px="xs">
                <Tooltip label={advancedOpen ? 'Hide sources' : 'Show sources'}>
                  <ActionIcon
                    size="xl"
                    radius="xl"
                    variant={advancedOpen ? 'filled' : 'subtle'}
                    onClick={() => setAdvancedOpen((v) => !v)}
                    aria-label="Toggle sources"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M3 4.5H7.5M11.5 4.5H15M3 9H6M10 9H15M3 13.5H7.5M11.5 13.5H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <circle cx="9.5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="8" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="9.5" cy="13.5" r="2" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </ActionIcon>
                </Tooltip>
                <Box style={{ flex: 1 }}>
                  <Group justify="space-between" mb={4}>
                    <Text size="xs" c="dimmed">More results</Text>
                    <Text size="xs" c="dimmed">Higher relevance</Text>
                  </Group>
                  <Slider
                    min={MIN_SIMILARITY_MIN}
                    max={MIN_SIMILARITY_MAX}
                    step={MIN_SIMILARITY_STEP}
                    value={state.minSimilarity}
                    onChange={handleMinSimilarityChange}
                    onChangeEnd={handleMinSimilarityCommit}
                    label={(v) => v.toFixed(2)}
                  />
                </Box>
              </Group>
            </Stack>
          </Box>
        </Stack>
      </AppShell.Main>

      <SourcesPanel
        messages={state.messages}
        opened={advancedOpen}
        onClose={() => setAdvancedOpen(false)}
      />
    </AppShell>
  )
}

export default App
