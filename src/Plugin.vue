<template>
  <div class="flex flex-row h-screen w-screen">
    <div ref="mapContainer" class="flex-grow w-full h-full relative overflow-visible" />
    <div class="w-[300px] bg-gray-100 p-4 text-sm">
      <div class="mb-4">
        <label class="block font-medium mb-1">Gene:</label>
        <SelectField v-if="features" :features="features" @select="filterFeatures" />
      </div>
      <div>
        <label class="block font-medium mb-1">Base Layer:</label>
        <select v-model="selectedBaseLayer" @change="setBaseLayer" class="w-full p-1 border rounded">
          <option v-for="(layer, name) in baseLayer" :key="name" :value="name">
            {{ name }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// TODO Add datatyping to methods and props
import { ref, onMounted } from "vue";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import { fromLonLat } from "ol/proj";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { Style, Icon } from "ol/style";
import Overlay from "ol/Overlay";
import { baseLayer } from "./baseLayer.js";
import SelectField from "./SelectField.vue";
import axios from "axios";

const props = defineProps<{
  datasetId?: string;
}>();

const mapContainer = ref(null);
const selectedBaseLayer = ref("OpenStreetMap");
const features = ref();

let map, featureSource;

const TOOLTIP_CLASS = "ol-tooltip";
const TOOLTIP_STYLE = "background: white; padding: 6px; border: 1px solid #ccc; border-radius: 4px;";

function setBaseLayer() {
  Object.entries(baseLayer).forEach(([name, layer]) => {
    layer.setVisible(name === selectedBaseLayer.value);
  });
}

function createMap(layer, overlay) {
  map = new Map({
    target: mapContainer.value,
    layers: [...Object.values(baseLayer), layer],
    view: new View({
      center: fromLonLat([0, 0]),
      zoom: 2,
    }),
    overlays: [overlay],
  });
  linkFeatureEventsToToolTips(map, overlay);
}

function createFeatureLayer() {
  featureSource = new VectorSource();
  return new VectorLayer({ source: featureSource });
}

function createToolTipLayer() {
  const toolTipLayer = new Overlay({
    element: document.createElement("div"),
    offset: [0, -15],
    positioning: "bottom-center",
  });
  toolTipLayer.getElement().className = TOOLTIP_CLASS;
  toolTipLayer.getElement().style = TOOLTIP_STYLE;

  return toolTipLayer;
}

function linkFeatureEventsToToolTips(map, layer) {
  map.on("pointermove", function (evt) {
    const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
    if (feature) {
      layer.getElement().innerHTML = createToolTip(feature);
      layer.setPosition(evt.coordinate);
    } else {
      layer.setPosition(undefined);
    }
  });
}

function createToolTip(feature) {
  const freq = feature.get("average_allele_frequency");
  const country = feature.get("country");
  const admin = feature.get("admin_level_1");
  const gene = feature.get("gene");
  return `
        <div style="text-align: center">
          <img src="${createPieChartIcon(freq)}" width="40" style="margin: auto;" /><br/>
          <strong>${country}</strong><br/>
          ${admin}<br/><br/>
          <hr/>
          <strong>Average A.F.:</strong> ${freq}<br/>
          <strong>Gene:</strong> ${gene}<br/><br/>
        </div>
      `;
}

function createPieChartIcon(allele_frequency) {
  const size = 40;
  const radius = size / 2;
  const redAngle = allele_frequency * 360;

  const x = radius + radius * Math.sin((redAngle * Math.PI) / 180);
  const y = radius - radius * Math.cos((redAngle * Math.PI) / 180);

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle r="${radius}" cx="${radius}" cy="${radius}" fill="#452701" />
    <path d="M${radius},${radius} L${radius},0
              A${radius},${radius} 0 ${allele_frequency > 0.5 ? 1 : 0},1
              ${x},${y} Z"
          fill="#ff6600"/>
  </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function filterFeatures(gene: string) {
  const filtered = features.value.filter((f) => f.gene === gene);
  featureSource.clear();
  addFeaturesToMap(filtered);
}

function addFeaturesToMap(features) {
  features.forEach((feature) => {
    const freq = parseFloat(feature.average_allele_frequency);
    const marker = new Feature({
      geometry: new Point(fromLonLat([parseFloat(feature.longitude), parseFloat(feature.latitude)])),
      average_allele_frequency: freq,
      country: feature.country,
      admin_level_1: feature.admin_level_1,
      gene: feature.gene,
    });

    marker.setStyle(
      new Style({
        image: new Icon({
          src: createPieChartIcon(freq),
          scale: 0.6,
        }),
      }),
    );

    featureSource.addFeature(marker);
  });
}

async function updateFeatureDataset(api) {
  if (!props.datasetId) return;

  try {
    const response = await axios.get(api);
    features.value = JSON.parse(response.data.item_data);
    addFeaturesToMap(features.value);
  } catch (error) {
    console.error('Failed to fetch dataset:', error);
  }
}

function setMapSize(map, window) {
  map.updateSize();
  window.addEventListener("resize", () => map.updateSize());
}

onMounted(async () => {
  createMap(createFeatureLayer(), createToolTipLayer());
  updateFeatureDataset(`/api/datasets/${props.datasetId}/get_content_as_text`);
  setMapSize(map, window);
});
</script>

<style scoped>
.ol-popup {
  position: absolute;
  background-color: white;
  padding: 5px;
  border: 1px solid #ccc;
  bottom: 12px;
  left: -50px;
  min-width: 100px;
  z-index: 1000;
}
</style>
