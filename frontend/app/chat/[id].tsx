import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, IconButton, useTheme, ActivityIndicator, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { chatAPI, bookingsAPI } from '../../src/api/client';
import { useAuthStore } from '../../src/store/authStore';

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

export default function ChatScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id, type } = useLocalSearchParams<{ id: string; type: string }>();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatPartner, setChatPartner] = useState<string>('');

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [id, type]);

  const fetchMessages = async () => {
    try {
      const contextType = type || 'booking';
      const response = await chatAPI.getMessages(contextType, id);
      setMessages(response.data);
      
      // Set chat partner name
      if (response.data.length > 0) {
        const partnerMsg = response.data.find((m: Message) => m.sender_id !== user?.id);
        if (partnerMsg) {
          setChatPartner(partnerMsg.sender_name);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    setSending(true);
    try {
      const messageData: any = {
        content: newMessage.trim(),
      };
      
      if (type === 'request') {
        messageData.request_id = id;
      } else {
        messageData.booking_id = id;
      }
      
      await chatAPI.sendMessage(messageData);
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === user?.id;
    
    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}>
        {!isMe && (
          <Avatar.Text 
            size={32} 
            label={item.sender_name?.charAt(0) || '?'} 
            style={styles.avatar}
          />
        )}
        <View style={[
          styles.messageBubble,
          { backgroundColor: isMe ? theme.colors.primary : theme.colors.surfaceVariant }
        ]}>
          <Text style={{ color: isMe ? '#FFFFFF' : theme.colors.onSurface }}>
            {item.content}
          </Text>
          <Text style={[
            styles.timestamp,
            { color: isMe ? 'rgba(255,255,255,0.7)' : theme.colors.onSurfaceVariant }
          ]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.outline }]}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <View style={styles.headerInfo}>
          <Text variant="titleMedium" style={{ fontWeight: '600' }}>
            {chatPartner || 'Chat'}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {type === 'request' ? 'Private Request' : 'Booking'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                No messages yet. Start the conversation!
              </Text>
            </View>
          }
        />

        <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outline }]}>
          <TextInput
            mode="outlined"
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            style={styles.input}
            multiline
            maxLength={500}
          />
          <IconButton
            icon="send"
            mode="contained"
            onPress={handleSend}
            disabled={!newMessage.trim() || sending}
            loading={sending}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  theirMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    marginRight: 8,
    maxHeight: 100,
    backgroundColor: 'transparent',
  },
});
