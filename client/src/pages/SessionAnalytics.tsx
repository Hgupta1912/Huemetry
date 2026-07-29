import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { apiRequest } from '../utils/api';
import BoxPlot from '../components/charts/BoxPlot';
import Histogram from '../components/charts/Histogram';
import PaletteChart from '../components/charts/PaletteChart';
import LoadingPage from './LoadingPage';
import ErrorPage from './ErrorPage';
import PaletteMatchRow from '../components/PaletteMatchRow';

const TABS = ['Hue', 'Saturation', 'Value', 'Comparative'] as const;
type Tab = (typeof TABS)[number];

interface Color {
  hex: string;
  weight: number;
  hue: number;
  saturation: number;
  value: number;
  tonalRange: 'overall' | 'shadow' | 'midtone' | 'highlight';
}

export function describeTemperatureScore(score: number): string {
  if (score > 0.5) return 'strongly warm';
  if (score > 0.15) return 'warm';
  if (score > -0.15) return 'neutral';
  if (score > -0.5) return 'cool';
  return 'strongly cool';
}

export function describeSpread(stdDev: number): string {
  if (stdDev < 0.15) return 'very consistent';
  if (stdDev < 0.3) return 'consistent';
  if (stdDev < 0.5) return 'varied';
  return 'highly varied';
}

