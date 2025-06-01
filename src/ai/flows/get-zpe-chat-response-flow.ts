'use server'; // Directive at the top

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Simplified Input Schema
const SimpleChatInputSchema = z.object({
  userPrompt: z.string().min(1, "User prompt cannot be empty.").describe("The latest message/question from the user."),
});
export type GetZpeChatResponseInput = z.infer<typeof SimpleChatInputSchema>;

// Simplified Output Schema
const SimpleChatOutputSchema = z.object({
  response: z.string().describe("The AI's textual response to the user's prompt."),
});
export type GetZpeChatResponseOutput = z.infer<typeof SimpleChatOutputSchema>;

// Exported Async Wrapper Function
export async function getZpeChatResponseFlow(input: GetZpeChatResponseInput): Promise<GetZpeChatResponseOutput> {
  return simpleChatGenkitFlow(input);
}

// Simplified Internal Genkit Prompt Definition
const simplePrompt = ai.definePrompt({
  name: 'simpleChatPrompt',
  model: 'googleai/gemini-2.0-flash',
  input: { schema: SimpleChatInputSchema },
  output: { schema: SimpleChatOutputSchema },
  prompt: `User asks: {{{userPrompt}}}. Respond very simply.`,
});

// Simplified Internal Genkit Flow Definition
// Line 84 referenced in the error would be near the end of this async function's body.
const simpleChatGenkitFlow = ai.defineFlow(
  {
    name: 'simpleChatGenkitFlow',
    inputSchema: SimpleChatInputSchema,
    outputSchema: SimpleChatOutputSchema,
  },
  async (input) => {
    const { output } = await simplePrompt(input);
    if (!output) {
      throw new Error('AI failed to generate a simple chat response.');
    }
    return output;
  }
);

