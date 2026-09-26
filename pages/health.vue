<template>
  <div class="max-w-2xl">
    <h1 class="text-3xl font-bold mb-8">Service Health</h1>

    <div class="card">
      <div class="flex items-start justify-between mb-6">
        <div>
          <h2 class="text-xl font-semibold text-gray-900 mb-1">API Status</h2>
          <p class="text-gray-600">{{ config.public.apiBase }}</p>
        </div>
        <button @click="checkHealth" :disabled="checking" class="btn btn-primary">
          {{ checking ? 'Checking...' : 'Check Health' }}
        </button>
      </div>

      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p class="text-red-800 font-semibold">Error</p>
        <p class="text-red-700 text-sm mt-1">{{ error }}</p>
      </div>

      <div v-if="health" class="space-y-4">
        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <span class="text-gray-700 font-medium">Status</span>
          <span
            :class="
              health.status === 'ready'
                ? 'px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold'
                : 'px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold'
            "
          >
            {{ health.status === 'ready' ? '✓ Ready' : '⏳ Loading' }}
          </span>
        </div>

        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <span class="text-gray-700 font-medium">Models Loaded</span>
          <span :class="health.models_loaded ? 'text-green-600' : 'text-yellow-600'">
            {{ health.models_loaded ? '✓ Yes' : '✗ No' }}
          </span>
        </div>

        <div class="p-4 bg-gray-50 rounded-lg">
          <span class="text-gray-700 font-medium block mb-1">Message</span>
          <p class="text-gray-600 text-sm">{{ health.message }}</p>
        </div>

        <p class="text-xs text-gray-500 text-right">
          Last checked: {{ lastCheck ? new Date(lastCheck).toLocaleTimeString() : 'Never' }}
        </p>
      </div>

      <div v-else class="text-center py-8">
        <p class="text-gray-500">No health check performed yet.</p>
      </div>
    </div>

    <!-- Test fixture load -->
    <div class="card mt-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Fixture Questions</h2>
      <p class="text-gray-600 mb-4">
        Testing question fixture loading ({{ questionStats.total }} total)
      </p>
      <div class="flex gap-4">
        <div class="text-center p-4 bg-blue-50 rounded-lg flex-1">
          <p class="text-2xl font-bold text-blue-600">{{ questionStats.choice }}</p>
          <p class="text-sm text-gray-600">Choice Questions</p>
        </div>
        <div class="text-center p-4 bg-purple-50 rounded-lg flex-1">
          <p class="text-2xl font-bold text-purple-600">{{ questionStats.speaking }}</p>
          <p class="text-sm text-gray-600">Speaking</p>
        </div>
        <div class="text-center p-4 bg-green-50 rounded-lg flex-1">
          <p class="text-2xl font-bold text-green-600">Track A: {{ questionStats.trackA }} / Track B: {{ questionStats.trackB }}</p>
          <p class="text-sm text-gray-600">By Track</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HealthResponse } from '~/types/puzzle'

const config = useRuntimeConfig()
const { health: checkApiHealth } = useApi()
const { getChoiceQuestions, getSpeakingQuestions, loadQuestions } = useQuestions()

const health = ref<HealthResponse | null>(null)
const checking = ref(false)
const error = ref<string | null>(null)
const lastCheck = ref<string | null>(null)

const questionStats = computed(() => {
  const choice = getChoiceQuestions()
  const speaking = getSpeakingQuestions()
  const trackA = [...choice, ...speaking].filter((q) => q.track === 'A').length
  const trackB = [...choice, ...speaking].filter((q) => q.track === 'B').length
  return {
    choice: choice.length,
    speaking: speaking.length,
    total: choice.length + speaking.length,
    trackA,
    trackB,
  }
})

const checkHealth = async () => {
  checking.value = true
  error.value = null
  try {
    health.value = await checkApiHealth()
    lastCheck.value = new Date().toISOString()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to check health'
  } finally {
    checking.value = false
  }
}

onMounted(async () => {
  await loadQuestions('fixtures')
})
</script>
