import { useEffect, useReducer, useRef, useState } from 'react'
import { ActionIcon, AppShell, Box, Group, Stack } from '@mantine/core'
import { checkHealth } from './api/query'
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

  return (
    <AppShell
      header={{ height: 76 }}
      aside={{ width: 320, breakpoint: 'md' }}
      padding="lg"
      className="app-shell"
    >
      <AppShell.Header className="shell-header">
        <Group justify="space-between" h="100%" px="lg">
          <Group gap="sm" aria-hidden="true">
            <Box className="placeholder-block placeholder-mark" />
            <Box className="placeholder-block placeholder-title" />
          </Group>
          <ActionIcon
            size="lg"
            radius="xl"
            variant={advancedOpen ? 'filled' : 'light'}
            onClick={() => setAdvancedOpen((value) => !value)}
            aria-label="Toggle advanced"
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
              }}
            />
          </Box>
        </Stack>
      </AppShell.Main>

      <SourcesPanel messages={state.messages} opened={advancedOpen} />
    </AppShell>
  )
}

export default App
