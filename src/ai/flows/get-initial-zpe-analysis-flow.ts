'use server';
/**
 * @fileOverview An AI agent to analyze ZPE quantum neural network performance data.
 *
 * - getInitialZpeAnalysis - A function that analyzes summary data and provides insights.
 * - GetInitialZpeAnalysisInput - The input type for the function.
 * - GetInitialZpeAnalysisOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GetInitialZpeAnalysisInputSchema = z.object({
  totalConfigs: z.number().describe("Total number of model configurations available."),
  bestAccuracy: z.number().describe("The highest accuracy achieved among all configurations (0 if no configs)."),
  averageAccuracy: z.number().describe("The average accuracy across all configurations (0 if no configs)."),
  quantumConfigs: z.number().describe("Number of configurations that utilize quantum noise."),
  recentMetricsCount: z.number().describe("Number of recent performance metrics recorded (e.g., from the last 10 training runs).")
});
export type GetInitialZpeAnalysisInput = z.infer<typeof GetInitialZpeAnalysisInputSchema>;

const GetInitialZpeAnalysisOutputSchema = z.object({
  performance_assessment: z.string().describe("Overall assessment of the ZPE network's performance based on provided summary data. Mention key stats like best/average accuracy."),
  quantum_insights: z.string().describe("Insights specific to quantum effects, ZPE interactions, or quantum noise if applicable, considering the number of quantum configs."),
  optimization_recommendations: z.array(
    z.object({
      title: z.string().describe("A concise title for the optimization suggestion (e.g., 'Explore Higher ZPE Strength')."),
      description: z.string().describe("A detailed description of the suggested optimization and its rationale."),
      priority: z.enum(["High", "Medium", "Low"]).describe("Priority level of the suggestion (High, Medium, or Low)."),
      expected_impact: z.string().describe("What is the expected impact if this suggestion is implemented (e.g., 'Potential +0.5% accuracy', 'Improved stability')."),
      suggested_parameters: z.any().optional().describe("Specific parameter changes to try, if applicable. E.g., { learningRate: 0.0005 } or null if not specific.")
    })
  ).min(1).max(3).describe("Provide 1 to 3 actionable recommendations to improve model performance or explore new configurations."),
  attention_areas: z.array(z.string()).min(1).max(3).describe("Provide 1 to 3 areas or specific metrics that require closer attention or might indicate issues (e.g., 'Low average accuracy despite high best accuracy', 'Few quantum configurations explored').")
});
export type GetInitialZpeAnalysisOutput = z.infer<typeof GetInitialZpeAnalysisOutputSchema>;

// Wrapper function to be called by the application
export async function getInitialZpeAnalysis(input: GetInitialZpeAnalysisInput): Promise<GetInitialZpeAnalysisOutput> {
  return getInitialZpeAnalysisGenkitFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getInitialZpeAnalysisPrompt',
  input: { schema: GetInitialZpeAnalysisInputSchema },
  output: { schema: GetInitialZpeAnalysisOutputSchema },
  prompt: `You are an expert AI research assistant specializing in Zero-Point Energy (ZPE) enhanced Quantum Neural Networks.
Analyze the following summary of model configurations and performance metrics.
Provide a performance assessment, insights into quantum effects, 1 to 3 actionable optimization recommendations, and 1 to 3 areas requiring attention.
Ensure your output is structured according to the provided JSON schema.

Performance Summary:
- Total Model Configurations: {{{totalConfigs}}}
- Best Accuracy Achieved: {{bestAccuracy}}%
- Average Accuracy: {{averageAccuracy}}%
- Configurations Using Quantum Noise: {{{quantumConfigs}}}
- Recent Training Metrics Available: {{{recentMetricsCount}}}

Based on this data, generate your analysis.
If there are no configurations (totalConfigs is 0), your assessment should reflect that and suggest starting some training runs.
Recommendations should be general if no specific data trends are available.
`,
});

const getInitialZpeAnalysisGenkitFlow = ai.defineFlow(
  {
    name: 'getInitialZpeAnalysisFlow', // This is the internal Genkit flow name
    inputSchema: GetInitialZpeAnalysisInputSchema,
    outputSchema: GetInitialZpeAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate ZPE analysis.');
    }
    return output;
  }
);
