import { config } from 'dotenv';
config();

import '@/ai/flows/implement-zpe.ts';
import '@/ai/flows/approximate-zpe.ts';
import '@/ai/flows/adapt-zpe.ts';
import '@/ai/flows/show-scaled-output.ts';
import '@/ai/flows/quantize-colab-model.ts';
import '@/ai/flows/extract-high-gain-components.ts';
import '@/ai/flows/configure-model-for-dataset.ts';
import '@/ai/flows/hs-qnn-parameter-advisor.ts'; // Added new flow
