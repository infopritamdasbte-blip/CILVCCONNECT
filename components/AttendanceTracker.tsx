import React, { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { AttendanceStatus, Attendance, UserRole } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Modal from './common/Modal';
import RequestAttendanceChangeModal from './RequestAttendanceChangeModal';
import { 
  MapPin, 
  Compass, 
  Satellite, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  RefreshCw,
  Locate,
  History,
  Info
} from 'lucide-react';

interface AttendanceTrackerProps {
  conductorId: string;
}

// Coal India Limited HQ, Kolkata Core Geolocation Details
const CIL_HQ_COORDS = {
  latitude: 22.57925,
  longitude: 88.45992,
  name: "CIL HQ, Kolkata (Newtown)",
  address: "Premise No-04 MAR, Plot No-AF-III, Action Area-1A, Newtown, Rajarhat, Kolkata, West Bengal 700156"
};

// Help calculate real distance in meters using Haversine algorithm
const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

interface AutoLog {
  id: string;
  time: string;
  event: 'Checked In' | 'Checked Out' | 'Leave Mode' | 'Autopilot Toggle';
  details: string;
  distance: number | null;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ conductorId }) => {
  const { 
    currentUser,
    attendance, 
    markInTime, 
    markOutTime, 
    markOnLeave, 
    attendanceMode, 
    geofenceRange, 
    requestAttendanceChange, 
    attendanceChangeRequests 
  } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);
  const [isChangeRequestModalOpen, setIsChangeRequestModalOpen] = useState(false);

  // Auto Attendance Geofence states are governed globally by Reporting Authority setting
  const isAutoAttendanceEnabled = false;

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const todaysAttendance = useMemo(() => {
    return attendance.find(a => a.conductorId === conductorId && a.date === todayStr);
  }, [attendance, conductorId, todayStr]);

  const todaysPendingRequest = useMemo(() => {
    return attendanceChangeRequests.find(r => r.conductorId === conductorId && r.date === todayStr && r.status === 'Pending');
  }, [attendanceChangeRequests, conductorId, todayStr]);

  const handleManualInRequest = () => {
    requestAttendanceChange({
      conductorId,
      date: todayStr,
      requestedInTime: new Date().toISOString(),
      requestedOutTime: null,
      reason: "Manual In-Time Attendance Check-in (Awaiting RA Approval)"
    });
  };

  const handleManualLeaveRequest = () => {
    requestAttendanceChange({
      conductorId,
      date: todayStr,
      requestedInTime: "LEAVE",
      requestedOutTime: null,
      reason: "Manual Leave Request (Awaiting RA Approval)"
    });
  };

  const handleManualOutRequest = () => {
    if (!todaysAttendance || !todaysAttendance.inTime) return;
    requestAttendanceChange({
      conductorId,
      date: todayStr,
      requestedInTime: todaysAttendance.inTime,
      requestedOutTime: new Date().toISOString(),
      reason: "Manual Out-Time Attendance Check-out (Awaiting RA Approval)"
    });
  };

  const conductorAttendanceMap = useMemo(() => {
    const map = new Map<string, Attendance>();
    attendance
      .filter(a => a.conductorId === conductorId)
      .forEach(a => {
        map.set(a.date, a);
      });
    return map;
  }, [attendance, conductorId]);

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.Present:
        return 'text-green-400';
      case AttendanceStatus.OnLeave:
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };
  
  const formatTime = (isoString?: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const blanks = Array(firstDayOfMonth).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    return (
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-5 h-5 text-cyan-400" />
          <h4 className="font-bold text-lg text-white">Duty Log Calendar</h4>
        </div>
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-white/5 shadow-inner">
            <div className="flex justify-between items-center mb-4">
                <Button onClick={goToPreviousMonth} variant="secondary" className="px-3 py-1 text-xs font-bold !rounded-lg hover:bg-slate-600 transition-colors">&lt;</Button>
                <h5 className="font-bold text-base text-cyan-100 uppercase tracking-widest">{monthName} {year}</h5>
                <Button onClick={goToNextMonth} variant="secondary" className="px-3 py-1 text-xs font-bold !rounded-lg hover:bg-slate-600 transition-colors">&gt;</Button>
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => <div key={`${day}-${i}`}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1.5 mt-2">
                {blanks.map((_, i) => <div key={`blank-${i}`} />)}
                {days.map(day => {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const record = conductorAttendanceMap.get(dateStr);
                    const isToday = isCurrentMonth && day === today.getDate();

                    let dayClasses = "h-11 w-11 mx-auto flex flex-col items-center justify-center rounded-xl text-xs font-black transition-all relative";
                    if (isToday) dayClasses += " ring-2 ring-cyan-500 ring-offset-2 ring-offset-slate-800 bg-cyan-950/20 text-cyan-100";
                    
                    if (record) {
                        dayClasses += " cursor-pointer hover:scale-110";
                    }

                    if (record?.status === AttendanceStatus.Present) {
                        dayClasses += " bg-green-500/20 text-green-300 border border-green-500/30";
                    } else if (record?.status === AttendanceStatus.OnLeave) {
                        dayClasses += " bg-yellow-500/20 text-yellow-300 border border-yellow-500/30";
                    } else {
                        dayClasses += " text-slate-400 hover:bg-slate-700/40"
                    }

                    return (
                        <button 
                          key={day} 
                          className={dayClasses} 
                          title={record ? `${record.status} (${record.inTime ? 'Marked' : 'N/A'})` : "No Record"} 
                          onClick={() => record && setSelectedRecord(record)}
                          disabled={!record}
                        >
                            <span>{day}</span>
                            {record?.status === AttendanceStatus.Present && (
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-0.5" />
                            )}
                            {record?.status === AttendanceStatus.OnLeave && (
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-0.5" />
                            )}
                        </button>
                    );
                })}
            </div>
            <div className="flex justify-center items-center gap-6 mt-6 pt-3 border-t border-slate-700/60 text-[10px] font-bold uppercase tracking-widest">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-lg bg-green-500/30 border border-green-500/40"></span>
                    <span className="text-slate-300">Present</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-lg bg-yellow-500/30 border border-yellow-500/40"></span>
                    <span className="text-slate-300">On Leave</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-lg border border-cyan-500/80"></span>
                    <span className="text-slate-300">Today</span>
                </div>
            </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="!p-6 bg-slate-900 border border-white/5 relative overflow-hidden rounded-[2rem] shadow-xl">
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Duty Attendance Engine</h3>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
              Approval-based Manual logs
            </p>
          </div>
          <Button variant="secondary" onClick={() => setIsChangeRequestModalOpen(true)} className="!rounded-xl border-dashed !text-xs font-bold uppercase tracking-wider">
              Request Time Correction
          </Button>
        </div>

        {/* 📋 CURRENT ATTENDANCE LOGICAL BADGE CARD */}
        <div className="bg-slate-800/60 p-5 rounded-2xl border border-white/5">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1 mb-1">Service Stamp Date</p>
              <h4 className="font-bold text-lg text-white">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h4>
            </div>

            {todaysAttendance ? (
              <div className="flex items-center gap-3 bg-slate-950/40 py-2.5 px-4 rounded-xl border border-white/5">
                <div className={`h-2.5 w-2.5 rounded-full animate-ping ${
                  todaysAttendance.status === AttendanceStatus.Present ? 'bg-green-400' : 'bg-yellow-400'
                }`} />
                <div className="text-slate-300">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Marked Status</p>
                  <p className={`font-black text-sm uppercase tracking-wider ${getStatusColor(todaysAttendance.status)}`}>
                    {todaysAttendance.status}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-slate-950/40 py-2.5 px-4 rounded-xl border border-white/5">
                <div className="h-2.5 w-2.5 rounded-full bg-slate-500" />
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Marked Status</p>
                  <p className="font-bold text-sm text-slate-400 uppercase tracking-wider">Unmarked</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700/60">
            {todaysPendingRequest ? (
              <div className="bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20 text-yellow-300">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1.5 animate-pulse">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  Authorization Pending
                </p>
                <p className="text-xs text-yellow-100 font-semibold leading-relaxed">
                  Your manual {todaysPendingRequest.requestedInTime === 'LEAVE' ? 'Leave' : 'Attendance'} request has been submitted to the Reporting Authority and is awaiting approval. Keep checking back!
                </p>
              </div>
            ) : todaysAttendance ? (
              <div className="space-y-3">
                {todaysAttendance.status === AttendanceStatus.Present && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">In-Office Arrival stamp</p>
                      <p className="font-black text-white text-base font-mono">
                        {todaysAttendance.inTime ? formatTime(todaysAttendance.inTime) : 'N/A'}
                      </p>
                    </div>
                    
                    <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Out-of-Office Departure stamp</p>
                        <p className="font-black text-white text-base font-mono">
                          {todaysAttendance.outTime ? formatTime(todaysAttendance.outTime) : 'Ongoing Duty'}
                        </p>
                      </div>
                      
                      {!todaysAttendance.outTime && (
                        <Button onClick={handleManualOutRequest} className="mt-2 w-full !py-1 text-xs font-bold uppercase tracking-wider">
                          Manual Out Time
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {todaysAttendance.status === AttendanceStatus.OnLeave && (
                  <div className="bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20">
                    <p className="text-[10px] text-yellow-400 uppercase font-bold tracking-widest mb-1 flex items-center gap-1.5 animate-pulse">
                      <Clock className="w-3.5 h-3.5" />
                      Day Off Marked
                    </p>
                    <p className="text-xs text-yellow-100 font-semibold leading-relaxed">
                      You are marked as "On Leave" for today. Automatic location triggers and manual clockings are closed. Please request an Attendance correction if you need to reverse this.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-400 font-semibold mb-4 leading-relaxed">
                  No active attendance is filed for today. Manual mode is configured: file request timestamps to get authorization from the Reporting Authority.
                </p>
                <div className="flex gap-3">
                  <Button variant="success" onClick={handleManualInRequest} className="flex-1 !py-2.5 font-bold uppercase text-xs tracking-widest">
                    Manual In Time
                  </Button>
                  <Button variant="secondary" onClick={handleManualLeaveRequest} className="flex-1 !py-2.5 font-bold uppercase text-xs tracking-widest">
                    Mark On Leave
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CALENDAR HISTORY */}
        {renderCalendar()}
      </div>

      {/* DETAILED LOG RECORD MODAL */}
      {selectedRecord && (
        <Modal isOpen={!!selectedRecord} onClose={() => setSelectedRecord(null)} title="Historical Log Sheet">
            <div className="space-y-4">
                <div className="bg-slate-900 border border-white/5 p-4 rounded-xl">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Calendar Service Date</p>
                    <p className="font-bold text-lg text-white">
                      {new Date(selectedRecord.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900 border border-white/5 p-4 rounded-xl">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Duty Status</p>
                      <span className={`font-black text-sm uppercase tracking-wider ${getStatusColor(selectedRecord.status)}`}>
                        {selectedRecord.status}
                      </span>
                  </div>

                  {selectedRecord.status === AttendanceStatus.Present && (
                    <div className="bg-slate-900 border border-white/5 p-4 rounded-xl">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Arrival Time</p>
                        <p className="font-black text-white text-base font-mono">{formatTime(selectedRecord.inTime)}</p>
                    </div>
                  )}
                </div>

                {selectedRecord.status === AttendanceStatus.Present && (
                    <div className="bg-slate-900 border border-white/5 p-4 rounded-xl">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Departure Time</p>
                        <p className="font-black text-white text-base font-mono">
                          {selectedRecord.outTime ? formatTime(selectedRecord.outTime) : 'Not Checked Out / Ongoing'}
                        </p>
                    </div>
                )}
            </div>
            <div className="flex justify-end mt-8">
                <Button variant="secondary" onClick={() => setSelectedRecord(null)} className="!rounded-xl font-bold uppercase text-xs tracking-widest">Close Record</Button>
            </div>
        </Modal>
      )}

      {/* TIME CORRECTION REQUEST MODAL */}
      <RequestAttendanceChangeModal
        isOpen={isChangeRequestModalOpen}
        onClose={() => setIsChangeRequestModalOpen(false)}
        conductorId={conductorId}
       />
    </Card>
  );
};

export default AttendanceTracker;
