import { z } from "zod";
import { publicProcedure } from "../../../create-context";

const getMessagesSchema = z.object({
  conversationId: z.string(),
});

export const getMessagesProcedure = publicProcedure
  .input(getMessagesSchema)
  .query(({ input }) => {
    const { conversationId } = input;
    
    // Mock messages data based on conversation ID
    const mockMessages = {
      "conv-1": [
        {
          role: "user" as const,
          content: "Hello! Can you tell me about yourself?",
          timestamp: Date.now() - 3600000,
        },
        {
          role: "assistant" as const,
          content: "Hello! I'm Claude, an AI assistant created by Anthropic. I'm here to help you with a wide variety of tasks, from answering questions and providing explanations to helping with analysis, writing, math, coding, and creative projects. What would you like to explore together today?",
          timestamp: Date.now() - 3590000,
        },
      ],
      "conv-2": [
        {
          role: "user" as const,
          content: "I need help with React Native development",
          timestamp: Date.now() - 7200000,
        },
        {
          role: "assistant" as const,
          content: "I'd be happy to help you with React Native development! I can assist with:\n\n• Component architecture and best practices\n• Navigation setup with Expo Router\n• State management patterns\n• Performance optimization\n• Platform-specific code\n• Debugging common issues\n\nWhat specific aspect of React Native development are you working on?",
          timestamp: Date.now() - 7190000,
        },
      ],
      "conv-3": [
        {
          role: "user" as const,
          content: "Can you help me write a short story?",
          timestamp: Date.now() - 86400000,
        },
        {
          role: "assistant" as const,
          content: "I'd love to help you write a short story! Let's explore some creative writing techniques together.\n\nTo get started, let's think about:\n• Genre and tone\n• Main character and their motivation\n• Setting and time period\n• Central conflict or challenge\n• The message or theme you want to convey\n\nWhat kind of story are you envisioning? Do you have any initial ideas or preferences for genre, characters, or setting?",
          timestamp: Date.now() - 86390000,
        },
      ],
    };
    
    return {
      messages: mockMessages[conversationId as keyof typeof mockMessages] || [],
    };
  });