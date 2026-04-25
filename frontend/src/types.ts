export interface SourceChunkMetadata {
  source_file: string
  category: string
  title: string | null
  section: string | null
  url: string | null
}

export interface SourceChunk {
  id: string
  score: number
  excerpt: string
  content: string
  metadata: SourceChunkMetadata
}

export type MessageRole = 'user' | 'assistant'

export type MessageStatus = 'done' | 'loading' | 'error'

export interface Message {
  id: string
  role: MessageRole
  content: string
  status: MessageStatus
  chunks: SourceChunk[]
  timestamp: Date
}

export interface ChatState {
  messages: Message[]
  isLoading: boolean
  backendReady: boolean
  backendError: string | null
  minSimilarity: number
}

export interface QueryRequest {
  query: string
  min_similarity?: number
}

export const MIN_SIMILARITY_DEFAULT = 0.7
export const MIN_SIMILARITY_MIN = 0.6
export const MIN_SIMILARITY_MAX = 0.95
export const MIN_SIMILARITY_STEP = 0.05

export interface QueryResponse {
  answer: string
  chunks: SourceChunk[]
}

export type ApiErrorCode = 'config_error' | 'http_error' | 'network_error' | 'unknown_error'

export interface ApiError extends Error {
  code: ApiErrorCode
  status?: number
}
