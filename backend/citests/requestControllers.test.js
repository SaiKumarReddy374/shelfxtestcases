import db from "../db.js";
import { sendApprovalEmail } from "../controllers/emailService.js";
import {
  getRequestsBySellerId,
  approveRequest,
  rejectRequest,
  getRequestCount,
} from "../controllers/requestControllers.js";

jest.mock("../db.js");
jest.mock("../controllers/emailService.js");

describe("requestControllers", () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      params: {},
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

  // Test for getRequestsBySellerId
  describe("getRequestsBySellerId", () => {
    it("should fetch pending requests for a seller", async () => {
      mockReq.params.sellerId = 1;
      const mockRequests = [
        { id: 1, userId: 2, bookId: 3, status: "PENDING" },
      ];
      db.query.mockResolvedValueOnce([mockRequests]);

      await getRequestsBySellerId(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockRequests);
    });

    it("should return 404 if no pending requests are found", async () => {
      mockReq.params.sellerId = 1;
      db.query.mockResolvedValueOnce([[]]);

      await getRequestsBySellerId(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "No pending requests found",
      });
    });

    it("should handle database errors", async () => {
      mockReq.params.sellerId = 1;
      db.query.mockRejectedValueOnce(new Error("Database error"));

      await getRequestsBySellerId(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith("Server error");
    });
  });

  // Test for approveRequest
  describe("approveRequest", () => {
    it("should approve a request and mark the book as sold", async () => {
      mockReq.body = {
        bookId: 1,
        sellerId: 2,
        userId: 3,
        bookName: "Test Book",
        buyerEmail: "buyer@example.com",
      };

      db.query.mockResolvedValueOnce({ affectedRows: 1 }); // Update request status
      db.query.mockResolvedValueOnce(); // Update book status
      sendApprovalEmail.mockResolvedValueOnce(true); // Email sent successfully

      await approveRequest(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Request approved and book marked as sold",
      });
    });

    it("should return 404 if the request is not found", async () => {
      mockReq.body = {
        bookId: 1,
        sellerId: 2,
        userId: 3,
      };

      db.query.mockResolvedValueOnce({ affectedRows: 0 }); // No request found

      await approveRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Request not found",
      });
    });

    it("should handle email sending failures", async () => {
      mockReq.body = {
        bookId: 1,
        sellerId: 2,
        userId: 3,
        bookName: "Test Book",
        buyerEmail: "buyer@example.com",
      };

      db.query.mockResolvedValueOnce({ affectedRows: 1 }); // Update request status
      db.query.mockResolvedValueOnce(); // Update book status
      sendApprovalEmail.mockResolvedValueOnce(false); // Email sending failed

      await approveRequest(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Request approved and book marked as sold",
      });
    });

    it("should handle database errors", async () => {
      mockReq.body = {
        bookId: 1,
        sellerId: 2,
        userId: 3,
      };

      db.query.mockRejectedValueOnce(new Error("Database error"));

      await approveRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Error approving request",
      });
    });
  });

  // Test for rejectRequest
  describe("rejectRequest", () => {
    it("should reject a request successfully", async () => {
      mockReq.params.bookId = 1;
      mockReq.body = { sellerId: 2, userId: 3 };

      db.query.mockResolvedValueOnce({ affectedRows: 1 }); // Update request status

      await rejectRequest(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Request rejected successfully",
      });
    });

    it("should return 404 if the request is not found", async () => {
      mockReq.params.bookId = 1;
      mockReq.body = { sellerId: 2, userId: 3 };

      db.query.mockResolvedValueOnce({ affectedRows: 0 }); // No request found

      await rejectRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Request not found",
      });
    });

    it("should handle database errors", async () => {
      mockReq.params.bookId = 1;
      mockReq.body = { sellerId: 2, userId: 3 };

      db.query.mockRejectedValueOnce(new Error("Database error"));

      await rejectRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Error rejecting request",
        error: expect.any(Error),
      });
    });
  });

  // Test for getRequestCount
  describe("getRequestCount", () => {
    it("should fetch the count of requests successfully", async () => {
      db.query.mockResolvedValueOnce([{ count: 10 }]);

      await getRequestCount(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ count: 10 });
    });

    it("should handle database errors", async () => {
      db.query.mockRejectedValueOnce(new Error("Database error"));

      await getRequestCount(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith("Server error");
    });
  });
});