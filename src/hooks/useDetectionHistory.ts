
import { useState, useEffect } from 'react';
import { DetectionResult } from '@/types/sign';

interface HistoryEntry {
  id: string;
  signName: string;
  signDescription: string;
  confidence: number;
  timestamp: Date;
  voiceAlert?: string;
}

export const useDetectionHistory = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Cargar historial del localStorage al inicializar
  useEffect(() => {
    const savedHistory = localStorage.getItem('detection_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        const historyWithDates = parsed.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
        setHistory(historyWithDates);
      } catch (error) {
        console.error('Error cargando historial:', error);
      }
    }
  }, []);

  // Guardar historial en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('detection_history', JSON.stringify(history));
  }, [history]);

  const addDetection = (detection: DetectionResult) => {
    const newEntry: HistoryEntry = {
      id: Date.now().toString(),
      signName: detection.sign.name,
      signDescription: detection.sign.description,
      confidence: detection.confidence,
      timestamp: new Date(), // Usar fecha y hora actual real
      voiceAlert: detection.sign.voiceAlert
    };

    setHistory(prev => [newEntry, ...prev].slice(0, 100)); // Mantener más entradas
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('detection_history');
  };

  const getStats = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      total: history.length,
      today: history.filter(entry => entry.timestamp >= todayStart).length,
      thisWeek: history.filter(entry => entry.timestamp >= weekStart).length,
      avgConfidence: history.length > 0 
        ? history.reduce((sum, entry) => sum + entry.confidence, 0) / history.length
        : 0
    };
  };

  const getMostUsedSignToday = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEntries = history.filter(entry => entry.timestamp >= todayStart);
    
    if (todayEntries.length === 0) return null;

    const signCounts = todayEntries.reduce((acc, entry) => {
      acc[entry.signName] = (acc[entry.signName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostUsed = Object.entries(signCounts).reduce((max, [sign, count]) => 
      count > max.count ? { sign, count } : max, 
      { sign: '', count: 0 }
    );

    return mostUsed.count > 0 ? mostUsed : null;
  };

  const getHistoryByDateRange = (startDate: Date, endDate: Date) => {
    return history.filter(entry => 
      entry.timestamp >= startDate && entry.timestamp <= endDate
    );
  };

  return {
    history,
    addDetection,
    clearHistory,
    getStats,
    getMostUsedSignToday,
    getHistoryByDateRange
  };
};
