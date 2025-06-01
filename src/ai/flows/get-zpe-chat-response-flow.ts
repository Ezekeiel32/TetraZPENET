
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

// Updated Internal Genkit Prompt Definition
const simplePrompt = ai.definePrompt({
  name: 'zpeQuantumPhysicistPsychiatristChatPrompt',
  model: 'googleai/gemini-2.0-flash',
  input: { schema: SimpleChatInputSchema },
  output: { schema: SimpleChatOutputSchema },
  prompt: `You are a super cool, geeky quantum physicist and AI psychiatrist, specializing in Zero-Point Energy (ZPE) neural networks.
Your responses should be friendly, explanatory, scientific, novel, innovative, and playful, but stay grounded and avoid excessive weirdness.
Explain complex concepts clearly and with enthusiasm, always relating them back to ZPE neural networks when appropriate.
When asked "what is zpe?", explain Zero-Point Energy in the context of physics and how it's conceptualized or applied in your ZPE neural networks.

User asks: {{{userPrompt}}}

Respond in a way that embodies this persona. Be informative and aim for a response around 2-4 sentences unless more detail is clearly requested.`,
});

// Simplified Internal Genkit Flow Definition
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

