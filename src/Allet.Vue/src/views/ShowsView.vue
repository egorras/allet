<template>
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h1 class="mb-0">Shows</h1>
    <div class="d-flex align-items-center gap-2">
      <button class="btn btn-sm btn-outline-secondary" @click="prevMonth">&laquo;</button>
      <strong>{{ monthLabel }}</strong>
      <button class="btn btn-sm btn-outline-secondary" @click="nextMonth">&raquo;</button>
      <button class="btn btn-sm btn-outline-primary ms-2" @click="goToToday">Today</button>
    </div>
  </div>

  <p v-if="productionId">
    Showing performances for a specific production.
    <router-link to="/shows" class="ms-2 btn btn-sm btn-outline-secondary">Clear filter</router-link>
  </p>

  <div v-if="allTags.length > 0" class="mb-3 d-flex flex-wrap align-items-center gap-2">
    <span class="text-muted small me-1">Tags:</span>
    <button
      v-for="tag in allTags"
      :key="tag"
      class="btn btn-sm"
      :class="selectedTags.has(tag) ? 'btn-primary' : 'btn-outline-secondary'"
      @click="toggleTag(tag)"
    >
      {{ tag }}
    </button>
    <button v-if="selectedTags.size > 0" class="btn btn-sm btn-link text-decoration-none" @click="clearTags">Clear</button>
  </div>

  <div v-if="loading">
    <p><em>Loading...</em></p>
  </div>
  <div v-else>
    <CalendarGrid :days="filteredCalendarDays" :currentYear="currentYear" :currentMonth="currentMonth" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchShows, fetchShowTags } from '../api/shows'
import type { ShowDto, CalendarDay } from '../types'
import CalendarGrid from '../components/CalendarGrid.vue'

const props = defineProps<{ productionId?: string }>()
const route = useRoute()

const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth() + 1)
const shows = ref<ShowDto[]>([])
const allTags = ref<string[]>([])
const selectedTags = ref<Set<string>>(new Set())
const loading = ref(true)

const monthLabel = computed(() => {
  const d = new Date(currentYear.value, currentMonth.value - 1, 1)
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
})

const prodId = computed(() => props.productionId || (route.params.productionId as string) || '')

function getCalendarDays(): CalendarDay[] {
  const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value, 0)

  // Monday-based week
  const startOffset = (firstDay.getDay() + 6) % 7
  const gridStart = new Date(firstDay)
  gridStart.setDate(gridStart.getDate() - startOffset)

  const endDow = (lastDay.getDay() + 6) % 7
  const daysAfter = endDow === 6 ? 0 : 6 - endDow
  const gridEnd = new Date(lastDay)
  gridEnd.setDate(gridEnd.getDate() + daysAfter + 1)

  const showsByDate = new Map<string, ShowDto[]>()
  for (const s of shows.value) {
    if (!s.date) continue
    const dateKey = s.date.slice(0, 10)
    if (!showsByDate.has(dateKey)) showsByDate.set(dateKey, [])
    showsByDate.get(dateKey)!.push(s)
  }

  const days: CalendarDay[] = []
  const cursor = new Date(gridStart)
  while (cursor < gridEnd) {
    const dateKey = cursor.toISOString().slice(0, 10)
    days.push({
      date: dateKey,
      shows: showsByDate.get(dateKey) || [],
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

const calendarDays = ref<CalendarDay[]>([])

const filteredCalendarDays = computed(() => {
  if (selectedTags.value.size === 0) return calendarDays.value
  // Tag filtering is handled server-side via the tags query param
  return calendarDays.value
})

async function loadShows() {
  loading.value = true
  try {
    const params: Record<string, string> = {
      year: String(currentYear.value),
      month: String(currentMonth.value),
    }
    if (prodId.value) params.productionId = prodId.value
    if (selectedTags.value.size > 0) params.tags = Array.from(selectedTags.value).join(',')
    shows.value = await fetchShows(params)
    calendarDays.value = getCalendarDays()
  } finally {
    loading.value = false
  }
}

function prevMonth() {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
  loadShows()
}

function nextMonth() {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
  loadShows()
}

function goToToday() {
  const now = new Date()
  currentYear.value = now.getFullYear()
  currentMonth.value = now.getMonth() + 1
  loadShows()
}

function toggleTag(tag: string) {
  const tags = new Set(selectedTags.value)
  if (tags.has(tag)) tags.delete(tag)
  else tags.add(tag)
  selectedTags.value = tags
  loadShows()
}

function clearTags() {
  selectedTags.value = new Set()
  loadShows()
}

watch(() => route.params.productionId, () => loadShows())

onMounted(async () => {
  allTags.value = await fetchShowTags()
  await loadShows()
})
</script>
