import { Component, type ReactNode } from 'react'
import { Alert, Button, Stack, Text } from '@mantine/core'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert
          variant="light"
          color="red"
          title="Something went wrong"
          styles={{
            root: {
              minHeight: '100vh',
            },
          }}
        >
          <Stack gap="sm">
            <Text size="sm">
              The app hit an unexpected error. Reload the page to reconnect.
            </Text>
            <Button
              variant="light"
              onClick={() => {
                window.location.reload()
              }}
            >
              Reconnect
            </Button>
          </Stack>
        </Alert>
      )
    }

    return this.props.children
  }
}
