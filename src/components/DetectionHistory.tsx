
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useDetectionHistory } from '@/hooks/useDetectionHistory';
import { History, Trash2, Volume2, Clock, Calendar, Trophy, Filter, Star, Sparkles, Target } from 'lucide-react';

export const DetectionHistory: React.FC = () => {
  const { history, clearHistory, getMostUsedSignToday, getHistoryByDateRange } = useDetectionHistory();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredHistory, setFilteredHistory] = useState(history);
  const [showFilters, setShowFilters] = useState(false);

  const mostUsedToday = getMostUsedSignToday();

  const handleDateFilter = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const filtered = getHistoryByDateRange(start, end);
      setFilteredHistory(filtered);
    } else {
      setFilteredHistory(history);
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setFilteredHistory(history);
  };

  React.useEffect(() => {
    setFilteredHistory(history);
  }, [history]);

  if (history.length === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-dashed border-blue-300">
        <div className="text-center text-gray-500">
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <History className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-700">Sin Historial</h3>
          <p className="text-sm">Las detecciones aparecerán aquí cuando uses la cámara</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Seña más utilizada hoy */}
      {mostUsedToday && (
        <Card className="p-4 bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-100 border-2 border-yellow-300 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-yellow-200 to-orange-200 p-2 rounded-full">
              <Trophy className="w-5 h-5 text-yellow-700" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Star className="w-4 h-4 text-yellow-600" />
                <h4 className="font-semibold text-yellow-800">Seña Estrella del Día</h4>
              </div>
              <p className="text-sm text-yellow-700">
                <span className="font-medium bg-yellow-200 px-2 py-1 rounded-full">{mostUsedToday.sign}</span>
                <span className="ml-2 text-yellow-600">
                  {mostUsedToday.count} detección{mostUsedToday.count > 1 ? 'es' : ''}
                </span>
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
          </div>
        </Card>
      )}

      <Card className="p-4 sm:p-6 bg-gradient-to-br from-white via-purple-50 to-blue-50 border-2 border-purple-200 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-2 rounded-full">
              <History className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Historial de Detecciones
            </h3>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className="text-blue-600 hover:bg-blue-50 border-blue-300"
            >
              <Filter className="w-4 h-4 mr-1" />
              Filtros
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearHistory}
              className="text-red-600 hover:bg-red-50 border-red-300"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Limpiar
            </Button>
          </div>
        </div>

        {/* Filtros de fecha */}
        {showFilters && (
          <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border-2 border-blue-200 space-y-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Filtrar por fechas</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fecha inicio</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-sm border-blue-200 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fecha fin</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-sm border-blue-200 focus:border-blue-400"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                onClick={handleDateFilter} 
                className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Target className="w-3 h-3 mr-1" />
                Aplicar Filtro
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={clearFilters} 
                className="text-xs border-gray-300"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        )}
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredHistory.map((entry, index) => (
            <div 
              key={entry.id} 
              className={`flex items-start space-x-3 p-3 rounded-lg border-2 ${
                index % 3 === 0 ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200' :
                index % 3 === 1 ? 'bg-gradient-to-r from-pink-50 to-pink-100 border-pink-200' :
                'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200'
              } hover:shadow-md transition-all duration-200`}
            >
              <div className="flex-shrink-0 mt-1">
                <div className={`p-1 rounded-full ${
                  index % 3 === 0 ? 'bg-blue-200' :
                  index % 3 === 1 ? 'bg-pink-200' :
                  'bg-purple-200'
                }`}>
                  <Clock className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-gray-800 truncate flex items-center">
                    <Sparkles className="w-3 h-3 mr-1 text-yellow-500" />
                    {entry.signName}
                  </h4>
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                    {entry.timestamp.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{entry.signDescription}</p>
                
                {entry.voiceAlert && (
                  <div className="flex items-center space-x-1 mb-2 p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded text-xs border border-blue-200">
                    <Volume2 className="w-3 h-3 text-blue-600" />
                    <span className="text-blue-800 italic truncate">"{entry.voiceAlert}"</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs bg-gradient-to-r from-green-100 to-emerald-100 text-green-800">
                    {(entry.confidence * 100).toFixed(1)}%
                  </Badge>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {entry.timestamp.toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {filteredHistory.length === 0 && startDate && endDate && (
            <div className="text-center text-gray-500 py-8">
              <div className="bg-gradient-to-r from-gray-100 to-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm">No hay detecciones en el rango de fechas seleccionado</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
