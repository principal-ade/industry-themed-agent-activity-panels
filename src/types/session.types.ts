/**
 * Agent Session Types
 *
 * Re-exports core types from @principal-ai/agent-monitoring
 * and defines UI-specific types for panel display.
 */

// Re-export core types from agent-monitoring
export type {
  RepoNormalizedUniversalAgentSessionEvent,
  NormalizedPathInfo,
  RepositoryInfo,
  CommonToolName,
} from '@principal-ai/agent-monitoring';

export {
  FileOperation,
  PathContext,
  SupportedAgent,
  getFileOperation,
  extractFilePath,
} from '@principal-ai/agent-monitoring';

/**
 * Todo item extracted from agent session events
 */
export interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  timestamp: number;
}

/**
 * File operation record for UI display
 */
export interface FileOperationRecord {
  path: string;
  fullPath?: string;
  relativePath?: string;
  operations: Array<{
    type: 'read' | 'write' | 'edit' | 'delete' | 'create';
    timestamp: number;
    lineCount?: number;
  }>;
  lastOperation: 'read' | 'write' | 'edit' | 'delete' | 'create';
  lastTimestamp: number;
}

/**
 * Session status for UI display
 */
export type SessionStatus = 'active' | 'idle' | 'waiting' | 'inactive' | 'stopped';

/**
 * UI session data with computed status
 */
export interface UIAgentSessionData {
  sessionId: string;
  directory: string;
  workingDirectory: string;
  lastActivity: number;
  firstAccess: number;
  isActive: boolean;
  customName?: string;
  status: SessionStatus;
  statusColor: string;
  statusText: string;
  eventCount?: number;
  fileAccessCount?: number;
  fileWriteCount?: number;
  toolCallCount?: number;
}

/**
 * Session with events and computed data for display
 */
export interface SessionWithEvents {
  session: UIAgentSessionData;
  events: import('@principal-ai/agent-monitoring').RepoNormalizedUniversalAgentSessionEvent[];
  latestEvent?: {
    toolName: string;
    timestamp: number;
    fileName?: string;
  };
  fileOperations?: Map<string, FileOperationRecord>;
  lastTodos?: TodoItem[];
}

/**
 * Session card display data
 */
export interface SessionCardData {
  session: UIAgentSessionData;
  isExpanded: boolean;
  fileOperations?: Map<string, FileOperationRecord>;
  lastTodos?: TodoItem[];
  latestEvent?: {
    toolName: string;
    timestamp: number;
    fileName?: string;
  };
  activityType?: 'active' | 'waiting' | null;
}

/**
 * Session colors for visual differentiation
 */
export const SESSION_COLORS: readonly string[] = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#14b8a6',
];

export function getSessionColor(index: number): string {
  return SESSION_COLORS[index % SESSION_COLORS.length];
}
