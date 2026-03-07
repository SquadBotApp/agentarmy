/**
 * BackgroundLayer - Dynamic cognitive environment
 * Three-layer reactive background that responds to agent activity
 * 
 * Layers:
 * 1. Base concept-art layer (hex tiles, circuit, network)
 * 2. Dynamic overlay that reacts to module activity
 * 3. Ripple canvas for ZPE pulses and learning waves
 */

import React, { useMemo } from 'react';
import { useUnifiedAgentStore } from '../store/unifiedAgentStore';
import styles from './BackgroundLayer.module.css';

export const BackgroundLayer: React.FC = () => {
  const {
    backgroundMode,
    core,
    planner,
    executor,
    critic,
    governor,
    memory,
    learning,
  } = useUnifiedAgentStore();

  // Compute intensity multiplier based on mode
  const intensityMultiplier = backgroundMode === 'high-energy' ? 1 : 0.3;

  // Compute active effects based on module states
  const effects = useMemo(() => {
    return {
      plannerActive: planner.active,
      executorActive: executor.active,
      criticActive: critic.active,
      governorActive: governor.active,
      memoryAccess: memory.active,
      learningUpdate: learning.active,
      zpeIntensity: Math.min(1, core.zpe.total),
      isThinking: core.status === 'thinking',
      isExecuting: core.status === 'executing',
      isEvaluating: core.status === 'evaluating',
    };
  }, [planner.active, executor.active, critic.active, governor.active, 
      memory.active, learning.active, core.zpe.total, core.status]);

  // CSS custom properties for dynamic styling
  const cssVars = {
    '--intensity-multiplier': intensityMultiplier,
    '--zpe-intensity': effects.zpeIntensity * intensityMultiplier,
    '--pulse-amplitude': backgroundMode === 'high-energy' ? '1.0' : '0.4',
    '--grid-shift': effects.plannerActive ? (backgroundMode === 'high-energy' ? '8px' : '2px') : '0px',
    '--node-glow': effects.memoryAccess ? (backgroundMode === 'high-energy' ? '1' : '0.4') : '0',
    '--circuit-brightness': effects.executorActive ? (backgroundMode === 'high-energy' ? '1.5' : '1.1') : '1',
    '--critic-tint': effects.criticActive ? (backgroundMode === 'high-energy' ? '0.3' : '0.1') : '0',
    '--governor-shimmer': effects.governorActive ? '1' : '0',
    '--learning-ripple': effects.learningUpdate ? '1' : '0',
  } as React.CSSProperties;

  // Determine which background style is most prominent
  const getHexOpacity = () => {
    if (effects.plannerActive) return backgroundMode === 'high-energy' ? 0.6 : 0.3;
    return 0.15;
  };

  const getNetworkOpacity = () => {
    if (effects.memoryAccess || effects.learningUpdate) return backgroundMode === 'high-energy' ? 0.6 : 0.3;
    return 0.15;
  };

  const getCircuitOpacity = () => {
    if (effects.executorActive || effects.governorActive) return backgroundMode === 'high-energy' ? 0.6 : 0.3;
    return 0.15;
  };

  return (
    <div className={styles.backgroundContainer} style={cssVars}>
      {/* Base concept-art layer */}
      <div 
        className={styles.baseLayer}
        style={{ backgroundImage: 'url(/images/bg-main.jpg)' }}
      />

      {/* Hex-tile metallic layer - activates during planning */}
      <div 
        className={`${styles.hexLayer} ${effects.plannerActive ? styles.active : ''}`}
        style={{ 
          backgroundImage: 'url(/images/bg-hex.jpg)',
          opacity: getHexOpacity(),
        }}
      />

      {/* Glowing network layer - activates during memory/learning */}
      <div 
        className={`${styles.networkLayer} ${(effects.memoryAccess || effects.learningUpdate) ? styles.active : ''}`}
        style={{ opacity: getNetworkOpacity() }}
      >
        {/* Animated network nodes */}
        <svg className={styles.networkSvg} viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
          <defs>
            <filter id="nodeGlow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Network nodes */}
          {Array.from({ length: 30 }).map((_, i) => (
            <circle
              key={`node-${i}`}
              cx={100 + (i % 10) * 180 + Math.sin(i) * 50}
              cy={100 + Math.floor(i / 10) * 300 + Math.cos(i) * 80}
              r={effects.memoryAccess ? 6 : 3}
              fill={effects.learningUpdate ? '#66ff66' : '#4a9eff'}
              opacity={effects.memoryAccess || effects.learningUpdate ? 0.8 : 0.2}
              filter="url(#nodeGlow)"
              className={effects.memoryAccess ? styles.pulsingNode : ''}
            />
          ))}
          
          {/* Network connections */}
          {Array.from({ length: 20 }).map((_, i) => (
            <line
              key={`line-${i}`}
              x1={100 + (i % 10) * 180}
              y1={100 + Math.floor(i / 10) * 300}
              x2={100 + ((i + 1) % 10) * 180}
              y2={100 + Math.floor((i + 1) / 10) * 300}
              stroke={effects.learningUpdate ? '#66ff66' : '#4a9eff'}
              strokeWidth={1}
              opacity={effects.learningUpdate ? 0.6 : 0.1}
              className={effects.learningUpdate ? styles.flowingLine : ''}
            />
          ))}
        </svg>
      </div>

      {/* Circuit-board layer - activates during execution/governance */}
      <div 
        className={`${styles.circuitLayer} ${(effects.executorActive || effects.governorActive) ? styles.active : ''}`}
        style={{ 
          backgroundImage: 'url(/images/bg-circuit.jpg)',
          opacity: getCircuitOpacity(),
        }}
      />

      {/* Dynamic grid overlay */}
      <div 
        className={`${styles.gridOverlay} ${effects.isThinking ? styles.thinking : ''}`}
        style={{
          transform: `translate(${effects.plannerActive ? 'var(--grid-shift)' : '0'}, 0)`,
        }}
      />

      {/* Critic red pulse overlay */}
      {effects.criticActive && (
        <div 
          className={styles.criticOverlay}
          style={{ opacity: `var(--critic-tint)` }}
        />
      )}

      {/* Governor shield shimmer */}
      {effects.governorActive && (
        <div className={styles.governorShimmer} />
      )}

      {/* Learning ripple effect */}
      {effects.learningUpdate && (
        <div className={styles.learningRipple}>
          <div className={styles.rippleWave} />
          <div className={styles.rippleWave} style={{ animationDelay: '0.2s' }} />
          <div className={styles.rippleWave} style={{ animationDelay: '0.4s' }} />
        </div>
      )}

      {/* ZPE global pulse */}
      {effects.zpeIntensity > 0.5 && (
        <div 
          className={styles.zpePulse}
          style={{ 
            opacity: (effects.zpeIntensity - 0.5) * 2 * intensityMultiplier,
          }}
        />
      )}

      {/* Core-driven pulse overlay - syncs with CoreHex ZPE */}
      <div className={styles.corePulseOverlay} />

      {/* ZPE spike ripple - triggered by CoreHex when ZPE increases sharply */}
      <div className={styles.zpeRipple}>
        <div className={styles.zpeRippleWave} />
        <div className={styles.zpeRippleWave} style={{ animationDelay: '0.15s' }} />
        <div className={styles.zpeRippleWave} style={{ animationDelay: '0.3s' }} />
      </div>

      {/* Ambient particle effect */}
      <div className={styles.particles}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`particle-${i}`}
            className={styles.particle}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default BackgroundLayer;
