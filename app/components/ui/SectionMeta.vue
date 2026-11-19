<script setup lang="ts">
/** Section name (top-left) on a hairline. */
withDefaults(defineProps<{ name: string, rule?: boolean }>(), { rule: true })
</script>

<template>
  <div class="pt-3" :class="rule ? 'rule-t' : ''">
    <p class="label" v-scramble>{{ name }}</p>
  </div>
</template>
