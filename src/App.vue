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
      </div>
      <hr>
      <PropertiesPanel v-if="flowStore.selectedNode" />
    </div>
    <div class="flow-canvas-container">
      <VueFlow
        v-model="flowStore.elements"
        :fit-view-on-init="true"
        :snap-to-grid="true"
        :snap-grid="[15, 15]"
        @node-click="onNodeClick"
        @connect="onConnect"
        @edge-click="onEdgeClick"
        @node-drag-start="onNodeDragStart"
        @node-drag-stop="onNodeDragStop"
        class="vue-flow"
      >
        <Background :gap="20" />
        <MiniMap />
        <Controls class="vue-flow__controls" />

        <!-- Custom Node Templates -->
        <template #node-request="{ id, data, label }">
          <div class="custom-node request-node">
            <strong>{{ label }}</strong>
            <div>URL: {{ data.url || 'Not set' }}</div>
            <div v-if="data.response" class="node-response">
              Status: {{ data.response.status }}
            </div>
            <Handle type="target" :position="Position.Left" />
            <Handle type="source" :position="Position.Right" />
          </div>
        </template>

        <template #node-log="{ id, data, label }">
          <div class="custom-node log-node">
            <strong>{{ label }}</strong>
            <div>{{ data.message || 'Logging...' }}</div>
            <div v-if="data.input" class="node-input">
              Input: {{ data.input }}
            </div>
            <Handle type="target" :position="Position.Left" />
          </div>
        </template>

        <template #node-condition="{ id, data, label }">
          <div class="custom-node condition-node">
            <strong>{{ label }}</strong>
            <div>Condition: {{ data.condition || 'Not set' }}</div>
            <Handle type="target" :position="Position.Left" />
            <Handle type="source" :position="Position.Right" id="true" />
            <Handle type="source" :position="Position.Right" id="false" style="top: 70%" />
          </div>
        </template>

        <template #node-math="{ id, data, label }">
          <div class="custom-node math-node">
            <strong>{{ label }}</strong>
            <div>Operation: {{ data.operation || 'Not set' }}</div>
            <Handle type="target" :position="Position.Left" />
            <Handle type="source" :position="Position.Right" />
          </div>
        </template>

        <template #node-function="{ id, data, label }">
          <div class="custom-node function-node">
            <strong>{{ label }}</strong>
            <div>Function: {{ data.function || 'Not set' }}</div>
            <Handle type="target" :position="Position.Left" />
            <Handle type="source" :position="Position.Right" />
          </div>
        </template>

        <template #node-input="{ id, data, label }">
          <div class="custom-node input-node">
            <strong>{{ label }}</strong>
            <div class="input-fields">
              <div v-for="(field, index) in data.fields" :key="index" class="input-field">
                {{ field.label }} ({{ field.type }})
              </div>
            </div>
            <Handle type="source" :position="Position.Right" />
          </div>
        </template>

        <template #node-calculation="{ id, data, label }">
          <div class="custom-node calculation-node">
            <strong>{{ label }}</strong>
            <div>{{ data.formula || 'No formula set' }}</div>
            <Handle type="target" :position="Position.Left" />
            <Handle type="source" :position="Position.Right" />
          </div>
        </template>

        <template #node-container="{ id, data, label }">
          <div class="custom-node container-node">
            <strong>{{ label }}</strong>
            <div class="container-content">
              <div v-if="data.nodes && data.nodes.length > 0">
                <div v-for="node in data.nodes" :key="node.id" class="nested-node">
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
    <div class="controls-bar">
      <button @click="showInputForm = true" :disabled="isRunning || !hasInputNode" class="action-button">
        <span class="icon">▶️</span>
        <span>{{ isRunning ? 'Running...' : 'Run Flow' }}</span>
      </button>
      <div v-if="isRunning" class="execution-status">Executing...</div>
      <pre class="output-log">{{ executionLog.join('\n') }}</pre>
    </div>

    <!-- Input Form Dialog -->
    <div v-if="showInputForm" class="dialog-overlay">
      <div class="dialog-content">
        <h3>Input Values</h3>
        <form @submit.prevent="runFlowWithInputs">
          <div v-for="field in inputFields" :key="field.label" class="form-field">
            <label :for="field.label">{{ field.label }}:</label>
            
            <!-- Text Input -->
            <input
              v-if="field.type === 'text'"
              :id="field.label"
              type="text"
              v-model="inputValues[field.label]"
              :required="true"
            />

            <!-- Number Input -->
            <input
              v-else-if="field.type === 'number'"
              :id="field.label"
              type="number"
              v-model="inputValues[field.label]"
              :required="true"
            />

            <!-- Date Input -->
            <input
              v-else-if="field.type === 'date'"
              :id="field.label"
              type="date"
              v-model="inputValues[field.label]"
              :required="true"
            />

            <!-- Email Input -->
            <input
              v-else-if="field.type === 'email'"
              :id="field.label"
              type="email"
              v-model="inputValues[field.label]"
              :required="true"
            />

            <!-- Password Input -->
            <input
              v-else-if="field.type === 'password'"
              :id="field.label"
              type="password"
              v-model="inputValues[field.label]"
              :required="true"
            />

            <!-- Dropdown Input -->
            <select
              v-else-if="field.type === 'dropdown'"
              :id="field.label"
              v-model="inputValues[field.label]"
              :required="true"
            >
              <option value="">Select {{ field.label }}</option>
              <option v-for="option in field.options" :key="option" :value="option">
                {{ option }}
              </option>
            </select>

            <!-- Radio Input -->
            <div v-else-if="field.type === 'radio'" class="radio-group">
              <label v-for="option in field.options" :key="option" class="radio-label">
                <input
                  type="radio"
                  :name="field.label"
                  :value="option"
                  v-model="inputValues[field.label]"
                  :required="true"
                />
                {{ option }}
              </label>
            </div>

            <!-- Checkbox Input -->
            <div v-else-if="field.type === 'checkbox'" class="checkbox-group">
              <label v-for="option in field.options" :key="option" class="checkbox-label">
                <input
                  type="checkbox"
                  :value="option"
                  v-model="inputValues[field.label]"
                />
                {{ option }}
              </label>
            </div>
          </div>

          <div class="dialog-buttons">
            <button type="submit" class="action-button">Run Flow</button>
            <button type="button" @click="showInputForm = false" class="action-button secondary">Cancel</button>
          </div>
        </form>
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
const { addEdges, getNode, getNodes, getEdges } = useVueFlow();

