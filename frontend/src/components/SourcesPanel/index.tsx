import { AppShell, Box, Drawer, Group, ScrollArea, Slider, Stack, Text } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  MIN_SIMILARITY_MAX,
  MIN_SIMILARITY_MIN,
  MIN_SIMILARITY_STEP,
  type Message,
  type SourceChunk,
} from '../../types'
import { SourceCard } from './SourceCard'

interface SourcesPanelProps {
  messages: Message[]
  opened: boolean
  onClose: () => void
  minSimilarity: number
  onMinSimilarityChange: (value: number) => void
  onMinSimilarityCommit: (value: number) => void
}

function MinSimilaritySlider({
  value,
  onChange,
  onChangeEnd,
}: {
  value: number
  onChange: (value: number) => void
  onChangeEnd: (value: number) => void
}) {
  return (
    <Box>
      <Text size="xs" fw={600} mb={6}>
        Minimum similarity: {value.toFixed(2)}
      </Text>
      <Group justify="space-between" mb={4}>
        <Text size="xs" c="dimmed">
          More results
        </Text>
        <Text size="xs" c="dimmed">
          Higher relevance
        </Text>
      </Group>
      <Slider
        min={MIN_SIMILARITY_MIN}
        max={MIN_SIMILARITY_MAX}
        step={MIN_SIMILARITY_STEP}
        value={value}
        onChange={onChange}
        onChangeEnd={onChangeEnd}
        label={(v) => v.toFixed(2)}
        marks={[
          { value: MIN_SIMILARITY_MIN, label: MIN_SIMILARITY_MIN.toFixed(2) },
          { value: MIN_SIMILARITY_MAX, label: MIN_SIMILARITY_MAX.toFixed(2) },
        ]}
      />
    </Box>
  )
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

export function SourcesPanel({
  messages,
  opened,
  onClose,
  minSimilarity,
  onMinSimilarityChange,
  onMinSimilarityCommit,
}: SourcesPanelProps) {
  const isMobile = useMediaQuery('(max-width: 768px)')

  const chunks = getLatestAssistantChunks(messages)
  const emptyState = (
    <Text size="sm" c="dimmed">
      No sources found — adjust the quality slider to lower the threshold
    </Text>
  )

  const slider = (
    <MinSimilaritySlider
      value={minSimilarity}
      onChange={onMinSimilarityChange}
      onChangeEnd={onMinSimilarityCommit}
    />
  )

  if (isMobile) {
    return (
      <Drawer opened={opened} onClose={onClose} position="right" size="md" title="Advanced">
        <ScrollArea.Autosize mah="70vh" offsetScrollbars>
          <Stack gap="md">
            {slider}
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
          {slider}
          {chunks.length === 0 ? emptyState : chunks.map((chunk) => <SourceCard key={chunk.id} chunk={chunk} />)}
        </Stack>
      </ScrollArea>
    </AppShell.Aside>
  )
}
