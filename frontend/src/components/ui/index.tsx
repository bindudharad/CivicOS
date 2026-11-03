import { ReactNode } from 'react'
import clsx from 'clsx'

// ─── Button ──────────────────────────────────────────────────────────────────
interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
  loading?: boolean
}

export function Button({
  children, variant = 'primary', size = 'md',
  onClick, type = 'button', disabled, className, loading
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-bg-main disabled:opacity-50 disabled:cursor-not-allowed no-select'
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  const variants = {
    primary: 'bg-accent-cyan text-bg-main hover:bg-accent-deep-cyan focus:ring-accent-cyan shadow-lg hover:shadow-accent-cyan/30',
    secondary: 'bg-surface-interactive text-text-primary hover:bg-surface-elevated border border-border-standard focus:ring-accent-cyan',
    danger: 'bg-status-critical/10 text-status-critical hover:bg-status-critical hover:text-white border border-status-critical/50 focus:ring-status-critical',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface-interactive focus:ring-accent-cyan',
    icon: 'p-2 text-text-muted hover:text-text-primary hover:bg-surface-interactive rounded-lg focus:ring-accent-cyan',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(base, sizes[size], variants[variant], className)}
    >
      {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : null}
      {children}
    </button>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  glow?: 'cyan' | 'blue' | 'none'
  onClick?: () => void
}

export function Card({ children, className, hover, glow = 'none', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-xl border bg-surface-card p-5',
        'border-border-subtle',
        hover && 'card-hover cursor-pointer',
        glow === 'cyan' && 'glow-cyan',
        glow === 'blue' && 'glow-blue',
        className
      )}
    >
      {children}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps {
  children: ReactNode
  variant?: 'cyan' | 'blue' | 'critical' | 'high' | 'medium' | 'low' | 'neutral' | 'purple'
  size?: 'sm' | 'md'
  dot?: boolean
}

export function Badge({ children, variant = 'neutral', size = 'sm', dot }: BadgeProps) {
  const variants = {
    cyan: 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30',
    blue: 'bg-accent-blue/15 text-accent-blue border-accent-blue/30',
    critical: 'bg-status-critical/15 text-status-critical border-status-critical/30',
    high: 'bg-status-high/15 text-status-high border-status-high/30',
    medium: 'bg-status-medium/15 text-status-medium border-status-medium/30',
    low: 'bg-status-low/15 text-status-low border-status-low/30',
    neutral: 'bg-surface-elevated text-text-secondary border-border-standard',
    purple: 'bg-accent-purple/15 text-accent-purple border-accent-purple/30',
  }
  const sizes = { sm: 'px-2 py-0.5 text-xs', md: 'px-3 py-1 text-sm' }
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full border font-medium', variants[variant], sizes[size])}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', {
        'bg-accent-cyan': variant === 'cyan',
        'bg-accent-blue': variant === 'blue',
        'bg-status-critical': variant === 'critical',
        'bg-status-high': variant === 'high',
        'bg-status-medium': variant === 'medium',
        'bg-status-low': variant === 'low',
        'bg-text-muted': variant === 'neutral',
        'bg-accent-purple': variant === 'purple',
      })} />}
      {children}
    </span>
  )
}

// ─── SeverityBadge ────────────────────────────────────────────────────────────
export function SeverityBadge({ severity }: { severity: number }) {
  if (severity >= 8) return <Badge variant="critical" dot>Critical ({severity})</Badge>
  if (severity >= 6) return <Badge variant="high" dot>High ({severity})</Badge>
  if (severity >= 4) return <Badge variant="medium" dot>Medium ({severity})</Badge>
  return <Badge variant="low" dot>Low ({severity})</Badge>
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  trend?: { value: number; label: string }
  color?: 'cyan' | 'blue' | 'critical' | 'high' | 'medium' | 'low' | 'purple' | 'neutral'
  loading?: boolean
}

export function KPICard({ title, value, subtitle, icon, trend, color = 'cyan', loading }: KPICardProps) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    cyan: { bg: 'bg-accent-cyan/10', text: 'text-accent-cyan', border: 'border-accent-cyan/20' },
    blue: { bg: 'bg-accent-blue/10', text: 'text-accent-blue', border: 'border-accent-blue/20' },
    critical: { bg: 'bg-status-critical/10', text: 'text-status-critical', border: 'border-status-critical/20' },
    high: { bg: 'bg-status-high/10', text: 'text-status-high', border: 'border-status-high/20' },
    medium: { bg: 'bg-status-medium/10', text: 'text-status-medium', border: 'border-status-medium/20' },
    low: { bg: 'bg-status-low/10', text: 'text-status-low', border: 'border-status-low/20' },
    purple: { bg: 'bg-accent-purple/10', text: 'text-accent-purple', border: 'border-accent-purple/20' },
    neutral: { bg: 'bg-surface-elevated', text: 'text-text-secondary', border: 'border-border-standard' },
  }
  const c = colorMap[color] || colorMap.cyan
  return (
    <div className={clsx('rounded-xl border p-5 bg-surface-card transition-all duration-200 hover:border-border-standard', c.border)}>
      <div className="flex items-start justify-between mb-4">
        <div className={clsx('p-2.5 rounded-lg', c.bg)}>
          <span className={clsx('w-5 h-5', c.text)}>{icon}</span>
        </div>
        {trend && (
          <span className={clsx('text-xs font-medium px-2 py-1 rounded-full', 
            trend.value >= 0 ? 'text-status-low bg-status-low/10' : 'text-status-critical bg-status-critical/10'
          )}>
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </span>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-7 w-24 shimmer rounded" />
          <div className="h-4 w-32 shimmer rounded" />
        </div>
      ) : (
        <>
          <div className={clsx('text-2xl font-bold', c.text)}>{value}</div>
          <div className="text-sm text-text-secondary mt-1">{title}</div>
          {subtitle && <div className="text-xs text-text-muted mt-0.5">{subtitle}</div>}
        </>
      )}
    </div>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps {
  label?: string
  value: string | number
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  className?: string
  min?: number
  max?: number
  step?: number
}

export function Input({ label, value, onChange, type = 'text', placeholder, required, className, min, max, step }: InputProps) {
  return (
    <div className={clsx('space-y-1', className)}>
      {label && <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        min={min} max={max} step={step}
        className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted input-focus"
      />
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps {
  label?: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  className?: string
}

export function Select({ label, value, onChange, options, className }: SelectProps) {
  return (
    <div className={clsx('space-y-1', className)}>
      {label && <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">{label}</label>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-surface-elevated border border-border-standard rounded-lg px-3 py-2 text-sm text-text-primary input-focus appearance-none cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ─── Loading State ────────────────────────────────────────────────────────────
export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
      <p className="text-text-muted text-sm">{message}</p>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ title, message, icon }: { title: string; message?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      {icon && <div className="text-text-muted text-4xl mb-2">{icon}</div>}
      <h3 className="text-text-secondary font-medium">{title}</h3>
      {message && <p className="text-text-muted text-sm max-w-sm">{message}</p>}
    </div>
  )
}

// ─── Error State ──────────────────────────────────────────────────────────────
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <div className="w-12 h-12 rounded-full bg-status-critical/10 flex items-center justify-center text-status-critical text-xl">⚠</div>
      <p className="text-text-secondary text-sm max-w-sm">{message}</p>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Retry</Button>}
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
        {subtitle && <p className="text-sm text-text-muted mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
