<script setup lang="ts">
/**
 * PLACEHOLDER LOGO MARK — replace this single component with the real logo.
 * Concept: six nodes on a ring, joined by thin lines, around a central node
 * (a connected system). Inherits colour from `currentColor`.
 */
withDefaults(defineProps<{ title?: string, strokeWidth?: number }>(), {
  title: '',
  strokeWidth: 1.5,
})

const R = 36
const nodes = Array.from({ length: 6 }, (_, i) => {
  const a = (Math.PI / 3) * i - Math.PI / 2
  return { x: 50 + R * Math.cos(a), y: 50 + R * Math.sin(a) }
})
// ring edges + three chords + spokes from the centre to alternating nodes
const edges: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 2], [2, 4], [4, 0]]
const spokes = [1, 3, 5]
</script>

<template>
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :role="title ? 'img' : undefined"
    :aria-label="title || undefined"
    :aria-hidden="title ? undefined : 'true'"
  >
    <g stroke="currentColor" :stroke-width="strokeWidth" stroke-linecap="round" vector-effect="non-scaling-stroke">
      <line v-for="([a, b], i) in edges" :key="`e${i}`" :x1="nodes[a]!.x" :y1="nodes[a]!.y" :x2="nodes[b]!.x" :y2="nodes[b]!.y" vector-effect="non-scaling-stroke" />
      <line v-for="s in spokes" :key="`s${s}`" x1="50" y1="50" :x2="nodes[s]!.x" :y2="nodes[s]!.y" vector-effect="non-scaling-stroke" />
    </g>
    <g fill="currentColor">
      <circle v-for="(n, i) in nodes" :key="`n${i}`" :cx="n.x" :cy="n.y" r="6" />
      <circle cx="50" cy="50" r="8.5" />
    </g>
  </svg>
</template>
