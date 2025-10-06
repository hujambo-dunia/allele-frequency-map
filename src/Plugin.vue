<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue";
import "ol/ol.css";
import { baseLayer } from "./baseLayer.js";
import SelectField from "./SelectField.vue";
import { MapViewer } from "./MapViewer.js";
import { NSelect } from "naive-ui";
import TileLayers from "./tileLayers.json";

const BASELAYER_DEFAULT = "OpenStreetMap";

interface Props {
    datasetId: string;
    datasetUrl?: string;
    root?: string;
    settings?: {
        map_baselayer: string;
    };
}

const props = defineProps<Props>();

const mapContainer = ref<HTMLElement | null>(null);
const selectedBase = ref<string>(props.settings?.map_baselayer || BASELAYER_DEFAULT);
const features = ref();

const mapBaselayerOptions = computed(() =>
    Object.entries(TileLayers).map(([x, y]) => ({
        label: x,
        value: x,
    })),
);

let mapViewer: any;

function handleGeneSelect(gene: string): void {
    if (mapViewer) {
        mapViewer.filterByGene(gene);
    }
}

async function _initializeMap(): Promise<void> {
    const dataUrl = "1.json"; /* Use datasetUrl if provided, otherwise fall back to default */

    if (!mapContainer.value) {
        console.warn("Map container is not available");
        return;
    }

    try {
        mapViewer = new MapViewer({});
        await mapViewer.initAlleleMap(mapContainer.value, baseLayer, dataUrl);
        mapViewer.switchBaseLayer(selectedBase.value);
        features.value = mapViewer.features;
    } catch (error) {
        console.error("Failed to initialize map:", error);
    }
}

function _handleBaselayerNoReinitializeMap(newValues, oldValues) {
    // Check if props changed - excluding settings.map_baselayer (mapBaselayer) to avoid double reinitialization)
    const mapBaselayerChanged = newValues.mapBaselayer !== oldValues?.mapBaselayer;
    const selectedBaseChanged = newValues.selectedBase !== oldValues?.selectedBase;

    if (mapBaselayerChanged && newValues.mapBaselayer) {
        selectedBase.value = newValues.mapBaselayer;
        mapViewer.switchBaseLayer(newValues.mapBaselayer);
    } else if (selectedBaseChanged && !mapBaselayerChanged) {
        mapViewer.switchBaseLayer(newValues.selectedBase);
    }
}

onMounted(() => {
    _initializeMap();
});

watch(
    () => ({
        props: props,
        selectedBase: selectedBase.value,
        mapBaselayer: props.settings?.map_baselayer,
    }),
    (newValues, oldValues) => {
        const propsChanged = newValues.props !== oldValues?.props;

        if (propsChanged) {
            _initializeMap();
            return;
        }

        if (mapViewer) {
            _handleBaselayerNoReinitializeMap(newValues, oldValues);
        }
    },
    { deep: true },
);
</script>

<template>
    <div class="flex flex-row h-screen w-screen">
        <div ref="mapContainer" class="flex-grow w-full h-full relative overflow-visible" />
        <div class="absolute top-4 right-4 bg-white p-4 rounded shadow">
            <div v-if="features" class="mb-3">
                <div class="font-medium mb-1">Gene</div>
                <div class="text-xs mb-1">Filter data by gene.</div>
                <SelectField  :features="features" @select="handleGeneSelect" />
            </div>
            <div>
                <div class="font-medium mb-1">Tile Layer</div>
                <div class="text-xs mb-1">Select a tile layer.</div>
                <n-select v-model:value="selectedBase" :filterable="true" :options="mapBaselayerOptions" />
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
