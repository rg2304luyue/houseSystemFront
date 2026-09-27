// 【未使用】无任何引用（导航实际使用 configs/navigation.ts），可在确认后删除。
export default [
  {
    icon: "mdi-file-lock-outline",
    text: "权限页面",
    regex: /^\/auth/,
    items: [
      {
        icon: "mdi-login",
        text: "登录",
        link: "/auth/signin",
      },
      {
        icon: "mdi-logout",
        text: "注册",
        link: "/auth/signup",
      },
      {
        icon: "mdi-email-check",
        text: "邮箱验证",
        link: "/auth/verify-email",
      },

    ],
  },

];
