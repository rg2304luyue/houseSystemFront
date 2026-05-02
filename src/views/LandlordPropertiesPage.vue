<template>
  <div class="pa-6">
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">房源管理</h1>
      <v-btn color="primary" @click="openForm()">+ 新增房源</v-btn>
    </div>

    <v-data-table
      :headers="headers"
      :items="properties"
      :items-per-page="10"
      border
      striped
    >
      <template #item.price="{ item }">￥{{ item.price }}</template>
      <template #item.actions="{ item, index }">
        <v-btn variant="text" color="primary" size="small" @click="openForm(item, index)">编辑</v-btn>
        <v-btn variant="text" color="error" size="small" @click="confirmDelete(index)">删除</v-btn>
      </template>
    </v-data-table>

    <v-alert
      v-if="!properties.length"
      type="info"
      text="暂无房源信息"
      class="mt-10"
    />

    <!-- 新增/编辑弹窗 -->
    <v-dialog v-model="showForm" :max-width="dialogWidth" persistent>
      <v-card>
        <v-card-title>{{ editIndex !== null ? '编辑房源' : '新增房源' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" @submit.prevent="saveProperty">
            <v-row dense>
              <v-col cols="12">
                <v-text-field v-model="form.house_num" label="房源编号" :rules="[requiredRule]" />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="form.title" label="标题" :rules="[requiredRule]" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="form.region" label="区" :rules="[requiredRule]" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="form.block" label="街道" :rules="[requiredRule]" />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="form.community" label="小区" :rules="[requiredRule]" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model.number="form.area" label="面积（㎡）" type="number" :rules="[requiredRule]" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model.number="form.price" label="价格（元/月）" type="number" :rules="[requiredRule]" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="form.rent_type"
                  label="租赁方式"
                  :items="rentTypeOptions"
                  :rules="[requiredRule]"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="form.decoration" label="装修情况" placeholder="如精装" />
              </v-col>
              <v-col cols="12" sm="4">
                <v-switch v-model="form.subway" label="近地铁" :true-value="1" :false-value="0" color="primary" />
              </v-col>
              <v-col cols="12" sm="4">
                <v-switch v-model="form.available" label="随时看房" :true-value="1" :false-value="0" color="primary" />
              </v-col>
              <v-col cols="12" sm="4">
                <v-switch v-model="form.tag_new" label="新上" :true-value="1" :false-value="0" color="primary" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="form.landlord" label="房东" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="form.phone_num" label="房东电话" />
              </v-col>
              <v-col cols="12">
                <v-file-input
                  v-model="form.photos"
                  label="房源图片"
                  accept="image/*"
                  multiple
                  prepend-icon="mdi-camera"
                  show-size
                />
              </v-col>
              <v-col cols="12">
                <v-file-input
                  v-model="form.videos"
                  label="房源视频"
                  accept="video/*"
                  multiple
                  prepend-icon="mdi-video"
                  show-size
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeForm">取消</v-btn>
          <v-btn color="primary" @click="saveProperty">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认弹窗 -->
    <v-dialog v-model="showDeleteConfirm" max-width="400">
      <v-card>
        <v-card-title>提示</v-card-title>
        <v-card-text>确认删除该房源？</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteConfirm = false">取消</v-btn>
          <v-btn color="error" @click="doDelete">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSnackbarStore } from '@/stores/snackbarStore'
import apiClient from '@/api/client'

const snackbar = useSnackbarStore()

const headers = [
  { title: '房源编号', key: 'house_num', width: 80 },
  { title: '标题', key: 'title', minWidth: 120 },
  { title: '小区', key: 'community', minWidth: 120 },
  { title: '面积 (㎡)', key: 'area', width: 100 },
  { title: '朝向', key: 'direction', width: 80 },
  { title: '户型', key: 'rooms', width: 120 },
  { title: '租金 (元/月)', key: 'price', width: 120 },
  { title: '装修', key: 'decoration', width: 80 },
  { title: '租赁方式', key: 'rent_type', width: 100 },
  { title: '操作', key: 'actions', width: 160, sortable: false }
]

const rentTypeOptions = ['整租', '合租']
const requiredRule = (v) => !!v || '此项为必填项'

const properties = ref([])

onMounted(async () => {
  try {
    const res = await apiClient.get('/houseinfo')
    properties.value = Array.isArray(res.data.data?.items) ? res.data.data.items : []
  } catch (error) {
    snackbar.showErrorMessage('加载房源数据失败')
  }
})

const showForm = ref(false)
const editIndex = ref(null)
const formRef = ref(null)

const form = ref({
  house_num: '',
  title: '',
  region: '',
  block: '',
  community: '',
  area: null,
  direction: '',
  rooms: '',
  price: null,
  rent_type: '',
  decoration: '',
  subway: 0,
  available: 1,
  tag_new: 0,
  landlord: '',
  phone_num: '',
  photos: [],
  videos: []
})

const dialogWidth = computed(() => {
  if (window.innerWidth > 1024) return 600
  if (window.innerWidth > 768) return 500
  return '95%'
})

function resetForm() {
  Object.assign(form.value, {
    house_num: '',
    title: '',
    region: '',
    block: '',
    community: '',
    area: null,
    direction: '',
    rooms: '',
    price: null,
    rent_type: '',
    decoration: '',
    subway: 0,
    available: 1,
    tag_new: 0,
    landlord: '',
    phone_num: '',
    photos: [],
    videos: []
  })
}

function openForm(property = null, index = null) {
  if (property) {
    Object.assign(form.value, {
      ...property,
      photos: property.photos || [],
      videos: property.videos || []
    })
    editIndex.value = index
  } else {
    resetForm()
    editIndex.value = null
  }
  showForm.value = true
}

function closeForm() {
  showForm.value = false
}

async function saveProperty() {
  const valid = await formRef.value?.validate()
  if (!valid.valid) return

  try {
    const formData = new FormData()
    for (const key in form.value) {
      if (key === 'photos' || key === 'videos') {
        const files = form.value[key]
        if (Array.isArray(files)) {
          files.forEach((f) => formData.append(key + '[]', f))
        }
      } else {
        formData.append(key, form.value[key] ?? '')
      }
    }

    const url = editIndex.value !== null
      ? `/houseinfo/${form.value.house_num || ''}`
      : '/houseinfo'
    const method = editIndex.value !== null ? 'put' : 'post'

    await apiClient[method](url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    if (editIndex.value !== null) {
      properties.value[editIndex.value] = { ...form.value }
      snackbar.showSuccessMessage('房源更新成功')
    } else {
      properties.value.push({ ...form.value })
      snackbar.showSuccessMessage('房源添加成功')
    }
    closeForm()
  } catch (err) {
    snackbar.showErrorMessage(err.message || '保存失败')
  }
}

const showDeleteConfirm = ref(false)
const deleteIndex = ref(null)

function confirmDelete(index) {
  deleteIndex.value = index
  showDeleteConfirm.value = true
}

function doDelete() {
  properties.value.splice(deleteIndex.value, 1)
  snackbar.showSuccessMessage('删除成功')
  showDeleteConfirm.value = false
}
</script>
