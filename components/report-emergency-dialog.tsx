'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MapPin, Camera, Crosshair, Loader2, Send, X, ImagePlus, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface ReportEmergencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    text: string;
    photoUrl: string | null;
    gps: { lat: number; lng: number } | null;
  }) => Promise<void>;
}

export function ReportEmergencyDialog({ open, onOpenChange, onSubmit }: ReportEmergencyDialogProps) {
  const [text, setText] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleGetLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation not supported on this device.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6) });
        setLocating(false);
        toast.success('Location captured.');
      },
      (err) => {
        setLocating(false);
        toast.error(`Location denied: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Photo too large (max 4MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setText('');
    setPhotoUrl(null);
    setGps(null);
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error('Please describe the emergency.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ text: text.trim(), photoUrl, gps });
      reset();
      onOpenChange(false);
    } catch {
      toast.error('Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/80">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            Report Emergency
          </DialogTitle>
          <DialogDescription className="text-xs">
            Share what&apos;s happening. Your location and photo help responders reach you faster. This feeds directly into the AI agent pipeline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* GPS */}
          <div className="rounded-md border border-border/60 bg-background/50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">My Location</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetLocation}
                disabled={locating}
                className="h-7 text-[11px]"
              >
                {locating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Crosshair className="h-3 w-3" />}
                {gps ? 'Re-capture' : 'Capture GPS'}
              </Button>
            </div>
            {gps ? (
              <div className="mt-2 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 rounded px-2 py-1">
                {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}
              </div>
            ) : (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Tap capture to share your live GPS coordinates.
              </p>
            )}
          </div>

          {/* Photo */}
          <div className="rounded-md border border-border/60 bg-background/50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">Photo</span>
              </div>
              <div className="flex items-center gap-1">
                {photoUrl && (
                  <Button variant="ghost" size="sm" onClick={() => setPhotoUrl(null)} className="h-7 text-[11px]">
                    <X className="h-3 w-3" /> Remove
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  className="h-7 text-[11px]"
                >
                  <ImagePlus className="h-3 w-3" /> Upload
                </Button>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
              </div>
            </div>
            {photoUrl ? (
              <img src={photoUrl} alt="Report" className="mt-2 w-full rounded-md max-h-40 object-cover" />
            ) : (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Optional but recommended — shows the situation to responders.
              </p>
            )}
          </div>

          {/* Text */}
          <div className="rounded-md border border-border/60 bg-background/50 p-3">
            <label className="text-xs font-medium flex items-center gap-2 mb-1.5">
              <Send className="h-3.5 w-3.5 text-primary" /> What&apos;s happening?
            </label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. 'Shadman Town Block B mein paani 3 feet hai, 4 log phanse hain, boat bhejein jaldi'"
              className="text-sm min-h-[80px] resize-none"
            />
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              Type in Roman-Urdu, Urdu, or English. Agent 1 will translate &amp; structure it.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <div className="flex items-center gap-1.5 mr-auto">
            {gps && <Badge variant="outline" className="text-[10px] border-emerald-500/50 text-emerald-400">GPS</Badge>}
            {photoUrl && <Badge variant="outline" className="text-[10px] border-sky-500/50 text-sky-400">Photo</Badge>}
            {text.trim() && <Badge variant="outline" className="text-[10px]">{text.trim().length} chars</Badge>}
          </div>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting || !text.trim()} className="bg-red-600 hover:bg-red-700 text-white">
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Send Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
