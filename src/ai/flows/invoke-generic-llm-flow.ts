'use server';
/**
 * @fileOverview A generic flow to invoke an LLM with a user-provided prompt.
 *
 * - invokeGenericLlm - A function that takes a prompt and returns the LLM's text response.
 * - InvokeGenericLlmInput - The input type for the invokeGenericLlm function.
 * - InvokeGenericLlmOutput - The return type for the invokeGenericLlm function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const InvokeGenericLlmInputSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty.").describe("The prompt to send to the LLM."),
});
export type InvokeGenericLlmInput = z.infer<typeof InvokeGenericLlmInputSchema>;

const InvokeGenericLlmOutputSchema = z.object({
  response: z.string().describe("The text response from the LLM."),
});
export type InvokeGenericLlmOutput = z.infer<typeof InvokeGenericLlmOutputSchema>;

export async function invokeGenericLlm(input: InvokeGenericLlmInput): Promise<InvokeGenericLlmOutput> {
  return invokeGenericLlmFlow(input);
}

// This flow directly passes the prompt to the configured LLM.
// It does not use a structured ai.definePrompt here because the prompt content is entirely dynamic from the user.
const invokeGenericLlmFlow = ai.defineFlow(
  {
    name: 'invokeGenericLlmFlow',
    inputSchema: InvokeGenericLlmInputSchema,
    outputSchema: InvokeGenericLlmOutputSchema,
  },
  async (input) => {
    const llmResponse = await ai.generate({
      prompt: input.prompt,
      // You could add history or context here if needed for a more conversational generic invoker
    });

    return { response: llmResponse.text() };
  }
);
