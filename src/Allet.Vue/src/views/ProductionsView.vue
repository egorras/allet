<template>
  <h1>Productions</h1>
  <p>Opera, ballet &amp; theatre productions by season.</p>

  <div class="row g-2 align-items-end mb-3">
    <div class="col-md-3">
      <input type="search" class="form-control" placeholder="Search..." v-model="searchText" @input="loadProductions" />
    </div>
    <div class="col-auto">
      <select class="form-select" v-model="selectedSeason" @change="loadProductions">
        <option value="">All seasons</option>
        <option v-for="s in filters.seasons" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>
    <div class="col-auto">
      <select class="form-select" v-model="selectedCategory" @change="loadProductions">
        <option value="">All categories</option>
        <option v-for="c in filters.categories" :key="c" :value="c">{{ c }}</option>
      </select>
    </div>
    <div class="col-auto">
      <select class="form-select" v-model="sortBy" @change="loadProductions">
        <option value="title-asc">Title (A-Z)</option>
        <option value="title-desc">Title (Z-A)</option>
        <option value="newest">Newest first</option>
        <option value="season">Season</option>
      </select>
    </div>
    <div class="col-auto">
      <div class="btn-group" role="group">
        <button type="button" class="btn btn-sm" :class="viewMode === 'gallery' ? 'btn-primary' : 'btn-outline-primary'" @click="viewMode = 'gallery'">Gallery</button>
        <button type="button" class="btn btn-sm" :class="viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'" @click="viewMode = 'table'">Table</button>
      </div>
    </div>
    <div class="col-auto">
      <button class="btn btn-outline-secondary btn-sm" @click="clearFilters">Clear</button>
    </div>
  </div>

  <div v-if="loading">
    <p><em>Loading...</em></p>
  </div>
  <div v-else-if="productions.length === 0" class="alert alert-info mt-3">
    No productions found.
  </div>
  <div v-else-if="viewMode === 'gallery'" class="row mt-3">
    <div v-for="p in productions" :key="p.id" class="col-md-4 col-lg-3 mb-4">
      <ProductionCard :production="p" />
    </div>
  </div>
  <div v-else class="table-responsive mt-3">
    <table class="table table-striped table-hover">
      <thead>
        <tr>
          <th>Title</th>
          <th>Season</th>
          <th>Category</th>
          <th>Tags</th>
          <th>Shows</th>
          <th>Running Time</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in productions" :key="p.id">
          <td><router-link :to="`/productions/${p.id}`">{{ p.title }}</router-link></td>
          <td>{{ p.season }}</td>
          <td>{{ p.category }}</td>
          <td>
            <TagBadge v-for="tag in p.tags" :key="tag" :tag="tag" />
          </td>
          <td>{{ p.showCount }}</td>
          <td>{{ p.runningTimeMinutes ? `${p.runningTimeMinutes} min` : '\u2014' }}</td>
          <td><router-link :to="`/productions/${p.id}`" class="btn btn-sm btn-outline-primary">Details</router-link></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchProductions, fetchProductionFilters } from '../api/productions'
import type { ProductionListItem, FiltersDto } from '../types'
import ProductionCard from '../components/ProductionCard.vue'
import TagBadge from '../components/TagBadge.vue'

const productions = ref<ProductionListItem[]>([])
const filters = ref<FiltersDto>({ seasons: [], categories: [] })
const loading = ref(true)
const searchText = ref('')
const selectedSeason = ref('')
const selectedCategory = ref('')
const sortBy = ref('title-asc')
const viewMode = ref('gallery')

async function loadProductions() {
  loading.value = true
  try {
    productions.value = await fetchProductions({
      search: searchText.value,
      season: selectedSeason.value,
      category: selectedCategory.value,
      sort: sortBy.value,
    })
  } finally {
    loading.value = false
  }
}

function clearFilters() {
  searchText.value = ''
  selectedSeason.value = ''
  selectedCategory.value = ''
  sortBy.value = 'title-asc'
  loadProductions()
}

onMounted(async () => {
  filters.value = await fetchProductionFilters()
  await loadProductions()
})
</script>
