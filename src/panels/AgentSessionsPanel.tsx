/**
 * AgentSessionsPanel - Display active agent sessions as cards
 *
 * This panel shows all active agent sessions for the current repository,
 * with each session displayed as a card showing its latest event and stats.
 *
 * Data is received through the 'agentSessions' data slice from the host.
 * Actions emit events that the host handles.
 */

import React, { useMemo, useCallback } from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import { Layers, AlertCircle, FolderOpen, RefreshCw } from 'lucide-react';
import type { PanelComponentProps } from '../types';
import type {
  SessionWithEvents,
  SessionCardData,
} from '../types/session.types';
import { getSessionColor } from '../types/session.types';
import { AgentSessionCard } from '../components/AgentSessionCard';

/**
 * Data slice shape for agent sessions
 */
export interface AgentSessionsSlice {
  sessions: SessionWithEvents[];
  isLoading: boolean;
  error?: string;
}

/**
 * Directory group for organizing sessions
 */
interface SessionDirectoryGroup {
  directory: string;
  normalizedDirectory: string;
  sessions: SessionWithEvents[];
  lastActivity: number;
  isCurrentDirectory: boolean;
}

const UNKNOWN_DIRECTORY_LABEL = 'Unknown Directory';

/**
 * AgentSessionsPanel Component
 */
