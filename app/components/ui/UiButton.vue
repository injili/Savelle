<script setup lang="ts">
/** Pill-free rectangular button; navy on light, paper on navy. */
const props = withDefaults(
	defineProps<{
		to?: string;
		type?: "button" | "submit";
		variant?: "ink" | "paper" | "outline";
		block?: boolean;
		disabled?: boolean;
	}>(),
	{
		to: undefined,
		type: "button",
		variant: "ink",
		block: false,
		disabled: false,
	},
);

const classes = computed(() => [
	"ui-button label group relative inline-flex items-center justify-between gap-6 overflow-hidden px-5 py-4 transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-60",
	props.block ? "w-full" : "",
	{
		ink: "bg-ink text-paper ring-1 ring-inset ring-ink hover:bg-white hover:text-ink",
		paper: "bg-paper text-ink hover:bg-white",
		outline:
			// inset ring (not a border) so it takes no space and matches the ink variant's size
			"ring-1 ring-inset ring-current hover:bg-ink hover:text-paper hover:ring-ink",
	}[props.variant],
]);
</script>

<template>
	<NuxtLink v-if="to" :to="to" :class="classes">
		<span v-scramble.hover><slot /></span>
	</NuxtLink>
	<button v-else :type="type" :class="classes" :disabled="disabled">
		<span v-scramble.hover><slot /></span>
	</button>
</template>
