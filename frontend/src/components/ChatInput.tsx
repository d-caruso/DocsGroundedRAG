import { useState } from 'react'
import { ActionIcon, Group, Loader, Paper, Textarea } from '@mantine/core'

interface ChatInputProps {
  isLoading: boolean
  onSubmit: (value: string) => void
}

export function ChatInput({ isLoading, onSubmit }: ChatInputProps) {
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    const trimmedValue = value.trim()

    if (!trimmedValue || isLoading) {
      return
    }

    onSubmit(trimmedValue)
    setValue('')
  }

  return (
    <Paper withBorder radius="xl" p="sm">
      <Group align="flex-end" gap="sm" wrap="nowrap">
        <Textarea
          autosize
          minRows={1}
          maxRows={5}
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              handleSubmit()
            }
          }}
          placeholder=""
          style={{ flex: 1 }}
        />

        <ActionIcon
          size="lg"
          radius="xl"
          variant="filled"
          onClick={handleSubmit}
          disabled={isLoading || value.trim().length === 0}
          aria-label="Send"
        >
          {isLoading ? (
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
      </Group>
    </Paper>
  )
}
