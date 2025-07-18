import React, { useState, useEffect } from 'react';
import { Upload, FileText, Download, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Certificate {
  filename: string;
  originalName: string;
  uploadDate: string;
  fileSize: number;
  mimeType: string;
}

export default function CertificateUpload() {
  const { token } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/upload/medical-certificates', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCertificates(data);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, PDF, and DOC files are allowed');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('certificate', file);

    try {
      const response = await fetch('http://localhost:3001/api/upload/medical-certificate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadProgress(100);
        setCertificates(prev => [...prev, data.certificate]);
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
        }, 1000);
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error: any) {
      setError(error.message || 'Upload failed');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const downloadCertificate = async (filename: string, originalName: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/upload/medical-certificate/${filename}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const deleteCertificate = async (filename: string) => {
    if (!confirm('Are you sure you want to delete this certificate?')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/upload/medical-certificate/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setCertificates(prev => prev.filter(cert => cert.filename !== filename));
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return '🖼️';
    } else if (mimeType === 'application/pdf') {
      return '📄';
    } else if (mimeType.includes('word')) {
      return '📝';
    }
    return '📎';
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="space-y-4">
          <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
            <Upload className="h-6 w-6 text-gray-600" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Upload Medical Certificate
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and drop your medical documents here, or click to select files
            </p>
            
            <input
              type="file"
              id="certificate-upload"
              className="hidden"
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            
            <label
              htmlFor="certificate-upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium cursor-pointer transition-colors disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              Select Files
            </label>
          </div>
          
          <p className="text-xs text-gray-500">
            Supported formats: JPEG, PNG, PDF, DOC, DOCX (Max 10MB)
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-900 font-medium">Uploading...</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Certificates List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Your Medical Documents ({certificates.length})
        </h3>
        
        {certificates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No medical documents uploaded yet</p>
            <p className="text-sm">Upload your first document to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map((cert, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {getFileIcon(cert.mimeType)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {cert.originalName}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(cert.fileSize)} • {new Date(cert.uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => downloadCertificate(cert.filename, cert.originalName)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteCertificate(cert.filename)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Secure Document Storage</h4>
            <p className="text-sm text-blue-700 mt-1">
              Your medical documents are securely encrypted and only accessible to you and authorized healthcare providers during consultations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}