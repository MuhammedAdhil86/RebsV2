import axiosInstance from "./axiosinstance";
import {
  getChatConversations,
  getChatMessages,
  sendChatMessage,
  sendChatAttachment,
  getChatMembers,
  createChatDepartment,
  createChatChannel,
  startChatDm,
  deleteChatMessages,
  deleteChatConversation,
  getActiveUsersLightUrl,
  // ---- new chat endpoints (add these to api.js) ----
  markChatDelivered,
  markChatReadUpTo,
  getChatMediaCounts,
  getChatMedia,
  addChatReaction,
  removeChatReaction,
  addChatParticipants,
  removeChatParticipants,
  pinChatMessage,
  unpinChatMessage,
  getChatPins,
} from "../api/api";

// Public base for files. Attachment "url" values are storage paths like
// "REBS/100524_chat_document.pdf", so the base is put in front of them.
const MEDIA_BASE_URL = "https://rebs.blr1.digitaloceanspaces.com/";

const fullUrl = (path) => {
  if (!path) return "";
  if (/^(https?:|blob:|data:)/i.test(path)) return path; // already complete
  return `${MEDIA_BASE_URL}${String(path).replace(/^\/+/, "")}`.replace(
    / /g,
    "%20",
  );
};

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

// Attachment API shape: attachments: [{ id, file_name, url, mime_type, file_size }]
// Falls back to the older single `file` shape.
const toFile = (m) => {
  const a = Array.isArray(m.attachments) ? m.attachments[0] : null;
  if (a) {
    return {
      name: a.file_name,
      size: a.file_size,
      url: fullUrl(a.url),
      mime: a.mime_type,
    };
  }
  return m.file
    ? {
        name: m.file.name,
        size: m.file.size,
        url: fullUrl(m.file.url),
        mime: m.file.mime,
      }
    : null;
};

// The API sends only `reply_to_id`. The quote text and sender name are
// filled in by ChatViewer from the loaded messages.
const toReplyTo = (m) => {
  const raw = m.reply_to ?? null;
  const id = raw?.id ?? m.reply_to_id ?? null;
  if (id == null) return null;
  return {
    id: String(id),
    text: raw?.content ?? raw?.text ?? "",
    senderName: raw?.sender_name ?? raw?.sender?.name ?? "",
  };
};

// Reactions: [{ emoji, count, reacted_by_me, users: [{ employee_id, name }] }]
// "mine" is worked out from users[] for THIS client. reacted_by_me inside a
// WebSocket event is relative to the sender, so it is only a fallback.
const toReactions = (list = []) => {
  const me = getMyUuid();
  return (Array.isArray(list) ? list : []).map((r) => {
    const users = (r.users ?? []).map((u) => ({
      uuid: String(u.employee_id ?? u.uuid ?? ""),
      name: u.name ?? "",
    }));
    return {
      e: r.emoji ?? r.e,
      n: Number(r.count ?? r.n ?? users.length ?? 0),
      mine: users.length
        ? users.some((u) => u.uuid === me)
        : Boolean(r.mine ?? r.reacted_by_me),
      users,
    };
  });
};

// Pin: { pinned_by, pinned_by_name, pinned_at }
const toPin = (p) =>
  p
    ? {
        pinnedBy: String(p.pinned_by ?? ""),
        pinnedByName: p.pinned_by_name ?? "",
        pinnedAt: p.pinned_at ?? null,
      }
    : null;

// delivered_to / read_by: [{ employee_id, name, image_url, at }]
const toReaders = (list = []) =>
  (Array.isArray(list) ? list : []).map((r) => ({
    uuid: String(r.employee_id ?? r.uuid ?? ""),
    name: r.name ?? "",
    image: r.image_url ?? r.image ?? "",
    at: r.at ?? null,
  }));

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
  file: toFile(m),
  reactions: toReactions(m.reactions),
  replies: Number(m.reply_count ?? m.replies ?? 0),
  replyTo: toReplyTo(m),
  // read info
  deliveredTo: toReaders(m.delivered_to),
  readBy: toReaders(m.read_by),
  deliveredToAll: Boolean(m.delivered_to_all),
  allRead: Boolean(m.all_read),
  // pin info
  pinned: Boolean(m.pinned ?? m.is_pinned ?? m.pin),
  pin: toPin(m.pin),
});

// Shared media item (API 4)
const toMediaItem = (m) => ({
  id: String(m.attachment_id),
  messageId: String(m.message_id),
  senderId: String(m.sender_id ?? ""),
  senderName: m.sender_name || "",
  name: m.file_name || "file",
  url: fullUrl(m.url),
  path: m.url || "",
  mime: m.mime_type || "",
  type: m.media_type || "document",
  size: m.file_size ?? 0,
  sizeLabel: m.file_size_mb || "",
  createdAt: m.created_at || null,
});

