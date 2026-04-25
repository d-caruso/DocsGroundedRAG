import { ActionIcon, Group, Loader, Paper, Textarea, Tooltip } from '@mantine/core'
import { useEffect, useRef, type RefObject } from 'react'

interface ChatInputProps {
  backendReady: boolean
  isLoading: boolean
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  inputRef?: RefObject<HTMLTextAreaElement | null>
}

export function ChatInput({
  backendReady,
  isLoading,
  value,
  onChange,
  onSubmit,
  inputRef,
}: ChatInputProps) {
  const internalInputRef = useRef<HTMLTextAreaElement | null>(null)
  const buttonDisabled = !backendReady || isLoading || value.trim().length === 0

  useEffect(() => {
    if (!isLoading) {
      (inputRef ?? internalInputRef).current?.focus()
    }
  }, [inputRef, isLoading])

  const handleSubmit = () => {
    const trimmedValue = value.trim()

    if (!trimmedValue || !backendReady || isLoading) {
      return
    }

    onSubmit(trimmedValue)
  }

  return (
    <Paper withBorder radius="xl" p="sm">
      <Group align="flex-end" gap="sm" wrap="nowrap">
        <Textarea
          ref={inputRef ?? internalInputRef}
          autosize
          minRows={1}
          maxRows={5}
          disabled={false}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="Ask about the indexed Stripe documentation..."
          style={{ flex: 1 }}
        />

        <Tooltip label="Warming up..." disabled={backendReady}>
          <ActionIcon
            size="lg"
            radius="xl"
            variant="filled"
            onClick={handleSubmit}
            disabled={buttonDisabled}
            aria-label="Send"
          >
            {!backendReady || isLoading ? (
              <Loader size={18} color="white" />
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M9 14V4M9 4L5.5 7.5M9 4L12.5 7.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </ActionIcon>
        </Tooltip>
      </Group>
    </Paper>
  )
}
