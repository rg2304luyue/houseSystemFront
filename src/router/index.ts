import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useProfileStore } from "@/stores/profileStore";

import AuthRoutes from "./auth.routes";

export const routes = [
  {
    path: "/",
    redirect: (to: any) => ({ path: "/houseList", query: to.query }),
    meta: {},
  } as any,
  {
    path: "/dashboard",
    meta: {
      requiresAuth: true,
      layout: "landing",
    },
    component: () => import("@/views/DashboardPage.vue"),
  },
  {
    path: "/houseList",
    meta: {
      requiresAuth: true,
      layout: "landing",
    },
    component: () => import("@/views/HouseListPage.vue"),
  },
  //管理员
  {
    path: "/admin",
    meta: {
      requiresAuth: true,
      roles: [0],
      layout: "landing",
    },
    component: () => import("@/views/AdminUsersPage.vue"),
  },
  //房东发布房源界面：
  {
    path: "/landlordUpload",
    meta: {
      requiresAuth: true,
      roles: [0, 2],
      layout: "landing",
    },
    component: () => import("@/views/HouseFormPage.vue"),
  },
  {
    path: "/landlordUpdate/:id",
    meta: {
      requiresAuth: true,
      roles: [0, 2],
      layout: "landing",
    },
    component: () => import("@/views/HouseFormPage.vue"),
  },
  //房东的房源
  {
    path: "/myHouse",
    meta: {
      requiresAuth: true,
      roles: [0, 2],
      layout: "landing",
    },
    component: () => import("@/views/MyListingsPage.vue"),
  },
  {
    path: "/houses/:id",
    meta: {
      requiresAuth: true,
      layout: "landing",
    },
    component: () => import("@/views/HouseDetailPage.vue"),
  },
  {
    path: "/contract",
    meta: { requiresAuth: true, layout: "landing" },
    component: () => import("@/views/ContractPage.vue"),
  },
  {
    path: "/houses/new",
    meta: { requiresAuth: true, roles: [0, 2], layout: "landing" },
    component: () => import("@/views/HouseFormPage.vue"),
  },
  {
    path: "/houses/:id/edit",
    meta: { requiresAuth: true, roles: [0, 2], layout: "landing" },
    component: () => import("@/views/HouseFormPage.vue"),
  },
  {
    path: "/my-listings",
    meta: { requiresAuth: true, roles: [0, 2], layout: "landing" },
    component: () => import("@/views/MyListingsPage.vue"),
  },
  {
    path: "/admin/users",
    meta: { requiresAuth: true, roles: [0], layout: "landing" },
    component: () => import("@/views/AdminUsersPage.vue"),
  },
  {
    path: "/userManage",
    meta: {
      requiresAuth: true,
      roles: [0],
      layout: "landing",
    },
    component: () => import("@/views/AdminUsersPage.vue"),
  },
  {
    path: "/profile",
    name: "profile",
    component: () =>
      import(/* webpackChunkName: "profile" */ "@/views/ProfilePage.vue"),
    meta: {
      requiresAuth: true,
      layout: "ui",
      title: "Profile",
      category: "Config",
    },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "error",
    component: () =>
      import(/* webpackChunkName: "error" */ "@/views/NotFoundPage.vue"),
  },
  {
    path: "/alipay/payment-result",
    meta: {
      requiresAuth: false,
      layout: "landing",
    },
    component: () => import("@/views/PaymentResultPage.vue"),
  },
  {
    path: "/RentHouse",
    meta: {
      requiresAuth: true,
      layout: "landing",
    },
    component: () => import("@/views/AccountRentHousePage.vue"),
  },
  {
    path: "/chat",
    meta: {
      requiresAuth: true,
      layout: "landing",
    },
    component: () => import("@/views/ChatBotPage.vue"),
  },
  {
    path: "/setpassword",
    meta: {
      requiresAuth: false,
      layout: "landing",
    },
    component: () => import("@/views/ResetPasswordPage.vue"),
  },

  ...AuthRoutes,


];


export const dynamicRoutes = [];

const router = createRouter({
  history: createWebHistory(),
  // hash模式：createWebHashHistory，history模式：createWebHistory
  // process.env.NODE_ENV === "production"

  routes: routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

router.beforeEach((to) => {
  const authStore = useAuthStore();
  if (to.matched.some((record) => record.meta.requiresAuth) && !authStore.isAuthenticated) {
    return { name: "auth-signin", query: { redirect: to.fullPath } };
  }

  const allowedRoles = to.meta.roles as number[] | undefined;
  if (allowedRoles) {
    const profileStore = useProfileStore();
    if (!allowedRoles.includes(Number(profileStore.user?.userType))) {
      return { path: "/dashboard" };
    }
  }

  return true;
});

export default router;