const executionLog = ref([]);
const isRunning = ref(false);
const selectedEdge = ref(null);
const showInputForm = ref(false);
const inputValues = ref({});
const draggedNode = ref(null);

const onNodeClick = (event) => {
  flowStore.setSelectedNode(event.node);
};

const onEdgeClick = (event) => {
  selectedEdge.value = event.edge;
};

const onConnect = (params) => {
  addEdges([params]);
};

const addNewNode = (type, label, position) => {
  let initialData = {};
  switch (type) {
    case 'input':
      initialData = {
        fields: [],
        addField: (field) => {
          const node = flowStore.elements.find(el => el.id === id);
          if (node) {
            node.data.fields.push(field);
          }
        }
      };
      break;
    case 'condition':
      initialData = {
        conditions: [],
        addCondition: (condition) => {
          const node = flowStore.elements.find(el => el.id === id);
          if (node) {
            node.data.conditions.push(condition);
          }
        }
      };
      break;
    case 'log':
      initialData = {
        type: 'success', // or 'fail'
        message: ''
      };
      break;
    case 'calculation':
      initialData = {
        formula: '',
        variables: {}
      };
      break;
    case 'container':
      initialData = {
        nodes: [],
        addNode: (node) => {
          const containerNode = flowStore.elements.find(el => el.id === id);
          if (containerNode) {
            containerNode.data.nodes.push(node);
          }
        }
      };
      break;
  }
  flowStore.addNode(type, label, position, initialData);
};

const hasInputNode = computed(() => {
  return flowStore.elements.some(el => el.type === 'input');
});

const inputFields = computed(() => {
  const inputNode = flowStore.elements.find(el => el.type === 'input');
  return inputNode ? inputNode.data.fields : [];
});

