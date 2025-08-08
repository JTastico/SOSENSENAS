
import React from 'react';
import { Card } from '@/components/ui/card';
import { useSigns } from '@/hooks/useSigns';
import { useDetectionHistory } from '@/hooks/useDetectionHistory';
import { Activity, Database, TrendingUp, Clock, History, Zap, Target, Award } from 'lucide-react';

export const Statistics: React.FC = () => {
  const { signs } = useSigns();
  const { getStats } = useDetectionHistory();
  
  const detectionStats = getStats();
  const totalSigns = signs.length;
  const avgConfidence = totalSigns > 0 
    ? signs.reduce((acc, sign) => acc + sign.confidence, 0) / totalSigns 
    : 0;

  const stats = [
    {
      title: 'Total de Señas',
      value: totalSigns,
      icon: Database,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-r from-blue-100 to-blue-200',
      cardBg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      borderColor: 'border-blue-300'
    },
    {
      title: 'Detecciones Hoy',
      value: detectionStats.today,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-r from-green-100 to-green-200',
      cardBg: 'bg-gradient-to-br from-green-50 to-green-100',
      borderColor: 'border-green-300'
    },
    {
      title: 'Confianza Promedio',
      value: totalSigns > 0 ? `${(avgConfidence * 100).toFixed(1)}%` : '0%',
      icon: TrendingUp,
      color: 'text-pink-600',
      bgColor: 'bg-gradient-to-r from-pink-100 to-pink-200',
      cardBg: 'bg-gradient-to-br from-pink-50 to-pink-100',
      borderColor: 'border-pink-300'
    },
    {
      title: 'Historial Total',
      value: detectionStats.total,
      icon: History,
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-r from-purple-100 to-purple-200',
      cardBg: 'bg-gradient-to-br from-purple-50 to-purple-100',
      borderColor: 'border-purple-300'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Award className="w-6 h-6 text-yellow-500" />
        <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          Estadísticas del Sistema
        </h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <Card 
            key={index} 
            className={`p-3 sm:p-4 ${stat.cardBg} border-2 ${stat.borderColor} hover:shadow-xl transition-all duration-300 hover:scale-105 transform relative overflow-hidden`}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/20 to-transparent rounded-full -translate-y-4 translate-x-4"></div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-700 mb-1 font-medium flex items-center">
                  <Zap className="w-3 h-3 mr-1 text-yellow-500" />
                  {stat.title}
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
              <div className={`p-2 sm:p-3 rounded-full ${stat.bgColor} shadow-lg`}>
                <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              <div className={`h-1 bg-gradient-to-r ${stat.bgColor} rounded-full flex-1`}></div>
              <Target className="w-3 h-3 ml-2 text-gray-400" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
