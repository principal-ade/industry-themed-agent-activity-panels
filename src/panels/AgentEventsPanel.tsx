/**
 * AgentEventsPanel - Display incoming agent events in real-time
 *
 * This panel shows real-time agent events for debugging and monitoring.
 * Events are received through the panel event system.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import {
  Activity,
  ChevronDown,
  ChevronRight,
  Copy,
  Trash2,
  Filter,
} from 'lucide-react';
import type { PanelComponentProps } from '../types';
import type { RepoNormalizedUniversalAgentSessionEvent } from '@principal-ai/agent-monitoring';

interface EventEntry {
  event: RepoNormalizedUniversalAgentSessionEvent;
  timestamp: number;
  localIndex: number;
}

const MAX_EVENTS = 500;

const EVENT_COLORS: Record<string, string> = {
  'pre-tool-use': '#8b5cf6',
  'post-tool-use': '#3b82f6',
  notification: '#f59e0b',
  stop: '#ef4444',
  'subagent-stop': '#ef4444',
  'session-start': '#10b981',
  'session-end': '#6366f1',
  unknown: '#6b7280',
};

const getEventColor = (eventType: string): string => {
  return EVENT_COLORS[eventType] || EVENT_COLORS.unknown;
};

/**
 * AgentEventsPanel Component
 */
