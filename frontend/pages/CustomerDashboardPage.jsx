import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

// Phase 2 UI Primitives
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';

export default function CustomerDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading Customer Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">

            <div className="flex items-center gap-3 min-w-0">
              <Link to="/" className="flex-shrink-0" aria-label="Shewwina Home">
                <LogoMark className="w-9 h-9" variant="blue" iconSize="w-4.5 h-4.5" />
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-display font-bold text-base sm:text-lg text-slate-900 truncate tracking-tight">
                    Welcome, {profile?.name || user?.name || 'Customer'}
                  </h1>
                  <Badge variant="indigo" size="sm" className="hidden sm:inline-flex">
                    Customer Account
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {profile?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                to="/"
                className="inline-flex items-center justify-center font-medium rounded-xl transition-all text-xs gap-1.5 min-h-[32px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:border-slate-300"
              >
                <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><path d="M9 22V12h6v10" />
                </svg>
                <span>Home</span>
              </Link>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                icon={
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                }
              >
                Log Out
              </Button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Error Feedback */}
        {errorMessage && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between shadow-sm animate-fadeIn"
          >
            <span>⚠️ {errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="font-bold">✕</button>
          </div>
        )}

        {/* Cancellation Feedback */}
        {cancelFeedback && (
          <div
            role="status"
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-sm animate-fadeIn ${
              cancelFeedback.includes('failed')
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <span>{cancelFeedback}</span>
            <button onClick={() => setCancelFeedback(null)} className="font-bold">✕</button>
          </div>
        )}

        {/* PRIMARY FOCUS: Active Queue Pass Hero Section */}
        <section aria-label="Active Queue Pass">
          <Card className="p-6 sm:p-8 bg-white border border-slate-200/80 shadow-md shadow-slate-900/5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                  Active Digital Waiting Pass
                </span>
                {activeToken && (
                  <Badge variant="emerald" size="sm" dot>
                    Live Active Queue
                  </Badge>
                )}
              </div>

              {activeToken && (
                <span className="text-xs font-mono text-slate-400">
                  Auto-syncing (8s)
                </span>
              )}
            </div>

            {activeToken ? (
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-slate-50/70 border border-slate-200/80 rounded-3xl p-6 sm:p-8 relative">

                {/* Left Ticket Info */}
                <div className="space-y-2">
                  <div className="text-xs text-slate-500 font-medium">
                    Business: <strong className="text-slate-900 font-bold text-sm">{activeToken.businessName}</strong>
                  </div>

                  <div className="flex items-baseline gap-4 pt-1">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900 font-mono tracking-tight">
                      #{activeToken.tokenNumber}
                    </span>
                    <Badge
                      variant={activeToken.status === 'SERVING' ? 'emerald' : 'amber'}
                      size="md"
                      dot
                    >
                      {activeToken.status === 'SERVING' ? 'YOUR TURN · SERVING' : 'WAITING IN LINE'}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600">
                    Service: <strong className="text-slate-800 font-semibold">{activeToken.serviceName}</strong>
                  </p>
                </div>

                {/* Right KPIs and Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm min-w-[100px]">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">People Ahead</span>
                      <span className="text-2xl font-black font-mono text-slate-900 mt-0.5 block">
                        {activeToken.peopleAhead ?? 0}
                      </span>
                    </div>

                    <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 min-w-[100px]">
                      <span className="text-[10px] text-indigo-700 uppercase font-bold block">Est. Wait</span>
                      <span className="text-2xl font-black font-mono text-indigo-600 mt-0.5 block">
                        ~{activeToken.estimatedWaitMinutes ?? 0}m
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link
                      to={`/token/${activeToken.tokenId}`}
                      className="inline-flex items-center justify-center font-bold rounded-xl text-xs gap-2 min-h-[40px] px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 text-center transition-all"
                    >
                      <span>Track Live Pass →</span>
                    </Link>

                    {activeToken.status === 'WAITING' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowConfirmModal(true)}
                        disabled={cancelling}
                        className="text-rose-700 border-rose-200 hover:bg-rose-50"
                      >
                        {cancelling ? 'Cancelling...' : 'Cancel Queue Token'}
                      </Button>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <EmptyState
                title="You're not waiting anywhere right now."
                description="Check in at your favorite salon, clinic, or service branch to get a digital queue ticket and skip physical waiting."
                className="py-10"
                action={
                  <Link
                    to="/join/demo"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all"
                  >
                    <span>Find a Queue (Demo)</span>
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
          <Card className="p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                <h2 className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <Badge variant="indigo" size="sm">
                    {unreadCount} unread
                  </Badge>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No notifications yet. Real-time updates when your turn approaches will arrive here.
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
                          ? 'bg-indigo-50/40 border-indigo-200/70 shadow-sm'
                          : 'bg-slate-50/50 border-slate-200/60 opacity-85'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${
                            n.type === 'CUSTOMER_CALLED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : n.type === 'YOUR_TURN_APPROACHING'
                              ? 'bg-amber-100 text-amber-700'
                              : n.type === 'SERVICE_COMPLETED'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-slate-100 text-slate-700'
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
                            <span className={`text-xs font-bold ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                              {n.title}
                            </span>
                            {isUnread && (
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                          <span className="text-[10px] text-slate-400 font-mono block">
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
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 px-2.5 py-1 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors flex-shrink-0"
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
          <Card className="p-6 border border-slate-200/80 shadow-sm">
            <h2 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-4">
              Queue History &amp; Completed Visits ({tokensHistory.length})
            </h2>

            {tokensHistory.length === 0 ? (
              <EmptyState
                title="No past queue token records found."
                description="Your past visits, queue passes, and completed services will log here."
                className="py-8"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">Token #</th>
                      <th className="p-3">Business</th>
                      <th className="p-3">Service</th>
                      <th className="p-3">Joined Time</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {tokensHistory.map((t) => (
                      <tr key={t.tokenId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-slate-900 text-sm">
                          #{t.tokenNumber}
                        </td>
                        <td className="p-3.5 text-slate-900 font-semibold">
                          {t.businessName}
                        </td>
                        <td className="p-3.5 text-slate-600">
                          {t.serviceName}
                        </td>
                        <td className="p-3.5 text-slate-500 font-mono">
                          {t.createdAt
                            ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'N/A'}
                        </td>
                        <td className="p-3.5 text-right">
                          <Badge
                            variant={
                              t.status === 'SERVING'
                                ? 'emerald'
                                : t.status === 'SERVED'
                                ? 'slate'
                                : t.status === 'WAITING'
                                ? 'amber'
                                : 'rose'
                            }
                            size="sm"
                          >
                            {t.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
        <div className="flex gap-2 pt-2">
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
