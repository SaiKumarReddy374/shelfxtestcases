import nodemailer from 'nodemailer';
import { sendApprovalEmail } from '../controllers/emailService.js';

jest.mock('nodemailer'); // Mock the nodemailer module

describe('sendApprovalEmail', () => {
  let mockSendMail;

  beforeEach(() => {
    // Mock the sendMail function
    mockSendMail = jest.fn();
    nodemailer.createTransport.mockReturnValue({
      sendMail: mockSendMail,
    });

    // Set environment variables for testing
    process.env.EMAIL_USR = 'test@example.com';
    process.env.APP_PASS = 'testpassword';
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
    delete process.env.EMAIL_USR;
    delete process.env.APP_PASS;
  });

  it('should send an email successfully', async () => {
    // Mock successful email sending
    mockSendMail.mockResolvedValueOnce({ messageId: '12345' });

    const buyerEmail = 'buyer@example.com';
    const bookName = 'Test Book';

    const result = await sendApprovalEmail(buyerEmail, bookName);

    expect(mockSendMail).toHaveBeenCalledWith({
      from: process.env.EMAIL_USR,
      to: [buyerEmail],
      subject: `Your request for ${bookName} has been approved!`,
      text: `Dear Buyer and Seller, your rental request for Book:- ${bookName} has been approved. Please proceed with the next steps.`,
    });
    expect(result).toEqual({ messageId: '12345' });
  });

  it('should throw an error if email credentials are missing', async () => {
    delete process.env.EMAIL_USR; // Remove email credentials
    delete process.env.APP_PASS;

    const buyerEmail = 'buyer@example.com';
    const bookName = 'Test Book';

    await expect(sendApprovalEmail(buyerEmail, bookName)).rejects.toThrow(
      'Email configuration error: Missing credentials'
    );
  });

  it('should handle email sending errors gracefully', async () => {
    // Mock email sending failure
    const mockError = new Error('SMTP connection failed');
    mockSendMail.mockRejectedValueOnce(mockError);

    const buyerEmail = 'buyer@example.com';
    const bookName = 'Test Book';

    await expect(sendApprovalEmail(buyerEmail, bookName)).rejects.toThrow(
      `Email sending failed: ${mockError.message}`
    );

    expect(mockSendMail).toHaveBeenCalled();
  });
});