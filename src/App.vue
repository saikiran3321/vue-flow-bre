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
    <div class="flow-canvas-container">
      <VueFlow
        v-model="elements"
        :default-viewport="{ x: 0, y: 0, zoom: 1 }"
        :fit-view-on-init="true"
        :snap-to-grid="true"
        :snap-grid="[15, 15]"
        @nodeClick="onNodeClick"
        @connect="onConnect"
        @edgeClick="onEdgeClick"
        @nodeDragStart="onNodeDragStart"
        @nodeDragStop="onNodeDragStop"
      >
        <Background :gap="20" />
        <MiniMap />
        <Controls />
        
        <!-- Custom Node Templates -->
        <template #node-start="nodeProps">
          <div class="custom-node start-node">
            <strong>{{ nodeProps.label }}</strong>
            <Handle type="source" :position="Position.Right" />
          </div>
        </template>

        <template #node-input="nodeProps">
          <div class="custom-node input-node">
            <strong>{{ nodeProps.label }}</strong>
            <div class="input-fields">
              <div v-for="(field, index) in nodeProps.data.fields" :key="index" class="input-field">
                {{ field.label }} ({{ field.type }})
              </div>
            </div>
            <Handle type="target" :position="Position.Left" />
            <Handle type="source" :position="Position.Right" />
          </div>
        </template>

        <template #node-output="nodeProps">
          <div class="custom-node output-node">
            <strong>{{ nodeProps.label }}</strong>
            <Handle type="target" :position="Position.Left" />
          </div>
        </template>

        <template #node-condition="nodeProps">
          <div class="custom-node condition-node">
            <strong>{{ nodeProps.label }}</strong>
            <div>Condition: {{ nodeProps.data.condition || 'Not set' }}</div>
            <Handle type="target" :position="Position.Left" />
            <Handle type="source" :position="Position.Right" id="true" />
            <Handle type="source" :position="Position.Right" id="false" style="top: 70%" />
          </div>
        </template>

        <template #node-log="nodeProps">
          <div class="custom-node log-node">
            <strong>{{ nodeProps.label }}</strong>
            <div>{{ nodeProps.data.message || 'Logging...' }}</div>
            <Handle type="target" :position="Position.Left" />
            <Handle type="source" :position="Position.Right" />
          </div>
        </template>

        <template #node-calculation="nodeProps">
          <div class="custom-node calculation-node">
            <strong>{{ nodeProps.label }}</strong>
            <div>{{ nodeProps.data.formula || 'No formula set' }}</div>
            <Handle type="target" :position="Position.Left" />
            <Handle type="source" :position="Position.Right" />
          </div>
        </template>

        <template #node-container="nodeProps">
          <div class="custom-node container-node">
            <strong>{{ nodeProps.label }}</strong>
            <div class="container-content">
              <div v-if="nodeProps.data.nodes && nodeProps.data.nodes.length > 0">
                <div v-for="node in nodeProps.data.nodes" :key="node.id" class="nested-node">
                  {{ node.label }}
                </div>
              </div>
              <div v-else class="empty-container">
                Drop nodes here
              </div>
            </div>
            <Handle type="target" :position="Position.Left" />
            <Handle type="source" :position="Position.Right" />
          </div>
        </template>
      </VueFlow>
    </div>
    
    <!-- Add controls bar for flow execution -->
    <div class="controls-bar">
      <button @click="runFlow" :disabled="isRunning" class="action-button">
        <span class="icon">▶️</span>
        <span>{{ isRunning ? 'Running...' : 'Run Flow' }}</span>
      </button>
      <div v-if="isRunning" class="execution-status">
        Executing flow...
      </div>
      <div class="execution-log">
        <h4>Execution Log</h4>
        <div class="log-entries">
          <div v-for="(log, index) in executionLog" :key="index" 
               :class="['log-entry', `log-${log.type || 'info'}`]">
            {{ log.message }}
            <div v-if="log.data" class="log-data">
              {{ JSON.stringify(log.data, null, 2) }}
            </div>
          </div>
        </div>
      </div>
    </div>
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
const { addEdges, getNode, getEdges } = useVueFlow();

const elements = computed(() => flowStore.elements);
const isRunning = ref(false);
const executionLog = ref([]);

const onNodeClick = (event) => {
  flowStore.setSelectedNode(event.node);
};

const onEdgeClick = (event) => {
  // Handle edge click
};

const onConnect = (params) => {
  addEdges([params]);
};

const onNodeDragStart = (event) => {
  // Handle node drag start
};

const onNodeDragStop = (event) => {
  // Handle node drag stop
};

const addNewNode = (type, label, position) => {
  flowStore.addNode(type, label, position);
};

const runFlow = async () => {
  isRunning.value = true;
  executionLog.value = [];
  
  try {
    // Find start node
    const startNode = elements.value.find(el => el.type === 'start');
    if (!startNode) {
      throw new Error('No start node found');
    }

    addLog('info', 'Starting flow execution');
    
    // Execute flow starting from start node
    await executeNode(startNode);
    
    addLog('success', 'Flow execution completed successfully');
  } catch (error) {
    addLog('error', `Flow execution failed: ${error.message}`);
  } finally {
    isRunning.value = false;
  }
};

