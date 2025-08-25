
import React from 'react';
import { Camera, Hand, Database, BarChart3, Home } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'camera', label: 'Detección', icon: Camera },
    // { id: 'database', label: 'Señas', icon: Database },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg">
      <div className="flex justify-around items-center py-2 px-2 max-w-md mx-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 ${
              activeTab === item.id
                ? 'bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow-md'
                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
