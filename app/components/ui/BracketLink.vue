<script setup lang="ts">
/** Mono link styled `[ LABEL → ]` with hover scramble. */
withDefaults(
	defineProps<{
		to: string;
		label: string;
		arrow?: boolean;
		external?: boolean;
	}>(),
	{
		arrow: true,
		external: false,
	},
);
</script>

<template>
	<NuxtLink
		:to="to"
		:external="external"
		class="label group inline-flex max-w-full items-baseline gap-[0.6em] py-1 transition-colors"
	>
		<span aria-hidden="true">[</span>
		<span v-scramble.hover>{{ label }}</span>
		<span
			v-if="arrow"
			aria-hidden="true"
			class="inline-block transition-transform duration-300 group-hover:translate-x-1"
			>→</span
		>
		<span aria-hidden="true">]</span>
	</NuxtLink>
</template>
