<script setup lang="ts">
import { site } from "~~/data/site";

const why = site.home.why;
const pad = (n: number) => String(n).padStart(2, "0");
</script>

<template>
	<!-- Blue band: white type, solid white 1px lines -->
	<section
		class="on-ink bg-ink py-6 text-white [--rule:var(--color-white)] md:py-8 lg:flex lg:min-h-svh lg:items-center lg:py-0"
		aria-labelledby="why-title"
	>
		<div class="shell w-full">
			<div class="grid-12 gap-y-14 pb-16 pt-16 md:pb-20 md:pt-20 lg:items-center lg:py-24">
				<div class="col-span-12 lg:col-span-5">
					<h2 id="why-title" v-reveal class="display-xl">
						<span class="block">Why</span><span class="block">Savelle</span>
					</h2>
					<p class="label mt-8 max-w-[44em]">{{ why.intro }}</p>
				</div>

				<!-- Four square tiles, 2 × 2 from small tablets up, divided by 1px lines -->
				<ul
					class="why-grid col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:col-span-7 lg:col-start-6 lg:justify-self-end"
					aria-label="What sets Savelle apart"
				>
					<li
						v-for="(p, i) in why.pillars"
						:key="p.title"
						class="why-tile flex min-h-[15rem] flex-col justify-between gap-10 p-5 sm:aspect-square sm:min-h-0 md:p-7"
					>
						<p v-reveal class="text-lead" aria-hidden="true">{{ pad(i + 1) }}</p>
						<div>
							<h3 v-reveal class="display-md">{{ p.title }}</h3>
							<p v-reveal="{ delay: 0.08 }" class="label mt-4 max-w-[30em]">
								{{ p.body }}
							</p>
						</div>
					</li>
				</ul>
			</div>
		</div>
	</section>
</template>

<style scoped>
/* Side by side (lg+): the grid is a square sized to the screen's height (less room
   for the fixed header above and the same below), so the whole section fits one
   screen. It never shrinks below 34rem, so on very short screens it may run past the fold. */
@media (min-width: 1024px) {
	.why-grid {
		width: clamp(34rem, 100svh - 12rem, 100%);
	}
}

/* Lines between tiles only (no outer frame), like a 2 × 2 sheet */
.why-tile {
	border-color: var(--rule);
}
/* Phones: one column, a line under every tile but the last */
.why-tile:not(:last-child) {
	border-bottom-width: 1px;
}
@media (min-width: 640px) {
	.why-tile:not(:last-child) {
		border-bottom-width: 0;
	}
	.why-tile:nth-child(-n + 2) {
		border-bottom-width: 1px;
	}
	.why-tile:nth-child(odd) {
		border-right-width: 1px;
	}
}
</style>
