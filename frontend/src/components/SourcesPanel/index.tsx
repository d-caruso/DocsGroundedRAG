import { AppShell, Drawer, ScrollArea, Stack, Text } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import type { Message, SourceChunk } from '../../types'
import { SourceCard } from './SourceCard'

interface SourcesPanelProps {
  messages: Message[]
  opened: boolean
  onClose: () => void
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

export function SourcesPanel({ messages, opened, onClose }: SourcesPanelProps) {
  const isMobile = useMediaQuery('(max-width: 768px)')

  const chunks = getLatestAssistantChunks(messages)
  const emptyState = (
    <Text size="sm" c="dimmed">
      No sources found — adjust the quality slider to lower the threshold
    </Text>
  )

  if (isMobile) {
    return (
      <Drawer opened={opened} onClose={onClose} position="right" size="md" title="Sources">
        <ScrollArea.Autosize mah="70vh" offsetScrollbars>
          <Stack gap="md">
            {chunks.length === 0 ? emptyState : chunks.map((chunk) => <SourceCard key={chunk.id} chunk={chunk} />)}
          </Stack>
        </ScrollArea.Autosize>
      </Drawer>
    )
  }

  if (!opened) {
    return null
  }

  return (
    <AppShell.Aside p="md">
      <ScrollArea h="100%" offsetScrollbars>
        <Stack gap="md">
          {chunks.length === 0 ? emptyState : chunks.map((chunk) => <SourceCard key={chunk.id} chunk={chunk} />)}
        </Stack>
      </ScrollArea>
    </AppShell.Aside>
  )
}
