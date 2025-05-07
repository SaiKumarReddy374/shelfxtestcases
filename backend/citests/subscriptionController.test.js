import db from "../db.js";
import {
  getSubscriptions,
  getSubscriptionByUserId,
  subscribePlan,
} from "../controllers/subscriptionController.js";

jest.mock("../db.js"); // Mock the database module

describe("subscriptionController", () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      params: {},
      session: {},
      body: {},
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

  // Test for getSubscriptions
  describe("getSubscriptions", () => {
    it("should fetch all subscriptions successfully", async () => {
      const mockSubscriptions = [
        { id: 1, userId: 1, plan: "free" },
        { id: 2, userId: 2, plan: "premium" },
      ];
      db.query.mockResolvedValueOnce([mockSubscriptions]);

      await getSubscriptions(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockSubscriptions);
    });

    it("should handle database errors", async () => {
      db.query.mockRejectedValueOnce(new Error("Database error"));

      await getSubscriptions(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith("Server error");
    });
  });

  // Test for getSubscriptionByUserId
  describe("getSubscriptionByUserId", () => {
    it("should fetch a subscription by user ID successfully", async () => {
      mockReq.params.id = 1;
      const mockSubscription = { id: 1, userId: 1, plan: "starter" };
      db.query.mockResolvedValueOnce([[mockSubscription]]);

      await getSubscriptionByUserId(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockSubscription);
    });

    it("should return 404 if subscription is not found", async () => {
      mockReq.params.id = 1;
      db.query.mockResolvedValueOnce([[]]); // No subscription found

      await getSubscriptionByUserId(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith("Subscription not found");
    });

    it("should handle database errors", async () => {
      mockReq.params.id = 1;
      db.query.mockRejectedValueOnce(new Error("Database error"));

      await getSubscriptionByUserId(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith("Server error");
    });
  });

  // Test for subscribePlan
  describe("subscribePlan", () => {
    it("should subscribe a user successfully", async () => {
      mockReq.session.userId = 1;
      mockReq.params.selectedPlan = "starter";

      db.query.mockResolvedValueOnce([[]]); // No existing subscription
      db.query.mockResolvedValueOnce(); // Insert subscription

      await subscribePlan(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith("Subscription successful");
    });

    it("should update an existing subscription successfully", async () => {
      mockReq.session.userId = 1;
      mockReq.params.selectedPlan = "premium";

      db.query.mockResolvedValueOnce([[{ id: 1, userId: 1, plan: "starter" }]]); // Existing subscription
      db.query.mockResolvedValueOnce({ affectedRows: 1 }); // Update subscription

      await subscribePlan(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith("Subscription updated successfully");
    });

    it("should return 401 if user is not authenticated", async () => {
      mockReq.session.userId = null;
      mockReq.params.selectedPlan = "starter";

      await subscribePlan(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.send).toHaveBeenCalledWith("User not authenticated");
    });

    it("should return 400 if subscription plan is missing", async () => {
      mockReq.session.userId = 1;
      mockReq.params.selectedPlan = null;

      await subscribePlan(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith("Subscription plan is required");
    });

    it("should return 400 if subscription plan is invalid", async () => {
      mockReq.session.userId = 1;
      mockReq.params.selectedPlan = "invalidPlan";

      await subscribePlan(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith("Invalid subscription plan");
    });

    it("should handle database errors", async () => {
      mockReq.session.userId = 1;
      mockReq.params.selectedPlan = "starter";

      db.query.mockRejectedValueOnce(new Error("Database error"));

      await subscribePlan(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith("Server error");
    });
  });
});