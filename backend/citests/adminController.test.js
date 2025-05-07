// Set test environment
process.env.NODE_ENV = 'test';

import { adminStatus } from "../controllers/adminController.js"; // Update the path if needed
import db from "../db.js";

jest.mock("../db.js");

describe("adminStatus", () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {
        username: "adminUser",
        password: "adminPass"
      }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
  });

  it("should login successfully with valid credentials", async () => {
    const mockAdmin = [{ id: 1, username: "adminUser", password: "adminPass" }];

    db.query.mockResolvedValueOnce([mockAdmin]);

    await adminStatus(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.send).toHaveBeenCalledWith({ message: "Login successful" });
  });

  it("should return 401 for invalid password", async () => {
    const mockAdmin = [{ id: 1, username: "adminUser", password: "adminPass" }];

    db.query.mockResolvedValueOnce([mockAdmin]);

    mockReq.body.password = "wrongPass"; // Simulate an invalid password

    await adminStatus(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.send).toHaveBeenCalledWith({ message: "Invalid credentials" });
  });

  it("should return 401 for non-existent user", async () => {
    db.query.mockResolvedValueOnce([[]]); // No admin found

    await adminStatus(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.send).toHaveBeenCalledWith({ message: "Invalid credentials" });
  });

  it("should handle server errors", async () => {
    const error = new Error("Database error");
    db.query.mockRejectedValueOnce(error);

    await adminStatus(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({ message: "Server error" });
  });
});
