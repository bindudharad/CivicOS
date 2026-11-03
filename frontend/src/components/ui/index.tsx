import React from 'react'

// ─── Button ──────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'cyan' | 'purple' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-midnight disabled:opacity-50 disabled:cursor-not-allowed select-none'

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  }

  const variants = {
    primary: 'bg-accent-blue hover:bg-blue-600 text-white shadow-glow-blue focus:ring-accent-blue active:scale-[0.98]',
    cyan: 'bg-accent-cyan hover:bg-cyan-400 text-bg-midnight font-semibold shadow-glow-cyan focus:ring-accent-cyan active:scale-[0.98]',
    purple: 'bg-accent-violet hover:bg-violet-600 text-white shadow-glow-violet focus:ring-accent-violet active:scale-[0.98]',
    secondary: 'bg-surface-elevated hover:bg-surface-hover text-text-primary border border-border-standard focus:ring-accent-blue',
    outline: 'bg-transparent hover:bg-surface-elevated text-text-primary border border-border-standard hover:border-accent-cyan/40 focus:ring-accent-cyan',
    ghost: 'hover:bg-surface-elevated text-text-secondary hover:text-text-primary focus:ring-accent-cyan',
    danger: 'bg-severity-critical/20 hover:bg-severity-critical/30 text-severity-critical border border-severity-critical/40 focus:ring-severity-critical',
  }

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      {children}
    </button>
  )
}

