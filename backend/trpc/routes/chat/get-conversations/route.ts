import { publicProcedure } from "../../../create-context";

export const getConversationsProcedure = publicProcedure
  .query(() => {
    // Mock conversations data
    const conversations = [
      {
        id: "conv-1",
        title: "Getting Started with AI",
        lastMessage: "Hello! I'm Claude, an AI assistant...",
        timestamp: Date.now() - 3600000, // 1 hour ago
      },
      {
        id: "conv-2", 
        title: "Programming Help",
        lastMessage: "I'd be happy to help you with coding!",
        timestamp: Date.now() - 7200000, // 2 hours ago
      },
      {
        id: "conv-3",
        title: "Creative Writing",
        lastMessage: "Let's explore some creative writing techniques...",
        timestamp: Date.now() - 86400000, // 1 day ago
      },
    ];
    
    return {
      conversations: conversations.sort((a, b) => b.timestamp - a.timestamp),
    };
  });