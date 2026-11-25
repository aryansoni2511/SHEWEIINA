import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../Navbar';
import FooterSection from '../FooterSection';
import { getGovernmentTokenApi, cancelQueueTokenApi } from '../services/api';
import { subscribeQueueRealtime } from '../services/realtime';
import DigitalTokenPass from '../components/DigitalTokenPass';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

/**
 * Government Kendra Citizen Token Pass Page
 * Seamlessly powered by SHEWWINA Editorial Digital Token Pass
 */
export default function GovernmentTokenPage() {
  const { tokenId } = useParams();

  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  async function fetchToken(isSilent = false) {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await getGovernmentTokenApi(tokenId);
      if (res?.success && res.data?.token) {
        setTokenData(res.data.token);
        setError(null);
        setLastRefreshed(new Date());
        return res.data.token;
      } else {
        setError(res?.error || 'Token not found.');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch live token status.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    return null;
  }

  const handleCancel = async () => {
    if (!tokenData?.id) return;
    if (!window.confirm('Are you sure you want to cancel this citizen token?')) return;
    setCancelling(true);
    try {
      await cancelQueueTokenApi(tokenData.id);
      await fetchToken(true);
    } catch (err) {
      alert(err.message || 'Failed to cancel citizen token.');
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let isTerminal = false;

    fetchToken();

    // 1. Live SSE Stream subscription
    const unsubscribe = subscribeQueueRealtime({
      tokenId,
      onUpdate: (eventData) => {
        if (!isMounted) return;
        fetchToken(true);
        const status = eventData?.status || eventData?.data?.status;
        if (status && ['SERVED', 'COMPLETED', 'CANCELLED', 'SKIPPED'].includes(status)) {
          isTerminal = true;
        }
      },
    });

    // 2. Resilient Polling Fallback (6s interval, halts when terminal)
    const interval = setInterval(() => {
      if (!isMounted) return;
      if (isTerminal) {
        clearInterval(interval);
        return;
      }
      fetchToken(true).then((latestToken) => {
        if (latestToken?.status && ['SERVED', 'COMPLETED', 'CANCELLED', 'SKIPPED'].includes(latestToken.status)) {
          isTerminal = true;
          clearInterval(interval);
        }
      });
    }, 6000);

    return () => {
      isMounted = false;
      unsubscribe();
      clearInterval(interval);
    };
  }, [tokenId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans selection:bg-[#171717] selection:text-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#0F172A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-[#171717]">Connecting to Kendra Token Server...</p>
            <p className="text-xs text-[#78716C]">Retrieving citizen facilitation pass</p>
          </div>
        </main>
        <FooterSection />
      </div>
    );
  }

  if (error || !tokenData) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans selection:bg-[#171717] selection:text-white">
        <Navbar />
        <main className="flex-1 max-w-lg mx-auto px-4 py-16 text-center flex items-center justify-center">
          <div className="w-full bg-white border border-[#E7E3DC] rounded-3xl p-8 shadow-sm">
            <EmptyState
              title="Citizen Token Not Found"
              description={error || 'This citizen token has expired or is invalid.'}
              action={
                <Link to="/government-services">
                  <Button variant="primary">← Return to Citizen Services</Button>
                </Link>
              }
            />
          </div>
        </main>
        <FooterSection />
      </div>
    );
  }

  const peopleAhead = tokenData.people_ahead ?? 0;
  const position = peopleAhead + 1;

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans selection:bg-[#171717] selection:text-white">
      <Navbar />

      <main className="flex-1 py-6 sm:py-12 px-3 sm:px-6 lg:px-8 pb-28 lg:pb-12">
        <div className="max-w-md mx-auto space-y-4">

          {/* Citizen Digital Token Pass */}
          <DigitalTokenPass
            module="government"
            tokenNumber={tokenData.token_number}
            status={tokenData.status}
            position={position}
            peopleAhead={peopleAhead}
            estimatedWaitMinutes={tokenData.estimated_wait_minutes ?? 15}
            providerName={tokenData.centre_name || 'Citizen Facilitation Kendra'}
            providerSubtitle={`${tokenData.service_category || 'Statutory'} Facilitation`}
            providerAddress={
              tokenData.centre_address && tokenData.centre_city
                ? `${tokenData.centre_address}, ${tokenData.centre_city}`
                : tokenData.centre_address || ''
            }
            providerPhone={tokenData.centre_phone}
            serviceName={tokenData.service_name}
            serviceCategory={tokenData.service_category}
            customerName={tokenData.citizen_name}
            assignedTo={
              tokenData.counter_number
                ? {
                    title: 'Assigned Counter',
                    name: `${tokenData.counter_number} (${tokenData.counter_name || 'Desk'})`,
                    subtitle: tokenData.operator_name ? `Desk Officer: ${tokenData.operator_name}` : null,
                    room: tokenData.counter_number,
                  }
                : null
            }
            fees={{
              officialFee: tokenData.official_fee,
              facilitationFee: tokenData.facilitation_fee,
              note: 'Statutory government and Kendra assistance fees are payable directly at the assigned desk.',
            }}
            qrValue={typeof window !== 'undefined' ? `${window.location.origin}/government/token/${tokenData.token_number || tokenData.id}` : ''}
            lastRefreshed={lastRefreshed}
            isRefreshing={refreshing}
            onRefresh={() => fetchToken(false)}
            canCancel={tokenData.status === 'WAITING'}
            isCancelling={cancelling}
            onCancel={handleCancel}
            dashboardLink={null}
            backLink={{ to: '/government-services', label: 'Return to Kendra Directory' }}
          />

          {/* Citizen Guidance Notice */}
          <div className="p-4 rounded-2xl bg-white border border-[#E7E3DC] text-xs leading-relaxed text-[#57534E] shadow-sm">
            <strong className="text-[#171717] font-semibold block mb-1">Citizen Instructions</strong>
            Please keep your Aadhaar, original documents, and photocopies ready for desk verification. Present this digital pass or printed slip when your counter is announced.
          </div>

        </div>
      </main>

      <FooterSection />
    </div>
  );
}
