/**
 * Temporary image store for passing large image data between screens
 * This avoids slow navigation when passing base64 through URL params
 */

interface ImageData {
  uri: string;
  base64: string;
  width: number;
  height: number;
}

// Simple in-memory store
let currentImage: ImageData | null = null;

export function setCurrentImage(image: ImageData) {
  currentImage = image;
}

export function getCurrentImage(): ImageData | null {
  return currentImage;
}

export function clearCurrentImage() {
  currentImage = null;
}


