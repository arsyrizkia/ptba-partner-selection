"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MessageSquare, Send, Loader2, ArrowLeft, CheckCircle2, Clock, CheckCheck, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { useSocket } from "@/lib/hooks/use-socket";
import { api, fetchWithAuth } from "@/lib/api/client";
import { formatDate, formatChatTime, formatChatDaySeparator, isSameDay } from "@/lib/utils/format";

interface Question {
  id: string;
  subject: string;
  category: string;
  status: "open" | "answered" | "closed";
  created_at: string;
  updated_at: string;
  project_id: string;
  partner_name?: string;
}

interface Message {
  id: string;
  sender_id: string;
  sender_type: "mitra" | "admin";
  sender_name?: string;
  message: string;
  image_url?: string | null;
  created_at: string;
}

const CAT_LABELS: Record<string, string> = {
  umum: "Umum",
  pendaftaran: "Pendaftaran",
  evaluasi: "Evaluasi",
  dokumen: "Dokumen",
  keuangan: "Keuangan",
};

const CAT_COLORS: Record<string, string> = {
  umum: "bg-gray-100 text-gray-700",
  pendaftaran: "bg-blue-100 text-blue-700",
  evaluasi: "bg-purple-100 text-purple-700",
  dokumen: "bg-teal-100 text-teal-700",
  keuangan: "bg-amber-100 text-amber-700",
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: any }> = {
    open: { label: "Terbuka", cls: "bg-amber-100 text-amber-700", icon: Clock },
    answered: { label: "Terjawab", cls: "bg-green-100 text-green-700", icon: CheckCheck },
    closed: { label: "Ditutup", cls: "bg-gray-100 text-gray-500", icon: CheckCircle2 },
  };
  const info = map[status] || map.open;
  const Icon = info.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", info.cls)}>
      <Icon className="h-2.5 w-2.5" /> {info.label}
    </span>
  );
}

