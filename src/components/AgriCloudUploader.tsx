import React, { useState } from 'react';
import { dataStore, fileStore } from '../dataStore';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const CROP_OPTIONS = [
  'Wheat', 'Rice', 'Cotton', 'Sugarcane', 'Potato', 'Tomato', 'Maize', 'Soybean', 'Chili', 'Groundnut', 'Other'
];
const DISEASE_OPTIONS = [
  'Leaf Rust', 'Powdery Mildew', 'Late Blight', 'Early Blight', 'Bacterial Blight', 'Viral Disease', 'Pest Infestation', 'Other'
];
const SEVERITY_OPTIONS = ['mild', 'moderate', 'severe', 'unknown'];
const SEASON_OPTIONS = ['Kharif', 'Rabi', 'Zaid', 'Year-round', 'Other'];
const QUALITY_OPTIONS = ['high', 'medium', 'low', 'unknown'];

interface Metadata {
  crop: string;
  variety?: string;
  disease: string;
  severity: string;
  notes?: string;
  location?: string;
  image_quality?: string;
  device?: string;
  season?: string;
}

const initialMetadata: Metadata = {
  crop: '',
  variety: '',
  disease: '',
  severity: '',
  notes: '',
  location: '',
  image_quality: '',
  device: '',
  season: '',
};

