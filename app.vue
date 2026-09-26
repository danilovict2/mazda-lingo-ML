<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Lingo – Master Speech Emphasis',
  htmlAttrs: {
    lang: 'en',
  },
  meta: [
    {
      name: 'description',
      content: 'Learn to use speech emphasis to disambiguate meaning.',
    },
  ],
})
</script>
