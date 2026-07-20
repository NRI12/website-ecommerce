"use client";

import { useState } from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface GalleryImage {
  id: string;
  url: string;
  alt: string | null;
}

export function ProductImageGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [selected, setSelected] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const active = images[selected] ?? images[0];

  return (
    <div className="grid gap-3">
      <button
        type="button"
        onClick={() => setZoomOpen(true)}
        disabled={!active}
        className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
      >
        {active ? (
          <>
            <Image
              src={active.url}
              alt={active.alt ?? productName}
              fill
              priority
              className="object-cover"
            />
            <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              <ZoomIn className="size-3.5" />
              Phóng to
            </span>
          </>
        ) : null}
      </button>
      {images.length > 1 ? (
        <div className="grid grid-cols-5 gap-2">
          {images.slice(0, 6).map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Xem ảnh ${index + 1}`}
              aria-current={index === selected}
              className={cn(
                "relative aspect-square overflow-hidden rounded-md bg-muted ring-2 ring-transparent transition-all",
                index === selected ? "ring-primary" : "opacity-70 hover:opacity-100",
              )}
            >
              <Image src={image.url} alt={image.alt ?? productName} fill className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-3xl bg-transparent p-0 shadow-none ring-0" showCloseButton>
          <DialogTitle className="sr-only">{productName}</DialogTitle>
          {active ? (
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
              <Image
                src={active.url}
                alt={active.alt ?? productName}
                fill
                sizes="(min-width: 768px) 768px, 100vw"
                className="object-contain"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
