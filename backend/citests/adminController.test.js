import { adminStatus } from "../controllers/adminController.js";
import db from "../db.js";

jest.mock("../db.js"); // Mock the database module

describe("adminStatus", () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {
                username: "admin",
                password: "password123",
            },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
    });

    it("should return 200 and a success message for valid credentials", async () => {
        // Mock database query result
        db.query.mockResolvedValueOnce([[{ username: "admin", password: "password123" }]]);

        await adminStatus(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({ message: "Login successful" });
    });

    it("should return 401 for invalid credentials", async () => {
        // Mock database query result
        db.query.mockResolvedValueOnce([[{ username: "admin", password: "wrongpassword" }]]);

        await adminStatus(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({ message: "Invalid credentials" });
    });

    it("should return 401 if the user is not found", async () => {
        // Mock database query result
        db.query.mockResolvedValueOnce([[]]); // No user found

        await adminStatus(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({ message: "Invalid credentials" });
    });

    it("should return 500 for a server error", async () => {
        // Mock database query to throw an error
        db.query.mockRejectedValueOnce(new Error("Database error"));

        await adminStatus(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({ message: "Server error" });
    });
});