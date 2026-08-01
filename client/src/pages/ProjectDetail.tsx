import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { useProject } from '../hooks/useProject';
import { usePublicProject } from '../hooks/usePublicProject';
import LoadingPage from './LoadingPage';
import ErrorPage from './ErrorPage';
import { apiRequest } from '../utils/api';
import TrendLine from '../components/charts/TrendLine';
import BoxPlot from '../components/charts/BoxPlot';
import TimeBarChart from '../components/charts/TimeBarChart';

export default function ProjectDetail() {
  const navigate = useNavigate();
  const { id, username, projectId } = useParams();
  const isPublicView = Boolean(username);

  const ownResult = useProject(isPublicView ? undefined : id);
  const publicResult = usePublicProject(isPublicView ? username : undefined, isPublicView ? projectId : undefined);

  const { project, loading, error, refetch } = isPublicView ? publicResult : ownResult;

  const [tab, setTab] = useState<'sessions' | 'analytics'>('sessions');

  const handleRemoveReference = async () => {
    await apiRequest(`/api/projects/${id}/reference`, { method: 'DELETE' });
    refetch();
  };

  if (loading) return <LoadingPage />;
  if (error) return <ErrorPage title="Something went wrong" message="We're having trouble loading this project." />;
  if (!project) return <ErrorPage />;

  return (
    <main className="px-4 py-6 overflow-y-auto h-full">
      <div className="flex items-start justify-between mb-1">
        <h1 className={`${isPublicView ? "max-w-full": "max-w-[70%]"} overflow-y-hidden overflow-x-auto whitespace-nowrap font-display text-3xl uppercase text-ink`}>{project.title}</h1>
        {!isPublicView && (
          <span className={`px-2 py-1 text-xs font-display uppercase whitespace-nowrap flex-shrink-0 ${project.isFinalized ? 'bg-cyan-true/50' : 'bg-yellow-true/50'}`}>
            {project.isFinalized ? 'Finished' : 'In Progress'}
          </span>
        )}
      </div>

      <div className="flex items-start justify-between mb-1">
         <p className="text-sm text-gray-500 mb-1">{project.mediums.join(', ')}{project.substrates?.length > 0 && ( <span className="text-sm text-gray-500 mb-1"> on {project.substrates.join(', ')}</span> )}</p>
         {!isPublicView && (
            <div className="flex justify-end mb-2">
              <Link to={`/projects/${project.id}/edit`} className="text-xs text-gray-600 underline">
                Edit Project
              </Link>
            </div>
          )} 
      </div>
      
      
      <p className="text-sm text-gray-500 mb-2">{project.genres?.join(', ')}</p>
      {project.dimensions?.length > 0 && (
        <p className="text-sm text-gray-500 mb-1">
          {project.dimensions.join(' × ')} in
        </p>
      )}
      {project.collaborators?.length > 0 && (
        <p className="text-sm text-gray-500 mb-6">Collaborators: {project.collaborators.join(', ')}</p>
      )}

      <br/>

      {!isPublicView && !project.isFinalized && (
        <Link
          to={`/projects/${project.id}/log-session`}
          className="block text-center py-3 font-display uppercase tracking-wide text-ink bg-yellow-true/50 active:bg-blend-red transition-colors mb-6"
        >
          Log a Session
        </Link>
      )}

      {project.isRealism && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-xl uppercase text-ink">Reference</h2>
            {!isPublicView && project.reference && (
              <button
                onClick={handleRemoveReference}
                className="text-xs text-gray-600 underline"
              >
                Remove / Change
              </button>
            )}
          </div>
          {project.reference ? (
            <>
              <img src={project.reference.imageUrl} alt="Reference" className="w-3/4 mx-auto aspect-auto object-cover" />
              <Link
                to={isPublicView ? `/artists/${username}/projects/${project.id}/reference/analytics` : `/projects/${project.id}/reference/analytics`}
                className="text-xs text-gray-600 underline block text-center mt-2"
              >
                View Reference Analytics
              </Link>
            </>
          ) : (
            !isPublicView && (
              <Link
                to={`/projects/${project.id}/reference`}
                className="block text-center py-3 font-display uppercase text-sm text-ink bg-cyan-true/50 active:bg-blend-blue transition-colors"
              >
                Add Reference Photo
              </Link>
            )
          )}
        </div>
      )}

      <div className="flex mb-4">
        <button
          type="button"
          onClick={() => setTab('sessions')}
          className={`flex-1 py-2 font-display uppercase text-sm text-ink ${tab === 'sessions' ? 'bg-yellow-true/50' : 'bg-gray-100 text-gray-500'}`}
        >
          Sessions
        </button>
        <button
          type="button"
          onClick={() => setTab('analytics')}
          className={`flex-1 py-2 font-display uppercase text-sm text-ink ${tab === 'analytics' ? 'bg-yellow-true/50' : 'bg-gray-100 text-gray-500'}`}
        >
          Analytics
        </button>
      </div>

      {tab === 'sessions' && (
        <>
          {project.artSessions.length === 0 ? (
            <p className="text-gray-500 text-sm">No sessions logged yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {project.artSessions.map((session: any) => (
                <div
                  key={session.id}
                  onClick={() =>
                    navigate(
                      isPublicView
                        ? `/artists/${username}/projects/${project.id}/sessions/${session.id}`
                        : `/projects/${project.id}/sessions/${session.id}`
                    )
                  }
                  className="relative flex gap-3 cursor-pointer"
                >
                  <img src={session.imageUrl} alt="" className="w-32 h-32 object-cover flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-ink">
                        {new Date(session.loggedAt).toLocaleDateString()}
                        {session.isFinal && <span className="ml-2 text-xs bg-cyan-true/50 px-1.5 py-0.5">Final</span>}
                      </p>
                      {!isPublicView && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/projects/${project.id}/sessions/${session.id}/edit`);
                          }}
                          className="text-xs text-gray-600 underline flex-shrink-0"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    {session.hoursSpent != null && <p className="text-xs text-gray-500">{session.hoursSpent} hrs</p>}
                    {session.comments && <p className="text-xs text-gray-600 italic">{session.comments}</p>}
                  </div>
                  <span className="absolute bottom-0 right-0 text-xs font-display uppercase text-ink bg-yellow-true/50 px-2 py-1">
                    Analytics
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'analytics' && <ProjectAnalyticsTab sessions={project.artSessions} isMonochrome={project.isMonochrome}/>}
    </main>
  );
}








function ProjectAnalyticsTab({ sessions, isMonochrome }: { sessions: any[]; isMonochrome:boolean }) {
  const allSubTabs = ['Time', 'Hue', 'Saturation', 'Value', 'Comparative'] as const;
  type SubTab = (typeof allSubTabs)[number];

  const [subTab, setSubTab] = useState<SubTab>('Time');

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime()
  );

  const withStats = sorted.filter((s) => s.statistics);
  const withComparison = sorted.filter((s) => s.comparedToReference);

  const subTabs = allSubTabs.filter((t) => {
    if (t === 'Comparative') return withComparison.length > 0;
    if ((t === 'Hue' || t === 'Saturation') && isMonochrome) return false;
    return true;
  });
    

  // --- Time tab data --- fix!! instead of excluding null hoursspent fields, make em an error bar...
const hoursData = sorted.map((s) => ({
  date: formatShortDate(s.loggedAt), // was: new Date(s.logegdAt)
  value: s.hoursSpent != null ? s.hoursSpent : 0.15, // small visible sliver, not zero-height
  hasData: s.hoursSpent != null,
  actualValue: s.hoursSpent,
}));
  const totalHours = hoursData.reduce((sum, d) => sum + (d.hasData ? d.value : 0), 0);
  const avgHours = hoursData.length > 0 ? totalHours / hoursData.filter((d) => d.hasData).length : 0;

  // --- Hue tab data ---
  const temperatureTrend = withStats
    .filter((s) => s.statistics.temperature)
    .map((s) => ({ date: formatShortDate(s.loggedAt), value: s.statistics.temperature.score }));
  const referenceTemperature = withComparison.length > 0 && withComparison[0].statistics.temperature
  ? withComparison[0].statistics.temperature.score - withComparison[0].comparedToReference.temperature.delta
  : undefined;


  // --- Saturation / Value tab data ---
  const saturationBoxData = withStats
    .filter((s) => s.statistics.saturation)
    .map((s) => ({ label: formatShortDate(s.loggedAt), ...s.statistics.saturation }));
  const saturationRangeTrend = saturationBoxData.map((d) => ({ date: d.label, value: d.whiskerHigh - d.whiskerLow }));

  const valueBoxData = withStats
    .filter((s) => s.statistics.value)
    .map((s) => ({ label: formatShortDate(s.loggedAt), ...s.statistics.value }));
  const ValueRangeTrend = valueBoxData.map((d) => ({ date: d.label, value: d.whiskerHigh - d.whiskerLow }));

  // --- Comparative tab data ---
  const saturationDeltaTrend = withComparison
    .filter((s) => s.comparedToReference.saturation)
    .map((s) => ({ date: formatShortDate(s.loggedAt), value: s.comparedToReference.saturation.delta }));

  const valueDeltaTrend = withComparison
    .filter((s) => s.comparedToReference.value)
    .map((s) => ({ date: formatShortDate(s.loggedAt), value: s.comparedToReference.value.delta }));

  return (
    <div>
      <div className="flex mb-4 flex-wrap">
        {subTabs.map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`flex-1 py-2 font-display uppercase text-xs text-ink ${subTab === t ? 'bg-cyan-true/50' : 'bg-gray-100 text-gray-500'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {subTab === 'Time' && (
        <div className="flex flex-col gap-4">
          {hoursData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center">No hours logged yet.</p>
          ) : (
            <>
              <TimeBarChart data={hoursData} />
              <div className="bg-gray-100 px-4 py-3 grid grid-cols-2 gap-2">
                <p className="text-sm text-ink">Total Hours: <span className="font-semibold">{totalHours.toFixed(1)}</span></p>
                <p className="text-sm text-ink">Avg. Hours / Session: <span className="font-semibold">{avgHours.toFixed(1)}</span></p>
              </div>
            </>
          )}
        </div>
      )}

      {subTab === 'Hue' && (
        <div className="flex flex-col gap-4">
          {temperatureTrend.length === 0 ? (
            <p className="text-sm text-gray-500 text-center">Not enough data yet.</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-ink text-center mb-1">Temperature Over Time</p>
              <TrendLine
                data={temperatureTrend}
                label="Temperature Score"
                domain={[-1, 1]}
                color="#00FFFF"
                referenceValue={referenceTemperature}
                referenceLabel="Reference"
              />
            </>
          )}
        </div>
      )}

      {subTab === 'Saturation' && (
        <div className="flex flex-col gap-4 text-center">
          {saturationBoxData.length === 0 ? (
            <p className="text-sm text-gray-500 ">Not enough data yet.</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-ink text-center mb-1">Saturation Over Time</p>
              <BoxPlot data={saturationBoxData} yAxisLabel="Saturation (0 - 100)" />
              <div className="bg-gray-100 px-4 py-3 text-center">
                <p className="text-sm text-ink">Range Trend: <span className="font-semibold capitalize">{describeTrendDirection(saturationRangeTrend)}</span></p>
              </div>
            </>
          )}
        </div>
      )}

      {subTab === 'Value' && (
        <div className="flex flex-col gap-4">
          {valueBoxData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center">Not enough data yet.</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-ink text-center mb-1">Value Over Time</p>
              <BoxPlot data={valueBoxData} yAxisLabel="Value (0 - 100)" />
              <div className="bg-gray-100 px-4 py-3 text-center">
                <p className="text-sm text-ink">Range Trend: <span className="font-semibold capitalize">{describeTrendDirection(ValueRangeTrend)}</span></p>
              </div>
            </>
          )}
        </div>
      )}

      {subTab === 'Comparative' && (
        <div className="flex flex-col gap-6">
          {saturationDeltaTrend.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-ink text-center mb-1">Saturation Fidelity to Reference Over Time</p>
              <TrendLine data={saturationDeltaTrend} label="Saturation Delta" color="#0fe1e1d9" />
            </div>
          )}
          <p className="text-xs text-gray-500 text-center">
            This compares the median {isMonochrome ? 'value' : 'saturation and value'} of each session against your reference's median (the closer to zero, the more closely matched).
          </p>
          <div>
            <p className="text-sm font-semibold text-ink text-center mb-1">Value Fidelity to Reference Over Time</p>
            <TrendLine data={valueDeltaTrend} label="Value Delta" color="#d613d6df" />
          </div>
        </div>
      )}
    </div>
  );
}

// simple Msecant implementation, but it'll do
function describeTrendDirection(points: { date: string; value: number }[]): string {
  if (points.length < 2) return 'not enough data';
  const first = points[0].value;
  const last = points[points.length - 1].value;
  const diff = last - first;
  if (Math.abs(diff) < 0.05 * Math.abs(first || 1)) return 'roughly stable';
  return diff > 0 ? 'growing' : 'shrinking';
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // "Jul 24"
}

