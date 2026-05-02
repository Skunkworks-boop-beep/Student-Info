import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { paths } from '../paths';
import { Upload, X, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { CATEGORIES, type Category } from '../data/mock-data';
import { motion } from 'motion/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useSound } from '../audio/sound-context';
import { useAuth } from '../components/auth-context';
import { getSupabaseClient } from '../../lib/supabase';
import { createComplaintRow, uploadComplaintMediaFiles } from '../api/supabase-api';

interface AttachmentPreview {
  id: string;
  name: string;
  type: string;
  size: number;
  previewUrl?: string;
  file: File;
}

export function SubmitComplaintPage() {
  const { play } = useSound();
  const navigate = useNavigate();
  const { user, backendMode, refreshProfile } = useAuth();
  const supabase = getSupabaseClient();
  const cloud = backendMode === 'supabase';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [location, setLocation] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      attachments.forEach(a => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
      });
    };
  }, [attachments]);

  const validate = () => {
    const e: Record<string, string> = {};
    const normalizedTitle = title.trim().replace(/\s{2,}/g, ' ');
    const normalizedDescription = description.trim().replace(/\s{2,}/g, ' ');
    const normalizedLocation = location.trim().replace(/\s{2,}/g, ' ');

    if (!normalizedTitle) e.title = 'Title is required';
    else if (normalizedTitle.length < 8) e.title = 'Title should be at least 8 characters';
    else if (normalizedTitle.length > 120) e.title = 'Max 120 characters';

    if (!normalizedDescription) e.description = 'Description is required';
    else if (normalizedDescription.length < 20) e.description = 'Description should be at least 20 characters';
    else if (normalizedDescription.length > 5000) e.description = 'Max 5,000 characters';

    if (!category) e.category = 'Select a category';
    if (normalizedLocation.length > 120) e.location = 'Location must be 120 characters or fewer';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) {
      play('error');
      return;
    }
    setIsSubmitting(true);
    setCreatedId(null);

    if (cloud && supabase && user) {
      const normalizedTitle = title.trim().replace(/\s{2,}/g, ' ');
      const normalizedDescription = description.trim().replace(/\s{2,}/g, ' ');
      const normalizedLocation = location.trim().replace(/\s{2,}/g, ' ');
      try {
        const files = attachments.map(a => a.file);
        const media_urls =
          files.length > 0 ? await uploadComplaintMediaFiles(supabase, user.id, files) : [];
        const id = await createComplaintRow(supabase, {
          user_id: user.id,
          title: normalizedTitle,
          description: normalizedDescription,
          category: category as Category,
          priority,
          location: normalizedLocation,
          is_anonymous: isAnonymous,
          media_urls,
        });
        setCreatedId(id);
        await refreshProfile();
        play('success');
        setSubmitted(true);
      } catch (err) {
        setErrors(prev => ({
          ...prev,
          form: err instanceof Error ? err.message : 'Could not submit. Check your connection and Supabase policies.',
        }));
        play('error');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    play('success');
    setSubmitted(true);
    setIsSubmitting(false);
  };

  const handleAttachmentChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files);
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ];
    const next: AttachmentPreview[] = [];
    const maxFiles = 4;
    const maxPerFileBytes = 20 * 1024 * 1024;

    if (attachments.length + incoming.length > maxFiles) {
      setErrors(prev => ({ ...prev, attachment: `You can upload up to ${maxFiles} files.` }));
      return;
    }

    for (const file of incoming) {
      if (!allowed.includes(file.type)) {
        setErrors(prev => ({ ...prev, attachment: 'Allowed types: JPG, PNG, WEBP, MP4, WEBM, MOV.' }));
        return;
      }
      if (file.size > maxPerFileBytes) {
        setErrors(prev => ({ ...prev, attachment: 'Each file must be less than 20MB.' }));
        return;
      }
      const previewUrl = file.type.startsWith('image/') || file.type.startsWith('video/')
        ? URL.createObjectURL(file)
        : undefined;
      next.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        previewUrl,
        file,
      });
    }

    setAttachments(prev => [...prev, ...next]);
    setErrors(prev => {
      const next = { ...prev };
      delete next.attachment;
      return next;
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const target = prev.find(a => a.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter(a => a.id !== id);
    });
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto text-center py-16"
      >
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-xl mb-2" style={{ fontWeight: 700 }}>Thought Shared!</h1>
        <p className="text-muted-foreground mb-2 text-sm">
          {cloud && createdId
            ? 'Your thought is live for everyone on this Supabase project. +10 XP was applied by the database.'
            : 'Validation passed and XP is shown for feedback. In local demo mode new thoughts are not persisted—use Supabase env vars for a live feed.'}
        </p>
        <p className="text-sm text-primary mb-6" style={{ fontWeight: 600 }}>+10 XP earned!</p>
        {cloud && createdId && (
          <Link
            to={paths.complaint(createdId)}
            className="text-sm text-primary hover:underline block mb-6"
          >
            Open your new thread →
          </Link>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(paths.complaints)} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-sm">
            View Thoughts
          </button>
          <button onClick={() => {
            attachments.forEach(a => a.previewUrl && URL.revokeObjectURL(a.previewUrl));
            setSubmitted(false);
            setCreatedId(null);
            setTitle('');
            setDescription('');
            setCategory('');
            setLocation('');
            setAttachments([]);
            setErrors({});
          }} className="px-5 py-2.5 border border-border rounded-xl hover:bg-accent transition-colors text-sm">
            Submit Another
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="text-2xl sm:text-3xl mb-1" style={{ fontWeight: 700 }}>Share a Thought</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Share ideas, concerns, and observations to help your campus — constructive feedback welcome.
      </p>

      <form onSubmit={handleSubmit} className="premium-panel p-4 sm:p-6 space-y-5">
        {errors.form && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {errors.form}
          </div>
        )}
        {/* Title */}
        <div>
          <label className="text-sm mb-1.5 block">Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Brief summary of the issue"
            className={`w-full px-4 py-2.5 rounded-xl bg-input-background border ${errors.title ? 'border-red-500' : 'border-border'} focus:ring-2 focus:ring-primary/40 outline-none text-sm`}
          />
          <div className="flex justify-between mt-1">
            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
            <p className="text-xs text-muted-foreground ml-auto">{title.length}/120</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-sm mb-1.5 block">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Provide a detailed description of the issue..."
            rows={5}
            className={`w-full px-4 py-2.5 rounded-xl bg-input-background border ${errors.description ? 'border-red-500' : 'border-border'} focus:ring-2 focus:ring-primary/40 outline-none text-sm resize-none`}
          />
          <div className="flex justify-between mt-1">
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
            <p className="text-xs text-muted-foreground ml-auto">{description.length}/5000</p>
          </div>
        </div>

        {/* Category & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm mb-1.5 block">Category</label>
            <Select value={category || undefined} onValueChange={value => setCategory(value as Category)}>
              <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
          </div>
          <div>
            <label className="text-sm mb-1.5 block">Priority</label>
            <Select value={priority} onValueChange={value => setPriority(value as 'Low' | 'Medium' | 'High')}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-sm mb-1.5 block">Location <span className="text-muted-foreground">(optional)</span></label>
          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="e.g. Main Library - 3rd Floor"
            className={`w-full px-4 py-2.5 rounded-xl bg-input-background border ${errors.location ? 'border-red-500' : 'border-border'} focus:ring-2 focus:ring-primary/40 outline-none text-sm`}
          />
          {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
        </div>

        {/* File Upload */}
        <div>
          <label className="text-sm mb-1.5 block">Attachments <span className="text-muted-foreground">(optional, images/videos, up to 4 files)</span></label>
          <label className={`block border-2 border-dashed ${errors.attachment ? 'border-red-500' : 'border-border'} rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer`}>
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,.mov"
              className="hidden"
              onChange={e => {
                handleAttachmentChange(e.target.files);
                e.currentTarget.value = '';
              }}
            />
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Click to upload images or videos</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP, MP4, WEBM, MOV (max 20MB each)</p>
          </label>
          {errors.attachment && <p className="text-xs text-red-500 mt-1">{errors.attachment}</p>}
          {attachments.length > 0 && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {attachments.map(file => (
                <div key={file.id} className="rounded-xl border border-border p-2 bg-card">
                  <div className="relative rounded-lg overflow-hidden bg-muted/30 h-24">
                    {file.previewUrl && file.type.startsWith('image/') && (
                      <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
                    )}
                    {file.previewUrl && file.type.startsWith('video/') && (
                      <video src={file.previewUrl} className="w-full h-full object-cover" muted />
                    )}
                    {!file.previewUrl && (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Preview</div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(file.id)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[11px] mt-1 truncate" title={file.name}>{file.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Anonymous toggle */}
        <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-secondary/50 gap-3">
          <div className="flex items-center gap-3">
            {isAnonymous ? <EyeOff className="w-5 h-5 text-primary" /> : <Eye className="w-5 h-5 text-muted-foreground" />}
            <div>
              <p className="text-sm" style={{ fontWeight: 500 }}>Submit Anonymously</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground">Your identity will be hidden from other students</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`w-12 h-7 rounded-full transition-colors relative ${isAnonymous ? 'bg-primary' : 'bg-switch-background'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${isAnonymous ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Submit */}
        <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60">
          {isSubmitting ? 'Publishing...' : 'Publish Thought'}
        </button>
      </form>
    </div>
  );
}
