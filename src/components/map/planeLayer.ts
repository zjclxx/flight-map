import { Feature } from "ol";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/WebGLVector";
import { fromLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";
import PlaneIcon from "@/assets/plane.svg";
import { flightStateApi } from "@/api/index";

export interface IFlightState {
  icao24: string;
  timePosition: number;
  lon: number; //经度
  lat: number; //维度
  altitude: number; //高度
  velocity: number; //速度
  heading: number; //角度
}
export async function createPlaneLayers() {
  const planeLayer = await createPlaneVector();

  const planePathLayer = await createPlanePathVector();

  return [...planeLayer, ...planePathLayer];
}

// 飞机层
async function createPlaneVector() {
  const res = await flightStateApi();

  const planeLayers = res.data.map((item: IFlightState) => {
    return new Feature({
      geometry: new Point(fromLonLat([item.lon, item.lat])),
      ...item,
      isHovered: 0, //是否鼠标移入
      isSelected: 0, //是否选中
    });
  });

  const source = new VectorSource({
    features: planeLayers,
  });
  const defaultPlaneStyle = {
    "icon-src": PlaneIcon,
    "icon-width": 32,
    "icon-height": 32,
    "icon-anchor": [0.5, 0.5],
    "icon-rotate-with-view": true,
    "icon-rotation": ["get", "heading"],
  };

  const activePlaneStyle = { ...defaultPlaneStyle, "icon-color": "#f31" };

  const planeLayer = new VectorLayer({
    source,
    style: [
      {
        filter: ["==", ["+", ["get", "isHovered"], ["get", "isSelected"]], 0],
        style: defaultPlaneStyle,
      },
    ],
    // name: "plane",//添加自定义属性 用于判断哪个层
  });
  planeLayer.set("name", "plane"); // 上面的直接添加在构造方法的参数ts校验失败

  const activePlaneLayer = new VectorLayer({
    source,
    style: [
      {
        filter: [">", ["+", ["get", "isHovered"], ["get", "isSelected"]], 0],
        style: activePlaneStyle,
      },
    ],
  });
  activePlaneLayer.set("name", "plane");

  return [planeLayer, activePlaneLayer];
}

// 飞机轨迹层
async function createPlanePathVector() {
  const pathLayer = new VectorLayer({
    source: new VectorSource({
      features: [],
    }),
    style: {
      "stroke-color": "#3498db",
      "stroke-width": 2,
    },
  });
  pathLayer.set("name", "planePath");

  return [pathLayer];
}
