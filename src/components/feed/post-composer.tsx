"use client";

import { ImagePlus, MapPin, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, fileUrl } from "@/lib/api";
import { validateImageFile } from "@/lib/file";
import { postSchema } from "@/lib/schemas";
import { primaryTone, textareaClass } from "@/lib/ui";
import { cn, getInitials } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import * as postService from "@/services/posts";
import type { Post } from "@/types";

const MAX_LENGTH = 500;

const geocodingConfigSchema = z.object({
  reverseGeocodeUrl: z.string().url(),
});

const reverseGeocodeResponseSchema = z.object({
  error: z.string().optional(),
  address: z
    .object({
      city: z.string().optional(),
      town: z.string().optional(),
      village: z.string().optional(),
      neighbourhood: z.string().optional(),
      quarter: z.string().optional(),
      suburb: z.string().optional(),
      hamlet: z.string().optional(),
      city_district: z.string().optional(),
      borough: z.string().optional(),
      district: z.string().optional(),
      municipality: z.string().optional(),
      county: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
});

type LocationOption = { label: string; value: string };
type ReverseGeocodeAddress = NonNullable<
  z.infer<typeof reverseGeocodeResponseSchema>["address"]
>;

function buildLocationOptions(address: ReverseGeocodeAddress): LocationOption[] {
  const areas = [
    {
      level: "Neighborhood",
      name:
        address.neighbourhood ??
        address.quarter ??
        address.suburb ??
        address.hamlet,
    },
    {
      level: "District",
      name:
        address.city_district ??
        address.borough ??
        address.district ??
        address.municipality ??
        address.county,
    },
    {
      level: "City",
      name: address.city ?? address.town ?? address.village,
    },
    { level: "Region", name: address.state },
    { level: "Country", name: address.country },
  ].filter(
    (area): area is { level: string; name: string } => Boolean(area.name)
  );
  const cityIndex = areas.findIndex((area) => area.level === "City");

  return areas
    .map((area, index) => {
      const endIndex = cityIndex >= index ? cityIndex : index;
      return {
        label: `${area.level}: ${area.name}`,
        value: areas
          .slice(index, endIndex + 1)
          .map((part) => part.name)
          .join(", "),
      };
    })
    .filter(
      (option, index, options) =>
        options.findIndex((candidate) => candidate.value === option.value) ===
        index
    );
}

export function PostComposer({ onCreated }: { onCreated: (post: Post) => void }) {
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [locationError, setLocationError] = useState("");
  const [findingLocation, setFindingLocation] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastLocationLookup = useRef(0);
  const locationCache = useRef(new Map<string, LocationOption[]>());

  if (!user) return null;

  // Satu pintu untuk mengganti/menghapus gambar, sekaligus melepas URL pratinjau lama
  const setPicked = (next: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : null);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = ""; // supaya memilih file yang sama dua kali tetap terdeteksi
    if (!picked) return;

    const message = validateImageFile(picked);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setPicked(picked);
  };

  const findLocation = () => {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Location is not supported by this browser.");
      return;
    }

    setFindingLocation(true);
    setLocationOptions([]);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const cacheKey = `${coords.latitude.toFixed(3)},${coords.longitude.toFixed(3)}`;
        const cachedLocation = locationCache.current.get(cacheKey);
        if (cachedLocation) {
          setLocationOptions(cachedLocation);
          setLocation(cachedLocation[0].value);
          setFindingLocation(false);
          return;
        }

        try {
          const configResponse = await fetch("/geocoding-config.json", {
            cache: "no-store",
          });
          if (!configResponse.ok) {
            throw new Error("Unable to load location service configuration.");
          }

          const config = geocodingConfigSchema.safeParse(
            await configResponse.json()
          );
          if (!config.success) {
            throw new Error("Invalid location service configuration.");
          }

          const url = new URL(config.data.reverseGeocodeUrl);
          url.search = new URLSearchParams({
            format: "jsonv2",
            addressdetails: "1",
            zoom: "14",
            lat: String(coords.latitude),
            lon: String(coords.longitude),
          }).toString();

          if (Date.now() - lastLocationLookup.current < 1_000) {
            throw new Error("Please wait a moment before looking up your location again.");
          }
          lastLocationLookup.current = Date.now();

          const response = await fetch(url, {
            headers: { Accept: "application/json" },
          });
          if (!response.ok) {
            throw new Error("Unable to look up this location.");
          }

          const result = reverseGeocodeResponseSchema.safeParse(
            await response.json()
          );
          if (!result.success) {
            throw new Error("Could not read the location service response.");
          }
          if (result.data.error) {
            throw new Error(result.data.error);
          }

          const address = result.data.address;
          const options = address ? buildLocationOptions(address) : [];
          if (options.length === 0) {
            throw new Error("Could not find a city or region for this location.");
          }

          locationCache.current.set(cacheKey, options);
          setLocationOptions(options);
          setLocation(options[0].value);
        } catch (err) {
          setLocationError(
            err instanceof Error
              ? err.message
              : "Unable to look up this location."
          );
        } finally {
          setFindingLocation(false);
        }
      },
      (err) => {
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Allow location access in your browser to use this feature."
            : err.code === err.TIMEOUT
              ? "Timed out while getting your location. Please try again."
              : "Your location is currently unavailable."
        );
        setFindingLocation(false);
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 }
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = postSchema.safeParse({ content, location });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (!parsed.data.content && !file) {
      setError("Write something or send image");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (parsed.data.content) formData.append("content", parsed.data.content);
      if (parsed.data.location) formData.append("location", parsed.data.location);
      if (file) formData.append("image", file);

      const res = await postService.createPost(formData);
      onCreated(res.post);
      toast.success("Post shared");

      // Berhasil: kosongkan draf dan tutup
      setContent("");
      setLocation("");
      setLocationOptions([]);
      setPicked(null);
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.errors?.content ??
            err.errors?.location ??
            err.errors?.image ??
            err.message)
          : "Error occured, please try again"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onCancel = () => {
    setContent("");
    setLocation("");
    setLocationOptions([]);
    setLocationError("");
    setError("");
    setPicked(null);
    setOpen(false);
  };

  const avatar = (
    <Avatar className="size-10 shrink-0">
      <AvatarImage src={fileUrl(user.avatar)} alt={user.name} />
      <AvatarFallback className="bg-slate-200 text-sm font-medium text-slate-700">
        {getInitials(user.name)}
      </AvatarFallback>
    </Avatar>
  );

  const empty = !content.trim() && !file;

  return (
    <>
      {/* Bar pemicu di atas feed */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:px-5">
        {avatar}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="min-w-0 flex-1 truncate rounded-full bg-slate-50 px-4 py-2.5 text-left text-sm text-slate-500 transition-colors hover:bg-slate-100"
        >
          Share your thoughts or information to fellow ConnectSpacers...
        </button>
        <Button type="button" className={primaryTone} onClick={() => setOpen(true)}>
          Post
        </Button>
      </div>

      {/* Menutup overlay mempertahankan draf; tombol Cancel membuangnya. */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New post</DialogTitle>
            <DialogDescription className="sr-only">
              Write text or share image to your fellows
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="flex gap-3">
              {avatar}
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Hi! I'm thinking about..."
                  className={textareaClass}
                  aria-invalid={content.length > MAX_LENGTH}
                />    
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {/* <MapPin
                      className="size-4 shrink-0 text-slate-500"
                      aria-hidden="true"
                    /> */}
                    <p className="pl-2 text-xs text-slate-500">
                      Location is shared with OpenStreetMap only when requested.{" "}<br></br>
                      <a
                        href="https://www.openstreetmap.org/copyright"
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2"
                      >
                        © OpenStreetMap contributors
                      </a>
                    </p>
                  </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="grow shadow-xl border-slate-400 text-xs text-slate-900 hover:bg-slate-200 hover:text-black transition"
                      onClick={findLocation}
                      disabled={findingLocation}>
                      <MapPin
                      className="size-4 shrink-0 text-slate-500"
                      aria-hidden="true"/>   
                      {findingLocation ? "Finding..." : `Use my location`}
                    </Button>

              {locationOptions.length > 1 && (
                <div className="space-y-1 pl-6">
                  <label
                    htmlFor="post-location-detail"
                    className="block text-xs text-slate-600"
                  >
                    Choose location detail
                  </label>
                  <select
                    id="post-location-detail"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
                  >
                    {locationOptions.map((option) => (
                      <option key={option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {locationError && (
                <p role="alert" className="pl-6 text-sm text-red-600">
                  {locationError}
                </p>
              )}
            </div>            
              </div>
            </div>
            {preview && (
              <div className="relative w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Image preview"
                  className="max-h-72 w-auto max-w-full rounded-lg border border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setPicked(null)}
                  aria-label="Delete image"
                  className="absolute right-2 top-2 rounded-full bg-slate-900/70 p-1 text-white transition-colors hover:bg-slate-900"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg, image/jpg, image/png,image/webp"
                  className="hidden"
                  onChange={onPick}
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="text-slate-600"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus className="size-4" />
                  Image
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "text-xs tabular-nums text-slate-400",
                    content.length > MAX_LENGTH && "text-red-600"
                  )}
                >
                  {content.length}/{MAX_LENGTH}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-slate-600"
                  onClick={onCancel}
                  disabled={submitting || findingLocation}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className={primaryTone}
                  disabled={submitting || empty || content.length > MAX_LENGTH }
                >
                  {submitting ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}