export const AgentSessionsPanel: React.FC<PanelComponentProps> = ({
  context,
  actions,
  events,
}) => {
  const { theme } = useTheme();

  // Get sessions from data slice
  const sessionsSlice = context.getSlice<AgentSessionsSlice>('agentSessions');
  const sessions = sessionsSlice?.data?.sessions ?? [];
  const isLoading = sessionsSlice?.data?.isLoading ?? context.isSliceLoading('agentSessions');

  // Get current repository path
  const repositoryPath = context.currentScope.repository?.path ?? null;
  const normalizedRepositoryPath = useMemo(() => {
    if (!repositoryPath) return null;
    return repositoryPath.replace(/\\/g, '/').replace(/\/+$/, '') || repositoryPath;
  }, [repositoryPath]);

  // Filter state (could be stored in panel state via events)
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter sessions
  const filteredSessions = useMemo(() => {
    let filtered = sessions;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.session.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((s) => {
        const searchableText = [
          s.session.customName,
          s.session.sessionId,
          s.session.workingDirectory,
          s.latestEvent?.toolName,
          s.latestEvent?.fileName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return searchableText.includes(query);
      });
    }

    return filtered;
  }, [sessions, statusFilter, searchQuery]);

  // Create color map for sessions
  const sessionColorMap = useMemo(() => {
    const map = new Map<string, string>();
    filteredSessions.forEach((session, index) => {
      map.set(session.session.sessionId, getSessionColor(index));
    });
    return map;
  }, [filteredSessions]);

  // Group sessions by directory
  const sessionsByDirectory = useMemo<SessionDirectoryGroup[]>(() => {
    const groups = new Map<string, SessionDirectoryGroup>();

    filteredSessions.forEach((sessionWithEvents) => {
      const rawDirectory =
        sessionWithEvents.session.directory ||
        sessionWithEvents.session.workingDirectory ||
        UNKNOWN_DIRECTORY_LABEL;

      const normalizedKey =
        rawDirectory === UNKNOWN_DIRECTORY_LABEL
          ? UNKNOWN_DIRECTORY_LABEL
          : rawDirectory.replace(/\\/g, '/').replace(/\/+$/, '') || rawDirectory;

      let group = groups.get(normalizedKey);
      if (!group) {
        group = {
          directory: rawDirectory,
          normalizedDirectory: normalizedKey,
          sessions: [],
          lastActivity: 0,
          isCurrentDirectory: false,
        };
        groups.set(normalizedKey, group);
      }

      group.sessions.push(sessionWithEvents);
      const lastActivity = sessionWithEvents.session.lastActivity ?? 0;
      if (lastActivity > group.lastActivity) {
        group.lastActivity = lastActivity;
      }
    });

    const sortedGroups = Array.from(groups.values()).map((group) => ({
      ...group,
      isCurrentDirectory:
        normalizedRepositoryPath !== null &&
        group.normalizedDirectory === normalizedRepositoryPath,
    }));

    sortedGroups.sort((a, b) => {
      if (a.isCurrentDirectory && !b.isCurrentDirectory) return -1;
      if (b.isCurrentDirectory && !a.isCurrentDirectory) return 1;
      return a.directory.localeCompare(b.directory);
    });

    return sortedGroups;
  }, [filteredSessions, normalizedRepositoryPath]);

  // Time ago helper
  const getTimeAgo = useCallback((timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await context.refresh('repository', 'agentSessions');
    } catch (error) {
      console.error('Failed to refresh sessions:', error);
    }
  };

  // Emit events for session actions
  const handleOpenTerminal = (sessionId: string) => {
    events.emit({
      type: 'agent-sessions:open-terminal',
      source: 'agent-sessions-panel',
      timestamp: Date.now(),
      payload: { sessionId },
    });
  };

  const handleSessionSelect = (sessionId: string) => {
    events.emit({
      type: 'agent-sessions:select-session',
      source: 'agent-sessions-panel',
      timestamp: Date.now(),
      payload: { sessionId },
    });
  };

  const handleDeleteSession = (sessionId: string, workingDirectory: string) => {
    events.emit({
      type: 'agent-sessions:delete-session',
      source: 'agent-sessions-panel',
      timestamp: Date.now(),
      payload: { sessionId, workingDirectory },
    });
  };

  const handleOpenDirectory = (directory: string) => {
    events.emit({
      type: 'agent-sessions:open-directory',
      source: 'agent-sessions-panel',
      timestamp: Date.now(),
      payload: { directory },
    });
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.colors.backgroundSecondary,
        color: theme.colors.text,
        fontFamily: theme.fonts.body,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          backgroundColor: theme.colors.background,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} style={{ color: theme.colors.primary }} />
          <span
            style={{
              fontWeight: theme.fontWeights.semibold,
              fontSize: theme.fontSizes[1],
            }}
          >
            Agent Sessions
          </span>
          <span
            style={{
              fontSize: theme.fontSizes[0],
              color: theme.colors.textSecondary,
              backgroundColor: theme.colors.backgroundTertiary,
              padding: '2px 8px',
              borderRadius: '12px',
              fontWeight: theme.fontWeights.semibold,
            }}
          >
            {filteredSessions.length}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              fontSize: theme.fontSizes[0],
              fontFamily: theme.fonts.body,
              color: theme.colors.text,
              backgroundColor: theme.colors.backgroundTertiary,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '4px',
              padding: '6px 10px',
              cursor: 'pointer',
              outline: 'none',
              fontWeight: theme.fontWeights.medium,
            }}
            title="Filter sessions by status"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="idle">Idle</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            onClick={handleRefresh}
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
              color: theme.colors.textSecondary,
              display: 'flex',
              alignItems: 'center',
            }}
            title="Refresh sessions"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Sessions list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading && sessions.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: theme.colors.textSecondary,
            }}
          >
            <Layers size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <div style={{ fontSize: theme.fontSizes[1] }}>Loading sessions...</div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: theme.colors.textSecondary,
            }}
          >
            <AlertCircle size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <div style={{ fontSize: theme.fontSizes[1] }}>
              {sessions.length === 0
                ? 'No active sessions found'
                : 'No sessions match the current filter'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sessionsByDirectory.map((group) => {
              const canOpenDirectory =
                group.directory !== UNKNOWN_DIRECTORY_LABEL &&
                group.directory.trim().length > 0;

              const pathSegments = group.directory.replace(/\\/g, '/').split('/').filter(Boolean);
              const directoryName =
                group.directory === UNKNOWN_DIRECTORY_LABEL
                  ? UNKNOWN_DIRECTORY_LABEL
                  : pathSegments[pathSegments.length - 1] || group.directory;

              const shouldShowDirectoryHeader =
                sessionsByDirectory.length > 1 || !group.isCurrentDirectory;

              return (
                <div key={group.normalizedDirectory}>
                  {shouldShowDirectoryHeader && (
                    <div
                      onClick={
                        canOpenDirectory && !group.isCurrentDirectory
                          ? () => handleOpenDirectory(group.directory)
                          : undefined
                      }
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        border: group.isCurrentDirectory
                          ? `2px solid ${theme.colors.primary}`
                          : `1px solid ${theme.colors.border}`,
                        backgroundColor: group.isCurrentDirectory
                          ? theme.colors.primary + '10'
                          : theme.colors.backgroundTertiary,
                        cursor:
                          canOpenDirectory && !group.isCurrentDirectory
                            ? 'pointer'
                            : 'default',
                        transition: 'background-color 0.2s',
                      }}
                      title={
                        group.isCurrentDirectory
                          ? 'Current directory'
                          : canOpenDirectory
                            ? 'Open repository'
                            : undefined
                      }
                    >
                      <span
                        style={{
                          fontWeight: theme.fontWeights.semibold,
                          fontSize: theme.fontSizes[2],
                          color: group.isCurrentDirectory
                            ? theme.colors.primary
                            : theme.colors.text,
                        }}
                      >
                        {directoryName}
                      </span>
                      {canOpenDirectory && !group.isCurrentDirectory && (
                        <FolderOpen size={14} style={{ color: theme.colors.textSecondary }} />
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {group.sessions.map((sessionWithEvents) => {
                      const cardData: SessionCardData = {
                        session: sessionWithEvents.session,
                        isExpanded: false,
                        fileOperations: sessionWithEvents.fileOperations,
                        lastTodos: sessionWithEvents.lastTodos,
                        latestEvent: sessionWithEvents.latestEvent,
                      };

                      const sessionColor =
                        sessionColorMap.get(sessionWithEvents.session.sessionId) ||
                        getSessionColor(0);

                      return (
                        <AgentSessionCard
                          key={sessionWithEvents.session.sessionId}
                          cardData={cardData}
                          sessionColor={sessionColor}
                          onOpenTerminal={() =>
                            handleOpenTerminal(sessionWithEvents.session.sessionId)
                          }
                          onSessionDetailSelect={() =>
                            handleSessionSelect(sessionWithEvents.session.sessionId)
                          }
                          onDeleteSession={() =>
                            handleDeleteSession(
                              sessionWithEvents.session.sessionId,
                              sessionWithEvents.session.workingDirectory
                            )
                          }
                          getTimeAgo={getTimeAgo}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Preview component for panel catalog
 */
export const AgentSessionsPanelPreview: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div
      style={{
        padding: '12px',
        fontSize: theme.fontSizes[0],
        fontFamily: theme.fonts.body,
        color: theme.colors.text,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div
        style={{
          padding: '8px',
          backgroundColor: theme.colors.backgroundTertiary,
          borderRadius: '6px',
          borderLeft: `3px solid #3b82f6`,
        }}
      >
        <div style={{ fontWeight: theme.fontWeights.semibold, marginBottom: '4px' }}>
          Session abc123
        </div>
        <div style={{ fontSize: theme.fontSizes[0], color: theme.colors.textSecondary }}>
          Last event: Read • src/index.ts
        </div>
      </div>
      <div
        style={{
          padding: '8px',
          backgroundColor: theme.colors.backgroundTertiary,
          borderRadius: '6px',
          borderLeft: `3px solid #10b981`,
        }}
      >
        <div style={{ fontWeight: theme.fontWeights.semibold, marginBottom: '4px' }}>
          Session def456
        </div>
        <div style={{ fontSize: theme.fontSizes[0], color: theme.colors.textSecondary }}>
          Last event: Write • src/utils.ts
        </div>
      </div>
    </div>
  );
};
