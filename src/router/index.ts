import { createRouter, createWebHistory } from "vue-router";

import AuthRoutes from "./auth.routes";

export const routes = [
  {
    path: "/",
    redirect: (to: any) => ({ path: "/dashboard", query: to.query }),
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
  {
    path: "/house",
    meta: {
      requiresAuth: true,
      layout: "landing",
    },
    component: () => import("@/views/HouseDetailPage.vue"),
  },
  //管理员
  {
    path: "/admin",
    meta: {
      requiresAuth: true,
      layout: "landing",
    },
    component: () => import("@/views/AdminPanelPage.vue"),
  },
  //房东发布房源界面：
  {
    path: "/landlordUpload",
    meta: {
      requiresAuth: true,
      layout: "landing",
    },
    component: () => import("@/views/UploadHousePage.vue"),
  },
  {
    path: "/landlordUpdate/:id",
    meta: {
      requiresAuth: true,
      layout: "landing",
    },
    component: () => import("@/views/UpdateHousePage.vue"),
  },
  //房东的房源
  {
    path: "/myHouse",
    meta: {
      requiresAuth: true,
      layout: "landing",
    },
    component: () => import("@/views/MyHousePage.vue"),
  },
  {
    path: "/house/:id",
    meta: {
      requiresAuth: true,
      layout: "landing",
    },
    component: () => import("@/views/HouseDetailPage.vue"),
  },
    {
    path: "/landlord",
    meta: {
      requiresAuth: true,
      layout: "landing",
    },
    component: () => import("@/views/LandlordPropertiesPage.vue"),
  },
  {
    path: "/userManage",
    meta: {
      requiresAuth: true,
      layout: "landing",
    },
    component: () => import("@/views/UserManagePage.vue"),
  },
  {
    path: "/ai/chatbot_v1",
    component: () => import("@/views/ChatBotPage.vue"),
    meta: {
      requiresAuth: true,
      layout: "landing",
      // category: "AI",
      title: "ChatBotV1",
    },
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
      path: "/chat",
      meta: {
        requiresAuth: true,
        layout: "landing",
      },
      component: () => import("@/views/ChatPage.vue"),
    },
    {
      path: "/payPay",
      meta: {
        requiresAuth: true,
        layout: "landing",
      },
      component: () => import("@/views/PricingPage.vue"),
    },
    {
      path: "/contract",
      meta: {
        requiresAuth: true,
        layout: "landing",
      },
      component: () => import("@/views/ContractPage.vue"),
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
      path: "/setpassword",
      meta: {
        requiresAuth: true,
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

export default router;
