import type { Feature, Map } from "ol";
import type { FeatureLike } from "ol/Feature";

export function attachEvent(map: Map) {
  attachMoveEvent(map);
  attachClickEvent(map);
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
      layerFilter: (layer) => layer.get("name") === "planes",
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
    }
    const currentFeatures = map.getFeaturesAtPixel(e.pixel, {
      hitTolerance: 3,
      layerFilter: (layer) => layer.get("name") === "planes",
    });
    const currentFeature = currentFeatures[0];
    if (currentFeature) {
      if (isFeature(currentFeature)) {
        currentFeature.set("isSelected", 1);
        lastFeature = currentFeature;
      }
    }
  });
}

function isFeature(feature: FeatureLike): feature is Feature<any> {
  return typeof (feature as Feature<any>).set === "function";
}
