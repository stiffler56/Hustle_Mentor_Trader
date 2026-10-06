import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bot,
  Plus,
  Search,
  Send,
  Mic,
  Trash2,
  Menu,
  X,
  Loader2,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { useTradesContext } from '../data/TradesContext';
import { answerTradingQuestion } from '../utils/aiMentor';

export interface HustleMentorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  source?: 'ai' | 'local-fallback';
  evidence?: string[];
}

export interface HustleMentorConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: HustleMentorMessage[];
}

const STORAGE_KEY = 'hustle_mentor_conversations_v1';

const PRIMARY_PROMPT_CHIPS = [
  'Why am I losing?',
  "Where's my edge?",
  'Am I following my plan?',
  'How do I get better?',
];

const QUICK_QUESTION_CHIPS = [
  'Which setups have the highest win rate?',
  'What was my most profitable symbol?',
  "What's my best performing strategy?",
  'When do I trade best?',
  'Are there days I should avoid trading?',
];

function formatMessageContent(content: string) {
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-xs leading-relaxed text-[#E5E5E5]">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Heading detection
        if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          const text = trimmed.replace(/^#+\s*/, '');
          return (
            <h4 key={idx} className="text-sm font-bold text-[#FFFFFF] mt-3 mb-1 first:mt-0 tracking-wide">
              {text}
            </h4>
          );
        }

        // Bold line as sub-heading
        if (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.slice(2, -2).includes('**')) {
          return (
            <p key={idx} className="font-bold text-[#FFFFFF] text-xs mt-2 first:mt-0">
              {trimmed.slice(2, -2)}
            </p>
          );
        }

        // List item detection
        if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const itemText = trimmed.replace(/^[•\-*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-1.5 my-1">
              <span className="text-[#A0A0A0] text-[10px] mt-1 shrink-0">•</span>
              <span className="flex-1 text-[#E5E5E5]">
                {renderFormattedInline(itemText)}
              </span>
            </div>
          );
        }

        // Numbered list detection
        if (/^\d+\.\s/.test(trimmed)) {
          const numMatch = trimmed.match(/^(\d+\.)\s*(.*)$/);
          return (
            <div key={idx} className="flex items-start gap-2 pl-1.5 my-1">
              <span className="text-[#A0A0A0] text-xs font-mono shrink-0">{numMatch?.[1]}</span>
              <span className="flex-1 text-[#E5E5E5]">
                {renderFormattedInline(numMatch?.[2] || '')}
              </span>
            </div>
          );
        }

        // Italicized caveat or note
        if (trimmed.startsWith('*') && trimmed.endsWith('*')) {
          return (
            <p key={idx} className="text-[11px] text-[#A0A0A0] italic my-1.5">
              {trimmed.slice(1, -1)}
            </p>
          );
        }

        return (
          <p key={idx} className="text-[#E5E5E5]">
            {renderFormattedInline(line)}
          </p>
        );
      })}
    </div>
  );
}

function renderFormattedInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-[#FFFFFF]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function getConversationDateGroup(dateStr: string): 'Today' | 'Last 7 Days' | 'Earlier' {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

    if (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    ) {
      return 'Today';
    }
    if (diffDays <= 7) return 'Last 7 Days';
    return 'Earlier';
  } catch {
    return 'Earlier';
  }
}

