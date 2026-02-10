<template>
  <!-- 用ElConfigProvider包裹整个应用，配置中文语言 -->
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<script setup>
// 引入中文语言包和配置组件
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>

<style>
/* 全局样式（如果有） */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>