// ids: only the conversation id and message id are sent as integers
const num = (v) => Number(v);
const isNum = (v) => v !== null && v !== "" && Number.isFinite(Number(v));

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
      // message ids are strings in the UI, but the API wants an integer.
      // Temp ids like "tmp-123" are not numeric, so they become null.
      const replyId = replyToId == null ? NaN : Number(replyToId);

      const response = await axiosInstance.post(
        sendChatMessage(conversationId),
        {
          content: text,
          reply_to_id: Number.isInteger(replyId) ? replyId : null,
        },
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

  sendAttachment: async (conversationId, file, caption = "") => {
    try {
      const body = new FormData();
      body.append("file", file);
      if (caption) body.append("caption", caption);

      // axiosInstance defaults to application/json, so multipart must be set
      // here. Axios adds the boundary itself for a FormData body.
      const response = await axiosInstance.post(
        sendChatAttachment(conversationId),
        body,
        {
          silent: true,
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      const saved = response.data?.data;
      return saved?.id != null ? toMessage(saved) : null;
    } catch (error) {
      console.error(
        `Error sending attachment to conversation #${conversationId}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },
  // POST a reaction (same emoji again removes it)
  // OLD: unused now, use addReaction / removeReaction below.
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

  createTeam: async ({ name, departmentId }) => {
    try {
      const response = await axiosInstance.post(createChatDepartment, {
        name: name.trim(),
        department_id: Number(departmentId), // API expects an integer
      });
      return response.data?.data ?? response.data;
      // -> { id: 8, type: "group", name: "NEW PROJECT", created_by: "100555" }
    } catch (error) {
      console.error(
        "Error creating team:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  createChannel: async ({ name, employeeUuids }) => {
    try {
      const response = await axiosInstance.post(createChatChannel, {
        name: name.trim(),
        employee_uuids: employeeUuids.map(String), // API expects strings
      });
      return response.data?.data ?? response.data;
      // -> { id: 7, type: "group", name: "REBS", created_by: "100555" }
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

  // OLD generic upload. No longer used for chat sending; remove it together
  // with `uploadChatFile` in api.js once nothing else calls it.
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
  // DELETE /employee/chat/{conversation_id}/messages
  // body: { message_ids: [12, 13] }
  deleteMessages: async (conversationId, messageIds) => {
    try {
      const response = await axiosInstance.delete(
        deleteChatMessages(conversationId),
        { data: { message_ids: messageIds.map(Number) } },
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error deleting messages in conversation #${conversationId}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // =====================================================================
  // NEW CHAT APIs (10). All responses are { status_code, message, data }.
  // =====================================================================

  // 1. POST /employee/chat/{cid}/delivered   body: { up_to_message_id }
  markDelivered: async (conversationId, upToMessageId) => {
    if (!isNum(upToMessageId)) return { updated: 0 };
    try {
      const response = await axiosInstance.post(
        markChatDelivered(num(conversationId)),
        { up_to_message_id: num(upToMessageId) },
        { silent: true },
      );
      return { updated: response.data?.data?.updated ?? 0 };
    } catch (error) {
      console.error(
        `Error marking delivered in conversation #${conversationId}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // 2. POST /employee/chat/{cid}/read   body: { up_to_message_id }
  markReadUpTo: async (conversationId, upToMessageId) => {
    if (!isNum(upToMessageId)) return { updated: 0 };
    try {
      const response = await axiosInstance.post(
        markChatReadUpTo(num(conversationId)),
        { up_to_message_id: num(upToMessageId) },
        { silent: true },
      );
      return { updated: response.data?.data?.updated ?? 0 };
    } catch (error) {
      console.error(
        `Error marking read in conversation #${conversationId}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // 3. GET /employee/chat/{cid}/media/counts
  fetchMediaCounts: async (conversationId) => {
    try {
      const response = await axiosInstance.get(
        getChatMediaCounts(num(conversationId)),
      );
      const d = response.data?.data ?? {};
      return {
        image: d.image ?? 0,
        video: d.video ?? 0,
        audio: d.audio ?? 0,
        document: d.document ?? 0,
        total: d.total ?? 0,
      };
    } catch (error) {
      console.error(
        `Error fetching media counts of conversation #${conversationId}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // 4. GET /employee/chat/{cid}/media
  // No pagination params are documented, so none are sent.
  fetchMedia: async (conversationId) => {
    try {
      const response = await axiosInstance.get(
        getChatMedia(num(conversationId)),
      );
      const d = response.data?.data ?? {};
      return {
        items: (d.items ?? []).map(toMediaItem),
        hasMore: Boolean(d.has_more),
      };
    } catch (error) {
      console.error(
        `Error fetching media of conversation #${conversationId}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // 5. PUT /employee/chat/{cid}/messages/{mid}/reactions   body: { emoji }
  addReaction: async (conversationId, messageId, emoji) => {
    try {
      const response = await axiosInstance.put(
        addChatReaction(num(conversationId), num(messageId)),
        { emoji },
        { silent: true },
      );
      const d = response.data?.data ?? {};
      return {
        messageId: String(d.message_id ?? messageId),
        reactions: toReactions(d.reactions),
      };
    } catch (error) {
      console.error(
        `Error adding reaction to message #${messageId}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // 6. DELETE /employee/chat/{cid}/messages/{mid}/reactions?emoji=...
  // The emoji is URL-encoded inside removeChatReaction (api.js).
  removeReaction: async (conversationId, messageId, emoji) => {
    try {
      const response = await axiosInstance.delete(
        removeChatReaction(num(conversationId), num(messageId), emoji),
        { silent: true },
      );
      const d = response.data?.data ?? {};
      return {
        messageId: String(d.message_id ?? messageId),
        reactions: toReactions(d.reactions),
      };
    } catch (error) {
      console.error(
        `Error removing reaction from message #${messageId}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // 7. POST /employee/chat/{cid}/add-participants   body: { employee_ids: [strings] }
  // The response is the FULL participant list of the conversation.
  addParticipants: async (conversationId, employeeIds) => {
    try {
      const response = await axiosInstance.post(
        addChatParticipants(num(conversationId)),
        { employee_ids: employeeIds.map(String) }, // never Number()
        { silent: true },
      );
      const list = response.data?.data ?? [];
      return Array.isArray(list) ? list.map(toPerson) : [];
    } catch (error) {
      console.error(
        `Error adding participants to conversation #${conversationId}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // DELETE /employee/chat/{cid}/participants   body: { employee_ids: [strings] }
  // Response: { removed, conversation_deleted, messages_deleted, attachments_deleted }
  removeParticipants: async (conversationId, employeeIds) => {
    try {
      const response = await axiosInstance.delete(
        removeChatParticipants(num(conversationId)),
        { data: { employee_ids: employeeIds.map(String) }, silent: true },
      );
      const d = response.data?.data ?? {};
      return {
        removed: d.removed ?? 0,
        conversationDeleted: Boolean(d.conversation_deleted),
        messagesDeleted: d.messages_deleted ?? 0,
        attachmentsDeleted: d.attachments_deleted ?? 0,
      };
    } catch (error) {
      console.error(
        `Error removing participants from conversation #${conversationId}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // 8. PUT /employee/chat/{cid}/messages/{mid}/pin   (no body)
  pinMessage: async (conversationId, messageId) => {
    try {
      const response = await axiosInstance.put(
        pinChatMessage(num(conversationId), num(messageId)),
        null,
        { silent: true },
      );
      const d = response.data?.data ?? {};
      return { pinned: Boolean(d.pinned), pin: toPin(d.pin) };
    } catch (error) {
      console.error(
        `Error pinning message #${messageId}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // 9. DELETE /chat/{cid}/messages/{mid}/unpin   (no body)
  // NOTE: documented WITHOUT /employee. Kept as documented, needs backend
  // confirmation. If it returns 404, add /employee in api.js.
  unpinMessage: async (conversationId, messageId) => {
    try {
      const response = await axiosInstance.delete(
        unpinChatMessage(num(conversationId), num(messageId)),
        { silent: true },
      );
      const d = response.data?.data ?? {};
      return { pinned: Boolean(d.pinned) };
    } catch (error) {
      console.error(
        `Error unpinning message #${messageId}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // 10. GET /employee/chat/{cid}/pins
  fetchPins: async (conversationId) => {
    try {
      const response = await axiosInstance.get(
        getChatPins(num(conversationId)),
      );
      const list = response.data?.data ?? [];
      return (Array.isArray(list) ? list : []).map((p) => ({
        id: String(p.message_id),
        senderId: String(p.sender_id ?? ""),
        senderName: p.sender_name || "",
        type: p.message_type || "text",
        content: p.content ?? "",
        createdAt: p.created_at || null,
        pin: toPin(p.pin),
      }));
    } catch (error) {
      console.error(
        `Error fetching pins of conversation #${conversationId}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },
};

chatService.toMessage = toMessage;
chatService.toReactions = toReactions;
chatService.toPin = toPin;
chatService.toReaders = toReaders;
chatService.toPerson = toPerson;

export { toMessage, toReactions, toPin, toReaders, toPerson };
export default chatService;
