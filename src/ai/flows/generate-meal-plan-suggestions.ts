'use server';

/**
 * @fileOverview AI-powered meal plan suggestion generator for nutritionists.
 *
 * - generateMealPlanSuggestions - A function that generates meal plan suggestions for a patient, based on their food log and goals.
 * - GenerateMealPlanSuggestionsInput - The input type for the generateMealPlanSuggestions function.
 * - GenerateMealPlanSuggestionsOutput - The return type for the generateMealPlanSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMealPlanSuggestionsInputSchema = z.object({
  patientId: z.string().describe('The ID of the patient to generate a meal plan for.'),
  patientFoodLog: z.string().describe('A summary of the patient\'s food log.'),
  patientGoals: z.string().describe('A summary of the patient\'s goals (weight loss, muscle gain, etc.).'),
});
export type GenerateMealPlanSuggestionsInput = z.infer<typeof GenerateMealPlanSuggestionsInputSchema>;

const GenerateMealPlanSuggestionsOutputSchema = z.object({
  mealPlanSuggestions: z.string().describe('Meal plan suggestions, taking into account foods previously eaten and goals previously set.'),
});
export type GenerateMealPlanSuggestionsOutput = z.infer<typeof GenerateMealPlanSuggestionsOutputSchema>;

export async function generateMealPlanSuggestions(input: GenerateMealPlanSuggestionsInput): Promise<GenerateMealPlanSuggestionsOutput> {
  return generateMealPlanSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMealPlanSuggestionsPrompt',
  input: {schema: GenerateMealPlanSuggestionsInputSchema},
  output: {schema: GenerateMealPlanSuggestionsOutputSchema},
  prompt: `You are a nutritionist helping another nutritionist generate meal plan suggestions for their patient.

  The patient's food log:
  {{patientFoodLog}}

  The patient's goals:
  {{patientGoals}}

  Please generate meal plan suggestions, taking into account foods previously eaten and goals previously set.
  Be creative and suggest meals that the patient will enjoy.
  Format your suggestions as a bulleted list.
  `,
});

const generateMealPlanSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateMealPlanSuggestionsFlow',
    inputSchema: GenerateMealPlanSuggestionsInputSchema,
    outputSchema: GenerateMealPlanSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
