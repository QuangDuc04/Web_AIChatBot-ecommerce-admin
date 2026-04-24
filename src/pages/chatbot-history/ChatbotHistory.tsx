import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { chatbotHistoryApi } from '@/api/chatbotHistory.api'
import { Search, Bot, ArrowLeft, User, Clock, MessageSquare, Hash } from 'lucide-react'
import { PageLoader } from '@/components/ui/Spinner'
import Spinner from '@/components/ui/Spinner'
import Pagination from '@/components/ui/Pagination'
import { formatDate } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'

export default function ChatbotHistory() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const dSearch = useDebounce(search, 400)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['chatbot-sessions', dSearch, page],
    queryFn: () => chatbotHistoryApi.list({ search: dSearch || undefined, page, limit: 20 }),
  })

  const { data: detail, isLoading: loadingDetail } = useQuery({
    queryKey: ['chatbot-session', selectedId],
    queryFn: () => chatbotHistoryApi.get(selectedId!),
    enabled: !!selectedId,
  })

  const sessions: any[] = data?.data?.sessions || data?.sessions || []
  const pagination = data?.data?.pagination || data?.pagination || { page: 1, totalPages: 1, total: 0, limit: 20 }
  const session = detail?.data || detail
  const messages: any[] = session?.messages || []

  // Reset page on search change
  useEffect(() => { setPage(1) }, [dSearch])

  // Scroll to bottom on messages load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Chatbot AI - Lich su</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Xem lai lich su tro chuyen cua khach hang voi AI</p>
      </div>

      <div className="flex gap-4 h-[calc(100vh-220px)] flex-col lg:flex-row">
        {/* Session List */}
        <div className={cn(
          'lg:w-96 flex-shrink-0 card flex flex-col',
          selectedId ? 'hidden lg:flex' : 'flex'
        )}>
          <div className="p-3 border-b border-gray-100 dark:border-gray-700/50">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-8 text-sm h-10"
                placeholder="Tim theo clientId, ten, SDT..."
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/30">
            {isLoading ? (
              <div className="p-8 text-center"><Spinner className="w-5 h-5 text-gray-400 mx-auto" /></div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm animate-fade-in">
                Khong co lich su chat
              </div>
            ) : (
              sessions.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={cn(
                    'w-full text-left px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors',
                    selectedId === s.id && 'bg-primary-50 dark:bg-primary-900/20'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        {s.customer ? (
                          <User size={14} className="text-primary-600 dark:text-primary-400" />
                        ) : (
                          <Bot size={14} className="text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {s.customer?.name || 'Khach an danh'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {s.customer?.phone || s.clientId?.slice(0, 8) + '...'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <MessageSquare size={10} />
                        {s.messageCount}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                    <Clock size={10} />
                    {s.lastMessageAt ? formatDate(s.lastMessageAt) : formatDate(s.createdAt)}
                  </p>
                </button>
              ))
            )}
          </div>

          {pagination.totalPages > 1 && (
            <div className="border-t border-gray-100 dark:border-gray-700/50 px-2 py-1">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pagination.limit}
                onChange={setPage}
              />
            </div>
          )}
        </div>

        {/* Chat Detail */}
        <div className={cn(
          'flex-1 card flex flex-col overflow-hidden',
          !selectedId ? 'hidden lg:flex' : 'flex'
        )}>
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 animate-fade-in">
              <div className="text-center">
                <Bot size={40} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p>Chon mot phien chat de xem chi tiet</p>
              </div>
            </div>
          ) : loadingDetail ? (
            <div className="flex-1 flex items-center justify-center"><PageLoader /></div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700/50">
                <button
                  onClick={() => setSelectedId(null)}
                  className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                  <Bot size={18} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {session?.customer?.name || 'Khach an danh'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    {session?.customer?.phone && <span>{session.customer.phone}</span>}
                    <span className="flex items-center gap-1">
                      <Hash size={10} />{session?.clientId?.slice(0, 12)}...
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={10} />{session?.messageCount || messages.length} tin nhan
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-gray-50/50 dark:bg-gray-900/30">
                {messages.map((m: any) => {
                  const isUser = m.role === 'user'
                  return (
                    <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={cn(
                        'max-w-[85%] sm:max-w-md lg:max-w-lg rounded-2xl px-4 py-2.5',
                        isUser
                          ? 'bg-primary-600 text-white rounded-br-sm'
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm shadow-sm border border-gray-100 dark:border-gray-700/50'
                      )}>
                        {!isUser && (
                          <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-0.5 flex items-center gap-1">
                            <Bot size={10} /> AI
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                        <p className={`text-[10px] mt-1 ${isUser ? 'text-primary-200' : 'text-gray-400 dark:text-gray-500'}`}>
                          {formatDate(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
