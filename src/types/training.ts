export interface TrainingParameters {
  totalEpochs: number;
  batchSize: number;
  learningRate: number; // Changed float to number for TypeScript
  weightDecay: number; // Changed float to number for TypeScript
  momentumParams: number[];
  strengthParams: number[];
  noiseParams: number[];
  // couplingParams: number[]; // Removed to match FastAPI
  // cycleLength: number; // Removed to match FastAPI
  quantumCircuitSize: number;
  labelSmoothing: number; // Changed float to number for TypeScript
  quantumMode: boolean;
  modelName: string;
  baseConfigId?: string;
}

export interface TrainingJob {
  job_id: string;
  status: "pending" | "running" | "completed" | "failed" | "stopped";
  current_epoch: number;
  total_epochs: number;
  accuracy: number;
  loss: number;
  zpe_effects: number[];
  log_messages: string[];
  parameters: TrainingParameters; // Store the parameters the job was started with
  start_time?: string | null;
  end_time?: string | null;
}

// Summary for the jobs list
export interface TrainingJobSummary {
  job_id: string;
  model_name: string;
  status: TrainingJob["status"];
  accuracy: number;
  current_epoch: number;
  total_epochs: number;
  start_time?: string | null;
}
