import { useEffect, useReducer, useRef } from 'react'
import { AppShell, Box, Group, Stack } from '@mantine/core'
import { checkHealth } from './api/query'
import { ChatInput } from './components/ChatInput'
import { MessageList } from './components/MessageList'
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
  const bottomRef = useRef<HTMLDivElement | null>(null)

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
          <Box className="placeholder-block placeholder-action" aria-hidden="true" />
        </Group>
      </AppShell.Header>

      <AppShell.Main className="shell-main">
        <Stack gap="lg" style={{ flex: 1 }}>
          <Box className="surface-block hero-surface" />
          <Box className="surface-block conversation-surface">
            <MessageList messages={state.messages} isLoading={state.isLoading} bottomRef={bottomRef} />
          </Box>
          <Box className="surface-block composer-surface">
            <ChatInput
              backendReady={state.backendReady}
              isLoading={state.isLoading}
              onSubmit={(value) => {
                dispatch({ type: 'SEND_MESSAGE', payload: { content: value } })
              }}
            />
          </Box>
        </Stack>
      </AppShell.Main>

      <AppShell.Aside className="shell-aside" p="lg">
        <Stack gap="md" aria-hidden="true">
          <Box className="surface-block aside-header" />
          <Box className="surface-block aside-card" />
          <Box className="surface-block aside-card" />
          <Box className="surface-block aside-card" />
        </Stack>
      </AppShell.Aside>
    </AppShell>
  )
}

export default App
