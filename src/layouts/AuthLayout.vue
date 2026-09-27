<template>
  <div class="auth-wrap d-flex flex-grow-1">
    <aside class="layout-side d-none d-md-flex flex-column justify-space-between">
      <router-link to="/dashboard" class="side-brand">
        <span class="brand-mark"><img src="@/assets/logo-house.svg" alt="" width="18" height="18" /></span>
        好客租房
      </router-link>
      <div class="side-copy">
        <h2>找到理想住所，<br />从这里开始。</h2>
        <p>真实房源 · 在线签约 · AI 找房助手</p>
      </div>
    </aside>
    <main class="auth-main flex-grow-1 d-flex align-center justify-center flex-column">
      <div class="layout-content ma-auto w-full">
        <slot></slot>
      </div>
      <div class="pa-5 text-caption house-muted">© 好客租房</div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.auth-wrap { min-height: 100vh; }

.layout-side {
  position: relative;
  width: 44%;
  max-width: 620px;
  padding: 40px 48px;
  color: #fff;
  background:
    linear-gradient(180deg, rgba(10, 30, 28, .35) 0%, rgba(10, 30, 28, .1) 40%, rgba(10, 30, 28, .78) 100%),
    url("/images/house.jpg") center / cover no-repeat;
}

.side-brand { display: inline-flex; align-items: center; gap: 10px; font-size: 1.15rem; font-weight: 700; letter-spacing: .04em; }
.brand-mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(255, 255, 255, .18);
  backdrop-filter: blur(6px);
}
.brand-mark img { filter: brightness(0) invert(1); }
.side-copy h2 { font-size: 2.1rem; line-height: 1.3; font-weight: 700; }
.side-copy p { margin-top: 12px; opacity: .85; letter-spacing: .06em; }

.auth-main { background: rgb(var(--v-theme-surface)); padding: 24px; }

.layout-content {
  max-width: 440px;
}
</style>
