import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { FoodAnalysis, TrafficLight, WeeklyStats, AIReport, RouteRecommendation, ActivityOpportunity } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const foodAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    foodName: { type: Type.STRING, description: "The name of the main dish or food item in Chinese." },
    totalCalories: { type: Type.NUMBER, description: "Estimated total calories." },
    trafficLight: { 
      type: Type.STRING, 
      enum: [TrafficLight.GREEN, TrafficLight.YELLOW, TrafficLight.RED],
      description: "Health rating based on calories, sugar, and fat."
    },
    components: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Component name in Chinese." },
          calories: { type: Type.NUMBER },
          weight_g: { type: Type.NUMBER, description: "Estimated weight in grams." }
        }
      }
    },
    advice: { type: Type.STRING, description: "Short nutritional advice in Chinese." },
    suggestion: { type: Type.STRING, description: "A healthier alternative suggestion if the food is unhealthy, or a compliment if healthy. In Chinese." }
  },
  required: ["foodName", "totalCalories", "trafficLight", "components", "advice"]
};

const reportSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    healthScore: { type: Type.NUMBER, description: "0-100 score based on performance." },
    summary: { type: Type.STRING, description: "Brief summary of the week in Chinese." },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of positive habits observed in Chinese." },
    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of areas for improvement in Chinese." },
    prediction: { type: Type.STRING, description: "Prediction of future weight/health trend in Chinese." },
    advice: { type: Type.STRING, description: "Actionable advice for next week in Chinese." }
  },
  required: ["healthScore", "summary", "strengths", "weaknesses", "prediction", "advice"]
};

const routeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    routeName: { type: Type.STRING, description: "Creative name for the route in Chinese." },
    description: { type: Type.STRING, description: "Short description of the path in Chinese." },
    reason: { type: Type.STRING, description: "Why this route is chosen (e.g. Incline, Scenery) in Chinese." },
    estimatedCalories: { type: Type.NUMBER, description: "Estimated burn for 15 mins." },
    difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
    audioPrompt: { type: Type.STRING, description: "A warm, encouraging sentence describing the route to the user, suitable for TTS, in Chinese." }
  },
  required: ["routeName", "description", "reason", "estimatedCalories", "difficulty", "audioPrompt"]
};

const activityOppSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    opportunities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ['STAIRS', 'ELEVATOR', 'PATH', 'DESK', 'EQUIPMENT', 'OTHER'] },
          label: { type: Type.STRING, description: "Short label e.g. '走楼梯' in Chinese" },
          calorieDiff: { type: Type.NUMBER, description: "Positive for burn, negative for lazy choice." },
          x: { type: Type.NUMBER, description: "Approx x position 0-100" },
          y: { type: Type.NUMBER, description: "Approx y position 0-100" },
          description: { type: Type.STRING, description: "Short reasoning in Chinese" }
        }
      }
    }
  }
};

export const analyzeFoodImage = async (base64Image: string): Promise<FoodAnalysis> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: `Identify the food item and estimate calories.
          Output JSON with fields:
          - foodName (string, in Chinese)
          - totalCalories (number)
          - trafficLight (enum: GREEN, YELLOW, RED) based on healthiness
          - components (array of {name (in Chinese), calories, weight_g})
          - advice (string, nutritional advice in Chinese)
          - suggestion (string, healthier alternative or compliment in Chinese)
          ` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: foodAnalysisSchema,
      }
    });

    if (response.text) return JSON.parse(response.text) as FoodAnalysis;
    throw new Error("No analysis generated");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const generateHealthReport = async (stats: WeeklyStats): Promise<AIReport> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a health report based on this weekly data: ${JSON.stringify(stats)}.
      Output JSON in Chinese.
      - healthScore (0-100)
      - summary (Brief summary in Chinese)
      - strengths (List of strings in Chinese)
      - weaknesses (List of strings in Chinese)
      - prediction (Prediction in Chinese)
      - advice (Actionable advice in Chinese)`,
      config: { responseMimeType: "application/json", responseSchema: reportSchema }
    });
    if (response.text) return JSON.parse(response.text) as AIReport;
    throw new Error("Report failed");
  } catch (error) { throw error; }
}

export const getRouteRecommendation = async (lat: number, lng: number): Promise<RouteRecommendation> => {
    try {
        const now = new Date();
        const hour = now.getHours();
        const timeContext = hour < 11 ? "morning" : hour < 17 ? "afternoon" : "evening";
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `The user is at coordinates ${lat}, ${lng} during the ${timeContext}. 
            Suggest a creative exercise route. 
            Output JSON with routeName (Chinese), description (Chinese), reason (Chinese), estimatedCalories, difficulty, and audioPrompt (Chinese).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: routeSchema
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as RouteRecommendation;
        }
        throw new Error("Route gen failed");
    } catch (e) {
        // Fallback
        return {
            routeName: "城市探险者小径",
            description: "沿着当前道路直行，寻找最近的绿化带或公园入口。",
            reason: "光线充足，适合快走",
            estimatedCalories: 120,
            difficulty: "Easy",
            audioPrompt: "为您推荐城市探险者小径，沿着这条路走，光线充足，非常适合现在出发。"
        };
    }
}

export const analyzeEnvironmentForActivity = async (base64Image: string): Promise<ActivityOpportunity[]> => {
    try {
        const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
                    { text: `Identify physical activity opportunities or sedentary traps in this image.
                    Look for Stairs (vs Elevators), Standing Desks, Walking paths, Gym equipment.
                    Estimate their screen coordinates (0-100).
                    If Stairs are found, calorieDiff is positive. If Elevator/Escalator, calorieDiff is negative (opportunity cost).
                    Output JSON with label (in Chinese) and description (in Chinese).` }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: activityOppSchema
            }
        });

        if (response.text) {
            const data = JSON.parse(response.text);
            return data.opportunities || [];
        }
        return [];
    } catch (e) {
        console.error("Env analysis failed", e);
        return [];
    }
}

export const generateSpeech = async (text: string): Promise<ArrayBuffer> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: { parts: [{ text: text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                }
            }
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data returned");
        
        // Decode base64 to ArrayBuffer
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    } catch (e) {
        console.error("TTS generation failed", e);
        throw e;
    }
}

export const getContextualTip = async (locationType: string, timeOfDay: string): Promise<string> => {
    // Legacy support
    return "保持健康，多喝水！";
};