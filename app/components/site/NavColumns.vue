<script setup lang="ts">
import { site } from "~~/data/site";

/** Main nav as two mono link columns split by a vertical hairline (hero + menu). */
const props = withDefaults(
	defineProps<{
		large?: boolean;
		stagger?: boolean;
		onNavigate?: () => void;
	}>(),
	{
		large: false,
		stagger: false,
		onNavigate: undefined,
	},
);

const split = Math.ceil(site.nav.length / 2);
const cols = [site.nav.slice(0, split), site.nav.slice(split)];
const route = useRoute();
const isActive = (to: string) =>
	to === "/" ? route.path === "/" : route.path.startsWith(to);
</script>

<template>
	<div class="grid grid-cols-2">
		<ul
			v-for="(col, ci) in cols"
			:key="ci"
			class="flex flex-col gap-[0.35em]"
			:class="ci === 1 ? 'pl-4 md:pl-5' : 'pr-4 md:pr-5'"
		>
			<li v-for="(item, i) in col" :key="item.to">
				<NuxtLink
					:to="item.to"
					class="nav-link inline-flex items-center gap-2 transition-colors"
					:class="[
						large
							? 'whitespace-nowrap text-[clamp(1.4rem,4.6vw,4.5rem)] leading-none tracking-[-0.03em]'
							: 'label',
						isActive(item.to) ? 'is-active' : '',
					]"
					:aria-current="isActive(item.to) ? 'page' : undefined"
					@click="props.onNavigate?.()"
				>
					<span
						v-if="large"
						v-scramble.view.hover="{
							delay: stagger ? 80 + (ci * split + i) * 70 : 0,
						}"
						>{{ item.label }}</span
					>
					<span v-else v-scramble.hover>{{ item.label }}</span>
				</NuxtLink>
			</li>
		</ul>
	</div>
</template>

<style scoped>
.nav-link:hover {
	text-decoration-thickness: 1px;
}
.nav-link.is-active .nav-dot {
	background: currentColor;
}
</style>
