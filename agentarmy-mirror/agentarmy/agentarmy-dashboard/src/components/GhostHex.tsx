/**
 * GhostHex Component
 * Displays locked/unavailable capabilities as dimmed hexes
 * Transparent Qubit-based pricing for unlocks
 */

import React, { useState } from 'react';
import { usePricingStore, TIERS, ADDONS, PlanTier, AddOnId } from '../store/pricingStore';
import styles from './GhostHex.module.css';

interface GhostHexProps {
  /** Display label */
  label: string;
  /** Icon to display */
  icon: string;
  /** Tier required to unlock (if tier-locked) */
  requiredTier?: PlanTier;
  /** Add-on required to unlock (if addon-locked) */
  requiredAddOn?: AddOnId;
  /** Brief description of what this unlocks */
  description?: string;
  /** Callback when unlocked */
  onUpgrade?: () => void;
}

export const GhostHex: React.FC<GhostHexProps> = ({
  label,
  icon,
  requiredTier,
  requiredAddOn,
  description,
  onUpgrade,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const { 
    currentTier, 
    activeAddOns, 
    Qubits,
    upgradeTier,
    purchaseAddOn,
    canAfford,
  } = usePricingStore();

  // Check if already unlocked
  const isUnlocked = () => {
    if (requiredTier) {
      const tierOrder: PlanTier[] = ['scout', 'operator', 'commander', 'strategist'];
      return tierOrder.indexOf(currentTier) >= tierOrder.indexOf(requiredTier);
    }
    if (requiredAddOn) {
      return activeAddOns.includes(requiredAddOn);
    }
    return true;
  };

  // If feature is available, don't render ghost
  if (isUnlocked()) {
    return null;
  }

  // Determine unlock info
  const getUnlockInfo = () => {
    if (requiredAddOn) {
      const addOn = ADDONS[requiredAddOn];
      // Bundle discount: 50% off 3rd+ addon
      const cost = activeAddOns.length >= 2 
        ? Math.floor(addOn.QubitCost * 0.5) 
        : addOn.QubitCost;
      return {
        method: 'add-on' as const,
        name: addOn.name,
        cost,
        originalCost: addOn.QubitCost,
        icon: addOn.icon,
        features: addOn.features,
        hasDiscount: activeAddOns.length >= 2,
      };
    }
    if (requiredTier) {
      const tier = TIERS[requiredTier];
      const cost = tier.QubitCost - TIERS[currentTier].QubitCost;
      return {
        method: 'tier' as const,
        name: tier.name,
        cost,
        originalCost: tier.QubitCost,
        icon: '⬆️',
        features: tier.features.slice(0, 4),
        hasDiscount: false,
      };
    }
    return null;
  };

  const unlockInfo = getUnlockInfo();
  if (!unlockInfo) return null;

  const affordable = canAfford(unlockInfo.cost);

  const handleUnlock = () => {
    if (!affordable) return;
    
    let success = false;
    if (requiredTier) {
      success = upgradeTier(requiredTier);
    } else if (requiredAddOn) {
      success = purchaseAddOn(requiredAddOn);
    }
    
    if (success && onUpgrade) {
      onUpgrade();
    }
  };

  return (
    <div
      className={styles.ghostHex}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowPreview(false);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
    >
      <div className={styles.hexShape}>
        <div className={styles.hexContent}>
          <span className={styles.icon}>{icon}</span>
          <span className={styles.label}>{label}</span>
          <div className={styles.lockIndicator}>🔒</div>
        </div>

        {/* Hover tooltip with Qubit pricing */}
        {isHovered && (
          <div className={styles.tooltip}>
            <div className={styles.tooltipHeader}>
              <span className={styles.tooltipIcon}>{icon}</span>
              <span className={styles.tooltipTitle}>{label}</span>
            </div>
            
            {description && (
              <p className={styles.tooltipDescription}>{description}</p>
            )}

            <div className={styles.unlockInfo}>
              <span className={styles.unlockLabel}>
                {unlockInfo.method === 'tier' ? 'Upgrade to:' : 'Add-On:'}
              </span>
              <div className={styles.unlockTarget}>
                <span>{unlockInfo.icon}</span>
                <span>{unlockInfo.name}</span>
              </div>
              <div className={styles.QubitCost}>
                {unlockInfo.hasDiscount && (
                  <span className={styles.originalCost}>
                    {unlockInfo.originalCost} Qb
                  </span>
                )}
                <span className={`${styles.cost} ${!affordable ? styles.insufficient : ''}`}>
                  {unlockInfo.cost} Qb
                </span>
                {unlockInfo.hasDiscount && (
                  <span className={styles.discountBadge}>50% OFF</span>
                )}
              </div>
            </div>

            <div className={styles.balance}>
              Your balance: <strong>{Qubits} Qb</strong>
            </div>

            {/* Preview toggle */}
            <button 
              className={styles.previewBtn}
              onClick={(e) => {
                e.stopPropagation();
                setShowPreview(!showPreview);
              }}
            >
              {showPreview ? 'Hide Preview' : '👁️ Preview'}
            </button>

            <button 
              className={`${styles.upgradeButton} ${!affordable ? styles.disabled : ''}`}
              onClick={handleUnlock}
              disabled={!affordable}
            >
              {affordable ? (
                <>✨ Unlock Now</>
              ) : (
                <>Need {unlockInfo.cost - Qubits} more Qb</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Preview overlay showing what you'll get */}
      {showPreview && (
        <div className={styles.previewOverlay}>
          <div className={styles.previewContent}>
            <h4>What you'll unlock:</h4>
            <ul>
              {unlockInfo.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Pulsing glow effect */}
      <div className={styles.pulseRing} />
    </div>
  );
};

/**
 * LockedConnection Component
 * Shows a dimmed connection path that would be active with upgrades
 */
interface LockedConnectionProps {
  path: string;
  requiredTier?: PlanTier;
  requiredAddOn?: AddOnId;
  label?: string;
}

export const LockedConnection: React.FC<LockedConnectionProps> = ({
  path,
  requiredTier,
  requiredAddOn,
  label,
}) => {
  const { currentTier, activeAddOns } = usePricingStore();
  const [isHovered, setIsHovered] = useState(false);

  // Check if unlocked
  const isUnlocked = () => {
    if (requiredTier) {
      const tierOrder: PlanTier[] = ['scout', 'operator', 'commander', 'strategist'];
      return tierOrder.indexOf(currentTier) >= tierOrder.indexOf(requiredTier);
    }
    if (requiredAddOn) {
      return activeAddOns.includes(requiredAddOn);
    }
    return true;
  };

  if (isUnlocked()) {
    return null;
  }

  return (
    <g
      className={styles.lockedConnection}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <path
        d={path}
        className={styles.lockedPath}
        strokeDasharray="8 4"
      />
      {isHovered && label && (
        <text
          className={styles.lockedLabel}
          x="50%"
          y="50%"
          textAnchor="middle"
        >
          🔒 {label}
        </text>
      )}
    </g>
  );
};

/**
 * PreviewBanner Component
 * Shows what a higher tier would have done (ethical peek)
 */
interface PreviewBannerProps {
  currentResult: string;
  previewResult: string;
  improvement: string;
  targetTier: PlanTier;
  onUpgrade: () => void;
  onDismiss: () => void;
}

export const PreviewBanner: React.FC<PreviewBannerProps> = ({
  currentResult,
  previewResult,
  improvement,
  targetTier,
  onUpgrade,
  onDismiss,
}) => {
  const { currentTier, Qubits } = usePricingStore();
  const tierInfo = TIERS[targetTier];
  const upgradeCost = tierInfo.QubitCost - TIERS[currentTier].QubitCost;

  return (
    <div className={styles.previewBanner}>
      <div className={styles.previewHeader}>
        <span className={styles.previewIcon}>✨</span>
        <span className={styles.previewTitle}>See what's possible</span>
        <button className={styles.dismissBtn} onClick={onDismiss}>×</button>
      </div>

      <div className={styles.comparison}>
        <div className={styles.currentBox}>
          <span className={styles.compLabel}>Current Result</span>
          <p className={styles.compText}>{currentResult}</p>
        </div>
        <div className={styles.arrow}>→</div>
        <div className={styles.previewBox}>
          <span className={styles.compLabel}>With {tierInfo.name}</span>
          <p className={styles.compText}>{previewResult}</p>
        </div>
      </div>

      <div className={styles.improvement}>
        <span className={styles.impIcon}>📈</span>
        <span>{improvement}</span>
      </div>

      <div className={styles.previewActions}>
        <button className={styles.upgradeBtn} onClick={onUpgrade}>
          Upgrade to {tierInfo.name} — {upgradeCost} Qb
        </button>
        <span className={styles.balance}>Your balance: {Qubits} Qb</span>
        <span className={styles.transparent}>Clear pricing. No tricks.</span>
      </div>
    </div>
  );
};

export default GhostHex;
