import { useEffect, useReducer, useRef, useState } from 'react'
import { ActionIcon, AppShell, Box, Group, Stack, Text, Title, useMantineColorScheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { checkHealth, postQuery } from './api/query'
import { ChatInput } from './components/ChatInput'
import { MessageList } from './components/MessageList'
import { SourcesPanel } from './components/SourcesPanel'
import type { ChatState, Message, SourceChunk } from './types'
import './App.css'

type ChatAction =
  | { type: 'SEND_MESSAGE'; payload: { content: string } }
  | { type: 'SET_LOADING'; payload: { isLoading: boolean } }
  | { type: 'RECEIVE_RESPONSE'; payload: { content: string; chunks: SourceChunk[] } }
  | { type: 'SET_ERROR'; payload: { content: string } }
  | { type: 'SET_BACKEND_READY'; payload: { backendReady: boolean } }

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  backendReady: false,
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
          createMessage({
            role: 'user',
            content: action.payload.content,
            status: 'done',
            chunks: [],
          }),
        ],
      }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload.isLoading,
      }
    case 'RECEIVE_RESPONSE':
      return {
        ...state,
        isLoading: false,
        messages: [
          ...state.messages,
          createMessage({
            role: 'assistant',
            content: action.payload.content,
            status: 'done',
            chunks: action.payload.chunks,
          }),
        ],
      }
    case 'SET_ERROR':
      return {
        ...state,
        isLoading: false,
        messages: [
          ...state.messages,
          createMessage({
            role: 'assistant',
            content: action.payload.content,
            status: 'error',
            chunks: [],
          }),
        ],
      }
    case 'SET_BACKEND_READY':
      return {
        ...state,
        backendReady: action.payload.backendReady,
      }
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

  useEffect(() => {
    void checkHealth().then(() => {
      dispatch({ type: 'SET_BACKEND_READY', payload: { backendReady: true } })
    })
  }, [])

  const submitQuery = (value: string) => {
    dispatch({ type: 'SET_LOADING', payload: { isLoading: true } })
    postQuery(value)
      .then((response) => {
        dispatch({
          type: 'RECEIVE_RESPONSE',
          payload: { content: response.answer, chunks: response.chunks },
        })
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Something went wrong.'
        dispatch({ type: 'SET_ERROR', payload: { content: message } })
      })
  }

  const handleRetry = () => {
    for (let index = state.messages.length - 1; index >= 0; index -= 1) {
      const message = state.messages[index]
      if (message.role === 'user') {
        submitQuery(message.content)
        return
      }
    }
  }

  return (
    <AppShell
      header={{ height: 76 }}
      aside={{ width: 320, breakpoint: 'md' }}
      padding="lg"
      className="app-shell"
    >
      <AppShell.Header className="shell-header">
        <Group justify="space-between" h="100%" px="lg">
          <Group gap="sm">
            <Box
              w={32}
              h={32}
              bg="blue.6"
              style={{
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
              }}
              aria-hidden="true"
            >
              <Text size="sm" c="white" fw={700}>
                DG
              </Text>
            </Box>
            <Title order={4} fw={600}>
              DocsGroundedRAG
            </Title>
          </Group>
          <ActionIcon
            size="lg"
            radius="xl"
            variant={colorScheme === 'dark' ? 'filled' : 'light'}
            onClick={() => toggleColorScheme()}
            aria-label="Toggle color scheme"
            title="Toggle color scheme"
          >
            {colorScheme === 'dark' ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M13.2 11.2A5.8 5.8 0 1 1 6.8 4.8a6.8 6.8 0 1 0 6.4 6.4Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <circle cx="9" cy="9" r="3.75" stroke="currentColor" strokeWidth="1.5" />
                <path d="M9 2.5V1.25M9 16.75V15.5M15.5 9H16.75M1.25 9H2.5M13.35 4.65L14.2 3.8M3.8 14.2L4.65 13.35M13.35 13.35L14.2 14.2M3.8 3.8L4.65 4.65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </ActionIcon>
          <ActionIcon
            size="lg"
            radius="xl"
            variant={advancedOpen ? 'filled' : 'light'}
            onClick={() => setAdvancedOpen((value) => !value)}
            aria-label="Toggle advanced"
            title="Toggle advanced"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M4 5H14M4 9H14M4 13H14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </ActionIcon>
        </Group>
      </AppShell.Header>

      <AppShell.Main className="shell-main">
        <Stack gap="lg" style={{ flex: 1 }}>
          <Box className="surface-block hero-surface" />
          <Box className="surface-block conversation-surface">
            <MessageList
              messages={state.messages}
              isLoading={state.isLoading}
              bottomRef={bottomRef}
              sampleQueries={sampleQueries}
              onSampleSelect={setInputValue}
              showSourcesToggle={isMobile}
              onToggleSources={() => setAdvancedOpen((value) => !value)}
              onRetry={handleRetry}
            />
          </Box>
          <Box className="surface-block composer-surface">
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
