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
      this.user = null;
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
    this.user = {
      addr: userVO.addr,
      collect_id: userVO.collect_id,
      email: userVO.email,
      id: userVO.id,
      identityCard: userVO.identityCard,
      name: userVO.name,
      phone: userVO.phone,
      seen_id: userVO.seen_id,
      userType: userVO.userType,
      avatarUrl: userVO.avatarUrl,
    }
  },
    // 一次性设置完整 profile 对象（从后端接口获取后的数据）
    setProfileFromVO(vo: any) {
      this.user = {
        addr: vo.addr,
        collect_id: vo.collect_id,
        email: vo.email,
        id: vo.id,
        identityCard: vo.identityCard,
        name: vo.name,
        phone: vo.phone,
        seen_id: vo.seen_id,
        userType: vo.userType,
        avatarUrl: vo.avatarUrl,
      };
      
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
  persist: true,
});
