import bcrypt from "bcrypt";
import db from "../db.js";
import {
  signupBuyer,
  loginBuyer,
  exploreBuyer,
  postRequest,
  getBookStatus,
  getBuyerById,
} from "../controllers/buyerController.js";

jest.mock("../db.js");

describe("buyerController", () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      session: {},
      params: {},
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

  // Test for signupBuyer
  describe("signupBuyer", () => {
    it("should register a buyer successfully", async () => {
      mockReq.body = {
        username: "testUser",
        email: "test@example.com",
        password: "password123",
        pincode: "123456",
        state: "TestState",
      };

      db.query.mockResolvedValueOnce();

      await signupBuyer(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith("Registration successful");
    });

    it("should handle errors during registration", async () => {
      mockReq.body = {
        username: "testUser",
        email: "test@example.com",
        password: "password123",
        pincode: "123456",
        state: "TestState",
      };

      db.query.mockRejectedValueOnce(new Error("Database error"));

      await signupBuyer(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith("Server error");
    });
  });

  // Test for loginBuyer
  describe("loginBuyer", () => {
    it("should log in a buyer successfully", async () => {
      mockReq.body = {
        email: "test@example.com",
        password: "password123",
      };

      const hashedPassword = await bcrypt.hash("password123", 10);
      db.query.mockResolvedValueOnce([{ id: 1, password: hashedPassword }]);

      await loginBuyer(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Login successful",
        session: mockReq.session,
      });
    });

    it("should return 401 for invalid credentials", async () => {
      mockReq.body = {
        email: "test@example.com",
        password: "wrongPassword",
      };

      const hashedPassword = await bcrypt.hash("password123", 10);
      db.query.mockResolvedValueOnce([{ id: 1, password: hashedPassword }]);

      await loginBuyer(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.send).toHaveBeenCalledWith("Invalid email or password");
    });

    it("should handle errors during login", async () => {
      mockReq.body = {
        email: "test@example.com",
        password: "password123",
      };

      db.query.mockRejectedValueOnce(new Error("Database error"));

      await loginBuyer(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith("Server error");
    });
  });

  // Test for exploreBuyer
  describe("exploreBuyer", () => {
    it("should fetch user and books successfully", async () => {
      mockReq.session.userId = 1;

      db.query
        .mockResolvedValueOnce([{ id: 1, username: "testUser" }]) // User details
        .mockResolvedValueOnce([
          {
            id: 1,
            userId: 1,
            bookname: "Test Book",
            address: "Test Address",
            pincode: "123456",
            price: 100,
            imageData: null,
            listingType: "sale",
            status: "available",
            approvedBuyerId: null,
          },
        ]); // Books

      await exploreBuyer(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        user: { id: 1, username: "testUser" },
        books: [
          {
            id: 1,
            userId: 1,
            bookName: "Test Book",
            address: "Test Address",
            pincode: "123456",
            price: 100,
            imageUrl: null,
            listingType: "sale",
            status: "available",
            approvedBuyerId: null,
          },
        ],
      });
    });

    it("should return 401 if user is not authenticated", async () => {
      mockReq.session.userId = null;

      await exploreBuyer(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "User not authenticated",
      });
    });

    it("should handle errors during fetching", async () => {
      mockReq.session.userId = 1;

      db.query.mockRejectedValueOnce(new Error("Database error"));

      await exploreBuyer(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Server error" });
    });
  });

  // Test for postRequest
  describe("postRequest", () => {
    it("should create a request successfully", async () => {
      mockReq.body = { bookId: 1, sellerId: 2 };
      mockReq.session.userId = 1;

      db.query.mockResolvedValueOnce([]); // No existing requests
      db.query.mockResolvedValueOnce(); // Insert request

      await postRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Request created successfully",
      });
    });

    it("should return 400 if request already exists", async () => {
      mockReq.body = { bookId: 1, sellerId: 2 };
      mockReq.session.userId = 1;

      db.query.mockResolvedValueOnce([{ id: 1 }]); // Existing request

      await postRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "You have already requested this book",
      });
    });

    it("should handle errors during request creation", async () => {
      mockReq.body = { bookId: 1, sellerId: 2 };
      mockReq.session.userId = 1;

      db.query.mockRejectedValueOnce(new Error("Database error"));

      await postRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Server error" });
    });
  });

  // Test for getBookStatus
  describe("getBookStatus", () => {
    it("should fetch book status successfully", async () => {
      mockReq.session.userId = 1;

      db.query
        .mockResolvedValueOnce([
          { bookId: 1, requestDate: "2023-01-01", status: "approved" },
        ]) // Requests
        .mockResolvedValueOnce([
          { bookId: 1, bookName: "Test Book", price: 100 },
        ]); // Books

      await getBookStatus(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        requests: [
          {
            bookId: 1,
            bookName: "Test Book",
            bookPrice: 100,
            date: "2023-01-01",
            status: "approved",
          },
        ],
      });
    });

    it("should return 404 if no requests are found", async () => {
      mockReq.session.userId = 1;

      db.query.mockResolvedValueOnce([]); // No requests

      await getBookStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "No requests found for this buyer",
      });
    });

    it("should handle errors during fetching", async () => {
      mockReq.session.userId = 1;

      db.query.mockRejectedValueOnce(new Error("Database error"));

      await getBookStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Server error" });
    });
  });

  // Test for getBuyerById
  describe("getBuyerById", () => {
    it("should fetch buyer details successfully", async () => {
      mockReq.params.id = 1;

      db.query.mockResolvedValueOnce([
        { id: 1, username: "testUser", email: "test@example.com" },
      ]);

      await getBuyerById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        user: { id: 1, username: "testUser", email: "test@example.com" },
      });
    });

    it("should return 404 if buyer is not found", async () => {
      mockReq.params.id = 1;

      db.query.mockResolvedValueOnce([]); // No buyer found

      await getBuyerById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Buyer not found",
      });
    });

    it("should handle errors during fetching", async () => {
      mockReq.params.id = 1;

      db.query.mockRejectedValueOnce(new Error("Database error"));

      await getBuyerById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Server error" });
    });
  });
});