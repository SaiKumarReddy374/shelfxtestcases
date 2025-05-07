// Set test environment
process.env.NODE_ENV = 'test';

import { getSubscriptions, getSubscriptionByUserId, subscribePlan } from '../controllers/subscriptionController.js';
import db from '../db.js';

jest.mock('../db.js', () => ({
    query: jest.fn(),
    end: jest.fn().mockResolvedValue(true)
}));

afterAll(async () => {
    await db.end();
    await new Promise(resolve => setTimeout(resolve, 100)); // Ensure all async operations complete
    jest.clearAllMocks();
});

describe('subscriptionController', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        mockReq = {
            body: {},
            session: {},
            params: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('getSubscriptions', () => {
        it('should return all subscriptions', async () => {
            const mockSubscriptions = [
                { id: 1, userId: 1, plan: 'starter' },
                { id: 2, userId: 2, plan: 'premium' }
            ];

            db.query.mockResolvedValueOnce([mockSubscriptions]);

            await getSubscriptions(mockReq, mockRes);

            expect(db.query).toHaveBeenCalledWith('SELECT id, userId, plan FROM subscription');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockSubscriptions);
        });

        it('should handle database errors', async () => {
            db.query.mockRejectedValueOnce(new Error('Database error'));

            await getSubscriptions(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith('Server error');
        });
    });

    describe('getSubscriptionByUserId', () => {
        it('should return subscription for a specific user', async () => {
            const mockSubscription = { id: 1, userId: 1, plan: 'starter' };
            mockReq.params.id = '1';

            db.query.mockResolvedValueOnce([[mockSubscription]]);

            await getSubscriptionByUserId(mockReq, mockRes);

            expect(db.query).toHaveBeenCalledWith('SELECT id, userId, plan FROM subscription WHERE userId = ?', ['1']);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockSubscription);
        });

        it('should handle non-existent subscription', async () => {
            mockReq.params.id = '999';
            db.query.mockResolvedValueOnce([[]]);

            await getSubscriptionByUserId(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.send).toHaveBeenCalledWith('Subscription not found');
        });

        it('should handle database errors', async () => {
            mockReq.params.id = '1';
            db.query.mockRejectedValueOnce(new Error('Database error'));

            await getSubscriptionByUserId(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith('Server error');
        });
    });

    describe('subscribePlan', () => {
        it('should create a new subscription', async () => {
            mockReq.session.userId = 1;
            mockReq.params.selectedPlan = 'starter';
            db.query.mockResolvedValueOnce([[]]); // No existing subscription
            db.query.mockResolvedValueOnce([{ insertId: 1 }]); // Insert result

            await subscribePlan(mockReq, mockRes);

            expect(db.query).toHaveBeenCalledWith('INSERT INTO subscription (userId, plan) VALUES (?, ?)', [1, 'starter']);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith('Subscription successful');
        });

        it('should update existing subscription', async () => {
            mockReq.session.userId = 1;
            mockReq.params.selectedPlan = 'premium';
            db.query.mockResolvedValueOnce([[{ id: 1, userId: 1, plan: 'starter' }]]); // Existing subscription
            db.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Update result

            await subscribePlan(mockReq, mockRes);

            expect(db.query).toHaveBeenCalledWith('UPDATE subscription SET plan = ? WHERE userId = ?', ['premium', 1]);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith('Subscription updated successfully');
        });

        it('should handle unauthorized access', async () => {
            mockReq.session.userId = null;
            mockReq.params.selectedPlan = 'starter';

            await subscribePlan(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.send).toHaveBeenCalledWith('User not authenticated');
        });

        it('should handle missing plan', async () => {
            mockReq.session.userId = 1;
            mockReq.params.selectedPlan = null;

            await subscribePlan(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.send).toHaveBeenCalledWith('Subscription plan is required');
        });

        it('should handle invalid plan', async () => {
            mockReq.session.userId = 1;
            mockReq.params.selectedPlan = 'invalid_plan';

            await subscribePlan(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.send).toHaveBeenCalledWith('Invalid subscription plan');
        });

        it('should handle database errors', async () => {
            mockReq.session.userId = 1;
            mockReq.params.selectedPlan = 'starter';
            db.query.mockRejectedValueOnce(new Error('Database error'));

            await subscribePlan(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith('Server error');
        });
    });
});