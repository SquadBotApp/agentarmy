/**
 * ModuleGrid - Responsive grid of ModuleHex components
 * Displays all agent modules with resonance effects
 * Click any hex to open the AgentModal
 */

import React, { useState } from 'react';
import { ModuleType } from '../store/unifiedAgentStore';
import { ModuleHex } from './ModuleHex';
import AgentModal from './AgentModal';
import styles from './ModuleGrid.module.css';

// Module configuration with colors and descriptions
const moduleConfig: Array<{
  type: ModuleType;
  label: string;
  description: string;
}> = [
  { type: 'planner', label: 'Planner', description: 'Task decomposition and CPM scheduling' },
  { type: 'executor', label: 'Executor', description: 'Tool calls and action execution' },
  { type: 'critic', label: 'Critic', description: 'Quality evaluation and feedback' },
  { type: 'governor', label: 'Governor', description: 'Policy checks and safety governance' },
  { type: 'memory', label: 'Memory', description: 'Agent weights and decision history' },
  { type: 'learning', label: 'Learning', description: 'Performance tracking and weight updates' },
];

interface ModuleGridProps {
  className?: string;
  onModuleClick?: (type: ModuleType) => void;
}

const ModuleGrid: React.FC<ModuleGridProps> = ({ className, onModuleClick }) => {
  const [selectedModule, setSelectedModule] = useState<ModuleType | null>(null);

  const handleModuleClick = (type: ModuleType) => {
    setSelectedModule(type);
    onModuleClick?.(type);
  };

  const handleCloseModal = () => {
    setSelectedModule(null);
  };

  return (
    <>
      <div className={`${styles.grid} ${className || ''}`}>
        {moduleConfig.map(({ type, label }) => (
          <div key={type} className={styles.hexWrapper}>
            <ModuleHex
              type={type}
              label={label}
              onClick={() => handleModuleClick(type)}
            />
          </div>
        ))}
      </div>

      {/* Agent Modal */}
      {selectedModule && (
        <AgentModal
          moduleType={selectedModule}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default ModuleGrid;
