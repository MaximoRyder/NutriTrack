"use client";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import React, { useCallback, useState } from "react";
import Cropper from "react-easy-crop";

interface AvatarCropDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCropped: (url: string) => void;
}

type Area = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function getCroppedCanvas(
  image: HTMLImageElement,
  crop: Area,
  rotation: number = 0
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const size = 512; // final avatar size
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-size / 2, -size / 2);
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    size,
    size
  );
  ctx.restore();
  return canvas;
}

export const AvatarCropDialog: React.FC<AvatarCropDialogProps> = ({
  isOpen,
  onOpenChange,
  onCropped,
}) => {
  const { t } = useTranslation();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setLoading(true);
    try {
      const img = document.createElement("img");
      img.src = imageSrc;
      await new Promise((res, rej) => {
        img.onload = () => res(null);
        img.onerror = rej;
      });
      const canvas = getCroppedCanvas(img, croppedAreaPixels, 0);
      const blob: Blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9)
      );
      const formData = new FormData();
      formData.append(
        "file",
        new File([blob], "avatar.jpg", { type: "image/jpeg" })
      );
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      onCropped(json.url);
      onOpenChange(false);
      toast({ title: t("settings.avatarUpdated") });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("settings.updateAvatar")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!imageSrc && (
            <ImageUpload
              value=""
              onChange={(base64) => setImageSrc(base64)}
              className="h-64"
            />
          )}
          {imageSrc && (
            <div className="relative h-[400px] bg-muted rounded">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
          )}
          {imageSrc && (
            <div className="space-y-2">
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.01}
                onValueChange={(v) => setZoom(v[0])}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setImageSrc(null)}
                  disabled={loading}
                >
                  {t("settings.change")}
                </Button>
                <Button type="button" onClick={handleSave} disabled={loading}>
                  {loading ? t("settings.uploading") : t("settings.save")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
