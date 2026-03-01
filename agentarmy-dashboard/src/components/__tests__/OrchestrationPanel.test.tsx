import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrchestrationPanel } from './OrchestrationPanel';

describe('OrchestrationPanel', () => {
  const mockDecision = {
    nextTaskId: 't1',
    nextAgentId: 'executor',
    zpe: {
      total: 0.78,
      components: {
        usefulness: 0.175,
        coherence: 0.14,
        cost: 0.1275,
        latency: 0.0855,
        risk: 0.1275,
        alignment: 0.15,
      },
    },
    cpm: {
      project_duration: 5.0,
      critical_tasks: ['t1', 't2'],
    },
    rationale: 'Selected task for optimal routing',
    alternatives: [
      {
        task_id: 't1',
        agent_id: 'executor',
        score: 0.78,
        components: {},
        is_critical: true,
      },
    ],
  };

  test('renders with collapsed state initially', () => {
    render(<OrchestrationPanel />);
    const header = screen.getByText(/Brain \(Orchestration\)/i);
    expect(header).toBeInTheDocument();
  });

  test('expands when toggle button is clicked', async () => {
    render(<OrchestrationPanel />);
    const toggleBtn = screen.getByRole('button', { name: /▶/ });
    await userEvent.click(toggleBtn);
    
    const submitBtn = screen.getByRole('button', { name: /Submit/ });
    expect(submitBtn).toBeInTheDocument();
  });

  test('displays decision when provided', async () => {
    render(<OrchestrationPanel decision={mockDecision} />);
    
    // Click to expand
    const toggleBtn = screen.getByRole('button', { name: /▶/ });
    await userEvent.click(toggleBtn);

    // Check if decision elements are displayed
    expect(screen.getByText(/Next task/i)).toBeInTheDocument();
    expect(screen.getByText(/executor/i)).toBeInTheDocument();
    expect(screen.getByText(/0.780/i)).toBeInTheDocument();
  });

  test('displays CPM information', async () => {
    render(<OrchestrationPanel decision={mockDecision} />);
    
    const toggleBtn = screen.getByRole('button', { name: /▶/ });
    await userEvent.click(toggleBtn);

    expect(screen.getByText(/Critical Path Method/i)).toBeInTheDocument();
    expect(screen.getByText(/5.00 hours/i)).toBeInTheDocument();
    expect(screen.getByText(/2/)).toBeInTheDocument(); // critical task count
  });

  test('allows task submission', async () => {
    const mockSubmit = jest.fn();
    render(<OrchestrationPanel onSubmitTask={mockSubmit} />);

    const toggleBtn = screen.getByRole('button', { name: /▶/ });
    await userEvent.click(toggleBtn);

    const input = screen.getByPlaceholderText(/Enter task goal/i) as HTMLInputElement;
    const submitBtn = screen.getByRole('button', { name: /Submit/ });

    await userEvent.type(input, 'Test task');
    await userEvent.click(submitBtn);

    expect(mockSubmit).toHaveBeenCalledWith('Test task');
  });

  test('disables submit button when input is empty', async () => {
    render(<OrchestrationPanel />);

    const toggleBtn = screen.getByRole('button', { name: /▶/ });
    await userEvent.click(toggleBtn);

    const submitBtn = screen.getByRole('button', { name: /Submit/ }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });

  test('shows loading state', () => {
    render(<OrchestrationPanel isLoading={true} />);

    const toggleBtn = screen.getByRole('button', { name: /▶/ });
    fireEvent.click(toggleBtn);

    expect(screen.getByText(/Orchestrating tasks/i)).toBeInTheDocument();
  });

  test('displays completion message when no next task', async () => {
    const completionDecision = {
      ...mockDecision,
      nextTaskId: null,
      nextAgentId: null,
      rationale: 'All tasks completed.',
    };

    render(<OrchestrationPanel decision={completionDecision} />);

    const toggleBtn = screen.getByRole('button', { name: /▶/ });
    await userEvent.click(toggleBtn);

    expect(screen.getByText(/All tasks completed/i)).toBeInTheDocument();
  });

  test('displays ZPE score breakdown', async () => {
    render(<OrchestrationPanel decision={mockDecision} />);

    const toggleBtn = screen.getByRole('button', { name: /▶/ });
    await userEvent.click(toggleBtn);

    expect(screen.getByText(/usefulness/i)).toBeInTheDocument();
    expect(screen.getByText(/coherence/i)).toBeInTheDocument();
    expect(screen.getByText(/cost/i)).toBeInTheDocument();
    expect(screen.getByText(/latency/i)).toBeInTheDocument();
  });

  test('shows alternatives when toggle is clicked', async () => {
    render(<OrchestrationPanel decision={mockDecision} />);

    const toggleBtn = screen.getByRole('button', { name: /▶/ });
    await userEvent.click(toggleBtn);

    const altToggle = screen.getByRole('button', { name: /View.*Alternatives/i });
    await userEvent.click(altToggle);

    expect(screen.getByText(/executor/)).toBeInTheDocument();
    expect(screen.getByText(/★ Critical/)).toBeInTheDocument();
  });

  test('clears input after submission', async () => {
    const mockSubmit = jest.fn();
    render(<OrchestrationPanel onSubmitTask={mockSubmit} />);

    const toggleBtn = screen.getByRole('button', { name: /▶/ });
    await userEvent.click(toggleBtn);

    const input = screen.getByPlaceholderText(/Enter task goal/i) as HTMLInputElement;
    const submitBtn = screen.getByRole('button', { name: /Submit/ });

    await userEvent.type(input, 'Test task');
    await userEvent.click(submitBtn);

    expect(input.value).toBe('');
  });

  test('handles Enter key submission', async () => {
    const mockSubmit = jest.fn();
    render(<OrchestrationPanel onSubmitTask={mockSubmit} />);

    const toggleBtn = screen.getByRole('button', { name: /▶/ });
    await userEvent.click(toggleBtn);

    const input = screen.getByPlaceholderText(/Enter task goal/i);

    await userEvent.type(input, 'Test task{Enter}');

    expect(mockSubmit).toHaveBeenCalledWith('Test task');
  });
});