const runFlowWithInputs = async () => {
  showInputForm.value = false;
  isRunning.value = true;
  executionLog.value = ['Flow execution started...'];

  try {
    const nodes = flowStore.getNodes;
    const edges = flowStore.getEdges;
    
    const startNode = nodes.find(node => node.type === 'input');
    if (!startNode) {
      throw new Error('No input node found');
    }

    let currentNode = startNode;
    let currentData = { ...inputValues.value };

    while (currentNode) {
      executionLog.value.push(`Executing node: ${currentNode.label || currentNode.type}`);

      const result = await flowStore.executeNode(currentNode, currentData);
      
      if (result && !result.success) {
        executionLog.value.push(`Error: ${result.message}`);
        break;
      }

      if (result && result.result !== undefined) {
        currentData = { ...currentData, ...result.result };
      }

      if (result && result.type === 'log') {
        executionLog.value.push(`${result.type.toUpperCase()}: ${result.message}`);
        if (result.data) {
          executionLog.value.push(`Data: ${JSON.stringify(result.data, null, 2)}`);
        }
      }

      const nextEdge = edges.find(edge => edge.source === currentNode.id);
      currentNode = nextEdge ? nodes.find(node => node.id === nextEdge.target) : null;
    }

    executionLog.value.push('Flow execution completed.');
  } catch (error) {
    executionLog.value.push(`Error: ${error.message}`);
  } finally {
    isRunning.value = false;
  }
};

// Function to create BRE flow from JSON
const createBREFlow = (jsonData) => {
  // Clear existing elements
  flowStore.elements = [];
  
  const stages = jsonData.stages;
  const nodeSpacing = 200;
  const startX = 100;
  let currentY = 100;

  // Create nodes for each stage
  stages.forEach((stage, index) => {
    const nodeType = stage.type.toLowerCase();
    const nodeId = `stage-${index}`;
    
    // Add main stage node
    flowStore.addNode(
      nodeType,
      stage.des,
      { x: startX, y: currentY },
      {
        stageData: stage,
        type: stage.type,
        description: stage.des
      }
    );

    // If this is a formula stage, create nodes for its nested stages
    if (stage.type === 'Formula' && stage.formula_data?.stages) {
      let nestedY = currentY + 100;
      stage.formula_data.stages.forEach((nestedStage, nestedIndex) => {
        const nestedNodeId = `${nodeId}-nested-${nestedIndex}`;
        
        // Add nested stage node
        flowStore.addNode(
          'formula',
          `${stage.des} - ${nestedStage.type}`,
          { x: startX + 300, y: nestedY },
          {
            stageData: {
              ...stage,
              formula_data: {
                ...stage.formula_data,
                stages: [nestedStage]
              }
            },
            type: 'Formula',
            description: `${stage.des} - ${nestedStage.type}`
          }
        );

        // Connect main stage to nested stage
        addEdges([{
          id: `edge-${nodeId}-${nestedNodeId}`,
          source: nodeId,
          target: nestedNodeId,
          type: 'smoothstep'
        }]);

        nestedY += nodeSpacing;
      });
    }

    // Connect nodes
    if (index > 0) {
      const prevNodeId = `stage-${index - 1}`;
      addEdges([{
        id: `edge-${prevNodeId}-${nodeId}`,
        source: prevNodeId,
        target: nodeId,
        type: 'smoothstep'
      }]);
    }

    currentY += nodeSpacing;
  });
};

// Example BRE JSON data
const breJsonData = {
  stages: [
  ]
};

// Add drag and drop handlers
const onNodeDragStart = (event, node) => {
  draggedNode.value = node;
};

const onNodeDragStop = (event, node) => {
  const containerNode = findContainerNodeAtPosition(node.position);
  if (containerNode && containerNode.id !== node.id) {
    // Add node to container
    containerNode.data.addNode(node);
    // Update node position relative to container
    node.position = {
      x: node.position.x - containerNode.position.x,
      y: node.position.y - containerNode.position.y
    };
  }
  draggedNode.value = null;
};

const findContainerNodeAtPosition = (position) => {
  return getNodes().find(node => {
    if (node.type !== 'container') return false;
    const nodeWidth = 250; // min-width of container
    const nodeHeight = 150; // min-height of container
    return (
      position.x >= node.position.x &&
      position.x <= node.position.x + nodeWidth &&
      position.y >= node.position.y &&
      position.y <= node.position.y + nodeHeight
    );
  });
};

onMounted(() => {
  // Create the BRE flow when component is mounted
  createBREFlow(breJsonData);
});
</script>