export const AgriCloudUploader: React.FC = () => {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<Metadata>(initialMetadata);
  const [perImageNotes, setPerImageNotes] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Autofill location using browser geolocation
  React.useEffect(() => {
    if (!metadata.location && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setMetadata((prev) => ({ ...prev, location: `${latitude},${longitude}` }));
        },
        () => {},
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
    // eslint-disable-next-line
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(files);
    setPreviewUrls(files.map(file => URL.createObjectURL(file)));
    setPerImageNotes(Array(files.length).fill(''));
  };

  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMetadata((prev) => ({ ...prev, [name]: value }));
  };

  const handlePerImageNoteChange = (idx: number, value: string) => {
    setPerImageNotes(notes => {
      const updated = [...notes];
      updated[idx] = value;
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError(null);
    setSuccess(false);
    try {
      if (imageFiles.length === 0) throw new Error('Please select at least one image.');
      if (!metadata.crop || !metadata.disease || !metadata.severity) {
        throw new Error('Please fill in all required fields.');
      }
      const userId = 'anonymous'; // Replace with real user ID if available
      const datePath = new Date().toISOString().split('T')[0];
      for (let i = 0; i < imageFiles.length; i++) {
        const imageFile = imageFiles[i];
        const fileExt = imageFile.name.split('.').pop() || 'jpg';
        const fileName = `${metadata.crop}_${metadata.disease}_${uuidv4()}.${fileExt}`;
        const storagePath = `${userId}/${datePath}/${fileName}`;
        const storageRef = ref(fileStore, storagePath);
        await uploadBytes(storageRef, imageFile);
        const imageUrl = await getDownloadURL(storageRef);
        const docData = {
          image_url: imageUrl,
          ...metadata,
          notes: perImageNotes[i] || metadata.notes,
          timestamp: Timestamp.now(),
          user_id: userId,
        };
        await addDoc(collection(dataStore, 'training_samples'), docData);
      }
      setSuccess(true);
      setImageFiles([]);
      setPreviewUrls([]);
      setPerImageNotes([]);
      setMetadata(initialMetadata);
    } catch (err: any) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // Download all samples as JSON
  const handleDownloadJSON = async () => {
    setDownloading(true);
    setError(null);
    try {
      const snapshot = await getDocs(collection(dataStore, 'training_samples'));
      const samples = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const blob = new Blob([JSON.stringify(samples, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agricloud_training_samples_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Failed to download samples.');
    } finally {
      setDownloading(false);
    }
  };

  // Download all samples as CSV
  const handleDownloadCSV = async () => {
    setDownloading(true);
    setError(null);
    try {
      const snapshot = await getDocs(collection(dataStore, 'training_samples'));
      const samples = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (samples.length === 0) throw new Error('No samples to export.');
      // Get all unique keys
      const keys = Array.from(new Set(samples.flatMap(obj => Object.keys(obj))));
      const csvRows = [keys.join(',')];
      for (const sample of samples) {
        const row = keys.map(k => {
          let val = sample[k];
          if (val === undefined || val === null) return '';
          if (typeof val === 'object') return JSON.stringify(val).replace(/"/g, '""');
          return String(val).replace(/"/g, '""');
        });
        csvRows.push(row.map(v => `"${v}"`).join(','));
      }
      const csv = csvRows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agricloud_training_samples_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Failed to download CSV.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md border mt-8">
      <h2 className="text-2xl font-bold mb-4 text-kisan-green">Upload to AgriCloud</h2>
      <form onSubmit={handleSubmit} className="space-y-4" aria-label="AgriCloud Sample Uploader">
        <div>
          <label className="block font-medium mb-1" htmlFor="crop-image">Crop Images <span className="text-red-500">*</span></label>
          <input id="crop-image" type="file" accept="image/*" onChange={handleFileChange} className="block w-full" aria-required="true" multiple />
          {previewUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative">
                  <img src={url} alt={`Preview ${idx + 1}`} className="rounded-md max-h-32 border" />
                  <textarea
                    placeholder="Notes for this image (optional)"
                    value={perImageNotes[idx] || ''}
                    onChange={e => handlePerImageNoteChange(idx, e.target.value)}
                    className="w-full border rounded px-2 py-1 mt-1 text-xs"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="crop">Crop <span className="text-red-500">*</span></label>
          <select id="crop" name="crop" value={metadata.crop} onChange={handleMetadataChange} className="w-full border rounded px-3 py-2" required aria-required="true">
            <option value="">Select crop</option>
            {CROP_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          {metadata.crop === 'Other' && (
            <input type="text" name="crop" placeholder="Enter crop" value={metadata.crop} onChange={handleMetadataChange} className="w-full border rounded px-3 py-2 mt-2" />
          )}
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="variety">Variety (optional)</label>
          <input id="variety" type="text" name="variety" value={metadata.variety} onChange={handleMetadataChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="disease">Disease Type <span className="text-red-500">*</span></label>
          <select id="disease" name="disease" value={metadata.disease} onChange={handleMetadataChange} className="w-full border rounded px-3 py-2" required aria-required="true">
            <option value="">Select disease</option>
            {DISEASE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          {metadata.disease === 'Other' && (
            <input type="text" name="disease" placeholder="Enter disease" value={metadata.disease} onChange={handleMetadataChange} className="w-full border rounded px-3 py-2 mt-2" />
          )}
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="severity">Severity <span className="text-red-500">*</span></label>
          <select id="severity" name="severity" value={metadata.severity} onChange={handleMetadataChange} className="w-full border rounded px-3 py-2" required aria-required="true">
            <option value="">Select severity</option>
            {SEVERITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="season">Season (optional)</label>
          <select id="season" name="season" value={metadata.season} onChange={handleMetadataChange} className="w-full border rounded px-3 py-2">
            <option value="">Select season</option>
            {SEASON_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="image_quality">Image Quality (optional)</label>
          <select id="image_quality" name="image_quality" value={metadata.image_quality} onChange={handleMetadataChange} className="w-full border rounded px-3 py-2">
            <option value="">Select quality</option>
            {QUALITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="device">Device (optional)</label>
          <input id="device" type="text" name="device" value={metadata.device} onChange={handleMetadataChange} className="w-full border rounded px-3 py-2" placeholder="e.g. Redmi Note 10" />
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="location">Location (optional)</label>
          <input id="location" type="text" name="location" value={metadata.location} onChange={handleMetadataChange} className="w-full border rounded px-3 py-2" placeholder="lat,lng" />
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="notes">Notes (optional, applies to all images unless per-image note is set above)</label>
          <textarea id="notes" name="notes" value={metadata.notes} onChange={handleMetadataChange} className="w-full border rounded px-3 py-2 min-h-[60px]" />
        </div>
        <button type="submit" className="w-full bg-kisan-green text-white py-2 rounded font-semibold hover:bg-kisan-green-dark" disabled={uploading} aria-busy={uploading}>
          {uploading ? 'Uploading...' : 'Submit Sample(s)'}
        </button>
        {success && <div className="text-green-600 mt-2" role="status">Sample(s) uploaded successfully!</div>}
        {error && <div className="text-red-600 mt-2" role="alert">{error}</div>}
      </form>
      <div className="flex gap-2 mt-6">
        <button onClick={handleDownloadJSON} className="flex-1 bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-60" disabled={downloading} aria-busy={downloading}>
          {downloading ? 'Preparing...' : 'Download All Samples (JSON)'}
        </button>
        <button onClick={handleDownloadCSV} className="flex-1 bg-amber-600 text-white py-2 rounded font-semibold hover:bg-amber-700 disabled:opacity-60" disabled={downloading} aria-busy={downloading}>
          {downloading ? 'Preparing...' : 'Download All Samples (CSV)'}
        </button>
      </div>
    </div>
  );
};

export default AgriCloudUploader; 