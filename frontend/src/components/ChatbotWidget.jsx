import React, { useState } from 'react';
import api from '../api/client';
import './ChatbotWidget.css';

const ChatbotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen && messages.length === 0) {
            // Add initial greeting when opening for the first time
            setMessages([{ sender: 'bot', text: 'Hello! How can I help you today?' }]);
        }
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (input.trim() === '' || isLoading) return;

        const userMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await api.post('/chatbot/message', { message: input });
            const botMessage = { sender: 'bot', text: response.data.message };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorMessage = { sender: 'bot', text: 'Sorry, I am having trouble connecting. Please try again later.' };
            setMessages(prev => [...prev, errorMessage]);
            console.error('Chatbot API error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chatbot-widget">
            <button className="chatbot-toggle-btn" onClick={toggleChat}>
                {isOpen ? '✖' : '💬'}
            </button>
            
            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <h2>Z-Store Assistant</h2>
                        <button onClick={toggleChat} className="close-btn">✖</button>
                    </div>
                    <div className="chatbot-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.sender}`}>
                                {msg.text}
                            </div>
                        ))}
                        {isLoading && <div className="message bot">...</div>}
                    </div>
                    <form className="chatbot-input-form" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Ask me something..."
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading}>Send</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ChatbotWidget;
