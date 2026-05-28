import React, { useMemo, useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { VCStatus, VC } from '../types';
import { PREDEFINED_ROOMS } from '../constants';
import Card from './common/Card';
import ContactSticker from './common/ContactSticker';
import VCDetailsModal from './VCDetailsModal';
import Modal from './common/Modal';
import Button from './common/Button';

const LivePulse = () => (
    <span className="relative flex h-2 w-2 mr-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
    </span>
);

interface RoomUsageSectionProps {
    onRoomClick?: (roomIp: string) => void;
}

const RoomUsageSection: React.FC<RoomUsageSectionProps> = ({ onRoomClick }) => {
    const { vcs, getUserById } = useAppContext();
    const [selectedVC, setSelectedVC] = useState<VC | null>(null);
    const [selectedStandbyRoom, setSelectedStandbyRoom] = useState<any | null>(null);

    const activeRooms = useMemo(() => {
        return vcs.filter(vc => vc.status === VCStatus.InProgress && (vc.roomIp || vc.roomName));
    }, [vcs]);

    const roomsStatus = useMemo(() => {
        return PREDEFINED_ROOMS.map(preRoom => {
            const activeVC = activeRooms.find(vc => vc.roomIp === preRoom.ip || vc.roomName === preRoom.name);
            const conductor = activeVC?.conductorId ? getUserById(activeVC.conductorId) : null;
            return {
                ...preRoom,
                isActive: !!activeVC,
                isTechnicalIssue: activeVC?.technicalIssue || false,
                issueDescription: activeVC?.technicalIssueDescription,
                vc: activeVC,
                conductorName: conductor ? conductor.name : 'Unassigned'
            };
        });
    }, [activeRooms, getUserById]);

    const handleCardClick = (room: typeof roomsStatus[0]) => {
        if (room.isActive && room.vc) {
            setSelectedVC(room.vc);
        } else {
            setSelectedStandbyRoom(room);
        }
        onRoomClick?.(room.ip);
    };

    return (
        <section id="satellite-terminals-section" className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full mr-3 animate-pulse"></div>
                    Satellite Terminals
                </h3>
                <div className="flex gap-4">
                    <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mr-2"></span> Standby
                    </div>
                    <div className="flex items-center text-[10px] font-bold text-red-500 uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></span> Active
                    </div>
                </div>
            </div>

            <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar px-1">
                {roomsStatus.map((room) => (
                    <div 
                        key={room.ip} 
                        id={`terminal-card-${room.ip.replace(/\./g, '-')}`}
                        onClick={() => handleCardClick(room)}
                        className={`flex-shrink-0 w-60 p-5 rounded-[2rem] border transition-all duration-500 relative group cursor-pointer ${
                            room.isTechnicalIssue
                            ? 'bg-red-100/50 dark:bg-red-900/20 border-red-500 hover:border-red-600 shadow-md'
                            : room.isActive 
                            ? 'bg-white dark:bg-slate-900 border-red-500/30 shadow-lg shadow-red-500/5 scale-105 z-10 hover:border-red-500/60' 
                            : 'bg-white dark:bg-slate-900/40 border-slate-100 dark:border-white/5 opacity-80 hover:opacity-100 hover:border-slate-300 dark:hover:border-white/20'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col">
                                <h4 className="font-black text-xs text-slate-900 dark:text-white uppercase truncate pr-2 tracking-tighter">{room.name}</h4>
                                <span className="text-[9px] font-mono text-slate-400 dark:text-slate-600">{room.ip}</span>
                            </div>
                            {room.isActive ? <LivePulse /> : <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800 mr-2"></div>}
                        </div>

                        {room.isActive && room.vc ? (
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">
                                    "{room.vc.subject}"
                                </p>
                                
                                {room.isTechnicalIssue && (
                                    <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20 text-[9px] font-bold text-red-600 dark:text-red-400 animate-pulse">
                                        SYSTEM ALERT: {room.issueDescription?.substring(0, 20)}...
                                    </div>
                                )}

                                <div className="text-[10px] font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-100/60 dark:border-slate-800/60">
                                    <span className="text-slate-400 font-bold tracking-tight">Conductor:</span>{' '}
                                    <span className="font-extrabold text-slate-900 dark:text-white uppercase">{room.conductorName}</span>
                                </div>

                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <ContactSticker label="VC" userId={room.vc.conductorId} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.2em]">
                                READY_TO_LINK
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Active VC Details Modal */}
            <VCDetailsModal vc={selectedVC} onClose={() => setSelectedVC(null)} />

            {/* Standby Terminal Details Modal */}
            {selectedStandbyRoom && (
                <Modal
                    isOpen={!!selectedStandbyRoom}
                    onClose={() => setSelectedStandbyRoom(null)}
                    title="Satellite Terminal Standby Check"
                >
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-700/50 pb-4">
                            <div className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-tight">{selectedStandbyRoom.name}</h4>
                                <p className="text-xs font-mono text-slate-400 dark:text-slate-500">{selectedStandbyRoom.ip}</p>
                            </div>
                        </div>

                        <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    🟢 Standby
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/60">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hardware Link</span>
                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase">Ready to receive</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/60">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live conference</span>
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">None actively running</span>
                            </div>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-center px-2">
                            This terminal is fully operational and waiting for a scheduled conference connection. Once a conductor starts a video conference with this terminal assigned, the live stream status will activate instantly.
                        </p>

                        <div className="flex justify-end pt-2">
                            <Button variant="secondary" onClick={() => setSelectedStandbyRoom(null)}>Close</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </section>
    );
};

export default RoomUsageSection;
