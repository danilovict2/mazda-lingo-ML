<template>
  <div class="flex flex-col min-h-screen">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <NuxtLink to="/" class="text-2xl font-bold text-blue-600">
          Lingo
        </NuxtLink>
        <nav class="flex gap-6 text-sm font-medium">
          <NuxtLink to="/" class="text-gray-600 hover:text-blue-600">
            Home
          </NuxtLink>
          <NuxtLink to="/game" class="text-gray-600 hover:text-blue-600">
            Play
          </NuxtLink>
          <NuxtLink to="/health" class="text-gray-600 hover:text-blue-600">
            Status
          </NuxtLink>
        </nav>
      </div>
    </header>

    <main class="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
      <slot />
    </main>

    <footer class="bg-gray-50 border-t border-gray-200 py-6 text-center text-sm text-gray-600">
      <p>Lingo – Learn speech emphasis • v0.1.0</p>
    </footer>
  </div>
</template>
