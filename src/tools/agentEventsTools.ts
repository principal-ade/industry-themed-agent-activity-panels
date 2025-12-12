/**
 * Agent Events Panel Tools
 *
 * UTCP-compatible tools for the agent events panel.
 */

import type { PanelTool, PanelToolsMetadata } from '@principal-ade/utcp-panel-event';

/**
 * Tool: Clear Events
 */
export const clearEventsTool: PanelTool = {
  name: 'clear_agent_events',
  description: 'Clears all events from the agent events panel',
  inputs: {
    type: 'object',
    properties: {},
  },
  outputs: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
    },
  },
  tags: ['events', 'clear'],
  tool_call_template: {
    call_template_type: 'panel_event',
    event_type: 'agent-events:clear',
  },
};

/**
 * Tool: Filter Events by Type
 */
export const filterEventsTool: PanelTool = {
  name: 'filter_agent_events',
  description: 'Filters agent events by event type',
  inputs: {
    type: 'object',
    properties: {
      eventTypes: {
        type: 'array',
        items: { type: 'string' },
        description: 'Event types to show (empty for all)',
      },
    },
  },
  outputs: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      filteredCount: { type: 'number' },
    },
  },
  tags: ['events', 'filter'],
  tool_call_template: {
    call_template_type: 'panel_event',
    event_type: 'agent-events:filter',
  },
};

/**
 * Tool: Toggle Repository Filter
 */
export const toggleRepoFilterTool: PanelTool = {
  name: 'toggle_repo_filter',
  description: 'Toggles filtering events by the current repository',
  inputs: {
    type: 'object',
    properties: {
      enabled: {
        type: 'boolean',
        description: 'Whether to filter by repository',
      },
    },
  },
  outputs: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      filterEnabled: { type: 'boolean' },
    },
  },
  tags: ['events', 'filter', 'repository'],
  tool_call_template: {
    call_template_type: 'panel_event',
    event_type: 'agent-events:toggle-repo-filter',
  },
};

/**
 * All agent events tools
 */
export const agentEventsTools: PanelTool[] = [
  clearEventsTool,
  filterEventsTool,
  toggleRepoFilterTool,
];

/**
 * Panel tools metadata
 */
export const agentEventsToolsMetadata: PanelToolsMetadata = {
  id: 'industry-theme.agent-events',
  name: 'Agent Events Panel',
  description: 'Tools for viewing and filtering agent events',
  tools: agentEventsTools,
};
