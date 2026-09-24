<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true,
    // 'arrow-loop' | 'star-outline' | 'heart-outline' | 'squiggle' | 'burst' | 'sparkle' | 'spiral' | 'dots-cluster'
  },
  color: {
    type: String,
    default: 'currentColor'
  },
  size: {
    type: [Number, String],
    default: 48
  },
  class: {
    type: String,
    default: ''
  }
})

const sizePx = computed(() => {
  return typeof props.size === 'number' ? `${props.size}px` : props.size
})
</script>

<template>
  <!-- 1. Looping Curved Arrow (Hand-drawn style) -->
  <svg
    v-if="name === 'arrow-loop'"
    :style="{ width: sizePx, height: sizePx, color: color }"
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :class="props.class"
  >
    <path
      d="M62 58 C55 32, 60 16, 44 14 C30 12, 22 26, 32 38 C42 48, 54 36, 46 22 C36 10, 18 20, 14 38"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M10 28 L14 40 L26 36"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>

  <!-- 1b. Curved Arrow pointing Right/Down -->
  <svg
    v-else-if="name === 'arrow-curve'"
    :style="{ width: sizePx, height: sizePx, color: color }"
    viewBox="0 0 80 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :class="props.class"
  >
    <path
      d="M12 18 C30 10, 60 15, 66 38"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-dasharray="0"
    />
    <path
      d="M56 34 L67 40 L69 28"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>

  <!-- 2. Hand-drawn Outline Star -->
  <svg
    v-else-if="name === 'star-outline'"
    :style="{ width: sizePx, height: sizePx, color: color }"
    viewBox="0 0 60 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :class="props.class"
  >
    <path
      d="M30 7 L37.5 21 L53 23.5 L41.5 35 L44.5 50.5 L30 42.5 L15.5 50.5 L18.5 35 L7 23.5 L22.5 21 Z"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>

  <!-- 3. Hand-drawn Outline Heart -->
  <svg
    v-else-if="name === 'heart-outline'"
    :style="{ width: sizePx, height: sizePx, color: color }"
    viewBox="0 0 60 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :class="props.class"
  >
    <path
      d="M30 48 C20 40, 9 30, 9 19 C9 11, 15.5 7, 23 8 C27 8.5, 30 12, 30 12 C30 12, 33 8.5, 37 8 C44.5 7, 51 11, 51 19 C51 30, 40 40, 30 48 Z"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>

  <!-- 4. Squiggly Wavy Line -->
  <svg
    v-else-if="name === 'squiggle'"
    :style="{ width: sizePx, height: `calc(${sizePx} * 0.35)`, color: color }"
    viewBox="0 0 100 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :class="props.class"
  >
    <path
      d="M8 15 C18 5, 26 25, 38 15 C50 5, 58 25, 70 15 C80 6, 88 22, 94 15"
      stroke="currentColor"
      stroke-width="3.5"
      stroke-linecap="round"
    />
  </svg>

  <!-- 5. Three-Ray Radiant Burst / Sparks -->
  <svg
    v-else-if="name === 'burst'"
    :style="{ width: sizePx, height: sizePx, color: color }"
    viewBox="0 0 60 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :class="props.class"
  >
    <path
      d="M30 10 L30 22 M14 24 L24 30 M46 24 L36 30"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
    />
  </svg>

  <!-- 6. Four-Point Sparkle Twinkle -->
  <svg
    v-else-if="name === 'sparkle'"
    :style="{ width: sizePx, height: sizePx, color: color }"
    viewBox="0 0 60 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :class="props.class"
  >
    <path
      d="M30 6 C30 22, 38 30, 54 30 C38 30, 30 38, 30 54 C30 38, 22 30, 6 30 C22 30, 30 22, 30 6 Z"
      fill="currentColor"
    />
  </svg>

  <!-- 7. Hand-drawn Swirl / Spiral -->
  <svg
    v-else-if="name === 'spiral'"
    :style="{ width: sizePx, height: sizePx, color: color }"
    viewBox="0 0 60 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :class="props.class"
  >
    <path
      d="M28 28 A3 3 0 0 1 31 29 A7 7 0 0 1 27 38 A12 12 0 0 1 18 25 A17 17 0 0 1 39 16 A21 21 0 0 1 48 38"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
    />
  </svg>

  <!-- 8. Soft Pastel Circle Cluster -->
  <svg
    v-else-if="name === 'dots-cluster'"
    :style="{ width: sizePx, height: sizePx }"
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :class="props.class"
  >
    <!-- Pink large dot -->
    <circle cx="28" cy="46" r="16" fill="#FF74BC" fill-opacity="0.85" />
    <!-- Yellow medium dot -->
    <circle cx="62" cy="24" r="11" fill="#FFDC58" fill-opacity="0.95" />
    <!-- Sky blue small dot -->
    <circle cx="56" cy="62" r="7" fill="#3DA5FF" fill-opacity="0.85" />
    <!-- Purple mini dot -->
    <circle cx="20" cy="18" r="5" fill="#A78BFA" fill-opacity="0.75" />
  </svg>

  <!-- 9. Two Floating Pastel Dots -->
  <svg
    v-else-if="name === 'dots-duo'"
    :style="{ width: sizePx, height: `calc(${sizePx} * 0.7)` }"
    viewBox="0 0 60 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :class="props.class"
  >
    <circle cx="18" cy="20" r="12" fill="#FF74BC" fill-opacity="0.85" />
    <circle cx="44" cy="24" r="8" fill="#FFDC58" fill-opacity="0.9" />
  </svg>
</template>
