<template>
  <span class="badge bg-info text-dark me-1">{{ tag }}</span>
</template>

<script setup lang="ts">
defineProps<{ tag: string }>()
</script>
