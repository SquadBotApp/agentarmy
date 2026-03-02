/**
 * AgentModal - Detailed view of a module agent
 * Shows resonance data, status, and action buttons
 * Features beautiful pulse-synced styling
 */

import React from 'react';
import { ModuleType, useUnifiedAgentStore } from '../store/unifiedAgentStore';
import { usePulseStore } from '../store/pulseStore';
import styles from './AgentModal.module.css';

// Module colors (matching ModuleHex)
const moduleColors: Record<ModuleType, string> = {
  planner: '#4a9eff',
  executor: '#ffcc00',
  critic: '#ff6666',
  governor: '#66ff66',
  memory: '#cc66ff',
  learning: '#66ffcc',
  tools: '#ff9966',
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

// Module descriptions
const moduleDescriptions: Record<ModuleType, string> = {
  planner: 'Decomposes complex tasks into subtasks, builds task graphs, and computes critical path schedules using CPM.',
  executor: 'Executes tool calls, manages artifacts, and produces output from the planned tasks.',
  critic: 'Evaluates output quality, alignment, and risk levels. Provides feedback for improvement.',
  governor: 'Enforces policies, performs safety checks, and can block or warn on risky outputs.',
  memory: 'Stores and retrieves agent weights, decision history, and learned patterns.',
  learning: 'Tracks performance metrics, updates ZPE weights, and triggers learning loops.',
  tools: 'Manages available tools, logs tool calls, and handles tool selection.',
};

interface AgentModalProps {
  moduleType: ModuleType;
  onClose: () => void;
}

const AgentModal: React.FC<AgentModalProps> = ({ moduleType, onClose }) => {
  const { pulse, triggerPulse } = usePulseStore();
  const store = useUnifiedAgentStore();
  
  // Get module state from unified store
  const moduleState = store[moduleType] as { active: boolean; thinking: string };
  const color = moduleColors[moduleType];
  const icon = moduleIcons[moduleType];
  const description = moduleDescriptions[moduleType];
  
  // Get pulse data
  const pulseData = pulse[moduleType] || pulse.global || { intensity: 0.5, hueShift: 0 };
  
  // Get ZPE from core
  const zpeTotal = store.core.zpe.total;

  const handleRunCycle = () => {
    triggerPulse(moduleType, 1);
    // In a real implementation, this would trigger the module's execution
    console.log(`Running ${moduleType} cycle...`);
  };

  const handleInjectPrompt = () => {
    const prompt = window.prompt(`Enter prompt for ${moduleType}:`);
    if (prompt) {
      console.log(`Injecting prompt into ${moduleType}:`, prompt);
      triggerPulse(moduleType, 0.8);
    }
  };

  const handleViewLogs = () => {
    console.log(`Viewing logs for ${moduleType}...`);
    // In a real implementation, this would open a log viewer
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div 
        className={styles.modal} 
        onClick={e => e.stopPropagation()}
        style={{ '--module-color': color } as React.CSSProperties}
      >
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.icon}>{icon}</span>
          <h2 className={styles.title}>{moduleType.toUpperCase()} AGENT</h2>
        </div>

        {/* Description */}
        <p className={styles.description}>{description}</p>

        {/* Status */}
        <div className={styles.statusSection}>
          <div className={styles.statusRow}>
            <span className={styles.statusLabel}>Status:</span>
            <span className={`${styles.statusValue} ${moduleState.active ? styles.active : ''}`}>
              {moduleState.active ? '● Active' : '○ Idle'}
            </span>
          </div>
          {moduleState.thinking && (
            <div className={styles.thinking}>
              <span className={styles.thinkingLabel}>Thinking:</span>
              <span className={styles.thinkingText}>{moduleState.thinking}</span>
            </div>
          )}
        </div>

        {/* Resonance Bar */}
        <div className={styles.resonanceSection}>
          <div className={styles.resonanceHeader}>
            <span>Resonance</span>
            <span className={styles.resonancePercent}>
              {(pulseData.intensity * 100).toFixed(0)}%
            </span>
          </div>
          <div className={styles.resonanceBar}>
            <div
              className={styles.resonanceFill}
              style={{
                width: `${pulseData.intensity * 100}%`,
                background: `linear-gradient(90deg, ${color}, hsl(${(pulseData.hueShift + 200) % 360}, 100%, 70%))`,
              }}
            />
          </div>
          <div className={styles.resonanceStats}>
            <span>Hue Shift: {pulseData.hueShift}°</span>
            <span>ZPE: {(zpeTotal * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Module-specific info */}
        {moduleType === 'memory' && store.memory.agentWeights && (
          <div className={styles.infoSection}>
            <h4>Agent Weights</h4>
            <div className={styles.infoGrid}>
              {Object.entries(store.memory.agentWeights).slice(0, 4).map(([agent, weight]) => (
                <div key={agent} className={styles.infoItem}>
                  <span className={styles.infoLabel}>{agent}</span>
                  <span className={styles.infoValue}>{(weight as number).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {moduleType === 'learning' && (
          <div className={styles.infoSection}>
            <h4>Recent Updates</h4>
            <div className={styles.infoValue}>
              {store.learning.updates.length} updates recorded
            </div>
          </div>
        )}

        {moduleType === 'critic' && store.critic.evaluation && (
          <div className={styles.infoSection}>
            <h4>Last Evaluation</h4>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Quality</span>
                <span className={styles.infoValue}>
                  {(store.critic.evaluation.qualityScore * 100).toFixed(0)}%
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Risk</span>
                <span className={styles.infoValue}>{store.critic.evaluation.riskLevel}</span>
              </div>
            </div>
          </div>
        )}

        {moduleType === 'governor' && store.governor.policyChecks.length > 0 && (
          <div className={styles.infoSection}>
            <h4>Policy Checks</h4>
            <div className={styles.infoValue}>
              {store.governor.policyChecks.filter(c => c.passed).length}/
              {store.governor.policyChecks.length} passed
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button 
            className={styles.actionBtn} 
            onClick={handleRunCycle}
            style={{ borderColor: color }}
          >
            Run Full Cycle
          </button>
          <button 
            className={styles.actionBtn} 
            onClick={handleInjectPrompt}
            style={{ borderColor: color }}
          >
            Inject Prompt
          </button>
          <button 
            className={styles.actionBtn} 
            onClick={handleViewLogs}
            style={{ borderColor: color }}
          >
            View Logs
          </button>
        </div>
      </div>
    </div>
  );
};

export { AgentModal };
export default AgentModal;
