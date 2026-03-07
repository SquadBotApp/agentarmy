/**
 * QubitWallet Component
 * Animated wallet display with earning/spending animations
 * Shows balance, tier, add-ons, and upgrade suggestions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  usePricingStore, 
  TIERS, 
  ADDONS, 
  BOOSTS,
  PlanTier,
  AddOnId,
  BoostId,
} from '../store/pricingStore';
import { usePulseStore } from '../store/pulseStore';
import styles from './QubitWallet.module.css';

interface QubitWalletProps {
  /** Compact mode for sidebar */
  compact?: boolean;
  /** Callback when tier upgrade is triggered */
  onTierChange?: (tier: PlanTier) => void;
}

export const QubitWallet: React.FC<QubitWalletProps> = ({
  compact = false,
  onTierChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddOns, setShowAddOns] = useState(false);
  const [showBoosts, setShowBoosts] = useState(false);
  const [animatingValue, setAnimatingValue] = useState<number | null>(null);
  const [animationType, setAnimationType] = useState<'earn' | 'spend' | null>(null);
  
  const {
    Qubits,
    currentTier,
    activeAddOns,
    activeBoosts,
    usage,
    suggestions,
    upgradeTier,
    purchaseAddOn,
    activateBoost,
    canAfford,
    generateSuggestions,
    cleanExpiredBoosts,
  } = usePricingStore();

  const { triggerPulse } = usePulseStore();

  // Track Qubit changes for animation
  const [prevQubits, setPrevQubits] = useState(Qubits);
  
  useEffect(() => {
    if (Qubits !== prevQubits) {
      const delta = Qubits - prevQubits;
      setAnimatingValue(Math.abs(delta));
      setAnimationType(delta > 0 ? 'earn' : 'spend');
      
      // Trigger visual pulse on earn
      if (delta > 0) {
        triggerPulse('core', 1);
      }
      
      // Clear animation after delay
      const timer = setTimeout(() => {
        setAnimatingValue(null);
        setAnimationType(null);
      }, 1500);
      
      setPrevQubits(Qubits);
      return () => clearTimeout(timer);
    }
  }, [Qubits, prevQubits, triggerPulse]);

  // Generate suggestions on mount and usage changes
  useEffect(() => {
    generateSuggestions();
    cleanExpiredBoosts();
  }, [usage.tasksCompleted, usage.orchestrationsCompleted, generateSuggestions, cleanExpiredBoosts]);

  const handleUpgradeTier = useCallback((tier: PlanTier) => {
    if (upgradeTier(tier)) {
      triggerPulse('core', 1);
      onTierChange?.(tier);
    }
  }, [upgradeTier, triggerPulse, onTierChange]);

  const handlePurchaseAddOn = useCallback((id: AddOnId) => {
    if (purchaseAddOn(id)) {
      triggerPulse('tools', 1);
    }
  }, [purchaseAddOn, triggerPulse]);

  const handleActivateBoost = useCallback((id: BoostId) => {
    if (activateBoost(id)) {
      triggerPulse('executor', 1);
    }
  }, [activateBoost, triggerPulse]);

  const tierConfig = TIERS[currentTier];
  const nextTier = getNextTier(currentTier);
  const nextTierConfig = nextTier ? TIERS[nextTier] : null;

  // Compact mode - just show balance and tier badge
  if (compact) {
    return (
      <div 
        className={styles.compactWallet}
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsExpanded(!isExpanded)}
      >
        <div className={styles.compactBalance}>
          <span className={styles.QubitIcon}>◆</span>
          <span className={styles.QubitValue}>{Qubits}</span>
          <span className={styles.QubitLabel}>Qb</span>
          
          {/* Animation overlay */}
          {animatingValue !== null && (
            <span className={`${styles.animatingDelta} ${styles[animationType || '']}`}>
              {animationType === 'earn' ? '+' : '-'}{animatingValue}
            </span>
          )}
        </div>
        
        <div className={`${styles.tierBadge} ${styles[currentTier]}`}>
          {tierConfig.name}
        </div>

        {/* Expanded panel */}
        {isExpanded && (
          <div className={styles.expandedPanel}>
            <QubitWalletFull 
              onTierChange={onTierChange}
              onClose={() => setIsExpanded(false)}
            />
          </div>
        )}
      </div>
    );
  }

  // Full wallet display
  return (
    <div className={styles.wallet}>
      {/* Balance section */}
      <div className={styles.balanceSection}>
        <div className={styles.balanceHeader}>
          <span className={styles.balanceLabel}>Qubit Balance</span>
          <div className={`${styles.tierBadge} ${styles[currentTier]}`}>
            {tierConfig.name}
          </div>
        </div>
        
        <div className={styles.balanceDisplay}>
          <span className={styles.QubitIconLarge}>◆</span>
          <span className={styles.balanceValue}>{Qubits}</span>
          <span className={styles.balanceUnit}>Qb</span>
          
          {/* Animation overlay */}
          {animatingValue !== null && (
            <div className={`${styles.earnAnimation} ${styles[animationType || '']}`}>
              <span>{animationType === 'earn' ? '+' : '-'}{animatingValue} Qb</span>
            </div>
          )}
        </div>
      </div>

      {/* Current tier info */}
      <div className={styles.tierSection}>
        <div className={styles.tierInfo}>
          <h4>{tierConfig.name} Plan</h4>
          <p>{tierConfig.description}</p>
        </div>
        
        {/* Upgrade prompt if not at max tier */}
        {nextTierConfig && (
          <div className={styles.upgradePrompt}>
            <div className={styles.upgradeInfo}>
              <span className={styles.upgradeLabel}>Next: {nextTierConfig.name}</span>
              <span className={styles.upgradeCost}>
                {nextTierConfig.QubitCost - tierConfig.QubitCost} Qb
              </span>
            </div>
            <button
              className={`${styles.upgradeButton} ${!canAfford(nextTierConfig.QubitCost - tierConfig.QubitCost) ? styles.disabled : ''}`}
              onClick={() => nextTier && handleUpgradeTier(nextTier)}
              disabled={!canAfford(nextTierConfig.QubitCost - tierConfig.QubitCost)}
            >
              Upgrade
            </button>
          </div>
        )}
      </div>

      {/* Active add-ons */}
      {activeAddOns.length > 0 && (
        <div className={styles.activeAddOns}>
          <h4>Active Add-Ons</h4>
          <div className={styles.addOnList}>
            {activeAddOns.map((id) => (
              <div key={id} className={styles.activeAddOn}>
                <span>{ADDONS[id].icon}</span>
                <span>{ADDONS[id].name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active boosts */}
      {activeBoosts.filter(b => b.expiresAt > Date.now()).length > 0 && (
        <div className={styles.activeBoosts}>
          <h4>Active Boosts</h4>
          <div className={styles.boostList}>
            {activeBoosts
              .filter(b => b.expiresAt > Date.now())
              .map((boost) => (
                <div key={boost.id} className={styles.activeBoost}>
                  <span>{BOOSTS[boost.id].icon}</span>
                  <span>{BOOSTS[boost.id].name}</span>
                  <span className={styles.boostExpiry}>
                    {formatTimeRemaining(boost.expiresAt)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className={styles.suggestions}>
          <h4>Smart Suggestions</h4>
          {suggestions.slice(0, 2).map((suggestion) => (
            <div key={`${suggestion.type}-${suggestion.id}`} className={styles.suggestion}>
              <div className={styles.suggestionInfo}>
                <span className={styles.suggestionReason}>{suggestion.reason}</span>
                <span className={styles.suggestionBenefit}>{suggestion.benefit}</span>
              </div>
              <div className={styles.suggestionAction}>
                <span className={styles.suggestionCost}>{suggestion.QubitCost} Qb</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className={styles.quickActions}>
        <button 
          className={styles.actionButton}
          onClick={() => setShowAddOns(!showAddOns)}
        >
          🛠️ Add-Ons
        </button>
        <button 
          className={styles.actionButton}
          onClick={() => setShowBoosts(!showBoosts)}
        >
          ⚡ Boosts
        </button>
      </div>

      {/* Add-ons panel */}
      {showAddOns && (
        <div className={styles.addOnsPanel}>
          <h4>Available Add-Ons</h4>
          {(Object.values(ADDONS) as typeof ADDONS[AddOnId][]).map((addon) => {
            const owned = activeAddOns.includes(addon.id);
            const discounted = activeAddOns.length >= 2;
            const cost = discounted ? Math.floor(addon.QubitCost * 0.5) : addon.QubitCost;
            
            return (
              <div key={addon.id} className={`${styles.addOnCard} ${owned ? styles.owned : ''}`}>
                <div className={styles.addOnHeader}>
                  <span className={styles.addOnIcon}>{addon.icon}</span>
                  <span className={styles.addOnName}>{addon.name}</span>
                  {owned && <span className={styles.ownedBadge}>Owned</span>}
                </div>
                <p className={styles.addOnDesc}>{addon.description}</p>
                {!owned && (
                  <div className={styles.addOnAction}>
                    {discounted && (
                      <span className={styles.originalPrice}>{addon.QubitCost} Qb</span>
                    )}
                    <span className={styles.addOnPrice}>{cost} Qb</span>
                    {discounted && <span className={styles.discountBadge}>50% OFF</span>}
                    <button
                      className={styles.buyButton}
                      onClick={() => handlePurchaseAddOn(addon.id)}
                      disabled={!canAfford(cost)}
                    >
                      {canAfford(cost) ? 'Get' : 'Need more Qb'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Boosts panel */}
      {showBoosts && (
        <div className={styles.boostsPanel}>
          <h4>Quick Boosts</h4>
          {(Object.values(BOOSTS) as typeof BOOSTS[BoostId][]).map((boost) => {
            const active = activeBoosts.some(
              b => b.id === boost.id && b.expiresAt > Date.now()
            );
            
            return (
              <div key={boost.id} className={`${styles.boostCard} ${active ? styles.active : ''}`}>
                <div className={styles.boostHeader}>
                  <span className={styles.boostIcon}>{boost.icon}</span>
                  <span className={styles.boostName}>{boost.name}</span>
                </div>
                <p className={styles.boostDesc}>{boost.description}</p>
                <div className={styles.boostAction}>
                  <span className={styles.boostDuration}>{boost.duration}</span>
                  <span className={styles.boostPrice}>{boost.QubitCost} Qb</span>
                  <button
                    className={styles.activateButton}
                    onClick={() => handleActivateBoost(boost.id)}
                    disabled={active || !canAfford(boost.QubitCost)}
                  >
                    {active ? 'Active' : canAfford(boost.QubitCost) ? 'Activate' : 'Need Qb'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Usage stats footer */}
      <div className={styles.usageStats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{usage.tasksCompleted}</span>
          <span className={styles.statLabel}>Tasks</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{usage.orchestrationsCompleted}</span>
          <span className={styles.statLabel}>Orchestrations</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{usage.currentStreak}</span>
          <span className={styles.statLabel}>Day Streak</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Full wallet panel (used in expanded compact mode)
 */
const QubitWalletFull: React.FC<{
  onTierChange?: (tier: PlanTier) => void;
  onClose: () => void;
}> = ({ onTierChange, onClose }) => {
  return (
    <div className={styles.fullPanel}>
      <button className={styles.closeButton} onClick={onClose}>×</button>
      <QubitWallet onTierChange={onTierChange} />
    </div>
  );
};

// Helper functions
function getNextTier(current: PlanTier): PlanTier | null {
  const order: PlanTier[] = ['scout', 'operator', 'commander', 'strategist'];
  const idx = order.indexOf(current);
  return idx < order.length - 1 ? order[idx + 1] : null;
}

function formatTimeRemaining(expiresAt: number): string {
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) return 'Expired';
  
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default QubitWallet;
