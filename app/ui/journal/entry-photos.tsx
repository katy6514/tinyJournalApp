"use client";

import { useState } from "react";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";

import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";

import { Photo } from "@/app/lib/definitions";

export default function EntryPhotos({ photos }: { photos: Photo[] }) {
  const [index, setIndex] = useState(-1);

  if (!photos || photos.length === 0) return null;

  const slides = photos.map((photo) => ({
    key: photo.photo_id,
    src: photo.path,
    width: photo.width,
    height: photo.height,
    title: photo.title || "",
    description: photo.description || "",
  }));

  return (
    <>
      <RowsPhotoAlbum
        photos={slides}
        targetRowHeight={120}
        onClick={({ index }) => setIndex(index)}
      />
      <Lightbox
        slides={slides}
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        plugins={[Fullscreen, Zoom, Captions]}
      />
    </>
  );
}
