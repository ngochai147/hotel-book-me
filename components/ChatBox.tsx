import { ArrowLeft, MessageCircle, Paperclip, Send, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

type Message = {
  id: number;
  text: string;
  isUser: boolean;
  time: string;
};

// Using Gemini API (FREE) - Get your key at: https://makersuite.google.com/app/apikey
const GEMINI_API_KEY = 'AIzaSyBaXgBFyN4Lvx3r7gqH4morfDIaNCT_ozE'; // Replace with your Gemini API key

const quickTopics = [
  'How to change payment method?',
  "Why I can't reschedule my booking",
  'How can I request for early check in?',
];

export default function ChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (isOpen) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen]);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    setShowWelcome(false);

    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      text: messageText,
      isUser: true,
      time: getCurrentTime(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Auto scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Call Gemini API (Google's Free AI) - Using latest Gemini 1.5 Flash
        const res = await fetch('https://generativelanguage.googleapis.com/v1/models?key=' + encodeURIComponent(GEMINI_API_KEY), {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            // một số khách hàng cần header x-goog-api-key thay cho query param
            'x-goog-api-key': GEMINI_API_KEY,
        },
        });
        const json = await res.json();
        console.log('available models:', json);

      const data = await res.json();
      
      console.log('Gemini API Response Status:', res.status);
      console.log('Gemini API Response Data:', data);

      // Check for API errors
      if (!res.ok) {
        if (data.error) {
          console.error('Gemini API Error:', data.error.message);
          throw new Error(data.error.message || 'API request failed');
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const botResponse = data.candidates[0].content.parts[0].text;
        const botMessage: Message = {
          id: Date.now() + 1,
          text: botResponse,
          isUser: false,
          time: getCurrentTime(),
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        console.error('Invalid API response structure:', data);
        throw new Error('Invalid response from API');
      }
    } catch (error: any) {
      console.error('Error calling Gemini API:', error);
      console.error('Error details:', error.message);
      
      // Fallback to local response
      const botResponse = getBotResponse(messageText);
      const botMessage: Message = {
        id: Date.now() + 1,
        text: botResponse,
        isUser: false,
        time: getCurrentTime(),
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
      // Auto scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const getBotResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('payment')) {
      return "Hello! I'm here to assist you. What issue are you experiencing with your booking?\n\nI'm sorry to hear that! Can you please check the following:\n1. Ensure your payment are correct.\n2. Verify that your card has sufficient funds.\n3. Try using a different payment method.\n\nIf the issue persists, let me know, and I can assist you with other alternative.";
    } else if (lowerMessage.includes('reschedule') || lowerMessage.includes('booking')) {
      return "I understand you need to reschedule your booking. To help you with this:\n\n1. Go to your Bookings tab\n2. Select the booking you want to reschedule\n3. Tap on 'Reschedule' option\n4. Choose your new dates\n\nPlease note: Rescheduling is subject to availability and hotel policies. Some bookings may have rescheduling fees.";
    } else if (lowerMessage.includes('check in') || lowerMessage.includes('check-in')) {
      return "For early check-in requests:\n\n1. Contact the hotel directly through your booking details\n2. Call our customer support at +1-800-HOTEL\n3. Early check-in is subject to availability\n4. Additional charges may apply\n\nWould you like me to connect you with the hotel directly?";
    } else {
      return "Hello! I'm here to assist you. What issue are you experiencing with your booking?\n\nYou can ask me about:\n• Payment issues\n• Rescheduling bookings\n• Early check-in requests\n• Cancellation policies\n• Hotel amenities\n\nHow can I help you today?";
    }
  };

  const handleQuickTopic = (topic: string) => {
    handleSendMessage(topic);
  };

  const handleChatWithCS = () => {
    setShowWelcome(false);
    const message: Message = {
      id: Date.now(),
      text: "Connecting you to our customer service team...",
      isUser: false,
      time: getCurrentTime(),
    };
    setMessages([message]);
    
    setTimeout(() => {
      const csMessage: Message = {
        id: Date.now() + 1,
        text: "A customer service representative will be with you shortly. Average wait time: 2-3 minutes.",
        isUser: false,
        time: getCurrentTime(),
      };
      setMessages(prev => [...prev, csMessage]);
    }, 1500);
  };

  if (!isOpen) {
    return (
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <MessageCircle size={28} color="white" />
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View
      style={[
        styles.chatContainer,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.backButton}>
            <ArrowLeft size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Live Chat</Text>
          <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeButton}>
            <X size={24} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

        {/* Messages Area */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {showWelcome ? (
            <View style={styles.welcomeContainer}>
              {/* Bot Avatar */}
              <View style={styles.botAvatarContainer}>
                <View style={styles.botAvatar}>
                  <MessageCircle size={32} color="#17A2B8" />
                </View>
              </View>

              {/* Welcome Message */}
              <Text style={styles.botName}>Hello! My name is Bookie</Text>
              <Text style={styles.welcomeText}>
                I'm here and ready to help you with.{'\n'}How can I assist you today?
              </Text>

              {/* Quick Topics */}
              <View style={styles.topicsContainer}>
                <Text style={styles.topicsTitle}>Select topic that you want to ask</Text>
                <Text style={styles.topicsSubtitle}>
                  You can select a topic from the options below, or start a chat with our customer
                  service team.
                </Text>

                <View style={styles.topicsList}>
                  {quickTopics.map((topic, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.topicItem}
                      onPress={() => handleQuickTopic(topic)}
                    >
                      <Text style={styles.topicText}>{topic}</Text>
                      <Text style={styles.topicArrow}>›</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.csButton} onPress={handleChatWithCS}>
                  <MessageCircle size={18} color="white" />
                  <Text style={styles.csButtonText}>Chat with CS</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.timestamp}>{getCurrentTime()}</Text>
            </View>
          ) : (
            <>
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    message.isUser ? styles.userBubble : styles.botBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      message.isUser ? styles.userText : styles.botText,
                    ]}
                  >
                    {message.text}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      message.isUser ? styles.userTime : styles.botTime,
                    ]}
                  >
                    {message.time}
                  </Text>
                </View>
              ))}
            </>
          )}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingBubble}>
                <View style={styles.typingIndicator}>
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Paperclip size={20} color="#999" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Write a message..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.sendButton, inputText.trim() && !isLoading && styles.sendButtonActive]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
          >
            <Send size={20} color={inputText.trim() && !isLoading ? '#17A2B8' : '#999'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#17A2B8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  chatContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    zIndex: 1001,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  welcomeContainer: {
    alignItems: 'center',
  },
  botAvatarContainer: {
    marginBottom: 20,
  },
  botAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  topicsContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topicsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  topicsSubtitle: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 16,
  },
  topicsList: {
    marginBottom: 16,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  topicText: {
    fontSize: 13,
    color: '#1a1a1a',
    flex: 1,
  },
  topicArrow: {
    fontSize: 20,
    color: '#999',
    marginLeft: 8,
  },
  csButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#17A2B8',
    paddingVertical: 12,
    borderRadius: 24,
  },
  csButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 16,
  },
  messageBubble: {
    maxWidth: '75%',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#17A2B8',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  userText: {
    color: 'white',
  },
  botText: {
    color: '#1a1a1a',
  },
  messageTime: {
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  userTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  botTime: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    color: '#1a1a1a',
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    // Active state can be used for animation
  },
  loadingContainer: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  loadingBubble: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
  },
});
