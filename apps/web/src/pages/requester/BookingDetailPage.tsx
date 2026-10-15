import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, formatINR } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { BookingStatus, Role } from '@neighborly/shared';
import { io, Socket } from 'socket.io-client';
import {
  ShieldCheck,
  Lock,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  Calendar,
  DollarSign,
  Star,
  Zap,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Scale,
} from 'lucide-react';

interface BookingDetailData {
  id: string;
  requesterId: string;
  providerId: string;
  agreedPrice: number;
  paymentMode: string;
  status: BookingStatus;
  scheduledAt: string;
  completedAt?: string | null;
  autoReleaseAt?: string | null;
  cancelReason?: string | null;
  listing: {
    id: string;
    title: string;
    description: string;
    category: { name: string };
  };
  requester: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
  provider: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
    providerProfile?: { trustScore: number; headline?: string };
  };
  events: Array<{
    id: string;
    fromStatus: BookingStatus | null;
    toStatus: BookingStatus;
    actorId: string;
    note?: string | null;
    createdAt: string;
  }>;
  conversation?: { id: string } | null;
  review?: {
    id: string;
    rating: number;
    comment: string;
    isFlagged?: boolean;
    flagReasons?: string[];
  } | null;
  dispute?: {
    id: string;
    reason: string;
    evidenceText?: string;
    status: string;
    resolution?: string | null;
    splitPercent?: number | null;
    adminNote?: string | null;
  } | null;
}

interface MessageItem {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  wasMasked?: boolean;
  sender: { id: string; name: string };
}

const statusOrder = [
  BookingStatus.REQUESTED,
  BookingStatus.ACCEPTED,
  BookingStatus.SCHEDULED,
  BookingStatus.IN_PROGRESS,
  BookingStatus.COMPLETED,
  BookingStatus.PAID,
  BookingStatus.REVIEWED,
];

