import { Box, Paper, Text } from '@mantine/core'
import type { Message } from '../types'

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <Paper
        radius="lg"
        px="md"
        py="sm"
        maw={720}
        withBorder={!isUser}
        bg={isUser ? 'blue.6' : 'var(--mantine-color-body)'}
        c={isUser ? 'white' : 'var(--mantine-color-text)'}
        shadow={isUser ? 'sm' : undefined}
      >
        <Text
          size="sm"
          style={{
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
          }}
        >
          {message.content}
        </Text>
      </Paper>
    </Box>
  )
}