export const AgentEventsPanel: React.FC<PanelComponentProps> = ({
  context,
  events: panelEvents,
}) => {
  const { theme } = useTheme();
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());
  const [filterByRepo, setFilterByRepo] = useState(true);
  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<string>>(new Set());
  const [autoScroll, setAutoScroll] = useState(true);
  const eventCounterRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const repositoryPath = context.currentScope.repository?.path ?? null;

  // Subscribe to agent events via panel event system
  useEffect(() => {
    const unsubscribe = panelEvents.on<{ event: RepoNormalizedUniversalAgentSessionEvent }>(
      'agent-event:received',
      (panelEvent) => {
        const agentEvent = panelEvent.payload?.event;
        if (!agentEvent) return;

        // Filter by repository if enabled
        if (filterByRepo && repositoryPath) {
          const eventRepoPath = agentEvent.repository?.root || agentEvent.workingDirectory;
          if (eventRepoPath !== repositoryPath) {
            return;
          }
        }

        setEvents((prev) => {
          const newEntry: EventEntry = {
            event: agentEvent,
            timestamp: Date.now(),
            localIndex: eventCounterRef.current++,
          };

          const updated = [...prev, newEntry];
          return updated.length > MAX_EVENTS ? updated.slice(-MAX_EVENTS) : updated;
        });
      }
    );

    return () => unsubscribe();
  }, [panelEvents, repositoryPath, filterByRepo]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  // Get unique event types for filtering
  const availableEventTypes = useMemo(() => {
    const types = new Set<string>();
    events.forEach((entry) => types.add(entry.event.eventType));
    return Array.from(types).sort();
  }, [events]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (selectedEventTypes.size === 0) return events;
    return events.filter((entry) => selectedEventTypes.has(entry.event.eventType));
  }, [events, selectedEventTypes]);

  const toggleExpanded = useCallback((index: number) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const copyToClipboard = useCallback((event: RepoNormalizedUniversalAgentSessionEvent) => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setExpandedEvents(new Set());
  }, []);

  const toggleEventTypeFilter = useCallback((eventType: string) => {
    setSelectedEventTypes((prev) => {
      const next = new Set(prev);
      if (next.has(eventType)) next.delete(eventType);
      else next.add(eventType);
      return next;
    });
  }, []);

  // Extract file paths from event
  const extractFilePaths = (event: RepoNormalizedUniversalAgentSessionEvent): string[] => {
    if (event.files && event.files.length > 0) {
      return event.files.map((f) => f.displayPath || f.absolutePath);
    }
    return [];
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
          padding: '8px 16px',
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          backgroundColor: theme.colors.background,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} style={{ color: theme.colors.primary }} />
          <span style={{ fontWeight: theme.fontWeights.semibold, fontSize: theme.fontSizes[1] }}>
            Agent Events
          </span>
          <span
            style={{
              fontSize: theme.fontSizes[0],
              color: theme.colors.textSecondary,
              backgroundColor: theme.colors.backgroundTertiary,
              padding: '2px 8px',
              borderRadius: '4px',
            }}
          >
            {filteredEvents.length}
            {filteredEvents.length === MAX_EVENTS ? ' (max)' : ''}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Filter by repo toggle */}
          <button
            onClick={() => setFilterByRepo(!filterByRepo)}
            style={{
              height: '28px',
              padding: '0 10px',
              fontSize: theme.fontSizes[0],
              backgroundColor: filterByRepo ? theme.colors.primary : 'transparent',
              color: filterByRepo ? theme.colors.background : theme.colors.text,
              border: `1px solid ${filterByRepo ? theme.colors.primary : theme.colors.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title={filterByRepo ? 'Filtering by repository' : 'Show all repositories'}
          >
            <Filter size={12} />
            {filterByRepo ? 'Filtered' : 'All'}
          </button>

          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            style={{
              height: '28px',
              padding: '0 10px',
              fontSize: theme.fontSizes[0],
              backgroundColor: autoScroll ? theme.colors.success : 'transparent',
              color: autoScroll ? theme.colors.background : theme.colors.text,
              border: `1px solid ${autoScroll ? theme.colors.success : theme.colors.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            title={autoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled'}
          >
            {autoScroll ? 'Auto' : 'Manual'}
          </button>

          {/* Clear button */}
          <button
            onClick={clearEvents}
            disabled={events.length === 0}
            style={{
              height: '28px',
              padding: '0 10px',
              fontSize: theme.fontSizes[0],
              backgroundColor: 'transparent',
              color: events.length === 0 ? theme.colors.textSecondary : theme.colors.text,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '4px',
              cursor: events.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: events.length === 0 ? 0.5 : 1,
            }}
            title="Clear all events"
          >
            <Trash2 size={12} />
            Clear
          </button>
        </div>
      </div>

      {/* Event type filters */}
      {availableEventTypes.length > 0 && (
        <div
          style={{
            padding: '8px 16px',
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          {availableEventTypes.map((eventType) => {
            const isSelected = selectedEventTypes.has(eventType) || selectedEventTypes.size === 0;
            return (
              <button
                key={eventType}
                onClick={() => toggleEventTypeFilter(eventType)}
                style={{
                  padding: '4px 8px',
                  fontSize: theme.fontSizes[0],
                  backgroundColor: isSelected ? getEventColor(eventType) : 'transparent',
                  color: isSelected ? theme.colors.background : theme.colors.textSecondary,
                  border: `1px solid ${getEventColor(eventType)}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  opacity: isSelected ? 1 : 0.5,
                }}
              >
                {eventType}
              </button>
            );
          })}
        </div>
      )}

      {/* Events list */}
      <div
        ref={containerRef}
        style={{ flex: 1, overflowY: 'auto', padding: '8px' }}
      >
        {filteredEvents.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: theme.colors.textSecondary,
            }}
          >
            <Activity size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <div style={{ fontSize: theme.fontSizes[1] }}>
              {events.length === 0 ? 'No events received yet' : 'No events match the filter'}
            </div>
            <div style={{ fontSize: theme.fontSizes[0], marginTop: '4px' }}>
              {filterByRepo && repositoryPath
                ? `Listening for events in ${repositoryPath}`
                : 'Listening for events from all repositories'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {filteredEvents.map((entry) => {
              const isExpanded = expandedEvents.has(entry.localIndex);
              const filePaths = extractFilePaths(entry.event);
              const eventColor = getEventColor(entry.event.eventType);

              return (
                <div
                  key={entry.localIndex}
                  style={{
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    borderLeft: `3px solid ${eventColor}`,
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  {/* Event summary */}
                  <div
                    onClick={() => toggleExpanded(entry.localIndex)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ flexShrink: 0, paddingTop: '2px' }}>
                      {isExpanded ? (
                        <ChevronDown size={16} style={{ color: theme.colors.textSecondary }} />
                      ) : (
                        <ChevronRight size={16} style={{ color: theme.colors.textSecondary }} />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: filePaths.length > 0 ? '4px' : 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: theme.fontSizes[0],
                            fontWeight: theme.fontWeights.semibold,
                            color: eventColor,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {entry.event.eventType}
                        </span>
                        {entry.event.toolName && (
                          <span
                            style={{
                              fontSize: theme.fontSizes[0],
                              color: theme.colors.text,
                              backgroundColor: theme.colors.backgroundSecondary,
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontWeight: theme.fontWeights.medium,
                            }}
                          >
                            {entry.event.toolName}
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: theme.fontSizes[0],
                            color: theme.colors.textSecondary,
                          }}
                        >
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      {filePaths.length > 0 && (
                        <div
                          style={{
                            fontSize: theme.fontSizes[0],
                            fontFamily: theme.fonts.monospace,
                            color: theme.colors.text,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {filePaths[0]}
                          {filePaths.length > 1 && (
                            <span style={{ color: theme.colors.textSecondary }}>
                              {' '}+{filePaths.length - 1} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(entry.event);
                      }}
                      style={{
                        padding: '4px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: theme.colors.textSecondary,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Copy to clipboard"
                    >
                      <Copy size={14} />
                    </button>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: '12px',
                        borderTop: `1px solid ${theme.colors.border}`,
                        backgroundColor: theme.colors.backgroundSecondary,
                        fontSize: theme.fontSizes[0],
                      }}
                    >
                      {/* Session info */}
                      <div style={{ marginBottom: '12px' }}>
                        <div
                          style={{
                            fontWeight: theme.fontWeights.semibold,
                            marginBottom: '4px',
                            color: theme.colors.textSecondary,
                          }}
                        >
                          Session
                        </div>
                        <div style={{ fontFamily: theme.fonts.monospace }}>
                          {entry.event.sessionId}
                        </div>
                      </div>

                      {/* Repository info */}
                      {entry.event.repository && (
                        <div style={{ marginBottom: '12px' }}>
                          <div
                            style={{
                              fontWeight: theme.fontWeights.semibold,
                              marginBottom: '4px',
                              color: theme.colors.textSecondary,
                            }}
                          >
                            Repository
                          </div>
                          <div>
                            <div>
                              {entry.event.repository.owner}/{entry.event.repository.repo}
                            </div>
                            <div style={{ color: theme.colors.textSecondary }}>
                              {entry.event.repository.root}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Files */}
                      {filePaths.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          <div
                            style={{
                              fontWeight: theme.fontWeights.semibold,
                              marginBottom: '4px',
                              color: theme.colors.textSecondary,
                            }}
                          >
                            Files ({filePaths.length})
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {filePaths.map((path) => (
                              <div
                                key={path}
                                style={{
                                  fontFamily: theme.fonts.monospace,
                                  padding: '2px 6px',
                                  backgroundColor: theme.colors.background,
                                  borderRadius: '3px',
                                }}
                                title={path}
                              >
                                {path}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Full JSON */}
                      <div>
                        <div
                          style={{
                            fontWeight: theme.fontWeights.semibold,
                            marginBottom: '4px',
                            color: theme.colors.textSecondary,
                          }}
                        >
                          Raw Event
                        </div>
                        <pre
                          style={{
                            fontFamily: theme.fonts.monospace,
                            fontSize: theme.fontSizes[0],
                            backgroundColor: theme.colors.background,
                            padding: '8px',
                            borderRadius: '4px',
                            overflow: 'auto',
                            maxHeight: '300px',
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {JSON.stringify(entry.event, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
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
export const AgentEventsPanelPreview: React.FC = () => {
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
          padding: '6px',
          backgroundColor: theme.colors.backgroundTertiary,
          borderRadius: '4px',
          borderLeft: `3px solid #3b82f6`,
        }}
      >
        <div style={{ fontWeight: theme.fontWeights.semibold }}>post-tool-use</div>
        <div style={{ color: theme.colors.textSecondary }}>Read • src/index.ts</div>
      </div>
      <div
        style={{
          padding: '6px',
          backgroundColor: theme.colors.backgroundTertiary,
          borderRadius: '4px',
          borderLeft: `3px solid #8b5cf6`,
        }}
      >
        <div style={{ fontWeight: theme.fontWeights.semibold }}>pre-tool-use</div>
        <div style={{ color: theme.colors.textSecondary }}>Write • src/utils.ts</div>
      </div>
    </div>
  );
};
