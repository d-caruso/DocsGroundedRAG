import { AppShell, ScrollArea, Stack } from '@mantine/core'
import type { Message, SourceChunk } from '../../types'
import { SourceCard } from './SourceCard'

interface SourcesPanelProps {
  messages: Message[]
  opened: boolean
}

function getLatestAssistantChunks(messages: Message[]): SourceChunk[] {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]

    if (message.role === 'assistant') {
      return message.chunks
    }
  }

  return []
}

export function SourcesPanel({ messages, opened }: SourcesPanelProps) {
  if (!opened) {
    return null
  }

  const chunks = getLatestAssistantChunks(messages)

  return (
    <AppShell.Aside p="md">
      <ScrollArea h="100%" offsetScrollbars>
        <Stack gap="md">
          {chunks.map((chunk) => (
            <SourceCard key={chunk.id} chunk={chunk} />
          ))}
        </Stack>
      </ScrollArea>
    </AppShell.Aside>
  )
}
