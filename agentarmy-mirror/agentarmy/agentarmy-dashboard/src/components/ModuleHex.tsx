/**
 * ModuleHex - Module hexagon with full resonance system
 * 
 * Each module hex responds to:
 * - Global ZPE pulse from unified agent store
 * - Module activation state
 * - Connection pulse intensity
 * - Pulse store resonance data (intensity + hue shift)
 * 
 * Creates a synchronized honeycomb resonance effect where all hexes
 * breathe with the unified agent's cognitive rhythm
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { ModuleType, useUnifiedAgentStore } from '../store/unifiedAgentStore';
import { usePulseStore } from '../store/pulseStore';
import styles from './ModuleHex.module.css';

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

// Module icons
const moduleIcons: Record<ModuleType, string> = {
  planner: '📋',
  executor: '⚡',
  critic: '🔍',
  governor: '🛡️',
  memory: '🧠',
  learning: '📈',
  tools: '🔧',
};

interface ModuleHexProps {
  type: ModuleType;
  label?: string;
  onClick?: () => void;
}

export const ModuleHex: React.FC<ModuleHexProps> = ({ type, label, onClick }) => {
  const hexRef = useRef<HTMLDivElement>(null);
  
  const {
    planner,
    executor,
    critic,
    governor,
    memory,
    learning,
    tools,
    connections,
    backgroundMode,
    core,
  } = useUnifiedAgentStore();

  // Get pulse data for this module (resonance from pulse store)
  const { pulse } = usePulseStore();
  const pulseData = pulse[type] || pulse.global || { intensity: 0.5, hueShift: 0 };
  const resonanceIntensity = pulseData.intensity;

  // Get module state based on type
  const moduleState = useMemo(() => {
    switch (type) {
      case 'planner': return planner;
      case 'executor': return executor;
      case 'critic': return critic;
      case 'governor': return governor;
      case 'memory': return memory;
      case 'learning': return learning;
      case 'tools': return tools;
      default: return { active: false, thinking: '' };
    }
  }, [type, planner, executor, critic, governor, memory, learning, tools]);

  const isActive = moduleState.active;
  const connectionPulse = connections.pulseIntensity[type] || 0;
  const globalPulseIntensity = Math.max(0.2, core.zpe.total);
  const intensityMultiplier = backgroundMode === 'high-energy' ? 1.5 : 1;
  
  // Combined resonance from all sources
  const combinedResonance = Math.min(1, (resonanceIntensity + connectionPulse + globalPulseIntensity) / 2);

  // Apply resonance effects to CSS variables
  useEffect(() => {
    if (!hexRef.current) return;
    
    const scale = 1 + combinedResonance * 0.08 * intensityMultiplier;
    const glowSize = combinedResonance * 20 * intensityMultiplier;
    
    hexRef.current.style.setProperty('--resonance-scale', scale.toString());
    hexRef.current.style.setProperty('--resonance-glow', `${glowSize}px`);
  }, [combinedResonance, intensityMultiplier]);

  // CSS custom properties for this module
  const cssVars = {
    '--module-color': moduleColors[type],
    '--module-active': isActive ? '1' : '0',
    '--module-pulse': connectionPulse,
    '--resonance-intensity': combinedResonance * intensityMultiplier,
    '--glow-spread': isActive ? '15px' : '5px',
  } as React.CSSProperties;

  // Get module-specific extra info
  const getExtraInfo = (): string | null => {
    switch (type) {
      case 'memory': {
        const { agentWeights } = moduleState as typeof memory;
        if (agentWeights && Object.keys(agentWeights).length > 0) {
          return `${Object.keys(agentWeights).length} weights`;
        }
        return null;
      }
      case 'critic': {
        const { evaluation } = moduleState as typeof critic;
        if (evaluation) {
          return `Q: ${(evaluation.qualityScore * 100).toFixed(0)}%`;
        }
        return null;
      }
      case 'learning': {
        const { updates } = moduleState as typeof learning;
        return `${updates.length} updates`;
      }
      case 'governor': {
        const { policyChecks } = moduleState as typeof governor;
        if (policyChecks.length > 0) {
          const passed = policyChecks.filter(c => c.passed).length;
          return `${passed}/${policyChecks.length} passed`;
        }
        return null;
      }
      case 'executor': {
        const { toolCalls } = moduleState as typeof executor;
        if (toolCalls.length > 0) {
          return `${toolCalls.length} calls`;
        }
        return null;
      }
      case 'planner': {
        const { taskGraph } = moduleState as typeof planner;
        if (taskGraph.length > 0) {
          return `${taskGraph.length} tasks`;
        }
        return null;
      }
      default:
        return null;
    }
  };

  const extraInfo = getExtraInfo();
  const { thinking } = moduleState;
  const intensityLevel = combinedResonance > 0.75 ? 'high' : combinedResonance > 0.5 ? 'medium' : 'low';

  return (
    <div 
      ref={hexRef}
      className={`${styles.moduleHex} ${isActive ? styles.active : ''} ${
        connectionPulse > 0.5 ? styles.pulse : ''
      }`}
      style={cssVars}
      data-module={type}
      data-intensity={intensityLevel}
      onClick={onClick}
      title={`${label || type} • Resonance: ${(combinedResonance * 100).toFixed(0)}%`}
    >
      {/* Resonance glow layer - syncs with core ZPE */}
      <div className={styles.resonanceGlow} />

      {/* Module border with color */}
      <div className={styles.hexBorder} />

      {/* Content */}
      <div className={styles.hexContent}>
        <span className={styles.moduleIcon}>{moduleIcons[type]}</span>
        <div className={styles.moduleLabel}>{label || type.charAt(0).toUpperCase() + type.slice(1)}</div>
        
        {/* Thinking indicator */}
        {isActive && thinking && (
          <div className={styles.thinking}>{thinking}</div>
        )}

        {/* Extra info */}
        {extraInfo && (
          <div className={styles.extraInfo}>{extraInfo}</div>
        )}
        
        {/* Resonance percentage */}
        <div className={styles.resonanceIndicator}>
          {(combinedResonance * 100).toFixed(0)}%
        </div>
      </div>

      {/* Activity indicator */}
      {isActive && (
        <div className={styles.activityRing} />
      )}

      {/* Connection pulse point */}
      <div 
        className={`${styles.connectionPoint} ${connectionPulse > 0 ? styles.pulsing : ''}`}
        style={{ 
          boxShadow: connectionPulse > 0 
            ? `0 0 ${10 * connectionPulse}px ${moduleColors[type]}`
            : 'none'
        }}
      />
    </div>
  );
};

export default ModuleHex;
