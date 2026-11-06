import axiosInstance from "./axiosinstance";
import {
  getChatConversations,
  getChatMessages,
  sendChatMessage,
  reactChatMessage,
  markChatRead,
  getChatMembers,
  createChatTeam,
  createChatChannel,
  startChatDm,
  uploadChatFile,
  deleteChatConversation,
  getActiveUsersLightUrl,
} from "../api/api";

// Reads the logged-in user's uuid from the JWT ("Uuid" claim)
const getMyUuid = () => {
  try {
    const token = localStorage.getItem("authToken");
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return String(JSON.parse(atob(payload)).Uuid ?? "");
  } catch {
    return "";
  }
};

const toPerson = (p = {}) => ({
  uuid: String(p.uuid ?? p.employee_uuid ?? p.employee_id ?? p.id ?? ""),
  name: p.name ?? p.employee_name ?? "",
  image: p.image ?? p.image_url ?? "",
});

const toConversation = (c) => {
  const type = String(c.type ?? c.kind ?? "").toLowerCase();
  const kind =
    type === "direct" || type === "dm"
      ? "dm"
      : type === "team"
        ? "team"
        : "channel";

  const members = (c.participants ?? c.members ?? []).map(toPerson);
  const me = getMyUuid();

  // in a DM, the peer is the participant who is not you
  const peer =
    kind === "dm"
      ? (members.find((m) => m.uuid !== me) ?? members[0] ?? toPerson({}))
      : undefined;

  return {
    id: String(c.id),
    kind,
    name: kind === "dm" ? peer.name : (c.name ?? ""),
    topic: c.topic ?? c.description ?? "",
    private: Boolean(c.is_private ?? c.private),
    members,
    peer,
    unread: Number(c.unread_count ?? c.unread ?? 0),
    messages: [],
    loaded: false,
    loading: false,
  };
};

const toMessage = (m) => ({
  id: String(m.id),
  sender: toPerson(
    m.sender ?? {
      uuid: m.sender_uuid ?? m.sender_id ?? m.employee_id,
      name: m.sender_name,
      image: m.sender_image ?? m.sender_image_url,
    },
  ),
  text: m.text ?? m.message ?? m.content ?? "",
  createdAt: m.created_at ?? m.createdAt ?? null,
  file: m.file
    ? { name: m.file.name, size: m.file.size, url: m.file.url }
    : null,
  reactions: (m.reactions ?? []).map((r) => ({
    e: r.emoji ?? r.e,
    n: Number(r.count ?? r.n ?? 0),
    mine: Boolean(r.mine ?? r.reacted_by_me),
  })),
  replies: Number(m.reply_count ?? m.replies ?? 0),
});

const chatService = {
  // GET conversations list
  fetchConversations: async () => {
    try {
      const response = await axiosInstance.get(getChatConversations);
      console.log("Conversations fetched:", response.data);

      const list = response.data?.data ?? response.data;
      return Array.isArray(list) ? list.map(toConversation) : [];
    } catch (error) {
      console.error(
        "Error fetching conversations:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // GET messages of one conversation
  fetchMessages: async (conversationId, params = {}) => {
    try {
      const response = await axiosInstance.get(
        getChatMessages(conversationId),
        { params },
      );
      console.log(`Messages fetched for #${conversationId}:`, response.data);

      const list = response.data?.data ?? response.data;
      // oldest first, so the newest message is at the bottom
      return (Array.isArray(list) ? list.map(toMessage) : []).sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      );
    } catch (error) {
      console.error(
        `Error fetching messages of conversation #${conversationId}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // POST /employee/chat/{conversation_id}/messages
  // body: { content, reply_to_id }  (reply_to_id = null for a free message)
  sendMessage: async (conversationId, { text, replyToId = null }) => {
    try {
      const response = await axiosInstance.post(
        sendChatMessage(conversationId),
        { content: text, reply_to_id: replyToId },
        { silent: true },
      );

      const saved = response.data?.data;
      return saved?.id != null ? toMessage(saved) : null;
    } catch (error) {
      console.error(
        `Error sending message to conversation #${conversationId}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // POST a reaction (same emoji again removes it)
  toggleReaction: async (messageId, emoji) => {
    try {
      const response = await axiosInstance.post(
        reactChatMessage(messageId),
        { emoji },
        { silent: true },
      );
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error(
        `Error reacting to message #${messageId}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // PATCH conversation as read
  markRead: async (conversationId) => {
    try {
      const response = await axiosInstance.patch(
        markChatRead(conversationId),
        null,
        { silent: true },
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error marking conversation #${conversationId} as read:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // GET members of a conversation
  fetchMembers: async (conversationId) => {
    try {
      const response = await axiosInstance.get(getChatMembers(conversationId));
      console.log(`Members fetched for #${conversationId}:`, response.data);

      const list = response.data?.data ?? response.data;
      return Array.isArray(list) ? list.map(toPerson) : [];
    } catch (error) {
      console.error(
        `Error fetching members of conversation #${conversationId}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // POST create team
  createTeam: async (teamData) => {
    try {
      const response = await axiosInstance.post(createChatTeam, teamData);
      console.log("Team created:", response.data);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error(
        "Error creating team:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // POST create channel
  createChannel: async (channelData) => {
    try {
      const response = await axiosInstance.post(createChatChannel, channelData);
      console.log("Channel created:", response.data);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error(
        "Error creating channel:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // GET /staff/get-active-users-light
  // Returns: [{ uuid, name, image, department, designation, online }]
  fetchTeammates: async () => {
    try {
      const response = await axiosInstance.get(getActiveUsersLightUrl);
      const list = response.data?.data ?? [];

      return (Array.isArray(list) ? list : [])
        .filter((u) => u.uuid)
        .map((u) => ({
          uuid: String(u.uuid),
          name: u.name || "",
          image: u.image || "",
          department: u.department_name || "",
          designation: u.designation_name || "",
          online: Boolean(u.is_online),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error(
        "Error fetching teammates:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // POST /employee/chat/direct   body: { employee_uuid }
  startDirectChat: async (employeeUuid) => {
    try {
      const response = await axiosInstance.post(
        startChatDm,
        { employee_uuid: String(employeeUuid) },
        { silent: true },
      );
      console.log("Direct chat started:", response.data);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error(
        `Error starting direct chat with ${employeeUuid}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // DELETE /employee/chat/{conversation_id}
  // Deletes the whole conversation along with its attachments. No body.
  deleteConversation: async (conversationId) => {
    try {
      const response = await axiosInstance.delete(
        deleteChatConversation(conversationId),
      );
      console.log(`Conversation #${conversationId} deleted:`, response.data);
      return response.data;
    } catch (error) {
      console.error(
        `Error deleting conversation #${conversationId}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // POST upload a file (multipart/form-data)
  uploadFile: async (file) => {
    try {
      const body = new FormData();
      body.append("file", file);

      const response = await axiosInstance.post(uploadChatFile, body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Chat file uploaded:", response.data);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error(
        "Error uploading chat file:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },
};

chatService.toMessage = toMessage;

export { toMessage };
export default chatService;
