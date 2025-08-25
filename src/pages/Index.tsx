
import React, { useState } from 'react';
import { CameraView } from '@/components/CameraView';
import { DetectionAlert } from '@/components/DetectionAlert';
import { SignsDatabase } from '@/components/SignsDatabase';
import { Statistics } from '@/components/Statistics';
import { DetectionHistory } from '@/components/DetectionHistory';
import { BottomNavigation } from '@/components/BottomNavigation';
import { HomeTab } from '@/components/HomeTab';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Card } from '@/components/ui/card';
import { Hand, Sparkles, Zap, Shield, Target, Brain } from 'lucide-react';
import { useSigns } from '@/hooks/useSigns';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isLoading, setIsLoading] = useState(true);
  const { signs } = useSigns();

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab onNavigate={setActiveTab} />;
      case 'camera':
        return <CameraView />;
      case 'detection':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pb-20">
            <Card className="p-6 bg-gradient-to-br from-white via-blue-50 to-purple-50 border-2 border-blue-300 shadow-xl">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
                  <Hand className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Sistema de Reconocimiento
                </h2>
              </div>
            </Card>
          </div>
        );
      case 'database':
        return (
          <div className="pb-20">
            <SignsDatabase />
          </div>
        );
      case 'stats':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 space-y-6 pb-20">
            <Statistics />
            <DetectionHistory />
            <Card className="p-6 bg-gradient-to-br from-white via-blue-50 to-purple-50 border-2 border-blue-300 shadow-xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-2 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Resumen del Sistema
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-blue-600 flex items-center">
                    <Target className="w-4 h-4 mr-1" />
                    Señas en Base de Datos:
                  </h4>
                  <div className="space-y-2">
                    {signs.length === 0 ? (
                      <p className="text-gray-500 p-2 bg-gray-50 rounded border-2 border-dashed border-gray-300">
                        No hay señas guardadas
                      </p>
                    ) : (
                      signs.slice(0, 4).map((sign, index) => (
                        <div key={sign.id} className={`flex items-center p-2 rounded shadow-sm ${
                          index % 4 === 0 ? 'bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200' :
                          index % 4 === 1 ? 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200' :
                          index % 4 === 2 ? 'bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200' :
                          'bg-gradient-to-r from-green-50 to-green-100 border border-green-200'
                        }`}>
                          <span className="text-pink-500 mr-2">👋</span>
                          <span className="font-medium">{sign.name}</span>
                          <span className="text-gray-500 text-xs ml-auto">
                            {(sign.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );
      default:
        return <HomeTab onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-4 max-w-md">
        {renderContent()}
      </div>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
