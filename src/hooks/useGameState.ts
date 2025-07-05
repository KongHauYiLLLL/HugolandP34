import { useState, useEffect, useCallback } from 'react';
import { GameState, Weapon, Armor, Enemy, ChestReward, RelicItem, Achievement, PlayerTag, DailyReward, MenuSkill, AdventureSkill } from '../types/game';
import { generateWeapon, generateArmor, generateEnemy, generateRelicItem, getChestRarityWeights, calculateResearchBonus, calculateResearchCost } from '../utils/gameUtils';
import { getRandomQuestion, checkAnswer } from '../utils/triviaQuestions';
import { checkAchievements, initializeAchievements } from '../utils/achievements';
import { checkPlayerTags, initializePlayerTags } from '../utils/playerTags';
import AsyncStorage from '../utils/storage';

const STORAGE_KEY = 'hugoland-game-state';

const createInitialGameState = (): GameState => ({
  coins: 500, // Changed from 100 to 500
  gems: 0,
  shinyGems: 0,
  zone: 1,
  playerStats: {
    hp: 100,
    maxHp: 100,
    atk: 20,
    def: 10,
    baseAtk: 20,
    baseDef: 10,
    baseHp: 100,
  },
  inventory: {
    weapons: [],
    armor: [],
    relics: [],
    currentWeapon: null,
    currentArmor: null,
    equippedRelics: [],
  },
  currentEnemy: null,
  inCombat: false,
  combatLog: [],
  research: {
    level: 1,
    totalSpent: 0,
    availableUpgrades: ['atk', 'def', 'hp'],
  },
  isPremium: false,
  achievements: initializeAchievements(),
  collectionBook: {
    weapons: {},
    armor: {},
    totalWeaponsFound: 0,
    totalArmorFound: 0,
    rarityStats: {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
      mythical: 0,
    },
  },
  knowledgeStreak: {
    current: 0,
    best: 0,
    multiplier: 1,
  },
  gameMode: {
    current: 'normal',
    speedModeActive: false,
    survivalLives: 3,
    maxSurvivalLives: 3,
  },
  statistics: {
    totalQuestionsAnswered: 0,
    correctAnswers: 0,
    totalPlayTime: 0,
    zonesReached: 1,
    itemsCollected: 0,
    coinsEarned: 0,
    gemsEarned: 0,
    shinyGemsEarned: 0,
    chestsOpened: 0,
    accuracyByCategory: {},
    sessionStartTime: new Date(),
    totalDeaths: 0,
    totalVictories: 0,
    longestStreak: 0,
    fastestVictory: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    itemsUpgraded: 0,
    itemsSold: 0,
    totalResearchSpent: 0,
    averageAccuracy: 0,
    revivals: 0,
  },
  cheats: {
    infiniteCoins: false,
    infiniteGems: false,
    obtainAnyItem: false,
  },
  mining: {
    totalGemsMined: 0,
    totalShinyGemsMined: 0,
  },
  yojefMarket: {
    items: [],
    lastRefresh: new Date(),
    nextRefresh: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
  },
  playerTags: initializePlayerTags(),
  dailyRewards: {
    lastClaimDate: null,
    currentStreak: 0,
    maxStreak: 0,
    availableReward: null,
    rewardHistory: [],
  },
  progression: {
    level: 1,
    experience: 0,
    experienceToNext: 100,
    skillPoints: 0,
    unlockedSkills: [],
    prestigeLevel: 0,
    prestigePoints: 0,
    masteryLevels: {},
  },
  offlineProgress: {
    lastSaveTime: new Date(),
    offlineCoins: 0,
    offlineGems: 0,
    offlineTime: 0,
    maxOfflineHours: 8,
  },
  gardenOfGrowth: {
    isPlanted: false,
    plantedAt: null,
    lastWatered: null,
    waterHoursRemaining: 0,
    growthCm: 0,
    totalGrowthBonus: 0,
    seedCost: 1000,
    waterCost: 500,
    maxGrowthCm: 100,
  },
  settings: {
    colorblindMode: false,
    darkMode: true,
    language: 'en',
    notifications: true,
    snapToGrid: false,
    beautyMode: false,
  },
  hasUsedRevival: false,
  skills: {
    activeMenuSkill: null,
    lastRollTime: null,
    playTimeThisSession: 0,
    sessionStartTime: new Date(),
  },
  adventureSkills: {
    selectedSkill: null,
    availableSkills: [],
    showSelectionModal: false,
    skillEffects: {
      skipCardUsed: false,
      metalShieldUsed: false,
      dodgeUsed: false,
      truthLiesActive: false,
      lightningChainActive: false,
      rampActive: false,
      berserkerActive: false,
      vampiricActive: false,
      phoenixUsed: false,
      timeSlowActive: false,
      criticalStrikeActive: false,
      shieldWallActive: false,
      poisonBladeActive: false,
      arcaneShieldActive: false,
      battleFrenzyActive: false,
      elementalMasteryActive: false,
      shadowStepUsed: false,
      healingAuraActive: false,
      doubleStrikeActive: false,
      manaShieldActive: false,
      berserkRageActive: false,
      divineProtectionUsed: false,
      stormCallActive: false,
      bloodPactActive: false,
      frostArmorActive: false,
      fireballActive: false,
    },
  },
});

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [isLoading, setIsLoading] = useState(true);

  // Load game state from storage
  useEffect(() => {
    const loadGameState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          
          // Ensure new properties exist with defaults
          const updatedState = {
            ...createInitialGameState(),
            ...parsedState,
            settings: {
              ...createInitialGameState().settings,
              ...parsedState.settings,
            },
            skills: {
              ...createInitialGameState().skills,
              ...parsedState.skills,
            },
          };

          // Convert date strings back to Date objects
          if (updatedState.statistics.sessionStartTime) {
            updatedState.statistics.sessionStartTime = new Date(updatedState.statistics.sessionStartTime);
          }
          if (updatedState.offlineProgress.lastSaveTime) {
            updatedState.offlineProgress.lastSaveTime = new Date(updatedState.offlineProgress.lastSaveTime);
          }
          if (updatedState.gardenOfGrowth.plantedAt) {
            updatedState.gardenOfGrowth.plantedAt = new Date(updatedState.gardenOfGrowth.plantedAt);
          }
          if (updatedState.gardenOfGrowth.lastWatered) {
            updatedState.gardenOfGrowth.lastWatered = new Date(updatedState.gardenOfGrowth.lastWatered);
          }
          if (updatedState.yojefMarket.lastRefresh) {
            updatedState.yojefMarket.lastRefresh = new Date(updatedState.yojefMarket.lastRefresh);
          }
          if (updatedState.yojefMarket.nextRefresh) {
            updatedState.yojefMarket.nextRefresh = new Date(updatedState.yojefMarket.nextRefresh);
          }
          if (updatedState.dailyRewards.lastClaimDate) {
            updatedState.dailyRewards.lastClaimDate = new Date(updatedState.dailyRewards.lastClaimDate);
          }
          if (updatedState.skills.lastRollTime) {
            updatedState.skills.lastRollTime = new Date(updatedState.skills.lastRollTime);
          }
          if (updatedState.skills.sessionStartTime) {
            updatedState.skills.sessionStartTime = new Date(updatedState.skills.sessionStartTime);
          }
          if (updatedState.skills.activeMenuSkill?.activatedAt) {
            updatedState.skills.activeMenuSkill.activatedAt = new Date(updatedState.skills.activeMenuSkill.activatedAt);
          }
          if (updatedState.skills.activeMenuSkill?.expiresAt) {
            updatedState.skills.activeMenuSkill.expiresAt = new Date(updatedState.skills.activeMenuSkill.expiresAt);
          }

          // Calculate offline progress
          const now = new Date();
          const lastSave = updatedState.offlineProgress.lastSaveTime;
          const offlineTimeSeconds = Math.floor((now.getTime() - lastSave.getTime()) / 1000);
          const maxOfflineSeconds = updatedState.offlineProgress.maxOfflineHours * 3600;
          const actualOfflineTime = Math.min(offlineTimeSeconds, maxOfflineSeconds);

          if (actualOfflineTime > 60) { // Only if offline for more than 1 minute
            const offlineCoinsPerSecond = (updatedState.research.level * 0.1);
            const offlineGemsPerSecond = (updatedState.research.level * 0.01);
            
            updatedState.offlineProgress.offlineTime = actualOfflineTime;
            updatedState.offlineProgress.offlineCoins = Math.floor(actualOfflineTime * offlineCoinsPerSecond);
            updatedState.offlineProgress.offlineGems = Math.floor(actualOfflineTime * offlineGemsPerSecond);
          }

          // Update garden growth
          if (updatedState.gardenOfGrowth.isPlanted && updatedState.gardenOfGrowth.waterHoursRemaining > 0) {
            const hoursOffline = actualOfflineTime / 3600;
            const growthRate = 0.5; // cm per hour
            const newGrowth = Math.min(hoursOffline * growthRate, updatedState.gardenOfGrowth.maxGrowthCm - updatedState.gardenOfGrowth.growthCm);
            
            updatedState.gardenOfGrowth.growthCm += newGrowth;
            updatedState.gardenOfGrowth.waterHoursRemaining = Math.max(0, updatedState.gardenOfGrowth.waterHoursRemaining - hoursOffline);
            updatedState.gardenOfGrowth.totalGrowthBonus = updatedState.gardenOfGrowth.growthCm * 5;
          }

          // Check for daily rewards
          const lastClaim = updatedState.dailyRewards.lastClaimDate;
          if (!lastClaim || (now.getTime() - lastClaim.getTime()) >= 24 * 60 * 60 * 1000) {
            const nextDay = updatedState.dailyRewards.currentStreak + 1;
            updatedState.dailyRewards.availableReward = {
              day: nextDay,
              coins: 50 + (nextDay * 25),
              gems: 5 + Math.floor(nextDay / 2),
              special: nextDay === 7 ? 'Legendary Chest' : nextDay === 14 ? 'Mythical Item' : undefined,
              claimed: false,
            };
          }

          setGameState(updatedState);
        }
      } catch (error) {
        console.error('Error loading game state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGameState();
  }, []);

  // Save game state to storage
  const saveGameState = useCallback(async (state: GameState) => {
    try {
      // Update last save time
      const stateToSave = {
        ...state,
        offlineProgress: {
          ...state.offlineProgress,
          lastSaveTime: new Date(),
          offlineCoins: 0,
          offlineGems: 0,
          offlineTime: 0,
        },
      };
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveGameState(gameState);
    }, 30000);

    return () => clearInterval(interval);
  }, [gameState, saveGameState]);

  // Calculate total stats including bonuses
  const calculateTotalStats = useCallback((state: GameState) => {
    const researchBonus = calculateResearchBonus(state.research.level);
    const gardenBonus = state.gardenOfGrowth.totalGrowthBonus;
    
    // Base stats from equipment
    let totalAtk = state.playerStats.baseAtk;
    let totalDef = state.playerStats.baseDef;
    let totalHp = state.playerStats.baseHp;

    // Add weapon stats
    if (state.inventory.currentWeapon) {
      const weaponAtk = state.inventory.currentWeapon.baseAtk + (state.inventory.currentWeapon.level - 1) * 10;
      const durabilityMultiplier = state.inventory.currentWeapon.durability / state.inventory.currentWeapon.maxDurability;
      totalAtk += Math.floor(weaponAtk * durabilityMultiplier);
    }

    // Add armor stats
    if (state.inventory.currentArmor) {
      const armorDef = state.inventory.currentArmor.baseDef + (state.inventory.currentArmor.level - 1) * 5;
      const durabilityMultiplier = state.inventory.currentArmor.durability / state.inventory.currentArmor.maxDurability;
      totalDef += Math.floor(armorDef * durabilityMultiplier);
    }

    // Add relic stats
    state.inventory.equippedRelics.forEach(relic => {
      if (relic.type === 'weapon' && relic.baseAtk) {
        totalAtk += relic.baseAtk + (relic.level - 1) * 22;
      } else if (relic.type === 'armor' && relic.baseDef) {
        totalDef += relic.baseDef + (relic.level - 1) * 15;
      }
    });

    // Apply research bonuses
    totalAtk = Math.floor(totalAtk * (1 + researchBonus / 100));
    totalDef = Math.floor(totalDef * (1 + researchBonus / 100));
    totalHp = Math.floor(totalHp * (1 + researchBonus / 100));

    // Apply garden bonuses
    totalAtk = Math.floor(totalAtk * (1 + gardenBonus / 100));
    totalDef = Math.floor(totalDef * (1 + gardenBonus / 100));
    totalHp = Math.floor(totalHp * (1 + gardenBonus / 100));

    return {
      atk: totalAtk,
      def: totalDef,
      maxHp: totalHp,
      hp: Math.min(state.playerStats.hp, totalHp),
    };
  }, []);

  // Update player stats when equipment or research changes
  useEffect(() => {
    setGameState(prevState => {
      const newStats = calculateTotalStats(prevState);
      return {
        ...prevState,
        playerStats: {
          ...prevState.playerStats,
          ...newStats,
        },
      };
    });
  }, [gameState.inventory, gameState.research, gameState.gardenOfGrowth, calculateTotalStats]);

  // Check for premium status
  useEffect(() => {
    setGameState(prevState => ({
      ...prevState,
      isPremium: prevState.zone >= 50,
    }));
  }, [gameState.zone]);

  const equipWeapon = useCallback((weapon: Weapon) => {
    setGameState(prevState => ({
      ...prevState,
      inventory: {
        ...prevState.inventory,
        currentWeapon: weapon,
      },
    }));
  }, []);

  const equipArmor = useCallback((armor: Armor) => {
    setGameState(prevState => ({
      ...prevState,
      inventory: {
        ...prevState.inventory,
        currentArmor: armor,
      },
    }));
  }, []);

  const upgradeWeapon = useCallback((weaponId: string) => {
    setGameState(prevState => {
      const weapon = prevState.inventory.weapons.find(w => w.id === weaponId);
      if (!weapon || prevState.gems < weapon.upgradeCost) return prevState;

      const updatedWeapons = prevState.inventory.weapons.map(w =>
        w.id === weaponId
          ? { ...w, level: w.level + 1, upgradeCost: Math.floor(w.upgradeCost * 1.5) }
          : w
      );

      const updatedCurrentWeapon = prevState.inventory.currentWeapon?.id === weaponId
        ? updatedWeapons.find(w => w.id === weaponId) || null
        : prevState.inventory.currentWeapon;

      return {
        ...prevState,
        gems: prevState.gems - weapon.upgradeCost,
        inventory: {
          ...prevState.inventory,
          weapons: updatedWeapons,
          currentWeapon: updatedCurrentWeapon,
        },
        statistics: {
          ...prevState.statistics,
          itemsUpgraded: prevState.statistics.itemsUpgraded + 1,
        },
      };
    });
  }, []);

  const upgradeArmor = useCallback((armorId: string) => {
    setGameState(prevState => {
      const armor = prevState.inventory.armor.find(a => a.id === armorId);
      if (!armor || prevState.gems < armor.upgradeCost) return prevState;

      const updatedArmor = prevState.inventory.armor.map(a =>
        a.id === armorId
          ? { ...a, level: a.level + 1, upgradeCost: Math.floor(a.upgradeCost * 1.5) }
          : a
      );

      const updatedCurrentArmor = prevState.inventory.currentArmor?.id === armorId
        ? updatedArmor.find(a => a.id === armorId) || null
        : prevState.inventory.currentArmor;

      return {
        ...prevState,
        gems: prevState.gems - armor.upgradeCost,
        inventory: {
          ...prevState.inventory,
          armor: updatedArmor,
          currentArmor: updatedCurrentArmor,
        },
        statistics: {
          ...prevState.statistics,
          itemsUpgraded: prevState.statistics.itemsUpgraded + 1,
        },
      };
    });
  }, []);

  const sellWeapon = useCallback((weaponId: string) => {
    setGameState(prevState => {
      const weapon = prevState.inventory.weapons.find(w => w.id === weaponId);
      if (!weapon || prevState.inventory.currentWeapon?.id === weaponId) return prevState;

      return {
        ...prevState,
        coins: prevState.coins + weapon.sellPrice,
        inventory: {
          ...prevState.inventory,
          weapons: prevState.inventory.weapons.filter(w => w.id !== weaponId),
        },
        statistics: {
          ...prevState.statistics,
          itemsSold: prevState.statistics.itemsSold + 1,
        },
      };
    });
  }, []);

  const sellArmor = useCallback((armorId: string) => {
    setGameState(prevState => {
      const armor = prevState.inventory.armor.find(a => a.id === armorId);
      if (!armor || prevState.inventory.currentArmor?.id === armorId) return prevState;

      return {
        ...prevState,
        coins: prevState.coins + armor.sellPrice,
        inventory: {
          ...prevState.inventory,
          armor: prevState.inventory.armor.filter(a => a.id !== armorId),
        },
        statistics: {
          ...prevState.statistics,
          itemsSold: prevState.statistics.itemsSold + 1,
        },
      };
    });
  }, []);

  const upgradeResearch = useCallback((type: 'atk' | 'def' | 'hp') => {
    setGameState(prevState => {
      const cost = calculateResearchCost(prevState.research.level);
      if (prevState.coins < cost) return prevState;

      return {
        ...prevState,
        coins: prevState.coins - cost,
        research: {
          ...prevState.research,
          level: prevState.research.level + 1,
          totalSpent: prevState.research.totalSpent + cost,
        },
        statistics: {
          ...prevState.statistics,
          totalResearchSpent: prevState.statistics.totalResearchSpent + cost,
        },
      };
    });
  }, []);

  const openChest = useCallback((cost: number): ChestReward | null => {
    if (gameState.coins < cost) return null;

    const weights = getChestRarityWeights(cost);
    const random = Math.random() * 100;
    let rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythical' = 'common';
    let cumulative = 0;

    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        rarity = ['common', 'rare', 'epic', 'legendary', 'mythical'][i] as any;
        break;
      }
    }

    // 10% chance for gems instead of items
    if (Math.random() < 0.1) {
      const gemAmount = cost === 1000 ? 50 : cost === 400 ? 25 : cost === 200 ? 15 : 10;
      
      setGameState(prevState => ({
        ...prevState,
        coins: prevState.coins - cost,
        gems: prevState.gems + gemAmount,
        statistics: {
          ...prevState.statistics,
          chestsOpened: prevState.statistics.chestsOpened + 1,
          gemsEarned: prevState.statistics.gemsEarned + gemAmount,
        },
      }));

      return { type: 'gems', gems: gemAmount };
    }

    // Generate items
    const isWeapon = Math.random() < 0.5;
    const forceEnchanted = gameState.isPremium && Math.random() < 0.15; // 15% chance for premium players
    
    let item: Weapon | Armor;
    if (isWeapon) {
      item = generateWeapon(false, rarity, forceEnchanted);
    } else {
      item = generateArmor(false, rarity, forceEnchanted);
    }

    setGameState(prevState => {
      const newState = { ...prevState };
      newState.coins -= cost;
      newState.gems += Math.floor(Math.random() * 10) + 5; // Bonus gems

      if (isWeapon) {
        newState.inventory.weapons.push(item as Weapon);
        if (!newState.collectionBook.weapons[item.name]) {
          newState.collectionBook.weapons[item.name] = true;
          newState.collectionBook.totalWeaponsFound++;
        }
      } else {
        newState.inventory.armor.push(item as Armor);
        if (!newState.collectionBook.armor[item.name]) {
          newState.collectionBook.armor[item.name] = true;
          newState.collectionBook.totalArmorFound++;
        }
      }

      newState.collectionBook.rarityStats[rarity]++;
      newState.statistics.chestsOpened++;
      newState.statistics.itemsCollected++;

      return newState;
    });

    return { type: isWeapon ? 'weapon' : 'armor', items: [item] };
  }, [gameState.coins, gameState.isPremium]);

  const purchaseMythical = useCallback((cost: number): boolean => {
    if (gameState.coins < cost) return false;

    const isWeapon = Math.random() < 0.5;
    const item = isWeapon ? generateWeapon(false, 'mythical') : generateArmor(false, 'mythical');

    setGameState(prevState => {
      const newState = { ...prevState };
      newState.coins -= cost;

      if (isWeapon) {
        newState.inventory.weapons.push(item as Weapon);
        if (!newState.collectionBook.weapons[item.name]) {
          newState.collectionBook.weapons[item.name] = true;
          newState.collectionBook.totalWeaponsFound++;
        }
      } else {
        newState.inventory.armor.push(item as Armor);
        if (!newState.collectionBook.armor[item.name]) {
          newState.collectionBook.armor[item.name] = true;
          newState.collectionBook.totalArmorFound++;
        }
      }

      newState.collectionBook.rarityStats.mythical++;
      newState.statistics.itemsCollected++;

      return newState;
    });

    return true;
  }, [gameState.coins]);

  const startCombat = useCallback(() => {
    const enemy = generateEnemy(gameState.zone);
    
    // Generate adventure skills for selection
    const allSkills: AdventureSkill[] = [
      { id: '1', name: 'Risker', description: 'Gain extra revival chance', type: 'risker' },
      { id: '2', name: 'Lightning Chain', description: 'Damage spreads to multiple enemies', type: 'lightning_chain' },
      { id: '3', name: 'Skip Card', description: 'Skip one question with correct answer', type: 'skip_card' },
      { id: '4', name: 'Metal Shield', description: 'Reduce damage taken by 50%', type: 'metal_shield' },
      { id: '5', name: 'Truth & Lies', description: 'Remove one wrong answer option', type: 'truth_lies' },
      { id: '6', name: 'Ramp', description: 'Damage increases with each correct answer', type: 'ramp' },
      { id: '7', name: 'Dodge', description: 'Chance to avoid enemy attacks', type: 'dodge' },
    ];

    // Randomly select 3 skills
    const shuffled = allSkills.sort(() => 0.5 - Math.random());
    const selectedSkills = shuffled.slice(0, 3);

    setGameState(prevState => ({
      ...prevState,
      currentEnemy: enemy,
      inCombat: true,
      combatLog: [`You encounter a ${enemy.name} in Zone ${gameState.zone}!`],
      hasUsedRevival: false,
      adventureSkills: {
        ...prevState.adventureSkills,
        availableSkills: selectedSkills,
        showSelectionModal: true,
        skillEffects: {
          skipCardUsed: false,
          metalShieldUsed: false,
          dodgeUsed: false,
          truthLiesActive: false,
          lightningChainActive: false,
          rampActive: false,
          berserkerActive: false,
          vampiricActive: false,
          phoenixUsed: false,
          timeSlowActive: false,
          criticalStrikeActive: false,
          shieldWallActive: false,
          poisonBladeActive: false,
          arcaneShieldActive: false,
          battleFrenzyActive: false,
          elementalMasteryActive: false,
          shadowStepUsed: false,
          healingAuraActive: false,
          doubleStrikeActive: false,
          manaShieldActive: false,
          berserkRageActive: false,
          divineProtectionUsed: false,
          stormCallActive: false,
          bloodPactActive: false,
          frostArmorActive: false,
          fireballActive: false,
        },
      },
    }));
  }, [gameState.zone]);

  const selectAdventureSkill = useCallback((skill: AdventureSkill) => {
    setGameState(prevState => ({
      ...prevState,
      adventureSkills: {
        ...prevState.adventureSkills,
        selectedSkill: skill,
        showSelectionModal: false,
        skillEffects: {
          ...prevState.adventureSkills.skillEffects,
          truthLiesActive: skill.type === 'truth_lies',
        },
      },
    }));
  }, []);

  const skipAdventureSkills = useCallback(() => {
    setGameState(prevState => ({
      ...prevState,
      adventureSkills: {
        ...prevState.adventureSkills,
        selectedSkill: null,
        showSelectionModal: false,
      },
    }));
  }, []);

  const useSkipCard = useCallback(() => {
    setGameState(prevState => ({
      ...prevState,
      adventureSkills: {
        ...prevState.adventureSkills,
        skillEffects: {
          ...prevState.adventureSkills.skillEffects,
          skipCardUsed: true,
        },
      },
    }));
  }, []);

  const attack = useCallback((hit: boolean, category?: string) => {
    setGameState(prevState => {
      if (!prevState.currentEnemy) return prevState;

      const newState = { ...prevState };
      const enemy = { ...newState.currentEnemy };
      const playerStats = { ...newState.playerStats };
      let combatLog = [...newState.combatLog];

      // Update statistics
      newState.statistics.totalQuestionsAnswered++;
      if (category) {
        if (!newState.statistics.accuracyByCategory[category]) {
          newState.statistics.accuracyByCategory[category] = { correct: 0, total: 0 };
        }
        newState.statistics.accuracyByCategory[category].total++;
      }

      if (hit) {
        // Correct answer - player attacks
        newState.statistics.correctAnswers++;
        if (category) {
          newState.statistics.accuracyByCategory[category].correct++;
        }

        // Update knowledge streak
        newState.knowledgeStreak.current++;
        if (newState.knowledgeStreak.current > newState.knowledgeStreak.best) {
          newState.knowledgeStreak.best = newState.knowledgeStreak.current;
        }
        newState.knowledgeStreak.multiplier = 1 + (newState.knowledgeStreak.current * 0.1);

        const damage = Math.max(1, playerStats.atk - enemy.def);
        enemy.hp = Math.max(0, enemy.hp - damage);
        newState.statistics.totalDamageDealt += damage;
        
        combatLog.push(`You deal ${damage} damage to the ${enemy.name}!`);

        if (enemy.hp <= 0) {
          // Enemy defeated
          const baseCoins = 10 + (newState.zone * 2);
          const baseGems = Math.floor(newState.zone / 5) + 1;
          
          // Apply zone completion bonus (2x coins)
          let coinsEarned = Math.floor(baseCoins * 2 * newState.knowledgeStreak.multiplier);
          let gemsEarned = Math.floor(baseGems * newState.knowledgeStreak.multiplier);

          // Apply game mode bonuses
          if (newState.gameMode.current === 'blitz') {
            coinsEarned = Math.floor(coinsEarned * 1.25);
            gemsEarned = Math.floor(gemsEarned * 1.1);
          } else if (newState.gameMode.current === 'survival') {
            coinsEarned *= 2;
            gemsEarned *= 2;
          }

          newState.coins += coinsEarned;
          newState.gems += gemsEarned;
          newState.statistics.coinsEarned += coinsEarned;
          newState.statistics.gemsEarned += gemsEarned;
          newState.statistics.totalVictories++;

          // Add experience (cheaper progression)
          const expGained = 10 + newState.zone;
          newState.progression.experience += expGained;
          
          // Check for level up
          while (newState.progression.experience >= newState.progression.experienceToNext) {
            newState.progression.experience -= newState.progression.experienceToNext;
            newState.progression.level++;
            newState.progression.skillPoints += 2; // More skill points
            newState.progression.experienceToNext = Math.floor(100 * Math.pow(1.1, newState.progression.level - 1)); // Cheaper scaling
          }

          combatLog.push(`${enemy.name} defeated! You earned ${coinsEarned} coins and ${gemsEarned} gems!`);

          // Item drop chance for zones 10+
          if (newState.zone >= 10 && Math.random() < 0.3) {
            const isWeapon = Math.random() < 0.5;
            const item = isWeapon ? generateWeapon() : generateArmor();
            
            if (isWeapon) {
              newState.inventory.weapons.push(item as Weapon);
            } else {
              newState.inventory.armor.push(item as Armor);
            }
            
            combatLog.push(`The ${enemy.name} dropped a ${item.name}!`);
            newState.statistics.itemsCollected++;
          }

          // Advance to next zone
          newState.zone++;
          if (newState.zone > newState.statistics.zonesReached) {
            newState.statistics.zonesReached = newState.zone;
          }

          // Restore some HP
          const healAmount = Math.floor(playerStats.maxHp * 0.2);
          playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + healAmount);

          newState.inCombat = false;
          newState.currentEnemy = null;
          newState.adventureSkills.selectedSkill = null;
        }
      } else {
        // Wrong answer - enemy attacks
        newState.knowledgeStreak.current = 0;
        newState.knowledgeStreak.multiplier = 1;

        const damage = Math.max(1, enemy.atk - playerStats.def);
        playerStats.hp = Math.max(0, playerStats.hp - damage);
        newState.statistics.totalDamageTaken += damage;
        
        combatLog.push(`The ${enemy.name} attacks you for ${damage} damage!`);

        if (playerStats.hp <= 0) {
          // Player defeated
          if (!newState.hasUsedRevival) {
            // Use revival
            playerStats.hp = Math.floor(playerStats.maxHp * 0.5);
            newState.hasUsedRevival = true;
            newState.statistics.revivals++;
            combatLog.push('You have been revived with 50% health!');
          } else {
            // Game over
            if (newState.gameMode.current === 'survival') {
              newState.gameMode.survivalLives--;
              if (newState.gameMode.survivalLives <= 0) {
                combatLog.push('All lives lost! Survival mode ended.');
              } else {
                playerStats.hp = playerStats.maxHp;
                combatLog.push(`You lost a life! ${newState.gameMode.survivalLives} lives remaining.`);
              }
            } else {
              playerStats.hp = 1;
              combatLog.push('You were defeated but survived with 1 HP!');
            }
            
            newState.inCombat = false;
            newState.currentEnemy = null;
            newState.adventureSkills.selectedSkill = null;
            newState.statistics.totalDeaths++;
          }
        }
      }

      newState.currentEnemy = enemy;
      newState.playerStats = playerStats;
      newState.combatLog = combatLog.slice(-10); // Keep last 10 messages

      // Check for achievements and player tags
      const newAchievements = checkAchievements(newState);
      const newTags = checkPlayerTags(newState);
      
      if (newAchievements.length > 0) {
        newState.achievements = newState.achievements.map(achievement => {
          const newAchievement = newAchievements.find(na => na.id === achievement.id);
          return newAchievement || achievement;
        });
        
        // Award achievement rewards
        newAchievements.forEach(achievement => {
          if (achievement.reward) {
            if (achievement.reward.coins) {
              newState.coins += achievement.reward.coins;
            }
            if (achievement.reward.gems) {
              newState.gems += achievement.reward.gems;
            }
          }
        });
      }

      if (newTags.length > 0) {
        newState.playerTags = newState.playerTags.map(tag => {
          const newTag = newTags.find(nt => nt.id === tag.id);
          return newTag || tag;
        });
      }

      return newState;
    });
  }, []);

  const resetGame = useCallback(() => {
    const newState = createInitialGameState();
    setGameState(newState);
    saveGameState(newState);
  }, [saveGameState]);

  const setGameMode = useCallback((mode: 'normal' | 'blitz' | 'bloodlust' | 'survival') => {
    setGameState(prevState => ({
      ...prevState,
      gameMode: {
        ...prevState.gameMode,
        current: mode,
        survivalLives: mode === 'survival' ? 3 : prevState.gameMode.survivalLives,
      },
    }));
  }, []);

  const toggleCheat = useCallback((cheat: keyof typeof gameState.cheats) => {
    setGameState(prevState => ({
      ...prevState,
      cheats: {
        ...prevState.cheats,
        [cheat]: !prevState.cheats[cheat],
      },
    }));
  }, []);

  const generateCheatItem = useCallback(() => {
    // Implementation for cheat item generation
    console.log('Cheat item generation not implemented yet');
  }, []);

  const mineGem = useCallback((x: number, y: number) => {
    const isShiny = Math.random() < 0.05;
    const gemsFound = isShiny ? 0 : 1;
    const shinyGemsFound = isShiny ? 1 : 0;

    setGameState(prevState => ({
      ...prevState,
      gems: prevState.gems + gemsFound,
      shinyGems: prevState.shinyGems + shinyGemsFound,
      mining: {
        totalGemsMined: prevState.mining.totalGemsMined + gemsFound,
        totalShinyGemsMined: prevState.mining.totalShinyGemsMined + shinyGemsFound,
      },
      statistics: {
        ...prevState.statistics,
        gemsEarned: prevState.statistics.gemsEarned + gemsFound,
        shinyGemsEarned: prevState.statistics.shinyGemsEarned + shinyGemsFound,
      },
    }));

    return { gems: gemsFound, shinyGems: shinyGemsFound };
  }, []);

  const exchangeShinyGems = useCallback((amount: number): boolean => {
    if (gameState.shinyGems < amount) return false;

    setGameState(prevState => ({
      ...prevState,
      shinyGems: prevState.shinyGems - amount,
      gems: prevState.gems + (amount * 10),
    }));

    return true;
  }, [gameState.shinyGems]);

  const discardItem = useCallback((itemId: string, type: 'weapon' | 'armor') => {
    setGameState(prevState => {
      if (type === 'weapon') {
        return {
          ...prevState,
          inventory: {
            ...prevState.inventory,
            weapons: prevState.inventory.weapons.filter(w => w.id !== itemId),
          },
        };
      } else {
        return {
          ...prevState,
          inventory: {
            ...prevState.inventory,
            armor: prevState.inventory.armor.filter(a => a.id !== itemId),
          },
        };
      }
    });
  }, []);

  const purchaseRelic = useCallback((relicId: string): boolean => {
    const relic = gameState.yojefMarket.items.find(item => item.id === relicId);
    if (!relic || gameState.gems < relic.cost) return false;

    setGameState(prevState => ({
      ...prevState,
      gems: prevState.gems - relic.cost,
      inventory: {
        ...prevState.inventory,
        relics: [...prevState.inventory.relics, relic],
        equippedRelics: prevState.inventory.equippedRelics.length < 5 
          ? [...prevState.inventory.equippedRelics, relic]
          : prevState.inventory.equippedRelics,
      },
      yojefMarket: {
        ...prevState.yojefMarket,
        items: prevState.yojefMarket.items.filter(item => item.id !== relicId),
      },
    }));

    return true;
  }, [gameState.yojefMarket.items, gameState.gems]);

  const upgradeRelic = useCallback((relicId: string) => {
    setGameState(prevState => {
      const relic = prevState.inventory.relics.find(r => r.id === relicId);
      if (!relic || prevState.gems < relic.upgradeCost) return prevState;

      const updatedRelics = prevState.inventory.relics.map(r =>
        r.id === relicId
          ? { 
              ...r, 
              level: r.level + 1, 
              upgradeCost: Math.floor(r.upgradeCost * 1.5),
              baseAtk: r.baseAtk ? r.baseAtk + 22 : undefined,
              baseDef: r.baseDef ? r.baseDef + 15 : undefined,
            }
          : r
      );

      const updatedEquippedRelics = prevState.inventory.equippedRelics.map(r =>
        r.id === relicId ? updatedRelics.find(ur => ur.id === relicId)! : r
      );

      return {
        ...prevState,
        gems: prevState.gems - relic.upgradeCost,
        inventory: {
          ...prevState.inventory,
          relics: updatedRelics,
          equippedRelics: updatedEquippedRelics,
        },
      };
    });
  }, []);

  const equipRelic = useCallback((relicId: string) => {
    setGameState(prevState => {
      const relic = prevState.inventory.relics.find(r => r.id === relicId);
      if (!relic || prevState.inventory.equippedRelics.length >= 5) return prevState;

      return {
        ...prevState,
        inventory: {
          ...prevState.inventory,
          equippedRelics: [...prevState.inventory.equippedRelics, relic],
        },
      };
    });
  }, []);

  const unequipRelic = useCallback((relicId: string) => {
    setGameState(prevState => ({
      ...prevState,
      inventory: {
        ...prevState.inventory,
        equippedRelics: prevState.inventory.equippedRelics.filter(r => r.id !== relicId),
      },
    }));
  }, []);

  const sellRelic = useCallback((relicId: string) => {
    setGameState(prevState => ({
      ...prevState,
      inventory: {
        ...prevState.inventory,
        relics: prevState.inventory.relics.filter(r => r.id !== relicId),
        equippedRelics: prevState.inventory.equippedRelics.filter(r => r.id !== relicId),
      },
    }));
  }, []);

  const claimDailyReward = useCallback((): boolean => {
    if (!gameState.dailyRewards.availableReward) return false;

    const reward = gameState.dailyRewards.availableReward;
    
    setGameState(prevState => ({
      ...prevState,
      coins: prevState.coins + reward.coins,
      gems: prevState.gems + reward.gems,
      dailyRewards: {
        ...prevState.dailyRewards,
        lastClaimDate: new Date(),
        currentStreak: reward.day,
        maxStreak: Math.max(prevState.dailyRewards.maxStreak, reward.day),
        availableReward: null,
        rewardHistory: [...prevState.dailyRewards.rewardHistory, { ...reward, claimed: true, claimDate: new Date() }],
      },
    }));

    return true;
  }, [gameState.dailyRewards.availableReward]);

  const upgradeSkill = useCallback((skillId: string): boolean => {
    if (gameState.progression.skillPoints <= 0) return false;

    setGameState(prevState => ({
      ...prevState,
      progression: {
        ...prevState.progression,
        skillPoints: prevState.progression.skillPoints - 1,
        unlockedSkills: [...prevState.progression.unlockedSkills, skillId],
      },
    }));

    return true;
  }, [gameState.progression.skillPoints]);

  const prestige = useCallback((): boolean => {
    if (gameState.progression.level < 50) return false;

    const prestigePoints = Math.floor(gameState.progression.level / 10);

    setGameState(prevState => ({
      ...prevState,
      progression: {
        ...prevState.progression,
        level: 1,
        experience: 0,
        experienceToNext: 100,
        skillPoints: 0,
        prestigeLevel: prevState.progression.prestigeLevel + 1,
        prestigePoints: prevState.progression.prestigePoints + prestigePoints,
        unlockedSkills: [],
      },
      playerStats: {
        ...prevState.playerStats,
        hp: 100,
        maxHp: 100,
      },
    }));

    return true;
  }, [gameState.progression.level]);

  const claimOfflineRewards = useCallback(() => {
    setGameState(prevState => ({
      ...prevState,
      coins: prevState.coins + prevState.offlineProgress.offlineCoins,
      gems: prevState.gems + prevState.offlineProgress.offlineGems,
      offlineProgress: {
        ...prevState.offlineProgress,
        offlineCoins: 0,
        offlineGems: 0,
        offlineTime: 0,
      },
    }));
  }, []);

  const bulkSell = useCallback((itemIds: string[], type: 'weapon' | 'armor') => {
    setGameState(prevState => {
      let totalValue = 0;
      
      if (type === 'weapon') {
        const itemsToSell = prevState.inventory.weapons.filter(w => 
          itemIds.includes(w.id) && prevState.inventory.currentWeapon?.id !== w.id
        );
        totalValue = itemsToSell.reduce((sum, item) => sum + item.sellPrice, 0);
        
        return {
          ...prevState,
          coins: prevState.coins + totalValue,
          inventory: {
            ...prevState.inventory,
            weapons: prevState.inventory.weapons.filter(w => !itemIds.includes(w.id) || prevState.inventory.currentWeapon?.id === w.id),
          },
        };
      } else {
        const itemsToSell = prevState.inventory.armor.filter(a => 
          itemIds.includes(a.id) && prevState.inventory.currentArmor?.id !== a.id
        );
        totalValue = itemsToSell.reduce((sum, item) => sum + item.sellPrice, 0);
        
        return {
          ...prevState,
          coins: prevState.coins + totalValue,
          inventory: {
            ...prevState.inventory,
            armor: prevState.inventory.armor.filter(a => !itemIds.includes(a.id) || prevState.inventory.currentArmor?.id === a.id),
          },
        };
      }
    });
  }, []);

  const bulkUpgrade = useCallback((itemIds: string[], type: 'weapon' | 'armor') => {
    setGameState(prevState => {
      let totalCost = 0;
      
      if (type === 'weapon') {
        const itemsToUpgrade = prevState.inventory.weapons.filter(w => itemIds.includes(w.id));
        totalCost = itemsToUpgrade.reduce((sum, item) => sum + item.upgradeCost, 0);
        
        if (prevState.gems < totalCost) return prevState;
        
        const updatedWeapons = prevState.inventory.weapons.map(w =>
          itemIds.includes(w.id)
            ? { ...w, level: w.level + 1, upgradeCost: Math.floor(w.upgradeCost * 1.5) }
            : w
        );
        
        return {
          ...prevState,
          gems: prevState.gems - totalCost,
          inventory: {
            ...prevState.inventory,
            weapons: updatedWeapons,
            currentWeapon: prevState.inventory.currentWeapon && itemIds.includes(prevState.inventory.currentWeapon.id)
              ? updatedWeapons.find(w => w.id === prevState.inventory.currentWeapon!.id) || null
              : prevState.inventory.currentWeapon,
          },
        };
      } else {
        const itemsToUpgrade = prevState.inventory.armor.filter(a => itemIds.includes(a.id));
        totalCost = itemsToUpgrade.reduce((sum, item) => sum + item.upgradeCost, 0);
        
        if (prevState.gems < totalCost) return prevState;
        
        const updatedArmor = prevState.inventory.armor.map(a =>
          itemIds.includes(a.id)
            ? { ...a, level: a.level + 1, upgradeCost: Math.floor(a.upgradeCost * 1.5) }
            : a
        );
        
        return {
          ...prevState,
          gems: prevState.gems - totalCost,
          inventory: {
            ...prevState.inventory,
            armor: updatedArmor,
            currentArmor: prevState.inventory.currentArmor && itemIds.includes(prevState.inventory.currentArmor.id)
              ? updatedArmor.find(a => a.id === prevState.inventory.currentArmor!.id) || null
              : prevState.inventory.currentArmor,
          },
        };
      }
    });
  }, []);

  const plantSeed = useCallback((): boolean => {
    if (gameState.coins < gameState.gardenOfGrowth.seedCost || gameState.gardenOfGrowth.isPlanted) {
      return false;
    }

    setGameState(prevState => ({
      ...prevState,
      coins: prevState.coins - prevState.gardenOfGrowth.seedCost,
      gardenOfGrowth: {
        ...prevState.gardenOfGrowth,
        isPlanted: true,
        plantedAt: new Date(),
        lastWatered: new Date(),
        waterHoursRemaining: 24,
      },
    }));

    return true;
  }, [gameState.coins, gameState.gardenOfGrowth.seedCost, gameState.gardenOfGrowth.isPlanted]);

  const buyWater = useCallback((hours: number): boolean => {
    const cost = (hours / 24) * gameState.gardenOfGrowth.waterCost;
    if (gameState.coins < cost) return false;

    setGameState(prevState => ({
      ...prevState,
      coins: prevState.coins - cost,
      gardenOfGrowth: {
        ...prevState.gardenOfGrowth,
        waterHoursRemaining: prevState.gardenOfGrowth.waterHoursRemaining + hours,
        lastWatered: new Date(),
      },
    }));

    return true;
  }, [gameState.coins, gameState.gardenOfGrowth.waterCost]);

  const updateSettings = useCallback((newSettings: Partial<typeof gameState.settings>) => {
    setGameState(prevState => ({
      ...prevState,
      settings: {
        ...prevState.settings,
        ...newSettings,
      },
    }));
  }, []);

  const addCoins = useCallback((amount: number) => {
    setGameState(prevState => ({
      ...prevState,
      coins: prevState.coins + amount,
    }));
  }, []);

  const addGems = useCallback((amount: number) => {
    setGameState(prevState => ({
      ...prevState,
      gems: prevState.gems + amount,
    }));
  }, []);

  const teleportToZone = useCallback((zone: number) => {
    setGameState(prevState => ({
      ...prevState,
      zone: Math.max(1, zone),
    }));
  }, []);

  const setExperience = useCallback((xp: number) => {
    setGameState(prevState => ({
      ...prevState,
      progression: {
        ...prevState.progression,
        experience: Math.max(0, xp),
      },
    }));
  }, []);

  const rollSkill = useCallback((): boolean => {
    if (gameState.coins < 100) return false;

    // All available menu skills including new ones
    const allSkills = [
      { type: 'coin_vacuum', name: 'Coin Vacuum', description: 'Get 15 free coins per minute of play time', duration: 6 },
      { type: 'treasurer', name: 'Treasurer', description: 'Guarantees next chest opened is epic or better', duration: 1 },
      { type: 'xp_surge', name: 'XP Surge', description: 'Gives 300% XP gains for 24 hours', duration: 24 },
      { type: 'luck_gem', name: 'Luck Gem', description: 'All gems mined for 1 hour are shiny gems', duration: 1 },
      { type: 'enchanter', name: 'Enchanter', description: 'Epic+ drops have 80% chance to be enchanted', duration: 12 },
      { type: 'time_warp', name: 'Time Warp', description: 'Get 50% more time to answer questions for 12 hours', duration: 12 },
      { type: 'golden_touch', name: 'Golden Touch', description: 'All coin rewards are doubled for 8 hours', duration: 8 },
      { type: 'knowledge_boost', name: 'Knowledge Boost', description: 'Knowledge streaks build 50% faster for 24 hours', duration: 24 },
      { type: 'durability_master', name: 'Durability Master', description: 'Items lose no durability for 6 hours', duration: 6 },
      { type: 'relic_finder', name: 'Relic Finder', description: 'Next 3 Yojef Market refreshes have guaranteed legendary relics', duration: 72 },
      { type: 'stat_amplifier', name: 'Stat Amplifier', description: 'All stats (ATK, DEF, HP) increased by 50% for 4 hours', duration: 4 },
      { type: 'question_master', name: 'Question Master', description: 'See question category and difficulty before answering for 2 hours', duration: 2 },
      { type: 'gem_magnet', name: 'Gem Magnet', description: 'Triple gem rewards from all sources for 3 hours', duration: 3 },
      { type: 'streak_guardian', name: 'Streak Guardian', description: 'Knowledge streak cannot be broken for 1 hour', duration: 1 },
      { type: 'revival_blessing', name: 'Revival Blessing', description: 'Gain 3 extra revival chances for this session', duration: 24 },
      { type: 'zone_skipper', name: 'Zone Skipper', description: 'Skip directly to zone +5 without fighting', duration: 0.1 },
      { type: 'item_duplicator', name: 'Item Duplicator', description: 'Next item found is automatically duplicated', duration: 12 },
      { type: 'research_accelerator', name: 'Research Accelerator', description: 'Research costs 50% less for 6 hours', duration: 6 },
      { type: 'garden_booster', name: 'Garden Booster', description: 'Garden grows 5x faster for 2 hours', duration: 2 },
      { type: 'market_refresh', name: 'Market Refresh', description: 'Instantly refresh Yojef Market with premium items', duration: 0.1 },
      // New skills
      { type: 'coin_multiplier', name: 'Coin Multiplier', description: 'All coin gains are multiplied by 3x for 4 hours', duration: 4 },
      { type: 'gem_multiplier', name: 'Gem Multiplier', description: 'All gem gains are multiplied by 2.5x for 3 hours', duration: 3 },
      { type: 'xp_multiplier', name: 'XP Multiplier', description: 'All experience gains are multiplied by 4x for 2 hours', duration: 2 },
      { type: 'damage_boost', name: 'Damage Boost', description: 'Deal 100% more damage in combat for 5 hours', duration: 5 },
      { type: 'defense_boost', name: 'Defense Boost', description: 'Take 75% less damage in combat for 6 hours', duration: 6 },
      { type: 'health_boost', name: 'Health Boost', description: 'Maximum health increased by 200% for 8 hours', duration: 8 },
      { type: 'speed_boost', name: 'Speed Boost', description: 'Answer time increased by 100% for 3 hours', duration: 3 },
      { type: 'luck_boost', name: 'Luck Boost', description: 'All random events have 50% better outcomes for 4 hours', duration: 4 },
      { type: 'magic_shield', name: 'Magic Shield', description: 'Immune to all negative effects for 2 hours', duration: 2 },
      { type: 'auto_heal', name: 'Auto Heal', description: 'Automatically heal 25% HP every minute for 1 hour', duration: 1 },
    ];

    const randomSkill = allSkills[Math.floor(Math.random() * allSkills.length)];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + randomSkill.duration * 60 * 60 * 1000);

    const newSkill: MenuSkill = {
      id: Math.random().toString(36).substr(2, 9),
      name: randomSkill.name,
      description: randomSkill.description,
      duration: randomSkill.duration,
      activatedAt: now,
      expiresAt: expiresAt,
      type: randomSkill.type as any,
    };

    setGameState(prevState => ({
      ...prevState,
      coins: prevState.coins - 100,
      skills: {
        ...prevState.skills,
        activeMenuSkill: newSkill,
        lastRollTime: now,
      },
    }));

    return true;
  }, [gameState.coins]);

  return {
    gameState,
    isLoading,
    equipWeapon,
    equipArmor,
    upgradeWeapon,
    upgradeArmor,
    sellWeapon,
    sellArmor,
    upgradeResearch,
    openChest,
    purchaseMythical,
    startCombat,
    attack,
    resetGame,
    setGameMode,
    toggleCheat,
    generateCheatItem,
    mineGem,
    exchangeShinyGems,
    discardItem,
    purchaseRelic,
    upgradeRelic,
    equipRelic,
    unequipRelic,
    sellRelic,
    claimDailyReward,
    upgradeSkill,
    prestige,
    claimOfflineRewards,
    bulkSell,
    bulkUpgrade,
    plantSeed,
    buyWater,
    updateSettings,
    addCoins,
    addGems,
    teleportToZone,
    setExperience,
    rollSkill,
    selectAdventureSkill,
    skipAdventureSkills,
    useSkipCard,
  };
};