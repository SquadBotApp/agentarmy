/**
 * UpgradePanel Component
 * Right sidebar showing plan status, usage, and ethical upgrade suggestions
 * Transparent pricing, no dark patterns
 */

import React, { useState } from 'react';
import { 
  usePlanStore, 
  PLAN_TIERS, 
  ADD_ONS, 
  PlanTier, 
  AddOnId,
  UpgradeSuggestion 
} from '../store/planStore';
import styles from './UpgradePanel.module.css';

interface UpgradePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradePanel: React.FC<UpgradePanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'addons' | 'tiers'>('overview');
  
  const {
    currentTier,
    activeAddOns,
    usage,
    monthlySpend,
    suggestions,
    milestones,
    activeTrial,
    setTier,
    addAddOn,
    startTrial,
    getEffectiveLimits,
  } = usePlanStore();

  const limits = getEffectiveLimits();
  const tierInfo = PLAN_TIERS[currentTier];

  if (!isOpen) return null;

  const renderUsageBar = (current: number, max: number, label: string) => {
    const percentage = max === -1 ? 10 : Math.min((current / max) * 100, 100);
    const isNearLimit = percentage > 80;
    
    return (
      <div className={styles.usageRow}>
        <div className={styles.usageLabel}>
          <span>{label}</span>
          <span className={styles.usageNumbers}>
            {current} / {max === -1 ? '∞' : max}
          </span>
        </div>
        <div className={styles.usageBar}>
          <div 
            className={`${styles.usageBarFill} ${isNearLimit ? styles.nearLimit : ''}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const renderSuggestion = (suggestion: UpgradeSuggestion, index: number) => {
    const handleAction = () => {
      if (suggestion.type === 'tier') {
        setTier(suggestion.target as PlanTier);
      } else {
        addAddOn(suggestion.target as AddOnId);
      }
    };

    const targetInfo = suggestion.type === 'tier' 
      ? PLAN_TIERS[suggestion.target as PlanTier]
      : ADD_ONS[suggestion.target as AddOnId];

    return (
      <div 
        key={index} 
        className={`${styles.suggestion} ${styles[suggestion.priority]}`}
      >
        <div className={styles.suggestionHeader}>
          <span className={styles.suggestionIcon}>
            {suggestion.type === 'tier' ? '⬆️' : '📦'}
          </span>
          <span className={styles.suggestionTitle}>
            {suggestion.type === 'tier' ? 'Upgrade' : 'Add-On'}: {targetInfo.name}
          </span>
        </div>
        <p className={styles.suggestionReason}>{suggestion.reason}</p>
        <p className={styles.suggestionBenefit}>✓ {suggestion.benefit}</p>
        {suggestion.discount && (
          <div className={styles.discount}>
            🎉 {suggestion.discount}% loyalty discount available!
          </div>
        )}
        <button className={styles.suggestionBtn} onClick={handleAction}>
          ${suggestion.discount 
            ? ((targetInfo.price * (100 - suggestion.discount)) / 100).toFixed(0)
            : targetInfo.price
          }/mo
        </button>
      </div>
    );
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Your Plan</h2>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      {/* Trial Banner */}
      {activeTrial && (
        <div className={styles.trialBanner}>
          <span className={styles.trialIcon}>⏱️</span>
          <div className={styles.trialInfo}>
            <span className={styles.trialLabel}>
              Trying {PLAN_TIERS[activeTrial.tier].name}
            </span>
            <span className={styles.trialExpiry}>
              Expires in {Math.round((activeTrial.expiresAt - Date.now()) / 3600000)}h
            </span>
          </div>
        </div>
      )}

      {/* Current Plan Badge */}
      <div className={styles.currentPlan}>
        <div className={styles.planBadge}>
          <span className={styles.planIcon}>
            {currentTier === 'scout' && '🔭'}
            {currentTier === 'operator' && '⚙️'}
            {currentTier === 'commander' && '🎖️'}
            {currentTier === 'strategist' && '👑'}
          </span>
          <div className={styles.planDetails}>
            <span className={styles.planName}>{tierInfo.name}</span>
            <span className={styles.planPrice}>
              ${monthlySpend}/month total
            </span>
          </div>
        </div>
        {activeAddOns.length > 0 && (
          <div className={styles.activeAddOns}>
            {activeAddOns.map((id) => (
              <span key={id} className={styles.addOnChip}>
                {ADD_ONS[id].icon} {ADD_ONS[id].name.split(' ')[0]}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'addons' ? styles.active : ''}`}
          onClick={() => setActiveTab('addons')}
        >
          Add-Ons
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'tiers' ? styles.active : ''}`}
          onClick={() => setActiveTab('tiers')}
        >
          Tiers
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.content}>
        {activeTab === 'overview' && (
          <>
            {/* Usage Section */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Today's Usage</h3>
              {renderUsageBar(usage.tasksToday, limits.tasksPerDay, 'Tasks')}
              {renderUsageBar(usage.peakConcurrency, limits.concurrentAgents, 'Concurrent Agents')}
            </div>

            {/* Stats Section */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Your Progress</h3>
              <div className={styles.statsGrid}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{usage.totalOrchestrations}</span>
                  <span className={styles.statLabel}>Orchestrations</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{usage.timeSavedMinutes}m</span>
                  <span className={styles.statLabel}>Time Saved</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{milestones.consecutiveMonths}</span>
                  <span className={styles.statLabel}>Months Active</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{usage.toolsUsed.length}</span>
                  <span className={styles.statLabel}>Tools Used</span>
                </div>
              </div>
            </div>

            {/* Smart Suggestions */}
            {suggestions.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  Suggestions for You
                  <span className={styles.dataLabel}>Based on your usage</span>
                </h3>
                {suggestions.map((s, i) => renderSuggestion(s, i))}
              </div>
            )}

            {/* Milestone Progress */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Milestones</h3>
              <div className={styles.milestone}>
                <div className={styles.milestoneProgress}>
                  <div 
                    className={styles.milestoneBar}
                    style={{ width: `${Math.min((milestones.orchestrationsCompleted / 100) * 100, 100)}%` }}
                  />
                </div>
                <span className={styles.milestoneLabel}>
                  {milestones.orchestrationsCompleted}/100 orchestrations
                </span>
                <span className={styles.milestoneReward}>
                  → 15% off next add-on
                </span>
              </div>
            </div>
          </>
        )}

        {activeTab === 'addons' && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Add-On Packs</h3>
            <p className={styles.sectionSubtitle}>
              Stack capabilities without changing your tier
            </p>
            
            {(Object.values(ADD_ONS) as typeof ADD_ONS[AddOnId][]).map((addOn) => {
              const isOwned = activeAddOns.includes(addOn.id);
              const bundleDiscount = activeAddOns.length === 2 && !isOwned;
              
              return (
                <div 
                  key={addOn.id} 
                  className={`${styles.addOnCard} ${isOwned ? styles.owned : ''}`}
                >
                  <div className={styles.addOnHeader}>
                    <span className={styles.addOnIcon}>{addOn.icon}</span>
                    <div className={styles.addOnInfo}>
                      <span className={styles.addOnName}>{addOn.name}</span>
                      <span className={styles.addOnPrice}>
                        {bundleDiscount && <span className={styles.originalPrice}>${addOn.price}</span>}
                        ${bundleDiscount ? (addOn.price * 0.5).toFixed(0) : addOn.price}/mo
                      </span>
                    </div>
                    {isOwned && <span className={styles.ownedBadge}>✓ Active</span>}
                  </div>
                  <p className={styles.addOnDesc}>{addOn.description}</p>
                  <div className={styles.addOnFeatures}>
                    {addOn.unlocksFeatures.map((f) => (
                      <span key={f} className={styles.feature}>✓ {f.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                  {!isOwned && (
                    <button 
                      className={styles.addOnBtn}
                      onClick={() => addAddOn(addOn.id)}
                    >
                      {bundleDiscount ? 'Add (50% bundle discount!)' : 'Add to Plan'}
                    </button>
                  )}
                </div>
              );
            })}

            {/* Bundle Info */}
            <div className={styles.bundleInfo}>
              <span className={styles.bundleIcon}>💡</span>
              <span>Own 2 add-ons? Get the 3rd at 50% off. No fine print.</span>
            </div>
          </div>
        )}

        {activeTab === 'tiers' && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Plan Tiers</h3>
            <p className={styles.sectionSubtitle}>
              Clear value at every level
            </p>

            {(Object.entries(PLAN_TIERS) as [PlanTier, typeof PLAN_TIERS[PlanTier]][]).map(([tier, info]) => {
              const isCurrent = tier === currentTier;
              const isUpgrade = ['operator', 'commander', 'strategist'].indexOf(tier) > 
                              ['scout', 'operator', 'commander', 'strategist'].indexOf(currentTier);
              
              return (
                <div 
                  key={tier}
                  className={`${styles.tierCard} ${isCurrent ? styles.currentTier : ''}`}
                >
                  <div className={styles.tierHeader}>
                    <span className={styles.tierIcon}>
                      {tier === 'scout' && '🔭'}
                      {tier === 'operator' && '⚙️'}
                      {tier === 'commander' && '🎖️'}
                      {tier === 'strategist' && '👑'}
                    </span>
                    <div className={styles.tierInfo}>
                      <span className={styles.tierName}>{info.name}</span>
                      <span className={styles.tierPrice}>
                        {info.price === 0 ? 'Free' : `$${info.price}/mo`}
                      </span>
                    </div>
                    {isCurrent && <span className={styles.currentBadge}>Current</span>}
                  </div>
                  
                  <div className={styles.tierLimits}>
                    <span>
                      {info.limits.tasksPerDay === -1 ? '∞' : info.limits.tasksPerDay} tasks/day
                    </span>
                    <span>{info.limits.concurrentAgents} concurrent agents</span>
                    <span>{info.limits.memoryRetentionDays} days memory</span>
                    {info.limits.parallelism && <span>✓ Multi-agent parallelism</span>}
                    {info.limits.teamSharing && <span>✓ Team sharing</span>}
                    {info.limits.customTools && <span>✓ Custom tools</span>}
                    {info.limits.governance && <span>✓ Governance & SLAs</span>}
                  </div>

                  {!isCurrent && isUpgrade && (
                    <button 
                      className={styles.tierBtn}
                      onClick={() => setTier(tier)}
                    >
                      Upgrade to {info.name}
                    </button>
                  )}

                  {!isCurrent && !isUpgrade && tier !== 'scout' && (
                    <button 
                      className={styles.trialBtn}
                      onClick={() => startTrial(tier, 24)}
                    >
                      Try for 24 hours
                    </button>
                  )}
                </div>
              );
            })}

            {/* Transparency Note */}
            <div className={styles.transparencyNote}>
              <span className={styles.noteIcon}>🔍</span>
              <span>
                All pricing shown is the real price. No hidden fees, no tricks, 
                no "just one more thing" surprises.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <span className={styles.footerText}>
          Questions? We're transparent about everything.
        </span>
      </div>
    </div>
  );
};

export default UpgradePanel;
