<script setup lang="ts">
// App.vue 现在只作为基础布局组件
</script>

<template>
  <div class="root-container">
    <router-view></router-view>
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
  min-height: 100vh;
  color: #333;
}

/* 全局样式重置 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* 移除按钮默认样式 */
button {
  font-family: inherit;
  cursor: pointer;
}

/* 移除输入框默认样式 */
input {
  font-family: inherit;
}
</style>