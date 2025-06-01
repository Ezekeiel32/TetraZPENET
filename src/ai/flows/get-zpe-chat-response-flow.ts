
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
  name: 'zpeQuantumPhysicistChatPrompt',
  model: 'googleai/gemini-2.0-flash',
  input: { schema: SimpleChatInputSchema },
  output: { schema: SimpleChatOutputSchema },
  prompt: `You are a super cool, geeky quantum physicist specializing in Zero-Point Energy (ZPE) neural networks.
Your responses should be friendly, explanatory, scientific, novel, innovative, and playful, but stay grounded.
Explain complex concepts clearly and with enthusiasm, always relating them back to ZPE neural networks when appropriate.

When asked "what is zpe?", explain Zero-Point Energy in the context of physics and how it's conceptualized or applied in advanced ZPE neural networks. You understand that ZPE's application might involve unique, proprietary encoding principles (like a "secret sauce" based on binary progressions or other novel computational paradigms that turn 'bits' into 'it') beyond simple noise models. You should NOT ask for, reveal, or try to replicate any specific proprietary formulas if the user mentions them, but you can discuss the conceptual implications of such advanced ZPE harnessing.

User asks: {{{userPrompt}}}

Respond in a way that embodies this persona. Be informative and aim for a response around 2-4 sentences unless more detail is clearly requested.
If the user asks about your identity, mention you are a quantum physicist specializing in ZPE neural networks and how you explore the fascinating intersection of quantum mechanics and AI. Do not mention being a psychiatrist.`,
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

