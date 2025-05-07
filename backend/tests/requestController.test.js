import { getRequestsBySellerId, approveRequest, rejectRequest, getRequestCount } from '../controllers/requestControllers.js';
import db from '../db.js';
import { sendApprovalEmail } from '../controllers/emailService.js';

jest.mock('../db.js', () => ({
    query: jest.fn(),
    end: jest.fn().mockResolvedValue(true),
}));

jest.mock('../controllers/emailService.js', () => ({
    sendApprovalEmail: jest.fn(),
}));

afterAll(async () => {
    await db.end();
    await new Promise((resolve) => setTimeout(resolve, 100)); // Ensure all async operations complete
    jest.clearAllMocks();
});

describe('requestController', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        mockReq = {
            body: {},
            params: {},
            session: {},
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            json: jest.fn(),
        };
        jest.clearAllMocks();
    });

    describe('getRequestsBySellerId', () => {
        it('should return all pending requests for a seller', async () => {
            const mockRequests = [
                {
                    id: 1,
                    userId: 2,
                    bookId: 3,
                    pincode: '123456',
                    state: 'TestState',
                    email: 'buyer@example.com',
                    bookName: 'Test Book',
                    status: 'PENDING',
                    requestDate: new Date(),
                },
            ];

            mockReq.params.sellerId = 1;
            db.query.mockResolvedValueOnce([mockRequests]);

            await getRequestsBySellerId(mockReq, mockRes);

            expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockRequests);
        });

        it('should handle no pending requests', async () => {
            mockReq.params.sellerId = 1;
            db.query.mockResolvedValueOnce([]);

            await getRequestsBySellerId(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'No pending requests found' });
        });

        it('should handle database errors', async () => {
            mockReq.params.sellerId = 1;
            const mockError = new Error('Database error');
            db.query.mockRejectedValueOnce(mockError);

            await getRequestsBySellerId(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith('Server error');
        });
    });

    describe('approveRequest', () => {
        it('should approve a request successfully', async () => {
            mockReq.params.bookId = 1;
            mockReq.body = {
                sellerId: 1,
                userId: 2,
                bookName: 'Test Book',
                buyerEmail: 'buyer@example.com',
            };

            db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await approveRequest(mockReq, mockRes);

            expect(db.query).toHaveBeenCalledWith(expect.any(String), ['APPROVED', 1, 1, 2]);
            expect(sendApprovalEmail).toHaveBeenCalledWith('buyer@example.com', 'Test Book');
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Request approved successfully, email sent to buyer and seller!',
            });
        });

        it('should handle non-existent request', async () => {
            mockReq.params.bookId = 999;
            mockReq.body = {
                sellerId: 1,
                userId: 2,
            };

            db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            await approveRequest(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Request not found' });
        });

        it('should handle database errors', async () => {
            mockReq.params.bookId = 1;
            mockReq.body = {
                sellerId: 1,
                userId: 2,
            };

            const mockError = new Error('Database error');
            db.query.mockRejectedValueOnce(mockError);

            await approveRequest(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Error approving request',
                error: mockError,
            });
        });
    });

    describe('rejectRequest', () => {
        it('should reject a request successfully', async () => {
            mockReq.params.bookId = 1;
            mockReq.body = {
                sellerId: 1,
                userId: 2,
            };

            db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await rejectRequest(mockReq, mockRes);

            expect(db.query).toHaveBeenCalledWith(expect.any(String), ['REJECTED', 1, 1, 2]);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Request rejected successfully' });
        });

        it('should handle non-existent request', async () => {
            mockReq.params.bookId = 999;
            mockReq.body = {
                sellerId: 1,
                userId: 2,
            };

            db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            await rejectRequest(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Request not found' });
        });

        it('should handle database errors', async () => {
            mockReq.params.bookId = 1;
            mockReq.body = {
                sellerId: 1,
                userId: 2,
            };

            const mockError = new Error('Database error');
            db.query.mockRejectedValueOnce(mockError);

            await rejectRequest(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Error rejecting request',
                error: mockError,
            });
        });
    });

    describe('getRequestCount', () => {
        it('should return total request count', async () => {
            const mockCount = [{ count: 5 }];
            db.query.mockResolvedValueOnce([mockCount]);

            await getRequestCount(mockReq, mockRes);

            expect(db.query).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM request');
            expect(mockRes.json).toHaveBeenCalledWith({ count: 5 });
        });

        it('should handle database errors', async () => {
            const mockError = new Error('Database error');
            db.query.mockRejectedValueOnce(mockError);

            await getRequestCount(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith('Server error');
        });
    });
});