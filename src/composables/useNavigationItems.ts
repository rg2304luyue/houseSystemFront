import { computed } from "vue";
import configs from "@/configs";
import { useProfileStore } from "@/stores/profileStore";

/** 按当前用户角色过滤后的一级导航项（顶栏与移动端抽屉共用）。 */
export function useNavigationItems() {
  const profileStore = useProfileStore();
  const canAccess = (item: any) =>
    !item.roles || item.roles.includes(Number(profileStore.user?.userType));

  return computed(() =>
    configs.navigation.menu
      .flatMap((area: any) => area.items ?? [])
      .filter((item: any) => canAccess(item)),
  );
}
