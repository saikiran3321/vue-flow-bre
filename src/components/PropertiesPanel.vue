<template>
  <div class="properties-panel" :class="{ 'dark-theme': themeStore.isDarkTheme }" v-if="node">
    <h3>Node Properties: {{ node.label || node.type }}</h3>
    <p>ID: {{ node.id }}</p>

    <!-- Common Properties -->
    <div>
      <label for="nodeLabel">Label:</label>
      <input id="nodeLabel" type="text" :value="node.label" @input="updateLabel" />
    </div>

    <!-- Formula Node Properties -->
    <div v-if="node.type === 'formula'">
      <h4>Formula Settings</h4>
      <div v-if="node.data.variables">
        <h5>Variables</h5>
        <div v-for="(variable, key) in node.data.variables" :key="key" class="variable-section">
          <div class="variable-header">
            <strong>{{ variable.name }}</strong>
            <span class="variable-type">({{ variable.type }})</span>
          </div>
          <div class="variable-properties">
            <span>Output: {{ variable.output ? 'Yes' : 'No' }}</span>
            <span v-if="variable.use_list">List: Yes</span>
          </div>
        </div>
      </div>
      <div v-if="node.data.stageData?.formula_data?.stages">
        <h5>Stages</h5>
        <div v-for="(stage, index) in node.data.stageData.formula_data.stages" :key="index" class="stage-section">
          <div class="stage-header">
            <strong>{{ stage.type }}</strong>
            <span class="stage-level">Level: {{ stage.level }}</span>
          </div>
          <div v-if="stage.cond" class="condition-section">
            <div v-for="(condition, cIndex) in stage.cond" :key="cIndex" class="condition">
              {{ condition.lhs }} {{ condition.operator }} {{ condition.rhs.value }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Decision Node Properties -->
    <div v-if="node.type === 'decision'">
      <h4>Decision Settings</h4>
      <div v-if="node.data.conditions">
        <div v-for="(condition, index) in node.data.conditions" :key="index" class="decision-section">
          <h5>Condition {{ index + 1 }}</h5>
          <div v-for="(input, iIndex) in condition.inputs" :key="iIndex" class="input-section">
            <div class="input-header">
              <strong>{{ input.thing }}</strong>
              <span class="operator">{{ input.op }}</span>
            </div>
            <div class="input-value">
              {{ input.match.value }}
              <span v-if="input.match2.value"> - {{ input.match2.value }}</span>
            </div>
          </div>
          <div v-if="condition.outputs" class="output-section">
            <h6>Outputs</h6>
            <div v-for="(value, key) in condition.outputs" :key="key">
              {{ key }}: {{ value }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Equation Node Properties -->
    <div v-if="node.type === 'equation'">
      <h4>Equation Settings</h4>
      <div v-if="node.data.equations">
        <div class="equation-section">
          <h5>Inputs</h5>
          <div v-for="(input, key) in node.data.equations.inputs" :key="key" class="input-section">
            <div class="input-header">
              <strong>{{ input.name }}</strong>
              <span class="input-type">({{ input.type }})</span>
            </div>
          </div>
          <h5>Outputs</h5>
          <div v-for="(output, key) in node.data.equations.outputs" :key="key" class="output-section">
            <div class="output-header">
              <strong>{{ output.name }}</strong>
              <span class="output-type">({{ output.type }})</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Response Table Node Properties -->
    <div v-if="node.type === 'responsetable'">
      <h4>Response Table Settings</h4>
      <div v-if="node.data.responseTable">
        <div class="table-section">
          <h5>Fields</h5>
          <div v-for="(field, index) in node.data.responseTable.fields" :key="index" class="field-section">
            <div class="field-header">
              <strong>{{ field.name }}</strong>
              <span class="field-type">({{ field.type }})</span>
            </div>
          </div>
          <h5>Data</h5>
          <div class="table-data">
            <div v-for="(row, index) in node.data.responseTable.data" :key="index" class="table-row">
              <div v-for="(value, key) in row" :key="key" class="table-cell">
                {{ key }}: {{ value }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Request Node Specific Properties -->
    <div v-if="node.type === 'request'">
      <h4>Request Settings</h4>
      <div>
        <label :for="`url-${node.id}`">URL:</label>
        <input :id="`url-${node.id}`" type="text" :value="node.data.url" @input="updateNodeData('url', $event.target.value)" />
      </div>
      <div>
        <label :for="`method-${node.id}`">Method:</label>
        <select :id="`method-${node.id}`" :value="node.data.method" @change="updateNodeData('method', $event.target.value)">
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
      </div>
      <div>
        <label :for="`headers-${node.id}`">Headers:</label>
        <textarea :id="`headers-${node.id}`" :value="node.data.headers" @input="updateNodeData('headers', $event.target.value)" placeholder="Enter headers in JSON format"></textarea>
      </div>
      <div>
        <label :for="`body-${node.id}`">Request Body:</label>
        <textarea :id="`body-${node.id}`" :value="node.data.body" @input="updateNodeData('body', $event.target.value)" placeholder="Enter request body"></textarea>
      </div>
      <div v-if="node.data.response">
        <h4>Last Response</h4>
        <div class="response-info">
          <div>Status: {{ node.data.response.status }}</div>
          <div>Time: {{ node.data.response.time }}ms</div>
        </div>
        <div class="response-body">
          <pre>{{ node.data.response.data }}</pre>
        </div>
      </div>
    </div>

    <!-- Log Node Specific Properties -->
    <div v-if="node.type === 'log'">
      <h4>Log Settings</h4>
      <div>
        <label :for="`log-type-${node.id}`">Type:</label>
        <select :id="`log-type-${node.id}`" v-model="node.data.type">
          <option value="success">Success</option>
          <option value="fail">Fail</option>
        </select>
      </div>
      <div>
        <label :for="`log-message-${node.id}`">Message:</label>
        <textarea :id="`log-message-${node.id}`" v-model="node.data.message" placeholder="Enter log message"></textarea>
      </div>
    </div>

    <!-- Input Node Properties -->
    <div v-if="node.type === 'input'">
      <h4>Input Form Settings</h4>
      <div class="add-field-section">
        <h5>Add New Field</h5>
        <div>
          <label :for="`field-label-${node.id}`">Label:</label>
          <input :id="`field-label-${node.id}`" type="text" v-model="newField.label" />
        </div>
        <div>
          <label :for="`field-type-${node.id}`">Type:</label>
          <select :id="`field-type-${node.id}`" v-model="newField.type">
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="email">Email</option>
            <option value="password">Password</option>
            <option value="dropdown">Dropdown</option>
            <option value="radio">Radio</option>
            <option value="checkbox">Checkbox</option>
          </select>
        </div>
        <div v-if="newField.type === 'dropdown' || newField.type === 'radio'">
          <label :for="`field-options-${node.id}`">Options (comma-separated):</label>
          <input :id="`field-options-${node.id}`" type="text" v-model="newField.options" placeholder="option1, option2, option3" />
        </div>
        <button @click="addField" class="action-button">Add Field</button>
      </div>
      <div v-if="node.data.fields.length > 0">
        <h5>Current Fields</h5>
        <div v-for="(field, index) in node.data.fields" :key="index" class="field-section">
          <div class="field-header">
            <strong>{{ field.label }}</strong>
            <span class="field-type">({{ field.type }})</span>
          </div>
          <div v-if="field.options" class="field-options">
            Options: {{ field.options.join(', ') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Condition Node Properties -->
    <div v-if="node.type === 'condition'">
      <h4>Condition Settings</h4>
      <div class="add-condition-section">
        <h5>Add New Condition</h5>
        <div>
          <label :for="`condition-field-${node.id}`">Field:</label>
          <select :id="`condition-field-${node.id}`" v-model="newCondition.field">
            <option v-for="field in getInputFields()" :key="field.label" :value="field.label">
              {{ field.label }}
            </option>
          </select>
        </div>
        <div>
          <label :for="`condition-operator-${node.id}`">Operator:</label>
          <select :id="`condition-operator-${node.id}`" v-model="newCondition.operator">
            <option value="==">Equals</option>
            <option value="!=">Not Equals</option>
            <option value=">">Greater Than</option>
            <option value="<">Less Than</option>
            <option value=">=">Greater Than or Equal</option>
            <option value="<=">Less Than or Equal</option>
            <option value="in">In List</option>
            <option value="not in">Not In List</option>
          </select>
        </div>
        <div>
          <label :for="`condition-value-${node.id}`">Value:</label>
          <input :id="`condition-value-${node.id}`" type="text" v-model="newCondition.value" />
        </div>
        <div>
          <label :for="`condition-action-${node.id}`">Action:</label>
          <select :id="`condition-action-${node.id}`" v-model="newCondition.action">
            <option value="fail">Fail</option>
            <option value="continue">Continue</option>
          </select>
        </div>
        <button @click="addCondition" class="action-button">Add Condition</button>
      </div>
      <div v-if="node.data.conditions.length > 0">
        <h5>Current Conditions</h5>
        <div v-for="(condition, index) in node.data.conditions" :key="index" class="condition-section">
          <div class="condition-header">
            <strong>{{ condition.field }} {{ condition.operator }} {{ condition.value }}</strong>
            <span class="condition-action">({{ condition.action }})</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Calculation Node Properties -->
    <div v-if="node.type === 'calculation'">
      <h4>Calculation Settings</h4>
      <div>
        <label :for="`formula-${node.id}`">Formula:</label>
        <textarea :id="`formula-${node.id}`" v-model="node.data.formula" placeholder="Enter calculation formula"></textarea>
      </div>
      <div class="help-text">
        Use variables from input fields in your formula. Example: price * ltv / 100
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useFlowStore } from '../stores/flowStore';
import { useThemeStore } from '../stores/themeStore';

const flowStore = useFlowStore();
const themeStore = useThemeStore();
const node = computed(() => flowStore.selectedNode);

const newField = ref({
  label: '',
  type: 'text',
  options: ''
});

const newCondition = ref({
  field: '',
  operator: '==',
  value: '',
  action: 'fail'
});

const addField = () => {
  if (!newField.value.label) return;
  
  const field = {
    label: newField.value.label,
    type: newField.value.type,
    options: newField.value.type === 'dropdown' || newField.value.type === 'radio'
      ? newField.value.options.split(',').map(opt => opt.trim())
      : undefined
  };
  
  flowStore.updateNodeData(node.value.id, {
    fields: [...(node.value.data.fields || []), field]
  });
  
  newField.value = {
    label: '',
    type: 'text',
    options: ''
  };
};

const addCondition = () => {
  if (!newCondition.value.field || !newCondition.value.value) return;
  
  flowStore.updateNodeData(node.value.id, {
    conditions: [...(node.value.data.conditions || []), { ...newCondition.value }]
  });
  
  newCondition.value = {
    field: '',
    operator: '==',
    value: '',
    action: 'fail'
  };
};

const getInputFields = () => {
  const inputNode = flowStore.elements.find(el => el.type === 'input');
  return inputNode ? inputNode.data.fields : [];
};

const updateNodeData = (key, value) => {
  if (node.value) {
    flowStore.updateNodeData(node.value.id, { [key]: value });
  }
};

const updateLabel = (event) => {
  if (node.value) {
    const newLabel = event.target.value;
    const elIndex = flowStore.elements.findIndex(el => el.id === node.value.id);
    if (elIndex !== -1) {
      const currentElement = flowStore.elements[elIndex];
      if ('label' in currentElement) {
        currentElement.label = newLabel;
        if (flowStore.selectedNode && flowStore.selectedNode.id === node.value.id) {
          flowStore.setSelectedNode({ ...currentElement });
        }
      }
    }
  }
};
</script>

<style scoped>
.properties-panel {
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 5px;
  background-color: #f9f9f9;
  transition: background-color 0.3s, color 0.3s, border-color 0.3s;
}

.properties-panel.dark-theme {
  background-color: #2d2d2d;
  color: #ffffff;
  border-color: #404040;
}

.properties-panel h3, .properties-panel h4 {
  margin-top: 0;
  color: inherit;
}

.properties-panel div {
  margin-bottom: 10px;
}

.properties-panel label {
  display: block;
  margin-bottom: 3px;
  font-weight: bold;
  color: inherit;
}

.properties-panel input[type="text"],
.properties-panel select,
.properties-panel textarea {
  width: calc(100% - 10px);
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 3px;
  background-color: #ffffff;
  color: #333333;
  transition: background-color 0.3s, color 0.3s, border-color 0.3s;
}

.properties-panel.dark-theme input[type="text"],
.properties-panel.dark-theme select,
.properties-panel.dark-theme textarea {
  background-color: #404040;
  color: #ffffff;
  border-color: #555555;
}

.properties-panel textarea {
  min-height: 100px;
  font-family: monospace;
}

.response-info {
  margin: 10px 0;
  padding: 5px;
  background-color: #f0f0f0;
  border-radius: 3px;
  transition: background-color 0.3s;
}

.properties-panel.dark-theme .response-info {
  background-color: #404040;
}

.response-body {
  margin-top: 10px;
}

.response-body pre {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 3px;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
  transition: background-color 0.3s;
}

.properties-panel.dark-theme .response-body pre {
  background-color: #404040;
}

.help-text {
  font-size: 0.9em;
  color: #666;
  margin-top: 4px;
  padding: 4px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.dark-theme .help-text {
  color: #aaa;
  background-color: rgba(255, 255, 255, 0.1);
}

.properties-panel input[type="number"] {
  width: calc(100% - 10px);
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 3px;
  background-color: #ffffff;
  color: #333333;
}

.dark-theme .properties-panel input[type="number"] {
  background-color: #404040;
  color: #ffffff;
  border-color: #555555;
}

.variable-section,
.stage-section,
.decision-section,
.equation-section,
.table-section {
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.02);
}

.dark-theme .variable-section,
.dark-theme .stage-section,
.dark-theme .decision-section,
.dark-theme .equation-section,
.dark-theme .table-section {
  border-color: #444;
  background-color: rgba(255, 255, 255, 0.05);
}

.variable-header,
.stage-header,
.input-header,
.output-header,
.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.variable-type,
.stage-level,
.input-type,
.output-type,
.field-type,
.operator {
  font-size: 0.8em;
  color: #666;
  margin-left: 8px;
}

.dark-theme .variable-type,
.dark-theme .stage-level,
.dark-theme .input-type,
.dark-theme .output-type,
.dark-theme .field-type,
.dark-theme .operator {
  color: #aaa;
}

.condition-section,
.input-section,
.output-section {
  margin: 5px 0;
  padding: 5px;
  background-color: rgba(0, 0, 0, 0.01);
  border-radius: 3px;
}

.dark-theme .condition-section,
.dark-theme .input-section,
.dark-theme .output-section {
  background-color: rgba(255, 255, 255, 0.02);
}

.table-data {
  max-height: 200px;
  overflow-y: auto;
}

.table-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 5px;
  border-bottom: 1px solid #eee;
}

.dark-theme .table-row {
  border-bottom-color: #444;
}

.table-cell {
  flex: 1;
  min-width: 100px;
}

.add-field-section,
.add-condition-section {
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.02);
}

.dark-theme .add-field-section,
.dark-theme .add-condition-section {
  border-color: #444;
  background-color: rgba(255, 255, 255, 0.05);
}

.field-options {
  font-size: 0.9em;
  color: #666;
  margin-top: 4px;
}

.dark-theme .field-options {
  color: #aaa;
}

.condition-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.condition-action {
  font-size: 0.9em;
  color: #666;
}

.dark-theme .condition-action {
  color: #aaa;
}
</style>