'use server'; // Directive at the top

// Imports
import { ai } from '@/ai/genkit';
import { z } from 'zod'; // Correct import for zod

// Internal Zod schema for ChatMessage
// const ChatMessageRoleSchema = z.enum(['user', 'ai', 'system']); // Original - potentially problematic
const ChatMessageRoleSchema = z.string().describe("The role of the message sender, expected to be 'user', 'ai', or 'system'."); // Diagnostic change
const ChatMessageSchema = z.object({
  role: ChatMessageRoleSchema,
  content: z.string(),
});

// Internal Zod schema for Input - NOT EXPORTED AS CONST
const GetZpeChatResponseInputSchema = z.object({
  userPrompt: z.string().min(1, "User prompt cannot be empty.").describe("The latest message/question from the user."),
  systemContext: z.string().optional().describe("A summary of the current system state, model performance, or any relevant background information for the AI."),
  previousMessages: z.array(ChatMessageSchema).max(10).optional().describe("A brief history of the last few messages in the conversation to provide context. Oldest first."),
});
// Exported Type for Input
export type GetZpeChatResponseInput = z.infer<typeof GetZpeChatResponseInputSchema>;

// Internal Zod schema for Output - NOT EXPORTED AS CONST
const GetZpeChatResponseOutputSchema = z.object({
  response: z.string().describe("The AI's textual response to the user's prompt."),
  suggestions: z.array(z.string()).optional().describe("Optional: A few suggested next actions or questions the user might ask."),
  followUpQuestions: z.array(z.string()).optional().describe("Optional: A few follow-up questions the AI suggests to continue the conversation or delve deeper."),
});
// Exported Type for Output
export type GetZpeChatResponseOutput = z.infer<typeof GetZpeChatResponseOutputSchema>;

// Exported Async Wrapper Function
export async function getZpeChatResponseFlow(input: GetZpeChatResponseInput): Promise<GetZpeChatResponseOutput> {
  return getZpeChatResponseGenkitFlow(input);
}

// Internal Genkit Prompt Definition
const prompt = ai.definePrompt({
  name: 'getZpeChatResponsePrompt',
  input: {schema: GetZpeChatResponseInputSchema},
  output: {schema: GetZpeChatResponseOutputSchema},
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

// Internal Genkit Flow Definition
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
