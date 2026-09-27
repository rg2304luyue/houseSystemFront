<template>
  <div class="not-found">
    <div class="nf-code" aria-hidden="true">404</div>
    <h1 class="nf-title">页面走丢了</h1>
    <p class="house-muted mt-2 mb-6">
      您访问的页面不存在或已被移除，去首页看看新上架的房源吧。
    </p>
    <v-btn color="primary" variant="flat" size="large" prepend-icon="mdi-home-outline" to="/">
      回到首页
    </v-btn>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 60vh;
  padding: 48px 16px;
}

.nf-code {
  font-size: clamp(5rem, 18vw, 9rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.04em;
  color: rgb(var(--v-theme-primary));
  margin-bottom: 16px;
  user-select: none;
}

.nf-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--house-ink);
}
</style>
