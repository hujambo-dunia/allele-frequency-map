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

const selectedId = ref();
const selectedLayer = ref<string>(props.settings?.map_baselayer || DEFAULT_LAYER);

const idOptions = ref([]);
const layerOptions = ref(Object.keys(BaseLayers).map((x) => ({ label: x, value: x })));
const isLoadingTiles = ref(false);

let mapViewer: any;

async function initializeMap(): Promise<void> {
    const dataUrl = props.datasetId ? `${props.root}api/datasets/${props.datasetId}/display` : TEST_DATASET;
    if (mapContainer.value) {
        try {
            const { data: featureData } = await axios.get(dataUrl);
            try {
                mapViewer = new MapViewer({});
                
                // Ensure container has proper dimensions before initializing map
                const container = mapContainer.value;
                if (container.clientWidth === 0 || container.clientHeight === 0) {
                    // Force container to take full size
                    container.style.width = '100%';
                    container.style.height = '100%';
                    // Wait for style to apply
                    await new Promise(resolve => requestAnimationFrame(resolve));
                }
                
                await mapViewer.initMap(container, featureData);

                idOptions.value = [...new Set(featureData.map((f) => f.id))]
                    .sort()
                    .map((g) => ({ label: g, value: g }));
                    
            } catch (error) {
                console.error("Failed to initialize map:", error);
            }
        } catch (error) {
            console.error("Failed to load  data:", error);
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
        handleBaselayerChange(newValue);
    }
});

watch(selectedId, (newValue) => {
    if (mapViewer) {
        mapViewer.filterById(newValue);
    }
});

async function handleBaselayerChange(newLayer: string): Promise<void> {
    if (mapViewer && newLayer) {
        isLoadingTiles.value = true;
        
        try {
            await mapViewer.handleBaselayerPreventMapTiling(newLayer);
        } catch (error) {
            console.error("Failed to switch base layer:", error);
        } finally {
            isLoadingTiles.value = false;
        }
    }
}
</script>

<template>
    <div class="flex flex-row h-screen w-screen">
        <div 
            v-if="isLoadingTiles" 
            class="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50"
        >
            <div class="bg-white p-4 rounded shadow-lg text-center">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <div class="text-sm text-gray-600">Switching map layer...</div>
            </div>
        </div>
        
        <div 
            ref="mapContainer" 
            class="flex-grow w-full h-full relative overflow-visible"
            style="min-height: 100vh; min-width: 100%;"
        />
        
        <div class="absolute top-4 right-4 bg-white p-4 rounded shadow">
            <div v-if="idOptions.length > 0" class="mb-3">
                <div class="font-medium mb-1">Gene</div>
                <div class="text-xs mb-1">Filter data by gene.</div>
                <n-select v-model:value="selectedId" :filterable="true" :options="idOptions" />
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
/* Ensure map container takes full space */
.flex-grow {
    flex: 1 1 auto;
}

/* Ensure OpenLayers map fills container */
:deep(.ol-viewport) {
    width: 100% !important;
    height: 100% !important;
}

/* Ensure tiles load smoothly */
:deep(.ol-layer) {
    transition: opacity 0.3s ease-in-out;
}

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
