import { ActionIcon, Alert, Box, Button, Code, Group, Paper, ScrollArea, Stack, Text } from '@mantine/core'
import { CodeHighlight } from '@mantine/code-highlight'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message } from '../types'

interface ChatMessageProps {
  message: Message
  onRetry?: (message: Message) => void
  onToggleSources?: () => void
  sourcesCount?: number
}

const markdownComponents: Components = {
  code({ children, className, ...props }) {
    const language = className?.match(/language-(\w+)/)?.[1]
    const code = String(children).replace(/\n$/, '')
    const isBlock = Boolean(language) || code.includes('\n')

    if (!isBlock) {
      return (
        <Code {...props}>
          {code}
        </Code>
      )
    }

    return <CodeHighlight code={code} language={language ?? 'text'} />
  },
}

export function ChatMessage({ message, onRetry, onToggleSources, sourcesCount }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const formattedTimestamp = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(message.timestamp)

  if (message.status === 'error') {
    return (
      <Box style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Alert radius="lg" variant="light" color="red" p="sm" maw={720}>
          <Group justify="space-between" gap="sm" wrap="nowrap">
            <Box style={{ flex: 1 }}>
              <Text size="sm" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {message.content}
              </Text>
              <Text size="xs" c="dimmed" mt={6}>
                {formattedTimestamp}
              </Text>
            </Box>
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={() => onRetry?.(message)}
              aria-label="Retry message"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M3.5 8A4.5 4.5 0 0 1 11 4.646M11 4.646V2.5M11 4.646H8.854" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12.5 8A4.5 4.5 0 0 1 5 11.354M5 11.354V13.5M5 11.354H7.146" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </ActionIcon>
          </Group>
        </Alert>
      </Box>
    )
  }

  return (
    <Box style={{ display: 'flex', justifyContent: isUser ? 'flex-start' : 'flex-end' }}>
      <Paper
        radius="lg"
        px="md"
        py="sm"
        maw={720}
        withBorder={!isUser}
        bg={isUser ? 'blue.6' : 'blue.0'}
        c={isUser ? 'white' : 'var(--mantine-color-text)'}
        shadow={isUser ? 'sm' : undefined}
      >
        {isAssistant ? (
          <Box style={{ position: 'relative' }}>
            <ActionIcon
              variant="subtle"
              size="sm"
              aria-label="Copy answer"
              onClick={() => { void navigator.clipboard.writeText(message.content) }}
              style={{ position: 'absolute', top: 0, right: 0, zIndex: 1 }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6 2.5H11.5C12.0523 2.5 12.5 2.94772 12.5 3.5V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <rect x="3.5" y="5.5" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </ActionIcon>
            <Stack gap="xs" pt="1.75rem">
              {onToggleSources && sourcesCount && sourcesCount > 0 ? (
                <Button variant="light" size="xs" onClick={onToggleSources} w="fit-content">
                  Sources ({sourcesCount})
                </Button>
              ) : null}
              <ScrollArea.Autosize mah="60vh" type="scroll" offsetScrollbars>
                <Box style={{ fontSize: 'var(--mantine-font-size-sm)', overflowWrap: 'anywhere' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {message.content}
                  </ReactMarkdown>
                  <Text size="xs" c="dimmed" mt="sm">
                    {formattedTimestamp}
                  </Text>
                </Box>
              </ScrollArea.Autosize>
            </Stack>
          </Box>
        ) : (
          <Box>
            <Text size="sm" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {message.content}
            </Text>
            <Text size="xs" c={isUser ? 'rgba(255, 255, 255, 0.72)' : 'dimmed'} mt={6}>
              {formattedTimestamp}
            </Text>
          </Box>
        )}
      </Paper>
    </Box>
  )
}