export default function SessionAnalytics() {
  const params = useParams();
  const isPublicView = Boolean(params.username);
  const projectId = isPublicView ? params.projectId : params.id;
  const sessionId = params.sessionId;
  const username = params.username;

  const [session, setSession] = useState<any>(null);
  const [referenceStats, setReferenceStats] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('Hue');
  const hasSetDefaultTab = useRef(false);


    useEffect(() => {
    const sessionUrl = isPublicView
        ? `/api/users/${username}/projects/${projectId}/sessions/${sessionId}`
        : `/api/projects/${projectId}/sessions/${sessionId}`;

    const referenceUrl = isPublicView
        ? `/api/users/${username}/projects/${projectId}/reference`
        : `/api/projects/${projectId}/reference`;

    apiRequest(sessionUrl)
        .then((sessionData) => {
        setSession(sessionData);
        if (sessionData.comparedToReference) {
            return apiRequest(referenceUrl).then((refData) => setReferenceStats(refData.statistics));
        }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, [isPublicView, username, projectId, sessionId]);

      useEffect(() => {
      if (!session?.statistics || hasSetDefaultTab.current) return;
      if (!session.statistics.saturation) setTab('Value');
      hasSetDefaultTab.current = true;
    }, [session]);

  if (loading) return <LoadingPage />;
  if (error) return <ErrorPage title="Something went wrong" message="We're having trouble loading this session's analytics." />;
  if (!session) return <ErrorPage />;

  const colorsByTone = (tone: Color['tonalRange']) =>
    (session.colors as Color[]).filter((c) => c.tonalRange === tone);

  const stats = session.statistics;

  const hasComparison = Boolean(session.comparedToReference);
  const isMonochrome = !stats?.saturation; // monochrome sessions never have a saturation stat
  const visibleTabs = TABS.filter((t) => {
    if (t === 'Comparative') return hasComparison;
    if ((t === 'Hue' || t === 'Saturation') && isMonochrome) {return false;};
    return true;
  });


  return (
    <main className="px-4 py-6 h-full overflow-y-auto">
      <h1 className="font-display text-3xl uppercase text-ink mb-2">Session Analytics</h1>
      <img src={session.imageUrl} alt="" className="w-full aspect-auto object-cover mb-4" />

      <div className="flex mb-6">
        {visibleTabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 font-display uppercase text-xs text-ink ${tab === t ? 'bg-cyan-true/50' : 'bg-gray-100 text-gray-500'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Hue' && stats && (
        <div className="flex flex-col gap-6">
          <PaletteChart colors={colorsByTone('overall')} title="Overall Palette" size="large" />
          <div className="grid grid-cols-3 gap-2">
            <PaletteChart colors={colorsByTone('shadow')} title="Shadows" size="small" />
            <PaletteChart colors={colorsByTone('midtone')} title="Midtones" size="small" />
            <PaletteChart colors={colorsByTone('highlight')} title="Highlights" size="small" />
          </div>

          {stats.histograms?.hue && <Histogram bins={stats.histograms.hue} binWidth={10} label="Hue" colorCodedTicks={true}/>}

          {stats.temperature && (
            <div className="bg-gray-100 px-4 py-3">
              <p className="text-sm text-ink">Temperature Score: <span className="font-semibold">{stats.temperature.score.toFixed(2)}</span></p>
              <p className="text-sm text-ink">Spread (Std. Dev.): <span className="font-semibold">{stats.temperature.standardDeviation.toFixed(2)}</span></p>
              <p className="text-sm text-ink">
                Your piece reads as <span className="font-semibold">{describeTemperatureScore(stats.temperature.score)}</span> ({stats.temperature.score.toFixed(2)}), with <span className="font-semibold">{describeSpread(stats.temperature.standardDeviation)}</span> color temperature throughout (spread: {stats.temperature.standardDeviation.toFixed(2)}).
              </p>
            </div>
          )}
        </div>
      )}

      {tab === 'Saturation' && stats?.saturation && (
        <div className="flex flex-col gap-6">
          <BoxPlot data={[{ label: 'This Session', ...stats.saturation }]} yAxisLabel="Saturation (1 - 100)"/>
          <p className="text-xs text-gray-500 -mt-4 mb-2 text-center">
            Saturation ranges from 0 (fully gray) to 100 (fully vivid).
          </p>
          <Histogram bins={stats.histograms.saturation} binWidth={4} label="Saturation" />
          <div className="bg-gray-100 px-4 py-3 grid grid-cols-2 gap-2">
            <p className="text-sm text-ink">Median: <span className="font-semibold">{stats.saturation.median.toFixed(1)}</span></p>
            <p className="text-sm text-ink">Q1 / Q3: <span className="font-semibold">{stats.saturation.q1.toFixed(1)} / {stats.saturation.q3.toFixed(1)}</span></p>
            <p className="text-sm text-ink">Min / Max: <span className="font-semibold">{stats.saturation.min.toFixed(1)} / {stats.saturation.max.toFixed(1)}</span></p>
            <p className="text-sm text-ink">Outliers: <span className="font-semibold">{outlierPercentage(stats.saturation.outliers.count, stats.histograms.saturation).toFixed(1)}%</span> of pixels</p>          
          </div>
        </div>
      )}

      {tab === 'Value' && stats?.value && (
        <div className="flex flex-col gap-6">
          <BoxPlot data={[{ label: 'This Session', ...stats.value }]} yAxisLabel="Value (1 - 100)"/>
          <p className="text-xs text-gray-500 -mt-4 mb-2 text-center">
            Value ranges from 0 (black) to 100 (full brightness).
          </p>
          <Histogram bins={stats.histograms.value} binWidth={4} label="Value" />
          <div className="bg-gray-100 px-4 py-3 grid grid-cols-2 gap-2">
            <p className="text-sm text-ink">Median: <span className="font-semibold">{stats.value.median.toFixed(1)}</span></p>
            <p className="text-sm text-ink">Q1 / Q3: <span className="font-semibold">{stats.value.q1.toFixed(1)} / {stats.value.q3.toFixed(1)}</span></p>
            <p className="text-sm text-ink">Min / Max: <span className="font-semibold">{stats.value.min.toFixed(1)} / {stats.value.max.toFixed(1)}</span></p>
            <p className="text-sm text-ink">Outliers: <span className="font-semibold">{outlierPercentage(stats.value.outliers.count, stats.histograms.value).toFixed(1)}%</span> of pixels</p>          
          </div>
        </div>
      )}

      {tab === 'Comparative' && hasComparison && (
        <ComparativeTab comparison={session.comparedToReference} referenceStats={referenceStats} sessionStats={stats} />
      )}
    </main>
  );
}


// Describes a saturation or value delta (0-100 scale) with both magnitude
// and direction, using thresholds proportional to the metric's full range.
export function describeSaturationOrValueDelta(delta: number): string {
  const abs = Math.abs(delta);
  const magnitude =
    abs < 5 ? 'basically the same as'
    : abs < 15 ? (delta > 0 ? 'a little bit more than' : 'a little bit less than')
    : abs < 30 ? (delta > 0 ? 'more than' : 'less than')
    : (delta > 0 ? 'significantly more than' : 'a lot less than');

  if (abs < 5) return magnitude; // "basically the same as" already reads correctly without direction repeated
  return magnitude;
}

// Same idea, scaled for temperature's -1 to 1 range (total span of 2,
// so thresholds are proportionally smaller than the 0-100 metrics above).
export function describeTemperatureDelta(delta: number): string {
  const abs = Math.abs(delta);
  if (abs < 0.1) return 'basically the same as';
  if (abs < 0.3) return delta > 0 ? 'a little bit warmer than' : 'a little bit cooler than';
  if (abs < 0.6) return delta > 0 ? 'warmer than' : 'cooler than';
  return delta > 0 ? 'significantly warmer than' : 'significantly cooler than';
}

const PALETTE_ORDER = ['overall', 'highlight', 'midtone', 'shadow'] as const;

function ComparativeTab({ comparison, referenceStats, sessionStats }: { comparison: any; referenceStats: any; sessionStats: any }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-gray-100 px-4 py-3 grid grid-cols-1 gap-2">
        {comparison.saturation && (
            <p className="text-sm text-ink">
            Saturation is <span className="font-semibold">{describeSaturationOrValueDelta(comparison.saturation.delta)}</span> your reference
            {' '}({comparison.saturation.delta > 0 ? '+' : ''}{comparison.saturation.delta.toFixed(1)})
            </p>
        )}
        {comparison.value && (
            <p className="text-sm text-ink">
            Value is <span className="font-semibold">{describeSaturationOrValueDelta(comparison.value.delta)}</span> your reference
            {' '}({comparison.value.delta > 0 ? '+' : ''}{comparison.value.delta.toFixed(1)})
            </p>
        )}
        {comparison.temperature && (
            <p className="text-sm text-ink">
            Temperature is <span className="font-semibold">{describeTemperatureDelta(comparison.temperature.delta)}</span> your reference
            {' '}({comparison.temperature.delta > 0 ? '+' : ''}{comparison.temperature.delta.toFixed(2)})
            </p>
        )}
      </div>

       {referenceStats && (
          <>
            {sessionStats.histograms.hue && referenceStats.histograms.hue && (
              <>
                <p className="text-xs text-gray-700 px-3 py-2 text-center">Hue comparison:</p>
                <Histogram bins={sessionStats.histograms.hue} compareBins={referenceStats.histograms.hue} binWidth={10} label="Artwork" compareLabel="Reference" colorCodedTicks />
              </>
            )}
            {sessionStats.histograms.saturation && referenceStats.histograms.saturation && (
              <>
                <p className="text-xs text-gray-700 px-3 py-2 text-center">Saturation comparison (0 (fully gray) to 100 (fully vivid)):</p>
                <Histogram bins={sessionStats.histograms.saturation} compareBins={referenceStats.histograms.saturation} binWidth={4} label="Artwork" compareLabel="Reference" />
              </>
            )}
            {sessionStats.histograms.value && referenceStats.histograms.value && (
              <>
                <p className="text-xs text-gray-700 px-3 py-2 text-center">Value comparison (0 (black) to 100 (full brightness)):</p>
                <Histogram bins={sessionStats.histograms.value} compareBins={referenceStats.histograms.value} binWidth={4} label="Artwork" compareLabel="Reference" />
              </>
            )}
          </>
        )}

      <br/>
      
      {comparison.palette.overall &&
        <>
          <p className="text-xs text-gray-500 bg-yellow-true/20 px-3 py-2">
              These comparisons are approximate. The underlying color-extraction algorithm has some inherent randomness, so exact values may shift slightly between runs. Treat this as a general guide, not a precise measurement.
          </p>
          {comparison.palette.overall && PALETTE_ORDER.map((tonalRange) => {
            const match = comparison.palette[tonalRange];
            if (!match) return null;
            return (
                <PaletteMatchRow
                key={tonalRange}
                title={`${tonalRange} Palette`}
                matches={match.matches}
                unmatchedWipColors={match.unmatchedWipColors}
                />
            );
          })}
        </>
      }

    </div>
  );
}

function outlierPercentage(outlierCount: number, histogramBins: number[]): number {
  const totalPixels = histogramBins.reduce((sum, count) => sum + count, 0);
  return totalPixels > 0 ? (outlierCount / totalPixels) * 100 : 0;
}