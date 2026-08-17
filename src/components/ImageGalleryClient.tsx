import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

type ImageAsset = { id: string; name: string; dataUrl: string; mimeType: string; width: number; height: number; createdAt: string };

export default function ImageGalleryClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [source, setSource] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("Untitled image");
  const [rotation, setRotation] = useState(0);
  const [flip, setFlip] = useState(false);
  const [squareCrop, setSquareCrop] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [saving, setSaving] = useState(false);

  const loadImages = useCallback(async () => { const response = await fetch("/api/images"); if (response.ok) setImages((await response.json()).images || []); }, []);
  useEffect(() => { loadImages(); }, [loadImages]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas || !source) return;
    const image = new Image();
    image.onload = () => {
      const quarterTurn = rotation % 180 !== 0;
      let width = image.naturalWidth; let height = image.naturalHeight;
      if (squareCrop) { const size = Math.min(width, height); width = size; height = size; }
      const radians = rotation * Math.PI / 180;
      canvas.width = quarterTurn ? height : width; canvas.height = quarterTurn ? width : height;
      const context = canvas.getContext("2d"); if (!context) return;
      context.save(); context.translate(canvas.width / 2, canvas.height / 2); context.rotate(radians); context.scale(flip ? -1 : 1, 1);
      context.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      const size = squareCrop ? Math.min(image.naturalWidth, image.naturalHeight) : undefined;
      const sx = size ? (image.naturalWidth - size) / 2 : 0; const sy = size ? (image.naturalHeight - size) / 2 : 0;
      const sw = size || image.naturalWidth; const sh = size || image.naturalHeight;
      context.drawImage(image, sx, sy, sw, sh, -width / 2, -height / 2, width, height); context.restore();
      setDimensions({ width: canvas.width, height: canvas.height });
    };
    image.src = source;
  }, [source, rotation, flip, squareCrop, brightness, contrast, saturation]);
  useEffect(() => { draw(); }, [draw]);

  const chooseFile = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) { toast.error("Choose a valid image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Images must be smaller than 10MB"); return; }
    const url = URL.createObjectURL(file); setSource(url); setEditingId(null); setName(file.name.replace(/\.[^/.]+$/, "")); setRotation(0); setFlip(false); setSquareCrop(false); setBrightness(100); setContrast(100); setSaturation(100);
  };
  const editExisting = (image: ImageAsset) => { setSource(image.dataUrl); setEditingId(image.id); setName(image.name); setRotation(0); setFlip(false); setSquareCrop(false); setBrightness(100); setContrast(100); setSaturation(100); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const reset = () => { setRotation(0); setFlip(false); setSquareCrop(false); setBrightness(100); setContrast(100); setSaturation(100); };
  const save = async () => {
    const canvas = canvasRef.current; if (!canvas || !source) return;
    setSaving(true);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const response = await fetch("/api/images", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingId || undefined, name, dataUrl, mimeType: "image/jpeg", width: canvas.width, height: canvas.height }) });
    const result = await response.json().catch(() => ({}));
    if (response.ok) { toast.success("Image saved to your gallery"); setEditingId(result.image?.id || editingId); await loadImages(); } else toast.error(result.error || "Could not save image");
    setSaving(false);
  };
  const remove = async (id: string) => { const response = await fetch(`/api/images?id=${encodeURIComponent(id)}`, { method: "DELETE" }); if (response.ok) { setImages(images.filter(image => image.id !== id)); if (editingId === id) { setSource(null); setEditingId(null); } toast.success("Image removed"); } };

  return <div className="space-y-8"><section className="rounded-2xl border border-white/10 bg-white/5 p-6"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Visual workspace</p><h1 className="mt-2 text-3xl font-bold text-white">Image Gallery</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Upload images for resumes, reports, and career documents. Make quick adjustments, save the finished version, and reuse it from your gallery.</p></div><label className="cursor-pointer rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white">+ Add image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={event => chooseFile(event.target.files?.[0])} /></label></div></section>{source && <section className="grid gap-6 lg:grid-cols-[1.2fr_.8fr] rounded-2xl border border-white/10 bg-white/5 p-6"><div className="flex min-h-[340px] items-center justify-center rounded-xl border border-white/10 bg-slate-950/60 p-4"><canvas ref={canvasRef} className="max-h-[480px] max-w-full rounded-lg object-contain shadow-2xl" /></div><div className="space-y-5"><div><label className="text-xs uppercase tracking-wider text-slate-500">Image name</label><input value={name} onChange={event => setName(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white" /></div><div className="grid grid-cols-2 gap-3"><button onClick={() => setRotation((rotation + 90) % 360)} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">↻ Rotate</button><button onClick={() => setFlip(!flip)} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">⇋ Flip</button><button onClick={() => setSquareCrop(!squareCrop)} className={`rounded-lg border px-3 py-2 text-sm ${squareCrop ? "border-cyan-400/60 bg-cyan-500/10 text-cyan-200" : "border-white/10 text-slate-200 hover:bg-white/10"}`}>Crop square</button><button onClick={reset} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Reset</button></div><div className="space-y-4">{[["Brightness", brightness, setBrightness], ["Contrast", contrast, setContrast], ["Saturation", saturation, setSaturation]].map(([label, value, setter]: any) => <label key={label as string} className="block text-sm text-slate-300"> <span className="flex justify-between"><span>{label as string}</span><span className="text-xs text-slate-500">{value as number}%</span></span><input type="range" min="50" max="150" value={value as number} onChange={event => setter(Number(event.target.value))} className="mt-2 w-full accent-cyan-400" /></label>)}</div><p className="text-xs text-slate-500">{dimensions.width ? `${dimensions.width} × ${dimensions.height}px` : "Ready to edit"}</p><div className="flex gap-3"><button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">{saving ? "Saving..." : "Save to Image Gallery"}</button><button onClick={() => { setSource(null); setEditingId(null); }} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300">Cancel</button></div></div></section>}<section><div className="mb-4 flex items-end justify-between"><div><h2 className="text-xl font-semibold text-white">Saved images</h2><p className="mt-1 text-sm text-slate-400">Your edited images stay available in this workspace.</p></div><span className="text-sm text-slate-500">{images.length} image{images.length === 1 ? "" : "s"}</span></div>{images.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{images.map(image => <article key={image.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"><div className="aspect-[4/3] bg-slate-950/60"><img src={image.dataUrl} alt={image.name} className="h-full w-full object-contain" /></div><div className="p-4"><p className="truncate font-medium text-white">{image.name}</p><p className="mt-1 text-xs text-slate-500">{image.width} × {image.height}px · {new Date(image.createdAt).toLocaleDateString()}</p><div className="mt-3 flex gap-2"><button onClick={() => editExisting(image)} className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/10">Edit</button><button onClick={() => remove(image.id)} className="rounded-lg border border-rose-400/20 px-3 py-2 text-xs text-rose-300 hover:bg-rose-400/10">Delete</button></div></div></article>)}</div> : <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-12 text-center text-sm text-slate-500">No saved images yet. Add an image to create your first gallery asset.</div>}</section></div>;
}
