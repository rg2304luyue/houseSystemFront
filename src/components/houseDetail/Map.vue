<template>
  <v-card flat class="map-card h-100">
    <div class="d-flex align-center px-5 pt-5 pb-3">
      <h2 class="house-section-title">详细位置</h2>
    </div>
    <div class="map-wrap mx-5 mb-5">
      <MaptoolBar/>
      <div ref="containerRef" style="width: 100%; height: 400px; position: relative"> </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
//导入地图工具栏
import MaptoolBar from './MaptoolBar.vue';
//导入图标

// 声明全局对象
declare global {
  interface Window {
    BMapGL: any
    onBMapCallback: () => void
  }
}

const props = defineProps<{ address: string }>()
const containerRef = ref<HTMLElement | null>(null)
let map: any

function loadBaiduMapScript(callback: () => void) {
  if (window.BMapGL) {
    callback()
    return
  }

  window.onBMapCallback = callback

  const script = document.createElement('script')
  script.src = 'https://api.map.baidu.com/api?type=webgl&v=1.0&ak=pHRGZ6xQ0bCAta2MAZifRrQkqBeQbtXk&callback=onBMapCallback'
  document.body.appendChild(script)
}

function initMap() {
  if (!containerRef.value) {
    console.error("地图容器未挂载")
    return
  }
 
  map = new window.BMapGL.Map(containerRef.value)
  map.enableScrollWheelZoom(true)
   map.setMapStyleV2({
    styleId: 'f6e6f1bedec9f05de872d3d233bfd6c8' // <--- 在这里填入你的样式ID
  })
  const geocoder = new window.BMapGL.Geocoder()
  geocoder.getPoint(props.address, point => {
    if (point) {
      map.centerAndZoom(point, 15)
      map.clearOverlays()
      map.addOverlay(new window.BMapGL.Marker(point))
    } else {
      console.error("地址解析失败")
    }
  })
}

onMounted(() => {
  loadBaiduMapScript(initMap)
})

watch(() => props.address, (newAddr) => {
  if (map && window.BMapGL) {
    const geocoder = new window.BMapGL.Geocoder()
    geocoder.getPoint(newAddr, point => {
      if (point) {
        map.centerAndZoom(point, 15)
         map.clearOverlays()
        map.addOverlay(new window.BMapGL.Marker(point))
      }
    })
  }
})
</script>

<style scoped>
.map-wrap {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--house-line);
  background: var(--house-soft);
}
</style>
