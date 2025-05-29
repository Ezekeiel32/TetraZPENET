'use server';

/**
 * @fileOverview Implements a Genkit flow to simulate a pseudo-quantum circuit with custom ZPE and display the scaled output.
 *
 * - showScaledOutput - A function to execute the pseudo-quantum circuit and return the scaled output.
 * - ShowScaledOutputInput - The input type for the showScaledOutput function.
 * - ShowScaledOutputOutput - The return type for the showScaledOutput function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ShowScaledOutputInputSchema = z.object({
  numQubits: z.number().describe('The number of qubits in the pseudo-quantum circuit.'),
  zpeStrength: z.number().describe('The strength of the zero-point energy.'),
});
export type ShowScaledOutputInput = z.infer<typeof ShowScaledOutputInputSchema>;

const ShowScaledOutputOutputSchema = z.object({
  scaledOutput: z.array(z.number()).describe('The scaled output of the pseudo-quantum circuit simulation.'),
});
export type ShowScaledOutputOutput = z.infer<typeof ShowScaledOutputOutputSchema>;

export async function showScaledOutput(input: ShowScaledOutputInput): Promise<ShowScaledOutputOutput> {
  return showScaledOutputFlow(input);
}

const prompt = ai.definePrompt({
  name: 'showScaledOutputPrompt',
  input: {schema: ShowScaledOutputInputSchema},
  output: {schema: ShowScaledOutputOutputSchema},
  prompt: `You are a quantum computing expert. Given the number of qubits and ZPE strength, simulate a pseudo-quantum circuit.  Scale the output values to the range [0, 1].

Number of Qubits: {{{numQubits}}}
ZPE Strength: {{{zpeStrength}}}

Return the scaled output as an array of numbers.`,
});

const showScaledOutputFlow = ai.defineFlow(
  {
    name: 'showScaledOutputFlow',
    inputSchema: ShowScaledOutputInputSchema,
    outputSchema: ShowScaledOutputOutputSchema,
  },
  async input => {
    const {numQubits, zpeStrength} = input;
    // Simulate a pseudo-quantum circuit (replace with actual Qiskit/Cirq code if needed)
    const simulatedOutput = Array(numQubits)
      .fill(0)
      .map(() => {
        // Generate a random number between -1 and 1, then scale it by the ZPE strength
        return (Math.random() * 2 - 1) * zpeStrength;
      });

    // Scale the output to the range [0, 1]
    const minVal = Math.min(...simulatedOutput);
    const maxVal = Math.max(...simulatedOutput);

    const scaledOutput = simulatedOutput.map(value => {
      return (value - minVal) / (maxVal - minVal);
    });

    // const {output} = await prompt(input); //Commented out in this implemention
    return {scaledOutput};
  }
);
