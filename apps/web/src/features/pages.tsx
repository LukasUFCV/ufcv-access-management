import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '@/app/providers/AuthProvider';
import {
  AuditTimeline,
  DataTable,
  DocumentViewer,
  EmptyState,
  ErrorState,
  FiltersPanel,
  FormField,
  MetricCard,
  OrgChart,
  Panel,
  SearchBar,
  SignaturePanel,
  StatusBadge,
} from '@/components/ui';
import { api, getErrorMessage } from '@/lib/api';

type RemoteState<T> = {
  data: T;
  loading: boolean;
  error: string;
};

const useRemote = <T,>(loader: () => Promise<T>, deps: unknown[], initialData: T) => {
  const [state, setState] = useState<RemoteState<T>>({
    data: initialData,
    loading: true,
    error: '',
  });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const data = await loader();
      setState({ data, loading: false, error: '' });
    } catch (error) {
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

const PageIntro = ({ title, description }: { title: string; description: string }) => (
  <div className="page-intro">
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  </div>
);

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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await login(form.login, form.password);
      navigate('/');
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <main className="login-card">
        <div className="login-brand">
          <span className="brand-mark" />
          <div>
            <h1>Habilitations UFCV</h1>
            <p>Gestion des droits, acces, documents et workflows de cycle de vie.</p>
          </div>
        </div>

        <form className="stack-form" onSubmit={handleSubmit}>
          <FormField label="Login">
            <input
              value={form.login}
              onChange={(event) => setForm((current) => ({ ...current, login: event.target.value }))}
            />
          </FormField>
          <FormField label="Mot de passe">
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
            />
          </FormField>

          {error ? <ErrorState message={error} /> : null}

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div className="demo-accounts">
          <strong>Comptes demo</strong>
          <p>`superadmin`, `rh_admin`, `dpmo_admin`, `manager_demo`, `user_demo`</p>
        </div>
      </main>
    </div>
  );
};

export const DashboardPage = () => {
  const summary = useRemote(
    async () => (await api.get('/dashboard/summary')).data as Record<string, number>,
    [],
    {
      activePeople: 0,
      onboardingsInProgress: 0,
      offboardingsInProgress: 0,
      documentsPendingSignature: 0,
      expiringAccesses: 0,
      materialPendingReturn: 0,
    },
  );

  if (summary.loading) {
    return <PageIntro title="Tableau de bord" description="Chargement des indicateurs…" />;
  }

  return (
    <div className="page-stack">
      <PageIntro
        title="Tableau de bord"
        description="Vue synthétique de l'activité RH, des acces et des obligations internes."
      />
      {summary.error ? <ErrorState message={summary.error} onRetry={() => void summary.reload()} /> : null}
      <div className="metrics-grid">
        <MetricCard label="Personnes actives" value={summary.data.activePeople ?? 0} />
        <MetricCard label="Onboardings en cours" value={summary.data.onboardingsInProgress ?? 0} />
        <MetricCard label="Offboardings en cours" value={summary.data.offboardingsInProgress ?? 0} />
        <MetricCard label="Documents a signer" value={summary.data.documentsPendingSignature ?? 0} />
        <MetricCard label="Acces expirant bientot" value={summary.data.expiringAccesses ?? 0} />
        <MetricCard label="Materiel a restituer" value={summary.data.materialPendingReturn ?? 0} />
      </div>
    </div>
  );
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

  const people = useRemote(
    async () =>
      (
        await api.get('/people', {
          params: {
            search: search || undefined,
            status: status || undefined,
            page: 1,
            pageSize: 20,
          },
        })
      ).data as { items: Array<Record<string, string>>; total: number },
    [search, status],
    { items: [], total: 0 },
  );
  const actorTypes = useRemote(async () => (await api.get('/actor-types')).data as Array<Record<string, string>>, [], []);

  const createPerson = async (event: FormEvent) => {
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

  return (
    <div className="page-stack">
      <PageIntro title="Annuaire" description="Recherche, consultation et création des dossiers personnes." />
      <Panel title="Filtres">
        <FiltersPanel>
          <SearchBar value={search} onChange={setSearch} placeholder="Nom, email, identifiant…" />
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="PREPARATION">Preparation</option>
            <option value="ACTIVE">Active</option>
            <option value="TRANSITION">Transition</option>
            <option value="SORTIE">Sortie</option>
            <option value="ARCHIVEE">Archivee</option>
          </select>
        </FiltersPanel>
      </Panel>

      <Panel title={`Personnes (${people.data.total})`}>
        {people.error ? <ErrorState message={people.error} onRetry={() => void people.reload()} /> : null}
        <DataTable
          rows={people.data.items}
          columns={[
            {
              header: 'Personne',
              render: (item) => (
                <div className="stack-inline">
                  <Link to={`/people/${item.id}`}>{item.firstName} {item.lastName}</Link>
                  <small>{item.emailProfessional ?? ''}</small>
                </div>
              ),
            },
            { header: 'Type', render: (item) => <StatusBadge value={String(item.actorType ?? '')} /> },
            { header: 'Statut', render: (item) => <StatusBadge value={String(item.status ?? '')} /> },
            { header: 'Poste', render: (item) => item.position ?? '' },
            { header: 'Region', render: (item) => item.region ?? '' },
          ]}
        />
      </Panel>

      <Panel title="Creer une personne">
        <form className="stack-form compact-grid" onSubmit={(event) => void createPerson(event)}>
          <FormField label="Prenom">
            <input value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} />
          </FormField>
          <FormField label="Nom">
            <input value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} />
          </FormField>
          <FormField label="Identifiant">
            <input value={form.sessionIdentifier} onChange={(event) => setForm((current) => ({ ...current, sessionIdentifier: event.target.value }))} />
          </FormField>
          <FormField label="Email pro">
            <input value={form.emailProfessional} onChange={(event) => setForm((current) => ({ ...current, emailProfessional: event.target.value }))} />
          </FormField>
          <FormField label="Type d'acteur">
            <select value={form.actorTypeId} onChange={(event) => setForm((current) => ({ ...current, actorTypeId: event.target.value }))}>
              <option value="">Selectionner</option>
              {actorTypes.data.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Statut">
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
              <option value="PREPARATION">Preparation</option>
              <option value="ACTIVE">Active</option>
              <option value="TRANSITION">Transition</option>
            </select>
          </FormField>
          <button type="submit" className="primary-button">Creer</button>
        </form>
      </Panel>
    </div>
  );
};

