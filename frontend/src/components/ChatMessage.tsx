import { ActionIcon, Alert, Box, Code, Group, Paper, Text } from '@mantine/core'
import { CodeHighlight } from '@mantine/code-highlight'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message } from '../types'

interface ChatMessageProps {
  message: Message
  onRetry?: (message: Message) => void
}

const markdownComponents: Components = {
  code({ children, className, ...props }) {
    const language = className?.match(/language-(\w+)/)?.[1]
    const code = String(children).replace(/\n$/, '')

    if (!language) {
      return (
        <Code {...props}>
          {code}
        </Code>
      )
    }

    return <CodeHighlight code={code} language={language} />
  },
}

export function ChatMessage({ message, onRetry }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  if (message.status === 'error') {
    return (
      <Box
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
        }}
      >
        <Alert
          radius="lg"
          variant="light"
          color="red"
          p="sm"
          maw={720}
          w="100%"
        >
          <Group justify="space-between" gap="sm" wrap="nowrap">
            <Text
              size="sm"
              style={{
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
              }}
            >
              {message.content}
            </Text>
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={() => onRetry?.(message)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M3.5 8A4.5 4.5 0 0 1 11 4.646M11 4.646V2.5M11 4.646H8.854"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12.5 8A4.5 4.5 0 0 1 5 11.354M5 11.354V13.5M5 11.354H7.146"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </ActionIcon>
          </Group>
        </Alert>
      </Box>
    )
  }

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
        {isAssistant ? (
          <Box
            style={{
              fontSize: 'var(--mantine-font-size-sm)',
              overflowWrap: 'anywhere',
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
          </Box>
        ) : (
          <Text
            size="sm"
            style={{
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
            }}
          >
            {message.content}
          </Text>
        )}
      </Paper>
    </Box>
  )
}
