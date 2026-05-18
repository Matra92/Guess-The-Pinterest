"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Owner {
  id: number;
  name: string;
}

export default function AdminPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchOwners() {
      const { data } = await supabase.from('image_owners').select('id, name');
      setOwners(data ?? []);
    }
    fetchOwners();
  }, []);

  async function handleUpload() {
    if (!file || !selectedOwner) return;
    setMessage('Subiendo imagen...');
    const filename = `${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('images')
      .upload(filename, file);
    if (uploadErr) {
      setMessage(uploadErr.message);
      return;
    }
    await supabase.from('images').insert({ storage_path: uploadData?.path, owner_id: selectedOwner, approved: true });
    setMessage('Imagen subida con exito');
    setFile(null);
  }

  return (
    <main className="party-shell">
      <div className="party-wrap grid min-h-[calc(100vh-3rem)] place-items-center">
        <section className="party-panel w-full max-w-xl rounded-[36px] p-6 animate-pop sm:p-8">
          <span className="sticker">Admin</span>
          <h1 className="mt-4 text-4xl font-black leading-none text-candy-ink">
            Cargar imagenes
          </h1>

          <div className="mt-7 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-black uppercase text-candy-ink">Dueno</span>
              <select
                value={selectedOwner ?? ''}
                onChange={(e) => setSelectedOwner(Number(e.target.value))}
                className="party-input"
              >
                <option value="">Elegir</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-black uppercase text-candy-ink">Imagen</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="party-input file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:font-black file:text-candy-paper"
              />
            </label>

            <button
              onClick={handleUpload}
              className="party-button red-button w-full"
              disabled={!file || !selectedOwner}
            >
              Subir
            </button>

            {message && (
              <p className="rounded-2xl border-2 border-candy-ink bg-white p-3 text-sm font-black text-candy-ink shadow-[0_8px_18px_rgba(7,8,18,0.18)]">
                {message}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
