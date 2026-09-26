<template>
  <div>
    <h1 class="text-3xl font-bold mb-8">Game</h1>
    <div class="card">
      <p class="text-gray-600 mb-6">
        Choose a track to start playing. Each track has choice questions and speaking challenges.
      </p>

      <div class="grid md:grid-cols-2 gap-6">
        <NuxtLink
          to="/game/track/A"
          class="block p-8 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg hover:shadow-lg transition-shadow"
        >
          <h2 class="text-2xl font-bold text-blue-900 mb-2">Track A</h2>
          <p class="text-blue-700">
            5 questions • Mix of choice and speaking
          </p>
        </NuxtLink>

        <NuxtLink
          to="/game/track/B"
          class="block p-8 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg hover:shadow-lg transition-shadow"
        >
          <h2 class="text-2xl font-bold text-purple-900 mb-2">Track B</h2>
          <p class="text-purple-700">
            5 questions • Mix of choice and speaking
          </p>
        </NuxtLink>
      </div>
    </div>

    <!-- Progress from localStorage -->
    <div class="card mt-8">
      <h2 class="text-xl font-semibold mb-4">Your Progress</h2>
      <p class="text-gray-600 text-sm">
        Progress is saved locally. Each track's answers are kept separate.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})
</script>
