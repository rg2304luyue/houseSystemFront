import { defineStore } from "pinia";

export const useProfileStore = defineStore({
  id: "userProfile",
  state: () => ({
    basic: {
      username: "",
      realname: "",
      email: "",
      avatar: "",
      location: "",
      role: "user",
      disabled: false,
      about: "",
      lastSignIn: "",
    },
    user: {
      addr: "",
      collect_id: "",
      email: "",
      id: null,
      identityCard: "",
      name: "",
      phone: "",
      seen_id: "",
      userType: 1,
      avatarUrl: "",
    } as any,
    account: {
      userid: "",
      email: "",
      firstname: "",
      lastname: "",
      addr1: "",
      addr2: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      phone: "",
    },
    signon: {
      username: "",
      password: "",
      githubUuid: "",
      avatarUrl: "",
    },

    notifications: {
      officialEmails: true,
      followerUpdates: true,
    },
  }),
  actions: {
    // 在 actions 中添加的用户头像更改
    //-----------------------------------------------
    updateAvatar(newAvatarUrl: string) {
      this.user.avatarUrl = newAvatarUrl;
      this.signon.avatarUrl = newAvatarUrl;
      this.basic.avatar = newAvatarUrl;
    },
    // 获取用户的 ID
    getUserId(): string {
      return this.user?.id || 'anonymous';
    },
   
    
    // 清除用户信息 (例如退出登录时调用)
    clearUserProfile() {
      this.$reset();
    },
    getUser(){
    return{user:this.user} ;
    },
    getProfile() {
      return {
        basic: this.basic,
        notifications: this.notifications,
        user: this.user,
      };
    },
    setUser(userVO: any) {
    const value = (camel: string, snake: string, fallback: any = "") => userVO?.[camel] ?? userVO?.[snake] ?? fallback;
    this.user = {
      addr: value('addr', 'addr'), collect_id: value('collect_id', 'collect_id'), email: value('email', 'email'),
      id: value('id', 'id', null), identityCard: value('identityCard', 'identity_card'), name: value('name', 'name'),
      phone: value('phone', 'phone'), seen_id: value('seen_id', 'seen_id'), userType: value('userType', 'user_type', 1),
      avatarUrl: value('avatarUrl', 'avatar_url'),
    }
  },
    // 一次性设置完整 profile 对象（从后端接口获取后的数据）
    setProfileFromVO(vo: any) {
      this.setUser(vo);
      
    },
     
    updateUserInfo(newInfo: Partial<typeof this.user>) {
      this.user = { ...this.user, ...newInfo };
    },
    // update Basic Info
    updateBasicInfo(info) {
      this.basic = { ...this.basic, ...info };
    },

    // Update Notifications
    updateNotificationSettings(settings) {
      this.notifications = { ...this.notifications, ...settings };
    },
  },
  // 只持久化非敏感的展示字段；身份证号、手机号等 PII 不落 localStorage
  persist: {
    pick: ["basic", "account", "notifications", "user.id", "user.name", "user.userType", "user.avatarUrl"],
  },
});
