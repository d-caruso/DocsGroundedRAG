import { useEffect, useReducer, useRef, useState } from 'react'
import { ActionIcon, Alert, AppShell, Box, Button, Center, Group, List, Loader, Modal, Slider, Stack, Text, Title, useMantineColorScheme } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { checkHealth, postQuery } from './api/query'
import { ChatInput } from './components/ChatInput'
import { MessageList } from './components/MessageList'
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
  const [inputValue, setInputValue] = useState('')
  const [helpOpened, { open: openHelp, close: closeHelp }] = useDisclosure(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const inputFocusRef = useRef<HTMLTextAreaElement | null>(null)
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
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
        <Stack gap="sm" maw={860} mx="auto">
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

          {/* Hero card */}
          <Box className="surface-block hero-surface">
            <Group justify="space-between" align="center" p="md" wrap="nowrap">
              <Group gap="sm" align="center">
                <Box
                  w={32} h={32} bg="blue.6"
                  style={{ borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  aria-hidden="true"
                >
                  <Text size="sm" c="white" fw={700}>DG</Text>
                </Box>
                <div>
                  <Title order={3} fw={700} lh={1.2}>DocsGroundedRAG</Title>
                  <Text size="xs" c="dimmed">Stripe Docs · Gemini 2.5 Flash Lite</Text>
                </div>
              </Group>
              <Group gap="xs">
                <ActionIcon
                  size="lg"
                  radius="xl"
                  variant={colorScheme === 'dark' ? 'filled' : 'light'}
                  onClick={() => toggleColorScheme()}
                  aria-label="Toggle color scheme"
                >
                  {colorSchemeIcon}
                </ActionIcon>
                <ActionIcon
                  size="lg"
                  radius="xl"
                  variant="light"
                  onClick={openHelp}
                  aria-label="Help"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M6.5 6C6.5 5.17157 7.17157 4.5 8 4.5C8.82843 4.5 9.5 5.17157 9.5 6C9.5 6.82843 8.82843 7.5 8 7.5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="8" cy="11" r="0.75" fill="currentColor" />
                  </svg>
                </ActionIcon>
              </Group>
            </Group>
          </Box>

          {/* Conversation area */}
          <Box className="surface-block conversation-surface" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
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
              onRetry={handleRetry}
            />
          </Box>

          {/* Composer */}
          <Box className="surface-block composer-surface">
            <Stack gap="xs" p="xs">
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
              <Box px="xs">
                <Group justify="space-between" mb={4}>
                  <Text size="xs" c="dimmed">More results</Text>
                  <Text size="xs" c="dimmed" fw={500}>Similarity: {state.minSimilarity.toFixed(2)}</Text>
                  <Text size="xs" c="dimmed">Higher relevance</Text>
                </Group>
                <Slider
                  min={MIN_SIMILARITY_MIN}
                  max={MIN_SIMILARITY_MAX}
                  step={MIN_SIMILARITY_STEP}
                  value={state.minSimilarity}
                  onChange={handleMinSimilarityChange}
                  label={(v) => v.toFixed(2)}
                />
              </Box>
            </Stack>
          </Box>
        </Stack>
      </AppShell.Main>

      <Modal opened={helpOpened} onClose={closeHelp} title="About DocsGroundedRAG" size="md" radius="lg">
        <Stack gap="md">
          <Text size="sm">
            DocsGroundedRAG is a retrieval-augmented generation (RAG) assistant built on top of the
            official Stripe API documentation. It answers your questions using only text found in
            the docs — it never generates information that isn't there.
          </Text>
          <div>
            <Text size="sm" fw={600} mb={4}>How it works</Text>
            <List size="sm" spacing={4}>
              <List.Item>Your question is embedded and matched against indexed Stripe doc chunks.</List.Item>
              <List.Item>Only chunks above the similarity threshold are passed to the LLM.</List.Item>
              <List.Item>The LLM (Gemini 2.5 Flash Lite) synthesises an answer strictly from those chunks.</List.Item>
            </List>
          </div>
          <div>
            <Text size="sm" fw={600} mb={4}>Similarity slider</Text>
            <Text size="sm">
              Controls the minimum cosine similarity a document chunk must reach to be included as
              context. Lower values → more chunks, broader answers, possible noise. Higher values →
              fewer chunks, tighter answers, possible gaps when the question is phrased differently
              from the docs.
            </Text>
          </div>
        </Stack>
      </Modal>
    </AppShell>
  )
}

export default App