// ─── Card ────────────────────────────────────────────────────────────────────
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  glow?: 'cyan' | 'blue' | 'violet' | 'critical' | 'none'
  interactive?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className = '', glow = 'none', interactive = false, padding = 'md', ...props }: CardProps) {
  const glowMap = {
    cyan: 'border-accent-cyan/40 shadow-glow-cyan',
    blue: 'border-accent-blue/40 shadow-glow-blue',
    violet: 'border-accent-violet/40 shadow-glow-violet',
    critical: 'border-severity-critical/40 shadow-glow-critical',
    none: 'border-border-standard',
  }

  const padMap = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  }

  return (
    <div
      className={`rounded-2xl bg-bg-card/90 backdrop-blur-md border ${glowMap[glow]} ${padMap[padding]} shadow-card-elevated ${
        interactive ? 'glass-panel-hover cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

// ─── Badge ───────────────────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode
  variant?: 'cyan' | 'blue' | 'purple' | 'critical' | 'high' | 'medium' | 'low' | 'neutral'
  size?: 'sm' | 'md'
  dot?: boolean
  className?: string
}

export function Badge({ children, variant = 'neutral', size = 'sm', dot = false, className = '' }: BadgeProps) {
  const variants = {
    cyan: 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30',
    blue: 'bg-accent-blue/15 text-accent-blue border-accent-blue/30',
    purple: 'bg-accent-violet/15 text-accent-violet border-accent-violet/30',
    critical: 'bg-severity-critical/15 text-severity-critical border-severity-critical/30',
    high: 'bg-severity-high/15 text-severity-high border-severity-high/30',
    medium: 'bg-severity-medium/15 text-severity-medium border-severity-medium/30',
    low: 'bg-severity-low/15 text-severity-low border-severity-low/30',
    neutral: 'bg-surface-elevated text-text-secondary border-border-subtle',
  }

  const dotColors = {
    cyan: 'bg-accent-cyan',
    blue: 'bg-accent-blue',
    purple: 'bg-accent-violet',
    critical: 'bg-severity-critical',
    high: 'bg-severity-high',
    medium: 'bg-severity-medium',
    low: 'bg-severity-low',
    neutral: 'bg-text-muted',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-full ${
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      } ${variants[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  )
}

// ─── Severity Badge (Distinguishes Missing/Unassessed from Low) ───────────────
interface SeverityBadgeProps {
  severity: number | null | undefined
  className?: string
}

export function SeverityBadge({ severity, className = '' }: SeverityBadgeProps) {
  if (severity === null || severity === undefined || isNaN(severity)) {
    return (
      <Badge variant="neutral" dot className={className}>
        Unassessed
      </Badge>
    )
  }

  const score = Number(severity)
  if (score >= 8.0) {
    return <Badge variant="critical" dot className={className}>Critical ({score.toFixed(1)})</Badge>
  }
  if (score >= 6.0) {
    return <Badge variant="high" dot className={className}>High ({score.toFixed(1)})</Badge>
  }
  if (score >= 4.0) {
    return <Badge variant="medium" dot className={className}>Medium ({score.toFixed(1)})</Badge>
  }
  return <Badge variant="low" dot className={className}>Low ({score.toFixed(1)})</Badge>
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: React.ReactNode
  color?: 'cyan' | 'blue' | 'purple' | 'critical' | 'high' | 'low'
  className?: string
}

export function KPICard({
  title,
  value,
  subtitle,
  change,
  changeType = 'neutral',
  icon,
  color = 'cyan',
  className = '',
}: KPICardProps) {
  const accentGlow = {
    cyan: 'text-accent-cyan border-accent-cyan/20 bg-accent-cyan/5',
    blue: 'text-accent-blue border-accent-blue/20 bg-accent-blue/5',
    purple: 'text-accent-violet border-accent-violet/20 bg-accent-violet/5',
    critical: 'text-severity-critical border-severity-critical/20 bg-severity-critical/5',
    high: 'text-severity-high border-severity-high/20 bg-severity-high/5',
    low: 'text-severity-low border-severity-low/20 bg-severity-low/5',
  }

  return (
    <Card className={`relative overflow-hidden group hover:border-accent-${color}/40 transition-all duration-300 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">{title}</p>
          <p className="text-2xl lg:text-3xl font-extrabold text-text-primary tracking-tight font-mono">{value}</p>
          {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
          {change && (
            <p
              className={`text-xs mt-1.5 font-medium flex items-center gap-1 ${
                changeType === 'positive'
                  ? 'text-severity-low'
                  : changeType === 'negative'
                  ? 'text-severity-critical'
                  : 'text-text-muted'
              }`}
            >
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-xl border ${accentGlow[color]} flex items-center justify-center text-xl`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Input ───────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className = '', id, ...props }: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full bg-surface-elevated border ${
          error ? 'border-severity-critical focus:ring-severity-critical' : 'border-border-standard'
        } rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-dim input-focus ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-severity-critical flex items-center gap-1">⚠ {error}</p>}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  )
}

// ─── Select ──────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  children: React.ReactNode
}

export function Select({ label, error, children, className = '', id, ...props }: SelectProps) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full bg-surface-elevated border ${
          error ? 'border-severity-critical' : 'border-border-standard'
        } rounded-xl px-3.5 py-2.5 text-sm text-text-primary input-focus ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-severity-critical flex items-center gap-1">⚠ {error}</p>}
    </div>
  )
}

// ─── Loading / Error / Empty States ──────────────────────────────────────────
export function LoadingState({ message = 'Loading intelligence...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="relative">
        <div className="w-10 h-10 border-2 border-accent-cyan/20 border-t-accent-cyan rounded-full animate-spin" />
        <div className="absolute inset-0 w-10 h-10 border-2 border-accent-blue/30 border-b-accent-blue rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>
      <p className="text-sm font-medium text-text-muted tracking-wide animate-pulse">{message}</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
      <div className="w-12 h-12 rounded-2xl bg-severity-critical/10 border border-severity-critical/20 flex items-center justify-center text-severity-critical text-xl font-bold">
        !
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">Operational Error</p>
        <p className="text-xs text-text-secondary mt-1 max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  )
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border-standard flex items-center justify-center text-text-muted text-xl">
        ⬚
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="text-xs text-text-secondary mt-1 max-w-xs">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

// ─── Section Header ──────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  badge?: string
}

export function SectionHeader({ title, subtitle, action, badge }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg lg:text-xl font-bold text-text-primary tracking-tight">{title}</h2>
          {badge && <Badge variant="cyan">{badge}</Badge>}
        </div>
        {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
