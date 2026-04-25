import type { MantineColor } from '@mantine/core'

export const SOURCE_SCORE_GREEN_THRESHOLD = 0.85
export const SOURCE_SCORE_YELLOW_THRESHOLD = 0.75

export const SOURCE_SCORE_GREEN_COLOR: MantineColor = 'green'
export const SOURCE_SCORE_YELLOW_COLOR: MantineColor = 'yellow'

export function scoreToColor(score: number): MantineColor {
  if (score >= SOURCE_SCORE_GREEN_THRESHOLD) {
    return SOURCE_SCORE_GREEN_COLOR
  }

  if (score >= SOURCE_SCORE_YELLOW_THRESHOLD) {
    return SOURCE_SCORE_YELLOW_COLOR
  }

  return SOURCE_SCORE_YELLOW_COLOR
}
