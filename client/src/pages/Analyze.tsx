import { useState, type ChangeEvent } from 'react';
import { Link } from 'react-router';

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

  return (
    <main className="px-4 py-6">
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
        <div className="flex flex-col gap-4">
          <img src={previewUrl} alt="Preview" className="w-full aspect-square object-cover" />

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

      {result?.image.palettes && (
        <div className="mt-8 flex flex-col gap-6">
          <div>
            <h2 className="font-display text-xl uppercase text-ink mb-2">Palette</h2>
            <div className="flex gap-2">
              {result.image.palettes.overall.map((color) => (
                <div key={color.hex} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full aspect-square" style={{ backgroundColor: color.hex }} />
                  <span className="text-xs text-gray-500">{color.hex}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl uppercase text-ink mb-2">Highlights</h2>
            <div className="flex gap-2">
              {result.image.palettes.highlight.map((color) => (
                <div key={color.hex} className="flex-1 aspect-square" style={{ backgroundColor: color.hex }} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl uppercase text-ink mb-2">Midtones</h2>
            <div className="flex gap-2">
              {result.image.palettes.midtone.map((color) => (
                <div key={color.hex} className="flex-1 aspect-square" style={{ backgroundColor: color.hex }} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl uppercase text-ink mb-2">Shadows</h2>
            <div className="flex gap-2">
              {result.image.palettes.shadow.map((color) => (
                <div key={color.hex} className="flex-1 aspect-square" style={{ backgroundColor: color.hex }} />
              ))}
            </div>
          </div>

          <Link
            to="/signup"
            className="py-3 text-center font-display uppercase tracking-wide text-ink bg-cyan-true/50 active:bg-blend-blue transition-colors"
          >
            Sign up to save your analysis
          </Link>
        </div>
      )}
    </main>
  );
}