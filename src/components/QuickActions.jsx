import React from 'react';
import { 
  ScanSearch, 
  BookOpen, 
  Flag, 
  FileText, 
  ListChecks, 
  Calendar, 
  DollarSign,
  Lightbulb,
  Scale,
  ShieldCheck,
  Briefcase,
  ListTodo
} from 'lucide-react';
import { 
  DEEP_EXTRACT_PROMPT, 
  PLAIN_ENGLISH_PROMPT, 
  RED_FLAGS_PROMPT,
  SCENARIO_PROMPT,
  COMPARE_PROMPT,
  VERIFICATION_PROMPT,
  CHECKLIST_PROMPT,
  BRIEFING_PROMPT
} from '../lib/prompts';

export default function QuickActions({ onRunAction, hasDocument, hasTwoDocuments }) {
  const actions = [
    {
      id: 'qa-plain-english',
      icon: <BookOpen size={14} style={{ marginRight: '6px', color: 'var(--text-secondary)' }} />,
      label: 'Document Summary',
      title: 'Translate this document into simple, understandable terms',
      prompt: PLAIN_ENGLISH_PROMPT,
    },
    {
      id: 'qa-red-flags',
      icon: <Flag size={14} style={{ marginRight: '6px', color: 'var(--danger)' }} />,
      label: 'Red Flags',
      title: 'Identify clauses that need your careful review',
      prompt: RED_FLAGS_PROMPT,
    },
    {
      id: 'qa-checklist',
      icon: <ListTodo size={14} style={{ marginRight: '6px', color: 'var(--green)' }} />,
      label: 'Checklist',
      title: 'Generate a checklist of what to verify or clarify',
      prompt: CHECKLIST_PROMPT,
      badge: 'NEW',
    },
    {
      id: 'qa-briefing',
      icon: <Briefcase size={14} style={{ marginRight: '6px', color: 'var(--navy)' }} />,
      label: 'Lawyer Briefing',
      title: 'Prepare a brief for a legal consultation',
      prompt: BRIEFING_PROMPT,
      badge: 'NEW',
    },
    {
      id: 'qa-compare',
      icon: <Scale size={14} style={{ marginRight: '6px', color: 'var(--accent)' }} />,
      label: 'Compare',
      title: 'Compare Document A against Document B',
      prompt: COMPARE_PROMPT,
      requiresTwo: true
    },
    {
      id: 'qa-verify',
      icon: <ShieldCheck size={14} style={{ marginRight: '6px', color: 'var(--navy-light)' }} />,
      label: 'Verify Output',
      title: 'Verify a generated response against the document',
      prompt: VERIFICATION_PROMPT,
    },
    {
      id: 'qa-scenario',
      icon: <Lightbulb size={14} style={{ marginRight: '6px', color: 'var(--warning)' }} />,
      label: 'Test Scenario',
      title: 'Test a hypothetical situation against this document',
      prompt: SCENARIO_PROMPT,
    },
  ];

  return (
    <div className="quick-actions-bar" id="quick-actions-bar" role="toolbar" aria-label="Quick actions">
      {actions.map((action) => (
        <button
          key={action.id}
          id={action.id}
          className="qa-chip"
          title={action.title}
          onClick={() => onRunAction(action.label, action.prompt)}
          disabled={action.requiresTwo ? !hasTwoDocuments : !hasDocument}
        >
          {action.icon}
          {action.label}
          {action.badge && <span className="qa-badge">{action.badge}</span>}
        </button>
      ))}
    </div>
  );
}
