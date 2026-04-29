import type { RefObject } from 'react'
import { Box, ScrollArea, Stack } from '@mantine/core'
import type { Message } from '../types'
import { ChatMessage } from './ChatMessage'
import { SkeletonMessage } from './SkeletonMessage'

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  bottomRef?: RefObject<HTMLDivElement | null>
  onRetry?: (message: Message) => void
  onToggleSources?: () => void
  showSourcesToggle?: boolean
}

export function MessageList({
  messages,
  isLoading,
  bottomRef,
  onRetry,
  onToggleSources,
  showSourcesToggle = false,
}: MessageListProps) {
  const latestAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant')
  const latestAssistantMessageId = latestAssistantMessage?.id
  const latestAssistantSourcesCount = latestAssistantMessage?.chunks.length ?? 0

  return (
    <ScrollArea style={{ flex: 1 }} offsetScrollbars>
      <Stack gap="md" p="md" role="log" aria-live="polite" aria-relevant="additions text">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onRetry={onRetry}
            onToggleSources={
              showSourcesToggle && message.id === latestAssistantMessageId
                ? onToggleSources
                : undefined
            }
            sourcesCount={
              showSourcesToggle && message.id === latestAssistantMessageId
                ? latestAssistantSourcesCount
                : undefined
            }
          />
        ))}
        {isLoading ? <SkeletonMessage /> : null}
        <Box ref={bottomRef} />
      </Stack>
    </ScrollArea>
  )
}
