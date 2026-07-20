"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProductAction, updateProductAction } from "@/lib/actions/product-actions";
import { createProductImageUploadUrlAction } from "@/lib/actions/upload-actions";

const UPLOADABLE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
type UploadableType = (typeof UPLOADABLE_TYPES)[number];

function isUploadableType(value: string): value is UploadableType {
  return (UPLOADABLE_TYPES as readonly string[]).includes(value);
}

interface VariantRow {
  sku: string;
  attributeLabel: string;
  attributeValue: string;
  price: string;
  compareAtPrice: string;
  stock: string;
}

interface ProductFormProps {
  categories: { id: string; name: string }[];
  product?: {
    id: string;
    name: string;
    description: string;
    categoryId: string;
    status: "DRAFT" | "ACTIVE" | "ARCHIVED";
    images: { url: string }[];
    variants: { sku: string; attributes: unknown; price: number; compareAtPrice: number | null; stock: number }[];
  };
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Nháp",
  ACTIVE: "Đang bán",
  ARCHIVED: "Ngừng bán",
};

function emptyVariant(): VariantRow {
  return { sku: "", attributeLabel: "Loại", attributeValue: "", price: "", compareAtPrice: "", stock: "0" };
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE" | "ARCHIVED">(product?.status ?? "DRAFT");
  const [imagesText, setImagesText] = useState(product?.images.map((i) => i.url).join("\n") ?? "");
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants.length
      ? product.variants.map((v) => {
          const attrs = (v.attributes ?? {}) as Record<string, string>;
          const [label, value] = Object.entries(attrs)[0] ?? ["Loại", ""];
          return {
            sku: v.sku,
            attributeLabel: label,
            attributeValue: value,
            price: String(v.price),
            compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : "",
            stock: String(v.stock),
          };
        })
      : [emptyVariant()],
  );

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function updateVariant(index: number, patch: Partial<VariantRow>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        if (!isUploadableType(file.type)) {
          setUploadError(`${file.name}: định dạng không được hỗ trợ (chỉ JPG/PNG/WebP/AVIF).`);
          continue;
        }

        const result = await createProductImageUploadUrlAction({ contentType: file.type });
        if (!result.success) {
          setUploadError(result.message);
          continue;
        }

        const putResponse = await fetch(result.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!putResponse.ok) {
          setUploadError(`Tải lên "${file.name}" thất bại.`);
          continue;
        }

        setImagesText((prev) => (prev ? `${prev}\n${result.publicUrl}` : result.publicUrl));
      }
    } finally {
      setIsUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    const images = imagesText.split("\n").map((s) => s.trim()).filter(Boolean);
    const payload = {
      name: String(formData.get("name")),
      description: String(formData.get("description")),
      categoryId,
      status,
      images,
      variants: variants.map((v) => ({
        sku: v.sku,
        attributes: v.attributeLabel ? { [v.attributeLabel]: v.attributeValue } : {},
        price: Number(v.price),
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
        stock: Number(v.stock),
      })),
    };

    startTransition(async () => {
      const result = product
        ? await updateProductAction(product.id, payload)
        : await createProductAction(payload);

      if (!result.success) {
        setError(result.message ?? "Có lỗi xảy ra.");
        return;
      }
      router.push("/vendor/products");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name" className="mb-2">Tên sản phẩm</Label>
          <Input id="name" name="name" defaultValue={product?.name} required />
        </div>
        <div>
          <Label className="mb-2">Danh mục</Label>
          <Select
            items={Object.fromEntries(categories.map((c) => [c.id, c.name]))}
            value={categoryId}
            onValueChange={(value) => setCategoryId(value ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn danh mục" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description" className="mb-2">Mô tả</Label>
        <Textarea id="description" name="description" rows={5} defaultValue={product?.description} required />
      </div>

      <div>
        <Label htmlFor="imageUpload" className="mb-2">Hình ảnh</Label>
        <Input
          id="imageUpload"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          disabled={isUploading}
          onChange={(e) => {
            void handleFilesSelected(e.target.files);
            e.target.value = "";
          }}
        />
        {isUploading ? <p className="mt-1 text-sm text-muted-foreground">Đang tải ảnh lên...</p> : null}
        {uploadError ? <p className="mt-1 text-sm text-destructive">{uploadError}</p> : null}
        <Textarea
          id="images"
          className="mt-2"
          rows={3}
          value={imagesText}
          onChange={(e) => setImagesText(e.target.value)}
          placeholder="Ảnh đã tải lên sẽ hiện ở đây, hoặc dán URL trực tiếp (mỗi dòng một URL)"
        />
      </div>

      <div>
        <Label className="mb-2">Trạng thái</Label>
        <Select
          items={STATUS_LABELS}
          value={status}
          onValueChange={(v) => setStatus(v as typeof status)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DRAFT">Nháp</SelectItem>
            <SelectItem value="ACTIVE">Đang bán</SelectItem>
            <SelectItem value="ARCHIVED">Ngừng bán</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Biến thể (variants)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setVariants((prev) => [...prev, emptyVariant()])}
          >
            <Plus className="size-4" /> Thêm biến thể
          </Button>
        </div>
        <div className="grid gap-3">
          {variants.map((variant, index) => (
            <div key={index} className="grid grid-cols-2 gap-2 rounded-lg border p-3 sm:grid-cols-6">
              <Input
                placeholder="Thuộc tính (VD: Màu sắc)"
                value={variant.attributeLabel}
                onChange={(e) => updateVariant(index, { attributeLabel: e.target.value })}
              />
              <Input
                placeholder="Giá trị (VD: Đen)"
                value={variant.attributeValue}
                onChange={(e) => updateVariant(index, { attributeValue: e.target.value })}
              />
              <Input
                placeholder="SKU (để trống tự tạo)"
                value={variant.sku}
                onChange={(e) => updateVariant(index, { sku: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Giá"
                value={variant.price}
                onChange={(e) => updateVariant(index, { price: e.target.value })}
                required
              />
              <Input
                type="number"
                placeholder="Tồn kho"
                value={variant.stock}
                onChange={(e) => updateVariant(index, { stock: e.target.value })}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={variants.length <= 1}
                onClick={() => setVariants((prev) => prev.filter((_, i) => i !== index))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Đang lưu..." : product ? "Lưu thay đổi" : "Tạo sản phẩm"}
      </Button>
    </form>
  );
}
