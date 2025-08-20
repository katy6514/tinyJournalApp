// app/journal/photoAlbum/PhotoAlbum.tsx
"use client";

import React, { useState } from "react";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";

import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";

// import optional lightbox plugins
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Slideshow from "yet-another-react-lightbox/plugins/slideshow";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { Photo } from "@/app/lib/definitions";

export default function PhotoAlbum({ photos }: { photos: Photo[] }) {
  const [index, setIndex] = useState(-1);

  // Map your Photo objects to the shape expected by react-photo-album
  const albumPhotos = photos.map((photo) => ({
    key: photo.photo_id,
    src: photo.path,
    photo_id: photo.photo_id,
    width: photo.width,
    height: photo.height,
    title: photo.title || "",
    description: photo.description || "",
  }));

  return (
    <>
      <RowsPhotoAlbum
        key={index}
        photos={albumPhotos}
        targetRowHeight={150}
        onClick={({ index }) => setIndex(index)}
      />
      <Lightbox
        slides={albumPhotos}
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        // enable optional lightbox plugins
        plugins={[Fullscreen, Slideshow, Thumbnails, Zoom, Captions]}
      />
    </>
  );
}
