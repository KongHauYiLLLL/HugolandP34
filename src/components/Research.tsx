import React, { useState } from 'react';
import { Research as ResearchType } from '../types/game';
import { Brain, TrendingUp, Sword, Shield, Heart, Coins, X } from 'lucide-react';
import { calculateResearchBonus, calculateResearchCost } from '../utils/gameUtils';

interface ResearchProps {
  research: ResearchType;
  coins: number;
  onUpgradeResearch: (type: 'atk' | 'def' | 'hp') => void;
  isPremium: boolean;
}

export const Research: React.FC<ResearchProps> = ({ 
  research, 
  coins, 
  onUpgradeResearch, 
  isPremium 
}) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const cost = calculateResearchCost(research.level);
  const currentBonus = calculateResearchBonus(research.level);
  const nextBonus = calculateResearchBonus(research.level + 1);

  const upgradeOptions = [
    {
      key: 'atk' as const,
      name: 'Attack Research',
      icon: Sword,
      color: 'text-orange-400',
      bgColor: 'bg-orange-900/30',
      borderColor: 'border-orange-500/50',
      description: 'Increase your attack power by 10%'
    },
    {
      key: 'def' as const,
      name: 'Defense Research',
      icon: Shield,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/30',
      borderColor: 'border-blue-500/50',
      description: 'Increase your defense power by 10%'
    },
    {
      key: 'hp' as const,
      name: 'Health Research',
      icon: Heart,
      color: 'text-red-400',
      bgColor: 'bg-red-900/30',
      borderColor: 'border-red-500/50',
      description: 'Increase your maximum health by 10%'
    }
  ];

  const handleUpgrade = (type: 'atk' | 'def' | 'hp') => {
    onUpgradeResearch(type);
    setShowUpgradeModal(false);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4 sm:p-6 rounded-lg shadow-2xl">
      <div className="text-center mb-4 sm:mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-white">Research Laboratory</h2>
        </div>
        <p className="text-blue-300 text-sm sm:text-base">Advance your knowledge and power</p>
      </div>

      {/* Single Research Tree */}
      <div className="max-w-md mx-auto">
        <div className="p-4 sm:p-6 rounded-lg border-2 border-purple-500/50 bg-purple-900/30">
          <div className="text-center mb-4">
            <Brain className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 text-purple-400" />
            <h3 className="font-bold text-lg sm:text-xl text-purple-400">
              Universal Research
            </h3>
            <p className="text-gray-300 text-sm mt-2">
              Choose your path of advancement
            </p>
          </div>

          {/* Current Stats */}
          <div className="space-y-3 mb-4">
            <div className="bg-black/30 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-white font-semibold text-sm">Research Level</span>
              </div>
              <p className="text-2xl font-bold text-green-400">{research.level}</p>
            </div>

            <div className="bg-black/30 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-yellow-400" />
                <span className="text-white font-semibold text-sm">Current Bonus</span>
              </div>
              <p className="text-2xl font-bold text-yellow-400">+{currentBonus}%</p>
            </div>
          </div>

          {/* Upgrade Section */}
          <div className="bg-black/40 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white font-semibold text-sm">Next Level</p>
                <p className="text-gray-300 text-xs">
                  Bonus: +{currentBonus}% → +{nextBonus}%
                </p>
              </div>
              <div className="flex items-center gap-2 text-yellow-300">
                <Coins className="w-4 h-4" />
                <span className="font-semibold text-sm">{cost}</span>
              </div>
            </div>

            <button
              onClick={() => setShowUpgradeModal(true)}
              disabled={coins < cost}
              className={`w-full py-3 rounded-lg font-bold transition-all duration-200 text-sm ${
                coins >= cost
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:scale-105 shadow-lg'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {coins >= cost ? 'Choose Upgrade Path' : 'Insufficient Coins'}
            </button>

            <div className="mt-3 text-center">
              <p className="text-xs text-gray-300">
                Total spent: {research.totalSpent} coins
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Selection Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 p-6 rounded-lg border border-purple-500/50 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold text-xl">Choose Your Research Path</h3>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {upgradeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.key}
                    onClick={() => handleUpgrade(option.key)}
                    className={`p-4 rounded-lg border-2 ${option.borderColor} ${option.bgColor} hover:scale-105 transition-all duration-200`}
                  >
                    <div className="text-center">
                      <Icon className={`w-12 h-12 mx-auto mb-3 ${option.color}`} />
                      <h4 className={`font-bold text-lg ${option.color} mb-2`}>
                        {option.name}
                      </h4>
                      <p className="text-gray-300 text-sm">
                        {option.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-300 text-sm">
                Each upgrade provides a permanent 10% bonus to the selected stat
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 sm:mt-6 text-center">
        <p className="text-xs sm:text-sm text-gray-300">
          Research provides permanent stat bonuses. Choose wisely!
        </p>
      </div>
    </div>
  );
};