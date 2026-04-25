import type { RefObject } from 'react'
import { Box, Paper, ScrollArea, Stack, Text, UnstyledButton } from '@mantine/core'
import type { Message } from '../types'
import { ChatMessage } from './ChatMessage'
import { SkeletonMessage } from './SkeletonMessage'

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  bottomRef?: RefObject<HTMLDivElement | null>
  onRetry?: (message: Message) => void
  sampleQueries?: string[]
  onSampleSelect?: (query: string) => void
}

function EmptyState({
  sampleQueries,
  onSampleSelect,
}: {
  sampleQueries: string[]
  onSampleSelect?: (query: string) => void
}) {
  return (
    <Paper radius="xl" p="xl" withBorder>
      <Stack gap="md">
        <Text size="sm" fw={600}>
          Ask about the indexed Stripe documentation.
        </Text>
        <Stack gap="xs">
          {sampleQueries.map((query) => (
            <UnstyledButton
              key={query}
              onClick={() => onSampleSelect?.(query)}
              style={{
                padding: '0.75rem 0.875rem',
                borderRadius: '999px',
                border: '1px solid var(--mantine-color-gray-3)',
                background: 'var(--mantine-color-body)',
              }}
            >
              <Text size="sm">{query}</Text>
            </UnstyledButton>
          ))}
        </Stack>
      </Stack>
    </Paper>
  )
}

export function MessageList({
  messages,
  isLoading,
  bottomRef,
  onRetry,
  sampleQueries = [],
  onSampleSelect,
}: MessageListProps) {
  return (
    <ScrollArea h="100%" offsetScrollbars>
      <Stack gap="md" p="md">
        {messages.length === 0 ? (
          <EmptyState sampleQueries={sampleQueries} onSampleSelect={onSampleSelect} />
        ) : (
          messages.map((message) => <ChatMessage key={message.id} message={message} onRetry={onRetry} />)
        )}
        {isLoading ? <SkeletonMessage /> : null}
        <Box ref={bottomRef} />
      </Stack>
    </ScrollArea>
  )
}
