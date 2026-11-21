<script setup lang="ts">
import { gsap } from "gsap";
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
// Load-in for the non-text pieces: a bottom-up wipe (clip, no fade, so nothing is ever
// shown in a lighter blue), timed after the intro loader alongside the v-reveal text.
const root = ref<HTMLElement | null>(null);
let intro: gsap.core.Timeline | undefined;
onMounted(async () => {
	const el = root.value;
	if (!el) return;
	const q = (sel: string) => Array.from(el.querySelectorAll<HTMLElement>(sel));
	if (prefersReducedMotion()) return;
	await useSiteReady().whenReady();
	if (!root.value) return;
	const from = { clipPath: "inset(0% 0% 100% 0%)", yPercent: 40 };
	const to = {
		clipPath: "inset(0% 0% 0% 0%)",
		yPercent: 0,
		visibility: "visible",
		duration: 0.9,
		ease: "expo.out",
		clearProps: "clipPath,transform",
	};
	intro = gsap
		.timeline()
		.fromTo(q("nav .hero-in"), from, { ...to, stagger: 0.05 }, 0.05)
		.fromTo(
			q(".hero-cube .hero-in"),
			from,
			{ ...to, duration: 1.2, stagger: 0.04 },
			0.2,
		)
		.fromTo(q("ol .hero-in"), from, { ...to, stagger: 0.06 }, 0.45)
		.fromTo(q(".hero-cta"), from, { ...to, stagger: 0.08 }, 0.6);
});
onBeforeUnmount(() => {
	intro?.kill();
	io?.disconnect();
	heroNavInView.value = false;
});
</script>

