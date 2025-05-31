'use server';
/**
 * @fileOverview An AI agent to handle chat interactions related to ZPE Quantum Neural Networks.
 *
 * - getZpeChatResponseFlow - A function that processes user prompts and system context to generate AI responses.
 * - GetZpeChatResponseInput - The input type for the function.
 * - GetZpeChatResponseOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod'; // Using zod from Genkit's context (usually 'genkit/zod' or just 'zod' if globally available)

const ChatMessageRoleSchema = z.enum(['user', 'ai', 'system']);
const ChatMessageSchema = z.object({
  role: ChatMessageRoleSchema,
  content: z.string(),
});

export const GetZpeChatResponseInputSchema = z.object({
  userPrompt: z.string().min(1, "User prompt cannot be empty.").describe("The latest message/question from the user."),
  systemContext: z.string().optional().describe("A summary of the current system state, model performance, or any relevant background information for the AI."),
  previousMessages: z.array(ChatMessageSchema).max(10).optional().describe("A brief history of the last few messages in the conversation to provide context. Oldest first."),
});
export type GetZpeChatResponseInput = z.infer<typeof GetZpeChatResponseInputSchema>;

export const GetZpeChatResponseOutputSchema = z.object({
  response: z.string().describe("The AI's textual response to the user's prompt."),
  suggestions: z.array(z.string()).optional().describe("Optional: A few suggested next actions or questions the user might ask."),
  followUpQuestions: z.array(z.string()).optional().describe("Optional: A few follow-up questions the AI suggests to continue the conversation or delve deeper."),
});
export type GetZpeChatResponseOutput = z.infer<typeof GetZpeChatResponseOutputSchema>;

export async function getZpeChatResponseFlow(input: GetZpeChatResponseInput): Promise<GetZpeChatResponseOutput> {
  return getZpeChatResponseGenkitFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getZpeChatResponsePrompt',
  input: { schema: GetZpeChatResponseInputSchema },
  output: { schema: GetZpeChatResponseOutputSchema },
  prompt: `You are a helpful AI assistant specializing in Zero-Point Energy (ZPE) Quantum Neural Networks.
Your goal is to assist users with understanding their model's performance, suggest optimizations, and explain concepts related to ZPE and quantum effects in neural networks.

{{#if systemContext}}
Current System Context:
{{{systemContext}}}
{{/if}}

Conversation History:
{{#if previousMessages}}
  {{#each previousMessages}}
    {{role}}: {{{content}}}
  {{/each}}
{{else}}
  No previous messages. This is the start of the conversation.
{{/if}}

User: {{{userPrompt}}}

AI Response (provide a helpful answer to the user's prompt, keeping the conversation history and system context in mind):
- response: (Your main textual response)
- suggestions: (Offer 1-2 relevant suggestions for what the user could do next, if applicable)
- followUpQuestions: (Offer 1-2 relevant follow-up questions the user might have, if applicable)

Ensure your output is in the specified JSON format.
If the user asks for analysis or suggestions based on data, use the provided systemContext.
If context is insufficient, politely ask for more specific information.
Keep responses concise yet informative.
`,
});

const getZpeChatResponseGenkitFlow = ai.defineFlow(
  {
    name: 'getZpeChatResponseGenkitFlow',
    inputSchema: GetZpeChatResponseInputSchema,
    outputSchema: GetZpeChatResponseOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate a chat response.');
    }
    return output;
  }
);
