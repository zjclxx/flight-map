<template>
  <div class="map" ref="mapRef">
    <div class="loading-text" v-if="loading">加载中...</div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, useTemplateRef, ref, onBeforeUnmount } from "vue";
  import { initMap } from "./index";
  import { loginApi } from "@/api/index";
  const mapRef = useTemplateRef("mapRef");

  onMounted(async () => {
    try {
      await auth();
      initMap(mapRef.value);
    } catch {}
  });

  onBeforeUnmount(() => {
    if (timer.value) {
      clearTimeout(timer.value);
      timer.value = null;
    }
  });

  const loading = ref<boolean>(true);
  const timer = ref<number | null>();

  const auth = async () => {
    const lastTokenTime = localStorage.getItem("lastTokenTime") || "0";
    const lastToken = localStorage.getItem("token");
    if (
      lastToken &&
      lastTokenTime &&
      new Date().getTime() - Number(lastTokenTime) < 1000 * 60 * 30
    ) {
      loading.value = false;
      return;
    }
    try {
      loading.value = true;
      const res = await loginApi();
      const token = res.data.access_token;
      localStorage.setItem("token", token);
      localStorage.setItem("lastTokenTime", new Date().getTime() + "");
      timer.value = setTimeout(() => {
        loading.value = false;
      }, 1000 * 2);
    } catch (error) {
      console.log(error);
      throw new Error("登录失败");
    }
  };
</script>

<style scoped>
  .map {
    position: fixed;
    inset: 0;
    .loading-text {
      margin: auto;
      font-size: 50px;
    }
  }
</style>
