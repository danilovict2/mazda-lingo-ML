<template>
  <div class="space-y-12">
    <!-- Hero -->
    <section class="text-center py-12">
      <h1 class="text-5xl font-bold text-gray-900 mb-4">
        Master Speech Emphasis
      </h1>
      <p class="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
        Learn how changing which word you stress changes what you mean. Play through
        choice questions and speaking challenges to unlock the hidden power of emphasis.
      </p>
      <NuxtLink to="/game" class="btn btn-primary inline-block">
        Start Playing
      </NuxtLink>
    </section>

    <!-- How it works -->
    <section class="grid md:grid-cols-2 gap-8">
      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-gray-900">Choice Questions</h2>
        <p class="text-gray-600 mb-4">
          Listen to clips and pick the answer that matches the emphasis pattern you hear.
          Build intuition for how stress carries meaning.
        </p>
        <p class="text-sm text-gray-500">
          ~2 min per question • Immediate feedback
        </p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-gray-900">Speaking Challenges</h2>
        <p class="text-gray-600 mb-4">
          Record yourself reading a phrase with the emphasis we show you. Our analysis
          compares your emphasis to the target and tells you how close you were.
        </p>
        <p class="text-sm text-gray-500">
          ~3 min per challenge • Real-time analysis
        </p>
      </div>
    </section>

    <!-- Feature highlights -->
    <section>
      <h2 class="text-3xl font-bold mb-8 text-gray-900">How Emphasis Changes Everything</h2>
      <div class="grid md:grid-cols-3 gap-6">
        <div class="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <div class="text-3xl mb-2">📍</div>
          <h3 class="font-semibold text-gray-900 mb-2">Focus & Reference</h3>
          <p class="text-sm text-gray-600">
            "The BANK is on Main Street" vs. "The bank is on Main STREET"
          </p>
        </div>
        <div class="bg-purple-50 p-6 rounded-lg border border-purple-100">
          <div class="text-3xl mb-2">⚔️</div>
          <h3 class="font-semibold text-gray-900 mb-2">Contrast</h3>
          <p class="text-sm text-gray-600">
            "I didn't say SHE stole it" (she did, someone else?)
          </p>
        </div>
        <div class="bg-green-50 p-6 rounded-lg border border-green-100">
          <div class="text-3xl mb-2">🎯</div>
          <h3 class="font-semibold text-gray-900 mb-2">Ability & Permission</h3>
          <p class="text-sm text-gray-600">
            "I CAN present" vs. "I can PRESENT"
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
