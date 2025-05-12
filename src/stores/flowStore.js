import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

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

    try {
      switch (node.type) {
        case 'start':
          result = { success: true, result: {} };
          break;

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

        case 'output':
          result = { success: true, result: inputData };
          break;

        default:
          result = { success: false, message: `Unknown node type: ${node.type}` };
      }

      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const executeInput = async (nodeData, inputData) => {
    if (!nodeData.fields || nodeData.fields.length === 0) {
      return { success: false, message: 'No input fields defined' };
    }

    // For now, just pass through the input data
    return { success: true, result: inputData };
  };

  const executeCondition = async (nodeData, inputData) => {
    if (!nodeData.conditions || nodeData.conditions.length === 0) {
      return { success: false, message: 'No conditions defined' };
    }

    for (const condition of nodeData.conditions) {
      const result = evaluateCondition(condition, inputData[condition.field]);
      if (!result && condition.action === 'fail') {
        return { success: false, message: `Condition failed: ${condition.field} ${condition.operator} ${condition.value}` };
      }
    }

    return { success: true, result: inputData };
  };

  const executeCalculation = async (nodeData, inputData) => {
    if (!nodeData.formula) {
      return { success: false, message: 'No formula defined' };
    }

    try {
      // Replace variables in formula with values from input
      let formula = nodeData.formula;
      for (const [key, value] of Object.entries(inputData)) {
        formula = formula.replace(new RegExp(key, 'g'), value);
      }

      const result = eval(formula);
      return { 
        success: true, 
        result: { 
          ...inputData, 
          calculationResult: result 
        } 
      };
    } catch (error) {
      return { success: false, message: `Calculation error: ${error.message}` };
    }
  };

  const executeLog = async (nodeData, inputData) => {
    return {
      success: true,
      type: nodeData.type || 'info',
      message: nodeData.message || 'Log node executed',
      data: inputData
    };
  };

  const evaluateCondition = (condition, value) => {
    switch (condition.operator) {
      case '==': return value == condition.value;
      case '!=': return value != condition.value;
      case '>': return value > condition.value;
      case '<': return value < condition.value;
      case '>=': return value >= condition.value;
      case '<=': return value <= condition.value;
      case 'in': return condition.value.split(',').map(v => v.trim()).includes(value);
      case 'not in': return !condition.value.split(',').map(v => v.trim()).includes(value);
      default: return false;
    }
  };

  return {
    elements,
    selectedNode,
    getNodes,
    getEdges,
    addNode,
    updateNodeData,
    setSelectedNode,
    executeNode
  };
});