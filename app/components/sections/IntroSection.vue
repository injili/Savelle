<script setup lang="ts">
import { site } from "~~/data/site";

const intro = site.home.intro;
// Second paragraph is set in two small mono columns (split between sentences, wording unchanged).
const sentences = intro.paragraphs[1]!.match(/[^.]+\.\s*/g) ?? [
	intro.paragraphs[1]!,
];
const colA = sentences.slice(0, 2).join("").trim();
const colB = sentences.slice(2).join("").trim();
</script>

<template>
	<section
		class="on-ink bg-ink py-6 text-paper md:pb-8 md:pt-2"
		aria-labelledby="intro-title"
	>
		<div class="shell">
			<div class="grid-12 gap-y-10 pb-16 pt-14 md:pb-28 md:pt-8">
				<p v-reveal class="text-statement col-span-12">
					{{ intro.paragraphs[0] }}
				</p>
				<div
					class="col-span-12 grid gap-8 sm:grid-cols-2 md:col-span-6 md:col-start-6 md:mt-8"
				>
					<p
						class="label rule-l pl-4 normal-case !tracking-normal leading-relaxed text-paper/85"
					>
						{{ colA }}
					</p>
					<p
						class="label rule-l pl-4 normal-case !tracking-normal leading-relaxed text-paper/85"
					>
						{{ colB }}
					</p>
				</div>
			</div>
		</div>
	</section>
</template>
