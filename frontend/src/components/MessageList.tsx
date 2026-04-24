import type { RefObject } from 'react'
import { Box, Paper, ScrollArea, Stack } from '@mantine/core'
import type { Message } from '../types'
import { ChatMessage } from './ChatMessage'
import { SkeletonMessage } from './SkeletonMessage'

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  bottomRef?: RefObject<HTMLDivElement | null>
}

function EmptyState() {
  return (
    <Paper radius="xl" p="xl" withBorder>
      <Stack gap="md" aria-hidden="true">
        <Box h={16} w="42%" style={{ borderRadius: 999, background: 'var(--mantine-color-gray-3)' }} />
        <Box h={12} w="88%" style={{ borderRadius: 999, background: 'var(--mantine-color-gray-2)' }} />
        <Box h={12} w="76%" style={{ borderRadius: 999, background: 'var(--mantine-color-gray-2)' }} />
      </Stack>
    </Paper>
  )
}

export function MessageList({ messages, isLoading, bottomRef }: MessageListProps) {
  return (
    <ScrollArea h="100%" offsetScrollbars>
      <Stack gap="md" p="md">
        {messages.length === 0 ? <EmptyState /> : messages.map((message) => <ChatMessage key={message.id} message={message} />)}
        {isLoading ? <SkeletonMessage /> : null}
        <Box ref={bottomRef} />
      </Stack>
    </ScrollArea>
  )
}
