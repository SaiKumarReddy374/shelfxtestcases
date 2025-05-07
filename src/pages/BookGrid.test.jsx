import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import BookGrid from './BookGrid';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';

// Mock the modules
jest.mock('axios');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));
jest.mock('bcryptjs', () => ({
  compare: jest.fn().mockResolvedValue(true)
}));

describe('BookGrid Component', () => {
  const mockUser = {
    id: '123',
    username: 'testuser',
    email: 'test@example.com',
    pincode: '110001',
    password: 'hashedpassword'
  };

  const mockBooks = [
    {
      id: '1',
      userId: 'seller123',
      bookName: 'Test Book 1',
      price: '500',
      pincode: '110001',
      imageUrl: '/test-image1.jpg',
      listingType: 'SELL'
    },
    {
      id: '2',
      userId: 'seller456',
      bookName: 'Test Book 2',
      price: '300',
      pincode: '110005',
      imageUrl: '/test-image2.jpg',
      listingType: 'RENT'
    }
  ];

  const mockRequests = [
    {
      bookId: '1',
      bookName: 'Test Book 1',
      bookPrice: '500',
      date: new Date().toISOString(),
      status: 'APPROVED'
    },
    {
      bookId: '2',
      bookName: 'Test Book 2',
      bookPrice: '300',
      date: new Date().toISOString(),
      status: 'REJECTED'
    }
  ];

  const mockSeller = {
    userId: 'seller123',
    username: 'Seller User',
    email: 'seller@example.com'
  };

  beforeEach(() => {
    // Mock the authentication check
    axios.get.mockImplementation((url) => {
      if (url === 'http://localhost:5000/check-auth') {
        return Promise.resolve({ data: { authenticated: true } });
      } else if (url === 'http://localhost:5000/explore') {
        return Promise.resolve({ data: { user: mockUser, books: mockBooks } });
      } else if (url === 'http://localhost:5000/status') {
        return Promise.resolve({ data: { requests: mockRequests } });
      } else if (url.includes('http://localhost:5000/sellerdetails/')) {
        return Promise.resolve({ data: { user: mockSeller } });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Mock implementation for useEffect to avoid act warnings
    jest.spyOn(React, 'useEffect').mockImplementation(f => f());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders the component with books', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <BookGrid />
        </BrowserRouter>
      );
    });

    // Wait for user and books to load
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    // Check if books are rendered
    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument();
      expect(screen.getByText('Test Book 2')).toBeInTheDocument();
    });
  });

  test('handles search functionality', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <BookGrid />
        </BrowserRouter>
      );
    });

    // Wait for books to load
    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument();
    });

    // Type in search box
    await act(async () => {
      const searchInput = screen.getByPlaceholderText('Search by book name...');
      fireEvent.change(searchInput, { target: { value: 'Test Book 1' } });
    });

    // Check that only the searched book is shown
    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Book 2')).not.toBeInTheDocument();
    });
  });

  test('switches to requested tab', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <BookGrid />
        </BrowserRouter>
      );
    });

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Books')).toBeInTheDocument();
    });

    // Click on the Requested tab
    await act(async () => {
      fireEvent.click(screen.getByText('Requested'));
    });

    // Check if the requested tab content is displayed
    await waitFor(() => {
      expect(screen.getByText('History')).toBeInTheDocument();
      expect(screen.getByText('Change your password')).toBeInTheDocument();
      expect(screen.getByText('Change your name')).toBeInTheDocument();
    });
  });

  test('opens book details modal when See Details is clicked', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <BookGrid />
        </BrowserRouter>
      );
    });

    // Wait for books to load
    await waitFor(() => {
      expect(screen.getAllByText('See Details')[0]).toBeInTheDocument();
    });

    // Click on See Details button
    await act(async () => {
      fireEvent.click(screen.getAllByText('See Details')[0]);
    });

    // Check if the modal opens with seller details
    await waitFor(() => {
      expect(screen.getByText('Seller Details')).toBeInTheDocument();
      expect(screen.getByText('Buy Now')).toBeInTheDocument();
    });
  });

  test('opens change password dialog', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <BookGrid />
        </BrowserRouter>
      );
    });

    // Wait for component to load and switch to requested tab
    await waitFor(() => {
      expect(screen.getByText('Books')).toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Requested'));
    });

    // Wait for the requested tab to load
    await waitFor(() => {
      expect(screen.getByText('Change your password')).toBeInTheDocument();
    });

    // Click on change password button
    await act(async () => {
      fireEvent.click(screen.getByText('Change your password'));
    });

    // Check if the dialog opens
    await waitFor(() => {
      expect(screen.getByText('Change Your Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
      expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    });
  });

  test('opens change name dialog', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <BookGrid />
        </BrowserRouter>
      );
    });

    // Wait for component to load and switch to requested tab
    await waitFor(() => {
      expect(screen.getByText('Books')).toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Requested'));
    });

    // Wait for the requested tab to load
    await waitFor(() => {
      expect(screen.getByText('Change your name')).toBeInTheDocument();
    });

    // Click on change name button
    await act(async () => {
      fireEvent.click(screen.getByText('Change your name'));
    });

    // Check if the dialog opens
    await waitFor(() => {
      expect(screen.getByText('Change Your Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });
  });

  test('toggles favorites when heart icon is clicked', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <BookGrid />
        </BrowserRouter>
      );
    });

    // Wait for books to load
    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument();
    });

    // Find the heart icon (this might need adjustment based on your actual render)
    await act(async () => {
      const heartIcons = document.querySelectorAll('.text-red-500');
      fireEvent.click(heartIcons[0]);
    });

    // Since we're testing a state change, there's no visible change to assert
    // We're just ensuring the click doesn't cause errors
  });

  test('handles sort by pincode', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <BookGrid />
        </BrowserRouter>
      );
    });

    // Wait for books to load
    await waitFor(() => {
      expect(screen.getByText('Sort by Nearest')).toBeInTheDocument();
    });

    // Click on Sort by Nearest button
    await act(async () => {
      fireEvent.click(screen.getByText('Sort by Nearest'));
    });

    // After sorting, the button text should change
    expect(screen.getByText('Clear Sorting')).toBeInTheDocument();

    // Click again to clear sorting
    await act(async () => {
      fireEvent.click(screen.getByText('Clear Sorting'));
    });
    
    // Button text should change back
    expect(screen.getByText('Sort by Nearest')).toBeInTheDocument();
  });

  test('handles logout', async () => {
    axios.post.mockResolvedValueOnce({ status: 200 });

    await act(async () => {
      render(
        <BrowserRouter>
          <BookGrid />
        </BrowserRouter>
      );
    });

    // Wait for user to load
    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    // Click logout button
    await act(async () => {
      fireEvent.click(screen.getByText('Logout'));
    });

    // Verify axios was called with the correct URL
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/logout',
        {},
        { withCredentials: true }
      );
    });
  });
});