<template>
  <div class="map" ref="mapRef">
    <div class="loading-text" v-if="loading">{{ loadingText }}</div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, useTemplateRef, ref, onBeforeUnmount } from "vue";
  import { initMap } from "./index";
  import { loginApi } from "@/api/index";
  import {
    LOCAL_TOKEN_KEY,
    LOCAL_LAST_LOGIN_TIME_KEY,
    LOCAL_MAP_SECRET_KEY,
  } from "@/config/auth";
  const mapRef = useTemplateRef("mapRef");

  const loadingText = ref<string>("加载中...");

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
    const lastTokenTime =
      localStorage.getItem(LOCAL_LAST_LOGIN_TIME_KEY) || "0";
    const lastToken = localStorage.getItem(LOCAL_TOKEN_KEY);
    const mapSecret = localStorage.getItem(LOCAL_MAP_SECRET_KEY);
    if (
      lastToken &&
      lastTokenTime &&
      new Date().getTime() - Number(lastTokenTime) < 1000 * 60 * 30 &&
      mapSecret
    ) {
      loading.value = false;
      return;
    }
    try {
      loading.value = true;
      const res = await loginApi();
      const token = res.data.access_token;
      localStorage.setItem(LOCAL_TOKEN_KEY, token);
      localStorage.setItem(LOCAL_LAST_LOGIN_TIME_KEY, res.data.loginTime);
      localStorage.setItem(LOCAL_MAP_SECRET_KEY, res.data.mapSecret);

      timer.value = setTimeout(() => {
        loading.value = false;
      }, 1000 * 2);
    } catch (error: any) {
      // 网络失败
      if (error.message && error.message === "Network Error") {
        loadingText.value = "网络错误，请检查是否打开了另一个服务";
      } else {
        loadingText.value = "请求失败，请联系管理员";
      }
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
