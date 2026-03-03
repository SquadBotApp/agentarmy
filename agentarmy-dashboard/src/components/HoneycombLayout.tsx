/**
 * Honeycomb Layout Component
 * Unified agent cognitive map visualization with ZPE resonance
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useUnifiedAgentStore, ModuleType } from '../store/unifiedAgentStore';
import { usePulseStore, startDemoPulse } from '../store/pulseStore';
import { CoreHex } from './CoreHex';
import { AgentModal } from './AgentModal';
import { Spinner } from './Spinner';
import styles from './Honeycomb.module.css';

// Module configuration
const modules: { type: ModuleType; icon: string; label: string }[] = [
  { type: 'planner', icon: '📋', label: 'Planner' },
  { type: 'executor', icon: '⚡', label: 'Executor' },
  { type: 'critic', icon: '🔍', label: 'Critic' },
  { type: 'governor', icon: '🛡️', label: 'Governor' },
  { type: 'memory', icon: '🧠', label: 'Memory' },
  { type: 'learning', icon: '📈', label: 'Learning' },
];

// Connection paths (from center to each module)
const connectionPaths: Record<ModuleType, string> = {
  planner: 'M350,240 L350,100',
  executor: 'M420,300 L550,180',
  critic: 'M420,400 L550,520',
  governor: 'M350,460 L350,600',
  memory: 'M280,400 L150,520',
  learning: 'M280,300 L150,180',
  tools: 'M450,350 L600,350',
};

export const HoneycombLayout: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [selectedModule, setSelectedModule] = useState<ModuleType | null>(null);
  
  // Unified agent state
  const {
    core,
    planner,
    executor,
    critic,
    governor,
    memory,
    learning,
    connections,
    submitTask,
  } = useUnifiedAgentStore();

  // Pulse/resonance state
  const { pulse, syncWithZPE } = usePulseStore();

  // Sync pulse store with ZPE energy
  useEffect(() => {
    syncWithZPE(core.zpe.total);
  }, [core.zpe.total, syncWithZPE]);

  // Start demo pulse on mount for visual feedback
  useEffect(() => {
    return startDemoPulse();
  }, []);

  const handleSubmit = useCallback(async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() || core.status === 'thinking' || core.status === 'executing') return;
    
    await submitTask(inputValue.trim());
    setInputValue('');
  }, [inputValue, core.status, submitTask]);

  const isProcessing = core.status === 'thinking' || core.status === 'executing' || core.status === 'evaluating';

  const getModuleState = (type: ModuleType) => {
    switch (type) {
      case 'planner': return planner;
      case 'executor': return executor;
      case 'critic': return critic;
      case 'governor': return governor;
      case 'memory': return memory;
      case 'learning': return learning;
      default: return { active: false, thinking: '' };
    }
  };

  return (
    <div className={styles.honeycombContainer}>
      {/* Background is now handled by BackgroundLayer in App.tsx */}

      {/* Input area - top left */}
      <div className={styles.inputArea}>
        <form onSubmit={handleSubmit} className={styles.inputWrapper}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter your task or goal..."
            className={styles.inputField}
            disabled={isProcessing}
          />
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isProcessing || !inputValue.trim()}
          >
            {isProcessing ? <Spinner size={24} thickness={2} variant="gold" /> : 'Execute'}
          </button>
        </form>
      </div>

      {/* Metrics panel - top right */}
      <div className={styles.metricsPanel}>
        <div className={styles.metricRow}>
          <span className={styles.metricLabel}>Status</span>
          <span className={styles.metricValue}>{core.status.toUpperCase()}</span>
        </div>
        <div className={styles.metricRow}>
          <div>
            <span className={styles.metricLabel}>ZPE Score</span>
            <div className={styles.metricBar}>
              <div 
                className={styles.metricBarFill} 
                data-width={core.zpe.total * 100}
              />
            </div>
          </div>
          <span className={styles.metricValue}>{(core.zpe.total * 100).toFixed(0)}%</span>
        </div>
        {Object.entries(core.zpe.components).map(([key, value]) => (
          <div key={key} className={styles.metricRow}>
            <span className={styles.metricLabel}>{key}</span>
            <span className={styles.metricValue}>{typeof value === 'number' ? (value * 100).toFixed(0) : 0}%</span>
          </div>
        ))}
      </div>

      {/* Main honeycomb grid */}
      <div className={styles.honeycombLayout}>
        <div className={styles.hexGrid}>
          {/* Connection lines SVG */}
          <svg className={styles.connections} viewBox="0 0 700 700">
            {modules.map(({ type }) => (
              <path
                key={type}
                d={connectionPaths[type]}
                className={`${styles.connectionLine} ${
                  connections.activePath.includes(type) ? styles.active : ''
                } ${
                  connections.pulseIntensity[type] > 0.5 ? styles.pulse : ''
                }`}
              />
            ))}
          </svg>

          {/* Core hexagon - center (using CoreHex component) */}
          <div className={styles.coreHex}>
            <CoreHex />
          </div>

          {/* Module hexagons */}
          {modules.map(({ type, icon, label }) => {
            const moduleState = getModuleState(type);
            const isActive = moduleState.active;
            const connectionPulse = connections.pulseIntensity[type] || 0;
            const storePulse = pulse[type]?.intensity || 0;
            const combinedPulse = Math.max(connectionPulse, storePulse);

            return (
              <div key={type} className={`${styles.moduleHex} ${styles[type]}`}>
                <button 
                  type="button"
                  className={`${styles.hexagon} ${
                    isActive ? styles.active : ''
                  } ${
                    combinedPulse > 0.5 ? styles.pulse : ''
                  }`}
                  onClick={() => setSelectedModule(type)}
                  data-pulse-intensity={combinedPulse}
                  data-hue-shift={pulse[type]?.hueShift || 0}
                >
                  <div className={styles.hexContent}>
                    <span className={styles.moduleIcon}>{icon}</span>
                    <div className={styles.hexTitle}>{label}</div>
                    {isActive && moduleState.thinking && (
                      <div className={styles.thinking}>{moduleState.thinking}</div>
                    )}
                    {type === 'memory' && memory.agentWeights && Object.keys(memory.agentWeights).length > 0 && (
                      <div className={styles.hexValue}>
                        {Object.keys(memory.agentWeights).length} weights
                      </div>
                    )}
                    {type === 'critic' && critic.evaluation && (
                      <div className={styles.hexValue}>
                        Q: {(critic.evaluation.qualityScore * 100).toFixed(0)}%
                      </div>
                    )}
                    {type === 'learning' && (
                      <div className={styles.hexValue}>
                        {learning.updates.length} updates
                      </div>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Output panel - bottom */}
      {(core.output || core.error || core.rationale) && (
        <div className={styles.outputPanel}>
          <div className={styles.outputHeader}>
            <span className={styles.outputTitle}>
              {core.error ? 'Error' : 'Output'}
            </span>
            {core.jobId && (
              <span className={styles.outputJobId}>{core.jobId}</span>
            )}
          </div>
          <div className={`${styles.outputContent} ${core.error ? styles.outputError : ''}`}>
            {core.error || core.output || core.rationale}
          </div>
        </div>
      )}

      {/* Agent Modal */}
      {selectedModule && (
        <AgentModal
          moduleType={selectedModule}
          onClose={() => setSelectedModule(null)}
        />
      )}
    </div>
  );
};

export default HoneycombLayout;
