// src/types/entities.ts

// Based on ModelConfig.json
export interface ModelConfig {
  id?: string; // Assuming 'id' is auto-generated or optional before creation
  name: string;
  channel_sizes: number[];
  zpe_momentum: number[];
  zpe_strength: number[];
  zpe_noise: number[];
  zpe_coupling: number[];
  use_quantum_noise: boolean;
  accuracy: number;
  date_created: string; // ISO date string e.g., "YYYY-MM-DD"
}

// Based on PerformanceMetric.json
export interface PerformanceMetric {
  id?: string; // Assuming 'id' is auto-generated or optional before creation
  config_id: string;
  epoch: number;
  training_loss: number;
  validation_accuracy: number;
  zpe_effects: number[];
  timestamp: string; // ISO date-time string
  // Added for completeness, from the new Performance.js page
  avg_zpe_effect?: number; 
  training_accuracy?: number;
  validation_loss?: number;
}

// Based on QuantumNoiseSample.json
export interface QuantumNoiseSample {
  id?: string; // Assuming 'id' is auto-generated or optional before creation
  sample_id: string;
  values: number[];
  mean: number;
  std: number;
  num_qubits: number;
  timestamp: string; // ISO date-time string
}

// Placeholder for Core integration (LLM calls)
// You would define the actual InvokeLLM function and its types elsewhere
export interface InvokeLLMOptions {
  prompt: string;
  response_json_schema?: any; // Replace 'any' with a more specific schema type if available
}
export type InvokeLLMResponse = any; // Replace 'any'

// Mock implementation or placeholder - replace with your actual implementation
export async function InvokeLLM(options: InvokeLLMOptions): Promise<InvokeLLMResponse> {
  console.warn("InvokeLLM is a placeholder and not implemented. Returning mock data.");
  if (options.prompt.includes("Explain in about 150 words how quantum fluctuations")) {
    return { 
      explanation: "Quantum fluctuations, derived from zero-point energy (ZPE) in quantum field theory, represent the lowest possible energy state of a quantum mechanical system. When applied to neural networks, these microscopic quantum effects could create non-deterministic perturbations in network weights. This quantum noise might help escape local minima during training by inducing small, random weight adjustments. The theoretical advantage comes from quantum superposition, allowing the network to probabilistically explore multiple parameter configurations simultaneously. By carefully calibrating the quantum coupling strength, these fluctuations could enhance generalization by preventing overfitting to training data. This approach combines quantum mechanical principles with classical neural computation, potentially offering advantages in specific learning scenarios where controlled randomness benefits optimization."
    };
  }
  if (options.prompt.includes("Analyze this ZPE quantum neural network performance data")) {
     return {
        performance_assessment: "Overall performance is strong with promising accuracy. Quantum configurations show potential but require further tuning.",
        quantum_insights: "Quantum noise seems to enhance exploration, leading to slightly higher peak accuracies in some configurations but can also introduce instability if not well-calibrated with ZPE parameters.",
        optimization_recommendations: [
          { title: "Refine ZPE Strength for Quantum Models", description: "Experiment with slightly lower ZPE strength values (e.g., 0.2-0.4 range) in layers where quantum noise is active to potentially improve stability.", priority: "High", expected_impact: "Potential +0.2% accuracy, improved stability", suggested_parameters: null },
          { title: "Increase Epochs for Complex Configs", description: "For models with high ZPE coupling and quantum noise, consider increasing total epochs by 10-20% to allow for more thorough convergence.", priority: "Medium", expected_impact: "May unlock higher accuracy", suggested_parameters: { totalEpochs: 50 } },
          { title: "Explore Asymmetric ZPE Momentum", description: "Try a non-uniformly decreasing ZPE momentum profile, perhaps with slightly higher momentum in later layers.", priority: "Low", expected_impact: "Exploratory, potential for new optima", suggested_parameters: { momentumParams: [0.9, 0.85, 0.82, 0.80, 0.78, 0.75] } }
        ],
        attention_areas: ["Overfitting in some non-quantum models with high ZPE strength.", "Computational cost of quantum noise generation."]
      };
  }
  return { response: "AI response placeholder."