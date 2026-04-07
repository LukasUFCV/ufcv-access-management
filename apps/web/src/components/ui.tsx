import { AlertTriangle, Bell, CheckCircle2, MoonStar, Search, SunMedium, SunMoon } from 'lucide-react';
import { Fragment, type PropsWithChildren, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { useTheme } from '@/app/providers/ThemeProvider';

type Column<T> = {
  header: string;
  render: (item: T) => ReactNode;
};

export const ThemeToggle = () => {
  const { mode, setMode } = useTheme();

  return (
    <div className="theme-toggle" aria-label="Changer le theme">
      {[
        { value: 'system', label: 'Systeme', icon: <SunMoon size={16} /> },
        { value: 'light', label: 'Clair', icon: <SunMedium size={16} /> },
        { value: 'dark', label: 'Sombre', icon: <MoonStar size={16} /> },
      ].map((item) => (
        <button
          key={item.value}
          className={mode === item.value ? 'active' : ''}
          type="button"
          onClick={() => setMode(item.value as 'system' | 'light' | 'dark')}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export const SearchBar = ({
  value,
  onChange,
  placeholder = 'Rechercher…',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => (
  <label className="search-bar">
    <Search size={16} />
    <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
  </label>
);

export const FiltersPanel = ({ children }: PropsWithChildren) => (
  <div className="filters-panel">{children}</div>
);

export const StatusBadge = ({ value }: { value: string }) => {
  const normalized = value.toLowerCase();
  const className =
    normalized.includes('active') ||
    normalized.includes('signe') ||
    normalized.includes('done') ||
    normalized.includes('termine')
      ? 'success'
      : normalized.includes('warning') ||
          normalized.includes('expire') ||
          normalized.includes('transition') ||
          normalized.includes('en_cours') ||
          normalized.includes('a_signer')
        ? 'warning'
        : normalized.includes('revoke') || normalized.includes('sortie') || normalized.includes('bloque')
          ? 'danger'
          : 'neutral';

  return <span className={`status-badge ${className}`}>{value.replaceAll('_', ' ')}</span>;
};

export const MetricCard = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) => (
  <article className="metric-card">
    <span>{label}</span>
    <strong>{value}</strong>
    {hint ? <small>{hint}</small> : null}
  </article>
);

export const EmptyState = ({
  title,
  message,
}: {
  title: string;
  message: string;
}) => (
  <div className="empty-state">
    <CheckCircle2 size={18} />
    <div>
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  </div>
);

export const ErrorState = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) => (
  <div className="error-state">
    <AlertTriangle size={18} />
    <div>
      <strong>Erreur</strong>
      <p>{message}</p>
    </div>
    {onRetry ? (
      <button type="button" className="secondary-button" onClick={onRetry}>
        Reessayer
      </button>
    ) : null}
  </div>
);

export const DataTable = <T,>({
  columns,
  rows,
  emptyTitle = 'Aucune donnee',
  emptyMessage = 'Aucun element ne correspond aux filtres.',
}: {
  columns: Column<T>[];
  rows: T[];
  emptyTitle?: string;
  emptyMessage?: string;
}) => {
  if (!rows.length) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.header}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column.header}>
                  <span className="cell-label">{column.header}</span>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const FormField = ({
  label,
  hint,
  children,
}: PropsWithChildren<{ label: string; hint?: string }>) => (
  <label className="form-field">
    <span>{label}</span>
    {children}
    {hint ? <small>{hint}</small> : null}
  </label>
);

export const Panel = ({
  title,
  actions,
  children,
}: PropsWithChildren<{ title: string; actions?: ReactNode }>) => (
  <section className="panel">
    <div className="panel-header">
      <h2>{title}</h2>
      {actions}
    </div>
    {children}
  </section>
);

export const OrgChart = ({ nodes }: { nodes: Array<Record<string, unknown>> }) => {
  if (!nodes.length) {
    return <EmptyState title="Aucun noeud" message="L'organigramme est vide pour les filtres courants." />;
  }

  return (
    <div className="org-tree">
      {nodes.map((node) => (
        <OrgTreeNode key={String(node.id)} node={node} />
      ))}
    </div>
  );
};

const OrgTreeNode = ({ node }: { node: Record<string, unknown> }) => {
  const children = (node.children as Array<Record<string, unknown>> | undefined) ?? [];

  return (
    <div className="org-node">
      <div className="org-node-card">
        <strong>{String(node.name)}</strong>
        <span>{String(node.type)}</span>
        <small>
          {(node.region as string | null) ?? 'Sans region'} · {(node.peopleCount as number | null) ?? 0} personnes
        </small>
      </div>
      {children.length ? (
        <div className="org-node-children">
          {children.map((child) => (
            <OrgTreeNode key={String(child.id)} node={child} />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export const AuditTimeline = ({ items }: { items: Array<Record<string, unknown>> }) => (
  <div className="timeline">
    {items.length ? (
      items.map((item) => (
        <article className="timeline-item" key={String(item.id)}>
          <div className="timeline-dot" />
          <div>
            <strong>{String(item.action)}</strong>
            <p>{String(item.entityType)}</p>
            <small>{new Date(String(item.createdAt)).toLocaleString('fr-FR')}</small>
          </div>
        </article>
      ))
    ) : (
      <EmptyState title="Aucune action" message="Aucun evenement d'audit disponible." />
    )}
  </div>
);

export const DocumentViewer = ({
  title,
  content,
}: {
  title: string;
  content: string;
}) => (
  <article className="document-viewer">
    <h3>{title}</h3>
    <div>
      {content.split('\n').map((line, index) => (
        <Fragment key={`${title}-${index}`}>
          <p>{line}</p>
        </Fragment>
      ))}
    </div>
  </article>
);

export const SignaturePanel = ({
  canSign,
  onSign,
  isBusy,
}: {
  canSign: boolean;
  onSign: () => void;
  isBusy?: boolean;
}) => (
  <div className="signature-panel">
    <div>
      <strong>Signature interne</strong>
      <p>
        Cette signature confirme la lecture et l'engagement interne. Elle ne constitue pas une
        signature electronique qualifiee.
      </p>
    </div>
    <button type="button" className="primary-button" disabled={!canSign || isBusy} onClick={onSign}>
      {isBusy ? 'Signature…' : 'Signer le document'}
    </button>
  </div>
);

export const NotificationBell = ({ count }: { count: number }) => (
  <Link className="notification-bell" to="/notifications">
    <Bell size={18} />
    {count ? <span>{count}</span> : null}
  </Link>
);

export const ConfirmDialog = ({
  message,
  confirmLabel = 'Confirmer',
  onConfirm,
}: {
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
}) => (
  <button
    type="button"
    className="secondary-button"
    onClick={() => {
      if (window.confirm(message)) {
        onConfirm();
      }
    }}
  >
    {confirmLabel}
  </button>
);
