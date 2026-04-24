import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversationsApi } from '@/api/conversations.api'
import { Search, Send, X, MessageSquare, ArrowLeft } from 'lucide-react'
import { PageLoader } from '@/components/ui/Spinner'
import Spinner from '@/components/ui/Spinner'
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'
import { io, Socket } from 'socket.io-client'
import { tokenCookie } from '@/lib/cookie'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

export default function ConversationList() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [selectedConv, setSelectedConv] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [onlineGuests, setOnlineGuests] = useState<Set<string>>(new Set())
  const socketRef = useRef<Socket | null>(null)
  const dSearch = useDebounce(search, 400)

  // Socket for online status + realtime messages
  useEffect(() => {
    const token = tokenCookie.getAccessToken()
    if (!token) return

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
    })

    socket.on('connect', () => {
      socket.emit('order:subscribe')
    })

    socket.on('guest:online', (data: { conversationId: string }) => {
      setOnlineGuests((prev) => new Set([...prev, data.conversationId]))
    })

    socket.on('guest:offline', (data: { conversationId: string }) => {
      setOnlineGuests((prev) => {
        const next = new Set(prev)
        next.delete(data.conversationId)
        return next
      })
    })

    // Realtime new message → refetch
    socket.on('chat:new-conversation', () => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
    })

    socket.on('chat:new-message', (data: { conversationId: string }) => {
      qc.invalidateQueries({ queryKey: ['conversation-messages', data.conversationId] })
    })

    socketRef.current = socket
    return () => { socket.disconnect(); socketRef.current = null }
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['conversations', dSearch, status],
    queryFn: () => conversationsApi.list({ search: dSearch || undefined, status: status || undefined }),
  })
  const { data: messagesData, isLoading: loadingMessages } = useQuery({
    queryKey: ['conversation-messages', selectedConv?.id],
    queryFn: () => conversationsApi.getMessages(selectedConv.id),
    enabled: !!selectedConv,
    refetchInterval: 5000,
  })

  const closeMut = useMutation({
    mutationFn: (id: string) => conversationsApi.close(id),
    onSuccess: () => { toast.success('Đã đóng cuộc trò chuyện'); qc.invalidateQueries({ queryKey: ['conversations'] }); setSelectedConv(null) },
  })
  const sendMut = useMutation({
    mutationFn: (msg: string) => conversationsApi.sendMessage(selectedConv.id, { message: msg }),
    onSuccess: () => { setMessage(''); qc.invalidateQueries({ queryKey: ['conversation-messages', selectedConv?.id] }) },
  })
  const reopenMut = useMutation({
    mutationFn: (id: string) => conversationsApi.reopen(id),
    onSuccess: () => {
      toast.success('Đã mở lại cuộc hội thoại')
      qc.invalidateQueries({ queryKey: ['conversations'] })
      setSelectedConv((prev: any) => prev ? { ...prev, status: 'open' } : null)
    },
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const conversations: any[] = data?.data?.items || data?.data || []
  const allMessages: any[] = messagesData?.data?.items || messagesData?.data || []
  const messages = allMessages.filter((m: any) => m.type !== 'system')

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Hỗ trợ khách hàng</h1>
      </div>

      <div className="flex gap-4 h-[calc(100vh-200px)] flex-col lg:flex-row">
        {/* Conversation List - ẩn trên mobile khi đang xem chat */}
        <div className={cn(
          'lg:w-80 flex-shrink-0 card flex flex-col',
          selectedConv ? 'hidden lg:flex' : 'flex'
        )}>
          <div className="p-3 border-b border-gray-100 dark:border-gray-700/50 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-8 text-sm h-10" placeholder="Tìm kiếm..." />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="input text-sm h-10">
              <option value="">Tất cả trạng thái</option>
              <option value="open">Đang mở</option>
              <option value="closed">Đã đóng</option>
            </select>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/30">
            {isLoading ? (
              <div className="p-4 text-center">
                <Spinner className="w-5 h-5 text-gray-400 dark:text-gray-500 mx-auto" />
              </div>
            ) : conversations.map((c: any) => (
              <button key={c.id} onClick={() => setSelectedConv(c)}
                className={cn(
                  'w-full text-left px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors',
                  selectedConv?.id === c.id && 'bg-primary-50 dark:bg-primary-900/20'
                )}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {onlineGuests.has(c.id) && <span className="w-2.5 h-2.5 bg-green-500 rounded-full shrink-0 ring-2 ring-white dark:ring-gray-900" />}
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{c.guestName || c.subject || 'Khách hàng'}</p>
                  </div>
                  <span className={`badge text-xs flex-shrink-0 ${getStatusColor(c.status)}`}>{getStatusLabel(c.status)}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.guestPhone || ''}{c.guestEmail ? ` · ${c.guestEmail}` : ''}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(c.updatedAt)}</p>
              </button>
            ))}
            {!conversations.length && !isLoading && (
              <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm animate-fade-in">
                Không có cuộc trò chuyện
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={cn(
          'flex-1 card flex flex-col overflow-hidden',
          !selectedConv ? 'hidden lg:flex' : 'flex'
        )}>
          {!selectedConv ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 animate-fade-in">
              <div className="text-center">
                <MessageSquare size={40} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p>Chọn cuộc trò chuyện</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700/50 gap-3">
                {/* Nút quay lại trên mobile */}
                <button
                  onClick={() => setSelectedConv(null)}
                  className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{selectedConv.guestName || selectedConv.subject || 'Khách hàng'}</p>
                    {onlineGuests.has(selectedConv.id) ? (
                      <span className="flex items-center gap-1 text-[11px] text-green-600 font-medium shrink-0">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Online
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400 shrink-0">Offline</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{selectedConv.guestPhone || ''}{selectedConv.guestEmail ? ` · ${selectedConv.guestEmail}` : ''}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {selectedConv.status === 'open' ? (
                    <button onClick={() => closeMut.mutate(selectedConv.id)} disabled={closeMut.isPending} className="btn-secondary btn-sm">
                      <X size={14} /> <span className="hidden sm:inline">Đóng</span>
                    </button>
                  ) : (
                    <button onClick={() => reopenMut.mutate(selectedConv.id)} disabled={reopenMut.isPending} className="btn-primary btn-sm">
                      <MessageSquare size={14} /> <span className="hidden sm:inline">Mở lại</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                {loadingMessages ? (
                  <div className="text-center">
                    <Spinner className="w-5 h-5 text-gray-400 dark:text-gray-500 mx-auto" />
                  </div>
                ) : (
                  <>
                    {messages.map((m: any) => {
                      const isAdmin = !!m.senderUserId || !!m.senderUser
                      return (
                        <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                          <div className={cn(
                            'max-w-[85%] sm:max-w-xs lg:max-w-md rounded-2xl px-4 py-2.5',
                            isAdmin
                              ? 'bg-primary-600 text-white rounded-br-sm'
                              : 'bg-gray-100 dark:bg-gray-700/60 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                          )}>
                            {!isAdmin && <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-0.5">{selectedConv?.guestName || 'Khách'}</p>}
                            <p className="text-sm">{m.message || m.content}</p>
                            <p className={`text-xs mt-1 ${isAdmin ? 'text-primary-200' : 'text-gray-400 dark:text-gray-500'}`}>{formatDate(m.createdAt)}</p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              {selectedConv.status === 'open' && (
                <div className="p-3 sm:p-5 border-t border-gray-100 dark:border-gray-700/50 flex gap-2">
                  <input value={message} onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && message) { e.preventDefault(); sendMut.mutate(message) } }}
                    className="input flex-1" placeholder="Nhập tin nhắn..." />
                  <button onClick={() => sendMut.mutate(message)} disabled={sendMut.isPending || !message}
                    className="btn-primary px-4 min-w-[44px] min-h-[44px]">
                    {sendMut.isPending ? <Spinner className="w-4 h-4" /> : <Send size={16} />}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
