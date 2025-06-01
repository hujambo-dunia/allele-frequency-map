<template>
    <span class="ml-4 selectField">
        <input type="text" v-model="searchTerm" placeholder="Search gene..." @input="filterGenes" />
        <ul v-if="filteredGenes.length && searchTerm">
            <li v-for="gene in filteredGenes" :key="gene" @click="selectGene(gene)" style="cursor: pointer">
                {{ gene }}
            </li>
        </ul>

        <span v-if="selectedGene" class="ml-3">Selected: {{ selectedGene }}</span>
    </span>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
    features: any;
}>();

const emit = defineEmits<{
  (e: 'select', gene: string): void;
}>();

const searchTerm = ref("");
const selectedGene = ref("");
const genes = [...new Set(props.features.map((f) => f.gene))].sort();
const filteredGenes = ref(genes);

function filterGenes() {
    const term = searchTerm.value.toLowerCase();
    filteredGenes.value = genes.filter((g) => g.toLowerCase().includes(term));
}

function selectGene(gene) {
    selectedGene.value = gene;
    searchTerm.value = gene;
    filteredGenes.value = [];
    emit('select', gene);
}
</script>

<style scoped>
.selectField {
    position: relative;
    display: inline-block;
}
ul {
    position: absolute;
    z-index: 4;
    list-style: none;
    padding: 0;
    margin: 4px 0;
    border: 1px solid #ccc;
    max-height: 120px;
    overflow-y: auto;
    background: white;
}
li {
    padding: 4px 8px;
}
li:hover {
    background: #eef;
}
</style>
