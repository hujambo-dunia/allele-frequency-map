<!-- WATCH AND LEARN: 
https://www.youtube.com/watch?v=UAQogFwyna0
-->

<template>
    <div class="flex flex-col h-full">
        <div class="p-2 bg-gray-100 text-sm">
            Base Layer:
            <select v-model="selectedBase" @change="switchBaseLayer">
                <option v-for="(layer, name) in mapLayers" :key="name" :value="name">
                    {{ name }}
                </option>
            </select>
            <SelectField v-if="features" :features="features" @select="selectGene" />
        </div>
        <div ref="mapElement" class="w-full flex-grow h-[600px]" />
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
import { mapLayers } from "./layers.js";
import SelectField from "./SelectField.vue";
import axios from "axios";

defineProps<{
    datasetId?: string;
}>();

const mapElement = ref(null);
const selectedBase = ref("OpenStreetMap");
const features = ref();

let map, vectorLayer, vectorSource, overlay;

function switchBaseLayer() {
    Object.entries(mapLayers).forEach(([name, layer]) => {
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

onMounted(async () => {
    const baseLayerArray = Object.values(mapLayers);
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
        target: mapElement.value,
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
            allele_frequency: freq,
            country: featureData.country,
            admin_level_1: featureData.admin_level_1,
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
    });

    map.on("pointermove", function (evt) {
        const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
        if (feature) {
            const freq = feature.get("average_allele_frequency");
            const country = feature.get("country");
            const admin = feature.get("admin_level_1");
            overlay.getElement().innerHTML = `
        <div style="text-align: center">
          <img src="${createPieChartIcon(freq)}" width="40" /><br/>
          <strong>${country}</strong><br/>
          ${admin}
        </div>
      `;
            overlay.setPosition(evt.coordinate);
        } else {
            overlay.setPosition(undefined);
        }
    });
});
</script>

<style>
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
