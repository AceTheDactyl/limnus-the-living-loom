import { z } from "zod";
import { publicProcedure } from "../../../create-context";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.number().optional(),
});

const sendMessageSchema = z.object({
  conversationId: z.string(),
  message: z.string(),
  messages: z.array(messageSchema).optional(),
});

export const sendMessageProcedure = publicProcedure
  .input(sendMessageSchema)
  .mutation(async ({ input }) => {
    const { message, conversationId } = input;
    
    try {
      // Call the AI API for real streaming response
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are Claude, a helpful AI assistant created by Anthropic. Be conversational, helpful, and concise in your responses.'
            },
            {
              role: 'user',
              content: message
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage = {
        role: "assistant" as const,
        content: data.completion || generateFallbackResponse(message),
        timestamp: Date.now(),
      };
      
      return {
        success: true,
        message: assistantMessage,
        conversationId,
      };
    } catch (error) {
      console.error('AI API error:', error);
      
      // Fallback to mock response if AI API fails
      const assistantMessage = {
        role: "assistant" as const,
        content: generateFallbackResponse(message),
        timestamp: Date.now(),
      };
      
      return {
        success: true,
        message: assistantMessage,
        conversationId,
      };
    }
  });

function generateFallbackResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm Claude, an AI assistant created by Anthropic. I'm here to help you with a wide variety of tasks, from answering questions and providing explanations to helping with analysis, writing, math, coding, and creative projects. What would you like to explore together today?";
  }
  
  if (lowerMessage.includes('code') || lowerMessage.includes('programming')) {
    return "I'd be happy to help you with coding! I can assist with:\n\n• Writing code in various programming languages\n• Debugging and troubleshooting\n• Code review and optimization\n• Explaining programming concepts\n• Architecture and design patterns\n\nWhat specific programming challenge are you working on?";
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('assist')) {
    return "I'm here to help! I can assist you with:\n\n• Answering questions on a wide range of topics\n• Writing and editing\n• Analysis and research\n• Math and calculations\n• Creative projects\n• Problem-solving\n• Learning new concepts\n\nWhat would you like help with today?";
  }
  
  return `I understand you're asking about: "${userMessage}"\n\nI'm currently experiencing some connectivity issues with my main AI service, but I'm still here to help! This is a fallback response while I work to restore full functionality.\n\nPlease try your question again in a moment, or feel free to ask something else. I apologize for any inconvenience!`;
}