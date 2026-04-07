import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertTriangle, Bell, CheckCircle2, MoonStar, Search, SunMedium, SunMoon } from 'lucide-react';
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/app/providers/ThemeProvider';
export const ThemeToggle = () => {
    const { mode, setMode } = useTheme();
    return (_jsx("div", { className: "theme-toggle", "aria-label": "Changer le theme", children: [
            { value: 'system', label: 'Systeme', icon: _jsx(SunMoon, { size: 16 }) },
            { value: 'light', label: 'Clair', icon: _jsx(SunMedium, { size: 16 }) },
            { value: 'dark', label: 'Sombre', icon: _jsx(MoonStar, { size: 16 }) },
        ].map((item) => (_jsxs("button", { className: mode === item.value ? 'active' : '', type: "button", onClick: () => setMode(item.value), children: [item.icon, _jsx("span", { children: item.label })] }, item.value))) }));
};
export const SearchBar = ({ value, onChange, placeholder = 'Rechercher…', }) => (_jsxs("label", { className: "search-bar", children: [_jsx(Search, { size: 16 }), _jsx("input", { value: value, onChange: (event) => onChange(event.target.value), placeholder: placeholder })] }));
export const FiltersPanel = ({ children }) => (_jsx("div", { className: "filters-panel", children: children }));
export const StatusBadge = ({ value }) => {
    const normalized = value.toLowerCase();
    const className = normalized.includes('active') ||
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
    return _jsx("span", { className: `status-badge ${className}`, children: value.replaceAll('_', ' ') });
};
export const MetricCard = ({ label, value, hint, }) => (_jsxs("article", { className: "metric-card", children: [_jsx("span", { children: label }), _jsx("strong", { children: value }), hint ? _jsx("small", { children: hint }) : null] }));
export const EmptyState = ({ title, message, }) => (_jsxs("div", { className: "empty-state", children: [_jsx(CheckCircle2, { size: 18 }), _jsxs("div", { children: [_jsx("strong", { children: title }), _jsx("p", { children: message })] })] }));
export const ErrorState = ({ message, onRetry, }) => (_jsxs("div", { className: "error-state", children: [_jsx(AlertTriangle, { size: 18 }), _jsxs("div", { children: [_jsx("strong", { children: "Erreur" }), _jsx("p", { children: message })] }), onRetry ? (_jsx("button", { type: "button", className: "secondary-button", onClick: onRetry, children: "Reessayer" })) : null] }));
export const DataTable = ({ columns, rows, emptyTitle = 'Aucune donnee', emptyMessage = 'Aucun element ne correspond aux filtres.', }) => {
    if (!rows.length) {
        return _jsx(EmptyState, { title: emptyTitle, message: emptyMessage });
    }
    return (_jsx("div", { className: "table-wrapper", children: _jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsx("tr", { children: columns.map((column) => (_jsx("th", { children: column.header }, column.header))) }) }), _jsx("tbody", { children: rows.map((row, index) => (_jsx("tr", { children: columns.map((column) => (_jsxs("td", { children: [_jsx("span", { className: "cell-label", children: column.header }), column.render(row)] }, column.header))) }, index))) })] }) }));
};
export const FormField = ({ label, hint, children, }) => (_jsxs("label", { className: "form-field", children: [_jsx("span", { children: label }), children, hint ? _jsx("small", { children: hint }) : null] }));
export const Panel = ({ title, actions, children, }) => (_jsxs("section", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h2", { children: title }), actions] }), children] }));
export const OrgChart = ({ nodes }) => {
    if (!nodes.length) {
        return _jsx(EmptyState, { title: "Aucun noeud", message: "L'organigramme est vide pour les filtres courants." });
    }
    return (_jsx("div", { className: "org-tree", children: nodes.map((node) => (_jsx(OrgTreeNode, { node: node }, String(node.id)))) }));
};
const OrgTreeNode = ({ node }) => {
    const children = node.children ?? [];
    return (_jsxs("div", { className: "org-node", children: [_jsxs("div", { className: "org-node-card", children: [_jsx("strong", { children: String(node.name) }), _jsx("span", { children: String(node.type) }), _jsxs("small", { children: [node.region ?? 'Sans region', " \u00B7 ", node.peopleCount ?? 0, " personnes"] })] }), children.length ? (_jsx("div", { className: "org-node-children", children: children.map((child) => (_jsx(OrgTreeNode, { node: child }, String(child.id)))) })) : null] }));
};
export const AuditTimeline = ({ items }) => (_jsx("div", { className: "timeline", children: items.length ? (items.map((item) => (_jsxs("article", { className: "timeline-item", children: [_jsx("div", { className: "timeline-dot" }), _jsxs("div", { children: [_jsx("strong", { children: String(item.action) }), _jsx("p", { children: String(item.entityType) }), _jsx("small", { children: new Date(String(item.createdAt)).toLocaleString('fr-FR') })] })] }, String(item.id))))) : (_jsx(EmptyState, { title: "Aucune action", message: "Aucun evenement d'audit disponible." })) }));
export const DocumentViewer = ({ title, content, }) => (_jsxs("article", { className: "document-viewer", children: [_jsx("h3", { children: title }), _jsx("div", { children: content.split('\n').map((line, index) => (_jsx(Fragment, { children: _jsx("p", { children: line }) }, `${title}-${index}`))) })] }));
export const SignaturePanel = ({ canSign, onSign, isBusy, }) => (_jsxs("div", { className: "signature-panel", children: [_jsxs("div", { children: [_jsx("strong", { children: "Signature interne" }), _jsx("p", { children: "Cette signature confirme la lecture et l'engagement interne. Elle ne constitue pas une signature electronique qualifiee." })] }), _jsx("button", { type: "button", className: "primary-button", disabled: !canSign || isBusy, onClick: onSign, children: isBusy ? 'Signature…' : 'Signer le document' })] }));
export const NotificationBell = ({ count }) => (_jsxs(Link, { className: "notification-bell", to: "/notifications", children: [_jsx(Bell, { size: 18 }), count ? _jsx("span", { children: count }) : null] }));
export const ConfirmDialog = ({ message, confirmLabel = 'Confirmer', onConfirm, }) => (_jsx("button", { type: "button", className: "secondary-button", onClick: () => {
        if (window.confirm(message)) {
            onConfirm();
        }
    }, children: confirmLabel }));
