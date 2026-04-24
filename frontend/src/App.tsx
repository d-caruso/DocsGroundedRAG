import { AppShell, Box, Group, Stack } from '@mantine/core'
import './App.css'

function App() {
  return (
    <AppShell
      header={{ height: 76 }}
      aside={{ width: 320, breakpoint: 'md' }}
      padding="lg"
      className="app-shell"
    >
      <AppShell.Header className="shell-header">
        <Group justify="space-between" h="100%" px="lg">
          <Group gap="sm" aria-hidden="true">
            <Box className="placeholder-block placeholder-mark" />
            <Box className="placeholder-block placeholder-title" />
          </Group>
          <Box className="placeholder-block placeholder-action" aria-hidden="true" />
        </Group>
      </AppShell.Header>

      <AppShell.Main className="shell-main">
        <Stack gap="lg" aria-hidden="true">
          <Box className="surface-block hero-surface" />
          <Stack gap="md" className="surface-block conversation-surface">
            <Box className="placeholder-line placeholder-line-wide" />
            <Box className="placeholder-line placeholder-line-mid" />
            <Box className="placeholder-line placeholder-line-narrow" />
          </Stack>
          <Box className="surface-block composer-surface" />
        </Stack>
      </AppShell.Main>

      <AppShell.Aside className="shell-aside" p="lg">
        <Stack gap="md" aria-hidden="true">
          <Box className="surface-block aside-header" />
          <Box className="surface-block aside-card" />
          <Box className="surface-block aside-card" />
          <Box className="surface-block aside-card" />
        </Stack>
      </AppShell.Aside>
    </AppShell>
  )
}

export default App
