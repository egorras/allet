<template>
  <div class="card h-100">
    <img v-if="production.imageUrl" :src="production.imageUrl" class="card-img-top" :alt="production.title" style="height: 200px; object-fit: cover;" />
    <div class="card-body d-flex flex-column">
      <h5 class="card-title">{{ production.title }}</h5>
      <p class="card-text text-muted mb-1">{{ production.season }}</p>
      <p v-if="production.category" class="card-text mb-1">
        <span class="badge bg-primary">{{ production.category }}</span>
      </p>
      <p v-if="production.tags.length" class="card-text mb-2">
        <TagBadge v-for="tag in production.tags" :key="tag" :tag="tag" />
      </p>
      <div class="mt-auto d-flex justify-content-between align-items-center">
        <span class="badge bg-secondary">{{ production.showCount }} show(s)</span>
        <router-link :to="`/productions/${production.id}`" class="btn btn-sm btn-outline-primary">Details</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProductionListItem } from '../types'
import TagBadge from './TagBadge.vue'

defineProps<{ production: ProductionListItem }>()
</script>
