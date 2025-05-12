<template>
  <div class="app-container" :class="{ 'dark-theme': themeStore.isDarkTheme }">
    <div class="sidebar">
      <div class="theme-toggle">
        <button @click="themeStore.toggleTheme" class="theme-button">
          {{ themeStore.isDarkTheme ? '🌞 Light' : '🌙 Dark' }}
        </button>
      </div>
      <div class="node-buttons">
        <h4>Add Nodes</h4>
        <button @click="addNewNode('start', 'Start', { x: 100, y: 50 })" class="action-button">
          <span class="icon">🚀</span>
          <span>Start</span>
        </button>
        <button @click="addNewNode('input', 'Input Form', { x: 100, y: 150 })" class="action-button">
          <span class="icon">📝</span>
          <span>Input Form</span>
        </button>
        <button @click="addNewNode('condition', 'Condition', { x: 100, y: 250 })" class="action-button">
          <span class="icon">⚖️</span>
          <span>Condition</span>
        </button>
        <button @click="addNewNode('log', 'Log Output', { x: 100, y: 350 })" class="action-button">
          <span class="icon">📋</span>
          <span>Log Output</span>
        </button>
        <button @click="addNewNode('calculation', 'Calculation', { x: 100, y: 450 })" class="action-button">
          <span class="icon">🔢</span>
          <span>Calculation</span>
        </button>
        <button @click="addNewNode('container', 'Container', { x: 100, y: 550 })" class="action-button">
          <span class="icon">📦</span>
          <span>Container</span>
        </button>
        <button @click="addNewNode('output', 'Output', { x: 100, y: 650 })" class="action-button">
          <span class="icon">📤</span>
          <span>Output</span>
        </button>
      </div>
      <hr>
      <PropertiesPanel v-if="flowStore.selectedNode" />
    </div>
    <!-- Rest of the template remains unchanged -->
    <!-- ... -->
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { VueFlow, useVueFlow, Handle, Position } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { MiniMap } from '@vue-flow/minimap';
import { Controls } from '@vue-flow/controls';
import { useFlowStore } from './stores/flowStore';
import { useThemeStore } from './stores/themeStore';
import PropertiesPanel from './components/PropertiesPanel.vue';

const flowStore = useFlowStore();
const themeStore = useThemeStore();
const { addEdges, getNode, getNodes, getEdges } = useVueFlow();

// Define the addNewNode function
const addNewNode = (type, label, position) => {
  flowStore.addNode(type, label, position);
};

onMounted(() => {
  // Add default nodes
  const startNodeId = flowStore.addNode('start', 'Start', { x: 100, y: 100 });
  const inputNodeId = flowStore.addNode('input', 'Input Form', { x: 300, y: 100 });
  const outputNodeId = flowStore.addNode('output', 'Output', { x: 500, y: 100 });

  // Add default edges
  addEdges([
    {
      id: `edge-${startNodeId}-${inputNodeId}`,
      source: startNodeId,
      target: inputNodeId,
      type: 'smoothstep'
    },
    {
      id: `edge-${inputNodeId}-${outputNodeId}`,
      source: inputNodeId,
      target: outputNodeId,
      type: 'smoothstep'
    }
  ]);
});
</script>

<style>
/* Add styles for new node types */
.start-node {
  background-color: #c8e6c9;
  border-color: #4caf50;
}

.dark-theme .start-node {
  background-color: #1b5e20;
  border-color: #81c784;
}

.output-node {
  background-color: #ffccbc;
  border-color: #ff5722;
}

.dark-theme .output-node {
  background-color: #bf360c;
  border-color: #ffab91;
}

/* Rest of the styles remain unchanged */
/* ... */
</style>