<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { MapViewer } from "./MapViewer.js";
import { NSelect } from "naive-ui";
import BaseLayers from "./baseLayers.json";
import axios from "axios";

import "ol/ol.css";

const DEFAULT_LAYER = "OpenStreetMap";
const TEST_DATASET = "http://cdn.jsdelivr.net/gh/galaxyproject/galaxy-test-data/1.freq.json";

interface Props {
    datasetId: string;
    root?: string;
    settings?: {
        map_baselayer: string;
    };
}

const props = defineProps<Props>();

const mapContainer = ref<HTMLElement | null>(null);

const selectedGene = ref();
const selectedLayer = ref<string>(props.settings?.map_baselayer || DEFAULT_LAYER);

const geneOptions = ref([]);
const layerOptions = ref(Object.keys(BaseLayers).map((x) => ({ label: x, value: x })));

let mapViewer: any;

async function initializeMap(): Promise<void> {
    const dataUrl = props.datasetId ? `${props.root}api/datasets/${props.datasetId}/display` : TEST_DATASET;
    if (mapContainer.value) {
        try {
            const { data: featureData } = await axios.get(dataUrl);
            try {
                mapViewer = new MapViewer({});
                await mapViewer.initAlleleMap(mapContainer.value, featureData);
                mapViewer.switchBaseLayer(selectedLayer.value);
                geneOptions.value = [...new Set(featureData.map((f) => f.gene))]
                    .sort()
                    .map((g) => ({ label: g, value: g }));
            } catch (error) {
                console.error("Failed to initialize map:", error);
            }
        } catch (error) {
            console.error("Failed to load allele data:", error);
        }
    } else {
        console.error("Map container is not available");
    }
}

onMounted(() => {
    initializeMap();
});

watch(
    () => props,
    () => {
        initializeMap();
    },
    { deep: true },
);

watch(selectedLayer, (newValue) => {
    if (mapViewer) {
        mapViewer.switchBaseLayer(newValue);
    }
});

watch(selectedGene, (newValue) => {
    if (mapViewer) {
        mapViewer.filterByGene(newValue);
    }
});
</script>

<template>
    <div class="flex flex-row h-screen w-screen">
        <div ref="mapContainer" class="flex-grow w-full h-full relative overflow-visible" />
        <div class="absolute top-4 right-4 bg-white p-4 rounded shadow">
            <div v-if="geneOptions.length > 0" class="mb-3">
                <div class="font-medium mb-1">Gene</div>
                <div class="text-xs mb-1">Filter data by gene.</div>
                <n-select v-model:value="selectedGene" :filterable="true" :options="geneOptions" />
            </div>
            <div>
                <div class="font-medium mb-1">Tile Layer</div>
                <div class="text-xs mb-1">Select a tile layer.</div>
                <n-select v-model:value="selectedLayer" :filterable="true" :options="layerOptions" />
            </div>
        </div>
    </div>
</template>

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
