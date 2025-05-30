import { config } from 'dotenv';
config();

import '@/ai/flows/implement-zpe.ts';
import '@/ai/flows/approximate-zpe.ts';
import '@/ai/flows/adapt-zpe.ts';
import '@/ai/flows/show-scaled-output.ts';
import '@/ai/flows/quantize-colab-model.ts';
import '@/ai/flows/extract-high-gain-components.ts';
import '@/ai/flows/configure-model-for-dataset.ts';
import '@/ai/flows/hs-qnn-parameter-advisor.ts';
import '@/ai/flows/get-initial-zpe-analysis-flow';
import '@/ai/flows/get-zpe-chat-response-flow';
import '@/ai/flows/get-quantum-explanation-flow';
import '@/ai/flows/invoke-generic-llm-flow'; // Added new generic LLM invoker flow