<style>
/* Base styles */
html, body, #app {
  height: 100%;
  margin: 0;
  font-family: sans-serif;
}

.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  transition: background-color 0.3s, color 0.3s;
}

/* Light theme (default) */
.app-container {
  background-color: #ffffff;
  color: #333333;
}

.app-container button {
  background-color: #f0f0f0;
  color: #333333;
  border: 1px solid #ccc;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.app-container button:hover {
  background-color: #e0e0e0;
}

.sidebar, .controls-bar {
  background-color: #f9f9f9;
  border-color: #e0e0e0;
}

.output-log {
  background-color: #f0f0f0;
  color: #333333;
}

/* Dark theme */
.app-container.dark-theme {
  background-color: #1a1a1a;
  color: #ffffff;
}

.app-container.dark-theme button {
  background-color: #333333;
  color: #ffffff;
  border-color: #555555;
}

.app-container.dark-theme button:hover {
  background-color: #444444;
}

.app-container.dark-theme .sidebar,
.app-container.dark-theme .controls-bar {
  background-color: #2d2d2d;
  border-color: #404040;
}

.app-container.dark-theme .output-log {
  background-color: #333333;
  color: #ffffff;
}

/* Node styles */
.custom-node {
  padding: 10px 15px;
  border-radius: 5px;
  border: 1px solid #333;
  background: white;
  min-width: 120px;
  text-align: center;
  transition: background-color 0.3s, border-color 0.3s;
}

.dark-theme .custom-node {
  background: #2d2d2d;
  border-color: #555;
  color: #ffffff;
}

.start-node { 
  background-color: #c8e6c9; 
  border-color: #4caf50; 
}

.dark-theme .start-node { 
  background-color: #1b5e20; 
  border-color: #81c784; 
}

.request-node { 
  background-color: #bbdefb; 
  border-color: #2196f3; 
}

.dark-theme .request-node { 
  background-color: #1565c0; 
  border-color: #64b5f6; 
}

.log-node { 
  background-color: #fff9c4; 
  border-color: #ffeb3b; 
}

.dark-theme .log-node { 
  background-color: #f57f17; 
  border-color: #fff176; 
}

/* Theme toggle button */
.theme-toggle {
  margin-bottom: 16px;
}

.theme-button {
  width: 100%;
  font-size: 1.1em;
}

/* Vue Flow specific styles */
.vue-flow {
  background-color: transparent;
}

.dark-theme .vue-flow {
  background-color: #1a1a1a;
}

/* Rest of the existing styles */
.sidebar {
  width: 250px;
  padding: 10px;
  border-right: 1px solid #ccc;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.flow-canvas-container {
  flex-grow: 1;
  height: 100%;
}

.controls-bar {
  width: 300px;
  padding: 10px;
  border-left: 1px solid #ccc;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.output-log {
  padding: 8px;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  font-size: 0.9em;
}

/* Vue Flow Controls Styling */
.vue-flow__controls {
  box-shadow: 0 0 2px 1px rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  overflow: hidden;
}

.vue-flow__controls-button {
  background-color: #f8f8f8;
  border: none;
  border-bottom: 1px solid #eee;
  box-sizing: content-box;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 16px;
  height: 16px;
  cursor: pointer;
  user-select: none;
  padding: 5px;
  transition: background-color 0.3s;
}

.vue-flow__controls-button:hover {
  background-color: #f0f0f0;
}

.dark-theme .vue-flow__controls {
  box-shadow: 0 0 2px 1px rgba(255, 255, 255, 0.08);
}

.dark-theme .vue-flow__controls-button {
  background-color: #2d2d2d;
  border-bottom-color: #404040;
  color: #ffffff;
}

.dark-theme .vue-flow__controls-button:hover {
  background-color: #404040;
}

/* Action Buttons Styling */
.action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background-color: #f0f0f0;
  color: #333333;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  text-align: left;
}

