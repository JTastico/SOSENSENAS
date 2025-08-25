
import React from 'react';
import { Card } from '@/components/ui/card';
import { Camera, Hand, Database, BarChart3, Play, Sparkles, Zap, Target } from 'lucide-react';
import { useSigns } from '@/hooks/useSigns';
import madreImg from "../assets/madre_inicio.png";
import logoSenas from "../assets/logo_senas.png";

interface HomeTabProps {
  onNavigate: (tab: string) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({ onNavigate }) => {
  const { signs } = useSigns();

  const quickActions = [
    {
      id: 'camera',
      title: 'Iniciar Cámara',
      description: 'Reconocimiento en tiempo real',
      icon: Camera,
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-gradient-to-r from-blue-100 to-blue-200',
      iconColor: 'text-blue-600',
      hoverGlow: 'hover:shadow-blue-200'
    },

    //Lista de acciones rápidas, deshabilitadas temporalmente


    // {
    //   id: 'detection',
    //   title: 'Ver Detección',
    //   description: 'Estado del sistema',
    //   icon: Hand,
    //   color: 'from-pink-500 to-pink-600',
    //   iconBg: 'bg-gradient-to-r from-pink-100 to-pink-200',
    //   iconColor: 'text-pink-600',
    //   hoverGlow: 'hover:shadow-pink-200'
    // },
    // {
    //   id: 'database',
    //   title: 'Base de Señas',
    //   description: 'Explorar señas guardadas',
    //   icon: Database,
    //   color: 'from-purple-500 to-purple-600',
    //   iconBg: 'bg-gradient-to-r from-purple-100 to-purple-200',
    //   iconColor: 'text-purple-600',
    //   hoverGlow: 'hover:shadow-purple-200'
    // },
    // {
    //   id: 'stats',
    //   title: 'Estadísticas',
    //   description: 'Ver métricas del sistema',
    //   icon: BarChart3,
    //   color: 'from-green-500 to-green-600',
    //   iconBg: 'bg-gradient-to-r from-green-100 to-green-200',
    //   iconColor: 'text-green-600',
    //   hoverGlow: 'hover:shadow-green-200'
    // }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 space-y-6 pb-20">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <img
              src={logoSenas}
              alt="SOS en SEÑAS"
              className=" h-20 mr-4 drop-shadow-lg"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              SOS en SEÑAS
            </h1>
            <p className="text-blue-600 font-medium">Reconocimiento Inteligente</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent px-2 flex items-center">
          <Target className="w-5 h-5 mr-2 text-blue-500" />
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {quickActions.map((action) => (
            <Card
              key={action.id}
              className={`p-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer ${action.hoverGlow} hover:scale-[1.02] transform`}
              onClick={() => onNavigate(action.id)}
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${action.iconBg} shadow-md`}>
                  <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-2 rounded-full">
                  <Play className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>


      {/* Texto de la pagina  */}
      <div className="space-y-4">
        <h1 className="leading-[0.92] font-extrabold tracking-tight">
            <span className="block text-[10vw] sm:text-[8rem] md:text-[10rem] text-[#5ea9e6]">
              "Las <span className="text-[#ef5b98]">manos</span>
            </span>
            <span className="block text-[10vw] sm:text-[8rem] md:text-[10rem] text-[#5ea9e6]">
              que hablan,
            </span>
            <span className="block text-[10vw] sm:text-[8rem] md:text-[10rem]">
              <span className="text-[#ef5b98]">el corazón</span>{" "}
              <span className="text-[#5ea9e6]">que</span>
            </span>
            <span className="block text-[10vw] sm:text-[8rem] md:text-[10rem] text-[#5ea9e6]">
              siente"
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-sm text-gray-700">
            Implementación de un Prototipo de Tecnología Profunda (Deep Tech)
            para la atención de emergencias obstétricas en personas
            sordasignantes y oralistas en Tacna
          </p>
        </div>

        {/* Imagen derecha */}
        <div className="w-1/2 max-w-[560px] flex-shrink-0">
          <img
            src={madreImg}
            alt="Madre embarazada"
            className="w-full h-auto object-contain"
          />
        </div>


      {/* Señas Guardadas */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent px-2 flex items-center">
          <Database className="w-5 h-5 mr-2 text-purple-500" />
          Señas Guardadas
          <span className="ml-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full">
            {signs.length}
          </span>
        </h2>
        {signs.length === 0 ? (
          <Card className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-dashed border-blue-300">
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Database className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-gray-700 font-medium mb-1">No hay señas guardadas</p>
              <p className="text-xs text-gray-500">Ve a Base de Señas para agregar nuevas</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {signs.slice(0, 4).map((sign, index) => (
              <Card key={sign.id} className={`p-4 bg-gradient-to-br ${
                index % 4 === 0 ? 'from-blue-50 to-blue-100 border-blue-200' :
                index % 4 === 1 ? 'from-pink-50 to-pink-100 border-pink-200' :
                index % 4 === 2 ? 'from-purple-50 to-purple-100 border-purple-200' :
                'from-green-50 to-green-100 border-green-200'
              } border-2 hover:shadow-lg transition-all duration-200 hover:scale-105`}>
                <div className="text-center">
                  <div className={`text-2xl mb-2 block w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
                    index % 4 === 0 ? 'bg-blue-200' :
                    index % 4 === 1 ? 'bg-pink-200' :
                    index % 4 === 2 ? 'bg-purple-200' :
                    'bg-green-200'
                  }`}>
                    👋
                  </div>
                  <h3 className={`font-semibold text-sm mb-1 ${
                    index % 4 === 0 ? 'text-blue-700' :
                    index % 4 === 1 ? 'text-pink-700' :
                    index % 4 === 2 ? 'text-purple-700' :
                    'text-green-700'
                  }`}>{sign.name}</h3>
                  <p className="text-xs text-gray-600 truncate">{sign.description}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
