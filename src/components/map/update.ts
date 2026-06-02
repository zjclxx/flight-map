import { flightStateApi } from "@/api";
import { Feature, Map as OlMap } from "ol";
import Point from "ol/geom/Point";
import type VectorLayer from "ol/layer/Vector";
import { fromLonLat } from "ol/proj";

let lastUpdateTime: number = 0; //上一次更新时间
let lastRemoteUpdateTime: number = Date.now(); //上一次远程数据更新时间
const REMOTE_UPDATE_INTERVAL = 30000; //远程数据更新频率 opensky数据每20秒更新一次
let remoteState: any = null; //远程数据

// 根据缩放级别计算更新频率
function getUpdateInterval(zoom: number): number {
  zoom = Math.floor(zoom);
  const intervalArr = [, 5000, 4000, 3000, 2000, 1000, 500, 250, 100, 50]; //地图zoom不会到0，所以第一个元素不使用
  return intervalArr[zoom] || 16;
}

export function updateMap(map: OlMap) {
  requestAnimationFrame(() => {
    updateMap(map);
  });
  const now = Date.now();
  // 计算远程更新频率和更新
  if (now - lastRemoteUpdateTime > REMOTE_UPDATE_INTERVAL) {
    lastRemoteUpdateTime = now;
    flightStateApi().then((res) => {
      remoteState = res.data;
    });
  }

  // 计算本地更新频率和更新
  const zoom = map.getView().getZoom();
  if (!zoom) return;
  const updateInterval = getUpdateInterval(zoom);
  if (now - lastUpdateTime > updateInterval) {
    updateLayers(map);
    lastUpdateTime = now;
  }
}

function updateLayers(map: OlMap) {
  if (remoteState) {
    // 远程数据获取 然后还得本地更新
    applyRemoteState(map);
  }

  // 本地数据更新
  updatePlaneLayers(map);
  updatePlanePathLayer(map);
}

function applyRemoteState(map: OlMap) {
  const layers = map.getLayers().getArray();
  const planeLayer = layers.find(
    (layer) => layer.get("name") === "plane",
  ) as VectorLayer;
  const source = planeLayer?.getSource();
  const features = source?.getFeatures();
  if (!features) return;
  const remoteStateMap = new Map<string, any>();
  if (remoteState) {
    for (const state of remoteState) {
      remoteStateMap.set(state.icao24, state);
    }
  }
  for (const feature of features) {
    const icao24 = feature.get("icao24");
    const newState = remoteStateMap.get(icao24);
    if (newState) {
      feature.set("icao24", newState.icao24);
      feature.set("lon", newState.lon);
      feature.set("lat", newState.lat);
      feature.set("timePosition", newState.timePosition);
      feature.set("velocity", newState.velocity);
      feature.set("heading", newState.heading);
      feature.set("altitude", newState.altitude);
      remoteStateMap.delete(icao24);
    } else {
      source?.removeFeature(feature);
    }
  }
  for (const [_, newState] of remoteStateMap) {
    const feature = new Feature({
      geometry: new Point(fromLonLat([newState.lon, newState.lat])),
      ...newState,
      isHovered: 0,
      isSelected: 0,
    });
    source?.addFeature(feature);
  }
  remoteState = null; //清空远程数据
}

function updatePlaneLayers(map: OlMap) {
  const layers = map.getLayers().getArray();
  const planeLayer = layers.find(
    (layer) => layer.get("name") === "plane",
  ) as VectorLayer;
  const source = planeLayer?.getSource();
  const features = source?.getFeatures();
  if (!features) return;
  for (const feature of features) {
    const lon = feature.get("lon"); //经度
    const lat = feature.get("lat"); //纬度
    const velocity = feature.get("velocity"); //速度（m/s）
    const heading = feature.get("heading"); //航向（弧度）
    const timePosition = feature.get("timePosition"); //位置记录时间（ms）
    if (!velocity || !timePosition) continue;
    const [x, y] = fromLonLat([lon, lat]);
    if (!x || !y) continue;
    const t = Date.now() / 1000 - timePosition; //时间差（s）
    const s = velocity * t; //距离（m）
    const newPoint = [x + s * Math.sin(heading), y + s * Math.cos(heading)];

    feature.getGeometry().setCoordinates(newPoint);
  }
}

function updatePlanePathLayer(map: OlMap) {
  const layers = map.getLayers().getArray();
  const planeLayer = layers.find(
    (layer) => layer.get("name") === "plane",
  ) as VectorLayer;
  const planePathLayer = layers.find(
    (layer) => layer.get("name") === "planePath",
  ) as VectorLayer;

  const pathSource = planePathLayer?.getSource();
  const pathFeatures = pathSource?.getFeatures();
  if (!pathFeatures) return;
  for (const pathFeature of pathFeatures) {
    const pathPoints = pathFeature.getGeometry().getCoordinates();
    const icao24 = pathFeature.get("icao24");
    const planeFeature = planeLayer
      .getSource()
      ?.getFeatures()
      .find((f) => f.get("icao24") === icao24);
    if (!planeFeature) {
      continue;
    }
    const curPoint = planeFeature.getGeometry().getCoordinates();
    pathPoints[pathPoints.length - 1] = curPoint;
    pathFeature.getGeometry().setCoordinates(pathPoints);
  }
}
