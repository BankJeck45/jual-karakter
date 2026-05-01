import React, { useState, useRef } from 'react';
import { User, Image as ImageIcon, Shirt, Scissors, Wand2, Loader2, Download, Maximize2, X, Sun, Camera, UploadCloud, MapPin, Activity } from 'lucide-react';

export default function App() {
  // --- STATE UMUM ---
  const [activeTab, setActiveTab] = useState('create'); 
  const [previewImage, setPreviewImage] = useState(null);

  // --- STATE TAB 1: BUAT KARAKTER ---
  const [formData, setFormData] = useState({
    gender: 'Perempuan',
    age: '25',
    ethnicity: 'Native Indonesian (South East Asian)',
    hair: 'Rambut lurus panjang',
    hairColor: 'Hitam (Black)',
    skinColor: 'Sawo matang',
    bodyType: 'Ramping / Slim',
    chestSize: 'Dada Besar (Large / Busty)',
    clothing: 'Gaun Bodycon (Ketat membentuk tubuh)',
    clothingColor: 'Sesuai Aslinya (Default)',
    accessories: [],
    background: 'Kamar tidur estetik yang rapi',
    lighting: 'Pencahayaan Studio Merata (Soft Light)'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [generatedImages, setGeneratedImages] = useState([]); 
  const [error, setError] = useState('');

  // --- STATE TAB 2: STUDIO AKTIVITAS (IMAGE-TO-IMAGE) ---
  const [uploadedRefImage, setUploadedRefImage] = useState(null);
  const [activityData, setActivityData] = useState({
    pose: 'Sedang minum kopi sambil tersenyum ke kamera',
    clothing: 'Gaun Bodycon (Ketat membentuk tubuh)',
    location: 'Di dalam kafe modern yang estetik'
  });
  const [isActivityGenerating, setIsActivityGenerating] = useState(false);
  const [activityResultImages, setActivityResultImages] = useState([]); 
  const [activityProgressText, setActivityProgressText] = useState('');
  const [activityError, setActivityError] = useState('');
  const fileInputRef = useRef(null);

  // --- MAP DATA & OPTIONS ---
  const accessoryOptions = [
    'Kacamata baca', 'Kacamata hitam trendi', 'Anting emas', 'Anting perak',
    'Kalung liontin', 'Kalung choker', 'Jam tangan kulit', 'Jam tangan pintar',
    'Topi bisbol', 'Topi beanie', 'Gelang etnik', 'Tindik hidung (Nose piercing)'
  ];

  const clothingMap = {
    'Kemeja putih kasual dan celana jeans': 'casual white button-down shirt and blue denim jeans',
    'Setelan jas formal yang rapi': 'neat formal black tailored suit with tie',
    'Gaun malam elegan': 'elegant long evening gown, haute couture, highly detailed fabric',
    'Kaos oblong polos dan celana pendek': 'plain basic t-shirt and casual shorts',
    'Pakaian tradisional Batik Indonesia': 'traditional Indonesian Batik patterned shirt',
    'Kebaya tradisional modern kerah rendah (Low V-neck)': 'elegant modern traditional Indonesian Kebaya with a deep plunging V-neckline, form-fitting sheer lace, tasteful cleavage',
    'Gaun Bodycon (Ketat membentuk tubuh)': 'very tight form-fitting bodycon dress emphasizing body curves and chest perfectly',
    'Crop Top Ketat & Hotpants Jeans': 'tight crop top revealing midriff and tight denim hotpants',
    'Pakaian Gym Ketat (Sport Bra & Legging)': 'very tight athletic sportswear, tight sports bra and form-fitting yoga leggings',
    'Dress Musim Panas Belahan Tinggi': 'elegant revealing summer dress with a deep plunging neckline and high leg slit',
    'Bikini / Pakaian Renang Pantai': 'beautiful sexy two-piece swimsuit bikini'
  };

  const accessoryMap = {
    'Kacamata baca': 'reading glasses',
    'Kacamata hitam trendi': 'trendy sunglasses',
    'Anting emas': 'gold earrings',
    'Anting perak': 'silver earrings',
    'Kalung liontin': 'pendant necklace',
    'Kalung choker': 'choker necklace',
    'Jam tangan kulit': 'leather strap watch',
    'Jam tangan pintar': 'smartwatch',
    'Topi bisbol': 'baseball cap',
    'Topi beanie': 'beanie hat',
    'Gelang etnik': 'ethnic bracelet',
    'Tindik hidung (Nose piercing)': 'nose piercing'
  };

  // --- HELPERS ---
  function updateForm(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function toggleAccessory(acc) {
    setFormData(prev => ({
      ...prev,
      accessories: prev.accessories.includes(acc)
        ? prev.accessories.filter(a => a !== acc)
        : [...prev.accessories, acc]
    }));
  }

  function buildEnglishPrompt() {
    const parts = [];
    const g = formData;
    
    // Gender + Age + Ethnicity
    parts.push(`A beautiful ${g.gender.toLowerCase()} ${g.age} years old, ${g.ethnicity}`);
    
    // Body
    parts.push(`${g.bodyType.toLowerCase()} body, ${g.chestSize.toLowerCase()}`);
    
    // Skin + Hair
    parts.push(`${g.skinColor} skin, ${g.hair} ${g.hairColor}`);
    
    // Clothing
    const enClothing = clothingMap[g.clothing] || g.clothing;
    let clothingStr = `wearing ${enClothing}`;
    if (g.clothingColor !== 'Sesuai Aslinya (Default)') {
      clothingStr += `, color: ${g.clothingColor}`;
    }
    parts.push(clothingStr);
    
    // Accessories
    if (g.accessories.length > 0) {
      const enAcc = g.accessories.map(a => accessoryMap[a] || a).join(', ');
      parts.push(`with accessories: ${enAcc}`);
    }
    
    // Background + Lighting
    parts.push(`in ${g.background}, ${g.lighting}`);
    
    // Quality boosters
    parts.push('masterpiece, best quality, highly detailed face, photorealistic, 8K, cinematic lighting, sharp focus, professional photography');
    
    return parts.join(', ');
  }

  function buildActivityPrompt() {
    const parts = [];
    const g = formData;
    
    parts.push(`A beautiful ${g.gender.toLowerCase()} ${g.age} years old, ${g.ethnicity}`);
    parts.push(`${g.skinColor} skin, ${g.hair} ${g.hairColor}`);
    
    const enClothing = clothingMap[activityData.clothing] || activityData.clothing;
    parts.push(`wearing ${enClothing}`);
    
    if (g.accessories.length > 0) {
      const enAcc = g.accessories.map(a => accessoryMap[a] || a).join(', ');
      parts.push(`with accessories: ${enAcc}`);
    }
    
    parts.push(`${activityData.pose}`);
    parts.push(`${activityData.location}`);
    parts.push('masterpiece, best quality, photorealistic, 8K, cinematic lighting');
    
    return parts.join(', ');
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedRefImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  function triggerFileInput() {
    fileInputRef.current?.click();
  }

  // --- GENERATE DENGAN DALL·E 3 ---
  async function callDalle(prompt, setProgress, setResults, setErr) {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, n: 4, size: '1024x1024' }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const images = data.images.map((img, i) => ({
      url: img.url,
      id: `img-${Date.now()}-${i}`,
      revised: img.revised_prompt,
    }));

    setResults(images);
    setProgress('✅ Gambar berhasil dibuat dengan DALL·E 3!');
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setError('');
    setProgressText('🧠 Menyusun prompt karakter ke DALL·E...');
    setGeneratedImages([]);
    
    try {
      const prompt = buildEnglishPrompt();
      setProgressText('🎨 DALL·E 3 sedang menggambar karakter...');
      await callDalle(prompt, setProgressText, setGeneratedImages, setError);
    } catch (err) {
      setError('Gagal generate: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleActivityGenerate() {
    setIsActivityGenerating(true);
    setActivityError('');
    setActivityProgressText('🧠 Menyusun prompt aktivitas ke DALL·E...');
    setActivityResultImages([]);
    
    try {
      const prompt = buildActivityPrompt();
      setActivityProgressText('🎬 DALL·E 3 sedang membuat scene aktivitas...');
      await callDalle(prompt, setActivityProgressText, setActivityResultImages, setActivityError);
    } catch (err) {
      setActivityError('Gagal generate aktivitas: ' + err.message);
    } finally {
      setIsActivityGenerating(false);
    }
  }

  function downloadImage(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'karakter.png';
    a.click();
  }

  // --- SELECT COMPONENT ---
  function Select({ label, value, options, onChange, icon: Icon }) {
    return (
      <div className="form-group">
        <label className="form-label">
          {Icon && <Icon size={16} />} {label}
        </label>
        <select value={value} onChange={e => onChange(e.target.value)} className="form-select">
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Wand2 size={28} className="sidebar-logo" />
          <h1 className="sidebar-title">Jual Karakter</h1>
          <p className="sidebar-subtitle">AI Character Generator</p>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <User size={20} />
            <span>Buat Karakter</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <Activity size={20} />
            <span>Studio Aktivitas</span>
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <p>v1.0.0</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {activeTab === 'create' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2><User size={24} /> Buat Karakter Baru</h2>
              <p>Sesuaikan karakter AI impian Anda dengan detail lengkap</p>
            </div>

            <div className="editor-layout">
              {/* LEFT: FORM */}
              <div className="editor-form">
                <div className="form-section">
                  <h3 className="section-title"><User size={18} /> Identitas</h3>
                  <div className="form-row">
                    <Select label="Gender" value={formData.gender} icon={User}
                      options={['Perempuan', 'Laki-laki']}
                      onChange={v => updateForm('gender', v)} />
                    <Select label="Usia" value={formData.age} icon={User}
                      options={['18', '20', '22', '25', '28', '30', '35', '40', '45']}
                      onChange={v => updateForm('age', v)} />
                  </div>
                  <Select label="Etnis / Ras" value={formData.ethnicity} icon={User}
                    options={[
                      'Native Indonesian (South East Asian)',
                      'Asian (East Asian)',
                      'Caucasian (Western)',
                      'Middle Eastern',
                      'Indian / South Asian',
                      'Latina / Hispanic',
                      'Mixed Race / Eurasian'
                    ]}
                    onChange={v => updateForm('ethnicity', v)} />
                </div>

                <div className="form-section">
                  <h3 className="section-title"><ImageIcon size={18} /> Fisik</h3>
                  <div className="form-row">
                    <Select label="Tipe Rambut" value={formData.hair} icon={Scissors}
                      options={[
                        'Rambut lurus panjang', 'Rambut lurus sebahu', 'Rambut ikal panjang',
                        'Rambut ikal sebahu', 'Rambut keriting panjang', 'Rambut keriting pendek',
                        'Rambut pendek bob', 'Rambut pendek pixie', 'Poni depan (Bangs)'
                      ]}
                      onChange={v => updateForm('hair', v)} />
                    <Select label="Warna Rambut" value={formData.hairColor} icon={Scissors}
                      options={['Hitam (Black)', 'Coklat (Brunette)', 'Pirang (Blonde)', 'Merah (Red)', 'Highlight / Ombre']}
                      onChange={v => updateForm('hairColor', v)} />
                  </div>
                  <div className="form-row">
                    <Select label="Warna Kulit" value={formData.skinColor} icon={Sun}
                      options={['Sawo matang', 'Kuning langsat', 'Putih bersih', 'Coklat', 'Hitam manis']}
                      onChange={v => updateForm('skinColor', v)} />
                    <Select label="Tipe Tubuh" value={formData.bodyType} icon={User}
                      options={['Ramping / Slim', 'Proporsional / Athletic', 'Berisi / Curvy', 'Montok / Chubby']}
                      onChange={v => updateForm('bodyType', v)} />
                  </div>
                  <Select label="Ukuran Dada" value={formData.chestSize} icon={User}
                    options={['Rata / Small (Flat / Small)', 'Sedang / Medium (Average)', 'Dada Besar (Large / Busty)', 'Sangat Besar (Very Large)']}
                    onChange={v => updateForm('chestSize', v)} />
                </div>

                <div className="form-section">
                  <h3 className="section-title"><Shirt size={18} /> Pakaian</h3>
                  <Select label="Jenis Pakaian" value={formData.clothing} icon={Shirt}
                    options={Object.keys(clothingMap)}
                    onChange={v => updateForm('clothing', v)} />
                  <Select label="Warna Pakaian" value={formData.clothingColor} icon={Shirt}
                    options={['Sesuai Aslinya (Default)', 'Merah (Red)', 'Biru (Blue)', 'Hitam (Black)', 'Putih (White)', 'Pink', 'Ungu (Purple)', 'Hijau (Green)']}
                    onChange={v => updateForm('clothingColor', v)} />
                </div>

                <div className="form-section">
                  <h3 className="section-title"><Wand2 size={18} /> Aksesoris</h3>
                  <div className="checkbox-grid">
                    {accessoryOptions.map(acc => (
                      <label key={acc} className="checkbox-label">
                        <input type="checkbox" checked={formData.accessories.includes(acc)}
                          onChange={() => toggleAccessory(acc)} />
                        <span>{acc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title"><Camera size={18} /> Latar & Pencahayaan</h3>
                  <Select label="Latar / Background" value={formData.background} icon={Camera}
                    options={[
                      'Kamar tidur estetik yang rapi', 'Kamar mandi mewah dengan cermin besar',
                      'Ruang tamu minimalis modern', 'Dapur bersih dan modern',
                      'Pantai tropis saat sunset', 'Kolam renang mewah',
                      'Kebun bunga yang indah', 'Atap gedung kota di malam hari',
                      'Studio foto profesional', 'Taman kota yang hijau dan asri',
                      'Kafe outdoor yang cozy', 'Pinggir kolam renang resort'
                    ]}
                    onChange={v => updateForm('background', v)} />
                  <Select label="Pencahayaan" value={formData.lighting} icon={Sun}
                    options={[
                      'Pencahayaan Studio Merata (Soft Light)',
                      'Cahaya Jendela Alami (Golden Hour)',
                      'Cahaya Neon Vulgar (Night Club)',
                      'Cahaya Lampu Tidur Hangat',
                      'Cahaya Outdoor Silau (Bright Sunlight)',
                      'Cahaya Lembut Pagi Hari (Morning Soft)'
                    ]}
                    onChange={v => updateForm('lighting', v)} />
                </div>

                <button className="btn-generate" onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? (
                    <><Loader2 size={20} className="spin" /> {progressText}</>
                  ) : (
                    <><Wand2 size={20} /> Buat Karakter Sekarang</>
                  )}
                </button>

                {error && <div className="error-msg">{error}</div>}
              </div>

              {/* RIGHT: PREVIEW & RESULTS */}
              <div className="editor-preview">
                <div className="prompt-box">
                  <h4><Wand2 size={16} /> Prompt Preview</h4>
                  <p className="prompt-text">{buildEnglishPrompt()}</p>
                </div>

                {isGenerating && (
                  <div className="generating-indicator">
                    <Loader2 size={40} className="spin" />
                    <p>{progressText}</p>
                  </div>
                )}

                {generatedImages.length > 0 && !isGenerating && (
                  <div className="results-grid">
                    <div className="results-header">
                      <h4><ImageIcon size={18} /> Hasil Generate</h4>
                      <p className="results-count">{generatedImages.length} gambar</p>
                    </div>
                    <div className="image-grid">
                      {generatedImages.map((img, idx) => (
                        <div key={img.id} className="image-card">
                          <img src={img.url} alt={`Karakter ${idx + 1}`} />
                          <div className="image-actions">
                            <button className="btn-icon" onClick={() => downloadImage(img.url, `karakter-${idx+1}.png`)} title="Download">
                              <Download size={16} />
                            </button>
                            <button className="btn-icon" onClick={() => setPreviewImage(img.url)} title="Preview">
                              <Maximize2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!isGenerating && generatedImages.length === 0 && (
                  <div className="empty-state">
                    <Wand2 size={64} className="empty-icon" />
                    <h4>Belum ada karakter</h4>
                    <p>Isi form di samping lalu klik "Buat Karakter Sekarang"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2><Activity size={24} /> Studio Aktivitas</h2>
              <p>Upload foto karakter & buat scene aktivitas baru</p>
            </div>

            <div className="editor-layout">
              {/* LEFT: FORM */}
              <div className="editor-form">
                <div className="form-section">
                  <h3 className="section-title"><UploadCloud size={18} /> Upload Foto Referensi</h3>
                  <div className="upload-area" onClick={triggerFileInput}>
                    {uploadedRefImage ? (
                      <img src={uploadedRefImage} alt="Preview" className="upload-preview" />
                    ) : (
                      <div className="upload-placeholder">
                        <UploadCloud size={48} />
                        <p>Klik untuk upload foto karakter</p>
                        <span className="upload-hint">Format: JPG, PNG. Maks 10MB</span>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} hidden />
                    {uploadedRefImage && (
                      <button className="btn-remove" onClick={(e) => { e.stopPropagation(); setUploadedRefImage(null); }}>
                        <X size={16} /> Hapus
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title"><Activity size={18} /> Adegan Aktivitas</h3>
                  <div className="form-group">
                    <label className="form-label"><MapPin size={16} /> Pose / Aktivitas</label>
                    <select value={activityData.pose} onChange={e => setActivityData(prev => ({...prev, pose: e.target.value}))} className="form-select">
                      <option value="Sedang minum kopi sambil tersenyum ke kamera">Minum kopi sambil tersenyum</option>
                      <option value="Sedang berpose seksi di atas tempat tidur">Berpose seksi di atas tempat tidur</option>
                      <option value="Sedang berdiri di depan cermin sambil selfie">Selfie di depan cermin</option>
                      <option value="Sedang duduk santai di sofa sambil main HP">Duduk santai di sofa main HP</option>
                      <option value="Sedang berjalan di pinggir kolam renang">Berjalan di pinggir kolam renang</option>
                      <option value="Sedang memasak di dapur sambil tersenyum">Memasak di dapur</option>
                      <option value="Sedang duduk di meja kerja sambil minum teh">Duduk di meja kerja minum teh</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label"><Shirt size={16} /> Pakaian</label>
                    <select value={activityData.clothing} onChange={e => setActivityData(prev => ({...prev, clothing: e.target.value}))} className="form-select">
                      {Object.keys(clothingMap).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label"><MapPin size={16} /> Lokasi</label>
                    <select value={activityData.location} onChange={e => setActivityData(prev => ({...prev, location: e.target.value}))} className="form-select">
                      <option value="Di dalam kafe modern yang estetik">Kafe modern estetik</option>
                      <option value="Di kamar tidur dengan pencahayaan hangat">Kamar tidur hangat</option>
                      <option value="Di tepi kolam renang villa mewah">Tepi kolam renang villa</option>
                      <option value="Di pantry kantor yang minimalis">Pantry kantor minimalis</option>
                      <option value="Di taman bunga yang indah">Taman bunga</option>
                      <option value="Di dapur modern yang bersih">Dapur modern</option>
                      <option value="Di studio foto profesional">Studio foto</option>
                      <option value="Di pinggir pantai saat sunset">Pinggir pantai sunset</option>
                    </select>
                  </div>
                </div>

                <button className="btn-generate" onClick={handleActivityGenerate} disabled={isActivityGenerating || !uploadedRefImage}>
                  {isActivityGenerating ? (
                    <><Loader2 size={20} className="spin" /> {activityProgressText}</>
                  ) : (
                    <><Wand2 size={20} /> Buat Scene Aktivitas</>
                  )}
                </button>
                {!uploadedRefImage && <p className="form-hint">Upload foto referensi terlebih dahulu</p>}
                {activityError && <div className="error-msg">{activityError}</div>}
              </div>

              {/* RIGHT: PREVIEW & RESULTS */}
              <div className="editor-preview">
                <div className="prompt-box">
                  <h4><Wand2 size={16} /> Prompt Preview</h4>
                  <p className="prompt-text">{buildActivityPrompt()}</p>
                </div>

                {isActivityGenerating && (
                  <div className="generating-indicator">
                    <Loader2 size={40} className="spin" />
                    <p>{activityProgressText}</p>
                  </div>
                )}

                {activityResultImages.length > 0 && !isActivityGenerating && (
                  <div className="results-grid">
                    <div className="results-header">
                      <h4><ImageIcon size={18} /> Hasil Aktivitas</h4>
                      <p className="results-count">{activityResultImages.length} gambar</p>
                    </div>
                    <div className="image-grid">
                      {activityResultImages.map((img, idx) => (
                        <div key={img.id} className="image-card">
                          <img src={img.url} alt={`Aktivitas ${idx + 1}`} />
                          <div className="image-actions">
                            <button className="btn-icon" onClick={() => downloadImage(img.url, `aktivitas-${idx+1}.png`)} title="Download">
                              <Download size={16} />
                            </button>
                            <button className="btn-icon" onClick={() => setPreviewImage(img.url)} title="Preview">
                              <Maximize2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!isActivityGenerating && activityResultImages.length === 0 && (
                  <div className="empty-state">
                    <Camera size={64} className="empty-icon" />
                    <h4>Upload foto karakter</h4>
                    <p>Upload foto di samping lalu atur scene aktivitasnya</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* LIGHTBOX */}
      {previewImage && (
        <div className="lightbox" onClick={() => setPreviewImage(null)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setPreviewImage(null)}><X size={24} /></button>
            <img src={previewImage} alt="Preview besar" />
          </div>
        </div>
      )}
    </div>
  );
}
