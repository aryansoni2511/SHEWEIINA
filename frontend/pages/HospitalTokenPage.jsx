import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../Navbar';
import FooterSection from '../FooterSection';
import { getHospitalTokenApi, cancelQueueTokenApi } from '../services/api';
import { subscribeQueueRealtime } from '../services/realtime';
import DigitalTokenPass from '../components/DigitalTokenPass';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

/**
 * Hospital OPD Token & Consultation Pass Page
 * Seamlessly powered by SHEWWINA Editorial Digital Token Pass
 */
export default function HospitalTokenPage() {
  const { tokenId } = useParams();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchToken = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setErrorMessage(null);

    try {
      const res = await getHospitalTokenApi(tokenId);
      if (res.data?.token) {
        setToken(res.data.token);
        setLastRefreshed(new Date());
        return res.data.token;
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to retrieve OPD token status.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    return null;
  };

  const handleCancel = async () => {
    if (!token?.id) return;
    if (!window.confirm('Are you sure you want to cancel this OPD consultation appointment?')) return;
    setCancelling(true);
    try {
      await cancelQueueTokenApi(token.id);
      await fetchToken(true);
    } catch (err) {
      alert(err.message || 'Failed to cancel appointment.');
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

    // 2. Resilient Polling Fallback (8s interval, halts when terminal)
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
    }, 8000);

    return () => {
      isMounted = false;
      unsubscribe();
      clearInterval(interval);
    };
  }, [tokenId]);

  /* Loading state */
  if (loading) {
    return (
      <div className="bg-[#FAF8F5] min-h-screen flex flex-col font-sans selection:bg-[#171717] selection:text-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#1E40AF] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-[#171717]">Retrieving live OPD token...</p>
            <p className="text-xs text-[#78716C]">Connecting to hospital OPD queue</p>
          </div>
        </main>
        <FooterSection />
      </div>
    );
  }

  /* Error state */
  if (errorMessage || !token) {
    return (
      <div className="bg-[#FAF8F5] min-h-screen flex flex-col font-sans selection:bg-[#171717] selection:text-white">
        <Navbar />
        <main className="flex-1 max-w-lg mx-auto px-4 py-16 text-center flex items-center justify-center">
          <div className="w-full bg-white border border-[#E7E3DC] rounded-3xl p-8 shadow-sm">
            <EmptyState
              title="OPD Token Not Found"
              description={errorMessage || 'Invalid token reference or the OPD consultation session has expired.'}
              action={
                <Link to="/hospitals">
                  <Button variant="primary">← Find a Hospital</Button>
                </Link>
              }
            />
          </div>
        </main>
        <FooterSection />
      </div>
    );
  }

  const peopleAheadCount = token.position > 1 ? token.position - 1 : 0;

  return (
    <div className="bg-[#FAF8F5] min-h-screen flex flex-col font-sans selection:bg-[#171717] selection:text-white">
      <Navbar />

      <main className="flex-1 py-6 sm:py-12 px-3 sm:px-6 lg:px-8 pb-28 lg:pb-12">
        <div className="max-w-md mx-auto space-y-4">

          {/* Hospital OPD Token Pass */}
          <DigitalTokenPass
            module="hospital"
            tokenNumber={token.token_number}
            status={token.status}
            position={token.position}
            peopleAhead={peopleAheadCount}
            estimatedWaitMinutes={token.estimated_wait_minutes}
            providerName={token.hospital_name || 'Hospital OPD Department'}
            providerAddress={token.hospital_address}
            providerPhone={token.hospital_phone}
            serviceName={token.department_name ? `Department of ${token.department_name}` : 'General OPD Consultation'}
            customerName={token.patient_name}
            customerCode={token.patient_code ? `ID: ${token.patient_code}` : 'Walk-in'}
            assignedTo={{
              title: 'Attending Consultant',
              name: token.doctor_name || 'Consultant Physician',
              subtitle: token.doctor_qualification || 'MBBS / Specialist',
              room: token.room_number ? `Cabin ${token.room_number}` : 'OPD Cabin',
            }}
            qrValue={typeof window !== 'undefined' ? `${window.location.origin}/hospital/token/${token.token_number || token.id}` : ''}
            lastRefreshed={lastRefreshed}
            isRefreshing={refreshing}
            onRefresh={() => fetchToken(true)}
            canCancel={token.status === 'WAITING'}
            isCancelling={cancelling}
            onCancel={handleCancel}
            dashboardLink={null}
            backLink={{ to: '/hospitals', label: 'Hospital Directory & OPD Queues' }}
          />

          {/* Hospital Clinical Guidance Note */}
          <div className="p-4 rounded-2xl bg-white border border-[#E7E3DC] text-xs leading-relaxed text-[#57534E] shadow-sm">
            <strong className="text-[#171717] font-semibold block mb-1">OPD Patient Guidance</strong>
            Please remain seated in the department waiting lounge. An announcement will sound and your pass will illuminate when called into the consultant's cabin.
          </div>

        </div>
      </main>

      <FooterSection />
    </div>
  );
}
