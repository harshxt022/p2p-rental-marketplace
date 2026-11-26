import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Send, MessageSquare, BadgeCheck, ArrowUpRight, MapPin } from 'lucide-react';
import api from '../services/api';
import { getImageUrl } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';

export default function ChatsPage() {
  const { user, openAuthModal } = useAuth();
  const socket = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(searchParams.get('id') || '');

  useEffect(() => {
    const queryId = searchParams.get('id');
    if (queryId) {
      setActiveId(queryId);
    }
  }, [searchParams]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchConversations = async () => {
      try {
        const { data } = await api.get('/chats');
        const list = data.conversations || [];
        setConversations(list);
        if (!activeId && list.length > 0) {
          setActiveId(list[0]._id);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (!activeId || !user) return;
    const fetchMessages = async () => {
      try {
        const { data } = await api.get(`/chats/${activeId}/messages`);
        setMessages(data.messages || []);
      } catch {
        setMessages([]);
      }
    };
    fetchMessages();

    if (socket) {
      socket.emit('join_chat', activeId);
      return () => {
        socket.emit('leave_chat', activeId);
      };
    }
  }, [activeId, user, socket]);

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = ({ conversationId, message }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversationId
            ? { ...c, lastMessage: message.text, updatedAt: message.createdAt }
            : c
        )
      );
      if (conversationId === activeId) {
        setMessages((prev) => (prev.some((m) => m._id === message._id) ? prev : [...prev, message]));
      }
    };
    socket.on('new_message', handleNewMessage);
    return () => socket.off('new_message', handleNewMessage);
  }, [socket, activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeId) return;
    const content = text.trim();
    setText('');
    try {
      const { data } = await api.post(`/chats/${activeId}/messages`, { text: content });
      const msg = data.message;
      setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeId ? { ...c, lastMessage: msg.text, updatedAt: msg.createdAt } : c
        )
      );
    } catch {
      setText(content);
    }
  };

  const activeConv = conversations.find((c) => c._id === activeId);
  const otherUser = activeConv?.participants?.find((p) => p._id !== user?._id);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-24 pb-6 max-w-7xl w-full mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop">
        {!user ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-12 text-center mt-4">
            <h1 className="text-headline-lg text-on-surface">Messages</h1>
            <p className="text-body-md text-on-surface-variant mt-2 mb-5">
              Sign in to chat with item owners and renters in real time.
            </p>
            <button
              type="button"
              onClick={openAuthModal}
              className="px-6 py-2.5 rounded-full bg-primary-container text-on-primary text-label-md"
            >
              Login / Sign Up
            </button>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container shadow-[0_1px_3px_rgba(41,37,36,0.04)] grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-8rem)] overflow-hidden">
            <aside className="md:col-span-4 border-r border-surface-container flex flex-col overflow-hidden">
              <div className="p-4 border-b border-surface-container">
                <h1 className="text-headline-md text-on-surface">Chats</h1>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-surface-container">
                {loading ? (
                  <p className="p-4 text-body-md text-on-surface-variant">Loading chats...</p>
                ) : conversations.length === 0 ? (
                  <p className="p-6 text-body-md text-on-surface-variant text-center">
                    No conversations yet. Click "Chat with Owner" on any item to start.
                  </p>
                ) : (
                  conversations.map((conv) => {
                    const peer = conv.participants?.find((p) => p._id !== user._id);
                    const selected = conv._id === activeId;
                    return (
                      <button
                        key={conv._id}
                        type="button"
                        onClick={() => {
                          setActiveId(conv._id);
                          setSearchParams({ id: conv._id });
                        }}
                        className={`w-full text-left p-4 flex items-center gap-3 transition-colors ${
                          selected ? 'bg-primary-fixed/40' : 'hover:bg-surface-container-low'
                        }`}
                      >
                        <div className="w-11 h-11 rounded-xl bg-surface-container overflow-hidden shrink-0 flex items-center justify-center">
                          {conv.item?.images?.[0] ? (
                            <img
                              src={getImageUrl(conv.item.images[0])}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <MessageSquare className="w-5 h-5 text-outline" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <p className="text-label-md text-on-surface truncate">
                              {peer?.name || 'Peer'}
                            </p>
                            {peer?.isVerified && (
                              <BadgeCheck className="w-3.5 h-3.5 text-secondary shrink-0" />
                            )}
                          </div>
                          <p className="text-body-sm text-primary truncate">{conv.item?.title}</p>
                          <p className="text-body-sm text-on-surface-variant truncate">
                            {conv.lastMessage || 'Start chatting...'}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            <section className="md:col-span-8 flex flex-col overflow-hidden">
              {!activeConv ? (
                <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant p-8">
                  <MessageSquare className="w-12 h-12 text-outline mb-3" />
                  <p className="text-headline-sm text-on-surface">Select a conversation</p>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-surface-container flex items-center justify-between bg-surface-container-low">
                    <div>
                      <p className="text-headline-sm text-on-surface flex items-center gap-1.5">
                        {otherUser?.name}
                        {otherUser?.isVerified && <BadgeCheck className="w-4 h-4 text-secondary" />}
                      </p>
                      {activeConv.item?._id ? (
                        <Link
                          to={`/item/${activeConv.item._id}`}
                          className="text-body-sm text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <span>
                            {activeConv.item.title} • ₹{activeConv.item.dailyRate}/day
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <p className="text-body-sm text-on-surface-variant">
                          {activeConv.item?.title} • ₹{activeConv.item?.dailyRate}/day
                        </p>
                      )}
                    </div>
                  </div>

                  {activeConv.item?._id && (
                    <Link
                      to={`/item/${activeConv.item._id}`}
                      className="mx-4 mt-3 p-3 rounded-2xl bg-surface-container-low border border-surface-container flex items-center justify-between gap-3 hover:border-primary-container transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-surface-container overflow-hidden shrink-0 flex items-center justify-center">
                          {activeConv.item.images?.[0] ? (
                            <img
                              src={getImageUrl(activeConv.item.images[0])}
                              alt={activeConv.item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <MessageSquare className="w-5 h-5 text-outline" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-label-md text-on-surface truncate">
                            {activeConv.item.title}
                          </p>
                          <p className="text-body-sm text-on-surface-variant flex items-center gap-2">
                            <span className="font-semibold text-on-surface">
                              ₹{activeConv.item.dailyRate}/day
                            </span>
                            {activeConv.item.city && (
                              <span className="inline-flex items-center gap-0.5">
                                <MapPin className="w-3 h-3 text-primary-container" />
                                {activeConv.item.city}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-surface-container-lowest border border-outline-variant text-label-sm text-primary shrink-0">
                        <span>View Product</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </Link>
                  )}

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
                    {messages.map((msg) => {
                      const mine = (msg.sender?._id || msg.sender) === user._id;
                      return (
                        <div
                          key={msg._id}
                          className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-body-md ${
                              mine
                                ? 'bg-primary-container text-on-primary rounded-br-sm'
                                : 'bg-surface-container-lowest text-on-surface border border-surface-container rounded-bl-sm'
                            }`}
                          >
                            <p>{msg.text}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>

                  <form
                    onSubmit={handleSend}
                    className="p-3 border-t border-surface-container bg-surface-container-lowest flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Write a message..."
                      className="flex-1 px-4 py-2.5 rounded-full bg-surface-container-low border border-surface-container text-body-md focus:outline-none focus:border-primary-container"
                    />
                    <button
                      type="submit"
                      className="w-11 h-11 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:brightness-95"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
