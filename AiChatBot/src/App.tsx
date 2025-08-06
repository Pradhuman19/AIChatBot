import React, { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const API_KEY = import.meta.env.VITE_API_GENERATIVE_LANGUAGE_CLIENT;
// const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;

interface ChatEntry {
  type: "question" | "answer";
  content: string;
}

const App: React.FC = () => {
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [question, setQuestion] = useState<string>("");
  const [generatingAnswer, setGeneratingAnswer] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, generatingAnswer]);

  const generateAnswer = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!question.trim()) return;
    setGeneratingAnswer(true);
    const currentQuestion = question;
    setQuestion("");
    setChatHistory((prev) => [...prev, { type: "question", content: currentQuestion }]);
    
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: currentQuestion }] }],
        })
      });
      
      const data = await response.json();
      console.log(data);
      const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry - Something went wrong. Please try again!";
      
      setChatHistory((prev) => [...prev, { type: "answer", content: aiResponse }]);
    } catch (error) {
      console.error("Error fetching response:", error);
      setChatHistory((prev) => [...prev, { type: "answer", content: "Sorry - Something went wrong. Please try again!" }]);
    }
    setGeneratingAnswer(false);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>AI ChatBot</h1>
      </header>
      <div ref={chatContainerRef} className="chat-container">
        {chatHistory.length === 0 ? (
          <p className="chat-placeholder">Start a conversation by asking a question!</p>
        ) : (
          chatHistory.map((chat, index) => (
            <div key={index} className={`chat-bubble ${chat.type}`}>
              <ReactMarkdown>{chat.content}</ReactMarkdown>
            </div>
          ))
        )}
        {generatingAnswer && <div className="chat-bubble answer">Thinking...</div>}
      </div>
      <form onSubmit={generateAnswer} className="chat-form">
        <textarea
          required
          className="chat-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything..."
          rows={2}
          onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              generateAnswer(e as unknown as FormEvent<HTMLFormElement>);
            }
          }}
        ></textarea>
        <button type="submit" className="chat-submit" disabled={generatingAnswer}>Send</button>
      </form>
    </div>
  );
};

export default App;