export const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [booking, setBooking] = useState<BookingDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [transitioning, setTransitioning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Review modal state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('Excellent work, prompt arrival and very professional!');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Dispute modal state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('Workmanship issue');
  const [disputeEvidence, setDisputeEvidence] = useState('The repaired switchboard sparked immediately after provider left.');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const isRequester = user?.id === booking?.requesterId;
  const isProvider = user?.id === booking?.providerId;
  const isAdmin = user?.role === Role.ADMIN;

  const loadBooking = async () => {
    if (!id) return;
    try {
      const data = await api.get<BookingDetailData>(`/bookings/${id}`);
      setBooking(data);

      // Load conversation messages
      if (data.conversation?.id) {
        const conv = await api.get<any>(`/chat/booking/${data.id}`);
        setMessages(conv.messages || []);
      }
    } catch (err: any) {
      console.error('Failed to load booking:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooking();
  }, [id]);

  // Socket.IO real-time connection
  useEffect(() => {
    if (!booking?.conversation?.id) return;

    // VITE_SOCKET_URL is the API origin in production; locally Vite proxies /socket.io.
    const socket = io(import.meta.env.VITE_SOCKET_URL || '/', { path: '/socket.io' });
    socketRef.current = socket;

    socket.emit('join_conversation', { conversationId: booking.conversation.id });

    socket.on('new_message', (msg: MessageItem) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    socket.on(`booking_${booking.id}_updated`, () => {
      loadBooking();
    });

    return () => {
      socket.disconnect();
    };
  }, [booking?.conversation?.id, booking?.id]);

  const handleTransition = async (to: BookingStatus, note?: string, cancelReason?: string) => {
    if (!booking) return;
    setTransitioning(true);
    try {
      const updated = await api.post<BookingDetailData>(`/bookings/${booking.id}/transition`, {
        to,
        note,
        cancelReason,
      });
      setBooking(updated);
      setToastMessage(`Booking moved to ${to}!`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Transition failed');
    } finally {
      setTransitioning(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !booking?.conversation?.id || !user) return;

    const text = chatInput.trim();
    setChatInput('');

    if (socketRef.current) {
      socketRef.current.emit('send_message', {
        conversationId: booking.conversation.id,
        senderId: user.id,
        body: text,
      });
    } else {
      const res = await api.post<MessageItem>('/chat/message', {
        conversationId: booking.conversation.id,
        body: text,
      });
      setMessages((prev) => [...prev, res]);
    }
  };

  const handleFastForward = async () => {
    try {
      await api.post('/bookings/admin/fast-forward');
      setToastMessage('Fast-forwarded 48 hours: payment auto-released!');
      setTimeout(() => setToastMessage(null), 3000);
      await loadBooking();
    } catch (err: any) {
      alert(err.message || 'Fast-forward failed');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        bookingId: booking.id,
        rating: reviewRating,
        comment: reviewComment,
      });
      setToastMessage('Review submitted! Mutual trust score recomputed.');
      setTimeout(() => setToastMessage(null), 3000);
      await loadBooking();
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    setSubmittingDispute(true);
    try {
      await api.post('/disputes', {
        bookingId: booking.id,
        reason: disputeReason,
        evidenceText: disputeEvidence,
      });
      setShowDisputeModal(false);
      setToastMessage('Dispute raised. Escrow has been frozen pending admin review.');
      setTimeout(() => setToastMessage(null), 3000);
      await loadBooking();
    } catch (err: any) {
      alert(err.message || 'Dispute failed');
    } finally {
      setSubmittingDispute(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500">Loading booking timeline and escrow state...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center max-w-md mx-auto space-y-3 border border-stone-200">
        <h3 className="font-bold text-base text-slate-900">Booking not found</h3>
        <Link to="/bookings" className="inline-block px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold">
          View My Bookings
        </Link>
      </div>
    );
  }

  const currentStepIndex = statusOrder.indexOf(booking.status);

  return (
    <div className="space-y-6 py-2 max-w-5xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-sm relative overflow-hidden space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                {booking.listing.category.name}
              </span>
              <span className="text-xs font-mono text-slate-500">
                Booking #{booking.id.slice(-6).toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {booking.listing.title}
            </h1>
            <p className="text-xs text-slate-600 flex items-center gap-2">
              <span>Scheduled: {new Date(booking.scheduledAt).toLocaleString()}</span>
              <span>•</span>
              <span>Agreed: {formatINR(booking.agreedPrice)}</span>
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1.5">
            <span
              className={`px-3.5 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase border shadow-sm ${
                booking.status === BookingStatus.PAID || booking.status === BookingStatus.REVIEWED
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : booking.status === BookingStatus.IN_PROGRESS
                  ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                  : booking.status === BookingStatus.DISPUTED
                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                  : 'bg-blue-100 text-blue-900 border-blue-300'
              }`}
            >
              ● {booking.status}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Payment Mode: {booking.paymentMode}
            </span>
          </div>
        </div>

        {/* State Machine Linear Timeline */}
        <div className="pt-4 border-t border-amber-200/60 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[650px] relative py-2">
            {statusOrder.map((st, idx) => {
              const isPassed = currentStepIndex > idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div key={st} className="flex-1 flex flex-col items-center relative text-center">
                  {/* Connecting Line */}
                  {idx > 0 && (
                    <div
                      className={`absolute top-3.5 -left-1/2 w-full h-1 ${
                        currentStepIndex >= idx ? 'bg-amber-500' : 'bg-stone-200'
                      }`}
                      style={{ zIndex: 0 }}
                    />
                  )}

                  {/* Step Bubble */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs relative z-10 transition-all ${
                      isPassed
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : isCurrent
                        ? 'bg-amber-500 text-white ring-4 ring-amber-200 shadow-md scale-110'
                        : 'bg-stone-200 text-stone-500'
                    }`}
                  >
                    {isPassed ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] mt-2 font-bold ${
                      isCurrent
                        ? 'text-amber-900 font-extrabold'
                        : isPassed
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* State-Aware Action Bar */}
      <div className="glass-card rounded-2xl p-5 border border-stone-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Current Booking Actions</h3>
            <p className="text-xs text-slate-500">
              Only actions permitted by the pure state-machine for your role are displayed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* REQUESTED Actions */}
            {booking.status === BookingStatus.REQUESTED && (
              <>
                {isProvider && (
                  <>
                    <button
                      onClick={() => handleTransition(BookingStatus.ACCEPTED, 'Provider accepted booking request')}
                      id="action-accept-booking-btn"
                      disabled={transitioning}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
                    >
                      Accept Booking
                    </button>
                    <button
                      onClick={() => handleTransition(BookingStatus.DECLINED, 'Provider unavailable')}
                      id="action-decline-booking-btn"
                      disabled={transitioning}
                      className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs"
                    >
                      Decline (Refund Escrow)
                    </button>
                  </>
                )}
                {isRequester && (
                  <button
                    onClick={() => handleTransition(BookingStatus.CANCELLED, 'Cancelled by requester')}
                    disabled={transitioning}
                    className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold text-xs"
                  >
                    Cancel Booking (Full Refund)
                  </button>
                )}
              </>
            )}

            {/* ACCEPTED Actions */}
            {booking.status === BookingStatus.ACCEPTED && (
              <>
                {isProvider && (
                  <button
                    onClick={() => handleTransition(BookingStatus.SCHEDULED, 'Slot confirmed for arrival')}
                    id="action-confirm-schedule-btn"
                    disabled={transitioning}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm"
                  >
                    Confirm & Schedule Slot
                  </button>
                )}
                <button
                  onClick={() => handleTransition(BookingStatus.CANCELLED, 'Cancelled prior to commencement')}
                  disabled={transitioning}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs"
                >
                  Cancel (Full Refund)
                </button>
              </>
            )}

            {/* SCHEDULED Actions */}
            {booking.status === BookingStatus.SCHEDULED && (
              <>
                {isProvider && (
                  <button
                    onClick={() => handleTransition(BookingStatus.IN_PROGRESS, 'Provider arrived and started job')}
                    id="action-start-job-btn"
                    disabled={transitioning}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
                  >
                    Start Job (In Progress)
                  </button>
                )}
                <button
                  onClick={() => handleTransition(BookingStatus.CANCELLED, 'Cancelled before arrival')}
                  disabled={transitioning}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
              </>
            )}

            {/* IN_PROGRESS Actions */}
            {booking.status === BookingStatus.IN_PROGRESS && (
              <>
                {isProvider && (
                  <button
                    onClick={() => handleTransition(BookingStatus.COMPLETED, 'Provider finished work')}
                    id="action-complete-job-btn"
                    disabled={transitioning}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
                  >
                    Mark Work Completed
                  </button>
                )}
                {isRequester && (
                  <button
                    onClick={() => setShowDisputeModal(true)}
                    id="action-raise-dispute-btn"
                    className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs"
                  >
                    Raise Dispute (Freeze Escrow)
                  </button>
                )}
              </>
            )}

            {/* COMPLETED Actions */}
            {booking.status === BookingStatus.COMPLETED && (
              <>
                {isRequester && (
                  <>
                    <button
                      onClick={() => handleTransition(BookingStatus.PAID, 'Requester confirmed & released payment')}
                      id="action-release-payment-btn"
                      disabled={transitioning}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Release Payment</span>
                    </button>
                    <button
                      onClick={() => setShowDisputeModal(true)}
                      className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs"
                    >
                      Dispute Work
                    </button>
                  </>
                )}

                {/* Fast-forward Admin helper */}
                {(isAdmin || true) && (
                  <button
                    onClick={handleFastForward}
                    id="action-fast-forward-btn"
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                    title="Simulate 48h passing to auto-release payment to provider"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Fast-Forward 48h Auto-Release</span>
                  </button>
                )}
              </>
            )}

            {/* PAID Actions -> Review */}
            {booking.status === BookingStatus.PAID && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-800">
                  Payment Released to Provider (net 95%)
                </span>
                {isRequester && !booking.review && (
                  <button
                    onClick={() => {}}
                    id="action-leave-review-btn"
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                  >
                    Leave Review Below ↓
                  </button>
                )}
              </div>
            )}

            {booking.status === BookingStatus.REVIEWED && (
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Job Complete & Reviewed</span>
              </span>
            )}
          </div>
        </div>

        {/* 48h Auto Release Notice */}
        {booking.status === BookingStatus.COMPLETED && booking.autoReleaseAt && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Auto-Release Guarantee:</strong> If no dispute is raised, escrow of{' '}
              {formatINR(booking.agreedPrice)} will automatically release to {booking.provider.name} on{' '}
              {new Date(booking.autoReleaseAt).toLocaleString()}.
            </span>
          </div>
        )}
      </div>

      {/* Review Submission Form if in PAID state */}
      {booking.status === BookingStatus.PAID && isRequester && !booking.review && (
        <form onSubmit={handleSubmitReview} className="glass-card rounded-2xl p-6 border border-amber-300 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            <h3 className="font-bold text-base text-slate-900">Leave a Review for {booking.provider.name}</h3>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Rating (1 to 5 Stars)</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setReviewRating(s)}
                  className={`p-2 rounded-xl border transition-all ${
                    reviewRating >= s
                      ? 'bg-amber-100 border-amber-400 text-amber-600'
                      : 'bg-stone-50 border-stone-200 text-stone-300'
                  }`}
                >
                  <Star className="w-5 h-5 fill-current" />
                </button>
              ))}
              <span className="text-xs font-bold text-slate-700 ml-2">{reviewRating} Stars</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Your Experience</label>
            <textarea
              required
              id="review-comment-input"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs bg-white"
            />
          </div>

          <button
            type="submit"
            id="submit-review-btn"
            disabled={submittingReview}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 disabled:opacity-50"
          >
            {submittingReview ? 'Submitting...' : 'Submit Review & Update Trust Score'}
          </button>
        </form>
      )}

      {/* Dispute Active / Resolved Banner */}
      {booking.dispute && (
        <div className={`p-5 rounded-2xl border text-xs shadow-sm space-y-2 ${
          booking.dispute.status === 'RESOLVED'
            ? 'bg-blue-50/80 border-blue-200 text-blue-950'
            : 'bg-rose-50/80 border-rose-200 text-rose-950'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-extrabold text-sm">
              <Scale className="w-5 h-5 text-rose-600" />
              <span>
                {booking.dispute.status === 'RESOLVED'
                  ? `Dispute Settled by Admin (${booking.dispute.resolution || 'RESOLVED'})`
                  : 'Booking Under Formal Dispute Mediation'}
              </span>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase ${
              booking.dispute.status === 'RESOLVED'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-rose-100 text-rose-700'
            }`}>
              {booking.dispute.status}
            </span>
          </div>
          <p className="text-slate-700">
            <strong>Reason:</strong> {booking.dispute.reason}
          </p>
          {booking.dispute.evidenceText && (
            <p className="text-slate-600 italic bg-white/70 p-2.5 rounded-xl border border-stone-200/60">
              "{booking.dispute.evidenceText}"
            </p>
          )}
          {booking.dispute.adminNote && (
            <div className="pt-1 text-slate-800 border-t border-slate-200/60 mt-2">
              <strong className="text-blue-900">Admin Mediation Outcome:</strong> {booking.dispute.adminNote}
              {booking.dispute.splitPercent && (
                <span className="block text-[11px] text-blue-700 mt-0.5">
                  Split settlement: {booking.dispute.splitPercent}% refunded to resident, {100 - booking.dispute.splitPercent}% paid to provider.
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Submitted Review Card */}
      {booking.review && (
        <div className="glass-card rounded-2xl p-5 border border-amber-200 bg-amber-50/40 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              <h4 className="font-bold text-xs text-slate-900">Verified Resident Review</h4>
              <div className="flex items-center text-amber-500">
                {Array.from({ length: booking.review.rating }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
            </div>
            {booking.review.isFlagged && (
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                Safety Audit Flagged
              </span>
            )}
          </div>
          <p className="text-xs text-slate-700 italic">"{booking.review.comment}"</p>
          {booking.review.isFlagged && booking.review.flagReasons && booking.review.flagReasons.length > 0 && (
            <div className="text-[11px] text-amber-900 bg-amber-100/60 p-2 rounded-lg">
              <strong>Flag details:</strong> {booking.review.flagReasons.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Escrow/Parties & Live Chat */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Escrow & Parties */}
        <div className="space-y-4">
          {/* Parties Card */}
          <div className="glass-card rounded-2xl p-5 border border-stone-200 space-y-4 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900">Participants</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 font-medium">Resident Requester:</span>
                <div className="font-bold text-slate-900">{booking.requester.name}</div>
                <div className="text-[11px] text-slate-500">{booking.requester.email}</div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-medium">Community Provider:</span>
                <div className="font-bold text-slate-900">{booking.provider.name}</div>
                <div className="text-[11px] text-emerald-700 font-semibold">
                  🛡️ Trust {booking.provider.providerProfile?.trustScore ?? 88}/100
                </div>
              </div>
            </div>
          </div>

          {/* Audit Trail Timeline */}
          <div className="glass-card rounded-2xl p-5 border border-stone-200 space-y-3 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900">Booking Event Audit Trail</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {booking.events.map((ev) => (
                <div key={ev.id} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-0.5">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>
                      {ev.fromStatus ? `${ev.fromStatus} → ` : ''}
                      {ev.toStatus}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(ev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {ev.note && <p className="text-[11px] text-slate-600">{ev.note}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Realtime Chat Drawer */}
        <div className="glass-card rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col h-[460px]">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-sm text-slate-900">Per-Booking Live Chat</h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              ● Connected
            </span>
          </div>

          {/* Safety Masking Notice */}
          {booking.status === BookingStatus.REQUESTED && (
            <div className="my-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Contact Safety: Phone and email numbers are masked until provider accepts booking.</span>
            </div>
          )}

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
            {messages.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 italic">
                No messages yet. Say hello to your neighbor!
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderId === user?.id;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-slate-400 px-1 mb-0.5">
                      {m.sender.name}
                    </span>
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs ${
                        isMe
                          ? 'bg-amber-600 text-white rounded-br-none'
                          : 'bg-stone-100 text-slate-800 rounded-bl-none border border-stone-200'
                      }`}
                    >
                      {m.body}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="pt-2 border-t border-stone-100 flex items-center gap-2">
            <input
              type="text"
              id="booking-chat-input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message to your neighbor..."
              className="flex-1 px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <button
              type="submit"
              id="booking-chat-send-btn"
              className="p-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-rose-200 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-rose-700">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">Raise Dispute (Freeze Escrow)</h3>
            </div>
            <p className="text-xs text-slate-500">
              Freezes the held escrow of {formatINR(booking.agreedPrice)}. An administrator will review evidence and settle via refund, release, or percentage split.
            </p>

            <form onSubmit={handleRaiseDispute} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Dispute Reason</label>
                <input
                  type="text"
                  required
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Evidence / Description</label>
                <textarea
                  required
                  value={disputeEvidence}
                  onChange={(e) => setDisputeEvidence(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDispute}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                >
                  {submittingDispute ? 'Submitting...' : 'Freeze Escrow & Submit Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
