import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SellerAuth from './SellerAuth';

// Mock the child components
jest.mock('../components/SignupSeller', () => (props) => (
  <div data-testid="signup-component">
    Signup Component
    <button onClick={props.onToggle}>Switch to Login</button>
  </div>
));
jest.mock('../components/LoginSeller', () => (props) => (
  <div data-testid="login-component">
    Login Component
    <button onClick={props.onToggle}>Switch to Signup</button>
  </div>
));
jest.mock('../components/Navbar', () => jest.fn(() => <div data-testid="navbar">Navbar</div>));

describe('SellerAuth Component', () => {
  test('renders the Navbar and static content', () => {
    render(<SellerAuth />);

    // Check if Navbar is rendered
    expect(screen.getByTestId('navbar')).toBeInTheDocument();

    // Check static content
    expect(screen.getByText(/Why Sell with Us\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Join a growing community of sellers who are thriving on our platform./i)).toBeInTheDocument();
    expect(screen.getByText(/Low Transaction Fees/i)).toBeInTheDocument();
    expect(screen.getByText(/24\/7 Customer Support/i)).toBeInTheDocument();
    expect(screen.getByText(/Global Reach/i)).toBeInTheDocument();
  });

  test('renders the Signup component by default', () => {
    render(<SellerAuth />);

    // Check if Signup component is rendered
    expect(screen.getByTestId('signup-component')).toBeInTheDocument();

    // Ensure Login component is not rendered
    expect(screen.queryByTestId('login-component')).not.toBeInTheDocument();
  });

  test('toggles to Login component when toggleAuthMode is called', () => {
    render(<SellerAuth />);

    // Check if Signup component is rendered initially
    expect(screen.getByTestId('signup-component')).toBeInTheDocument();

    // Simulate toggle to Login
    fireEvent.click(screen.getByText(/Switch to Login/i));

    // Check if Login component is rendered
    expect(screen.getByTestId('login-component')).toBeInTheDocument();

    // Ensure Signup component is not rendered
    expect(screen.queryByTestId('signup-component')).not.toBeInTheDocument();
  });

  test('toggles back to Signup component when toggleAuthMode is called again', () => {
    render(<SellerAuth />);

    // Simulate toggle to Login
    fireEvent.click(screen.getByText(/Switch to Login/i));

    // Check if Login component is rendered
    expect(screen.getByTestId('login-component')).toBeInTheDocument();

    // Simulate toggle back to Signup
    fireEvent.click(screen.getByText(/Switch to Signup/i));

    // Check if Signup component is rendered again
    expect(screen.getByTestId('signup-component')).toBeInTheDocument();

    // Ensure Login component is not rendered
    expect(screen.queryByTestId('login-component')).not.toBeInTheDocument();
  });
});