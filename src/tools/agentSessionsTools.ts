/**
 * Agent Sessions Panel Tools
 *
 * UTCP-compatible tools for the agent sessions panel.
 * These tools emit events that the panel listens for.
 */

import type { PanelTool, PanelToolsMetadata } from '@principal-ade/utcp-panel-event';

/**
 * Tool: Refresh Sessions
 */
export const refreshSessionsTool: PanelTool = {
  name: 'refresh_agent_sessions',
  description: 'Refreshes the list of active agent sessions',
  inputs: {
    type: 'object',
    properties: {
      force: {
        type: 'boolean',
        description: 'Force refresh even if data is fresh',
      },
    },
  },
  outputs: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      sessionCount: { type: 'number' },
    },
  },
  tags: ['sessions', 'refresh'],
  tool_call_template: {
    call_template_type: 'panel_event',
    event_type: 'agent-sessions:refresh',
  },
};

/**
 * Tool: Filter Sessions by Status
 */
export const filterSessionsTool: PanelTool = {
  name: 'filter_agent_sessions',
  description: 'Filters agent sessions by their status',
  inputs: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['all', 'active', 'idle', 'inactive'],
        description: 'The status to filter by',
      },
    },
    required: ['status'],
  },
  outputs: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      filteredCount: { type: 'number' },
    },
  },
  tags: ['sessions', 'filter'],
  tool_call_template: {
    call_template_type: 'panel_event',
    event_type: 'agent-sessions:filter',
  },
};

/**
 * Tool: Select Session
 */
export const selectSessionTool: PanelTool = {
  name: 'select_agent_session',
  description: 'Selects an agent session to view its details',
  inputs: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'The ID of the session to select',
      },
    },
    required: ['sessionId'],
  },
  outputs: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      sessionId: { type: 'string' },
    },
  },
  tags: ['sessions', 'selection'],
  tool_call_template: {
    call_template_type: 'panel_event',
    event_type: 'agent-sessions:select-session',
  },
};

/**
 * Tool: Open Terminal for Session
 */
export const openTerminalTool: PanelTool = {
  name: 'open_session_terminal',
  description: 'Opens a terminal to resume an agent session',
  inputs: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'The ID of the session to resume',
      },
    },
    required: ['sessionId'],
  },
  outputs: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
    },
  },
  tags: ['sessions', 'terminal'],
  tool_call_template: {
    call_template_type: 'panel_event',
    event_type: 'agent-sessions:open-terminal',
  },
};

/**
 * All agent sessions tools
 */
export const agentSessionsTools: PanelTool[] = [
  refreshSessionsTool,
  filterSessionsTool,
  selectSessionTool,
  openTerminalTool,
];

/**
 * Panel tools metadata
 */
export const agentSessionsToolsMetadata: PanelToolsMetadata = {
  id: 'industry-theme.agent-sessions',
  name: 'Agent Sessions Panel',
  description: 'Tools for managing and viewing agent sessions',
  tools: agentSessionsTools,
};
