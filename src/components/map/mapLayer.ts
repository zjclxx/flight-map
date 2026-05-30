import TileLayer from "ol/layer/WebGLTile";
import XYZ from "ol/source/XYZ";
import { LOCAL_MAP_SECRET_KEY } from "@/config/auth";

export function createMapLayers() {
  const APP_SECRET = localStorage.getItem(LOCAL_MAP_SECRET_KEY);
  if (!APP_SECRET) return [];
  return [
    new TileLayer({
      // @ts-ignore
      source: new XYZ({
        url: `http://t0.tianditu.gov.cn/ter_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ter&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${APP_SECRET}`,
      }),
    }),
    new TileLayer({
      // @ts-ignore
      source: new XYZ({
        url: `http://t0.tianditu.gov.cn/cta_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cta&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${APP_SECRET}`,
      }),
    }),
  ];
}
