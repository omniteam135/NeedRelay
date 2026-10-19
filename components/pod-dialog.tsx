'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Loader2, Image as ImageIcon } from 'lucide-react';
import type { Incident, Volunteer } from '@/lib/types';
import { runAgent4 } from '@/lib/agents/pipeline';
import { toast } from 'sonner';

export function PodDialog({
  incident,
  volunteer,
  open,
  onOpenChange,
}: {
  incident: Incident | null;
  volunteer: Volunteer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [message, setMessage] = useState('');
  const [imageName, setImageName] = useState('');
  const [busy, setBusy] = useState(false);

  if (!incident || !volunteer) return null;

  async function submit() {
    if (!message.trim()) {
      toast.error('Please enter a delivery confirmation message.');
      return;
    }
    setBusy(true);
    try {
      const result = await runAgent4(incident!.id, volunteer!.id, message.trim(), imageName.trim() || null);
      if (result.accepted) {
        toast.success(`Incident resolved — ${result.verdict}`);
      } else {
        toast.warning(`PoD rejected: ${result.verdict}`);
      }
      onOpenChange(false);
      setMessage('');
      setImageName('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Proof of Delivery
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Volunteer <span className="text-foreground font-medium">{volunteer!.name}</span> confirming delivery for{' '}
            <span className="text-foreground font-medium">{incident!.extraction.needType}</span> at{' '}
            {incident!.extraction.landmark}, {incident!.extraction.city}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label htmlFor="pod-msg" className="text-xs">Closing confirmation message</Label>
            <Textarea
              id="pod-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Ration dropped successfully at site. 4 families received supplies. Area now clear."
              className="mt-1 bg-background/60"
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="pod-img" className="text-xs">Photo filename (simulated)</Label>
            <div className="flex items-center gap-2 mt-1">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <Input
                id="pod-img"
                value={imageName}
                onChange={(e) => setImageName(e.target.value)}
                placeholder="e.g. ration-drop-site.jpg"
                className="bg-background/60"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy} className="bg-emerald-600 hover:bg-emerald-500 text-white">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Submit for Audit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
