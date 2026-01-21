import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from '../prompts/systemPrompt';
import type { FormState } from '../types/form';
import type { AnalysisResult } from '../types/analysis';

function getClient(): Anthropic {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Missing API key. Please set VITE_ANTHROPIC_API_KEY in your .env file.'
    );
  }

  return new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}

function buildUserMessage(formData: FormState): string {
  const parts: string[] = [];

  // Feedback style instructions
  if (formData.feedbackStyle === 'direct') {
    parts.push(`## FEEDBACK STYLE
Be direct and blunt. Don't soften criticism - tell them exactly what went wrong and why. Use phrases like 'This was weak because...' or 'You lost momentum here when...'`);
  } else {
    parts.push(`## FEEDBACK STYLE
Be supportive and constructive. Acknowledge what worked before suggesting improvements. Use phrases like 'This worked well, and you could strengthen it by...' or 'Good instinct here - next time try...'`);
  }

  // Prospect website
  parts.push(`\n## PROSPECT WEBSITE
${formData.prospectUrl}

Use this to assess whether the BDM personalised the demo to this specific prospect's business, products, and situation.`);

  // SDR discovery call (if provided)
  if (formData.sdrTranscript.trim()) {
    parts.push(`\n## SDR DISCOVERY CALL
${formData.sdrTranscript}

If provided, check whether the BDM built on the SDR's discovery or missed information that was already gathered.`);
  } else {
    parts.push(`\n## SDR DISCOVERY CALL
No SDR call provided.`);
  }

  // Demo transcript
  parts.push(`\n## DEMO TRANSCRIPT TO ANALYSE
${formData.demoTranscript}

Analyse this demo and return the JSON response.`);

  return parts.join('\n');
}

function parseAnalysisResponse(text: string): AnalysisResult {
  // Try to extract JSON from the response
  // First, try to find a JSON block
  let jsonStr = text;

  // Remove markdown code blocks if present
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  // If no code block, try to find raw JSON object
  if (!jsonMatch) {
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      jsonStr = objectMatch[0];
    }
  }

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    if (typeof parsed.overallScore !== 'number') {
      throw new Error('Missing or invalid overallScore');
    }
    if (!Array.isArray(parsed.keyStrengths)) {
      throw new Error('Missing or invalid keyStrengths');
    }
    if (!Array.isArray(parsed.priorityImprovements)) {
      throw new Error('Missing or invalid priorityImprovements');
    }
    if (!Array.isArray(parsed.categories)) {
      throw new Error('Missing or invalid categories');
    }

    return parsed as AnalysisResult;
  } catch (error) {
    console.error('Failed to parse Claude response:', error);
    console.error('Raw response:', text);
    throw new Error('Failed to parse analysis response. Please try again.');
  }
}

export async function analyzeDemo(formData: FormState): Promise<AnalysisResult> {
  const client = getClient();
  const systemPrompt = buildSystemPrompt();
  const userMessage = buildUserMessage(formData);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  // Extract text content from response
  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response received from Claude');
  }

  return parseAnalysisResponse(textContent.text);
}
