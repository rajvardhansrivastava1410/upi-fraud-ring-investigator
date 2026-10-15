import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AlertQueuePane } from './features/queue/AlertQueuePane'
import { EvaluationTab } from './features/evaluation/EvaluationTab'
import RootPage from '../app/page'

function renderWithClient(ui: React.ReactElement) {
  const testClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return render(<QueryClientProvider client={testClient}>{ui}</QueryClientProvider>)
}

describe('TRACE Next.js Three-Pane Workbench Tests', () => {
  it('renders ranked queue with review priority badges', async () => {
    renderWithClient(<AlertQueuePane />)

    expect(screen.getByText('Ranked Queue')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/alert_syn_high_01/)).toBeInTheDocument()
    })

    // Check review priority amber styling & VPA
    expect(screen.getAllByText(/Review Priority:/i).length).toBeGreaterThan(0)
    expect(screen.getByText('syn_layered_agg@synthetic-axis')).toBeInTheDocument()
  })

  it('renders evaluation screen with P@K and benchmark comparison cards', async () => {
    renderWithClient(<EvaluationTab />)

    await waitFor(() => {
      expect(screen.getByText('eval_run_2026_syn_042')).toBeInTheDocument()
    })

    expect(screen.getByText(/RingLens Weighted Graph/i)).toBeInTheDocument()
    expect(screen.getByText(/Unweighted Graph Baseline/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Benign Shared-Device False-Positive Mitigation Table/i)
    ).toBeInTheDocument()
  })

  it('navigates between workbench and evaluation screen', async () => {
    render(<RootPage />)

    expect(screen.getByText('TRACE')).toBeInTheDocument()

    // Click Evaluation
    const evalBtn = screen.getByRole('button', { name: /synthetic model benchmark/i })
    fireEvent.click(evalBtn)

    await waitFor(() => {
      expect(screen.getByText(/Detection Quality & Evaluation Benchmarks/i)).toBeInTheDocument()
    })
  })
})
