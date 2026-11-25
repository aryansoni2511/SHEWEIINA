import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getCustomerProfileApi,
  getCustomerActiveTokenApi,
  getCustomerTokensApi,
  cancelQueueTokenApi,
  getCustomerNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from '../services/api';
import { subscribeQueueRealtime } from '../services/realtime';
import LogoMark from '../components/LogoMark';

// Phase 1 UI Primitives
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge, { StatusBadge } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';

export default function CustomerDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get('tab') || 'active';
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  const [profile, setProfile] = useState(null);
  const [activeToken, setActiveToken] = useState(null);
  const [tokensHistory, setTokensHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [cancelFeedback, setCancelFeedback] = useState(null);

  const fetchDashboardData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setErrorMessage(null);

    try {
      const [profRes, activeRes, historyRes, notifRes] = await Promise.all([
        getCustomerProfileApi(),
        getCustomerActiveTokenApi(),
        getCustomerTokensApi(),
        getCustomerNotificationsApi().catch(() => ({ data: { notifications: [], unreadCount: 0 } })),
      ]);

      setProfile(profRes.data);
      setActiveToken(activeRes.data);
      setTokensHistory(historyRes.data || []);
      setNotifications(notifRes.data?.notifications || []);
      setUnreadCount(notifRes.data?.unreadCount || 0);
      setLoading(false);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load customer dashboard data.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(false);
  }, []);

  // Realtime subscription for customer's active token & auto-polling fallback
  useEffect(() => {
    let isMounted = true;

    let unsubscribe = () => {};
    if (activeToken?.tokenId) {
      unsubscribe = subscribeQueueRealtime({
        tokenId: activeToken.tokenId,
        onUpdate: () => {
          if (isMounted) {
            fetchDashboardData(true);
          }
        },
      });
    }

    const interval = setInterval(() => {
      if (isMounted && activeToken?.tokenId) {
        fetchDashboardData(true);
      }
    }, 8000);

    return () => {
      isMounted = false;
      unsubscribe();
      clearInterval(interval);
    };
  }, [activeToken?.tokenId]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationReadApi(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleCancelActiveToken = async () => {
    if (!activeToken) return;
    setCancelling(true);
    setCancelFeedback(null);
    setShowConfirmModal(false);

    try {
      await cancelQueueTokenApi(activeToken.tokenId);
      setCancelFeedback('Your queue token has been cancelled successfully.');
      setCancelling(false);
      fetchDashboardData(false);
    } catch (err) {
      setCancelFeedback(`Cancellation failed: ${err.message}`);
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4 selection:bg-[#171717] selection:text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#171717] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#171717]">Loading Customer Workspace...</p>
          <p className="text-xs text-[#78716C]">Connecting your queues and pass records</p>
        </div>
      </div>
    );
  }

  const isServing = activeToken?.status === 'SERVING';
  const isWaiting = activeToken?.status === 'WAITING';

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#171717] font-sans selection:bg-[#171717] selection:text-white">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur border-b border-[#E7E3DC] shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">

            <div className="flex items-center gap-3 min-w-0">
              <Link to="/" className="flex-shrink-0" aria-label="Shewwina Home">
                <LogoMark className="w-8 h-8" variant="blue" iconSize="w-4 h-4" />
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-editorial font-bold text-base sm:text-lg text-[#171717] truncate tracking-tight">
                    {profile?.name || user?.name || 'Customer'}
                  </h1>
                  <Badge variant="neutral" size="sm" className="hidden sm:inline-flex">
                    Customer Account
                  </Badge>
                </div>
                <p className="text-xs text-[#78716C] truncate font-mono">
                  {profile?.email || user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                to="/explore"
                className="inline-flex items-center justify-center font-medium rounded-xl transition-all text-xs gap-1.5 min-h-[34px] px-3.5 py-1.5 bg-white hover:bg-[#F5F2EB] text-[#171717] border border-[#E7E3DC] shadow-xs"
              >
                <span>Explore Services</span>
              </Link>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-[#991B1B] border-[#FEE2E2] hover:bg-[#FEF2F2]"
              >
                Log Out
              </Button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-28 lg:pb-12">

        {/* Mobile-Friendly Segmented View Switcher */}
        <div className="flex items-center gap-1 bg-[#EAE6DF] p-1.5 rounded-2xl w-full max-w-md mx-auto sm:mx-0 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              currentTab === 'active' || (!['history', 'notifications', 'profile'].includes(currentTab))
                ? 'bg-white text-[#171717] shadow-xs'
                : 'text-[#57534E] hover:text-[#171717]'
            }`}
          >
            <span>🎫 Active Pass</span>
            {activeToken && (
              <span className="w-2 h-2 rounded-full bg-[#15803D] animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              currentTab === 'history'
                ? 'bg-white text-[#171717] shadow-xs'
                : 'text-[#57534E] hover:text-[#171717]'
            }`}
          >
            <span>⏳ History</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#E7E3DC] text-[#57534E]">
              {tokensHistory.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              currentTab === 'notifications'
                ? 'bg-white text-[#171717] shadow-xs'
                : 'text-[#57534E] hover:text-[#171717]'
            }`}
          >
            <span>🔔 Alerts</span>
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#C25E38]" />
            )}
          </button>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FEE2E2] text-[#991B1B] text-xs font-semibold flex items-center justify-between shadow-xs animate-fadeIn"
          >
            <span>⚠️ {errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="font-bold">✕</button>
          </div>
        )}

        {/* Cancellation Feedback */}
        {cancelFeedback && (
          <div
            role="status"
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-xs animate-fadeIn ${
              cancelFeedback.includes('failed')
                ? 'bg-[#FEF2F2] border-[#FEE2E2] text-[#991B1B]'
                : 'bg-[#F0FDF4] border-[#DCFCE7] text-[#166534]'
            }`}
          >
            <span>{cancelFeedback}</span>
            <button onClick={() => setCancelFeedback(null)} className="font-bold">✕</button>
          </div>
        )}

        {/* PRIMARY FOCUS: Active Queue Pass Hero Section */}
        <section aria-label="Active Queue Pass">
          <Card className="p-6 sm:p-8 bg-white border border-[#E7E3DC] shadow-sm rounded-3xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-5 border-b border-[#E7E3DC] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-[#78716C] tracking-wider">
                  Active Digital Waiting Pass
                </span>
                {activeToken && (
                  <Badge variant="emerald" size="sm" dot>
                    Live Active Queue
                  </Badge>
                )}
              </div>

              {activeToken && (
                <span className="text-xs font-mono text-[#78716C] tabular-nums">
                  Auto-syncing (SSE / 8s)
                </span>
              )}
            </div>

            {activeToken ? (
              <div className="bg-[#FAF8F5] border border-[#E7E3DC] rounded-3xl p-6 sm:p-8 relative">
                {isServing && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="mb-5 p-3.5 rounded-2xl bg-[#F0FDF4] border-2 border-[#16A34A] text-[#166534] font-bold text-center text-xs sm:text-sm animate-pulse"
                  >
                    🎉 YOUR TURN! Please proceed to the service desk now.
                  </div>
                )}

                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">

                  {/* Left Ticket Info */}
                  <div className="space-y-2">
                    <div className="text-xs text-[#78716C] font-medium">
                      Provider: <strong className="text-[#171717] font-bold text-sm">{activeToken.businessName}</strong>
                    </div>

                    <div className="flex items-baseline gap-4 pt-1">
                      <span className="font-editorial font-bold text-4xl sm:text-5xl text-[#171717] tracking-tight tabular-nums">
                        #{activeToken.tokenNumber}
                      </span>
                      <StatusBadge status={activeToken.status} size="md" />
                    </div>

                    <p className="text-xs text-[#57534E]">
                      Service: <strong className="text-[#171717] font-semibold">{activeToken.serviceName}</strong>
                    </p>
                  </div>

                  {/* Right KPIs and Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="p-3.5 bg-white rounded-2xl border border-[#E7E3DC] shadow-xs min-w-[105px]">
                        <span className="text-[10px] text-[#78716C] uppercase font-bold block">People Ahead</span>
                        <span className="text-2xl font-bold font-mono text-[#171717] tabular-nums mt-0.5 block">
                          {activeToken.peopleAhead ?? 0}
                        </span>
                      </div>

                      <div className="p-3.5 bg-white rounded-2xl border border-[#E7E3DC] shadow-xs min-w-[105px]">
                        <span className="text-[10px] text-[#78716C] uppercase font-bold block">Est. Wait</span>
                        <span className="text-2xl font-bold font-mono text-[#C25E38] tabular-nums mt-0.5 block">
                          ~{activeToken.estimatedWaitMinutes ?? 0}m
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link
                        to={`/token/${activeToken.tokenId}`}
                        className="inline-flex items-center justify-center font-bold rounded-xl text-xs gap-2 min-h-[40px] px-5 py-2.5 bg-[#171717] hover:bg-[#262626] text-white shadow-xs text-center transition-all"
                      >
                        <span>Open Digital Pass →</span>
                      </Link>

                      {activeToken.status === 'WAITING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowConfirmModal(true)}
                          disabled={cancelling}
                          className="text-[#991B1B] border-[#FEE2E2] hover:bg-[#FEF2F2]"
                        >
                          {cancelling ? 'Cancelling...' : 'Cancel Queue Token'}
                        </Button>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <EmptyState
                title="You're not waiting in any queue right now."
                description="Explore certified hospitals, citizen facilitation kendras, clinics and salons to join a queue and track your live turn."
                className="py-10"
                action={
                  <Link
                    to="/explore"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#171717] hover:bg-[#262626] text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                  >
                    <span>Explore Services &amp; Find a Queue</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                }
              />
            )}
          </Card>
        </section>

        {/* Notifications Section */}
        <section aria-label="Customer Notifications">
          <Card className="p-6 sm:p-8 bg-white border border-[#E7E3DC] shadow-sm rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7E3DC] pb-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#78716C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                <h2 className="text-xs uppercase font-bold text-[#78716C] tracking-wider">
                  In-App Notifications
                </h2>
                {unreadCount > 0 && (
                  <Badge variant="terracotta" size="sm">
                    {unreadCount} unread
                  </Badge>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-[#C25E38] hover:text-[#944428] font-semibold transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#78716C]">
                No notifications yet. Real-time alerts when your turn approaches or when you are called will arrive here.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {notifications.map((n) => {
                  const isUnread = !n.isRead;
                  return (
                    <div
                      key={n.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        isUnread
                          ? 'bg-[#FAF8F5] border-[#E7E3DC] shadow-xs'
                          : 'bg-white border-[#E7E3DC]/70 opacity-80'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${
                            n.type === 'CUSTOMER_CALLED'
                              ? 'bg-[#F0FDF4] text-[#166534]'
                              : n.type === 'YOUR_TURN_APPROACHING'
                              ? 'bg-[#FFFBEB] text-[#92400E]'
                              : n.type === 'SERVICE_COMPLETED'
                              ? 'bg-[#FAF8F5] text-[#171717]'
                              : 'bg-[#FAF8F5] text-[#57534E]'
                          }`}
                        >
                          {n.type === 'CUSTOMER_CALLED'
                            ? '🎉'
                            : n.type === 'YOUR_TURN_APPROACHING'
                            ? '⏱️'
                            : n.type === 'SERVICE_COMPLETED'
                            ? '✅'
                            : '🎫'}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${isUnread ? 'text-[#171717]' : 'text-[#57534E]'}`}>
                              {n.title}
                            </span>
                            {isUnread && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C25E38]" />
                            )}
                          </div>
                          <p className="text-xs text-[#57534E] leading-relaxed">{n.message}</p>
                          <span className="text-[10px] text-[#78716C] font-mono block tabular-nums">
                            {n.createdAt
                              ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : ''}
                          </span>
                        </div>
                      </div>

                      {isUnread && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(n.id)}
                          className="text-[11px] font-semibold text-[#171717] hover:text-[#C25E38] px-2.5 py-1 bg-white border border-[#E7E3DC] rounded-lg hover:border-[#171717] transition-colors flex-shrink-0"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </section>

        {/* Token History & Past Visits */}
        <section aria-label="Visit History">
          <Card className="p-6 sm:p-8 bg-white border border-[#E7E3DC] shadow-sm rounded-3xl">
            <h2 className="text-xs uppercase font-bold text-[#78716C] tracking-wider mb-4">
              Queue History &amp; Completed Visits ({tokensHistory.length})
            </h2>

            {tokensHistory.length === 0 ? (
              <EmptyState
                title="No past queue token records found."
                description="Your past visits, consultation passes, and completed services will log here."
                className="py-8"
              />
            ) : (
              <div>
                {/* Mobile Cards Layout (< md) */}
                <div className="block md:hidden space-y-3">
                  {tokensHistory.map((t) => (
                    <div
                      key={t.tokenId}
                      className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E7E3DC] space-y-2 hover:border-[#2563EB] transition-colors"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-[#E7E3DC]/70">
                        <div className="flex items-center gap-2">
                          <span className="font-editorial font-bold text-lg text-[#171717] tabular-nums">
                            #{t.tokenNumber}
                          </span>
                          <span className="text-[10px] text-[#78716C] font-mono">
                            {t.createdAt
                              ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : ''}
                          </span>
                        </div>
                        <StatusBadge status={t.status} size="sm" />
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-[#171717]">
                          {t.businessName}
                        </h4>
                        <p className="text-xs text-[#57534E] mt-0.5">
                          Service: <span className="font-medium text-[#171717]">{t.serviceName}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] text-[#78716C] font-bold uppercase tracking-wider border-b border-[#E7E3DC]">
                      <tr>
                        <th className="p-3">Token #</th>
                        <th className="p-3">Provider</th>
                        <th className="p-3">Service</th>
                        <th className="p-3">Joined Time</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7E3DC]/60 font-medium">
                      {tokensHistory.map((t) => (
                        <tr key={t.tokenId} className="hover:bg-[#FAF8F5]/80 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-[#171717] text-sm tabular-nums">
                            #{t.tokenNumber}
                          </td>
                          <td className="p-3.5 text-[#171717] font-semibold">
                            {t.businessName}
                          </td>
                          <td className="p-3.5 text-[#57534E]">
                            {t.serviceName}
                          </td>
                          <td className="p-3.5 text-[#78716C] font-mono tabular-nums">
                            {t.createdAt
                              ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : 'N/A'}
                          </td>
                          <td className="p-3.5 text-right">
                            <StatusBadge status={t.status} size="sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        </section>

      </main>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Cancel Active Queue Token?"
        description={`Are you sure you want to cancel token #${activeToken?.tokenNumber}? You will forfeit your position in line.`}
        maxWidth="max-w-xs"
      >
        <div className="flex gap-2 pt-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowConfirmModal(false)}
            className="w-1/2"
          >
            Keep Token
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleCancelActiveToken}
            className="w-1/2"
          >
            Yes, Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
