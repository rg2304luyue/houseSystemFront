<script setup lang="ts">
import { MdPreview } from "md-editor-v3";
import { sanitizeMarkdownHtml } from "@/utils/markdownSecurity";
import "md-editor-v3/lib/preview.css";

defineProps<{
  content: string;
}>();
</script>

<template>
  <MdPreview
    :model-value="content"
    :sanitize="sanitizeMarkdownHtml"
    :no-echarts="true"
    :no-mermaid="true"
  />
</template>