export const PersonDetailPage = () => {
  const { id = '' } = useParams();
  const person = useRemote(async () => (await api.get(`/people/${id}`)).data as Record<string, string>, [id], {} as Record<string, string>);
  const accesses = useRemote(async () => (await api.get(`/people/${id}/accesses`)).data as Record<string, Array<Record<string, string>>>, [id], { material: [], software: [], information: [] });
  const documents = useRemote(async () => (await api.get(`/people/${id}/documents`)).data as Array<Record<string, string>>, [id], []);
  const audit = useRemote(async () => (await api.get(`/people/${id}/audit`)).data as { items: Array<Record<string, unknown>> }, [id], { items: [] });

  if (person.loading) {
    return <PageIntro title="Fiche personne" description="Chargement du dossier…" />;
  }

  return (
    <div className="page-stack">
      <PageIntro title={`${person.data.firstName ?? ''} ${person.data.lastName ?? ''}`} description="Identite, rattachements, acces, documents et traces d'audit." />
      {person.error ? <ErrorState message={person.error} onRetry={() => void person.reload()} /> : null}
      <div className="content-grid two-columns">
        <Panel title="Identite">
          <dl className="definition-list">
            <div><dt>Email</dt><dd>{person.data.emailProfessional}</dd></div>
            <div><dt>Poste</dt><dd>{person.data.position}</dd></div>
            <div><dt>Manager</dt><dd>{person.data.managerName ?? 'Non renseigne'}</dd></div>
            <div><dt>Statut</dt><dd><StatusBadge value={person.data.status ?? '-'} /></dd></div>
          </dl>
        </Panel>
        <Panel title="Documents">
          <DataTable
            rows={documents.data}
            columns={[
              { header: 'Titre', render: (item) => item.documentTitle },
              { header: 'Version', render: (item) => item.versionLabel },
              { header: 'Statut', render: (item) => <StatusBadge value={String(item.status ?? '')} /> },
            ]}
          />
        </Panel>
      </div>
      <div className="content-grid two-columns">
        <Panel title="Materiel">
          <DataTable rows={accesses.data.material ?? []} columns={[
            { header: 'Materiel', render: (item) => item.assetName },
            { header: 'Tag', render: (item) => item.assetTag },
            { header: 'Statut', render: (item) => <StatusBadge value={String(item.status ?? '')} /> },
          ]} />
        </Panel>
        <Panel title="Logiciels">
          <DataTable rows={accesses.data.software ?? []} columns={[
            { header: 'Ressource', render: (item) => item.resourceName },
            { header: 'Licence', render: (item) => item.licenseType },
            { header: 'Statut', render: (item) => <StatusBadge value={String(item.status ?? '')} /> },
          ]} />
        </Panel>
      </div>
      <Panel title="Audit recent">
        <AuditTimeline items={audit.data.items} />
      </Panel>
    </div>
  );
};

