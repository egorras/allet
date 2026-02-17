<template>
  <div v-if="loading">
    <p><em>Loading...</em></p>
  </div>
  <div v-else-if="production">
    <nav aria-label="breadcrumb">
      <ol class="breadcrumb">
        <li class="breadcrumb-item"><router-link to="/productions">Productions</router-link></li>
        <li class="breadcrumb-item active">{{ production.title }}</li>
      </ol>
    </nav>

    <div class="row">
      <div v-if="production.imageUrl" class="col-md-4 mb-3">
        <img :src="production.imageUrl" class="img-fluid rounded" :alt="production.title" />
      </div>
      <div :class="production.imageUrl ? 'col-md-8' : 'col-12'">
        <h1>{{ production.title }}</h1>
        <p v-if="production.subtitle" class="lead text-muted">{{ production.subtitle }}</p>

        <div class="mb-3">
          <span class="text-muted">{{ production.season }}</span>
          <span v-if="production.tags.length" class="ms-2">
            <TagBadge v-for="tag in production.tags" :key="tag" :tag="tag" />
          </span>
          <span v-if="production.category" class="badge bg-primary ms-1">{{ production.category }}</span>
        </div>

        <div v-if="production.description" v-html="production.description"></div>

        <dl class="row mb-0">
          <template v-if="production.runningTimeMinutes">
            <dt class="col-sm-3">Running time</dt>
            <dd class="col-sm-9">{{ formatRunningTime(production.runningTimeMinutes) }}</dd>
          </template>
          <dt class="col-sm-3">Source</dt>
          <dd class="col-sm-9">{{ production.source }}</dd>
          <template v-if="production.sourceUrl">
            <dt class="col-sm-3">Link</dt>
            <dd class="col-sm-9"><a :href="production.sourceUrl" target="_blank" rel="noopener">View on source site</a></dd>
          </template>
          <dt class="col-sm-3">Tracked since</dt>
          <dd class="col-sm-9">{{ new Date(production.createdAt).toISOString().slice(0, 10) }}</dd>
        </dl>
      </div>
    </div>

    <template v-if="production.synopsis">
      <h2 class="mt-4">Synopsis</h2>
      <div v-html="production.synopsis"></div>
    </template>

    <template v-if="production.galleryUrls.length > 0">
      <h2 class="mt-4">Gallery</h2>
      <div class="row g-2 mb-4">
        <div v-for="url in production.galleryUrls" :key="url" class="col-6 col-md-4 col-lg-3">
          <a :href="url" target="_blank">
            <img :src="url" class="img-fluid rounded" alt="Gallery image" />
          </a>
        </div>
      </div>
    </template>

    <template v-if="production.guide">
      <h2 class="mt-4">Opera Guide</h2>
      <p v-for="(part, i) in production.guide.split('\n\n')" :key="i">{{ part }}</p>
    </template>

    <h2 class="mt-4">Shows <span class="badge bg-secondary">{{ production.shows.length }}</span></h2>

    <div v-if="production.shows.length === 0" class="alert alert-info">
      No shows found for this production.
    </div>
    <div v-else class="table-responsive">
      <table class="table table-striped table-hover">
        <thead>
          <tr>
            <th>Title</th>
            <th>Venue</th>
            <th>Date</th>
            <th>Info</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in production.shows" :key="s.id">
            <td>{{ s.title }}</td>
            <td>{{ s.venueName }}</td>
            <td>{{ s.date ? formatDate(s.date) : '' }}</td>
            <td>
              <span v-if="s.isRehearsal" class="badge bg-warning text-dark">Rehearsal</span>
            </td>
            <td>
              <a v-if="s.url" :href="s.url" target="_blank" rel="noopener">View</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchProduction } from '../api/productions'
import type { ProductionDetail } from '../types'
import TagBadge from '../components/TagBadge.vue'

const props = defineProps<{ id: string }>()
const route = useRoute()
const router = useRouter()
const production = ref<ProductionDetail | null>(null)
const loading = ref(true)

function formatRunningTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toISOString().slice(0, 16).replace('T', ' ')
}

onMounted(async () => {
  try {
    const id = Number(props.id || route.params.id)
    production.value = await fetchProduction(id)
  } catch {
    router.push('/productions')
  } finally {
    loading.value = false
  }
})
</script>