export default function AIMentor() {
  const { trades } = useTradesContext();

  const [conversations, setConversations] = useState<HustleMentorConversation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    const defaultConv: HustleMentorConversation = {
      id: `conv-${Date.now()}`,
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    return [defaultConv];
  });

  const [activeConvId, setActiveConvId] = useState<string>(() => conversations[0]?.id || '');
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Save conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch {}
  }, [conversations]);

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConvId) || conversations[0];
  }, [conversations, activeConvId]);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, isLoading]);

  const handleCreateNewChat = () => {
    const newConv: HustleMentorConversation = {
      id: `conv-${Date.now()}`,
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
    setInputText('');
    setSidebarOpen(false);
  };

  const handleDeleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length === 0) {
        const fresh: HustleMentorConversation = {
          id: `conv-${Date.now()}`,
          title: 'New Conversation',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [],
        };
        setActiveConvId(fresh.id);
        return [fresh];
      }
      if (activeConvId === id) {
        setActiveConvId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!query || isLoading) return;

    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMsg: HustleMentorMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: query,
      createdAt: new Date().toISOString(),
    };

    // Update conversation with user message and generate title if first message
    const isFirstMessage = (activeConversation?.messages.length || 0) === 0;
    const newTitle = isFirstMessage ? query.slice(0, 32) : activeConversation.title;

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === activeConversation.id) {
          return {
            ...conv,
            title: newTitle,
            updatedAt: new Date().toISOString(),
            messages: [...conv.messages, userMsg],
          };
        }
        return conv;
      })
    );

    setIsLoading(true);

    try {
      const response = await answerTradingQuestion(query, trades);

      const assistantMsg: HustleMentorMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: response.answer,
        createdAt: new Date().toISOString(),
        source: response.source,
      };

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === activeConversation.id) {
            return {
              ...conv,
              updatedAt: new Date().toISOString(),
              messages: [...conv.messages, assistantMsg],
            };
          }
          return conv;
        })
      );
    } catch {
      const fallbackMsg: HustleMentorMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content:
          'I ran into an issue contacting the analysis engine. Please verify your connection or review your trade logs in the Journal.',
        createdAt: new Date().toISOString(),
        source: 'local-fallback',
      };

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === activeConversation.id) {
            return {
              ...conv,
              updatedAt: new Date().toISOString(),
              messages: [...conv.messages, fallbackMsg],
            };
          }
          return conv;
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(120, e.target.scrollHeight)}px`;
  };

  // Filtered & grouped conversation history
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const term = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(term) ||
        c.messages.some((m) => m.content.toLowerCase().includes(term))
    );
  }, [conversations, searchQuery]);

  const groupedConversations = useMemo(() => {
    const today: HustleMentorConversation[] = [];
    const last7: HustleMentorConversation[] = [];
    const earlier: HustleMentorConversation[] = [];

    filteredConversations.forEach((c) => {
      const group = getConversationDateGroup(c.updatedAt || c.createdAt);
      if (group === 'Today') today.push(c);
      else if (group === 'Last 7 Days') last7.push(c);
      else earlier.push(c);
    });

    return { today, last7, earlier };
  }, [filteredConversations]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#000000] text-[#FFFFFF] font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Internal Conversation Sidebar (Desktop 230px) ── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto h-full w-[230px] shrink-0 flex flex-col bg-[#050505] border-r border-[#242424] transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Area */}
        <div className="p-3.5 border-b border-[#242424] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#111111] border border-[#242424] flex items-center justify-center text-[#FFFFFF]">
              <Bot size={16} />
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-[#FFFFFF] leading-tight">
                HUSTLE MENTOR
              </h2>
              <p className="text-[9px] font-medium text-[#A0A0A0] leading-none mt-0.5">
                Your Personal Trading Coach
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-md text-[#A0A0A0] hover:text-[#FFFFFF] lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        {/* Actions & Search */}
        <div className="p-2.5 space-y-2 border-b border-[#242424]">
          <button
            type="button"
            onClick={handleCreateNewChat}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold text-[#FFFFFF] bg-[#111111] hover:bg-[#181818] border border-[#242424] transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>New Chat</span>
          </button>

          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#707070]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-8 pr-2.5 py-1.5 text-[11px] rounded-lg bg-[#0A0A0A] border border-[#242424] text-[#FFFFFF] placeholder:text-[#707070] outline-none focus:border-[#FFFFFF] transition-colors"
            />
          </div>
        </div>

        {/* Conversation History List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {/* Today Group */}
          {groupedConversations.today.length > 0 && (
            <div>
              <p className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-[#707070]">
                Today
              </p>
              <div className="space-y-0.5">
                {groupedConversations.today.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveConvId(c.id);
                      setSidebarOpen(false);
                    }}
                    className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      c.id === activeConversation?.id
                        ? 'bg-[#181818] text-[#FFFFFF]'
                        : 'text-[#A0A0A0] hover:bg-[#111111] hover:text-[#E5E5E5]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-1">
                      <MessageSquare size={12} className="shrink-0 opacity-60" />
                      <span className="truncate">{c.title || 'New Conversation'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteConversation(e, c.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#707070] hover:text-[#FFFFFF] transition-opacity cursor-pointer shrink-0"
                      title="Delete chat"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last 7 Days Group */}
          {groupedConversations.last7.length > 0 && (
            <div>
              <p className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-[#707070]">
                Last 7 Days
              </p>
              <div className="space-y-0.5">
                {groupedConversations.last7.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveConvId(c.id);
                      setSidebarOpen(false);
                    }}
                    className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      c.id === activeConversation?.id
                        ? 'bg-[#181818] text-[#FFFFFF]'
                        : 'text-[#A0A0A0] hover:bg-[#111111] hover:text-[#E5E5E5]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-1">
                      <MessageSquare size={12} className="shrink-0 opacity-60" />
                      <span className="truncate">{c.title || 'New Conversation'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteConversation(e, c.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#707070] hover:text-[#FFFFFF] transition-opacity cursor-pointer shrink-0"
                      title="Delete chat"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Earlier Group */}
          {groupedConversations.earlier.length > 0 && (
            <div>
              <p className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-[#707070]">
                Earlier
              </p>
              <div className="space-y-0.5">
                {groupedConversations.earlier.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveConvId(c.id);
                      setSidebarOpen(false);
                    }}
                    className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      c.id === activeConversation?.id
                        ? 'bg-[#181818] text-[#FFFFFF]'
                        : 'text-[#A0A0A0] hover:bg-[#111111] hover:text-[#E5E5E5]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-1">
                      <MessageSquare size={12} className="shrink-0 opacity-60" />
                      <span className="truncate">{c.title || 'New Conversation'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteConversation(e, c.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#707070] hover:text-[#FFFFFF] transition-opacity cursor-pointer shrink-0"
                      title="Delete chat"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-[#000000]">
        {/* Top Chat Bar (Mobile Toggle + Chat Title) */}
        <div className="h-11 border-b border-[#242424] px-4 flex items-center justify-between shrink-0 bg-[#000000]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-md text-[#A0A0A0] hover:text-[#FFFFFF]"
              title="Open history"
            >
              <Menu size={16} />
            </button>
            <span className="text-xs font-bold text-[#E5E5E5] truncate max-w-xs sm:max-w-md">
              {activeConversation?.title || 'New Conversation'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateNewChat}
              className="p-1 rounded-md text-[#A0A0A0] hover:text-[#FFFFFF] text-xs font-semibold flex items-center gap-1 transition-colors"
              title="New Chat"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </div>

        {/* ── Message History Stream or Empty State ── */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {activeConversation?.messages.length === 0 ? (
            /* Part 5: Centered Empty State */
            <div className="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-[#111111] border border-[#242424] flex items-center justify-center text-[#FFFFFF] mb-4">
                <Bot size={28} />
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-[#FFFFFF] tracking-tight mb-2">
                Hi, what should we analyze today?
              </h1>

              <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed mb-8 max-w-md">
                I’ll study your journal data to help you understand your edge, mistakes, risk, and execution.
              </p>

              {/* Part 7: Prompt Chips */}
              <div className="w-full space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {PRIMARY_PROMPT_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleSendMessage(chip)}
                      className="p-3 rounded-xl bg-[#0A0A0A] border border-[#242424] text-left text-xs font-semibold text-[#A0A0A0] hover:bg-[#181818] hover:border-[#FFFFFF] hover:text-[#FFFFFF] transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <span>{chip}</span>
                      <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#242424]/60">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#707070] mb-2 text-left">
                    Quick Evidence Checks
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_QUESTION_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleSendMessage(chip)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#0A0A0A] border border-[#242424] text-[11px] font-medium text-[#A0A0A0] hover:bg-[#181818] hover:border-[#FFFFFF] hover:text-[#FFFFFF] transition-all cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Part 8: Message Stream */
            <div className="max-w-2xl mx-auto space-y-6">
              {activeConversation?.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-[#111111] border border-[#242424] flex items-center justify-center text-[#FFFFFF] shrink-0 mt-0.5">
                      <Bot size={16} />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 transition-all ${
                      msg.role === 'user'
                        ? 'bg-[#181818] border border-[#242424] text-[#FFFFFF] rounded-tr-sm'
                        : 'bg-[#0A0A0A] border border-[#242424] text-[#E5E5E5] rounded-tl-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      formatMessageContent(msg.content)
                    ) : (
                      <p className="text-xs leading-relaxed text-[#FFFFFF] whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    )}

                    {/* Source tag on assistant messages */}
                    {msg.role === 'assistant' && (
                      <div className="mt-3 pt-2.5 border-t border-[#242424] flex items-center justify-between text-[10px] text-[#A0A0A0]">
                        <span>
                          {msg.source === 'ai'
                            ? 'Hustle Mentor AI • Based on your journal'
                            : 'Local evidence analysis'}
                        </span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-[#111111] border border-[#242424] flex items-center justify-center text-[#FFFFFF] shrink-0 mt-0.5">
                    <Bot size={16} />
                  </div>
                  <div className="rounded-2xl p-4 bg-[#0A0A0A] border border-[#242424] text-xs text-[#A0A0A0] flex items-center gap-2.5">
                    <Loader2 size={14} className="animate-spin text-[#FFFFFF]" />
                    <span>Analyzing your journal data...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Part 6: Centered Question Composer ── */}
        <div className="p-4 border-t border-[#242424] bg-[#000000] shrink-0">
          <div className="max-w-2xl mx-auto">
            <div className="relative rounded-2xl bg-[#111111] border border-[#242424] focus-within:border-[#FFFFFF] transition-all p-2 flex items-end gap-2 shadow-sm">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask Hustle Mentor about your trading..."
                className="flex-1 bg-transparent border-0 text-xs text-[#FFFFFF] placeholder:text-[#707070] outline-none resize-none px-2 py-1.5 min-h-[32px] max-h-[120px]"
              />

              <div className="flex items-center gap-1 shrink-0 pb-0.5">
                <div
                  className="p-2 text-[#707070] rounded-lg cursor-not-allowed opacity-50"
                  title="Voice dictation"
                >
                  <Mic size={15} />
                </div>

                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isLoading}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    inputText.trim() && !isLoading
                      ? 'bg-[#FFFFFF] text-[#000000] hover:bg-[#E5E5E5]'
                      : 'bg-[#181818] text-[#707070] cursor-not-allowed'
                  }`}
                  title="Send question"
                >
                  {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </div>

            {/* Micro Prompt suggestion row under composer when chat has messages */}
            {activeConversation?.messages.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2 text-[10px] text-[#A0A0A0]">
                {PRIMARY_PROMPT_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleSendMessage(chip)}
                    className="px-2 py-0.5 rounded-md bg-[#0A0A0A] border border-[#242424] hover:border-[#FFFFFF] hover:text-[#FFFFFF] whitespace-nowrap transition-colors cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
