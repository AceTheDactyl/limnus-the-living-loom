import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";


export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    console.log('Using base URL:', process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  // For development without backend server, return a mock URL
  const fallbackUrl = 'http://localhost:3000';
  console.log('No EXPO_PUBLIC_RORK_API_BASE_URL found, using fallback:', fallbackUrl);
  return fallbackUrl;
};

// Mock data for when backend is not available
const mockConversations = [
  {
    id: 'conv-1',
    title: 'Welcome to Claude',
    lastMessage: 'Hello! How can I help you today?',
    timestamp: Date.now() - 3600000, // 1 hour ago
  },
  {
    id: 'conv-2',
    title: 'Creative Writing Help',
    lastMessage: 'I\'d be happy to help you with your creative writing project!',
    timestamp: Date.now() - 7200000, // 2 hours ago
  },
];

const mockMessages = {
  'conv-1': [
    {
      role: 'assistant' as const,
      content: 'Hello! How can I help you today?',
      timestamp: Date.now() - 3600000,
    },
  ],
  'conv-2': [
    {
      role: 'user' as const,
      content: 'Can you help me write a short story?',
      timestamp: Date.now() - 7200000,
    },
    {
      role: 'assistant' as const,
      content: 'I\'d be happy to help you with your creative writing project! What kind of story are you thinking about? What genre, setting, or theme interests you?',
      timestamp: Date.now() - 7199000,
    },
  ],
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (url, options) => {
        console.log('tRPC fetch:', url, options?.method || 'GET');
        
        try {
          const response = await fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              ...options?.headers,
            },
            // Add timeout
            signal: AbortSignal.timeout(5000), // 5 second timeout
          });
          
          console.log('tRPC response:', response.status);
          return response;
        } catch (error) {
          console.warn('Backend not available, using mock data:', error);
          
          // Parse the tRPC request to determine what mock data to return
          const body = options?.body ? JSON.parse(options.body as string) : null;
          const urlString = typeof url === 'string' ? url : url.toString();
          const path = new URL(urlString).pathname;
          
          // Mock responses for different tRPC procedures
          if (path.includes('getConversations')) {
            return new Response(JSON.stringify({
              result: {
                data: {
                  conversations: mockConversations
                }
              }
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          if (path.includes('getMessages') && body?.input?.conversationId) {
            const conversationId = body.input.conversationId;
            const messages = mockMessages[conversationId as keyof typeof mockMessages] || [];
            return new Response(JSON.stringify({
              result: {
                data: {
                  messages
                }
              }
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          if (path.includes('sendMessage') && body?.input) {
            // Simple mock AI response
            const responses = [
              "That's an interesting question! Let me think about that...",
              "I understand what you're asking. Here's my perspective on that topic.",
              "Great point! I'd be happy to help you explore this further.",
              "That's a thoughtful question. Let me provide some insights.",
              "I appreciate you sharing that with me. Here's what I think..."
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            
            return new Response(JSON.stringify({
              result: {
                data: {
                  success: true,
                  message: {
                    role: 'assistant',
                    content: randomResponse,
                    timestamp: Date.now()
                  }
                }
              }
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          // Default mock response
          return new Response(JSON.stringify({
            result: {
              data: {
                success: true,
                message: 'Mock response - backend not available'
              }
            }
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      },
    }),
  ],
});