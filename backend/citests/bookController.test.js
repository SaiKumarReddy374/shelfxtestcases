import { booksCount } from "../controllers/bookController.js";
import db from "../db.js";

jest.mock("../db.js"); // Mock the database module

describe("booksCount", () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {}; // No request body needed for this function
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  it("should return the correct book count", async () => {
    // Mock database query result
    const mockRows = [{ count: 42 }];
    db.query.mockResolvedValueOnce([mockRows]);

    await booksCount(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({ count: 42 });
    expect(mockRes.status).not.toHaveBeenCalled(); // Ensure no error status is sent
  });

  it("should handle database errors gracefully", async () => {
    // Mock database query to throw an error
    const mockError = new Error("Database error");
    db.query.mockRejectedValueOnce(mockError);

    await booksCount(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith("Server error");
  });
});