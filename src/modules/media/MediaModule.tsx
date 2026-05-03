import React, { useRef } from 'react';
import styles from './MediaModule.module.css';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { useScenarioStore } from '../../store/scenarioStore';
import type { MediaItem, MediaType } from '../../types';
import { Upload, Trash2, Image, Film, X, Eye } from 'lucide-react';

const MEDIA_TYPES: { value: MediaType; label: string }[] = [
  { value: 'xray', label: 'X-Ray / CXR' },
  { value: 'echo', label: 'Echocardiogram' },
  { value: 'ultrasound', label: 'Ultrasound' },
  { value: 'ct', label: 'CT Scan' },
  { value: 'mri', label: 'MRI' },
  { value: 'other', label: 'Other Imaging' },
];

export const MediaModule: React.FC = () => {
  const media = useScenarioStore((s) => s.activeScenario.media);
  const addMedia = useScenarioStore((s) => s.addMedia);
  const updateMedia = useScenarioStore((s) => s.updateMedia);
  const removeMedia = useScenarioStore((s) => s.removeMedia);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewItem, setPreviewItem] = React.useState<MediaItem | null>(null);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const item: MediaItem = {
        id: crypto.randomUUID(),
        name: file.name,
        url,
        mimeType: file.type,
        type: guessMediaType(file.name),
        date: new Date().toISOString().slice(0, 10),
        label: file.name.replace(/\.[^.]+$/, ''),
        notes: '',
        attachedToTimeline: false,
      };
      addMedia(item);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  };

  return (
    <div className={styles.root}>
      {/* Drop zone */}
      <div
        className={styles.dropZone}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className={styles.fileInput}
          onChange={(e) => handleFileUpload(e.target.files)}
        />
        <Upload size={24} className={styles.uploadIcon} />
        <p className={styles.dropTitle}>Drag &amp; drop files here, or click to browse</p>
        <p className={styles.dropHint}>Supports: JPG, PNG, GIF, DICOM, MP4, AVI — X-rays, Echo, CT, Ultrasound</p>
        <Button variant="secondary" size="sm" icon={<Upload size={13} />}
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
          Browse Files
        </Button>
      </div>

      {/* Media Grid */}
      {media.length > 0 && (
        <div className={styles.mediaGrid}>
          {media.map((item) => (
            <div key={item.id} className={styles.mediaCard}>
              {/* Thumbnail */}
              <div className={styles.thumbnail} onClick={() => setPreviewItem(item)}>
                {item.mimeType.startsWith('image/') ? (
                  <img src={item.url} alt={item.label} className={styles.thumbImg} />
                ) : (
                  <div className={styles.videoThumb}>
                    <Film size={32} className={styles.videoIcon} />
                    <span>{item.name}</span>
                  </div>
                )}
                <div className={styles.thumbOverlay}>
                  <Eye size={18} />
                </div>
              </div>

              {/* Meta */}
              <div className={styles.cardBody}>
                <div className={styles.cardTopRow}>
                  <Badge variant="info">{MEDIA_TYPES.find(t => t.value === item.type)?.label ?? item.type}</Badge>
                  <button className={styles.deleteBtn} onClick={() => removeMedia(item.id)}>
                    <Trash2 size={12} />
                  </button>
                </div>
                <Input
                  label="Label"
                  value={item.label}
                  onChange={(e) => updateMedia(item.id, { label: e.target.value })}
                  placeholder="Study label"
                />
                <Select
                  label="Type"
                  value={item.type}
                  onValueChange={(v) => updateMedia(item.id, { type: v as MediaType })}
                  options={MEDIA_TYPES}
                />
                <Input
                  label="Date"
                  type="date"
                  value={item.date}
                  onChange={(e) => updateMedia(item.id, { date: e.target.value })}
                />
                <Input
                  label="Notes"
                  value={item.notes}
                  onChange={(e) => updateMedia(item.id, { notes: e.target.value })}
                  placeholder="Findings / impression..."
                />
                <label className={styles.timelineCheck}>
                  <input type="checkbox" checked={item.attachedToTimeline}
                    onChange={(e) => updateMedia(item.id, { attachedToTimeline: e.target.checked })} />
                  Attach to timeline
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {media.length === 0 && (
        <div className={styles.emptyState}>
          <Image size={40} className={styles.emptyIcon} />
          <p>No imaging uploaded yet</p>
          <p className={styles.emptyHint}>Upload X-rays, Echo clips, CT scans to enrich the scenario</p>
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div className={styles.previewOverlay} onClick={() => setPreviewItem(null)}>
          <div className={styles.previewModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.previewHeader}>
              <span>{previewItem.label}</span>
              <button className={styles.closeBtn} onClick={() => setPreviewItem(null)}>
                <X size={16} />
              </button>
            </div>
            <div className={styles.previewContent}>
              {previewItem.mimeType.startsWith('image/') ? (
                <img src={previewItem.url} alt={previewItem.label} className={styles.previewImg} />
              ) : (
                <video src={previewItem.url} controls className={styles.previewVideo} />
              )}
            </div>
            {previewItem.notes && (
              <div className={styles.previewNotes}>{previewItem.notes}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function guessMediaType(filename: string): MediaType {
  const lower = filename.toLowerCase();
  if (lower.includes('echo') || lower.includes('cardiac')) return 'echo';
  if (lower.includes('cxr') || lower.includes('xray') || lower.includes('x-ray') || lower.includes('chest')) return 'xray';
  if (lower.includes('ct') || lower.includes('computed')) return 'ct';
  if (lower.includes('us') || lower.includes('ultrasound')) return 'ultrasound';
  if (lower.includes('mri')) return 'mri';
  return 'other';
}
