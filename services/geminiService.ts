
import { GoogleGenerativeAI, GenerateContentResult } from "@google/generative-ai";

class GeminiService {
  private ai: GoogleGenerativeAI | null = null;
  private modelId = "gemini-pro";

  constructor() {
    // Safely attempt to initialize. If API_KEY is missing, specific methods will throw later.
    try {
      const apiKey = process.env.API_KEY;
      if (apiKey) {
        this.ai = new GoogleGenerativeAI(apiKey);
      } else {
        console.warn("Gemini API Key is missing. AI features will not work.");
      }
    } catch (e) {
      console.error("Failed to initialize Gemini Client", e);
    }
  }

  private getModel(systemInstruction?: string) {
    if (!this.ai) {
      throw new Error("API Key not found. Please provide a valid API Key in the environment.");
    }
    return this.ai.getGenerativeModel({
      model: this.modelId,
      ...(systemInstruction && { systemInstruction })
    });
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        if (!res) {
            reject(new Error("Failed to read file"));
            return;
        }
        // res is "data:mime;base64,..."
        const base64 = res.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async prepareContent(content: string | File, promptText: string): Promise<any[]> {
    const parts: any[] = [{ text: promptText }];

    if (content instanceof File) {
        // Handle PDF and Images via inlineData
        if (content.type === 'application/pdf' || content.type.startsWith('image/')) {
            try {
                const base64 = await this.fileToBase64(content);
                parts.push({
                    inlineData: {
                        mimeType: content.type,
                        data: base64
                    }
                });
            } catch (e) {
                console.error("File processing error", e);
                parts.push({ text: `[Error reading file: ${content.name}]` });
            }
        } else {
             // Fallback for DOCX/PPT/Text files that we can't natively parse in browser easily without a library.
             // We treat them as text if possible, or give a system hint.
             // For this demo, we'll try to read text if it's not binary, otherwise specific prompt.
             parts.push({ text: `[System Note: The user uploaded a file named "${content.name}" (${content.type}). Please analyze this topic conceptually based on the filename and context, as I cannot read the binary content directly in this demo environment.]` });
        }
    } else {
        parts.push({ text: content });
    }
    return parts;
  }

  async summarizeContent(content: string | File): Promise<string> {
    try {
      const prompt = `Summarize the following document/content into clear, concise bullet points suitable for a student study guide. Highlight key terms in bold.`;
      const contents = await this.prepareContent(content, prompt);

      const response: GenerateContentResult = await this.getModel().generateContent(contents);

      return response.response.text() || "Could not generate summary.";
    } catch (error) {
      console.error("Gemini Summarize Error:", error);
      return "Error generating summary. Please check your API key and file format.";
    }
  }

  async extractDates(content: string | File): Promise<string> {
    try {
      const prompt = `Extract all important dates, deadlines, and exam schedules from the provided content. Format them as a JSON list of objects with 'date', 'event', and 'importance' (High/Medium/Low). Return ONLY the raw JSON string, no markdown formatting.`;
      const parts = await this.prepareContent(content, prompt);

      const response: GenerateContentResult = await this.getModel().generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig: { responseMimeType: 'application/json' }
      });

      let text = response.response.text() || "[]";
      // Clean up markdown code blocks if present
      text = text.replace(/```json\n?|\n?```/g, "").trim();
      return text;
    } catch (error) {
      console.error("Gemini Date Extraction Error:", error);
      return "[]";
    }
  }

  async generateQuiz(content: string | File): Promise<string> {
    try {
      const prompt = `Create 3 multiple choice questions based on the provided content to test student understanding. Return valid JSON array where each object has 'question', 'options' (array of 4 strings), and 'answer' (index of correct option 0-3).`;
      const parts = await this.prepareContent(content, prompt);

      const response: GenerateContentResult = await this.getModel().generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig: { responseMimeType: 'application/json' }
      });

      let text = response.response.text() || "[]";
      // Clean up markdown code blocks if present
      text = text.replace(/```json\n?|\n?```/g, "").trim();
      return text;
    } catch (error) {
      console.error("Gemini Quiz Gen Error:", error);
      return "[]";
    }
  }

  async chat(message: string, history: { role: string; parts: { text: string }[] }[], contextInstruction?: string): Promise<string> {
    try {
      const systemInstruction = contextInstruction
        ? `You are an intelligent LMS assistant. ${contextInstruction}`
        : "You are an intelligent, helpful, and encouraging teaching assistant for a university LMS. Answer questions concisely and help clarify complex topics.";

      const model = this.getModel(systemInstruction);
      const chat = model.startChat({
        history: history
      });

      const response = await chat.sendMessage(message);
      return response.response.text() || "I didn't understand that.";
    } catch (error) {
       console.error("Gemini Chat Error:", error);
       return "I am having trouble connecting to the AI service right now. Please try again later.";
    }
  }
}

export const geminiService = new GeminiService();
