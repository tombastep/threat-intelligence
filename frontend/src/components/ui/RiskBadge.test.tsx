import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RiskBadge } from './RiskBadge'

describe('RiskBadge', () => {
  it('renders "LOW RISK" with green styling for low risk', () => {
    render(<RiskBadge riskLevel="low" />)

    const badge = screen.getByText('LOW', { exact: false })
    expect(badge).toBeInTheDocument()
    expect(badge.closest('span')).toHaveClass('text-green-800', 'bg-green-100')
  })

  it('renders "MEDIUM RISK" with yellow styling for medium risk', () => {
    render(<RiskBadge riskLevel="medium" />)

    const badge = screen.getByText('MEDIUM', { exact: false })
    expect(badge).toBeInTheDocument()
    expect(badge.closest('span')).toHaveClass('text-yellow-800', 'bg-yellow-100')
  })

  it('renders "HIGH RISK" with red styling and pulsing animation for high risk', () => {
    render(<RiskBadge riskLevel="high" />)

    const badge = screen.getByText('HIGH', { exact: false })
    expect(badge).toBeInTheDocument()
    expect(badge.closest('span')).toHaveClass('text-red-800', 'bg-red-100', 'animate-pulse')
  })

  it('does not have pulsing animation for low and medium risk', () => {
    const { rerender, container } = render(<RiskBadge riskLevel="low" />)
    const lowBadge = container.querySelector('span')
    expect(lowBadge).not.toHaveClass('animate-pulse')

    rerender(<RiskBadge riskLevel="medium" />)
    const mediumBadge = container.querySelector('span')
    expect(mediumBadge).not.toHaveClass('animate-pulse')
  })

  it('displays colored indicator dot for each risk level', () => {
    const { container, rerender } = render(<RiskBadge riskLevel="low" />)

    // Check that dot exists - it's the inner span with w-2 h-2 classes
    const dot = container.querySelector('span span.rounded-full')
    expect(dot).toBeInTheDocument()
    expect(dot).toHaveClass('bg-green-600')

    // Medium risk
    rerender(<RiskBadge riskLevel="medium" />)
    const mediumDot = container.querySelector('span span.rounded-full')
    expect(mediumDot).toHaveClass('bg-yellow-600')

    // High risk
    rerender(<RiskBadge riskLevel="high" />)
    const highDot = container.querySelector('span span.rounded-full')
    expect(highDot).toHaveClass('bg-red-600')
  })
})
