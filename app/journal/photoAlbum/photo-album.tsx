// app/journal/photoAlbum/PhotoAlbum.tsx
"use client";

import React, { useState } from "react";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";

import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";

import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Slideshow from "yet-another-react-lightbox/plugins/slideshow";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { Photo } from "@/app/lib/definitions";

type AlbumPhoto = {
  key: string;
  src: string;
  photo_id: string;
  width: number;
  height: number;
  title: string;
  description: string;
};

export default function PhotoAlbum({ photos }: { photos: Photo[] }) {
  const [index, setIndex] = useState(-1);

  const albumPhotos: AlbumPhoto[] = photos.map((photo) => ({
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
      <RowsPhotoAlbum<AlbumPhoto>
        key={index}
        photos={albumPhotos}
        targetRowHeight={150}
        onClick={({ index }) => setIndex(index)}
        render={{
          wrapper: (props, { photo }) => (
            <div {...props} style={{ ...props.style, position: "relative", overflow: "hidden" }}>
              {props.children}
              {photo.description && (
                <p
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    margin: 0,
                    padding: "20px 8px 6px",
                    background: "linear-gradient(transparent, rgba(0,0,0,0.65))",
                    color: "#fff",
                    fontSize: 11,
                    lineHeight: 1.3,
                    pointerEvents: "none",
                  }}
                >
                  {photo.description}
                </p>
              )}
            </div>
          ),
        }}
      />
      <Lightbox
        slides={albumPhotos}
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        plugins={[Fullscreen, Slideshow, Thumbnails, Zoom, Captions]}
      />
    </>
  );
}
