import { Map, View } from "ol";
import { createMapLayers } from "./mapLayer";
import "ol/ol.css";

import { fromLonLat } from "ol/proj";

export function initMap(dom: HTMLElement | null) {
  if (!dom) return;
  const center = fromLonLat([116.397428, 39.90923]);
  const map = new Map({
    // 配置
    target: dom,
    // layers: createMapLayers(),//默认图层
    view: new View({
      center,
      zoom: 4,
      minZoom: 1,
      maxZoom: 13,
    }),
  });
  // 动态添加
  const layers = createMapLayers();
  layers.forEach((layer) => {
    map.addLayer(layer);
  });
}
