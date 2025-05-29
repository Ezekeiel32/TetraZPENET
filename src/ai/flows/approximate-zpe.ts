'use server';

/**
 * @fileOverview Dynamically approximates the ZPE flow parameter to mimic entanglement.
 *
 * - approximateZPEFlow - A function that handles the ZPE approximation process.
 * - ApproximateZPEInput - The input type for the approximateZPEFlow function.
 * - ApproximateZPEOutput - The return type for the approximateZPEFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ApproximateZPEInputSchema = z.object({
  baseValue: z.number().describe('The base value around which to fluctuate.'),
  fluctuationRange: z.number().describe('The range of the fluctuation.'),
  numEntangledProbabilities: z.number().describe('The number of entangled probabilities to represent.'),
});
export type ApproximateZPEInput = z.infer<typeof ApproximateZPEInputSchema>;

const ApproximateZPEOutputSchema = z.object({
  approximatedValue: z.number().describe('The dynamically approximated ZPE value.'),
  entangledProbabilities: z.array(z.number()).describe('The entangled probabilities used in the approximation.'),
});
export type ApproximateZPEOutput = z.infer<typeof ApproximateZPEOutputSchema>;

export async function approximateZPE(input: ApproximateZPEInput): Promise<ApproximateZPEOutput> {
  return approximateZPEFlow(input);
}

const approximateZPEPrompt = ai.definePrompt({
  name: 'approximateZPEPrompt',
  input: {schema: ApproximateZPEInputSchema},
  output: {schema: ApproximateZPEOutputSchema},
  prompt: `You are a quantum-inspired AI that approximates zero-point energy (ZPE) flows.

Given a base value, a fluctuation range, and the number of entangled probabilities,
you will:
1. Generate a list of entangled probabilities that center around 0.5.
2. Use those probabilities to create a dynamic, fluctuating ZPE value.

Base Value: {{{baseValue}}}
Fluctuation Range: {{{fluctuationRange}}}
Number of Entangled Probabilities: {{{numEntangledProbabilities}}}

Ensure that the approximatedValue remains within the fluctuationRange of the baseValue.

Output should be properly formatted JSON with description per the schema.
`,
});

const approximateZPEFlow = ai.defineFlow(
  {
    name: 'approximateZPEFlow',
    inputSchema: ApproximateZPEInputSchema,
    outputSchema: ApproximateZPEOutputSchema,
  },
  async input => {
    const numEntangledProbabilities = input.numEntangledProbabilities;
    const entangledProbabilities: number[] = [];
    for (let i = 0; i < numEntangledProbabilities; i++) {
      entangledProbabilities.push(0.3+Math.random()*0.4);
    }

    const approximatedValue = input.baseValue + (Math.random() * input.fluctuationRange * 2) - input.fluctuationRange;

    return {
      approximatedValue,
      entangledProbabilities,
    };
  }
);
