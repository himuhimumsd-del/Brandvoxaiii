// client/src/components/shared/VideoCard.jsx
import React, { useState } from 'react';
import { Play, Download, Trash, Share2, Globe, Lock, AlertCircle, Info } from 'lucide-react';
import { formatDate, formatCredits } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import toast from 'react-hot-toast';

export default function VideoCard({
  video,
  watermarkRequired = false,
  onPlay = null,
  onDelete = null,
  onToggleShare = null,
  showActions = true
}) {
  const [hovered, setHovered] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      toast.loading('Downloading video...');
      const response = await fetch(video.video_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brandvox-${video.title || 'video'}-${new Date(video.created_at).getTime()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success('Download complete!');
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to download video.');
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to permanently delete this video?')) {
      setDeleting(true);
      try {
        await onDelete(video.id);
        toast.success('Video removed.');
      } catch (err) {
        toast.error('Delete failed.');
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleShareClick = async (e) => {
    e.stopPropagation();
    setSharing(true);
    try {
      await onToggleShare(video.id, !video.is_public);
      toast.success(video.is_public ? 'Video set to private.' : 'Video shared to public gallery!');
    } catch (err) {
      toast.error('Failed to change sharing configurations.');
    } finally {
      setSharing(false);
    }
  };

  const handleCopyLink = (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/explore?search=${encodeURIComponent(video.title)}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Public link copied to clipboard!');
  };

  return (
    <div
      className="relative flex flex-col bg-surface border border-white/5 rounded-xl overflow-hidden hover-scale group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Video Player / Thumbnail Preview Panel */}
      <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
        {video.status === 'completed' ? (
          video.video_url ? (
            <div className="relative w-full h-full cursor-pointer" onClick={() => onPlay && onPlay(video)}>
              {/* Actual Video Hover-Preview or static image */}
              <video
                src={video.video_url}
                muted
                playsInline
                loop
                className="w-full h-full object-cover"
                onMouseOver={(e) => e.target.play()}
                onMouseOut={(e) => {
                  e.target.pause();
                  e.target.currentTime = 0;
                }}
              />
              
              {/* Premium Watermark Overlay for Free Tier */}
              {watermarkRequired && (
                <>
                  <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded border border-white/10 text-[9px] font-black uppercase text-primary pointer-events-none select-none tracking-widest z-20 animate-pulse">
                    BrandVox AI Free
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 overflow-hidden">
                    <span className="text-white/10 text-2xl font-black uppercase tracking-widest -rotate-25 whitespace-nowrap">
                      BrandVox AI
                    </span>
                  </div>
                </>
              )}

              {/* Hover actions block */}
              {hovered && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 transition-opacity">
                  <button className="bg-primary hover:bg-primary-hover p-3 rounded-full text-white shadow-glow transform scale-110 active:scale-95 transition-all">
                    <Play className="w-5 h-5 fill-current" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-white/30 text-xs">No media file.</div>
          )
        ) : video.status === 'processing' ? (
          <div className="flex flex-col items-center justify-center p-4 w-full h-full bg-surface-elevated/40">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs text-white/50 tracking-wider">Generating video...</span>
          </div>
        ) : video.status === 'failed' ? (
          <div className="flex flex-col items-center justify-center p-4 text-center w-full h-full bg-red-950/20">
            <AlertCircle className="w-6 h-6 text-error mb-1.5 animate-bounce" />
            <span className="text-xs text-error font-bold tracking-wide">Generation Failed</span>
            <p className="text-[10px] text-white/35 mt-1 truncate max-w-[200px]" title={video.error_message}>
              {video.error_message || 'API request timeout.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-white/30">
            <Info className="w-5 h-5 mb-1 animate-pulse" />
            <span className="text-xs">Queue position pending</span>
          </div>
        )}
      </div>

      {/* Title & Metadata Details Block */}
      <div className="p-4 flex flex-col justify-between flex-grow">
        <div>
          <div className="flex items-start justify-between">
            <h3 className="text-xs font-bold text-white truncate max-w-[180px]" title={video.title}>
              {video.title || 'Untitled Creation'}
            </h3>
            <Badge variant={video.status === 'completed' ? 'success' : video.status === 'failed' ? 'error' : 'warning'}>
              {video.status}
            </Badge>
          </div>
          <p className="text-[10.5px] text-white/50 leading-relaxed mt-2.5 line-clamp-2 h-8" title={video.prompt}>
            {video.prompt}
          </p>
        </div>

        {/* Info badges footer */}
        <div className="flex items-center justify-between border-t border-white/5 mt-4 pt-3.5 text-[10px] text-white/40 font-semibold uppercase tracking-wider">
          <div className="flex space-x-2">
            <span>{video.duration}s</span>
            <span>•</span>
            <span>{video.aspect_ratio}</span>
          </div>
          <span>Cost: {formatCredits(video.cost || 0)}</span>
        </div>

        {/* Action button triggers */}
        {showActions && video.status === 'completed' && (
          <div className="flex items-center justify-between border-t border-white/5 mt-3 pt-3">
            <div className="flex space-x-1.5">
              <button
                onClick={handleDownload}
                className="p-1.5 rounded-lg text-white/55 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Download MP4"
              >
                <Download className="w-4 h-4" />
              </button>
              
              {onToggleShare && (
                <button
                  onClick={handleShareClick}
                  disabled={sharing}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    video.is_public ? 'text-success hover:bg-success/5' : 'text-white/55 hover:text-white hover:bg-white/5'
                  }`}
                  title={video.is_public ? 'Set Private' : 'Make Public'}
                >
                  {video.is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </button>
              )}

              {video.is_public && (
                <button
                  onClick={handleCopyLink}
                  className="p-1.5 rounded-lg text-primary-hover hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Copy Share Link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {onDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-1.5 rounded-lg text-error/60 hover:text-error hover:bg-white/5 transition-colors cursor-pointer"
                title="Delete Generation"
              >
                <Trash className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