<template>
	<!-- One type system: mono .label for every small line (nav, eyebrow, captions, index,
	     buttons, matching the header's logo), sans for body, lead and headline.
	     One line style: 1px solid ink (hairlines, ticks, underlines, button rings, cube). -->
	<section
		ref="root"
		class="hero relative flex min-h-[100svh] flex-col bg-white text-ink [--rule:var(--color-ink)]"
		aria-labelledby="hero-title"
	>
		<!-- Top row. The first line of the nav sits on the same centre line as the header's
		     logo wordmark and mail button: container at --pad-x, then (control-h − line)/2 = 1rem. -->
		<div class="shell grid-12 pt-[var(--pad-x)]">
			<!-- Eyebrow under the logo (tablet/desktop) -->
			<div
				class="hero-eyebrow hidden md:col-span-4 md:col-start-1 md:row-start-1 md:block lg:col-span-5"
			>
				<p v-reveal="{ wait: true, delay: 0.1 }" class="label">
					{{ hero.eyebrow.join(" | ") }}
				</p>
				<p v-reveal="{ wait: true, delay: 0.18 }" class="label max-w-[30em]">
					{{ hero.descriptor }}
				</p>
			</div>
			<!-- Nav (tablet/desktop; phones use the MENU button) -->
			<nav aria-label="Primary" class="contents">
				<ul
					v-for="(col, ci) in navCols"
					ref="navLists"
					:key="ci"
					class="rule-l mt-4 hidden flex-col self-start pl-4 md:col-span-3 md:row-start-1 md:flex"
					:class="
						ci === 0
							? 'md:col-start-5 lg:col-start-7'
							: 'md:col-start-8 lg:col-start-10'
					"
				>
					<li v-for="item in col" :key="item.to" class="hero-in flex">
						<NuxtLink
							:to="item.to"
							class="hero-link label"
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
				<div class="hero-in absolute -inset-[6%]">
					<ClientOnly><RubiksCube /></ClientOnly>
				</div>
				<!-- Technical-drawing frame: corner ticks + figure label -->
				<span class="hero-tick hero-in left-0 top-0 border-l border-t" />
				<span class="hero-tick hero-in right-0 top-0 border-r border-t" />
				<span class="hero-tick hero-in bottom-0 left-0 border-b border-l" />
				<span class="hero-tick hero-in bottom-0 right-0 border-b border-r" />
				<p
					v-reveal="{ wait: true, delay: 0.5 }"
					class="label absolute left-4 top-3 hidden md:block"
				>
					{{ hero.figure.label }}
				</p>
			</div>

			<div
				class="order-2 col-span-12 flex flex-col justify-end lg:order-1 lg:col-span-7 lg:justify-center"
			>
				<h1 id="hero-title" v-reveal="{ wait: true }" class="hero-title">
					<span v-for="line in hero.headlineLines" :key="line" class="block">{{
						line
					}}</span>
				</h1>
				<p
					v-reveal="{ wait: true, delay: 0.3 }"
					class="text-lead mt-[clamp(1rem,3svh,2rem)]"
				>
					{{ hero.tagline }}
				</p>
			</div>
		</div>

		<!-- Bottom band: disciplines index on a full-width hairline, then body copy + buttons -->
		<div class="shell pb-[var(--pad-x)] pt-[clamp(1.5rem,4svh,3rem)]">
			<ol
				class="rule-t hidden gap-x-[var(--gutter)] gap-y-2 pt-3 md:grid md:grid-cols-6"
				aria-label="Disciplines"
			>
				<li
					v-for="(d, i) in hero.disciplines"
					:key="d"
					class="hero-in label flex gap-2"
				>
					<span>{{ String(i + 1).padStart(2, "0") }}</span>
					<span>{{ d }}</span>
				</li>
				<li
					class="hero-in label hidden items-center justify-end gap-2 md:flex"
					aria-hidden="true"
				>
					Scroll <span class="hero-scroll">↓</span>
				</li>
			</ol>
			<div class="grid-12 gap-y-6 pt-[clamp(1.25rem,3svh,2.25rem)]">
				<p
					v-reveal="{ wait: true, delay: 0.45 }"
					class="hero-body label hidden md:col-span-12 md:block lg:col-span-7"
				>
					{{ hero.body }}
				</p>
				<div
					class="col-span-12 flex flex-wrap items-start gap-2 md:justify-end lg:col-span-4 lg:col-start-9"
				>
					<div class="hero-in hero-cta">
						<UiButton to="/contact" variant="ink">{{
							site.ctas.startConversation
						}}</UiButton>
					</div>
					<div class="hero-in hero-cta">
						<UiButton to="/what-we-do" variant="outline">{{
							site.ctas.exploreCapabilities
						}}</UiButton>
					</div>
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

.hero-link {
	display: inline-block;
	text-underline-offset: 4px;
}
/* No underline on hover/active: each nav column has a line down its left instead */
.hero-link,
.hero-link:hover {
	text-decoration: none;
}
.hero-title {
	font-size: clamp(2.75rem, 12.4vw, 13rem);
	line-height: 0.96;
	letter-spacing: -0.045em;
	font-weight: 400;
}
/* Body copy uses the same mono .label style as the nav and index; just a measure cap */
.hero-body {
	max-width: 62em; /* spans the two former paragraph columns */
}

/* Eyebrow starts one nav row below the header logo */
.hero-eyebrow {
	padding-top: calc(var(--control-h) + 1rem);
}

.hero-tick {
	position: absolute;
	width: 14px;
	height: 14px;
	border-color: var(--color-ink);
	pointer-events: none;
}

.hero-scroll {
	display: inline-block;
	animation: hero-nudge 1.8s var(--ease-out-expo) infinite;
}
@keyframes hero-nudge {
	0%,
	100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(3px);
	}
}

/* Load-in for non-text pieces (nav, index, buttons, cube, ticks): hidden until the
   intro loader finishes and the wipe runs. Safety net: show after 3s. */
@media (prefers-reduced-motion: no-preference) {
	:global(.js) .hero-in {
		visibility: hidden;
		animation: hero-failsafe 0s 3s forwards;
	}
}
@keyframes hero-failsafe {
	to {
		visibility: visible;
	}
}
@media (prefers-reduced-motion: reduce) {
	.hero-scroll {
		animation: none;
	}
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
