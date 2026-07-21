<script setup lang="ts">
import apiClient from "@/api/client";
import CopyLabel from "@/components/common/CopyLabel.vue";
import { ref, reactive, computed, watch, onMounted } from "vue";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  addr: string;
  avatarUrl: string | null;
  identityCard: string;
  userType: number;
  collect_id: string;
  seen_id: string;
}

const loading = ref(true);
const deleteDialog = ref(false);
const selectedUser = ref<User | null>(null);

const queryOptions = reactive({
  query: "",
  page: 1,
  per_page: 10,
});

const headers = ref([
  { title: "用户ID", key: "id", width: "80px" },
  { title: "头像", key: "avatarUrl", width: "80px" },
  { title: "用户名", key: "name" },
  { title: "邮箱", key: "email", width: "200px" },
  { title: "电话", key: "phone", width: "150px" },
  { title: "地址", key: "addr", width: "200px" },
  { title: "身份证", key: "identityCard", width: "180px" },
  { title: "用户类型", key: "userType", width: "100px" },
  { title: "操作", key: "actions", width: "120px", sortable: false },
]);

const usersList = ref<User[]>([]);
const filteredUsersList = ref<User[]>([]);

const snackbar = reactive({
  show: false,
  message: "",
  color: "success",
});

/** Extract array from response, handling the interceptor unwrap. */
function extractDataArray(response: any): any[] {
  const body = response.data;
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object" && Array.isArray(body.data)) return body.data;
  return [];
}

const getUsers = async () => {
  loading.value = true;
  try {
    const response = await apiClient.get("/users");
    usersList.value = extractDataArray(response);
    filterUsers();
  } catch (error) {
    console.error("获取用户列表失败:", error);
    snackbar.show = true;
    snackbar.message = "获取用户列表失败";
    snackbar.color = "error";
  } finally {
    loading.value = false;
  }
};

const filterUsers = () => {
  if (!queryOptions.query) {
    filteredUsersList.value = usersList.value;
  } else {
    const query = queryOptions.query.toLowerCase();
    filteredUsersList.value = usersList.value.filter(
      (user) =>
        (user.name ?? "").toLowerCase().includes(query) ||
        (user.email ?? "").toLowerCase().includes(query) ||
        (user.phone ?? "").includes(query) ||
        (user.addr ?? "").toLowerCase().includes(query)
    );
  }
};

watch(
  () => queryOptions.query,
  () => {
    filterUsers();
  }
);

const paginatedUsers = computed(() => {
  const start = (queryOptions.page - 1) * queryOptions.per_page;
  const end = start + queryOptions.per_page;
  return filteredUsersList.value.slice(start, end);
});

const onUpdateOptions = (options: any) => {
  queryOptions.per_page = options.itemsPerPage;
  queryOptions.page = options.page;
};

const confirmDelete = (user: User) => {
  selectedUser.value = user;
  deleteDialog.value = true;
};

const deleteUser = async () => {
  if (!selectedUser.value) return;
  try {
    await apiClient.delete(`/users/${selectedUser.value.id}`);
    snackbar.show = true;
    snackbar.message = "删除成功";
    snackbar.color = "success";
    deleteDialog.value = false;
    await getUsers();
  } catch (error) {
    console.error("删除用户失败:", error);
    snackbar.show = true;
    snackbar.message = "删除用户失败";
    snackbar.color = "error";
  }
};

const getUserTypeLabel = (type: number) => {
  switch (type) {
    case 0:
      return { text: "管理员", color: "purple" };
    case 1:
      return { text: "普通用户", color: "blue" };
    case 2:
      return { text: "房东", color: "green" };
    default:
      return { text: "未知", color: "grey" };
  }
};

const formatIdCard = (idCard: string) => {
  if (!idCard || idCard.length < 6) return idCard || "未填写";
  const len = idCard.length;
  const prefix = idCard.substring(0, 3);
  const suffix = idCard.substring(Math.max(len - 3, 3));
  return `${prefix}${"*".repeat(Math.max(len - 6, 0))}${suffix}`;
};

onMounted(() => {
  getUsers();
});
</script>

<template>
  <v-container>
    <v-card>
      <v-card-title class="font-weight-bold">
        <span>
          <v-icon class="mr-2">mdi-account-group</v-icon>
          用户管理
        </span>
        <v-spacer></v-spacer>
        <div class="w-25">
          <v-text-field
            v-model="queryOptions.query"
            variant="solo"
            prepend-inner-icon="mdi-magnify"
            label="搜索用户"
            single-line
            hide-details
            clearable
            density="compact"
          ></v-text-field>
        </div>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-0">
        <v-data-table
          :headers="headers"
          :items="paginatedUsers"
          :loading="loading"
          :items-per-page="queryOptions.per_page"
          :items-length="filteredUsersList.length"
          item-value="id"
          @update:options="onUpdateOptions"
          fixed-header
          height="700"
        >
          <template v-slot:item="{ item }">
            <tr>
              <td class="font-weight-bold">{{ item.id }}</td>
              <td>
                <v-avatar size="35">
                  <v-img
                    v-if="item.avatarUrl"
                    :src="item.avatarUrl"
                    alt="avatar"
                  />
                  <v-icon v-else size="35" color="grey">
                    mdi-account-circle
                  </v-icon>
                </v-avatar>
              </td>
              <td class="font-weight-medium">
                <CopyLabel :text="item.name" />
              </td>
              <td>
                <CopyLabel :text="item.email" />
              </td>
              <td>{{ item.phone || "未填写" }}</td>
              <td>{{ item.addr || "未填写" }}</td>
              <td class="text-body-2">{{ formatIdCard(item.identityCard) }}</td>
              <td>
                <v-chip
                  size="small"
                  :color="getUserTypeLabel(item.userType).color"
                  class="font-weight-bold"
                >
                  {{ getUserTypeLabel(item.userType).text }}
                </v-chip>
              </td>
              <td>
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  color="error"
                  @click="confirmDelete(item)"
                  :disabled="item.userType === 0"
                  title="删除用户"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </td>
            </tr>
          </template>

          <template v-slot:no-data>
            <div class="text-center py-5">
              <v-icon size="48" color="grey">mdi-account-off</v-icon>
              <p class="text-grey mt-2">暂无用户数据</p>
            </div>
          </template>

          <template v-slot:loading>
            <v-skeleton-loader
              v-for="i in 5"
              :key="i"
              type="table-row"
              class="mx-auto"
            ></v-skeleton-loader>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">
          <v-icon class="mr-2" color="error">mdi-alert</v-icon>
          确认删除
        </v-card-title>
        <v-card-text>
          确定要删除用户
          <strong>{{ selectedUser?.name }}</strong>
          (ID: {{ selectedUser?.id }}) 吗？此操作不可撤销。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" variant="elevated" @click="deleteUser">
            确认删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<style lang="scss" scoped>
:deep(.v-data-table) {
  .v-data-table__tr {
    &:hover {
      background-color: rgba(0, 0, 0, 0.02);
    }
  }
}
</style>
