<template>
  <!-- Page transition columns, animated from app/utils/stairs.ts -->
  <div data-stairs class="pointer-events-none fixed inset-0 z-[70] flex" aria-hidden="true">
    <div v-for="i in 6" :key="i" data-stair class="stair h-full flex-1 bg-ink" :class="i > 3 ? 'max-md:hidden' : ''" />
  </div>
</template>

<style scoped>
.stair { transform: scaleY(0); transform-origin: top; margin-right: -1px; }
</style>
