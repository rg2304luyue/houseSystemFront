<template>
  <v-form @submit.prevent="sendMessage"> <v-container>
      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model="message"
            :append-icon="message ? 'mdi-send' : 'mdi-microphone'"
            label="请输入区域或小区开始找房~"
            variant="solo"
            clearable
            @click:append="sendMessage"
            @click:clear="clearMessage"
            @keydown.enter="sendMessage"
          ></v-text-field>
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>

  <script setup lang="ts">
    import { computed, ref } from 'vue'
  
    const icons = [
      'mdi-emoticon',
      'mdi-emoticon-cool',
      'mdi-emoticon-dead',
      'mdi-emoticon-excited',
      'mdi-emoticon-happy',
      'mdi-emoticon-neutral',
      'mdi-emoticon-sad',
      'mdi-emoticon-tongue',
    ]
  
    const emit = defineEmits(['search'])
    const message = ref('')
    const marker = ref(true)
    const iconIndex = ref(0)
  
    const icon = computed(() => {
      return icons[iconIndex.value]
    })
    function toggleMarker () {
      marker.value = !marker.value
    }
  
    function sendMessage () {
      if (message.value.trim()) {
        // 2. 将搜索内容发送出去
        emit('search', message.value.trim())
      }
      resetIcon()
      // 注意：不要在这里立即调用 clearMessage()，
      // 否则父组件可能拿不到值，或者用户看不见自己搜了什么
    }

    function clearMessage () {
      message.value = ''
      // 清空时也通知父组件重置搜索结果
      emit('search', '')
    }

    function resetIcon () {
      iconIndex.value = 0
    }

    function changeIcon () {
      iconIndex.value === icons.length - 1
        ? iconIndex.value = 0
        : iconIndex.value++
    }
  </script>