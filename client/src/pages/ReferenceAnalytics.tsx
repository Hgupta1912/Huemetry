import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { apiRequest } from '../utils/api';
import BoxPlot from '../components/charts/BoxPlot';
import Histogram from '../components/charts/Histogram';
import PaletteChart from '../components/charts/PaletteChart';
import LoadingPage from './LoadingPage';
import ErrorPage from './ErrorPage';
import { describeTemperatureScore, describeSpread } from './SessionAnalytics';

const TABS = ['Hue', 'Saturation', 'Value'] as const;
type Tab = (typeof TABS)[number];

interface Color {
  hex: string;
  weight: number;
  hue: number;
  saturation: number;
  value: number;
  tonalRange: 'overall' | 'shadow' | 'midtone' | 'highlight';
}

export default function ReferenceAnalytics() {
  const params = useParams();
  const isPublicView = Boolean(params.username);
  const projectId = isPublicView ? params.projectId : params.id;
  const username = params.username;

  const [reference, setReference] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('Hue');
  const hasSetDefaultTab = useRef(false);


  useEffect(() => {
    // There's no dedicated public "reference only" endpoint yet.
    // for the public path this pulls the reference off the full public
    // project detail response instead. Worth adding a lean, dedicated
    // public reference endpoint later if this proves wasteful.
    const url = isPublicView
      ? `/api/users/${username}/projects/${projectId}`
      : `/api/projects/${projectId}/reference`;

    apiRequest(url)
      .then((data) => setReference(isPublicView ? data.reference : data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isPublicView, username, projectId]);

  useEffect(() => {
    if (!reference?.statistics || hasSetDefaultTab.current) return;
    if (!reference.statistics.saturation) setTab('Value');
    hasSetDefaultTab.current = true;
  }, [reference]);

  if (loading) return <LoadingPage />;
  if (error) return <ErrorPage title="Something went wrong" message="We're having trouble loading this reference's analytics." />;
  if (!reference) return <ErrorPage />;

  const colorsByTone = (tone: Color['tonalRange']) =>
    (reference.colors as Color[]).filter((c) => c.tonalRange === tone);

  const stats = reference.statistics;
  const isMonochrome = !stats?.saturation;
  const visibleTabs = TABS.filter((t) => !((t === 'Hue' || t === 'Saturation') && isMonochrome));

  return (
    <main className="px-4 py-6 h-full overflow-y-auto">
      <h1 className="font-display text-3xl uppercase text-ink mb-2">Reference Analytics</h1>
      <img src={reference.imageUrl} alt="" className="w-full aspect-auto object-cover mb-4" />

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

      {tab === 'Hue' && stats && !isMonochrome && (
        <div className="flex flex-col gap-6">
          <PaletteChart colors={colorsByTone('overall')} title="Overall Palette" size="large" />
          <div className="grid grid-cols-3 gap-2">
            <PaletteChart colors={colorsByTone('shadow')} title="Shadows" size="small" />
            <PaletteChart colors={colorsByTone('midtone')} title="Midtones" size="small" />
            <PaletteChart colors={colorsByTone('highlight')} title="Highlights" size="small" />
          </div>

          {stats.histograms?.hue && <Histogram bins={stats.histograms.hue} binWidth={10} label="Hue" colorCodedTicks />}

          {stats.temperature && (
            <div className="bg-gray-100 px-4 py-3">
              <p className="text-sm text-ink">Temperature Score: <span className="font-semibold">{stats.temperature.score.toFixed(2)}</span></p>
              <p className="text-sm text-ink">Spread (Std. Dev.): <span className="font-semibold">{stats.temperature.standardDeviation.toFixed(2)}</span></p>
              <p className="text-sm text-ink">
                This reference reads as <span className="font-semibold">{describeTemperatureScore(stats.temperature.score)}</span> ({stats.temperature.score.toFixed(2)}), with <span className="font-semibold">{describeSpread(stats.temperature.standardDeviation)}</span> color temperature throughout (spread: {stats.temperature.standardDeviation.toFixed(2)}).
              </p>
            </div>
          )}
        </div>
      )}

      {tab === 'Saturation' && stats?.saturation && (
        <div className="flex flex-col gap-6">
          <BoxPlot data={[{ label: 'Reference', ...stats.saturation }]} yAxisLabel="Saturation" />
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
          <BoxPlot data={[{ label: 'Reference', ...stats.value }]} yAxisLabel="Value" />
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
    </main>
  );
}

function outlierPercentage(outlierCount: number, histogramBins: number[]): number {
  const totalPixels = histogramBins.reduce((sum, count) => sum + count, 0);
  return totalPixels > 0 ? (outlierCount / totalPixels) * 100 : 0;
}
