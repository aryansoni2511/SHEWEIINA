import React from 'react';

/**
 * Clean SaaS Card components with consistent borders, radiuses, and elevation
 */
export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-2xl shadow-sm transition-all duration-200 ${
        hover ? 'hover:shadow-md hover:border-slate-300' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action = null,
  children,
  className = '',
  ...props
}) {
  return (
    <div
      className={`px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 ${className}`}
      {...props}
    >
      <div>
        {title && (
          <h3 className="text-base font-semibold text-slate-900 tracking-tight">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        )}
        {children}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={`px-6 py-4 bg-slate-50/50 border-t border-slate-100 rounded-b-2xl flex items-center justify-between gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
