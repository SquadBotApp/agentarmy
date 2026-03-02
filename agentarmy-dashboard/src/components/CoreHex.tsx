/**
 * CoreHex - Unified Agent Core with Dynamic Logo Glow
 * The visual "mind" of the AgentArmy OS
 * 
 * Features:
 * - AgentArmy logo as background/watermark
 * - ZPE score with dynamic glow
 * - Pulse animations when thinking
 * - Border color shifts based on active module
 * - Rationale and status display
 */

import React, { useEffect, useRef } from 'react';
import { useUnifiedAgentStore, ModuleType } from '../store/unifiedAgentStore';
import styles from './CoreHex.module.css';

// Module-to-color mapping
const moduleColors: Record<ModuleType, string> = {
  planner: '#4a9eff',    // Blue - planning/structure
  executor: '#ffcc00',   // Gold - action/execution
  critic: '#ff6666',     // Red - evaluation/critique
  governor: '#66ff66',   // Green - governance/safety
  memory: '#cc66ff',     // Purple - memory/retrieval
  learning: '#66ffcc',   // Cyan - learning/adaptation
  tools: '#ff9966',      // Orange - tools/utilities
};

export const CoreHex: React.FC = () => {
  const {
    core,
    planner,
    executor,
    critic,
    governor,
    memory,
    learning,
    backgroundMode,
    connections,
  } = useUnifiedAgentStore();

  // Track previous ZPE for spike detection
  const prevZpeRef = useRef(core.zpe.total);

  // Broadcast ZPE pulses to global CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const zpeIntensity = Math.max(0.2, core.zpe.total);
    const intensityMultiplier = backgroundMode === 'high-energy' ? 1.5 : 1;
    
    // Set global pulse intensity
    root.style.setProperty('--core-pulse-intensity', String(zpeIntensity * intensityMultiplier));
    root.style.setProperty('--core-zpe-value', String(core.zpe.total));
    
    // Detect ZPE spike (increase of more than 0.1)
    const zpeChange = core.zpe.total - prevZpeRef.current;
    if (zpeChange > 0.1) {
      // Trigger ripple animation by toggling a class
      root.classList.add('zpe-spike');
      setTimeout(() => root.classList.remove('zpe-spike'), 1500);
    }
    
    prevZpeRef.current = core.zpe.total;
    
    // Set activity state
    const isThinking = core.status === 'thinking' || core.status === 'executing' || core.status === 'evaluating';
    root.style.setProperty('--core-is-active', isThinking ? '1' : '0');
    
  }, [core.zpe.total, core.status, backgroundMode]);

  // Determine active module for border color
  const getActiveModule = (): ModuleType | null => {
    if (planner.active) return 'planner';
    if (executor.active) return 'executor';
    if (critic.active) return 'critic';
    if (governor.active) return 'governor';
    if (memory.active) return 'memory';
    if (learning.active) return 'learning';
    return core.selectedAgent;
  };

  const activeModule = getActiveModule();
  const borderColor = activeModule ? moduleColors[activeModule] : '#4a9eff';
  
  // Compute glow intensity based on ZPE and activity
  const zpeGlowIntensity = Math.max(0.2, core.zpe.total);
  const isActive = core.status !== 'idle' && core.status !== 'complete';
  const intensityMultiplier = backgroundMode === 'high-energy' ? 1.5 : 1;

  // CSS custom properties
  const cssVars = {
    '--border-color': borderColor,
    '--glow-intensity': zpeGlowIntensity * intensityMultiplier,
    '--pulse-speed': isActive ? '1.5s' : '4s',
    '--logo-opacity': isActive ? 0.4 : 0.25,
  } as React.CSSProperties;

  // Status indicator text
  const getStatusText = () => {
    switch (core.status) {
      case 'thinking': return 'Planning...';
      case 'executing': return 'Executing...';
      case 'evaluating': return 'Evaluating...';
      case 'complete': return 'Complete';
      case 'error': return 'Error';
      default: return 'Ready';
    }
  };

  return (
    <div 
      className={`${styles.coreHex} ${isActive ? styles.active : ''}`}
      style={cssVars}
      data-status={core.status}
    >
      {/* Logo background layer */}
      <div className={styles.logoLayer}>
        <img 
          src="/images/logo-gold.jpg" 
          alt="AgentArmy" 
          className={styles.logo}
        />
      </div>

      {/* Glow effect layer */}
      <div className={styles.glowLayer} />

      {/* Content layer */}
      <div className={styles.content}>
        {/* Status indicator */}
        <div className={styles.statusBadge} data-status={core.status}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>{getStatusText()}</span>
        </div>

        {/* ZPE Score */}
        <div className={styles.zpeDisplay}>
          <span className={styles.zpeValue}>
            {(core.zpe.total * 100).toFixed(0)}
          </span>
          <span className={styles.zpeUnit}>ZPE</span>
        </div>

        {/* Current Task */}
        {core.currentTask && (
          <div className={styles.taskDisplay}>
            <span className={styles.taskLabel}>Task:</span>
            <span className={styles.taskName}>{core.currentTask.name}</span>
          </div>
        )}

        {/* Selected Agent */}
        {activeModule && (
          <div className={styles.agentDisplay}>
            <span 
              className={styles.agentBadge}
              style={{ backgroundColor: moduleColors[activeModule] }}
            >
              {activeModule.charAt(0).toUpperCase() + activeModule.slice(1)}
            </span>
          </div>
        )}

        {/* Rationale (truncated) */}
        {core.rationale && (
          <div className={styles.rationale}>
            {core.rationale.length > 60 
              ? core.rationale.substring(0, 60) + '...'
              : core.rationale
            }
          </div>
        )}
      </div>

      {/* Pulse rings for active states */}
      {isActive && (
        <div className={styles.pulseRings}>
          <div className={styles.pulseRing} style={{ animationDelay: '0s' }} />
          <div className={styles.pulseRing} style={{ animationDelay: '0.5s' }} />
          <div className={styles.pulseRing} style={{ animationDelay: '1s' }} />
        </div>
      )}

      {/* Connection dots around the hex */}
      <div className={styles.connectionPoints}>
        {(['planner', 'executor', 'critic', 'governor', 'memory', 'learning'] as ModuleType[]).map((module, index) => {
          const angle = (index * 60 - 90) * (Math.PI / 180);
          const radius = 52; // % from center
          const x = 50 + radius * Math.cos(angle);
          const y = 50 + radius * Math.sin(angle);
          const intensity = connections.pulseIntensity[module] || 0;
          
          return (
            <div
              key={module}
              className={`${styles.connectionDot} ${intensity > 0 ? styles.active : ''}`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                backgroundColor: moduleColors[module],
                boxShadow: intensity > 0 
                  ? `0 0 ${10 * intensity}px ${moduleColors[module]}`
                  : 'none',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CoreHex;
