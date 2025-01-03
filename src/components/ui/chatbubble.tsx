import { ChatRole } from "@/app/types";

interface ChatBubbleProps {
    content: string;
    role: ChatRole;
}
const ChatBubble:React.FC<ChatBubbleProps> = ({ role, content }) => {
    const isUser = role === ChatRole.USER;
    
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}>
        <div className={`relative max-w-lg ${isUser ? 'order-2' : 'order-1'}`}>
          {/* Message bubble */}
          <div 
            className={`
              px-4 py-3 rounded-2xl 
              ${isUser ? 
                'bg-background text-white rounded-br-sm' : 
                'bg-gray-100 text-gray-800 rounded-bl-sm'
              }
              transition-all duration-200 ease-in-out
              hover:shadow-lg
            `}
          >
            <p className="text-sm font-normal leading-relaxed">{content}</p>
          </div>
        </div>
      </div>
    );
  };
  
export default ChatBubble;