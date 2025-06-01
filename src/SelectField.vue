<template>
    <span class="ml-4">
        <input type="text" v-model="searchTerm" placeholder="Search gene..." @input="filterGenes" />
        <ul v-if="filteredGenes.length && searchTerm">
            <li v-for="gene in filteredGenes" :key="gene" @click="selectGene(gene)" style="cursor: pointer">
                {{ gene }}
            </li>
        </ul>

        <p v-if="selectedGene">Selected: {{ selectedGene }}</p>
    </span>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
    features: any;
}>();

const searchTerm = ref("");
const selectedGene = ref("");
const allGenes = [...new Set(props.features.map((f) => f.gene))].sort();
const filteredGenes = ref(allGenes);

function filterGenes() {
    const term = searchTerm.value.toLowerCase();
    filteredGenes.value = allGenes.filter((g) => g.toLowerCase().includes(term));
}

function selectGene(gene) {
    selectedGene.value = gene;
    searchTerm.value = gene;
    filteredGenes.value = [];
}
</script>

<style>
ul {
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
