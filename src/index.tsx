import { AgentSessionsPanel } from './panels/AgentSessionsPanel';
import { AgentEventsPanel } from './panels/AgentEventsPanel';
import type { PanelDefinition, PanelContextValue } from './types';
import {
  agentSessionsTools,
  agentEventsTools,
} from './tools';

/**
 * Export array of panel definitions.
 * This is the required export for panel extensions.
 */
export const panels: PanelDefinition[] = [
  // Agent Sessions Panel
  {
    metadata: {
      id: 'industry-theme.agent-sessions',
      name: 'Agent Sessions',
      icon: '🤖',
      version: '0.1.0',
      author: 'Principal AI',
      description: 'Display and manage active agent sessions across repositories',
      slices: ['agentSessions'],
      tools: agentSessionsTools,
    },
    component: AgentSessionsPanel,

    onMount: async (context: PanelContextValue) => {
      console.log('[AgentSessionsPanel] Mounted', context.currentScope.repository?.path);
      if (context.hasSlice('agentSessions') && !context.isSliceLoading('agentSessions')) {
        await context.refresh('repository', 'agentSessions');
      }
    },

    onUnmount: async () => {
      console.log('[AgentSessionsPanel] Unmounting');
    },
  },

  // Agent Events Panel
  {
    metadata: {
      id: 'industry-theme.agent-events',
      name: 'Agent Events',
      icon: '📡',
      version: '0.1.0',
      author: 'Principal AI',
      description: 'Real-time stream of agent events for debugging and monitoring',
      slices: [],
      tools: agentEventsTools,
    },
    component: AgentEventsPanel,

    onMount: async (context: PanelContextValue) => {
      console.log('[AgentEventsPanel] Mounted', context.currentScope.repository?.path);
    },

    onUnmount: async () => {
      console.log('[AgentEventsPanel] Unmounting');
    },
  },
];

/**
 * Called once when the entire package is loaded.
 */
export const onPackageLoad = async () => {
  console.log('[AgentActivityPanels] Package loaded');
};

/**
 * Called once when the package is unloaded.
 */
export const onPackageUnload = async () => {
  console.log('[AgentActivityPanels] Package unloading');
};

/**
 * Export tools for server-safe imports.
 */
export {
  // Agent Sessions tools
  agentSessionsTools,
  agentSessionsToolsMetadata,
  refreshSessionsTool,
  filterSessionsTool,
  selectSessionTool,
  openTerminalTool,
  // Agent Events tools
  agentEventsTools,
  agentEventsToolsMetadata,
  clearEventsTool,
  filterEventsTool,
  toggleRepoFilterTool,
} from './tools';

// Export types
export type * from './types';
export type * from './types/session.types';

// Export components for direct use
export { AgentSessionsPanel, AgentSessionsPanelPreview } from './panels/AgentSessionsPanel';
export { AgentEventsPanel, AgentEventsPanelPreview } from './panels/AgentEventsPanel';
export { AgentSessionCard } from './components/AgentSessionCard';
