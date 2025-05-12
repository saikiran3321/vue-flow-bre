import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
// No need to import 'Elements', 'FlowElement', 'Node', 'Edge' types for JS

export const useFlowStore = defineStore('flow', () => {
  const elements = ref([]);
  const selectedNode = ref(null);

  const getNodes = computed(() => elements.value.filter(el => !el.source));
  const getEdges = computed(() => elements.value.filter(el => el.source));

  const addNode = (type, label, position, data = {}) => {
    const id = `${type}-${Date.now()}`;
    const nodeData = {
      ...data,
      response: null,
      input: null,
      fields: data.fields || [],
      conditions: data.conditions || [],
      formula: data.formula || '',
      variables: data.variables || {}
    };

    elements.value.push({
      id,
      type,
      label,
      position,
      data: nodeData,
      class: `${type}-node`
    });
    return id;
  };

  const insertNode = (type, label, position, sourceId, targetId) => {
    const edgeIndex = elements.value.findIndex(el => 
      el.source === sourceId && el.target === targetId
    );
    if (edgeIndex === -1) return null;

    const edge = elements.value[edgeIndex];
    elements.value.splice(edgeIndex, 1);

    const newNodeId = addNode(type, label, position);

    elements.value.push({
      id: `edge-${sourceId}-${newNodeId}`,
      source: sourceId,
      target: newNodeId,
      type: 'smoothstep'
    });

    elements.value.push({
      id: `edge-${newNodeId}-${targetId}`,
      source: newNodeId,
      target: targetId,
      type: 'smoothstep'
    });

    return newNodeId;
  };

  const updateNodeData = (nodeId, newData) => {
    const nodeIndex = elements.value.findIndex(el => el.id === nodeId);
    if (nodeIndex !== -1) {
      elements.value[nodeIndex].data = {
        ...elements.value[nodeIndex].data,
        ...newData
      };
    }
  };

  const setSelectedNode = (node) => {
    selectedNode.value = node;
  };

  const executeNode = async (node, inputData) => {
    if (!node) return null;

    const nodeData = node.data;
    let result = null;

    switch (node.type) {
      case 'input':
        result = await executeInput(nodeData, inputData);
        break;
      case 'condition':
        result = await executeCondition(nodeData, inputData);
        break;
      case 'calculation':
        result = await executeCalculation(nodeData, inputData);
        break;
      case 'log':
        result = await executeLog(nodeData, inputData);
        break;
    }

    return result;
  };

  const executeInput = async (nodeData, inputData) => {
    // Validate input data against field definitions
    const validationResults = {};
    for (const field of nodeData.fields) {
      const value = inputData[field.label];
      validationResults[field.label] = validateField(field, value);
    }
    return validationResults;
  };

  const executeCondition = async (nodeData, inputData) => {
    for (const condition of nodeData.conditions) {
      const fieldValue = inputData[condition.field];
      const result = evaluateCondition(condition, fieldValue);
      
      if (!result && condition.action === 'fail') {
        return {
          success: false,
          message: `Condition failed: ${condition.field} ${condition.operator} ${condition.value}`
        };
      }
    }
    return { success: true };
  };

  const executeCalculation = async (nodeData, inputData) => {
    try {
      // Replace variables in formula with actual values
      let formula = nodeData.formula;
      for (const [key, value] of Object.entries(inputData)) {
        formula = formula.replace(new RegExp(key, 'g'), value);
      }
      
      // Evaluate the formula
      const result = eval(formula);
      return { success: true, result };
    } catch (error) {
      return { success: false, message: `Calculation error: ${error.message}` };
    }
  };

  const executeLog = async (nodeData, inputData) => {
    return {
      type: nodeData.type,
      message: nodeData.message,
      data: inputData
    };
  };

  const validateField = (field, value) => {
    switch (field.type) {
      case 'number':
        return !isNaN(value) && value !== '';
      case 'date':
        return !isNaN(Date.parse(value));
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'dropdown':
      case 'radio':
        return field.options.includes(value);
      default:
        return value !== undefined && value !== '';
    }
  };

  const evaluateCondition = (condition, value) => {
    switch (condition.operator) {
      case '==':
        return value == condition.value;
      case '!=':
        return value != condition.value;
      case '>':
        return value > condition.value;
      case '<':
        return value < condition.value;
      case '>=':
        return value >= condition.value;
      case '<=':
        return value <= condition.value;
      case 'in':
        return condition.value.split(',').map(v => v.trim()).includes(value);
      case 'not in':
        return !condition.value.split(',').map(v => v.trim()).includes(value);
      default:
        return false;
    }
  };

  return {
    elements,
    selectedNode,
    getNodes,
    getEdges,
    addNode,
    insertNode,
    updateNodeData,
    setSelectedNode,
    executeNode
  }
})