.action-button:hover {
  background-color: #e0e0e0;
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dark-theme .action-button {
  background-color: #333333;
  color: #ffffff;
  border-color: #555555;
}

.dark-theme .action-button:hover {
  background-color: #444444;
}

.icon {
  font-size: 1.2em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

/* Execution Status */
.execution-status {
  padding: 8px;
  background-color: #e3f2fd;
  border-radius: 4px;
  color: #1565c0;
  text-align: center;
  margin: 8px 0;
}

.dark-theme .execution-status {
  background-color: #1a237e;
  color: #90caf9;
}

/* Node styles for new types */
.condition-node { 
  background-color: #e1bee7; 
  border-color: #9c27b0; 
}

.dark-theme .condition-node { 
  background-color: #4a148c; 
  border-color: #ce93d8; 
}

.math-node { 
  background-color: #ffccbc; 
  border-color: #ff5722; 
}

.dark-theme .math-node { 
  background-color: #bf360c; 
  border-color: #ffab91; 
}

.function-node { 
  background-color: #c5e1a5; 
  border-color: #689f38; 
}

.dark-theme .function-node { 
  background-color: #33691e; 
  border-color: #aed581; 
}

.node-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-buttons h4 {
  margin: 0 0 8px 0;
  color: inherit;
}

.node-response, .node-input {
  font-size: 0.9em;
  margin-top: 4px;
  padding: 2px 4px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 2px;
}

.dark-theme .node-response,
.dark-theme .node-input {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Add styles for BRE nodes */
.formula-node {
  background-color: #e3f2fd;
  border-color: #2196f3;
}

.decision-node {
  background-color: #f3e5f5;
  border-color: #9c27b0;
}

.equation-node {
  background-color: #e8f5e9;
  border-color: #4caf50;
}

.responsetable-node {
  background-color: #fff3e0;
  border-color: #ff9800;
}

.dark-theme .formula-node {
  background-color: #1565c0;
  border-color: #64b5f6;
}

.dark-theme .decision-node {
  background-color: #6a1b9a;
  border-color: #ce93d8;
}

.dark-theme .equation-node {
  background-color: #2e7d32;
  border-color: #81c784;
}

.dark-theme .responsetable-node {
  background-color: #e65100;
  border-color: #ffb74d;
}

.input-node {
  background-color: #e3f2fd;
  border-color: #2196f3;
  min-width: 200px;
}

.calculation-node {
  background-color: #e8f5e9;
  border-color: #4caf50;
}

.input-fields {
  margin-top: 8px;
  font-size: 0.9em;
}

.input-field {
  padding: 4px;
  margin: 2px 0;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.dark-theme .input-node {
  background-color: #1565c0;
  border-color: #64b5f6;
}

.dark-theme .calculation-node {
  background-color: #2e7d32;
  border-color: #81c784;
}

.dark-theme .input-field {
  background-color: rgba(255, 255, 255, 0.1);
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-content {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 8px;
  min-width: 400px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.dark-theme .dialog-content {
  background-color: #2d2d2d;
  color: #ffffff;
}

.form-field {
  margin-bottom: 15px;
}

.form-field label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-field input[type="text"],
.form-field input[type="number"],
.form-field input[type="date"],
.form-field input[type="email"],
.form-field input[type="password"],
.form-field select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #ffffff;
  color: #333333;
}

.dark-theme .form-field input[type="text"],
.dark-theme .form-field input[type="number"],
.dark-theme .form-field input[type="date"],
.dark-theme .form-field input[type="email"],
.dark-theme .form-field input[type="password"],
.dark-theme .form-field select {
  background-color: #404040;
  color: #ffffff;
  border-color: #555555;
}

.radio-group,
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-label,
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.action-button.secondary {
  background-color: #e0e0e0;
  color: #333333;
}

.dark-theme .action-button.secondary {
  background-color: #404040;
  color: #ffffff;
}

/* Add styles for container nodes */
.container-node {
  background-color: #e8eaf6;
  border-color: #3f51b5;
  min-width: 250px;
  min-height: 150px;
}

.dark-theme .container-node {
  background-color: #1a237e;
  border-color: #7986cb;
}

.container-content {
  margin-top: 10px;
  padding: 10px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  min-height: 100px;
}

.dark-theme .container-content {
  background-color: rgba(255, 255, 255, 0.1);
}

.nested-node {
  padding: 5px;
  margin: 5px 0;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 3px;
  font-size: 0.9em;
}

.dark-theme .nested-node {
  background-color: rgba(0, 0, 0, 0.2);
}

.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: #666;
  font-style: italic;
}

.dark-theme .empty-container {
  color: #999;
}
</style>