<template>
  <div class="max-w-5xl mx-auto px-6 py-6">
    <v-card class="news-card" elevation="3">
      <template #title>
        <div class="flex items-center gap-2">
          <v-icon icon="mdi-file-document-outline" size="24" />
          <span class="text-2xl font-bold text-gray-800">今日房产新闻</span>
        </div>
      </template>

      <v-card-text>
        <transition name="fade" mode="out-in">
          <div v-if="currentNews" :key="currentNews.id" class="py-4 space-y-3">
            <h3 class="text-xl font-semibold text-indigo-700">{{ currentNews.title }}</h3>
            <div class="text-sm text-gray-500 flex items-center gap-4">
              <span>发布者：{{ currentNews.author }}</span>
              <span>{{ currentNews.date }}</span>
            </div>
            <p class="text-gray-800 leading-7 tracking-wide text-base whitespace-pre-line">
              {{ currentNews.content }}
            </p>
          </div>
        </transition>
      </v-card-text>

      <v-card-actions>
        <v-btn variant="outlined" color="primary" @click="showRandomNews">
          <v-icon icon="mdi-refresh" start />
          换一条
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const newsList = [
  {
    id: 1,
    title: '北京楼市最新动态：房价稳定',
    content: `据统计，北京楼市近期保持平稳，买卖双方较为理性，未来政策或将持续微调。\n专家表示，热点区域仍有上升空间，刚需群体可关注近期推出的新盘。`,
    author: '北京日报',
    date: '2025-05-19'
  },
  {
    id: 2,
    title: '上海出台新政促进租赁市场发展',
    content: `上海市近日发布新政，鼓励房东与租户签订长期租约，并提供税收优惠。\n此外，新政还鼓励企业参与住房租赁服务平台的建设，以提高服务质量。`,
    author: '上海新闻',
    date: '2025-05-17'
  },
  {
    id: 3,
    title: '深圳地铁新增线路即将开通',
    content: `深圳交通部门表示，三条新地铁线路将在下月通车，将有效缓解上下班高峰的拥堵问题。\n房产市场也将因交通改善受益，部分地铁周边小区关注度明显上升。`,
    author: '南方都市报',
    date: '2025-05-16'
  },
  {
    id: 4,
    title: '广州楼市调控升级',
    content: `广州发布最新调控政策，限制部分区域购房资格，打击投机性购房行为。\n政策明确指出，"房住不炒"仍是核心导向，重点保障首套刚需购房人群。`,
    author: '广州日报',
    date: '2025-05-15'
  }
]

const currentNews = ref(null)

function showRandomNews() {
  const index = Math.floor(Math.random() * newsList.length)
  currentNews.value = newsList[index]
}

onMounted(() => {
  showRandomNews()
})
</script>

<style scoped>
.news-card {
  border-radius: 16px;
  transition: box-shadow 0.3s ease;
}
.news-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
