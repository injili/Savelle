<script setup lang="ts">
import { site } from "~~/data/site";

// Hero on plain white, blue type, hairline rules (same language as Why Savelle).
// The cube has its own grid cell, so no text can ever sit on top of it.
const hero = site.home.hero;

const split = Math.ceil(site.nav.length / 2);
const navCols = [site.nav.slice(0, split), site.nav.slice(split)];
const route = useRoute();
const isActive = (to: string) =>
	to === "/" ? route.path === "/" : route.path.startsWith(to);

// Tell the header when this nav is on screen, so it can hide its MENU button on
// desktop. Starts true (also on the server) so the button doesn't flash on load.
const heroNavInView = useHeroNavInView();
heroNavInView.value = true;
const navLists = ref<HTMLElement[]>([]);
let io: IntersectionObserver | undefined;
onMounted(() => {
	const target = navLists.value[0];
	if (!target) return;
	io = new IntersectionObserver(
		([entry]) => {
			// display:none on phones → never intersecting → MENU stays visible
			heroNavInView.value = !!entry?.isIntersecting;
		},
		{ rootMargin: "-72px 0px 0px 0px" },
	);
	io.observe(target);
});
onBeforeUnmount(() => {
	io?.disconnect();
	heroNavInView.value = false;
});
</script>

<template>
	<section
		class="hero relative flex min-h-[100svh] flex-col bg-white text-ink"
		aria-labelledby="hero-title"
	>
		<!-- Nav (tablet/desktop; phones use the MENU button), each column under a hairline -->
		<div class="shell grid-12 pt-[calc(var(--pad-x)+0.25rem)]">
			<nav aria-label="Primary" class="contents">
				<ul
					v-for="(col, ci) in navCols"
					ref="navLists"
					:key="ci"
					class="hidden flex-col gap-1.5 pt-3 md:col-span-3 md:flex"
					:class="
						ci === 0
							? 'md:col-start-5 lg:col-start-7'
							: 'md:col-start-8 lg:col-start-10'
					"
				>
					<li v-for="item in col" :key="item.to">
						<NuxtLink
							:to="item.to"
							class="hero-link font-mono text-bold uppercase leading-none tracking-[0.04em] text-[clamp(0.875rem,0.7rem+0.35vw,1.125rem)]"
							:class="isActive(item.to) ? 'is-active' : ''"
							:aria-current="isActive(item.to) ? 'page' : undefined"
						>
							<span v-scramble.hover>{{ item.label }}</span>
						</NuxtLink>
					</li>
				</ul>
			</nav>
		</div>

		<!-- Desktop: headline (left) + cube (right). Phones/tablets: cube first, full width. -->
		<div
			class="shell grid-12 flex-1 items-end gap-y-6 pt-[4.5rem] md:pt-8 lg:items-stretch"
		>
			<div
				class="hero-cube relative order-1 col-span-12 lg:order-2 lg:col-span-5 lg:col-start-8"
				aria-hidden="true"
			>
				<!-- Canvas bleeds 6% past the cell; only the widest tumble angles reach that margin -->
				<div class="absolute -inset-[6%]">
					<ClientOnly><RubiksCube /></ClientOnly>
				</div>
			</div>

			<div
				class="order-2 col-span-12 flex flex-col justify-end lg:order-1 lg:col-span-7 lg:justify-center"
			>
				<h1 id="hero-title" v-reveal="{ wait: true }" class="hero-title">
					<span v-for="line in hero.headlineLines" :key="line" class="block">{{
						line
					}}</span>
				</h1>
			</div>
		</div>

		<!-- Bottom band under a full-width hairline: body copy (hidden on phones) + buttons -->
		<div class="shell pb-[var(--pad-x)] pt-[clamp(1.5rem,4svh,3rem)]">
			<div class="grid-12 gap-y-6 pt-4">
				<p
					v-for="(para, i) in hero.body"
					:key="i"
					v-reveal="{ wait: true, delay: 0.45 + i * 0.1 }"
					class="hero-body hidden md:col-span-6 md:block lg:col-span-4"
					:class="i === 1 ? 'lg:col-start-5' : ''"
				>
					{{ para }}
				</p>
				<div
					class="col-span-12 flex flex-wrap items-start gap-2 md:justify-end lg:col-span-4 lg:col-start-9"
				>
					<UiButton to="/contact" variant="ink">{{
						site.ctas.startConversation
					}}</UiButton>
					<UiButton to="/what-we-do" variant="outline">{{
						site.ctas.exploreCapabilities
					}}</UiButton>
				</div>
			</div>
		</div>
	</section>
</template>

<style scoped>
/* Phones/tablets: a stage for the cube above the headline. Desktop: it fills its column. */
.hero-cube {
	height: clamp(16rem, 50svh, 36rem);
}
@media (min-width: 1024px) {
	.hero-cube {
		height: auto;
		min-height: 22rem; /* short laptop screens: keep the cube large; the hero may run a little past the fold */
	}
}

.hero-link:hover {
	text-decoration-thickness: 1px;
}

.hero-link.is-active {
	text-decoration: underline;
	text-decoration-thickness: 1px;
	text-underline-offset: 4px;
}
.hero-title {
	font-size: clamp(2.75rem, 12.4vw, 13rem);
	line-height: 0.96;
	letter-spacing: -0.045em;
	font-weight: 400;
}
.hero-tagline {
	font-size: clamp(1.5rem, 1.1rem + 1.3vw, 3rem);
	line-height: 1.02;
	letter-spacing: -0.03em;
}
.hero-body {
	font-size: clamp(0.9375rem, 0.85rem + 0.2vw, 1.0625rem);
	line-height: 1.5;
	max-width: 34em;
}
@media (min-width: 768px) {
	.hero-title {
		font-size: clamp(3rem, 9.4vw, 13rem);
	}
}
@media (min-width: 1024px) {
	/* Headline wraps to two lines per phrase in its column, so size it to fit the column */
	.hero-title {
		font-size: min(8.6vw, 12svh);
	}
}
</style>
