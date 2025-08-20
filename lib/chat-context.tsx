import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpc } from '@/lib/trpc';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
}

export const [ChatProvider, useChat] = createContextHook(() => {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const conversationsQuery = trpc.chat.getConversations.useQuery();
  const messagesQuery = trpc.chat.getMessages.useQuery(
    { conversationId: currentConversationId! },
    { enabled: !!currentConversationId }
  );
  const sendMessageMutation = trpc.chat.sendMessage.useMutation();

  // Load current conversation from storage
  useEffect(() => {
    const loadCurrentConversation = async () => {
      try {
        const stored = await AsyncStorage.getItem('currentConversationId');
        if (stored) {
          setCurrentConversationId(stored);
        }
      } catch (error) {
        console.error('Failed to load current conversation:', error);
      }
    };
    loadCurrentConversation();
  }, []);

  // Update messages when conversation changes
  useEffect(() => {
    if (messagesQuery.data?.messages) {
      setMessages(messagesQuery.data.messages);
    }
  }, [messagesQuery.data]);

  // Save current conversation to storage
  useEffect(() => {
    if (currentConversationId) {
      AsyncStorage.setItem('currentConversationId', currentConversationId);
    }
  }, [currentConversationId]);

  const startNewConversation = useCallback(() => {
    const newConversationId = `conv-${Date.now()}`;
    setCurrentConversationId(newConversationId);
    setMessages([]);
  }, []);

  const selectConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isSending) return;

    console.log('Sending message:', content.trim());
    console.log('Current conversation ID:', currentConversationId);

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setIsSending(true);
    setIsStreaming(true);
    setStreamingMessage('');

    try {
      const conversationId = currentConversationId || `conv-${Date.now()}`;
      if (!currentConversationId) {
        setCurrentConversationId(conversationId);
      }

      console.log('Making tRPC call with:', { conversationId, message: content.trim() });

      // Simulate streaming effect for better UX
      const result = await sendMessageMutation.mutateAsync({
        conversationId,
        message: content.trim(),
        messages: [...messages, userMessage],
      });

      console.log('tRPC response:', result);

      if (result.success) {
        // Simulate typing effect
        const fullResponse = result.message.content;
        const words = fullResponse.split(' ');
        let currentText = '';
        
        for (let i = 0; i < words.length; i++) {
          currentText += (i > 0 ? ' ' : '') + words[i];
          setStreamingMessage(currentText);
          
          // Add realistic typing delay
          await new Promise(resolve => {
            streamingTimeoutRef.current = setTimeout(resolve, 50 + Math.random() * 100);
          });
        }
        
        // Add the complete message
        setMessages(prev => [...prev, result.message]);
        setStreamingMessage('');
        setIsStreaming(false);
        
        // Refetch conversations to update the list
        conversationsQuery.refetch();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      console.error('Error details:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        cause: (error as any)?.cause,
        stack: (error as any)?.stack
      });
      
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1));
      setStreamingMessage('');
      setIsStreaming(false);
      
      // Create a more user-friendly error message
      const errorMessage = (error as any)?.message || 'Unknown error';
      const friendlyError = new Error(
        errorMessage.includes('Failed to fetch') 
          ? 'Unable to connect to the server. Please check your internet connection and try again.'
          : `Failed to send message: ${errorMessage}`
      );
      
      throw friendlyError;
    } finally {
      setIsSending(false);
    }
  }, [currentConversationId, messages, sendMessageMutation, conversationsQuery, isSending]);

  // Cleanup streaming timeout on unmount
  useEffect(() => {
    return () => {
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
      }
    };
  }, []);

  return useMemo(() => ({
    // State
    currentConversationId,
    messages,
    conversations: conversationsQuery.data?.conversations || [],
    isLoading: conversationsQuery.isLoading || messagesQuery.isLoading,
    isSending,
    streamingMessage,
    isStreaming,
    
    // Actions
    startNewConversation,
    selectConversation,
    sendMessage,
    
    // Queries
    refetchConversations: conversationsQuery.refetch,
    refetchMessages: messagesQuery.refetch,
  }), [
    currentConversationId,
    messages,
    conversationsQuery.data?.conversations,
    conversationsQuery.isLoading,
    messagesQuery.isLoading,
    isSending,
    streamingMessage,
    isStreaming,
    startNewConversation,
    selectConversation,
    sendMessage,
    conversationsQuery.refetch,
    messagesQuery.refetch,
  ]);
});