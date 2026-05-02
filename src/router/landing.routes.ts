export default [
  {
    path: "/landing/toolbar",
    name: "landing-toolbar",
    component: () =>
      import(
        /* webpackChunkName: "landing-toolbar" */ "@/views/ToolbarPage.vue"
      ),
    meta: {
      requiresAuth: true,
      layout: "landing",
    },
  },
];
