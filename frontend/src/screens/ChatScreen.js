import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { connectChatSocket, fetchConversation, sendMessageRequest } from "../services/chatService";
import { showToast } from "../components/toast";
import { useAppTheme } from "../theme";

const formatTime = (value) =>
  new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const ChatScreen = ({ route }) => {
  const { colors, radius } = useAppTheme();
  const { token, currentUser, receiver } = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const flatListRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingAnim = useRef(new Animated.Value(0.4)).current;

  const upsertMessage = (incomingMessage) => {
    setMessages((prev) => {
      if (prev.some((item) => item._id === incomingMessage._id)) {
        return prev;
      }
      return [...prev, incomingMessage];
    });
  };

  const loadMessages = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const data = await fetchConversation(receiver._id);
      setMessages(data);
    } catch (error) {
      showToast({ type: "error", text1: "Chat load failed", text2: error.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMessages();
    const socket = connectChatSocket(token);
    socketRef.current = socket;

    socket.on("receiveMessage", (message) => {
      if (message.senderId?._id === receiver._id || message.senderId === receiver._id) {
        upsertMessage(message);
      }
    });

    socket.on("messageSent", upsertMessage);

    socket.on("typing", ({ userId }) => {
      if (userId === receiver._id) {
        setTyping(true);
      }
    });

    socket.on("stopTyping", ({ userId }) => {
      if (userId === receiver._id) {
        setTyping(false);
      }
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("messageSent", upsertMessage);
      socket.off("typing");
      socket.off("stopTyping");
      clearTimeout(typingTimeoutRef.current);
    };
  }, [receiver._id, token]);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages, typing]);

  useEffect(() => {
    if (!typing) {
      return undefined;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(typingAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(typingAnim, { toValue: 0.4, duration: 500, useNativeDriver: true }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [typing, typingAnim]);

  const handleTyping = (value) => {
    setText(value);

    if (!socketRef.current) {
      return;
    }

    socketRef.current.emit("typing", { receiverId: receiver._id });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("stopTyping", { receiverId: receiver._id });
    }, 900);
  };

  const handleSend = async () => {
    const message = text.trim();
    if (!message || sending) return;

    setSending(true);
    setText("");
    socketRef.current?.emit("stopTyping", { receiverId: receiver._id });

    try {
      const created = await sendMessageRequest({ receiverId: receiver._id, message });
      upsertMessage(created);
    } catch (error) {
      setText(message);
      showToast({ type: "error", text1: "Send failed", text2: error.message });
    } finally {
      setSending(false);
    }
  };

  const chatItems = useMemo(() => {
    if (!typing) return messages;
    return [...messages, { _id: "typing-indicator", isTyping: true }];
  }, [messages, typing]);

  const renderItem = ({ item }) => {
    if (item.isTyping) {
      return (
        <View style={styles.typingRow}>
          <Animated.View style={[styles.typingBubble, { backgroundColor: colors.surface, opacity: typingAnim }]}>
            <Text style={{ color: colors.textMuted }}>Typing...</Text>
          </Animated.View>
        </View>
      );
    }

    const senderId = item.senderId?._id || item.senderId;
    const isMine = senderId === currentUser._id;
    const profileImage = isMine ? currentUser.profileImage : receiver.profileImage;

    return (
      <View style={[styles.messageRow, { justifyContent: isMine ? "flex-end" : "flex-start" }]}>
        {!isMine ? <Image source={{ uri: profileImage || "https://ui-avatars.com/api/?name=User" }} style={styles.avatar} /> : null}
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isMine ? colors.bubbleMine : colors.bubbleOther,
              borderRadius: radius.lg,
            },
          ]}
        >
          <Text style={{ color: isMine ? "#fff" : colors.text, fontSize: 15 }}>{item.message}</Text>
          <Text style={[styles.timestamp, { color: isMine ? "rgba(255,255,255,0.75)" : colors.textMuted }]}>
            {formatTime(item.timestamp || item.createdAt)}
          </Text>
        </View>
        {isMine ? <Image source={{ uri: profileImage || "https://ui-avatars.com/api/?name=User" }} style={styles.avatar} /> : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Image source={{ uri: receiver.profileImage || "https://ui-avatars.com/api/?name=Chat" }} style={styles.headerAvatar} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{receiver.name}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{typing ? "Typing..." : receiver.role || "Resident"}</Text>
          </View>
          <Pressable onPress={() => loadMessages(false)}>
            <Icon name="refresh-outline" size={22} color={colors.textMuted} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={chatItems}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  loadMessages(false);
                }}
                tintColor={colors.primary}
              />
            }
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        <View style={[styles.composer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Pressable style={[styles.iconButton, { backgroundColor: colors.surfaceAlt }]}>
            <Icon name="happy-outline" size={22} color={colors.textMuted} />
          </Pressable>
          <TextInput
            value={text}
            onChangeText={handleTyping}
            placeholder="Type a message"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
            multiline
          />
          <Pressable onPress={handleSend} style={[styles.sendButton, { backgroundColor: colors.primary, opacity: sending ? 0.7 : 1 }]}>
            {sending ? <ActivityIndicator color="#fff" /> : <Icon name="send" size={18} color="#fff" />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  headerAvatar: { width: 46, height: 46, borderRadius: 23 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  listContent: { padding: 16, gap: 12 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  bubble: { maxWidth: "74%", paddingHorizontal: 14, paddingVertical: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  timestamp: { marginTop: 6, fontSize: 11, alignSelf: "flex-end" },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 50,
    maxHeight: 120,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 15,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  typingRow: { marginTop: 6, alignItems: "flex-start" },
  typingBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
});

export default ChatScreen;
