import { Feature } from "ol";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/WebGLVector";
import { fromLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";
import PlaneIcon from "@/assets/plane.svg";
import { flightStateApi } from "@/api/index";

interface IFlightState {
  icao24: string;
  timePosition: number;
  lon: number; //经度
  lat: number; //维度
  altitude: number; //高度
  velocity: number; //速度
  heading: number; //角度
}
export async function createPlaneLayers() {
  const res = await flightStateApi();

  const planeLayers = res.data.map((item: IFlightState) => {
    return new Feature({
      geometry: new Point(fromLonLat([item.lon, item.lat])),
      ...item,
    });
  });

  const source = new VectorSource({
    features: planeLayers,
  });
  const planeStyle = {
    "icon-src": PlaneIcon,
    "icon-width": 32,
    "icon-height": 32,
    "icon-anchor": [0.5, 0.5],
    "icon-rotate-with-view": true,
    "icon-rotation": ["get", "heading"],
  };

  const planeLayer = new VectorLayer({
    source,
    style: planeStyle,
  });

  return [planeLayer];
}