export const OrganizationPage = () => {
  const [domainId, setDomainId] = useState('');
  const tree = useRemote(
    async () => (await api.get('/org/tree', { params: { domainId: domainId || undefined } })).data as Array<Record<string, unknown>>,
    [domainId],
    [],
  );
  const domains = useRemote(async () => (await api.get('/domains')).data as Array<Record<string, string>>, [], []);
  const activities = useRemote(async () => (await api.get('/activities')).data as Array<Record<string, string>>, [], []);
  const positions = useRemote(async () => (await api.get('/positions')).data as Array<Record<string, string>>, [], []);

  return (
    <div className="page-stack">
      <PageIntro title="Organisation" description="Vue hiérarchique, référentiels et organigramme filtrable." />
      <Panel title="Filtre d'organigramme">
        <FiltersPanel>
          <select value={domainId} onChange={(event) => setDomainId(event.target.value)}>
            <option value="">Tous les domaines</option>
            {domains.data.map((domain) => (
              <option key={domain.id} value={domain.id}>{domain.name}</option>
            ))}
          </select>
        </FiltersPanel>
      </Panel>
      <Panel title="Organigramme">
        {tree.error ? <ErrorState message={tree.error} onRetry={() => void tree.reload()} /> : null}
        <OrgChart nodes={tree.data} />
      </Panel>
      <div className="content-grid three-columns">
        <Panel title="Domaines">
          <DataTable rows={domains.data} columns={[{ header: 'Nom', render: (item) => item.name }]} />
        </Panel>
        <Panel title="Activites">
          <DataTable rows={activities.data} columns={[{ header: 'Nom', render: (item) => item.name }, { header: 'Domaine', render: (item) => String((item as { domain?: { name?: string } }).domain?.name ?? '-') }]} />
        </Panel>
        <Panel title="Postes">
          <DataTable rows={positions.data} columns={[{ header: 'Titre', render: (item) => item.title }, { header: 'Niveau', render: (item) => item.hierarchicalLevel ?? '-' }]} />
        </Panel>
      </div>
    </div>
  );
};

