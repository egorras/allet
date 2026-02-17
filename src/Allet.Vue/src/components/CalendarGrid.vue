<template>
  <div class="calendar-grid">
    <div class="calendar-header">Mon</div>
    <div class="calendar-header">Tue</div>
    <div class="calendar-header">Wed</div>
    <div class="calendar-header">Thu</div>
    <div class="calendar-header">Fri</div>
    <div class="calendar-header">Sat</div>
    <div class="calendar-header">Sun</div>

    <div
      v-for="day in days"
      :key="day.date"
      class="calendar-day"
      :class="{ 'other-month': !isCurrentMonth(day.date), today: isToday(day.date) }"
    >
      <div class="day-number">{{ dayNumber(day.date) }}</div>
      <router-link
        v-for="show in day.shows"
        :key="show.id"
        :to="`/productions/${show.productionId}`"
        class="calendar-event"
        :title="`${show.title} — ${show.venueName || ''} ${formatTime(show.date)}`"
      >
        <span class="event-time">{{ formatTime(show.date) }}</span>
        {{ show.title }}
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarDay } from '../types'

const props = defineProps<{
  days: CalendarDay[]
  currentYear: number
  currentMonth: number
}>()

function dayNumber(dateStr: string): number {
  return parseInt(dateStr.slice(8, 10), 10)
}

function isCurrentMonth(dateStr: string): boolean {
  const m = parseInt(dateStr.slice(5, 7), 10)
  const y = parseInt(dateStr.slice(0, 4), 10)
  return m === props.currentMonth && y === props.currentYear
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10)
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toTimeString().slice(0, 5)
}
</script>

<style scoped>
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border: 1px solid var(--bs-border-color, #dee2e6);
  border-radius: .375rem;
  overflow: hidden;
}

.calendar-header {
  background: var(--bs-tertiary-bg, #f8f9fa);
  padding: .5rem;
  text-align: center;
  font-weight: 600;
  font-size: .85rem;
  border-bottom: 1px solid var(--bs-border-color, #dee2e6);
}

.calendar-day {
  min-height: 100px;
  padding: .25rem .4rem;
  border-right: 1px solid var(--bs-border-color, #dee2e6);
  border-bottom: 1px solid var(--bs-border-color, #dee2e6);
  font-size: .8rem;
  overflow: hidden;
}

.calendar-day:nth-child(7n+7) {
  border-right: none;
}

.calendar-day.other-month {
  background: var(--bs-tertiary-bg, #f8f9fa);
  opacity: .5;
}

.calendar-day.today {
  background: rgba(var(--bs-primary-rgb, 13,110,253), .06);
}

.day-number {
  font-weight: 600;
  margin-bottom: .2rem;
}

.today .day-number {
  color: var(--bs-primary, #0d6efd);
}

.calendar-event {
  display: block;
  padding: .1rem .3rem;
  margin-bottom: .15rem;
  border-radius: .2rem;
  background: var(--bs-primary, #0d6efd);
  color: white !important;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: .75rem;
  line-height: 1.4;
}

.calendar-event:hover {
  opacity: .85;
}

.event-time {
  font-weight: 600;
  margin-right: .2rem;
}
</style>
