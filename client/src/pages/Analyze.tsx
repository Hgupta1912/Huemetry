import { useState, type ChangeEvent } from 'react';
import { Link } from 'react-router';
import BoxPlot from '../components/charts/BoxPlot';
import Histogram from '../components/charts/Histogram';
import PaletteChart from '../components/charts/PaletteChart';
import { describeTemperatureScore, describeSpread } from './SessionAnalytics';

const TABS = ['Hue', 'Saturation', 'Value'] as const;
type Tab = (typeof TABS)[number];

interface Color {
  hex: string;
  weight: number;
  hue: number;
  saturation: number;
  value: number;
}

interface AnalyzeResult {
  image: {
    statistics: any;
    palettes: {
      overall: Color[];
      shadow: Color[];
      midtone: Color[];
      highlight: Color[];
    } | null;
  };
}

const API_URL = import.meta.env.VITE_API_URL;

export default function Analyze() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('Hue');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Analysis failed' }));
        throw new Error(err.error || 'Analysis failed');
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const stats = result?.image.statistics;
  const palettes = result?.image.palettes;

  return (
    <main className="px-4 py-6 h-full overflow-y-auto">
      <h1 className="font-display text-3xl uppercase text-ink mb-2">Analyze Artwork</h1>
      <p className="text-gray-600 text-sm mb-6">
        Upload an image to see its color palette and value/saturation breakdown. No account needed.
      </p>

      {!previewUrl && (
        <label className="flex flex-col items-center justify-center gap-2 py-16 bg-cyan-true/20 cursor-pointer">
          <span className="font-display uppercase text-ink">Choose an image</span>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
      )}

      {previewUrl && (
        <div className="flex flex-col gap-4 mb-4">
          <img src={previewUrl} alt="Preview" className="w-full aspect-auto object-cover" />

          {!result && (
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="py-3 font-display uppercase tracking-wide text-ink bg-yellow-true/50 active:bg-blend-red transition-colors disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          )}

          <button
            onClick={() => {
              setFile(null);
              setPreviewUrl(null);
              setResult(null);
            }}
            className="text-sm text-gray-500 underline"
          >
            Choose a different image
          </button>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm bg-magenta-true/50 text-ink px-3 py-2">{error}</p>
      )}

      {stats && palettes && (
        <>
          <div className="flex mb-6">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 font-display uppercase text-xs text-ink ${tab === t ? 'bg-cyan-true/50' : 'bg-gray-100 text-gray-500'}`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === 'Hue' && (
            <div className="flex flex-col gap-6">
              <PaletteChart colors={palettes.overall} title="Overall Palette" size="large" />
              <div className="grid grid-cols-3 gap-2">
                <PaletteChart colors={palettes.shadow} title="Shadows" size="small" />
                <PaletteChart colors={palettes.midtone} title="Midtones" size="small" />
                <PaletteChart colors={palettes.highlight} title="Highlights" size="small" />
              </div>

              {stats.histograms?.hue && <Histogram bins={stats.histograms.hue} binWidth={10} label="Hue" colorCodedTicks />}

              {stats.temperature && (
                <div className="bg-gray-100 px-4 py-3">
                  <p className="text-sm text-ink">Temperature Score: <span className="font-semibold">{stats.temperature.score.toFixed(2)}</span></p>
                  <p className="text-sm text-ink">Spread (Std. Dev.): <span className="font-semibold">{stats.temperature.standardDeviation.toFixed(2)}</span></p>
                  <p className="text-sm text-ink">
                    This piece reads as <span className="font-semibold">{describeTemperatureScore(stats.temperature.score)}</span> ({stats.temperature.score.toFixed(2)}), with <span className="font-semibold">{describeSpread(stats.temperature.standardDeviation)}</span> color temperature throughout (spread: {stats.temperature.standardDeviation.toFixed(2)}).
                  </p>
                </div>
              )}
            </div>
          )}

          {tab === 'Saturation' && stats.saturation && (
            <div className="flex flex-col gap-6">
              <BoxPlot data={[{ label: 'Your Upload', ...stats.saturation }]} yAxisLabel="Saturation (0 - 100)" />
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

          {tab === 'Value' && stats.value && (
            <div className="flex flex-col gap-6">
              <BoxPlot data={[{ label: 'Your Upload', ...stats.value }]} yAxisLabel="Value (0 - 100)" />
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

          <Link
            to="/signup"
            className="mt-8 block py-3 text-center font-display uppercase tracking-wide text-ink bg-cyan-true/50 active:bg-blend-blue transition-colors"
          >
            Sign up for more in depth analytics
          </Link>
        </>
      )}
    </main>
  );
}


function outlierPercentage(outlierCount: number, histogramBins: number[]): number {
  const totalPixels = histogramBins.reduce((sum, count) => sum + count, 0);
  return totalPixels > 0 ? (outlierCount / totalPixels) * 100 : 0;
}
