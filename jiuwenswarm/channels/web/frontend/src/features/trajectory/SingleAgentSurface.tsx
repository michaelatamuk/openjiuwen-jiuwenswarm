/** Stable host boundary for the Agent and Team chat / trajectory / analysis surfaces. */

import type { ReactNode } from 'react';

export type ChatSurfaceView = 'chat' | 'trajectory' | 'analysis' | 'diagnosis';

export interface SingleAgentSurfaceProps {
  activeView: ChatSurfaceView;
  chat: ReactNode;
  chatLabel: string;
  mode: string;
  onViewChange: (view: ChatSurfaceView) => void;
  tabListLabel: string;
  trajectory: ReactNode;
  trajectoryEnabled: boolean;
  trajectoryLabel: string;
  trajectoryRequested: boolean;
  showNavigation?: boolean;
  /** Optional third surface: session analysis (kept mounted after first request). */
  analysis?: ReactNode;
  analysisEnabled?: boolean;
  analysisLabel?: string;
  analysisRequested?: boolean;
  /** The diagnosis view. It has no tab: the chat header opens it. */
  diagnosis?: ReactNode;
  diagnosisEnabled?: boolean;
  diagnosisRequested?: boolean;
}

/**
 * Keep the chat subtree mounted while gating the trajectory/analysis/diagnosis
 * subtrees until their first explicit request. Agent and Team modes share this
 * lifecycle boundary; other modes never expose or mount these surfaces.
 */
export function SingleAgentSurface({
  activeView,
  chat,
  chatLabel,
  mode,
  onViewChange,
  tabListLabel,
  trajectory,
  trajectoryEnabled,
  trajectoryLabel,
  trajectoryRequested,
  showNavigation = true,
  analysis,
  analysisEnabled = false,
  analysisLabel = 'Analysis',
  analysisRequested = false,
  diagnosis = null,
  diagnosisEnabled = false,
  diagnosisRequested = false,
}: SingleAgentSurfaceProps) {
  const agentOrTeam = mode === 'agent' || mode === 'team';
  const trajectoryOn = trajectoryEnabled && agentOrTeam;
  const analysisOn = analysisEnabled && agentOrTeam;
  const navigationVisible = (trajectoryOn || analysisOn) && showNavigation;
  // The diagnosis view is switched independently of the trajectory tab bar.
  const diagnosisVisible = diagnosisEnabled && agentOrTeam && showNavigation;

  const resolvedView: ChatSurfaceView = (() => {
    if (activeView === 'trajectory' && !(navigationVisible && trajectoryOn)) return 'chat';
    if (activeView === 'analysis' && !(navigationVisible && analysisOn)) return 'chat';
    if (activeView === 'diagnosis' && !diagnosisVisible) return 'chat';
    return activeView;
  })();

  return (
    <div
      className={`single-agent-surface single-agent-surface--${resolvedView} ${navigationVisible ? 'single-agent-surface--navigation' : ''}`}
      data-testid="single-agent-surface"
    >
      {navigationVisible && resolvedView !== 'diagnosis' ? (
        <div className="chat-surface-toolbar">
          <div
            className="chat-surface-tabs"
            role="tablist"
            aria-label={tabListLabel}
            data-testid="single-agent-surface-tabs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={resolvedView === 'chat'}
              className={`chat-surface-tabs__tab ${resolvedView === 'chat' ? 'is-active' : ''}`}
              onClick={() => onViewChange('chat')}
              data-testid="single-agent-chat-tab"
            >
              {chatLabel}
            </button>
            {trajectoryOn ? (
              <button
                type="button"
                role="tab"
                aria-selected={resolvedView === 'trajectory'}
                className={`chat-surface-tabs__tab ${resolvedView === 'trajectory' ? 'is-active' : ''}`}
                onClick={() => onViewChange('trajectory')}
                data-testid="single-agent-trajectory-tab"
              >
                {trajectoryLabel}
              </button>
            ) : null}
            {analysisOn ? (
              <button
                type="button"
                role="tab"
                aria-selected={resolvedView === 'analysis'}
                className={`chat-surface-tabs__tab ${resolvedView === 'analysis' ? 'is-active' : ''}`}
                onClick={() => onViewChange('analysis')}
                data-testid="single-agent-analysis-tab"
              >
                {analysisLabel}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      <div
        className={`chat-surface-view flex-1 min-h-0 ${resolvedView === 'chat' ? '' : 'chat-surface-view--hidden'}`}
        aria-hidden={resolvedView !== 'chat'}
        data-testid="single-agent-chat-view"
      >
        {chat}
      </div>
      {navigationVisible && trajectoryOn && trajectoryRequested ? (
        <div
          className={`chat-surface-view flex-1 min-h-0 ${resolvedView === 'trajectory' ? '' : 'chat-surface-view--hidden'}`}
          aria-hidden={resolvedView !== 'trajectory'}
          data-testid="single-agent-trajectory-view"
        >
          {trajectory}
        </div>
      ) : null}
      {navigationVisible && analysisOn && analysisRequested ? (
        <div
          className={`chat-surface-view flex-1 min-h-0 ${resolvedView === 'analysis' ? '' : 'chat-surface-view--hidden'}`}
          aria-hidden={resolvedView !== 'analysis'}
          data-testid="single-agent-analysis-view"
        >
          {analysis}
        </div>
      ) : null}
      {diagnosisVisible && diagnosisRequested ? (
        <div
          className={`chat-surface-view flex-1 min-h-0 ${resolvedView === 'diagnosis' ? '' : 'chat-surface-view--hidden'}`}
          aria-hidden={resolvedView !== 'diagnosis'}
          data-testid="single-agent-diagnosis-view"
        >
          {diagnosis}
        </div>
      ) : null}
    </div>
  );
}
