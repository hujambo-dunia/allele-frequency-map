<template>
  <div class="flex flex-row h-screen w-screen">
    <div ref="mapContainer" class="flex-grow w-full h-full relative overflow-visible" />
    <div class="w-[300px] bg-gray-100 p-4 text-sm">
      <div class="mb-4">
        <label class="block font-medium mb-1">Gene:</label>
        <SelectField v-if="features" :features="features" @select="handleGeneSelect" />
      </div>
      <div>
        <label class="block font-medium mb-1">Base Layer:</label>
        <select v-model="selectedBase" @change="switchBaseLayer" class="w-full p-1 border rounded">
          <option v-for="(layer, name) in baseLayer" :key="name" :value="name">
            {{ name }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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

defineProps<{
    datasetId?: string;
}>();

const mapContainer = ref(null);
const selectedBase = ref("OpenStreetMap");
const features = ref();

let map, vectorLayer, vectorSource, overlay;

function switchBaseLayer() {
    Object.entries(baseLayer).forEach(([name, layer]) => {
        layer.setVisible(name === selectedBase.value);
    });
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

function setMapSize(map, window) {
    map.updateSize();
    window.addEventListener("resize", () => map.updateSize());
}

function handleGeneSelect(gene: string) {
  overlay.setPosition(undefined); /* Clear the overlay tool tips */
  vectorSource.clear();

  const filtered = features.value.filter((f) => f.gene === gene);

  filtered.forEach((featureData) => {
    const freq = parseFloat(featureData.average_allele_frequency);
    const marker = new Feature({
      geometry: new Point(
        fromLonLat([
          parseFloat(featureData.longitude),
          parseFloat(featureData.latitude),
        ])
      ),
      average_allele_frequency: freq,
      country: featureData.country,
      admin_level_1: featureData.admin_level_1,
      gene: featureData.gene,
    });

    marker.setStyle(
      new Style({
        image: new Icon({
          src: createPieChartIcon(freq),
          scale: 0.6,
        }),
      })
    );

    vectorSource.addFeature(marker);
  });
}

onMounted(async () => {
    const baseLayerArray = Object.values(baseLayer);
    vectorSource = new VectorSource();
    vectorLayer = new VectorLayer({ source: vectorSource });

    overlay = new Overlay({
        element: document.createElement("div"),
        offset: [0, -15],
        positioning: "bottom-center",
    });
    overlay.getElement().className = "ol-popup";
    overlay.getElement().style = "background: white; padding: 6px; border: 1px solid #ccc; border-radius: 4px;";

    map = new Map({
        target: mapContainer.value,
        layers: [...baseLayerArray, vectorLayer],
        view: new View({
            center: fromLonLat([0, 0]),
            zoom: 2,
        }),
        overlays: [overlay],
    });

    const { data: featureData } = await axios.get("1.json");
    features.value = featureData;
    featureData.forEach((featureData) => {
        const freq = parseFloat(featureData.average_allele_frequency);
        const marker = new Feature({
            geometry: new Point(fromLonLat([parseFloat(featureData.longitude), parseFloat(featureData.latitude)])),
            average_allele_frequency: freq,
            country: featureData.country,
            admin_level_1: featureData.admin_level_1,
            gene: featureData.gene,
        });

        marker.setStyle(
            new Style({
                image: new Icon({
                    src: createPieChartIcon(freq),
                    scale: 0.6,
                }),
            }),
        );

        vectorSource.addFeature(marker);

        setMapSize(map, window);
    });

    map.on("pointermove", function (evt) {
        const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
        if (feature) {
            const freq = feature.get("average_allele_frequency");
            const country = feature.get("country");
            const admin = feature.get("admin_level_1");
            const gene = feature.get("gene");
            overlay.getElement().innerHTML = `
        <div style="text-align: center">
          <img src="${createPieChartIcon(freq)}" width="40" style="margin: auto;" /><br/>
          <strong>${country}</strong><br/>
          ${admin}<br/><br/>
          <hr/>
          <strong>Average A.F.:</strong> ${freq}<br/>
          <strong>Gene:</strong> ${gene}<br/><br/>
        </div>
      `;
            overlay.setPosition(evt.coordinate);
        } else {
            overlay.setPosition(undefined);
        }
    });
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
