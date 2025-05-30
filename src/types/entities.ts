// src/types/entities.ts

export interface ModelConfig {
  id?: string;
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

export interface PerformanceMetric {
  id?: string;
  config_id: string; // ID of the associated model configuration
  epoch: number;
  training_loss: number;
  validation_accuracy: number; // Used in Performance.js
  training_accuracy?: number; // Added from Performance.js
  validation_loss?: number; // Added from Performance.js
  zpe_effects: number[];
  avg_zpe_effect?: number; // Added from Performance.js
  timestamp: string; // ISO date-time string
  date?: string; // Used in Performance.js, assuming it's from timestamp
}

export interface QuantumNoiseSample {
  id?: string;
  sample_id: string;
  values: number[];
  mean: number;
  std: number;
  num_qubits: number;
  timestamp: string; // ISO date-time string
}

// Placeholder for Core integration (LLM calls)
// These are placeholders. You'll need to define the actual implementation and types.
export interface InvokeLLMOptions {
  prompt: string;
  response_json_schema?: any; // Replace 'any' with a more specific schema type if available
}

// This is a very generic response type. You'll want to make this more specific.
export type InvokeLLMResponse = {
  explanation?: string;
  performance_assessment?: string;
  quantum_insights?: string;
  optimization_recommendations?: Array<{
    title: string;
    description: string;
    priority: string;
    expected_impact: string;
    suggested_parameters?: Partial<any>; // Define TrainingParameters type from training.ts here if needed
  }>;
  attention_areas?: string[];
  response?: string;
  suggestions?: string[];
  follow_up_questions?: string[];
  [key: string]: any; // Allow other properties
};

// Mock implementation or placeholder - replace with your actual implementation
// This function would typically live in a service or integration module.
// For now, placing a typed placeholder here.
export async function InvokeLLM(options: InvokeLLMOptions): Promise<InvokeLLMResponse> {
  console.warn("InvokeLLM is a placeholder and not implemented. Returning mock data based on prompt content.");
  
  // Simple mock logic based on prompt content.
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
          { title: "Refine ZPE Strength for Quantum Models", description: "Experiment with slightly lower ZPE strength values (e.g., 0.2-0.4 range) in layers where quantum noise is active to potentially improve stability.", priority: "High", expected_impact: "Potential +0.2% accuracy", suggested_parameters: null },
          { title: "Increase Epochs for Complex Configs", description: "For models with high ZPE coupling and quantum noise, consider increasing total epochs by 10-20% to allow for more thorough convergence.", priority: "Medium", expected_impact: "May unlock higher accuracy", suggested_parameters: { totalEpochs: 50 } },
          { title: "Explore Asymmetric ZPE Momentum", description: "Try a non-uniformly decreasing ZPE momentum profile, perhaps with slightly higher momentum in later layers.", priority: "Low", expected_impact: "Exploratory, potential for new optima", suggested_parameters: { momentumParams: [0.9, 0.85, 0.82, 0.80, 0.78, 0.75] } }
        ],
        attention_areas: ["Overfitting in some non-quantum models with high ZPE strength.", "Computational cost of quantum noise generation."]
      };
  }
  if(options.prompt.includes("User Question:")){
     return {
        response: "Thank you for your question! Based on the current system state, I can provide some general advice. Consider focusing on optimizing ZPE strength parameters for layers 3 and 4, as they often show high sensitivity. Also, ensure your learning rate is appropriate for the complexity of the quantum noise being introduced.",
        suggestions: ["Try reducing ZPE strength in later layers.", "Experiment with a smaller quantum circuit size if convergence is slow."],
        follow_up_questions: ["How do I interpret ZPE effects across different layers?", "What's the optimal learning rate when quantum mode is enabled?"]
     };
  }
  return { response: "AI response placeholder." };
}