export default function MitraQuestionsPage() {
  const { accessToken } = useAuth();
  const socket = useSocket(accessToken);
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const selected = questions.find((q) => q.id === selectedId);

  const loadQuestions = useCallback(async () => {
    if (!accessToken || !projectId) return;
    setLoading(true);
    try {
      const res = await api<{ questions: Question[] }>(`/projects/${projectId}/questions`, { token: accessToken });
      setQuestions(res.questions || []);
      if (res.questions?.length > 0 && !selectedId) {
        setSelectedId(res.questions[0].id);
      }
    } catch (err: any) {
      setError(err?.message || "Gagal memuat pertanyaan");
    } finally {
      setLoading(false);
    }
  }, [accessToken, projectId, selectedId]);

  const loadMessages = useCallback(async (questionId: string) => {
    if (!accessToken || !projectId) return;
    setLoadingMessages(true);
    try {
      const res = await api<{ question: Question; messages: Message[] }>(`/projects/${projectId}/questions/${questionId}`, { token: accessToken });
      setMessages(res.messages || []);
    } catch (err: any) {
      setError(err?.message || "Gagal memuat pesan");
    } finally {
      setLoadingMessages(false);
    }
  }, [accessToken, projectId]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    if (selectedId) loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  // Socket.IO: real-time Q&A updates
  useEffect(() => {
    if (!socket || !projectId) return;
    socket.emit("join-project", projectId);

    const onNewMessage = (msg: any) => {
      setMessages((prev) => [...prev, msg]);
    };
    const onNewQuestion = () => { loadQuestions(); };
    const onQuestionUpdated = (data: { questionId: string; status: string }) => {
      setQuestions((prev) => prev.map((q) => q.id === data.questionId ? { ...q, status: data.status as any } : q));
    };

    socket.on("new-message", onNewMessage);
    socket.on("new-question", onNewQuestion);
    socket.on("question-updated", onQuestionUpdated);
    socket.on("question-status", onQuestionUpdated);

    return () => {
      socket.off("new-message", onNewMessage);
      socket.off("new-question", onNewQuestion);
      socket.off("question-updated", onQuestionUpdated);
      socket.off("question-status", onQuestionUpdated);
    };
  }, [socket, projectId, loadQuestions]);

  // Join/leave question room
  useEffect(() => {
    if (!socket || !selectedId) return;
    socket.emit("join-question", selectedId);
    return () => { socket.emit("leave-question", selectedId); };
  }, [socket, selectedId]);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Hanya file gambar yang diperbolehkan"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendReply = async () => {
    if ((!reply.trim() && !imageFile) || !selectedId || !accessToken || !projectId) return;
    setSending(true);
    try {
      const formData = new FormData();
      if (reply.trim()) formData.append("message", reply.trim());
      if (imageFile) formData.append("image", imageFile);

      await fetchWithAuth(`/projects/${projectId}/questions/${selectedId}/messages`, {
        method: "POST",
        token: accessToken,
        body: formData,
      });
      setReply("");
      clearImage();
      await loadMessages(selectedId);
      await loadQuestions();
    } catch (err: any) {
      setError(err?.message || "Gagal mengirim balasan");
    } finally {
      setSending(false);
    }
  };

  if (!projectId) {
    return (
      <div className="p-8 text-center text-sm text-ptba-gray">
        <p>Parameter proyek tidak ditemukan.</p>
        <button onClick={() => router.back()} className="mt-4 text-ptba-steel-blue hover:underline">Kembali</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-ptba-gray hover:text-ptba-navy">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </button>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ptba-navy/10">
              <MessageSquare className="h-5 w-5 text-ptba-navy" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-ptba-navy">Pertanyaan Saya</h1>
              <p className="text-xs text-ptba-gray">Komunikasi Q&A dengan tim EBD</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl bg-white p-8 shadow-sm text-center">
            <Loader2 className="h-6 w-6 text-ptba-navy animate-spin mx-auto mb-2" />
            <p className="text-sm text-ptba-gray">Memuat pertanyaan...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="rounded-xl bg-white p-12 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ptba-section-bg">
              <MessageSquare className="h-8 w-8 text-ptba-gray" />
            </div>
            <h3 className="text-base font-semibold text-ptba-charcoal mb-1">Belum ada pertanyaan</h3>
            <p className="text-sm text-ptba-gray">Kembali ke halaman proyek untuk mengajukan pertanyaan pertama Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Questions list */}
            <div className="lg:col-span-5 rounded-xl bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 px-4 py-3">
                <h2 className="text-sm font-bold text-ptba-charcoal">Daftar Pertanyaan ({questions.length})</h2>
              </div>
              <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
                {questions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setSelectedId(q.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-ptba-section-bg transition-colors",
                      selectedId === q.id && "bg-ptba-section-bg border-l-3 border-l-ptba-navy"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-semibold shrink-0", CAT_COLORS[q.category] || CAT_COLORS.umum)}>
                        {CAT_LABELS[q.category] || q.category}
                      </span>
                      <StatusBadge status={q.status} />
                    </div>
                    <p className="text-sm font-semibold text-ptba-charcoal truncate">{q.subject}</p>
                    <p className="text-[10px] text-ptba-gray mt-0.5">{formatDate(q.updated_at)}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat view */}
            <div className="lg:col-span-7 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col" style={{ height: "70vh" }}>
              {selected ? (
                <>
                  <div className="border-b border-gray-100 px-5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-sm font-bold text-ptba-charcoal truncate">{selected.subject}</h2>
                        <p className="text-[10px] text-ptba-gray">{formatDate(selected.created_at)}</p>
                      </div>
                      <StatusBadge status={selected.status} />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    {loadingMessages ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-ptba-gray mx-auto" />
                      </div>
                    ) : messages.map((m, idx) => {
                      const isMitra = m.sender_type === "mitra";
                      const prev = idx > 0 ? messages[idx - 1] : null;
                      const showDaySeparator = !prev || !isSameDay(prev.created_at, m.created_at);
                      return (
                        <div key={m.id}>
                          {showDaySeparator && (
                            <div className="flex justify-center my-3">
                              <span className="rounded-full bg-ptba-section-bg px-3 py-1 text-[10px] font-medium text-ptba-gray shadow-sm">
                                {formatChatDaySeparator(m.created_at)}
                              </span>
                            </div>
                          )}
                          <div className={cn("flex", isMitra ? "justify-end" : "justify-start")}>
                            <div className={cn(
                              "max-w-[75%] rounded-xl px-4 py-2.5 text-xs",
                              isMitra ? "bg-ptba-navy text-white" : "bg-ptba-section-bg text-ptba-charcoal"
                            )}>
                              <p className="text-[10px] font-semibold mb-0.5 opacity-70">
                                {isMitra ? "Anda" : (m.sender_name || "Admin")}
                              </p>
                              {m.image_url && (
                                <img
                                  src={m.image_url}
                                  alt=""
                                  className="rounded-lg max-w-full max-h-48 object-contain cursor-pointer mb-1.5 hover:opacity-90 transition-opacity"
                                  onClick={() => setLightboxSrc(m.image_url!)}
                                />
                              )}
                              {m.message && <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>}
                              <p className={cn("text-[9px] mt-1 text-right", isMitra ? "text-white/60" : "text-ptba-gray")}>
                                {formatChatTime(m.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  {selected.status !== "closed" && (
                    <div className="border-t border-gray-100 p-3">
                      {imagePreview && (
                        <div className="mb-2 relative inline-block">
                          <img src={imagePreview} alt="Preview" className="h-20 rounded-lg border border-ptba-light-gray object-cover" />
                          <button onClick={clearImage} className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-lg border border-ptba-light-gray px-2.5 text-ptba-gray hover:bg-ptba-section-bg transition-colors"
                          title="Lampirkan gambar"
                        >
                          <ImagePlus className="h-4 w-4" />
                        </button>
                        <textarea
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          placeholder="Ketik balasan..."
                          rows={2}
                          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") sendReply(); }}
                          className="flex-1 rounded-lg border border-ptba-light-gray px-3 py-2 text-xs outline-none focus:border-ptba-steel-blue resize-none"
                        />
                        <button
                          onClick={sendReply}
                          disabled={(!reply.trim() && !imageFile) || sending}
                          className="rounded-lg bg-ptba-navy px-4 text-white hover:bg-ptba-navy/90 disabled:opacity-50 transition-colors"
                        >
                          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                  {selected.status === "closed" && (
                    <div className="border-t border-gray-100 p-3 text-center text-xs text-ptba-gray">
                      Pertanyaan ini sudah ditutup
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-sm text-ptba-gray">
                  Pilih pertanyaan untuk melihat detail
                </div>
              )}
            </div>
          </div>
        )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">{error}</div>
      )}

      {/* Lightbox */}
      {lightboxSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightboxSrc(null)}>
          <button onClick={() => setLightboxSrc(null)} className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
            <X className="h-6 w-6" />
          </button>
          <img src={lightboxSrc} alt="" className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