export const MaterialPage = () => {
  const assets = useRemote(async () => (await api.get('/assets/material')).data as Array<Record<string, unknown>>, [], []);
  const people = useRemote(async () => (await api.get('/people', { params: { pageSize: 50 } })).data.items as Array<Record<string, string>>, [], []);
  const [assetForm, setAssetForm] = useState({ assetTag: '', name: '', assetType: 'Ordinateur' });
  const [assignmentForm, setAssignmentForm] = useState({ assetId: '', personId: '', dueBackAt: '' });

  const createAsset = async (event: FormEvent) => {
    event.preventDefault();
    await api.post('/assets/material', assetForm);
    setAssetForm({ assetTag: '', name: '', assetType: 'Ordinateur' });
    await assets.reload();
  };

  const assignAsset = async (event: FormEvent) => {
    event.preventDefault();
    await api.post(`/assets/material/${assignmentForm.assetId}/assign`, {
      personId: assignmentForm.personId,
      dueBackAt: assignmentForm.dueBackAt || null,
    });
    setAssignmentForm({ assetId: '', personId: '', dueBackAt: '' });
    await assets.reload();
  };

  return (
    <div className="page-stack">
      <PageIntro title="Materiel" description="Gestion du parc, attributions et restitutions." />
      <Panel title="Parc materiel">
        <DataTable
          rows={assets.data}
          columns={[
            { header: 'Materiel', render: (item) => String(item.name) },
            { header: 'Type', render: (item) => String(item.assetType) },
            { header: 'Etat', render: (item) => <StatusBadge value={String(item.state)} /> },
            {
              header: 'Action',
              render: (item) =>
                String(item.state) === 'ASSIGNED' ? (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void api.post(`/assets/material/${String(item.id)}/return`).then(() => assets.reload())}
                  >
                    Retour
                  </button>
                ) : (
                  'Disponible'
                ),
            },
          ]}
        />
      </Panel>
      <div className="content-grid two-columns">
        <Panel title="Ajouter un materiel">
          <form className="stack-form" onSubmit={(event) => void createAsset(event)}>
            <FormField label="Tag"><input value={assetForm.assetTag} onChange={(event) => setAssetForm((current) => ({ ...current, assetTag: event.target.value }))} /></FormField>
            <FormField label="Nom"><input value={assetForm.name} onChange={(event) => setAssetForm((current) => ({ ...current, name: event.target.value }))} /></FormField>
            <FormField label="Type"><input value={assetForm.assetType} onChange={(event) => setAssetForm((current) => ({ ...current, assetType: event.target.value }))} /></FormField>
            <button type="submit" className="primary-button">Ajouter</button>
          </form>
        </Panel>
        <Panel title="Attribuer un materiel">
          <form className="stack-form" onSubmit={(event) => void assignAsset(event)}>
            <FormField label="Materiel">
              <select value={assignmentForm.assetId} onChange={(event) => setAssignmentForm((current) => ({ ...current, assetId: event.target.value }))}>
                <option value="">Selectionner</option>
                {assets.data.map((item) => (
                  <option key={String(item.id ?? '')} value={String(item.id ?? '')}>{String(item.name ?? '')}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Personne">
              <select value={assignmentForm.personId} onChange={(event) => setAssignmentForm((current) => ({ ...current, personId: event.target.value }))}>
                <option value="">Selectionner</option>
                {people.data.map((item) => (
                  <option key={item.id ?? ''} value={item.id ?? ''}>{item.firstName ?? ''} {item.lastName ?? ''}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Date de restitution cible">
              <input type="datetime-local" value={assignmentForm.dueBackAt} onChange={(event) => setAssignmentForm((current) => ({ ...current, dueBackAt: event.target.value }))} />
            </FormField>
            <button type="submit" className="primary-button">Attribuer</button>
          </form>
        </Panel>
      </div>
    </div>
  );
};

export const SoftwarePage = () => {
  const resources = useRemote(async () => (await api.get('/resources/software')).data as Array<Record<string, unknown>>, [], []);
  const people = useRemote(async () => (await api.get('/people', { params: { pageSize: 50 } })).data.items as Array<Record<string, string>>, [], []);
  const [resourceForm, setResourceForm] = useState({ name: '', slug: '', licenseType: 'Standard' });
  const [assignmentForm, setAssignmentForm] = useState({ resourceId: '', personId: '', startDate: '', endDate: '' });

  return (
    <div className="page-stack">
      <PageIntro title="Acces logiciels" description="Attributions, renouvellements et revocations des licences et outils metier." />
      <Panel title="Ressources logicielles">
        <DataTable rows={resources.data} columns={[
          { header: 'Ressource', render: (item) => String(item.name) },
          { header: 'Licence', render: (item) => String(item.licenseType) },
          { header: 'Affectations', render: (item) => String((item.assignments as Array<unknown> | undefined)?.length ?? 0) },
        ]} />
      </Panel>
      <div className="content-grid two-columns">
        <Panel title="Ajouter une ressource">
          <form className="stack-form" onSubmit={(event) => {
            event.preventDefault();
            void api.post('/resources/software', resourceForm).then(() => {
              setResourceForm({ name: '', slug: '', licenseType: 'Standard' });
              return resources.reload();
            });
          }}>
            <FormField label="Nom"><input value={resourceForm.name} onChange={(event) => setResourceForm((current) => ({ ...current, name: event.target.value }))} /></FormField>
            <FormField label="Slug"><input value={resourceForm.slug} onChange={(event) => setResourceForm((current) => ({ ...current, slug: event.target.value }))} /></FormField>
            <FormField label="Type de licence"><input value={resourceForm.licenseType} onChange={(event) => setResourceForm((current) => ({ ...current, licenseType: event.target.value }))} /></FormField>
            <button type="submit" className="primary-button">Ajouter</button>
          </form>
        </Panel>
        <Panel title="Creer une attribution">
          <form className="stack-form" onSubmit={(event) => {
            event.preventDefault();
            void api.post('/software-assignments', assignmentForm).then(() => {
              setAssignmentForm({ resourceId: '', personId: '', startDate: '', endDate: '' });
              return resources.reload();
            });
          }}>
            <FormField label="Ressource">
              <select value={assignmentForm.resourceId} onChange={(event) => setAssignmentForm((current) => ({ ...current, resourceId: event.target.value }))}>
                <option value="">Selectionner</option>
                {resources.data.map((item) => <option key={String(item.id ?? '')} value={String(item.id ?? '')}>{String(item.name ?? '')}</option>)}
              </select>
            </FormField>
            <FormField label="Personne">
              <select value={assignmentForm.personId} onChange={(event) => setAssignmentForm((current) => ({ ...current, personId: event.target.value }))}>
                <option value="">Selectionner</option>
                {people.data.map((item) => <option key={item.id ?? ''} value={item.id ?? ''}>{item.firstName ?? ''} {item.lastName ?? ''}</option>)}
              </select>
            </FormField>
            <FormField label="Debut"><input type="datetime-local" value={assignmentForm.startDate} onChange={(event) => setAssignmentForm((current) => ({ ...current, startDate: event.target.value }))} /></FormField>
            <FormField label="Fin"><input type="datetime-local" value={assignmentForm.endDate} onChange={(event) => setAssignmentForm((current) => ({ ...current, endDate: event.target.value }))} /></FormField>
            <button type="submit" className="primary-button">Attribuer</button>
          </form>
        </Panel>
      </div>
    </div>
  );
};

export const InformationPage = () => {
  const resources = useRemote(async () => (await api.get('/resources/information')).data as Array<Record<string, unknown>>, [], []);
  const people = useRemote(async () => (await api.get('/people', { params: { pageSize: 50 } })).data.items as Array<Record<string, string>>, [], []);
  const [resourceForm, setResourceForm] = useState({ name: '', slug: '', resourceType: 'Teams' });
  const [assignmentForm, setAssignmentForm] = useState({ resourceId: '', personId: '', startDate: '' });

  return (
    <div className="page-stack">
      <PageIntro title="Acces information" description="Groupes Teams, listes de diffusion et espaces documentaires." />
      <Panel title="Ressources informationnelles">
        <DataTable rows={resources.data} columns={[
          { header: 'Ressource', render: (item) => String(item.name) },
          { header: 'Type', render: (item) => String(item.resourceType) },
          { header: 'Affectations', render: (item) => String((item.assignments as Array<unknown> | undefined)?.length ?? 0) },
        ]} />
      </Panel>
      <div className="content-grid two-columns">
        <Panel title="Ajouter une ressource">
          <form className="stack-form" onSubmit={(event) => {
            event.preventDefault();
            void api.post('/resources/information', resourceForm).then(() => {
              setResourceForm({ name: '', slug: '', resourceType: 'Teams' });
              return resources.reload();
            });
          }}>
            <FormField label="Nom"><input value={resourceForm.name} onChange={(event) => setResourceForm((current) => ({ ...current, name: event.target.value }))} /></FormField>
            <FormField label="Slug"><input value={resourceForm.slug} onChange={(event) => setResourceForm((current) => ({ ...current, slug: event.target.value }))} /></FormField>
            <FormField label="Type"><input value={resourceForm.resourceType} onChange={(event) => setResourceForm((current) => ({ ...current, resourceType: event.target.value }))} /></FormField>
            <button type="submit" className="primary-button">Ajouter</button>
          </form>
        </Panel>
        <Panel title="Creer une attribution">
          <form className="stack-form" onSubmit={(event) => {
            event.preventDefault();
            void api.post('/information-assignments', assignmentForm).then(() => {
              setAssignmentForm({ resourceId: '', personId: '', startDate: '' });
              return resources.reload();
            });
          }}>
            <FormField label="Ressource">
              <select value={assignmentForm.resourceId} onChange={(event) => setAssignmentForm((current) => ({ ...current, resourceId: event.target.value }))}>
                <option value="">Selectionner</option>
                {resources.data.map((item) => <option key={String(item.id ?? '')} value={String(item.id ?? '')}>{String(item.name ?? '')}</option>)}
              </select>
            </FormField>
            <FormField label="Personne">
              <select value={assignmentForm.personId} onChange={(event) => setAssignmentForm((current) => ({ ...current, personId: event.target.value }))}>
                <option value="">Selectionner</option>
                {people.data.map((item) => <option key={item.id ?? ''} value={item.id ?? ''}>{item.firstName ?? ''} {item.lastName ?? ''}</option>)}
              </select>
            </FormField>
            <FormField label="Debut"><input type="datetime-local" value={assignmentForm.startDate} onChange={(event) => setAssignmentForm((current) => ({ ...current, startDate: event.target.value }))} /></FormField>
            <button type="submit" className="primary-button">Attribuer</button>
          </form>
        </Panel>
      </div>
    </div>
  );
};

export const DocumentsPage = () => {
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState('');
  const documents = useRemote(async () => (await api.get('/documents')).data as Array<Record<string, unknown>>, [], []);
  const people = useRemote(async () => (await api.get('/people', { params: { pageSize: 50 } })).data.items as Array<Record<string, string>>, [], []);
  const selectedDocument = useRemote(async () => selectedId ? (await api.get(`/documents/${selectedId}`)).data as Record<string, unknown> : null, [selectedId], null as Record<string, unknown> | null);
  const [documentForm, setDocumentForm] = useState({ code: '', title: '', categoryId: '', versionLabel: 'v1', contentMarkdown: '' });
  const [assignForm, setAssignForm] = useState({ documentId: '', personIds: [] as string[] });
  const [signing, setSigning] = useState(false);

  const categories = selectedDocument.data?.category ? [selectedDocument.data.category as Record<string, string>] : [];

  return (
    <div className="page-stack">
      <PageIntro title="Documents" description="Publication, assignation et signature interne des documents obligatoires." />
      <Panel title="Catalogue documentaire">
        <DataTable rows={documents.data} columns={[
          { header: 'Titre', render: (item) => <button type="button" className="link-button" onClick={() => setSelectedId(String(item.id))}>{String(item.title)}</button> },
          { header: 'Categorie', render: (item) => String((item.category as Record<string, string> | undefined)?.label ?? '-') },
          { header: 'Version', render: (item) => String((item.currentVersion as Record<string, string> | undefined)?.versionLabel ?? '-') },
        ]} />
      </Panel>
      {selectedDocument.data ? (
        <Panel title="Detail du document">
          <DocumentViewer
            title={String(selectedDocument.data.title)}
            content={String((selectedDocument.data.currentVersion as Record<string, string> | undefined)?.contentMarkdown ?? 'Aucun contenu')}
          />
          <SignaturePanel
            canSign={Boolean(user?.permissions.includes('documents:sign'))}
            isBusy={signing}
            onSign={() => {
              setSigning(true);
              void api.post(`/documents/${selectedDocument.data?.id}/sign`, {}).then(() => documents.reload()).finally(() => setSigning(false));
            }}
          />
        </Panel>
      ) : null}
      <div className="content-grid two-columns">
        <Panel title="Creer un document">
          {categories.length === 0 ? <EmptyState title="Categorie requise" message="Selectionnez un document existant pour reprendre une categorie, ou utilisez l'API admin si besoin." /> : null}
          <form className="stack-form" onSubmit={(event) => {
            event.preventDefault();
            void api.post('/documents', {
              ...documentForm,
              categoryId: documentForm.categoryId || categories[0]?.id,
              valueType: 'ORGANISATIONNELLE',
            }).then(() => {
              setDocumentForm({ code: '', title: '', categoryId: '', versionLabel: 'v1', contentMarkdown: '' });
              return documents.reload();
            });
          }}>
            <FormField label="Code"><input value={documentForm.code} onChange={(event) => setDocumentForm((current) => ({ ...current, code: event.target.value }))} /></FormField>
            <FormField label="Titre"><input value={documentForm.title} onChange={(event) => setDocumentForm((current) => ({ ...current, title: event.target.value }))} /></FormField>
            <FormField label="Version"><input value={documentForm.versionLabel} onChange={(event) => setDocumentForm((current) => ({ ...current, versionLabel: event.target.value }))} /></FormField>
            <FormField label="Contenu"><textarea rows={6} value={documentForm.contentMarkdown} onChange={(event) => setDocumentForm((current) => ({ ...current, contentMarkdown: event.target.value }))} /></FormField>
            <button type="submit" className="primary-button">Publier</button>
          </form>
        </Panel>
        <Panel title="Assigner un document">
          <form className="stack-form" onSubmit={(event) => {
            event.preventDefault();
            void api.post(`/documents/${assignForm.documentId}/assign`, { personIds: assignForm.personIds }).then(() => documents.reload());
          }}>
            <FormField label="Document">
              <select value={assignForm.documentId} onChange={(event) => setAssignForm((current) => ({ ...current, documentId: event.target.value }))}>
                <option value="">Selectionner</option>
                {documents.data.map((item) => <option key={String(item.id ?? '')} value={String(item.id ?? '')}>{String(item.title ?? '')}</option>)}
              </select>
            </FormField>
            <FormField label="Personnes">
              <select multiple value={assignForm.personIds} onChange={(event) => setAssignForm((current) => ({ ...current, personIds: Array.from(event.target.selectedOptions).map((option) => option.value) }))}>
                {people.data.map((item) => <option key={item.id ?? ''} value={item.id ?? ''}>{item.firstName ?? ''} {item.lastName ?? ''}</option>)}
              </select>
            </FormField>
            <button type="submit" className="primary-button">Assigner</button>
          </form>
        </Panel>
      </div>
    </div>
  );
};

export const MePage = () => {
  const profile = useRemote(async () => (await api.get('/people/me/profile')).data as Record<string, string>, [], {} as Record<string, string>);
  const accesses = useRemote(async () => (await api.get('/people/me/accesses')).data as Record<string, Array<Record<string, string>>>, [], { material: [], software: [], information: [] });
  const documents = useRemote(async () => (await api.get('/documents/me/documents')).data as Array<Record<string, string>>, [], []);
  const signatures = useRemote(async () => (await api.get('/documents/me/signatures')).data as Array<Record<string, string>>, [], []);

  return (
    <div className="page-stack">
      <PageIntro title="Mon espace" description="Mon profil, mes acces, mes documents et mes engagements." />
      <div className="content-grid two-columns">
        <Panel title="Profil">
          <dl className="definition-list">
            <div><dt>Nom</dt><dd>{profile.data.firstName} {profile.data.lastName}</dd></div>
            <div><dt>Email</dt><dd>{profile.data.emailProfessional}</dd></div>
            <div><dt>Poste</dt><dd>{profile.data.position}</dd></div>
            <div><dt>Region</dt><dd>{profile.data.region}</dd></div>
          </dl>
        </Panel>
        <Panel title="Documents a traiter">
          <DataTable rows={documents.data} columns={[
            { header: 'Titre', render: (item) => item.documentTitle },
            { header: 'Version', render: (item) => item.versionLabel },
            { header: 'Statut', render: (item) => <StatusBadge value={String(item.status ?? '')} /> },
          ]} />
        </Panel>
      </div>
      <div className="content-grid two-columns">
        <Panel title="Mes acces">
          <p>Materiel: {(accesses.data.material ?? []).length}</p>
          <p>Logiciels: {(accesses.data.software ?? []).length}</p>
          <p>Informations: {(accesses.data.information ?? []).length}</p>
        </Panel>
        <Panel title="Mes signatures">
          <DataTable rows={signatures.data} columns={[
            { header: 'Document', render: (item) => item.documentTitle },
            { header: 'Version', render: (item) => item.versionLabel },
            { header: 'Date', render: (item) => new Date(item.signedAt ?? '').toLocaleString('fr-FR') },
          ]} />
        </Panel>
      </div>
    </div>
  );
};

export const WorkflowsPage = () => {
  const onboardings = useRemote(async () => (await api.get('/onboarding')).data as Array<Record<string, string>>, [], []);
  const offboardings = useRemote(async () => (await api.get('/offboarding')).data as Array<Record<string, string>>, [], []);
  const people = useRemote(async () => (await api.get('/people', { params: { pageSize: 50 } })).data.items as Array<Record<string, string>>, [], []);
  const [onboardingPersonId, setOnboardingPersonId] = useState('');
  const [offboardingPersonId, setOffboardingPersonId] = useState('');

  return (
    <div className="page-stack">
      <PageIntro title="Workflows" description="Suivi des parcours onboarding et offboarding avec checklists visuelles." />
      <div className="content-grid two-columns">
        <Panel title="Onboardings">
          <DataTable rows={onboardings.data} columns={[
            { header: 'Personne', render: (item) => item.personName },
            { header: 'Statut', render: (item) => <StatusBadge value={String(item.status ?? '')} /> },
            { header: 'Progression', render: (item) => `${item.progress}%` },
          ]} />
          <form className="inline-form" onSubmit={(event) => {
            event.preventDefault();
            void api.post('/onboarding', { personId: onboardingPersonId }).then(() => {
              setOnboardingPersonId('');
              return onboardings.reload();
            });
          }}>
            <select value={onboardingPersonId} onChange={(event) => setOnboardingPersonId(event.target.value)}>
              <option value="">Nouvel onboarding</option>
              {people.data.map((item) => <option key={item.id ?? ''} value={item.id ?? ''}>{item.firstName ?? ''} {item.lastName ?? ''}</option>)}
            </select>
            <button type="submit" className="primary-button">Creer</button>
          </form>
        </Panel>
        <Panel title="Offboardings">
          <DataTable rows={offboardings.data} columns={[
            { header: 'Personne', render: (item) => item.personName },
            { header: 'Statut', render: (item) => <StatusBadge value={String(item.status ?? '')} /> },
            { header: 'Progression', render: (item) => `${item.progress}%` },
          ]} />
          <form className="inline-form" onSubmit={(event) => {
            event.preventDefault();
            void api.post('/offboarding', { personId: offboardingPersonId }).then(() => {
              setOffboardingPersonId('');
              return offboardings.reload();
            });
          }}>
            <select value={offboardingPersonId} onChange={(event) => setOffboardingPersonId(event.target.value)}>
              <option value="">Nouvel offboarding</option>
              {people.data.map((item) => <option key={item.id ?? ''} value={item.id ?? ''}>{item.firstName ?? ''} {item.lastName ?? ''}</option>)}
            </select>
            <button type="submit" className="primary-button">Creer</button>
          </form>
        </Panel>
      </div>
    </div>
  );
};

export const AdminPage = () => {
  const roles = useRemote(async () => (await api.get('/roles')).data as Array<Record<string, unknown>>, [], []);
  const permissions = useRemote(async () => (await api.get('/permissions')).data as Array<Record<string, string>>, [], []);
  const connectors = useRemote(async () => (await api.get('/integrations/connectors')).data as Array<Record<string, unknown>>, [], []);
  const readiness = useRemote(async () => (await api.get('/integrations/connectors/readiness')).data as Record<string, unknown>, [], {});

  return (
    <div className="page-stack">
      <PageIntro title="Administration" description="Roles, permissions, connecteurs mock et paramètres d'architecture." />
      <div className="content-grid three-columns">
        <Panel title="Roles">
          <DataTable rows={roles.data} columns={[
            { header: 'Role', render: (item) => String(item.name) },
            { header: 'Permissions', render: (item) => String((item.permissions as Array<unknown> | undefined)?.length ?? 0) },
          ]} />
        </Panel>
        <Panel title="Permissions">
          <DataTable rows={permissions.data} columns={[{ header: 'Code', render: (item) => item.code }]} />
        </Panel>
        <Panel title="Readiness">
          <dl className="definition-list">
            <div><dt>Mode mock</dt><dd>{String(readiness.data.mockConnectorsEnabled ?? false)}</dd></div>
            <div><dt>Strategie annuaire</dt><dd>{String(readiness.data.directorySyncStrategy ?? '-')}</dd></div>
            <div><dt>Graph</dt><dd>{String(readiness.data.graphBaseUrl ?? '-')}</dd></div>
          </dl>
        </Panel>
      </div>
      <Panel title="Connecteurs">
        <DataTable rows={connectors.data} columns={[
          { header: 'Nom', render: (item) => String(item.name) },
          { header: 'Type', render: (item) => String(item.type) },
          { header: 'Statut', render: (item) => <StatusBadge value={String(item.status)} /> },
        ]} />
      </Panel>
    </div>
  );
};

export const AuditPage = () => {
  const audit = useRemote(async () => (await api.get('/audit-logs')).data as { items: Array<Record<string, unknown>> }, [], { items: [] });

  return (
    <div className="page-stack">
      <PageIntro title="Audit" description="Journalisation des connexions, changements de droits et actions sensibles." />
      {audit.error ? <ErrorState message={audit.error} onRetry={() => void audit.reload()} /> : null}
      <Panel title="Chronologie">
        <AuditTimeline items={audit.data.items} />
      </Panel>
    </div>
  );
};

export const NotificationsPage = ({ compact = false }: { compact?: boolean }) => {
  const notifications = useRemote(async () => (await api.get('/notifications')).data as Array<Record<string, unknown>>, [], []);

  const content = (
    <Panel title={compact ? 'Notifications recentes' : 'Centre de notifications'}>
      <DataTable rows={notifications.data} columns={[
        { header: 'Titre', render: (item) => String(item.title) },
        { header: 'Type', render: (item) => <StatusBadge value={String(item.type)} /> },
        { header: 'Statut', render: (item) => <StatusBadge value={String(item.isRead ? 'LUE' : 'A TRAITER')} /> },
        {
          header: 'Action',
          render: (item) =>
            item.isRead ? (
              'Deja lue'
            ) : (
              <button type="button" className="secondary-button" onClick={() => void api.patch(`/notifications/${String(item.id)}/read`).then(() => notifications.reload())}>
                Marquer comme lue
              </button>
            ),
        },
      ]} />
    </Panel>
  );

  if (compact) {
    return content;
  }

  return (
    <div className="page-stack">
      <PageIntro title="Notifications" description="Alertes internes liées aux documents, échéances et workflows en attente." />
      {content}
    </div>
  );
};
