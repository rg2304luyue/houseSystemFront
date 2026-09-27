<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useProfileStore } from "@/stores/profileStore";
import defaultAvatar from "@/assets/images/avatars/avatar_user.jpg";

const router = useRouter();
const authStore = useAuthStore();
const profileStore = useProfileStore();

const { isLoggedIn } = storeToRefs(authStore);
const { user } = storeToRefs(profileStore);

const handleLogout = () => {
  authStore.logout();
};

const goToSignIn = () => {
  router.push("/auth/signin");
};

const navs = [
  {
    title: "个人中心",
    link: "/profile",
    icon: "mdi-account-circle-outline",
  },
  {
    title: "我的租约",
    link: "/RentHouse",
    icon: "mdi-key-outline",
  },
];
</script>
<template>
  <!-- 未登录时显示登录按钮 -->
  <div v-if="!isLoggedIn" class="d-flex align-center ga-2 ml-1">
    <v-btn variant="text" class="d-none d-sm-flex" to="/auth/signup">注册</v-btn>
    <v-btn color="primary" variant="flat" @click="goToSignIn">登录</v-btn>
  </div>

  <v-menu
    v-else
    location="bottom end"
    offset="8"
    transition="slide-y-transition"
  >
    <template v-slot:activator="{ props }">
      <v-btn class="ml-1 user-trigger" variant="text" rounded="pill" v-bind="props">
        <v-avatar size="32">
          <v-img :src="user.avatarUrl || defaultAvatar" cover></v-img>
        </v-avatar>
        <span class="ml-2 d-none d-sm-inline user-name">{{ user.name }}</span>
        <v-icon size="18" class="ml-1 d-none d-sm-inline">mdi-chevron-down</v-icon>
      </v-btn>
    </template>
    <v-card min-width="240" max-width="300">
      <v-list density="compact" class="py-2">
        <v-list-item to="/profile" class="mb-1">
          <template v-slot:prepend>
            <v-avatar size="40">
              <v-img :src="user.avatarUrl || defaultAvatar" cover></v-img>
            </v-avatar>
          </template>
          <v-list-item-title class="font-weight-bold">{{ user.name }}</v-list-item-title>
          <v-list-item-subtitle>{{ user.email }}</v-list-item-subtitle>
        </v-list-item>
        <v-divider class="my-1" />
        <v-list-item
          v-for="nav in navs"
          :key="nav.link"
          :to="nav.link"
          :prepend-icon="nav.icon"
          :title="nav.title"
          color="primary"
        />
        <v-divider class="my-1" />
        <v-list-item
          prepend-icon="mdi-logout"
          title="退出登录"
          base-color="error"
          @click="handleLogout"
        />
      </v-list>
    </v-card>
  </v-menu>
</template>

<style scoped>
.user-trigger { padding-inline: 4px 10px !important; }
.user-name { max-width: 96px; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }
</style>
