import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatArea from './ChatArea';

describe('ChatArea', () => {
  const defaultProps = {
    messages: [],
    isLoading: false,
    onSendMessage: vi.fn(),
  };

  it('renders welcome message when no messages exist', () => {
    render(<ChatArea {...defaultProps} />);
    expect(screen.getByText('How can I help you?')).toBeInTheDocument();
  });

  it('renders messages correctly', () => {
    const messages = [
      { id: '1', role: 'user', content: 'Hello', timestamp: new Date() },
      { id: '2', role: 'model', content: '**Hi there**', timestamp: new Date() },
    ];
    render(<ChatArea {...defaultProps} messages={messages} />);
    
    // User message rendered
    expect(screen.getByText('Hello')).toBeInTheDocument();
    // AI message rendered (markdown converted)
    expect(screen.getByText('Hi there')).toBeInTheDocument();
  });

  it('shows typing indicator when loading', () => {
    render(<ChatArea {...defaultProps} isLoading={true} />);
    expect(screen.getByLabelText('AI is thinking')).toBeInTheDocument();
  });

  it('hides typing indicator when not loading', () => {
    render(<ChatArea {...defaultProps} isLoading={false} />);
    expect(screen.queryByLabelText('AI is thinking')).not.toBeInTheDocument();
  });

  it('calls onSendMessage on form submit', () => {
    const handleSend = vi.fn();
    render(<ChatArea {...defaultProps} onSendMessage={handleSend} />);
    
    const input = screen.getByLabelText('Message input');
    fireEvent.change(input, { target: { value: 'Test message' } });
    
    const sendBtn = screen.getByLabelText('Send message');
    fireEvent.click(sendBtn);
    
    expect(handleSend).toHaveBeenCalledWith('Test message');
  });

  it('clears input after sending', () => {
    render(<ChatArea {...defaultProps} onSendMessage={vi.fn()} />);
    
    const input = screen.getByLabelText('Message input');
    fireEvent.change(input, { target: { value: 'Test message' } });
    
    fireEvent.click(screen.getByLabelText('Send message'));
    
    expect(input.value).toBe('');
  });

  it('disables input and send button when loading', () => {
    render(<ChatArea {...defaultProps} isLoading={true} />);
    
    const input = screen.getByLabelText('Message input');
    expect(input).toBeDisabled();
    
    const sendBtn = screen.getByLabelText('Send message');
    expect(sendBtn).toBeDisabled();
  });

  it('does not send empty messages', () => {
    const handleSend = vi.fn();
    render(<ChatArea {...defaultProps} onSendMessage={handleSend} />);
    
    const sendBtn = screen.getByLabelText('Send message');
    fireEvent.click(sendBtn);
    
    expect(handleSend).not.toHaveBeenCalled();
  });

  it('renders children (QuickActions slot)', () => {
    render(
      <ChatArea {...defaultProps}>
        <div data-testid="child-component">Quick Actions</div>
      </ChatArea>
    );
    expect(screen.getByTestId('child-component')).toBeInTheDocument();
  });

  it('displays the legal disclaimer footer', () => {
    render(<ChatArea {...defaultProps} />);
    expect(screen.getByText(/Not legal advice/i)).toBeInTheDocument();
  });
});
