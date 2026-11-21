<script setup lang="ts">
import { site } from "~~/data/site";

const cap = site.home.capabilities;
/** The homepage shows the first few capabilities; the rest sit behind "Explore". */
const KEY_COUNT = 4;
const items = cap.items.slice(0, KEY_COUNT);
const rest = cap.items.slice(KEY_COUNT);

// The cabinet holds one folder per key capability plus an "Explore" folder (+)
const EXPLORE = items.length;
const sheets = [
	...items,
	{
		tab: "+",
		kicker: "+ / EXPLORE",
		title: site.ctas.exploreCapabilities,
		body: rest.length
			? `Also: ${rest.map((r) => r.title).join(", ")}. See the full range of what we do.`
			: "See the full range of what we do.",
	},
];

const open = ref(-1); // all closed on load; the cabinet still opens its drawer, no folder lifts
const exploreHover = ref(false);
const raised = computed(() => (exploreHover.value ? EXPLORE : open.value));
const uid = useId();

function toggle(i: number) {
	open.value = open.value === i ? -1 : i;
}

function onSelect(i: number) {
	if (i === EXPLORE) navigateTo("/what-we-do");
	else open.value = i;
}

function onKey(e: KeyboardEvent, i: number) {
	const n = items.length;
	const go = (j: number) => {
		e.preventDefault();
		document.getElementById(`${uid}-btn-${(j + n) % n}`)?.focus();
	};
	if (e.key === "ArrowDown") go(i + 1);
	else if (e.key === "ArrowUp") go(i - 1);
	else if (e.key === "Home") go(0);
	else if (e.key === "End") go(n - 1);
}
</script>

<template>
	<section
		class="bg-white py-6 [--rule:var(--color-ink)] md:py-8"
		aria-labelledby="cap-title"
	>
		<div class="shell">
			<!-- Large screens: cabinet left, text right, both centred on one line -->
			<div class="grid-12 gap-y-10 pb-10 pt-14 md:pt-20 lg:items-center">
				<div class="col-span-12 lg:col-span-6">
					<div
						class="mx-auto aspect-square w-full max-w-xl sm:aspect-[4/3] lg:aspect-square lg:max-w-none"
						aria-hidden="true"
					>
						<ClientOnly>
							<FileBox
								:active="raised"
								:count="sheets.length"
								:selectable="sheets.length"
								:sheets="sheets"
								@select="onSelect"
							/>
						</ClientOnly>
					</div>
				</div>

				<div class="col-span-12 lg:col-span-6 lg:pl-8">
					<h2 id="cap-title" v-reveal class="display-lg mb-10 md:mb-14">
						{{ cap.title }}
					</h2>
					<ul>
						<li v-for="(item, i) in items" :key="item.title" class="rule-b">
							<h3>
								<button
									:id="`${uid}-btn-${i}`"
									type="button"
									class="group grid w-full grid-cols-[3rem_1fr_auto] items-baseline gap-2 py-5 text-left md:grid-cols-[4.5rem_1fr_auto] md:py-7"
									:aria-expanded="open === i"
									:aria-controls="`${uid}-panel-${i}`"
									@click="toggle(i)"
									@keydown="onKey($event, i)"
								>
									<span class="label" :class="open === i ? 'text-ink' : ''">{{
										String(i + 1).padStart(2, "0")
									}}</span>
									<span class="display-md transition-colors">{{
										item.title
									}}</span>
									<span
										aria-hidden="true"
										class="relative block size-4 self-center ease-[var(--ease-out-expo)] group-hover:rotate-180 group-hover:transition-transform group-hover:duration-500 motion-reduce:!transition-none"
									>
										<span
											class="absolute left-0 top-1/2 h-px w-full bg-current"
										/>
										<span
											class="absolute left-1/2 top-0 h-full w-px bg-current transition-transform duration-300"
											:class="open === i ? 'scale-y-0' : ''"
										/>
									</span>
								</button>
							</h3>
							<div
								:id="`${uid}-panel-${i}`"
								role="region"
								:aria-labelledby="`${uid}-btn-${i}`"
								class="acc-panel grid transition-[grid-template-rows] duration-500 ease-[var(--ease-out-expo)]"
								:class="open === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
								:inert="open !== i"
							>
								<div class="overflow-hidden">
									<div
										class="grid grid-cols-[3rem_1fr] gap-2 pb-8 md:grid-cols-[4.5rem_1fr]"
									>
										<div />
										<div>
											<p class="label max-w-[44em]">{{ item.body }}</p>
											<div class="mt-5 flex flex-wrap gap-x-6">
												<BracketLink
													v-for="l in item.links"
													:key="l.anchor"
													:to="`/what-we-do#${l.anchor}`"
													:label="
														'label' in l
															? `Learn more: ${l.label}`
															: 'Learn more'
													"
												/>
											</div>
										</div>
									</div>
								</div>
							</div>
						</li>
					</ul>
					<UiButton
						to="/what-we-do"
						block
						class="mt-10 w-min whitespace-nowrap !py-6"
						@mouseenter="exploreHover = true"
						@mouseleave="exploreHover = false"
						@focus="exploreHover = true"
						@blur="exploreHover = false"
						>{{ site.ctas.exploreCapabilities }}</UiButton
					>
				</div>
			</div>
		</div>
	</section>
</template>
