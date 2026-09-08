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

    // Polling fallback every 8 seconds if customer has an active token
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
      fetchDashboardData();
    } catch (err) {
      setCancelFeedback(`Cancellation failed: ${err.message}`);
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-400">Loading Your Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 selection:bg-blue-600 selection:text-white">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-5 gap-4">
          <div className="flex items-center gap-3">
            <LogoMark className="w-12 h-12" variant="blue" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Welcome, {profile?.name || user?.name || 'Customer'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Shewwina Customer Flow Dashboard • <span className="text-blue-400 font-semibold">{profile?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-medium rounded-xl transition-all text-slate-200 flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>
              <span>Home</span>
            </Link>
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-900/80 text-xs font-medium rounded-xl transition-all text-slate-300 hover:text-rose-300 flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-3.5 h-3.5 text-rose-400/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center justify-between">
            <span>⚠️ {errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 font-bold ml-2">✕</button>
          </div>
        )}

        {/* Customer Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h2 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-4">Account Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-500 block mb-1">Full Name</span>
              <span className="font-bold text-white text-sm">{profile?.name}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-500 block mb-1">Email Address</span>
              <span className="font-bold text-white text-sm truncate block">{profile?.email}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-500 block mb-1">Phone Number</span>
              <span className="font-mono font-bold text-white text-sm">{profile?.phone || 'N/A'}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-500 block mb-1">Account Role</span>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                {profile?.role || 'CUSTOMER'}
              </span>
            </div>
          </div>
        </div>

        {/* Active Token Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Current Active Queue Token</h2>
            {activeToken && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Live Queue
              </span>
            )}
          </div>

          {activeToken ? (
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-950/60 border border-slate-800 rounded-2xl p-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="text-xs text-slate-400">
                  Business: <strong className="text-white font-semibold">{activeToken.businessName}</strong>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <span className="text-5xl font-black text-white font-mono tracking-wider">#{activeToken.tokenNumber}</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      activeToken.status === 'SERVING'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    }`}
                  >
                    {activeToken.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Service: <span className="text-slate-200 font-medium">{activeToken.serviceName}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
                <div className="grid grid-cols-2 gap-4 w-full sm:w-auto text-center">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 min-w-[100px]">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">People Ahead</div>
                    <div className="text-xl font-bold font-mono text-white mt-0.5">{activeToken.peopleAhead ?? 0}</div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 min-w-[100px]">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Est. Wait</div>
                    <div className="text-xl font-bold font-mono text-blue-400 mt-0.5">{activeToken.estimatedWaitMinutes ?? 0}m</div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <Link
                    to={`/token/${activeToken.tokenId}`}
                    className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-blue-600/20 text-center transition-all flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
                    <span>Track Live Token</span>
                  </Link>

                  {activeToken.status === 'WAITING' && (
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={cancelling}
                      className="w-full sm:w-auto px-5 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 font-medium text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
                      <span>{cancelling ? 'Cancelling...' : 'Cancel Queue'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 px-6 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
                <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-200">You currently have no active queue token</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">Visit any salon or clinic page to check in and skip the physical waiting room.</p>
              <div className="mt-5">
                <Link
                  to="/join/demo"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                >
                  <span>Explore Demo Queue</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Cancel Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xs w-full text-center space-y-4 shadow-2xl">
              <div className="text-3xl">⚠️</div>
              <h3 className="text-base font-bold text-white">Cancel Queue Token?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to cancel token <strong className="text-white">#{activeToken?.tokenNumber}</strong>? You will lose your position in line.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Keep Token
                </button>
                <button
                  onClick={handleCancelActiveToken}
                  className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
              <h2 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              No notifications yet. You will receive real-time queue updates here.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {notifications.map((n) => {
                const isUnread = !n.isRead;
                return (
                  <div
                    key={n.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      isUnread
                        ? 'bg-slate-950/80 border-blue-500/40 shadow-sm shadow-blue-500/5'
                        : 'bg-slate-950/40 border-slate-800/60 opacity-80'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 ${
                          n.type === 'CUSTOMER_CALLED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : n.type === 'YOUR_TURN_APPROACHING'
                            ? 'bg-amber-500/20 text-amber-400'
                            : n.type === 'SERVICE_COMPLETED'
                            ? 'bg-blue-500/20 text-blue-400'
                            : n.type === 'QUEUE_CANCELLED'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-indigo-500/20 text-indigo-400'
                        }`}
                      >
                        {n.type === 'CUSTOMER_CALLED'
                          ? '🎉'
                          : n.type === 'YOUR_TURN_APPROACHING'
                          ? '⏱️'
                          : n.type === 'SERVICE_COMPLETED'
                          ? '✅'
                          : n.type === 'QUEUE_CANCELLED'
                          ? '🚫'
                          : '🎫'}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${isUnread ? 'text-white' : 'text-slate-300'}`}>
                            {n.title}
                          </span>
                          {isUnread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                          )}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{n.message}</p>
                        <span className="text-[10px] text-slate-500 block font-mono">
                          {n.createdAt
                            ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </span>
                      </div>
                    </div>

                    {isUnread && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors shrink-0"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Token History Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h2 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-4">Token History ({tokensHistory.length})</h2>

          {tokensHistory.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No previous queue token records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-xl">Token #</th>
                    <th className="p-3">Business</th>
                    <th className="p-3">Service</th>
                    <th className="p-3">Joined Time</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {tokensHistory.map((t) => (
                    <tr key={t.tokenId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-white text-sm">#{t.tokenNumber}</td>
                      <td className="p-3.5 text-slate-200 font-semibold">{t.businessName}</td>
                      <td className="p-3.5 text-slate-300">{t.serviceName}</td>
                      <td className="p-3.5 text-slate-400 font-mono">
                        {t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            t.status === 'SERVING'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : t.status === 'SERVED'
                              ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                              : t.status === 'WAITING'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
