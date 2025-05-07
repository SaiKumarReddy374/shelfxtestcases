import { redis } from "../config/redis.js";
import db from "../db.config.js";
import Chat from "../models/chat.model.js";
import {
  initializeChat,
  getMessages,
  sendMessage,
  getUserChats,
  getUnreadCounts,
  getActiveChatsForSeller,
  clearRedisCache,
} from "../controllers/chat.controller.js";

jest.mock("../db.config.js");
jest.mock("../models/chat.model.js");
jest.mock("../config/redis.js");

describe("chat.controller", () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      params: {},
      body: {},
      session: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test for initializeChat
  describe("initializeChat", () => {
    it("should initialize a chat successfully", async () => {
      mockReq.body = { bookId: 1, sellerId: 2, buyerId: 3 };
      Chat.initializeChat.mockResolvedValueOnce({ id: 1 });
      Chat.getMessages.mockResolvedValueOnce([]);

      await initializeChat(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        chatId: 1,
        messages: [],
      });
    });

    it("should return 400 if required fields are missing", async () => {
      mockReq.body = { bookId: 1, sellerId: null, buyerId: 3 };

      await initializeChat(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Missing required fields",
      });
    });

    it("should handle database errors", async () => {
      mockReq.body = { bookId: 1, sellerId: 2, buyerId: 3 };
      Chat.initializeChat.mockRejectedValueOnce(new Error("Database error"));

      await initializeChat(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Error initializing chat",
      });
    });
  });

  // Test for getMessages
  describe("getMessages", () => {
    it("should fetch messages successfully", async () => {
      mockReq.params.chatId = 1;
      Chat.getMessages.mockResolvedValueOnce([{ id: 1, content: "Hello" }]);

      await getMessages(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([{ id: 1, content: "Hello" }]);
    });

    it("should handle database errors", async () => {
      mockReq.params.chatId = 1;
      Chat.getMessages.mockRejectedValueOnce(new Error("Database error"));

      await getMessages(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Error fetching messages",
      });
    });
  });

  // Test for sendMessage
  describe("sendMessage", () => {
    it("should send a message successfully", async () => {
      mockReq.params.chatId = 1;
      mockReq.body = { content: "Hello", senderType: "buyer" };
      Chat.addMessage.mockResolvedValueOnce({ id: 1, content: "Hello" });

      await sendMessage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ id: 1, content: "Hello" });
    });

    it("should return 400 if required fields are missing", async () => {
      mockReq.params.chatId = 1;
      mockReq.body = { content: null, senderType: "buyer" };

      await sendMessage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Missing required fields",
      });
    });

    it("should handle database errors", async () => {
      mockReq.params.chatId = 1;
      mockReq.body = { content: "Hello", senderType: "buyer" };
      Chat.addMessage.mockRejectedValueOnce(new Error("Database error"));

      await sendMessage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Error sending message",
      });
    });
  });

  // Test for getUserChats
  describe("getUserChats", () => {
    it("should fetch user chats successfully", async () => {
      mockReq.params = { userId: 1, userType: "buyer" };
      Chat.getChatsByUserId.mockResolvedValueOnce([{ id: 1, chatName: "Chat 1" }]);

      await getUserChats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([{ id: 1, chatName: "Chat 1" }]);
    });

    it("should handle database errors", async () => {
      mockReq.params = { userId: 1, userType: "buyer" };
      Chat.getChatsByUserId.mockRejectedValueOnce(new Error("Database error"));

      await getUserChats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Error fetching user chats",
      });
    });
  });

  // Test for getUnreadCounts
  describe("getUnreadCounts", () => {
    it("should fetch unread counts successfully", async () => {
      mockReq.params = { buyerId: 1 };
      Chat.getUnreadCounts.mockResolvedValueOnce({ unreadCount: 5 });

      await getUnreadCounts(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ unreadCount: 5 });
    });

    it("should handle database errors", async () => {
      mockReq.params = { buyerId: 1 };
      Chat.getUnreadCounts.mockRejectedValueOnce(new Error("Database error"));

      await getUnreadCounts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Error getting unread counts",
      });
    });
  });

  // Test for clearRedisCache
  describe("clearRedisCache", () => {
    it("should clear Redis cache successfully", async () => {
      redis.flushall.mockResolvedValueOnce();

      await clearRedisCache(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Redis cache cleared successfully",
      });
    });

    it("should handle Redis errors", async () => {
      redis.flushall.mockRejectedValueOnce(new Error("Redis error"));

      await clearRedisCache(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Error clearing Redis cache",
      });
    });
  });
});