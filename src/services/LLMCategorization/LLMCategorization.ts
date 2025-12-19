import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { env } from "../../lib/env";
import fewShotExamples from "./fewShotExamples.json";
import jsonSchema from "./jsonSchema.json";

const systemPrompt = fs.readFileSync(
  path.join(import.meta.dirname, "systemPrompt.md"),
  "utf-8"
);

const FOLDER_ID = "b1g1nd51355663ndo3mk";

const client = new OpenAI({
  apiKey: env.YANDEX_CLOUD_API_KEY,
  baseURL: "https://rest-assistant.api.cloud.yandex.net/v1",
  project: FOLDER_ID,
});

export async function LLMCategorizeExpense(message: string) {
  try {
    const response = await client.responses.create({
      model: `gpt://${FOLDER_ID}/yandexgpt-lite/latest`,
      instructions: systemPrompt,
      input: [
        ...fewShotExamples.map((ex) => ({
          role: ex.role as "user" | "assistant",
          content: ex.text,
        })),
        { role: "user" as const, content: message },
      ],
      text: {
        format: {
          type: "json_schema" as const,
          ...jsonSchema,
        },
      },
      temperature: 0,
    });

    const content = response.output_text;

    if (!content) {
      console.warn("Empty response content", response);
      return null;
    }

    try {
      const parsed = JSON.parse(content);
      return parsed as { amount: number; currency: string; category: string };
    } catch (e) {
      console.error("Failed to parse JSON response:", content);
      console.error(message);
      return null;
    }
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      console.error("API Error:", error.message, error.status);
    } else {
      console.error("Error:", error);
    }
    return null;
  }
}

// Тест
LLMCategorizeExpense("Купил продукты на 1500");
