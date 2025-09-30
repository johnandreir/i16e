import React, { useState } from 'react';
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChatbotProps {
  chatUrl?: string;
}

const Chatbot: React.FC<ChatbotProps> = ({ 
  chatUrl = "http://localhost:5678/webhook/850736dd-ddac-4e8d-9ea4-799c64607835/chat" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const toggleChatbot = () => {
    if (isOpen) {
      setIsOpen(false);
      setIsMinimized(false);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const minimizeChatbot = () => {
    setIsMinimized(true);
  };

  const restoreChatbot = () => {
    setIsMinimized(false);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <Button
          onClick={toggleChatbot}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 bg-primary hover:bg-primary/90 text-primary-foreground"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className={`fixed z-50 shadow-2xl border-2 border-primary/20 transition-all duration-300 ${
          isMinimized 
            ? 'bottom-6 right-6 w-80 h-16' 
            : 'bottom-6 right-6 w-96 h-[600px]'
        }`} style={{ background: 'hsl(var(--card))' }}>
          {/* Chat Header */}
          <CardHeader className={`flex-row items-center justify-between space-y-0 bg-primary text-primary-foreground rounded-t-lg border-b-2 border-primary/20 ${
            isMinimized ? 'p-3' : 'p-4'
          }`}>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              i16e Assistant
            </CardTitle>
            <div className="flex items-center space-x-1">
              {!isMinimized && (
                <Button
                  onClick={minimizeChatbot}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              )}
              {isMinimized && (
                <Button
                  onClick={restoreChatbot}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                onClick={toggleChatbot}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Minimized State */}
          {isMinimized && (
            <CardContent className="p-3">
              <div className="text-center text-xs text-muted-foreground">
                <p>Chatbot minimized</p>
              </div>
            </CardContent>
          )}

          {/* Chat Content */}
          {!isMinimized && (
            <CardContent className="flex-1 p-0 overflow-hidden rounded-b-lg" style={{ height: '532px' }}>
              {/* Chat Messages Area */}
              <iframe
                src={chatUrl}
                className="w-full h-full border-0 rounded-b-lg"
                title="IntelliPerformance Chatbot"
                allow="microphone"
                style={{
                  background: 'hsl(var(--background))',
                  colorScheme: 'light',
                  minHeight: '532px',
                  fontFamily: 'inherit',
                }}
              />
            </CardContent>
          )}
        </Card>
      )}
    </>
  );
};

export default Chatbot;