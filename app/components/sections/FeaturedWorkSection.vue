<script setup lang="ts">
import { site } from "~~/data/site";
import type { MapPin } from "~/components/ui/WorkMap.vue";

// Same type system as the hero: mono .label for every small line (eyebrow, intro, map
// lettering, index, details), sans for the headline and work titles; 1px ink lines.
const fw = site.home.featuredWork;
const { data: work } = await useWorkList();
const showWork = computed(
	() => site.featuredWork === "auto" && (work.value?.length ?? 0) > 0,
);
const num = (i: number) => String(i + 1).padStart(2, "0");

/** The challenge, cut at a word boundary */
const excerpt = (s: string, max = 220) => {
	if (s.length <= max) return s;
	const cut = s.slice(0, max);
	return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
};

const items = computed(() =>
	(work.value ?? []).map((item, i) => {
		const c = item.country ? site.workCountries[item.country] : undefined;
		return {
			index: num(i),
			country: c?.name,
			place: c,
			sector: item.sector,
			title: item.title,
			summary: excerpt(item.challenge),
			to: `/our-work/${slugOf(item.path)}`,
		};
	}),
);
// Only engagements with a country get a marker; `active` indexes this list
const pins = computed<MapPin[]>(() =>
	items.value.flatMap((it) =>
		it.place
			? [
					{
						index: it.index,
						country: it.place.name,
						title: it.title,
						to: it.to,
						lat: it.place.lat,
						lon: it.place.lon,
					},
				]
			: [],
	),
);
const pinOf = (to: string) => pins.value.findIndex((p) => p.to === to);
const active = ref(-1);
</script>

<template>
	<section
		v-if="site.featuredWork !== 'hidden'"
		class="bg-white py-6 text-ink md:py-8 [--rule:var(--color-ink)]"
		aria-labelledby="work-title"
	>
		<div class="shell">
			<div class="mx-auto max-w-5xl pb-10 pt-14 text-center md:pt-24">
				<p v-reveal class="label">
					{{ fw.eyebrow
					}}<template v-if="showWork">
						| {{ String(work?.length ?? 0).padStart(2, "0") }}</template
					>
				</p>
				<h2 id="work-title" v-reveal class="display-xl mt-6">{{ fw.title }}</h2>
				<p v-reveal="{ delay: 0.1 }" class="label mx-auto mt-8 max-w-[52em]">
					{{ fw.intro }}
				</p>
			</div>

			<template v-if="showWork">
				<ClientOnly>
					<WorkMap v-model:active="active" :pins="pins" />
				</ClientOnly>

				<!-- The engagements, side by side on larger screens, always open. Hovering (or
				     tapping) one rings its place on the map. -->
				<ol
					class="mt-10 grid gap-y-12 pt-6 md:grid-cols-3 md:gap-x-[var(--gutter)]"
				>
					<li
						v-for="it in items"
						:key="it.to"
						class="fw-item rule-l pl-4"
						:class="{ 'is-active': active >= 0 && active === pinOf(it.to) }"
						@pointerenter="active = pinOf(it.to)"
						@pointerleave="active = -1"
						@click="active = pinOf(it.to)"
					>
						<p class="label flex flex-wrap gap-x-2">
							<span>{{ it.index }}</span>
							<template v-if="it.country">
								<span>{{ it.country }}</span>
								<span aria-hidden="true">|</span>
							</template>
							<span>{{ it.sector }}</span>
						</p>
						<h3
							class="mt-4 text-[clamp(1.375rem,1.1rem+0.9vw,2rem)] leading-[1.1] tracking-[-0.02em]"
						>
							<NuxtLink :to="it.to" class="fw-title">{{ it.title }}</NuxtLink>
						</h3>
						<p class="label mt-4">{{ it.summary }}</p>
						<p class="mt-5">
							<BracketLink :to="it.to" label="View project" />
						</p>
					</li>
				</ol>
			</template>

			<div class="flex justify-center pb-16 pt-14 md:pb-28 md:pt-20">
				<UiButton to="/our-work" variant="ink">{{ site.ctas.exploreWork }}</UiButton>
			</div>
		</div>
	</section>
</template>

<style scoped>
.fw-title,
.fw-title:hover {
	text-decoration: none;
}
</style>
