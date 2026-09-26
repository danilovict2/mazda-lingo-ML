import type { HealthResponse, AnalysisResponse } from '~/types/puzzle'

export const useApi = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  const health = async (): Promise<HealthResponse> => {
    try {
      const response = await $fetch<HealthResponse>(`${apiBase}/api/health`)
      return response
    } catch (error) {
      console.error('Health check failed:', error)
      throw error
    }
  }

  const analyze = async (audio: Blob, puzzleId: string): Promise<AnalysisResponse> => {
    const formData = new FormData()
    formData.append('audio', audio, 'recording.wav')
    formData.append('puzzle_id', puzzleId)

    try {
      const response = await $fetch<AnalysisResponse>(`${apiBase}/api/analyze`, {
        method: 'POST',
        body: formData,
      })
      return response
    } catch (error) {
      console.error('Analysis failed:', error)
      throw error
    }
  }

  return {
    health,
    analyze,
  }
}
