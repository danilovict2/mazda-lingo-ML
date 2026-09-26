import type { Question, ChoiceQuestion, SpeakingQuestion } from '~/types/puzzle'
import fixtures from '~/contracts/fixtures.json'

export const useQuestions = () => {
  const questions = ref<Question[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const loadQuestions = async (source: 'fixtures' | 'api' = 'fixtures') => {
    loading.value = true
    error.value = null

    try {
      if (source === 'fixtures') {
        questions.value = fixtures.questions as Question[]
      } else {
        // TODO: Load from real API when P3 provides endpoint
        questions.value = fixtures.questions as Question[]
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load questions'
      console.error(error.value)
    } finally {
      loading.value = false
    }
  }

  const getChoiceQuestions = (track?: 'A' | 'B'): ChoiceQuestion[] => {
    return questions.value.filter(
      (q): q is ChoiceQuestion => q.type === 'choice' && (!track || q.track === track)
    )
  }

  const getSpeakingQuestions = (track?: 'A' | 'B'): SpeakingQuestion[] => {
    return questions.value.filter(
      (q): q is SpeakingQuestion => q.type === 'speaking' && (!track || q.track === track)
    )
  }

  const getQuestionById = (id: string): Question | undefined => {
    return questions.value.find((q) => q.id === id)
  }

  return {
    questions: readonly(questions),
    loading: readonly(loading),
    error: readonly(error),
    loadQuestions,
    getChoiceQuestions,
    getSpeakingQuestions,
    getQuestionById,
  }
}
