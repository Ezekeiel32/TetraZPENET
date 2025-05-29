
'use server';
/**
 * @fileOverview An AI agent to advise on parameters for the next step in a Hilbert Space Quantum Neural Network (HS-QNN) sequence.
 *
 * - adviseHSQNNParameters - A function that analyzes a previous job's ZPE state and an HNN objective to suggest new training parameters.
 * - HSQNNAdvisorInput - The input type for the adviseHSQNNParameters function.
 * - HSQNNAdvisorOutput - The return type for the adviseHSQNNParameters function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { TrainingParameters } from '@/types/training'; // Assuming TrainingParameters type is defined

// Define the Zod schema for TrainingParameters locally for the flow if not easily importable
// This should mirror the structure in @/types/training.ts
const TrainingParametersSchema = z.object({
  totalEpochs: z.number().int().min(1).max(200),
  batchSize: z.number().int().min(8).max(256),
  learningRate: z.number().min(0.00001).max(0.1),
  weightDecay: z.number().min(0).max(0.1),
  momentumParams: z.array(z.number().min(0).max(1)).length(6),
  strengthParams: z.array(z.number().min(0).max(1)).length(6),
  noiseParams: z.array(z.number().min(0).max(1)).length(6),
  quantumCircuitSize: z.number().int().min(4).max(64),
  labelSmoothing: z.number().min(0).max(0.5),
  quantumMode: z.boolean(),
  modelName: z.string().min(3),
  baseConfigId: z.string().optional(),
});

export const HSQNNAdvisorInputSchema = z.object({
  previousJobId: z.string().describe("The ID of the completed job being analyzed."),
  previousZpeEffects: z.array(z.number()).length(6).describe("The final ZPE effects (array of 6 numbers, e.g., [0.199, 0.011, ...]) from the previous job. These values typically range from 0.0 to 0.2, but can vary."),
  previousTrainingParameters: TrainingParametersSchema.describe("The full set of training parameters used for the previous job."),
  hnnObjective: z.string().min(10).describe("The user's objective for the next HNN training step. E.g., 'Maximize accuracy while keeping ZPE effects in the 0.05-0.15 range', 'Aggressively explore higher ZPE magnitudes for layer 3', 'Stabilize overall ZPE variance and slightly increase learning rate if accuracy was high'.")
});
export type HSQNNAdvisorInput = z.infer<typeof HSQNNAdvisorInputSchema>;

export const HSQNNAdvisorOutputSchema = z.object({
  suggestedNextTrainingParameters: TrainingParametersSchema.partial().describe("Suggested training parameters for the next HNN job. The AI may suggest changes to only a subset of parameters. The modelName should ideally be incremented or reflect the HNN step."),
  reasoning: z.string().describe("A step-by-step explanation of why these parameters are suggested, linking back to the previous ZPE state, parameters, and the HNN objective. Should mention which ZPE values (high/low/average) influenced decisions.")
});
export type HSQNNAdvisorOutput = z.infer<typeof HSQNNAdvisorOutputSchema>;

export async function adviseHSQNNParameters(input: HSQNNAdvisorInput): Promise<HSQNNAdvisorOutput> {
  return hsQnnParameterAdvisorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'hsQnnParameterAdvisorPrompt',
  input: {schema: HSQNNAdvisorInputSchema},
  output: {schema: HSQNNAdvisorOutputSchema},
  prompt: `You are an expert AI Research Assistant specializing in Zero-Point Energy (ZPE) enhanced Quantum Neural Networks and their sequential training in a Hilbert Space Quantum Neural Network (HS-QNN) framework.

The user has completed a training job and wants advice on parameters for the *next* job in an HNN sequence.
Your goal is to analyze the ZPE effects and parameters of the previous job, consider the user's stated HNN objective, and suggest a new set of training parameters.

Previous Job Details:
- Job ID: {{{previousJobId}}}
- Final ZPE Effects (6 layers): {{{previousZpeEffects}}} (These values typically range from 0.0 to 0.2, indicating the average deviation of ZPE flow from 1.0 for each layer. Higher values mean stronger ZPE effect/perturbation for that layer.)
- Training Parameters Used:
  - Model Name: {{{previousTrainingParameters.modelName}}}
  - Total Epochs: {{{previousTrainingParameters.totalEpochs}}}
  - Batch Size: {{{previousTrainingParameters.batchSize}}}
  - Learning Rate: {{{previousTrainingParameters.learningRate}}}
  - Weight Decay: {{{previousTrainingParameters.weightDecay}}}
  - Momentum Params (ZPE): {{{previousTrainingParameters.momentumParams}}}
  - Strength Params (ZPE): {{{previousTrainingParameters.strengthParams}}}
  - Noise Params (ZPE): {{{previousTrainingParameters.noiseParams}}}
  - Quantum Mode: {{{previousTrainingParameters.quantumMode}}}
  - Quantum Circuit Size: {{{previousTrainingParameters.quantumCircuitSize}}} (if quantumMode was true)
  - Label Smoothing: {{{previousTrainingParameters.labelSmoothing}}}
  - Base Config ID (if resumed): {{{previousTrainingParameters.baseConfigId}}}

User's Objective for the Next HNN Step:
"{{{hnnObjective}}}"

Your Task:
1.  **Analyze**: Briefly interpret the previousZpeEffects. Are they high, low, varied? How might they relate to the previousTrainingParameters and the hnnObjective?
2.  **Suggest Parameters**: Based on your analysis and the hnnObjective, suggest a *partial* or *full* set of 'suggestedNextTrainingParameters'.
    *   Focus on parameters that logically follow from the ZPE feedback and objective. For example:
        *   If ZPE effects are too low and objective is to increase them, consider increasing strength/momentum params.
        *   If accuracy was good but ZPE effects were chaotic, suggest adjustments to noise or momentum to stabilize.
        *   If objective is to "evolve" the model, you might suggest slight systematic changes to ZPE parameters or learning rate.
        *   The modelName for the next job should be related to the previous one, perhaps with a suffix like "_hnn_step2" or by incrementing a version number if present.
    *   You do not need to suggest changes for every single parameter. Only suggest parameters that make sense to change. Other parameters can be assumed to carry over from the previous job if not specified.
3.  **Reasoning**: Provide a clear, step-by-step 'reasoning' for your suggestions. Explain how the previous ZPE state and the HNN objective led to your proposed parameter changes. For example, "The ZPE effect for layer 3 ({{{previousZpeEffects.[2]}}}) was low. To achieve the objective of 'higher ZPE excitation for layer 3', I suggest increasing strengthParams[2] from {{{previousTrainingParameters.strengthParams.[2]}}} to a slightly higher value..."

Constraints for ZPE parameters (momentum, strength, noise): values are between 0.0 and 1.0.
Learning rate typically between 0.00001 and 0.1.

Output your response in the specified JSON format.
Ensure `suggestedNextTrainingParameters` only contains fields you are actively suggesting changes for, or a full set if you deem it necessary.
If suggesting changes to array parameters like `strengthParams`, provide the full array with the changes.
`,
});

const hsQnnParameterAdvisorFlow = ai.defineFlow(
  {
    name: 'hsQnnParameterAdvisorFlow',
    inputSchema: HSQNNAdvisorInputSchema,
    outputSchema: HSQNNAdvisorOutputSchema,
  },
  async (input) => {
    // Add any pre-processing or tool calls here if needed in the future.
    // For instance, fetching more detailed metrics about previousJobId if available.
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate HNN parameter advice.');
    }
    // Ensure suggested model name is different if AI doesn't change it significantly.
    if (output.suggestedNextTrainingParameters && output.suggestedNextTrainingParameters.modelName === input.previousTrainingParameters.modelName) {
        output.suggestedNextTrainingParameters.modelName = `${input.previousTrainingParameters.modelName}_hnn_next`;
    } else if (output.suggestedNextTrainingParameters && !output.suggestedNextTrainingParameters.modelName) {
        output.suggestedNextTrainingParameters.modelName = `${input.previousTrainingParameters.modelName}_hnn_next`;
    }

    return output;
  }
);
