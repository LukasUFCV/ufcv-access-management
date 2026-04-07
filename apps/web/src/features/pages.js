import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { AuditTimeline, DataTable, DocumentViewer, EmptyState, ErrorState, FiltersPanel, FormField, MetricCard, OrgChart, Panel, SearchBar, SignaturePanel, StatusBadge, } from '@/components/ui';
import { api, getErrorMessage } from '@/lib/api';
import { getBooleanLabel, getDisplayLabel } from '@/lib/labels';
const useRemote = (loader, deps, initialData) => {
    const [state, setState] = useState({
        data: initialData,
        loading: true,
        error: '',
    });
    const load = useCallback(async () => {
        setState((current) => ({ ...current, loading: true, error: '' }));
        try {
            const data = await loader();
            setState({ data, loading: false, error: '' });
        }
        catch (error) {
            setState((current) => ({
                ...current,
                loading: false,
                error: getErrorMessage(error),
            }));
        }
    }, deps);
    useEffect(() => {
        void load();
    }, [load]);
    return { ...state, reload: load };
};
const PageIntro = ({ title, description }) => (_jsx("div", { className: "page-intro", children: _jsxs("div", { children: [_jsx("h1", { children: title }), _jsx("p", { children: description })] }) }));
export const LoginPage = () => {
    const navigate = useNavigate();
    const { login, user } = useAuth();
    const [form, setForm] = useState({ login: 'superadmin', password: 'demo1234' });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [navigate, user]);
    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            await login(form.login, form.password);
            navigate('/');
        }
        catch (submitError) {
            setError(getErrorMessage(submitError));
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsx("div", { className: "login-page", children: _jsxs("main", { className: "login-card", children: [_jsxs("div", { className: "login-brand", children: [_jsx("span", { className: "brand-mark" }), _jsxs("div", { children: [_jsx("h1", { children: "Habilitations UFCV" }), _jsx("p", { children: "Gestion des droits, des acc\u00E8s, des documents et des parcours de cycle de vie." })] })] }), _jsxs("form", { className: "stack-form", onSubmit: handleSubmit, children: [_jsx(FormField, { label: "Identifiant", children: _jsx("input", { value: form.login, onChange: (event) => setForm((current) => ({ ...current, login: event.target.value })) }) }), _jsx(FormField, { label: "Mot de passe", children: _jsx("input", { type: "password", value: form.password, onChange: (event) => setForm((current) => ({ ...current, password: event.target.value })) }) }), error ? _jsx(ErrorState, { message: error }) : null, _jsx("button", { type: "submit", className: "primary-button", disabled: isSubmitting, children: isSubmitting ? 'Connexion…' : 'Se connecter' })] }), _jsxs("div", { className: "demo-accounts", children: [_jsx("strong", { children: "Comptes de d\u00E9monstration" }), _jsx("p", { children: "`superadmin`, `rh_admin`, `dpmo_admin`, `manager_demo`, `user_demo`" })] })] }) }));
};
export const DashboardPage = () => {
    const summary = useRemote(async () => (await api.get('/dashboard/summary')).data, [], {
        activePeople: 0,
        onboardingsInProgress: 0,
        offboardingsInProgress: 0,
        documentsPendingSignature: 0,
        expiringAccesses: 0,
        materialPendingReturn: 0,
    });
    if (summary.loading) {
        return _jsx(PageIntro, { title: "Tableau de bord", description: "Chargement des indicateurs\u2026" });
    }
    return (_jsxs("div", { className: "page-stack", children: [_jsx(PageIntro, { title: "Tableau de bord", description: "Vue synth\u00E9tique de l\u2019activit\u00E9 RH, des acc\u00E8s et des obligations internes." }), summary.error ? _jsx(ErrorState, { message: summary.error, onRetry: () => void summary.reload() }) : null, _jsxs("div", { className: "metrics-grid", children: [_jsx(MetricCard, { label: "Personnes actives", value: summary.data.activePeople ?? 0 }), _jsx(MetricCard, { label: "Arriv\u00E9es en cours", value: summary.data.onboardingsInProgress ?? 0 }), _jsx(MetricCard, { label: "D\u00E9parts en cours", value: summary.data.offboardingsInProgress ?? 0 }), _jsx(MetricCard, { label: "Documents \u00E0 signer", value: summary.data.documentsPendingSignature ?? 0 }), _jsx(MetricCard, { label: "Acc\u00E8s expirant bient\u00F4t", value: summary.data.expiringAccesses ?? 0 }), _jsx(MetricCard, { label: "Mat\u00E9riel \u00E0 restituer", value: summary.data.materialPendingReturn ?? 0 })] })] }));
};
export const PeoplePage = () => {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        sessionIdentifier: '',
        emailProfessional: '',
        actorTypeId: '',
        status: 'PREPARATION',
    });
    const people = useRemote(async () => (await api.get('/people', {
        params: {
            search: search || undefined,
            status: status || undefined,
            page: 1,
            pageSize: 20,
        },
    })).data, [search, status], { items: [], total: 0 });
    const actorTypes = useRemote(async () => (await api.get('/actor-types')).data, [], []);
    const createPerson = async (event) => {
        event.preventDefault();
        await api.post('/people', form);
        setForm({
            firstName: '',
            lastName: '',
            sessionIdentifier: '',
            emailProfessional: '',
            actorTypeId: '',
            status: 'PREPARATION',
        });
        await people.reload();
    };
    return (_jsxs("div", { className: "page-stack", children: [_jsx(PageIntro, { title: "Annuaire", description: "Recherche, consultation et cr\u00E9ation des dossiers des personnes." }), _jsx(Panel, { title: "Filtres", children: _jsxs(FiltersPanel, { children: [_jsx(SearchBar, { value: search, onChange: setSearch, placeholder: "Nom, e-mail ou identifiant\u2026" }), _jsxs("select", { value: status, onChange: (event) => setStatus(event.target.value), children: [_jsx("option", { value: "", children: "Tous les statuts" }), _jsx("option", { value: "PREPARATION", children: "Pr\u00E9paration" }), _jsx("option", { value: "ACTIVE", children: "Actif" }), _jsx("option", { value: "TRANSITION", children: "Transition" }), _jsx("option", { value: "SORTIE", children: "Sortie" }), _jsx("option", { value: "ARCHIVEE", children: "Archiv\u00E9" })] })] }) }), _jsxs(Panel, { title: `Personnes (${people.data.total})`, children: [people.error ? _jsx(ErrorState, { message: people.error, onRetry: () => void people.reload() }) : null, _jsx(DataTable, { rows: people.data.items, columns: [
                            {
                                header: 'Personne',
                                render: (item) => (_jsxs("div", { className: "stack-inline", children: [_jsxs(Link, { to: `/people/${item.id}`, children: [item.firstName, " ", item.lastName] }), _jsx("small", { children: item.emailProfessional ?? '' })] })),
                            },
                            { header: 'Type', render: (item) => _jsx(StatusBadge, { value: String(item.actorType ?? '') }) },
                            { header: 'Statut', render: (item) => _jsx(StatusBadge, { value: String(item.status ?? '') }) },
                            { header: 'Poste', render: (item) => item.position ?? '' },
                            { header: 'Région', render: (item) => item.region ?? '' },
                        ] })] }), _jsx(Panel, { title: "Cr\u00E9er une personne", children: _jsxs("form", { className: "stack-form compact-grid", onSubmit: (event) => void createPerson(event), children: [_jsx(FormField, { label: "Pr\u00E9nom", children: _jsx("input", { value: form.firstName, onChange: (event) => setForm((current) => ({ ...current, firstName: event.target.value })) }) }), _jsx(FormField, { label: "Nom", children: _jsx("input", { value: form.lastName, onChange: (event) => setForm((current) => ({ ...current, lastName: event.target.value })) }) }), _jsx(FormField, { label: "Identifiant", children: _jsx("input", { value: form.sessionIdentifier, onChange: (event) => setForm((current) => ({ ...current, sessionIdentifier: event.target.value })) }) }), _jsx(FormField, { label: "E-mail professionnel", children: _jsx("input", { value: form.emailProfessional, onChange: (event) => setForm((current) => ({ ...current, emailProfessional: event.target.value })) }) }), _jsx(FormField, { label: "Type d\u2019acteur", children: _jsxs("select", { value: form.actorTypeId, onChange: (event) => setForm((current) => ({ ...current, actorTypeId: event.target.value })), children: [_jsx("option", { value: "", children: "S\u00E9lectionner" }), actorTypes.data.map((item) => (_jsx("option", { value: item.id, children: item.label }, item.id)))] }) }), _jsx(FormField, { label: "Statut", children: _jsxs("select", { value: form.status, onChange: (event) => setForm((current) => ({ ...current, status: event.target.value })), children: [_jsx("option", { value: "PREPARATION", children: "Pr\u00E9paration" }), _jsx("option", { value: "ACTIVE", children: "Actif" }), _jsx("option", { value: "TRANSITION", children: "Transition" })] }) }), _jsx("button", { type: "submit", className: "primary-button", children: "Cr\u00E9er" })] }) })] }));
};
export const PersonDetailPage = () => {
    const { id = '' } = useParams();
    const person = useRemote(async () => (await api.get(`/people/${id}`)).data, [id], {});
    const accesses = useRemote(async () => (await api.get(`/people/${id}/accesses`)).data, [id], { material: [], software: [], information: [] });
    const documents = useRemote(async () => (await api.get(`/people/${id}/documents`)).data, [id], []);
    const audit = useRemote(async () => (await api.get(`/people/${id}/audit`)).data, [id], { items: [] });
    if (person.loading) {
        return _jsx(PageIntro, { title: "Fiche personne", description: "Chargement du dossier\u2026" });
    }
    return (_jsxs("div", { className: "page-stack", children: [_jsx(PageIntro, { title: `${person.data.firstName ?? ''} ${person.data.lastName ?? ''}`, description: "Identit\u00E9, rattachements, acc\u00E8s, documents et traces d\u2019audit." }), person.error ? _jsx(ErrorState, { message: person.error, onRetry: () => void person.reload() }) : null, _jsxs("div", { className: "content-grid two-columns", children: [_jsx(Panel, { title: "Identit\u00E9", children: _jsxs("dl", { className: "definition-list", children: [_jsxs("div", { children: [_jsx("dt", { children: "Email" }), _jsx("dd", { children: person.data.emailProfessional })] }), _jsxs("div", { children: [_jsx("dt", { children: "Poste" }), _jsx("dd", { children: person.data.position })] }), _jsxs("div", { children: [_jsx("dt", { children: "Responsable" }), _jsx("dd", { children: person.data.managerName ?? 'Non renseigné' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Statut" }), _jsx("dd", { children: _jsx(StatusBadge, { value: person.data.status ?? '-' }) })] })] }) }), _jsx(Panel, { title: "Documents", children: _jsx(DataTable, { rows: documents.data, columns: [
                                { header: 'Titre', render: (item) => item.documentTitle },
                                { header: 'Version', render: (item) => item.versionLabel },
                                { header: 'Statut', render: (item) => _jsx(StatusBadge, { value: String(item.status ?? '') }) },
                            ] }) })] }), _jsxs("div", { className: "content-grid two-columns", children: [_jsx(Panel, { title: "Mat\u00E9riel", children: _jsx(DataTable, { rows: accesses.data.material ?? [], columns: [
                                { header: 'Matériel', render: (item) => item.assetName },
                                { header: 'Référence', render: (item) => item.assetTag },
                                { header: 'Statut', render: (item) => _jsx(StatusBadge, { value: String(item.status ?? '') }) },
                            ] }) }), _jsx(Panel, { title: "Logiciels", children: _jsx(DataTable, { rows: accesses.data.software ?? [], columns: [
                                { header: 'Ressource', render: (item) => item.resourceName },
                                { header: 'Licence', render: (item) => item.licenseType },
                                { header: 'Statut', render: (item) => _jsx(StatusBadge, { value: String(item.status ?? '') }) },
                            ] }) })] }), _jsx(Panel, { title: "Audit r\u00E9cent", children: _jsx(AuditTimeline, { items: audit.data.items }) })] }));
};
export const OrganizationPage = () => {
    const [domainId, setDomainId] = useState('');
    const tree = useRemote(async () => (await api.get('/org/tree', { params: { domainId: domainId || undefined } })).data, [domainId], []);
    const domains = useRemote(async () => (await api.get('/domains')).data, [], []);
    const activities = useRemote(async () => (await api.get('/activities')).data, [], []);
    const positions = useRemote(async () => (await api.get('/positions')).data, [], []);
    return (_jsxs("div", { className: "page-stack", children: [_jsx(PageIntro, { title: "Organisation", description: "Vue hi\u00E9rarchique, r\u00E9f\u00E9rentiels et organigramme filtrable." }), _jsx(Panel, { title: "Filtre de l\u2019organigramme", children: _jsx(FiltersPanel, { children: _jsxs("select", { value: domainId, onChange: (event) => setDomainId(event.target.value), children: [_jsx("option", { value: "", children: "Tous les domaines" }), domains.data.map((domain) => (_jsx("option", { value: domain.id, children: domain.name }, domain.id)))] }) }) }), _jsxs(Panel, { title: "Organigramme", children: [tree.error ? _jsx(ErrorState, { message: tree.error, onRetry: () => void tree.reload() }) : null, _jsx(OrgChart, { nodes: tree.data })] }), _jsxs("div", { className: "content-grid three-columns", children: [_jsx(Panel, { title: "Domaines", children: _jsx(DataTable, { rows: domains.data, columns: [{ header: 'Nom', render: (item) => item.name }] }) }), _jsx(Panel, { title: "Activit\u00E9s", children: _jsx(DataTable, { rows: activities.data, columns: [{ header: 'Nom', render: (item) => item.name }, { header: 'Domaine', render: (item) => String(item.domain?.name ?? '-') }] }) }), _jsx(Panel, { title: "Postes", children: _jsx(DataTable, { rows: positions.data, columns: [{ header: 'Titre', render: (item) => item.title }, { header: 'Niveau', render: (item) => item.hierarchicalLevel ?? '-' }] }) })] })] }));
};
export const MaterialPage = () => {
    const assets = useRemote(async () => (await api.get('/assets/material')).data, [], []);
    const people = useRemote(async () => (await api.get('/people', { params: { pageSize: 50 } })).data.items, [], []);
    const [assetForm, setAssetForm] = useState({ assetTag: '', name: '', assetType: 'Ordinateur' });
    const [assignmentForm, setAssignmentForm] = useState({ assetId: '', personId: '', dueBackAt: '' });
    const createAsset = async (event) => {
        event.preventDefault();
        await api.post('/assets/material', assetForm);
        setAssetForm({ assetTag: '', name: '', assetType: 'Ordinateur' });
        await assets.reload();
    };
    const assignAsset = async (event) => {
        event.preventDefault();
        await api.post(`/assets/material/${assignmentForm.assetId}/assign`, {
            personId: assignmentForm.personId,
            dueBackAt: assignmentForm.dueBackAt || null,
        });
        setAssignmentForm({ assetId: '', personId: '', dueBackAt: '' });
        await assets.reload();
    };
    return (_jsxs("div", { className: "page-stack", children: [_jsx(PageIntro, { title: "Mat\u00E9riel", description: "Gestion du parc, des attributions et des restitutions." }), _jsx(Panel, { title: "Parc mat\u00E9riel", children: _jsx(DataTable, { rows: assets.data, columns: [
                        { header: 'Matériel', render: (item) => String(item.name) },
                        { header: 'Type', render: (item) => String(item.assetType) },
                        { header: 'État', render: (item) => _jsx(StatusBadge, { value: String(item.state) }) },
                        {
                            header: 'Action',
                            render: (item) => String(item.state) === 'ASSIGNED' ? (_jsx("button", { type: "button", className: "secondary-button", onClick: () => void api.post(`/assets/material/${String(item.id)}/return`).then(() => assets.reload()), children: "Restituer" })) : ('Disponible'),
                        },
                    ] }) }), _jsxs("div", { className: "content-grid two-columns", children: [_jsx(Panel, { title: "Ajouter un \u00E9quipement", children: _jsxs("form", { className: "stack-form", onSubmit: (event) => void createAsset(event), children: [_jsx(FormField, { label: "R\u00E9f\u00E9rence", children: _jsx("input", { value: assetForm.assetTag, onChange: (event) => setAssetForm((current) => ({ ...current, assetTag: event.target.value })) }) }), _jsx(FormField, { label: "Nom", children: _jsx("input", { value: assetForm.name, onChange: (event) => setAssetForm((current) => ({ ...current, name: event.target.value })) }) }), _jsx(FormField, { label: "Type", children: _jsx("input", { value: assetForm.assetType, onChange: (event) => setAssetForm((current) => ({ ...current, assetType: event.target.value })) }) }), _jsx("button", { type: "submit", className: "primary-button", children: "Ajouter" })] }) }), _jsx(Panel, { title: "Attribuer un \u00E9quipement", children: _jsxs("form", { className: "stack-form", onSubmit: (event) => void assignAsset(event), children: [_jsx(FormField, { label: "Mat\u00E9riel", children: _jsxs("select", { value: assignmentForm.assetId, onChange: (event) => setAssignmentForm((current) => ({ ...current, assetId: event.target.value })), children: [_jsx("option", { value: "", children: "S\u00E9lectionner" }), assets.data.map((item) => (_jsx("option", { value: String(item.id ?? ''), children: String(item.name ?? '') }, String(item.id ?? ''))))] }) }), _jsx(FormField, { label: "Personne", children: _jsxs("select", { value: assignmentForm.personId, onChange: (event) => setAssignmentForm((current) => ({ ...current, personId: event.target.value })), children: [_jsx("option", { value: "", children: "S\u00E9lectionner" }), people.data.map((item) => (_jsxs("option", { value: item.id ?? '', children: [item.firstName ?? '', " ", item.lastName ?? ''] }, item.id ?? '')))] }) }), _jsx(FormField, { label: "Date cible de restitution", children: _jsx("input", { type: "datetime-local", value: assignmentForm.dueBackAt, onChange: (event) => setAssignmentForm((current) => ({ ...current, dueBackAt: event.target.value })) }) }), _jsx("button", { type: "submit", className: "primary-button", children: "Attribuer" })] }) })] })] }));
};
export const SoftwarePage = () => {
    const resources = useRemote(async () => (await api.get('/resources/software')).data, [], []);
    const people = useRemote(async () => (await api.get('/people', { params: { pageSize: 50 } })).data.items, [], []);
    const [resourceForm, setResourceForm] = useState({ name: '', slug: '', licenseType: 'Standard' });
    const [assignmentForm, setAssignmentForm] = useState({ resourceId: '', personId: '', startDate: '', endDate: '' });
    return (_jsxs("div", { className: "page-stack", children: [_jsx(PageIntro, { title: "Acc\u00E8s logiciels", description: "Attributions, renouvellements et r\u00E9vocations des licences et outils m\u00E9tier." }), _jsx(Panel, { title: "Ressources logicielles", children: _jsx(DataTable, { rows: resources.data, columns: [
                        { header: 'Ressource', render: (item) => String(item.name) },
                        { header: 'Licence', render: (item) => String(item.licenseType) },
                        { header: 'Affectations', render: (item) => String(item.assignments?.length ?? 0) },
                    ] }) }), _jsxs("div", { className: "content-grid two-columns", children: [_jsx(Panel, { title: "Ajouter une ressource", children: _jsxs("form", { className: "stack-form", onSubmit: (event) => {
                                event.preventDefault();
                                void api.post('/resources/software', resourceForm).then(() => {
                                    setResourceForm({ name: '', slug: '', licenseType: 'Standard' });
                                    return resources.reload();
                                });
                            }, children: [_jsx(FormField, { label: "Nom", children: _jsx("input", { value: resourceForm.name, onChange: (event) => setResourceForm((current) => ({ ...current, name: event.target.value })) }) }), _jsx(FormField, { label: "Slug", children: _jsx("input", { value: resourceForm.slug, onChange: (event) => setResourceForm((current) => ({ ...current, slug: event.target.value })) }) }), _jsx(FormField, { label: "Type de licence", children: _jsx("input", { value: resourceForm.licenseType, onChange: (event) => setResourceForm((current) => ({ ...current, licenseType: event.target.value })) }) }), _jsx("button", { type: "submit", className: "primary-button", children: "Ajouter" })] }) }), _jsx(Panel, { title: "Cr\u00E9er une attribution", children: _jsxs("form", { className: "stack-form", onSubmit: (event) => {
                                event.preventDefault();
                                void api.post('/software-assignments', assignmentForm).then(() => {
                                    setAssignmentForm({ resourceId: '', personId: '', startDate: '', endDate: '' });
                                    return resources.reload();
                                });
                            }, children: [_jsx(FormField, { label: "Ressource", children: _jsxs("select", { value: assignmentForm.resourceId, onChange: (event) => setAssignmentForm((current) => ({ ...current, resourceId: event.target.value })), children: [_jsx("option", { value: "", children: "S\u00E9lectionner" }), resources.data.map((item) => _jsx("option", { value: String(item.id ?? ''), children: String(item.name ?? '') }, String(item.id ?? '')))] }) }), _jsx(FormField, { label: "Personne", children: _jsxs("select", { value: assignmentForm.personId, onChange: (event) => setAssignmentForm((current) => ({ ...current, personId: event.target.value })), children: [_jsx("option", { value: "", children: "S\u00E9lectionner" }), people.data.map((item) => _jsxs("option", { value: item.id ?? '', children: [item.firstName ?? '', " ", item.lastName ?? ''] }, item.id ?? ''))] }) }), _jsx(FormField, { label: "D\u00E9but", children: _jsx("input", { type: "datetime-local", value: assignmentForm.startDate, onChange: (event) => setAssignmentForm((current) => ({ ...current, startDate: event.target.value })) }) }), _jsx(FormField, { label: "Fin", children: _jsx("input", { type: "datetime-local", value: assignmentForm.endDate, onChange: (event) => setAssignmentForm((current) => ({ ...current, endDate: event.target.value })) }) }), _jsx("button", { type: "submit", className: "primary-button", children: "Attribuer" })] }) })] })] }));
};
export const InformationPage = () => {
    const resources = useRemote(async () => (await api.get('/resources/information')).data, [], []);
    const people = useRemote(async () => (await api.get('/people', { params: { pageSize: 50 } })).data.items, [], []);
    const [resourceForm, setResourceForm] = useState({ name: '', slug: '', resourceType: 'Teams' });
    const [assignmentForm, setAssignmentForm] = useState({ resourceId: '', personId: '', startDate: '' });
    return (_jsxs("div", { className: "page-stack", children: [_jsx(PageIntro, { title: "Acc\u00E8s aux informations", description: "Groupes Teams, listes de diffusion et espaces documentaires." }), _jsx(Panel, { title: "Ressources informationnelles", children: _jsx(DataTable, { rows: resources.data, columns: [
                        { header: 'Ressource', render: (item) => String(item.name) },
                        { header: 'Type', render: (item) => String(item.resourceType) },
                        { header: 'Affectations', render: (item) => String(item.assignments?.length ?? 0) },
                    ] }) }), _jsxs("div", { className: "content-grid two-columns", children: [_jsx(Panel, { title: "Ajouter une ressource", children: _jsxs("form", { className: "stack-form", onSubmit: (event) => {
                                event.preventDefault();
                                void api.post('/resources/information', resourceForm).then(() => {
                                    setResourceForm({ name: '', slug: '', resourceType: 'Teams' });
                                    return resources.reload();
                                });
                            }, children: [_jsx(FormField, { label: "Nom", children: _jsx("input", { value: resourceForm.name, onChange: (event) => setResourceForm((current) => ({ ...current, name: event.target.value })) }) }), _jsx(FormField, { label: "Slug", children: _jsx("input", { value: resourceForm.slug, onChange: (event) => setResourceForm((current) => ({ ...current, slug: event.target.value })) }) }), _jsx(FormField, { label: "Type", children: _jsx("input", { value: resourceForm.resourceType, onChange: (event) => setResourceForm((current) => ({ ...current, resourceType: event.target.value })) }) }), _jsx("button", { type: "submit", className: "primary-button", children: "Ajouter" })] }) }), _jsx(Panel, { title: "Cr\u00E9er une attribution", children: _jsxs("form", { className: "stack-form", onSubmit: (event) => {
                                event.preventDefault();
                                void api.post('/information-assignments', assignmentForm).then(() => {
                                    setAssignmentForm({ resourceId: '', personId: '', startDate: '' });
                                    return resources.reload();
                                });
                            }, children: [_jsx(FormField, { label: "Ressource", children: _jsxs("select", { value: assignmentForm.resourceId, onChange: (event) => setAssignmentForm((current) => ({ ...current, resourceId: event.target.value })), children: [_jsx("option", { value: "", children: "S\u00E9lectionner" }), resources.data.map((item) => _jsx("option", { value: String(item.id ?? ''), children: String(item.name ?? '') }, String(item.id ?? '')))] }) }), _jsx(FormField, { label: "Personne", children: _jsxs("select", { value: assignmentForm.personId, onChange: (event) => setAssignmentForm((current) => ({ ...current, personId: event.target.value })), children: [_jsx("option", { value: "", children: "S\u00E9lectionner" }), people.data.map((item) => _jsxs("option", { value: item.id ?? '', children: [item.firstName ?? '', " ", item.lastName ?? ''] }, item.id ?? ''))] }) }), _jsx(FormField, { label: "D\u00E9but", children: _jsx("input", { type: "datetime-local", value: assignmentForm.startDate, onChange: (event) => setAssignmentForm((current) => ({ ...current, startDate: event.target.value })) }) }), _jsx("button", { type: "submit", className: "primary-button", children: "Attribuer" })] }) })] })] }));
};
export const DocumentsPage = () => {
    const { user } = useAuth();
    const [selectedId, setSelectedId] = useState('');
    const documents = useRemote(async () => (await api.get('/documents')).data, [], []);
    const people = useRemote(async () => (await api.get('/people', { params: { pageSize: 50 } })).data.items, [], []);
    const selectedDocument = useRemote(async () => selectedId ? (await api.get(`/documents/${selectedId}`)).data : null, [selectedId], null);
    const [documentForm, setDocumentForm] = useState({ code: '', title: '', categoryId: '', versionLabel: 'v1', contentMarkdown: '' });
    const [assignForm, setAssignForm] = useState({ documentId: '', personIds: [] });
    const [signing, setSigning] = useState(false);
    const categories = selectedDocument.data?.category ? [selectedDocument.data.category] : [];
    return (_jsxs("div", { className: "page-stack", children: [_jsx(PageIntro, { title: "Documents", description: "Publication, attribution et signature interne des documents obligatoires." }), _jsx(Panel, { title: "Catalogue documentaire", children: _jsx(DataTable, { rows: documents.data, columns: [
                        { header: 'Titre', render: (item) => _jsx("button", { type: "button", className: "link-button", onClick: () => setSelectedId(String(item.id)), children: String(item.title) }) },
                        { header: 'Catégorie', render: (item) => String(item.category?.label ?? '-') },
                        { header: 'Version', render: (item) => String(item.currentVersion?.versionLabel ?? '-') },
                    ] }) }), selectedDocument.data ? (_jsxs(Panel, { title: "D\u00E9tail du document", children: [_jsx(DocumentViewer, { title: String(selectedDocument.data.title), content: String(selectedDocument.data.currentVersion?.contentMarkdown ?? 'Aucun contenu') }), _jsx(SignaturePanel, { canSign: Boolean(user?.permissions.includes('documents:sign')), isBusy: signing, onSign: () => {
                            setSigning(true);
                            void api.post(`/documents/${selectedDocument.data?.id}/sign`, {}).then(() => documents.reload()).finally(() => setSigning(false));
                        } })] })) : null, _jsxs("div", { className: "content-grid two-columns", children: [_jsxs(Panel, { title: "Cr\u00E9er un document", children: [categories.length === 0 ? _jsx(EmptyState, { title: "Cat\u00E9gorie requise", message: "S\u00E9lectionnez un document existant pour reprendre une cat\u00E9gorie, ou utilisez l\u2019API d\u2019administration si n\u00E9cessaire." }) : null, _jsxs("form", { className: "stack-form", onSubmit: (event) => {
                                    event.preventDefault();
                                    void api.post('/documents', {
                                        ...documentForm,
                                        categoryId: documentForm.categoryId || categories[0]?.id,
                                        valueType: 'ORGANISATIONNELLE',
                                    }).then(() => {
                                        setDocumentForm({ code: '', title: '', categoryId: '', versionLabel: 'v1', contentMarkdown: '' });
                                        return documents.reload();
                                    });
                                }, children: [_jsx(FormField, { label: "Code", children: _jsx("input", { value: documentForm.code, onChange: (event) => setDocumentForm((current) => ({ ...current, code: event.target.value })) }) }), _jsx(FormField, { label: "Titre", children: _jsx("input", { value: documentForm.title, onChange: (event) => setDocumentForm((current) => ({ ...current, title: event.target.value })) }) }), _jsx(FormField, { label: "Version", children: _jsx("input", { value: documentForm.versionLabel, onChange: (event) => setDocumentForm((current) => ({ ...current, versionLabel: event.target.value })) }) }), _jsx(FormField, { label: "Contenu", children: _jsx("textarea", { rows: 6, value: documentForm.contentMarkdown, onChange: (event) => setDocumentForm((current) => ({ ...current, contentMarkdown: event.target.value })) }) }), _jsx("button", { type: "submit", className: "primary-button", children: "Publier" })] })] }), _jsx(Panel, { title: "Attribuer un document", children: _jsxs("form", { className: "stack-form", onSubmit: (event) => {
                                event.preventDefault();
                                void api.post(`/documents/${assignForm.documentId}/assign`, { personIds: assignForm.personIds }).then(() => documents.reload());
                            }, children: [_jsx(FormField, { label: "Document", children: _jsxs("select", { value: assignForm.documentId, onChange: (event) => setAssignForm((current) => ({ ...current, documentId: event.target.value })), children: [_jsx("option", { value: "", children: "S\u00E9lectionner" }), documents.data.map((item) => _jsx("option", { value: String(item.id ?? ''), children: String(item.title ?? '') }, String(item.id ?? '')))] }) }), _jsx(FormField, { label: "Personnes", children: _jsx("select", { multiple: true, value: assignForm.personIds, onChange: (event) => setAssignForm((current) => ({ ...current, personIds: Array.from(event.target.selectedOptions).map((option) => option.value) })), children: people.data.map((item) => _jsxs("option", { value: item.id ?? '', children: [item.firstName ?? '', " ", item.lastName ?? ''] }, item.id ?? '')) }) }), _jsx("button", { type: "submit", className: "primary-button", children: "Assigner" })] }) })] })] }));
};
export const MePage = () => {
    const profile = useRemote(async () => (await api.get('/people/me/profile')).data, [], {});
    const accesses = useRemote(async () => (await api.get('/people/me/accesses')).data, [], { material: [], software: [], information: [] });
    const documents = useRemote(async () => (await api.get('/documents/me/documents')).data, [], []);
    const signatures = useRemote(async () => (await api.get('/documents/me/signatures')).data, [], []);
    return (_jsxs("div", { className: "page-stack", children: [_jsx(PageIntro, { title: "Mon espace", description: "Mon profil, mes acc\u00E8s, mes documents et mes engagements." }), _jsxs("div", { className: "content-grid two-columns", children: [_jsx(Panel, { title: "Profil", children: _jsxs("dl", { className: "definition-list", children: [_jsxs("div", { children: [_jsx("dt", { children: "Nom" }), _jsxs("dd", { children: [profile.data.firstName, " ", profile.data.lastName] })] }), _jsxs("div", { children: [_jsx("dt", { children: "Email" }), _jsx("dd", { children: profile.data.emailProfessional })] }), _jsxs("div", { children: [_jsx("dt", { children: "Poste" }), _jsx("dd", { children: profile.data.position })] }), _jsxs("div", { children: [_jsx("dt", { children: "R\u00E9gion" }), _jsx("dd", { children: profile.data.region })] })] }) }), _jsx(Panel, { title: "Documents \u00E0 traiter", children: _jsx(DataTable, { rows: documents.data, columns: [
                                { header: 'Titre', render: (item) => item.documentTitle },
                                { header: 'Version', render: (item) => item.versionLabel },
                                { header: 'Statut', render: (item) => _jsx(StatusBadge, { value: String(item.status ?? '') }) },
                            ] }) })] }), _jsxs("div", { className: "content-grid two-columns", children: [_jsxs(Panel, { title: "Mes acc\u00E8s", children: [_jsxs("p", { children: ["Mat\u00E9riel : ", (accesses.data.material ?? []).length] }), _jsxs("p", { children: ["Logiciels : ", (accesses.data.software ?? []).length] }), _jsxs("p", { children: ["Informations : ", (accesses.data.information ?? []).length] })] }), _jsx(Panel, { title: "Mes signatures", children: _jsx(DataTable, { rows: signatures.data, columns: [
                                { header: 'Document', render: (item) => item.documentTitle },
                                { header: 'Version', render: (item) => item.versionLabel },
                                { header: 'Date', render: (item) => new Date(item.signedAt ?? '').toLocaleString('fr-FR') },
                            ] }) })] })] }));
};
export const WorkflowsPage = () => {
    const onboardings = useRemote(async () => (await api.get('/onboarding')).data, [], []);
    const offboardings = useRemote(async () => (await api.get('/offboarding')).data, [], []);
    const people = useRemote(async () => (await api.get('/people', { params: { pageSize: 50 } })).data.items, [], []);
    const [onboardingPersonId, setOnboardingPersonId] = useState('');
    const [offboardingPersonId, setOffboardingPersonId] = useState('');
    return (_jsxs("div", { className: "page-stack", children: [_jsx(PageIntro, { title: "Parcours", description: "Suivi des parcours d\u2019arriv\u00E9e et de d\u00E9part avec des checklists visuelles." }), _jsxs("div", { className: "content-grid two-columns", children: [_jsxs(Panel, { title: "Arriv\u00E9es", children: [_jsx(DataTable, { rows: onboardings.data, columns: [
                                    { header: 'Personne', render: (item) => item.personName },
                                    { header: 'Statut', render: (item) => _jsx(StatusBadge, { value: String(item.status ?? '') }) },
                                    { header: 'Progression', render: (item) => `${item.progress}%` },
                                ] }), _jsxs("form", { className: "inline-form", onSubmit: (event) => {
                                    event.preventDefault();
                                    void api.post('/onboarding', { personId: onboardingPersonId }).then(() => {
                                        setOnboardingPersonId('');
                                        return onboardings.reload();
                                    });
                                }, children: [_jsxs("select", { value: onboardingPersonId, onChange: (event) => setOnboardingPersonId(event.target.value), children: [_jsx("option", { value: "", children: "Nouvelle arriv\u00E9e" }), people.data.map((item) => _jsxs("option", { value: item.id ?? '', children: [item.firstName ?? '', " ", item.lastName ?? ''] }, item.id ?? ''))] }), _jsx("button", { type: "submit", className: "primary-button", children: "Cr\u00E9er" })] })] }), _jsxs(Panel, { title: "D\u00E9parts", children: [_jsx(DataTable, { rows: offboardings.data, columns: [
                                    { header: 'Personne', render: (item) => item.personName },
                                    { header: 'Statut', render: (item) => _jsx(StatusBadge, { value: String(item.status ?? '') }) },
                                    { header: 'Progression', render: (item) => `${item.progress}%` },
                                ] }), _jsxs("form", { className: "inline-form", onSubmit: (event) => {
                                    event.preventDefault();
                                    void api.post('/offboarding', { personId: offboardingPersonId }).then(() => {
                                        setOffboardingPersonId('');
                                        return offboardings.reload();
                                    });
                                }, children: [_jsxs("select", { value: offboardingPersonId, onChange: (event) => setOffboardingPersonId(event.target.value), children: [_jsx("option", { value: "", children: "Nouveau d\u00E9part" }), people.data.map((item) => _jsxs("option", { value: item.id ?? '', children: [item.firstName ?? '', " ", item.lastName ?? ''] }, item.id ?? ''))] }), _jsx("button", { type: "submit", className: "primary-button", children: "Cr\u00E9er" })] })] })] })] }));
};
export const AdminPage = () => {
    const roles = useRemote(async () => (await api.get('/roles')).data, [], []);
    const permissions = useRemote(async () => (await api.get('/permissions')).data, [], []);
    const connectors = useRemote(async () => (await api.get('/integrations/connectors')).data, [], []);
    const readiness = useRemote(async () => (await api.get('/integrations/connectors/readiness')).data, [], {});
    return (_jsxs("div", { className: "page-stack", children: [_jsx(PageIntro, { title: "Administration", description: "R\u00F4les, permissions, connecteurs simul\u00E9s et param\u00E8tres d\u2019architecture." }), _jsxs("div", { className: "content-grid three-columns", children: [_jsx(Panel, { title: "R\u00F4les", children: _jsx(DataTable, { rows: roles.data, columns: [
                                { header: 'Rôle', render: (item) => getDisplayLabel(String(item.code ?? item.name ?? '')) },
                                { header: 'Permissions', render: (item) => String(item.permissions?.length ?? 0) },
                            ] }) }), _jsx(Panel, { title: "Permissions", children: _jsx(DataTable, { rows: permissions.data, columns: [{ header: 'Code', render: (item) => item.code }] }) }), _jsx(Panel, { title: "\u00C9tat de pr\u00E9paration", children: _jsxs("dl", { className: "definition-list", children: [_jsxs("div", { children: [_jsx("dt", { children: "Mode simulation" }), _jsx("dd", { children: getBooleanLabel(Boolean(readiness.data.mockConnectorsEnabled ?? false)) })] }), _jsxs("div", { children: [_jsx("dt", { children: "Strat\u00E9gie d\u2019annuaire" }), _jsx("dd", { children: readiness.data.directorySyncStrategy ? getDisplayLabel(String(readiness.data.directorySyncStrategy)) : 'Non défini' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Graph" }), _jsx("dd", { children: String(readiness.data.graphBaseUrl ?? 'Non défini') })] })] }) })] }), _jsx(Panel, { title: "Connecteurs", children: _jsx(DataTable, { rows: connectors.data, columns: [
                        { header: 'Nom', render: (item) => String(item.name) },
                        { header: 'Type', render: (item) => String(item.type) },
                        { header: 'Statut', render: (item) => _jsx(StatusBadge, { value: String(item.status) }) },
                    ] }) })] }));
};
export const AuditPage = () => {
    const audit = useRemote(async () => (await api.get('/audit-logs')).data, [], { items: [] });
    return (_jsxs("div", { className: "page-stack", children: [_jsx(PageIntro, { title: "Audit", description: "Journalisation des connexions, changements de droits et actions sensibles." }), audit.error ? _jsx(ErrorState, { message: audit.error, onRetry: () => void audit.reload() }) : null, _jsx(Panel, { title: "Chronologie", children: _jsx(AuditTimeline, { items: audit.data.items }) })] }));
};
export const NotificationsPage = ({ compact = false }) => {
    const notifications = useRemote(async () => (await api.get('/notifications')).data, [], []);
    const content = (_jsx(Panel, { title: compact ? 'Notifications récentes' : 'Centre de notifications', children: _jsx(DataTable, { rows: notifications.data, columns: [
                { header: 'Titre', render: (item) => String(item.title) },
                { header: 'Type', render: (item) => _jsx(StatusBadge, { value: String(item.type) }) },
                { header: 'Statut', render: (item) => _jsx(StatusBadge, { value: String(item.isRead ? 'LUE' : 'A_TRAITER') }) },
                {
                    header: 'Action',
                    render: (item) => item.isRead ? ('Déjà lue') : (_jsx("button", { type: "button", className: "secondary-button", onClick: () => void api.patch(`/notifications/${String(item.id)}/read`).then(() => notifications.reload()), children: "Marquer comme lue" })),
                },
            ] }) }));
    if (compact) {
        return content;
    }
    return (_jsxs("div", { className: "page-stack", children: [_jsx(PageIntro, { title: "Notifications", description: "Alertes internes li\u00E9es aux documents, aux \u00E9ch\u00E9ances et aux parcours en attente." }), content] }));
};
