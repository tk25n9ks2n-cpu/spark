import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../storage';
import { auth } from '../firebase';

export function ProfileUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !auth.currentUser) {
      setError('No file selected or not authenticated');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const storageRef = ref(storage, `profile-pictures/${auth.currentUser.uid}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      setUploadedUrl(downloadUrl);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl bg-white/80 p-6 shadow-sm">
      <h3 className="mb-4 text-xl font-semibold text-gray-900">Profile Picture</h3>
      <div className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:rounded-lg file:border-0 file:bg-red-500 file:px-4 file:py-2 file:text-white file:cursor-pointer disabled:file:bg-gray-400"
        />
        {uploading && <p className="text-sm text-gray-600">Uploading...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {uploadedUrl && (
          <div className="space-y-2">
            <img src={uploadedUrl} alt="Profile" className="h-32 w-32 rounded-lg object-cover" />
            <p className="text-sm text-green-600">✓ Profile picture uploaded!</p>
          </div>
        )}
      </div>
    </div>
  );
}
