import { Map, Feature } from "ol";
import type { FeatureLike } from "ol/Feature";
import { flightPathApi } from "@/api";
import { fromLonLat } from "ol/proj";
import VectorLayer from "ol/layer/WebGLVector";
import LineString from "ol/geom/LineString";

export function attachEvent(map: Map) {
  attachMoveEvent(map);
  attachClickEvent(map);
  attachMoveEndEvent(map);
}

function attachMoveEvent(map: Map) {
  let lastFeature: FeatureLike | undefined;
  const container = map.getTargetElement();
  map.on("pointermove", (e) => {
    if (e.dragging) return;

    if (lastFeature) {
      if (isFeature(lastFeature)) {
        lastFeature.set("isHovered", 0);
      }
      lastFeature = undefined;
    }
    const currentFeatures = map.getFeaturesAtPixel(e.pixel, {
      hitTolerance: 3,
      layerFilter: (layer) => layer.get("name") === "plane",
    });
    const currentFeature = currentFeatures[0];
    if (currentFeature) {
      if (isFeature(currentFeature)) {
        currentFeature.set("isHovered", 1);
        lastFeature = currentFeature;
        container.style.cursor = "pointer";
      }
    } else {
      container.style.cursor = "default";
    }
  });
}

function attachClickEvent(map: Map) {
  let lastFeature: FeatureLike | undefined;
  map.on("click", (e) => {
    if (e.dragging) return;

    if (lastFeature) {
      if (isFeature(lastFeature)) {
        lastFeature.set("isSelected", 0);
      }
      lastFeature = undefined;
      removePath(map);
    }
    const currentFeatures = map.getFeaturesAtPixel(e.pixel, {
      hitTolerance: 3,
      layerFilter: (layer) => layer.get("name") === "plane",
    });
    const currentFeature = currentFeatures[0];
    if (currentFeature) {
      if (isFeature(currentFeature)) {
        currentFeature.set("isSelected", 1);
      }
      lastFeature = currentFeature;
      // @ts-ignore  重设中心点
      const center = currentFeature.getGeometry()?.getCoordinates();
      map.getView().animate({
        center,
        zoom: 7,
      });
      addPath(currentFeature, map);
    }
  });
}

function isFeature(feature: FeatureLike): feature is Feature<any> {
  return typeof (feature as Feature<any>).set === "function";
}

interface ILonLat {
  lon: number;
  lat: number;
}
async function addPath(planeLayer: FeatureLike, map: Map) {
  const id = planeLayer.get("icao24");
  const res = await flightPathApi(id);
  const pathArr = res.data.path.map((x: ILonLat) => {
    return fromLonLat([x.lon, x.lat]);
  });
  const pathLayer = map
    .getLayers()
    .getArray()
    .find((x) => x.get("name") === "planePath");
  if (pathLayer && pathLayer instanceof VectorLayer) {
    const source = pathLayer.getSource();
    source &&
      source.addFeature(
        new Feature({
          geometry: new LineString(pathArr),
        }),
      );
  }
}

function removePath(map: Map) {
  const pathLayer = map
    .getLayers()
    .getArray()
    .find((x) => x.get("name") === "planePath");
  if (pathLayer && pathLayer instanceof VectorLayer) {
    const source = pathLayer.getSource();
    source && source.clear();
  }
}

// 修复地图无限拖动的bug
function attachMoveEndEvent(map: Map) {
  map.on("moveend", () => {
    const view = map.getView();
    if (!view) return;
    const center = view.getCenter();
    if (!center) return;
    const extent = view.getProjection().getExtent();
    if (!extent) return;
    if (
      extent[2] != undefined &&
      extent[0] != undefined &&
      center[0] != undefined &&
      center[1] != undefined
    ) {
      const worldWidth = extent[2] - extent[0];
      const x = center[0];
      view.setCenter([
        ((((x - extent[0]) % worldWidth) + worldWidth) % worldWidth) +
          extent[0],
        center[1],
      ]);
    }
  });
}
