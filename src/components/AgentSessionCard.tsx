/**
 * AgentSessionCard - Display a single agent session as a card
 */

import React, { useState } from 'react';
import {
  Activity,
  Clock,
  Circle,
  Check,
  Sparkles,
  Edit3,
  Trash2,
} from 'lucide-react';
import { useTheme } from '@principal-ade/industry-theme';
import type { SessionCardData, TodoItem } from '../types';

export interface AgentSessionCardProps {
  cardData: SessionCardData;
  sessionColor: string;
  onOpenTerminal?: () => void;
  onSessionDetailSelect?: () => void;
  onDeleteSession?: () => void;
  onCopySessionId?: () => void;
  getTimeAgo: (timestamp: number) => string;
}

export const AgentSessionCard: React.FC<AgentSessionCardProps> = ({
  cardData,
  sessionColor,
  onOpenTerminal,
  onSessionDetailSelect,
  onDeleteSession,
  onCopySessionId,
  getTimeAgo,
}) => {
  const { theme } = useTheme();
  const [isTaskExpanded, setIsTaskExpanded] = useState(false);
  const [isTerminalLoading, setIsTerminalLoading] = useState(false);

  const hasTodos = cardData.lastTodos && cardData.lastTodos.length > 0;

  // Get the todo to show (in_progress > pending > completed)
  const getTodoToShow = (): TodoItem | null => {
    if (!hasTodos || !cardData.lastTodos) return null;
    const inProgress = cardData.lastTodos.find((t) => t.status === 'in_progress');
    if (inProgress) return inProgress;
    const pending = cardData.lastTodos.filter((t) => t.status === 'pending');
    if (pending.length > 0) return pending[0];
    const completed = cardData.lastTodos.filter((t) => t.status === 'completed');
    return completed[completed.length - 1] || null;
  };

  const todoToShow = getTodoToShow();

  const handleResume = async () => {
    if (!onOpenTerminal || isTerminalLoading) return;
    setIsTerminalLoading(true);
    try {
      await onOpenTerminal();
    } finally {
      setTimeout(() => setIsTerminalLoading(false), 1500);
    }
  };

  return (
    <div
      style={{
        backgroundColor: theme.colors.backgroundSecondary,
        border: `1px solid ${theme.colors.border}`,
        overflow: 'hidden',
        transition: 'all 0.2s',
        flexShrink: 0,
      }}
    >
      {/* Current Task / Last Event Section */}
      <div
        style={{
          padding: '16px',
          backgroundColor: theme.colors.backgroundTertiary,
          borderBottom: `1px solid ${theme.colors.border}`,
        }}
      >
        {/* Header */}
        <div
          onClick={() => setIsTaskExpanded(!isTaskExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: theme.fontSizes[1],
                color: theme.colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {hasTodos ? 'Current Task' : 'Last Event'}
            </span>
            <span
              style={{
                fontSize: theme.fontSizes[1],
                color: theme.colors.textTertiary,
              }}
            >
              {getTimeAgo(cardData.session.lastActivity)}
            </span>
          </div>
        </div>

        {/* Task/Event Display */}
        <div
          style={{
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {hasTodos && todoToShow ? (
            <>
              {todoToShow.status === 'completed' ? (
                <Check size={14} color={theme.colors.success} />
              ) : todoToShow.status === 'in_progress' ? (
                <Clock size={14} color={theme.colors.primary} />
              ) : (
                <Circle size={14} color={theme.colors.textSecondary} />
              )}
              <span
                style={{
                  flex: 1,
                  color:
                    todoToShow.status === 'completed'
                      ? theme.colors.textSecondary
                      : theme.colors.text,
                  fontSize: theme.fontSizes[2],
                  lineHeight: '1.5',
                }}
              >
                {todoToShow.content}
              </span>
              {todoToShow.status !== 'completed' && (
                <span
                  style={{
                    fontSize: theme.fontSizes[1],
                    color: theme.colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    backgroundColor:
                      todoToShow.status === 'in_progress'
                        ? theme.colors.primary + '20'
                        : theme.colors.textSecondary + '20',
                  }}
                >
                  {todoToShow.status}
                </span>
              )}
            </>
          ) : (
            <>
              <Sparkles size={14} color={sessionColor} />
              <span
                style={{
                  flex: 1,
                  color: theme.colors.text,
                  fontSize: theme.fontSizes[2],
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {cardData.latestEvent ? (
                  <>
                    <span style={{ color: sessionColor, fontWeight: 500 }}>
                      {cardData.latestEvent.toolName}
                    </span>
                    {cardData.latestEvent.fileName && (
                      <>
                        <span style={{ color: theme.colors.textSecondary }}>→</span>
                        <span
                          style={{
                            fontFamily: theme.fonts.monospace,
                            fontSize: theme.fontSizes[1],
                            color: theme.colors.textSecondary,
                          }}
                        >
                          {cardData.latestEvent.fileName}
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <span style={{ color: theme.colors.textSecondary, fontStyle: 'italic' }}>
                    No events yet
                  </span>
                )}
              </span>
              {cardData.latestEvent && (
                <span
                  style={{
                    fontSize: theme.fontSizes[1],
                    color: theme.colors.textSecondary,
                    padding: '2px 6px',
                    borderRadius: '3px',
                    backgroundColor: theme.colors.backgroundTertiary,
                  }}
                >
                  {new Date(cardData.latestEvent.timestamp).toLocaleTimeString()}
                </span>
              )}
            </>
          )}
        </div>

        {/* Expanded Todo List */}
        {isTaskExpanded && hasTodos && cardData.lastTodos && (
          <div style={{ marginTop: '12px' }}>
            <div
              style={{
                fontSize: theme.fontSizes[1],
                color: theme.colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px',
              }}
            >
              All Tasks ({cardData.lastTodos.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                ...cardData.lastTodos.filter((t) => t.status === 'in_progress'),
                ...cardData.lastTodos.filter((t) => t.status === 'pending'),
                ...cardData.lastTodos.filter((t) => t.status === 'completed'),
              ].map((todo, index) => (
                <div
                  key={todo.id || index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    backgroundColor: theme.colors.background,
                    borderRadius: '6px',
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  {todo.status === 'completed' ? (
                    <Check size={12} color={theme.colors.success} />
                  ) : todo.status === 'in_progress' ? (
                    <Clock size={12} color={theme.colors.primary} />
                  ) : (
                    <Circle size={12} color={theme.colors.textSecondary} />
                  )}
                  <span
                    style={{
                      flex: 1,
                      color:
                        todo.status === 'completed'
                          ? theme.colors.textSecondary
                          : theme.colors.text,
                      fontSize: theme.fontSizes[1],
                    }}
                  >
                    {todo.content}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats Section */}
      {((cardData.session.fileAccessCount ?? 0) > 0 ||
        (cardData.session.fileWriteCount ?? 0) > 0 ||
        (cardData.session.toolCallCount ?? 0) > 0) && (
        <div style={{ padding: '16px', backgroundColor: theme.colors.backgroundSecondary }}>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              padding: '8px 12px',
              backgroundColor: theme.colors.background,
              borderRadius: '6px',
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            {(cardData.session.fileAccessCount ?? 0) > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={12} color={sessionColor} />
                <span style={{ fontSize: theme.fontSizes[1] }}>
                  {cardData.session.fileAccessCount} file reads
                </span>
              </div>
            )}
            {(cardData.session.fileWriteCount ?? 0) > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Edit3 size={12} color={sessionColor} />
                <span style={{ fontSize: theme.fontSizes[1] }}>
                  {cardData.session.fileWriteCount} file writes
                </span>
              </div>
            )}
            {(cardData.session.toolCallCount ?? 0) > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={12} color={sessionColor} />
                <span style={{ fontSize: theme.fontSizes[1] }}>
                  {cardData.session.toolCallCount} tool calls
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '0',
          borderTop: `1px solid ${theme.colors.border}`,
        }}
      >
        {onOpenTerminal && (
          <button
            onClick={handleResume}
            disabled={isTerminalLoading}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              padding: '8px',
              cursor: isTerminalLoading ? 'wait' : 'pointer',
              color: theme.colors.textSecondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: theme.fontSizes[1],
              fontFamily: theme.fonts.body,
              borderRight: `1px solid ${theme.colors.border}`,
              transition: 'all 0.2s',
            }}
            title={isTerminalLoading ? 'Opening terminal...' : 'Resume session'}
          >
            {isTerminalLoading ? 'Opening...' : 'Resume'}
          </button>
        )}
        {onSessionDetailSelect && (
          <button
            onClick={onSessionDetailSelect}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              color: theme.colors.textSecondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: theme.fontSizes[1],
              fontFamily: theme.fonts.body,
              borderRight: `1px solid ${theme.colors.border}`,
              transition: 'all 0.2s',
            }}
            title="View details"
          >
            Details
          </button>
        )}
        {onDeleteSession && (
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this session?')) {
                onDeleteSession();
              }
            }}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              color: theme.colors.textSecondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontSize: theme.fontSizes[1],
              fontFamily: theme.fonts.body,
              transition: 'all 0.2s',
            }}
            title="Delete session"
          >
            <Trash2 size={14} />
            Delete
          </button>
        )}
      </div>
    </div>
  );
};
