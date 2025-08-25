
import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import logo from '../assets/logo_senas.png';
interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadingComplete }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    // Simular tiempo de carga de 3 segundos
    const timer = setTimeout(() => {
      onLoadingComplete();
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onLoadingComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-pink-50 to-purple-50">
      <div className="text-center space-y-6 p-8">
        {/* Logo de la empresa */}
        <div className="flex items-center justify-center mb-8">
          <img 
            src={logo}
            alt="SOS en SEÑAS" 
            className="w-24 h-24 mr-4 animate-pulse" 
          />
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-pink-500 bg-clip-text text-transparent">
              SOS en SEÑAS
            </h1>
            <p className="text-blue-600 font-medium text-lg">Reconocimiento de Señas</p>
          </div>
        </div>

        {/* Mensaje de carga */}
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-pink-500 mr-2 animate-spin" />
            <span className="text-xl font-semibold text-gray-800">
              Espere por favor{dots}
            </span>
          </div>
          
          {/* Barra de progreso animada */}
          <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-gradient-to-r from-blue-500 to-pink-500 rounded-full animate-pulse-gradient bg-[length:200%_100%]"></div>
          </div>
          
          <p className="text-sm text-gray-600">
            Iniciando sistema de detección...
          </p>
        </div>

        {/* Elementos decorativos */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-20 right-20 w-16 h-16 bg-pink-200 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-20 left-20 w-12 h-12 bg-purple-200 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-10 right-10 w-18 h-18 bg-blue-300 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '1.5s' }}></div>
      </div>
    </div>
  );
};