const executeNode = async (node, inputData = {}) => {
  if (!node) return null;

  addLog('info', `Executing node: ${node.label || node.type}`);

  try {
    // Execute the current node
    const result = await flowStore.executeNode(node, inputData);
    
    if (!result.success) {
      addLog('error', `Node execution failed: ${result.message}`);
      return null;
    }

    // Log node output if available
    if (result.result) {
      addLog('info', 'Node output:', result.result);
    }

    // Find outgoing edges
    const edges = getEdges().filter(edge => edge.source === node.id);
    
    // For each outgoing edge, execute the target node
    for (const edge of edges) {
      const targetNode = getNode(edge.target);
      if (targetNode) {
        await executeNode(targetNode, result.result || inputData);
      }
    }

    return result;
  } catch (error) {
    addLog('error', `Error executing node: ${error.message}`);
    return null;
  }
};

const addLog = (type, message, data = null) => {
  executionLog.value.push({
    type,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

onMounted(() => {
  // Add default nodes with proper positioning
  const startNodeId = flowStore.addNode('start', 'Start', { x: 100, y: 200 });
  const inputNodeId = flowStore.addNode('input', 'Input Form', { x: 300, y: 200 });
  const outputNodeId = flowStore.addNode('output', 'Output', { x: 500, y: 200 });

  // Connect nodes with edges
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
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
}

.sidebar {
  width: 250px;
  padding: 15px;
  border-right: 1px solid #ccc;
  background: #f5f5f5;
}

.flow-canvas-container {
  flex-grow: 1;
  height: 100%;
  background: #fff;
}

.custom-node {
  padding: 10px;
  border-radius: 5px;
  font-size: 12px;
  color: #222;
  text-align: center;
  border-width: 1px;
  border-style: solid;
  width: 150px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.start-node {
  background-color: #c8e6c9;
  border-color: #4caf50;
}

.input-node {
  background-color: #bbdefb;
  border-color: #2196f3;
}

.output-node {
  background-color: #ffccbc;
  border-color: #ff5722;
}

.condition-node {
  background-color: #e1bee7;
  border-color: #9c27b0;
}

.log-node {
  background-color: #fff9c4;
  border-color: #ffd600;
}

.calculation-node {
  background-color: #b2dfdb;
  border-color: #009688;
}

.container-node {
  background-color: #cfd8dc;
  border-color: #607d8b;
  min-width: 200px;
  min-height: 100px;
}

.dark-theme .custom-node {
  color: #fff;
}

.dark-theme .start-node {
  background-color: #1b5e20;
  border-color: #81c784;
}

.dark-theme .input-node {
  background-color: #0d47a1;
  border-color: #64b5f6;
}

.dark-theme .output-node {
  background-color: #bf360c;
  border-color: #ffab91;
}

.dark-theme .condition-node {
  background-color: #4a148c;
  border-color: #ce93d8;
}

.dark-theme .log-node {
  background-color: #f57f17;
  border-color: #fff176;
}

.dark-theme .calculation-node {
  background-color: #004d40;
  border-color: #80cbc4;
}

.dark-theme .container-node {
  background-color: #263238;
  border-color: #b0bec5;
}

.action-button {
  width: 100%;
  margin: 5px 0;
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-button:hover {
  background: #f0f0f0;
}

.dark-theme .action-button {
  background: #333;
  color: white;
  border-color: #555;
}

.dark-theme .action-button:hover {
  background: #444;
}

.icon {
  font-size: 1.2em;
}

.input-fields {
  margin-top: 8px;
  font-size: 0.9em;
}

.input-field {
  padding: 2px 4px;
  margin: 2px 0;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.dark-theme .input-field {
  background: rgba(255, 255, 255, 0.1);
}

.container-content {
  margin-top: 8px;
  padding: 8px;
  min-height: 60px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.dark-theme .container-content {
  background: rgba(255, 255, 255, 0.1);
}

.empty-container {
  color: #666;
  font-style: italic;
}

.dark-theme .empty-container {
  color: #999;
}

.nested-node {
  padding: 4px;
  margin: 4px 0;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 3px;
}

.dark-theme .nested-node {
  background: rgba(0, 0, 0, 0.2);
}

.controls-bar {
  width: 300px;
  padding: 15px;
  border-left: 1px solid #ccc;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.execution-status {
  padding: 8px;
  background: #e3f2fd;
  border-radius: 4px;
  color: #1565c0;
  text-align: center;
}

.execution-log {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-entries {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  height: 300px;
  overflow-y: auto;
}

.log-entry {
  padding: 8px;
  margin: 4px 0;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.log-info {
  background: #e3f2fd;
  color: #1565c0;
}

.log-success {
  background: #e8f5e9;
  color: #2e7d32;
}

.log-error {
  background: #ffebee;
  color: #c62828;
}

.log-data {
  margin-top: 4px;
  padding: 4px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 2px;
  white-space: pre-wrap;
}

.dark-theme .controls-bar {
  background: #333;
  border-color: #444;
}

.dark-theme .execution-status {
  background: #1a237e;
  color: #90caf9;
}

.dark-theme .log-entries {
  background: #424242;
  border-color: #555;
}

.dark-theme .log-info {
  background: #0d47a1;
  color: #90caf9;
}

.dark-theme .log-success {
  background: #1b5e20;
  color: #a5d6a7;
}

.dark-theme .log-error {
  background: #b71c1c;
  color: #ffcdd2;
}

.dark-theme .log-data {
  background: rgba(255, 255, 255, 0.1);
}
</style>