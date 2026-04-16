import { io } from "socket.io-client";
import { api, API_BASE_URL } from "./api";

const socketBaseUrl = API_BASE_URL.replace(/\/api\/?$/, "");

let socket;

export const connectChatSocket = (token) => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(socketBaseUrl, {
    transports: ["websocket"],
    auth: { token },
  });

  return socket;
};

export const disconnectChatSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = undefined;
  }
};

export const fetchConversation = async (receiverId) => {
  const { data } = await api.get(`/messages/${receiverId}`);
  return data.data || [];
};

export const sendMessageRequest = async (payload) => {
  const { data } = await api.post("/messages", payload);
  return data.data;
};
