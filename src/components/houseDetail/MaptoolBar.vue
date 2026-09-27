<template>
  <v-toolbar
    rounded="lg"
    color="surface"
    density="compact"
    border
    floating
    class="map-floating-toolbar"
  >
    <v-text-field
      density="compact"
      placeholder="搜索周边地点"
      prepend-inner-icon="mdi-magnify"
      variant="solo"
      class="mx-2 flex-grow-1"
      style="min-width: 160px;"
      flat
      hide-details
      single-line
      clearable
    ></v-text-field>

    <template v-slot:append>
      <v-btn
        density="comfortable"
        icon="mdi-crosshairs-gps"
        color="primary"
        variant="text"
      ></v-btn>
      <v-btn
        class="ms-1"
        density="comfortable"
        icon="mdi-dots-vertical"
        variant="text"
      ></v-btn>
    </template>
  </v-toolbar>
</template>

<style scoped>
.map-floating-toolbar {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: clamp(260px, 70%, 480px);
  z-index: 10;
  box-shadow: var(--house-shadow);
}

.map-floating-toolbar :deep(.v-field) {
  background-color: transparent !important;
  box-shadow: none !important;
}
</style>
