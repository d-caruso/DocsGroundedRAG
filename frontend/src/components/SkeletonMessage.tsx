import { Box, Paper, Skeleton, Stack } from '@mantine/core'

export function SkeletonMessage() {
  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
      }}
    >
      <Paper radius="lg" px="md" py="sm" maw={720} withBorder>
        <Stack gap="xs">
          <Skeleton height={12} radius="xl" width="90%" />
          <Skeleton height={12} radius="xl" width="70%" />
          <Skeleton height={12} radius="xl" width="40%" />
        </Stack>
      </Paper>
    </Box>
  )
}
