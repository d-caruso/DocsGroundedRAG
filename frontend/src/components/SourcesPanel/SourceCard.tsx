import { Anchor, Badge, Card, Group, Stack, Text } from '@mantine/core'
import type { SourceChunk } from '../../types'
import { scoreToColor } from './constants'

interface SourceCardProps {
  chunk: SourceChunk
}

export function SourceCard({ chunk }: SourceCardProps) {
  const sectionLabel = chunk.metadata.section || chunk.metadata.category

  return (
    <Card withBorder radius="lg" padding="md">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <Text size="xs" c="dimmed">
            {sectionLabel}
          </Text>
          <Badge color={scoreToColor(chunk.score)} variant="light">
            {chunk.score.toFixed(2)}
          </Badge>
        </Group>

        <Text fw={600} size="sm">
          {chunk.metadata.title}
        </Text>

        <Text size="sm" c="dimmed" lineClamp={3}>
          {chunk.excerpt}
        </Text>

        {chunk.metadata.url ? (
          <Anchor
            href={chunk.metadata.url}
            target="_blank"
            rel="noreferrer"
            size="sm"
          >
            View source
          </Anchor>
        ) : null}
      </Stack>
    </Card>
  )
}
