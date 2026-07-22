export default {
  menu: [
    {
      text: "导航",
      items: [
        { text: "首页", link: "/dashboard", icon: "mdi-view-dashboard-outline" },
        { text: "找房", link: "/houseList", icon: "mdi-home-search-outline" },
        { text: "AI 找房助手", link: "/chat", icon: "mdi-robot-outline" },
        { text: "我的房源", link: "/my-listings", icon: "mdi-home-city-outline", roles: [0, 2] },
        { text: "用户管理", link: "/admin", icon: "mdi-account-group-outline", roles: [0] },
      ],
    },
  ],
};
