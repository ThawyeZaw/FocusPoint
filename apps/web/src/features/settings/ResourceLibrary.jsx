import React, { useState, useMemo, useRef } from 'react';
import {
  FolderOpen,
  Upload,
  FileText,
  Image,
  Trash2,
  Search,
  X,
  Download,
  File,
} from 'lucide-react';
import { db } from '@focuspoint/shared/study-data/mockDatabase';

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getFileIcon(type) {
  switch (type) {
    case 'pdf':
      return <FileText className="w-5 h-5 text-accent-rose" />;
    case 'image':
      return <Image className="w-5 h-5 text-accent-cyan" />;
    default:
      return <File className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />;
  }
}

export default function ResourceLibrary({ onDataChange }) {
  const subjects = db.getSubjects();
  const topics = db.getTopics();
  const [resources, setResources] = useState(() => db.getResources());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const enrichedResources = useMemo(() => {
    return resources.map((r) => {
      const topic = topics.find((t) => t.id === r.topicId);
      const subject = topic ? subjects.find((s) => s.id === topic.subjectId) : null;
      return {
        ...r,
        topicName: topic?.topic || 'Unlinked',
        learningOutcome: topic?.learningOutcome || '',
        unit: topic?.unit || '',
        subjectName: subject?.name || 'Unknown',
        subjectColor: subject?.color || '#6366f1',
        subjectId: subject?.id || '',
      };
    });
  }, [resources, topics, subjects]);

  const filteredResources = useMemo(() => {
    let result = enrichedResources;
    if (selectedSubject !== 'all') {
      result = result.filter((r) => r.subjectId === selectedSubject);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.topicName.toLowerCase().includes(q) ||
          r.learningOutcome.toLowerCase().includes(q)
      );
    }
    return result;
  }, [enrichedResources, selectedSubject, searchQuery]);

  const handleDelete = (id) => {
    db.deleteResource(id);
    setResources(db.getResources());
    onDataChange?.();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      setShowUploadModal(true);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <FolderOpen className="w-4.5 h-4.5 text-accent-cyan" />
          Resources
        </h1>
        <button id="upload-resource-btn" className="btn-primary text-xs" onClick={() => setShowUploadModal(true)}>
          <Upload className="w-3.5 h-3.5" />
          Upload
        </button>
      </div>

      {/* Drop Zone */}
      <div
        className={`file-drop-zone ${dragActive ? 'active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => setShowUploadModal(true)}
      >
        <Upload className={`w-10 h-10 mx-auto mb-3 ${dragActive ? 'text-accent-indigo' : ''}`} style={!dragActive ? { color: 'var(--text-muted)' } : {}} />
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {dragActive ? 'Drop files here...' : 'Drag & drop files, or click to upload'}
        </p>
        <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>PDFs, images, and documents — linked to your syllabus</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            id="resource-search"
            type="text"
            placeholder="Search resources..."
            className="input-field pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            className={`badge cursor-pointer transition-all ${selectedSubject === 'all' ? 'badge-mastered' : 'badge-not-started'}`}
            onClick={() => setSelectedSubject('all')}
          >
            All
          </button>
          {subjects.map((s) => (
            <button
              key={s.id}
              className="badge cursor-pointer transition-all"
              style={{
                background: selectedSubject === s.id ? `${s.color}18` : 'var(--badge-neutral-bg)',
                color: selectedSubject === s.id ? s.color : 'var(--badge-neutral-color)',
                border: `1px solid ${selectedSubject === s.id ? `${s.color}40` : 'var(--badge-neutral-border)'}`,
              }}
              onClick={() => setSelectedSubject(selectedSubject === s.id ? 'all' : s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map((resource, i) => (
          <div
            key={resource.id}
            className="glass-card group animate-slide-up"
            style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--surface-tertiary)' }}>
                  {getFileIcon(resource.type)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate max-w-[180px]" style={{ color: 'var(--text-primary)' }}>{resource.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatFileSize(resource.size)}</p>
                </div>
              </div>
              <button
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(resource.id)}
                title="Delete resource"
                style={{ color: 'var(--text-muted)' }}
              >
                <Trash2 className="w-3.5 h-3.5 hover:text-accent-rose transition-colors" />
              </button>
            </div>

            {/* Linked Topic Info */}
            <div className="p-4 rounded-xl border" style={{ background: 'var(--surface-tertiary)', borderColor: 'var(--border-secondary)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: resource.subjectColor }} />
                <span className="text-xs font-medium" style={{ color: resource.subjectColor }}>{resource.subjectName}</span>
              </div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{resource.topicName}</p>
              {resource.learningOutcome && (
                <p className="text-[10px] mt-1 truncate" style={{ color: 'var(--text-muted)' }}>{resource.learningOutcome}</p>
              )}
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {new Date(resource.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <button className="text-xs text-accent-indigo font-medium flex items-center gap-1 hover:underline">
                <Download className="w-3 h-3" />
                Open
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="glass-card-static p-10 text-center">
          <FolderOpen className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No resources found</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Upload files and link them to topics.</p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          topics={topics}
          subjects={subjects}
          onClose={() => setShowUploadModal(false)}
          onUpload={() => {
            setResources(db.getResources());
            onDataChange?.();
            setShowUploadModal(false);
          }}
        />
      )}
    </div>
  );
}

function UploadModal({ topics, subjects, onClose, onUpload }) {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    topicId: topics[0]?.id || '',
    name: '',
    type: 'pdf',
    size: 0,
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setForm({
        ...form,
        name: file.name,
        size: file.size,
        type: file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'image' : 'other',
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name) return;
    db.addResource({
      ...form,
      uploadedAt: new Date().toISOString(),
      url: '#',
    });
    onUpload();
  };

  const groupedTopics = useMemo(() => {
    const map = {};
    topics.forEach((t) => {
      const subject = subjects.find((s) => s.id === t.subjectId);
      const sName = subject?.name || 'Unknown';
      if (!map[sName]) map[sName] = [];
      map[sName].push(t);
    });
    return map;
  }, [topics, subjects]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Upload Resource</h2>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>File</label>
            <div className="file-drop-zone cursor-pointer" style={{ padding: '28px 16px' }} onClick={() => fileInputRef.current?.click()}>
              {selectedFile ? (
                <div className="flex items-center gap-3 justify-center">
                  {getFileIcon(form.type)}
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedFile.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Click to select a file</p>
                </>
              )}
            </div>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" />
          </div>

          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>Name</label>
            <input className="input-field" placeholder="Resource name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>

          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>Link to Topic</label>
            <select className="select-field" value={form.topicId} onChange={(e) => setForm({ ...form, topicId: e.target.value })}>
              {Object.entries(groupedTopics).map(([subjectName, subjectTopics]) => (
                <optgroup key={subjectName} label={subjectName}>
                  {subjectTopics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.unit} › {t.topic} — {t.learningOutcome.substring(0, 50)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="flex gap-4 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-1">
              <Upload className="w-4 h-4" />
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
