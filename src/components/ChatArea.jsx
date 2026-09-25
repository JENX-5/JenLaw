import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { renderMarkdown, formatTime } from '../lib/utils';
import { Bot, User, Send } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Memoized single message bubble.
 * renderMarkdown (marked.parse + DOMPurify) is only re-called when
 * the message content changes, not on every parent re-render.
 */
const ChatMessage = React.memo(function ChatMessage({ msg }) {
  const html = useMemo(() => renderMarkdown(msg.content), [msg.content]);
  return (
    <div className={`chat-message ${msg.role === 'model' ? 'ai' : 'user'}`}>
      <div className="chat-avatar">
        {msg.role === 'model' ? <Bot size={18} /> : <User size={18} />}
      </div>
      <div className="chat-content">
        <div
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <div className="chat-time">{formatTime(msg.timestamp || new Date())}</div>
    </div>
  );
});

ChatMessage.propTypes = {
  msg: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    role: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    timestamp: PropTypes.instanceOf(Date)
  }).isRequired
};

/**
 * ChatArea renders the conversation log, loading indicator,
 * and the message input form. All handlers are memoized to
 * prevent unnecessary child re-renders.
 */
const ChatArea = React.memo(function ChatArea({ 
  messages, 
  isLoading, 
  onSendMessage,
  children
}) {
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState('');

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    onSendMessage(inputValue);
    setInputValue('');
  }, [inputValue, isLoading, onSendMessage]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);

  return (
    <div className="chat-area" aria-label="Chat interface">
      <div className="chat-messages" id="chat-messages" role="log" aria-live="polite" aria-label="Conversation">
        
        {messages.length === 0 && (
          <div className="chat-welcome">
            <div className="chat-welcome-logo"><img src="/jenlaw_logo.jpg" alt="JenLaw Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '18px' }} /></div>
            <h2>How can I help you?</h2>
            <p>Load a document from the left panel to begin analysis, or ask a general legal question.</p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}

        {isLoading && (
          <div className="chat-message ai loading-message">
            <div className="chat-avatar">
              <Bot size={18} />
            </div>
            <div className="chat-content">
              <div className="typing-indicator" aria-label="AI is thinking">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-wrapper">
        {children}
        <form className="chat-input-container" onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            className="chat-input"
            id="chat-input"
            rows="1"
            placeholder="Ask about your document... e.g. 'What are my key obligations?'"
            aria-label="Message input"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          ></textarea>
          
          <div className="chat-input-actions">
            <button 
              type="submit" 
              className="chat-send-btn" 
              disabled={!inputValue.trim() || isLoading}
              title="Send message"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
        <div className="chat-footer">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F4A261" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{marginRight: '6px', verticalAlign: 'middle'}}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          Legal information only. Not legal advice — consult a qualified lawyer for important decisions.
        </div>
      </div>
    </div>
  );
});

ChatArea.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    role: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    timestamp: PropTypes.instanceOf(Date)
  })).isRequired,
  isLoading: PropTypes.bool.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  children: PropTypes.node
};

export default ChatArea;
