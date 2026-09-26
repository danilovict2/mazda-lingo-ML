export type ChoiceQuestion = {
  id: string
  type: 'choice'
  track: 'A' | 'B'
  question: string
  choices: [string, string, string, string]
  correct_choice: 0 | 1 | 2 | 3
  explanation: string
}

export type StressInfo = {
  word: string
  expected_stress: 'primary' | 'secondary' | 'unstressed'
  is_target_emphasis?: boolean
}

export type SpeakingQuestion = {
  id: string
  type: 'speaking'
  track: 'A' | 'B'
  prompt: string
  phrase: string
  emphasis_instruction: string
  reference_audio: string
  stress_pattern: StressInfo[]
  explanation: string
}

export type Question = ChoiceQuestion | SpeakingQuestion

export type AnalysisResponse = {
  status: 'ok' | 'uncertain' | 'invalid'
  puzzle_id: string
  confidence: number
  message: string
  per_word_scores: Array<{
    word: string
    position: number
    prominence_score: number
    expected_emphasis: boolean
  }> | null
}

export type HealthResponse = {
  status: 'ready' | 'loading'
  models_loaded: boolean
  message: string
}
