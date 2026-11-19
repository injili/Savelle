<script setup lang="ts">
import { site } from '~~/data/site'

// PLACEHOLDER (publication gate 8): replace with Savelle's privacy notice before launch.
usePageSeo('privacy')
</script>

<template>
  <div>
    <PageHeader name="Privacy" :headline="site.privacy.headline" :paragraphs="[site.privacy.placeholder]" :lead="false" />
  </div>
</template>
