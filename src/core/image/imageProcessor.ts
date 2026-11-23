import exifr from 'exifr';
import { PhotoItem } from '../../types';

/**
 * Reads EXIF orientation and returns rotation in degrees
 */
export async function getExifRotationDegrees(file: File): Promise<number> {
  try {
    const exif = await exifr.parse(file, ['Orientation']);
    if (!exif || !exif.Orientation) return 0;

    switch (exif.Orientation) {
      case 3:
        return 180;
      case 6:
        return 90;
      case 8:
        return 270;
      default:
        return 0;
    }
  } catch (err) {
    console.warn('Could not read EXIF data:', err);
    return 0;
  }
}

import { savePhotoBlob, getPhotoBlob } from '../storage/indexedDbStorage';

/**
 * Loads an image file and returns PhotoItem with dimensions and aspect ratio.
 * Persists binary Blob in IndexedDB to survive page reloads/F5.
 */
export async function processUploadedFile(file: File): Promise<PhotoItem> {
  const photoId = 'photo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  const url = URL.createObjectURL(file);
  const exifRotation = await getExifRotationDegrees(file);

  // Save blob in IndexedDB
  await savePhotoBlob(photoId, file);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      // If EXIF orientation is 90 or 270, swap effective dimensions
      if (exifRotation === 90 || exifRotation === 270) {
        const temp = width;
        width = height;
        height = temp;
      }

      const aspect = width / height;

      resolve({
        id: photoId,
        file,
        url,
        originalName: file.name,
        widthPx: width,
        heightPx: height,
        aspect,
        rotation: exifRotation,
        sizeBytes: file.size,
        status: 'ready'
      });
    };

    img.onerror = () => {
      reject(new Error(`Không thể đọc file ảnh: ${file.name}`));
    };

    img.src = url;
  });
}

/**
 * Restores live blob URLs for photos when reopening a project or after page reload (F5)
 */
export async function restoreProjectPhotos(photos: PhotoItem[]): Promise<PhotoItem[]> {
  return Promise.all(
    photos.map(async (photo) => {
      // Check if current URL is still valid or if it needs restoring from IndexedDB
      if (!photo.url || photo.url.startsWith('blob:')) {
        const blob = await getPhotoBlob(photo.id);
        if (blob) {
          const freshUrl = URL.createObjectURL(blob);
          const restoredFile = photo.file || (blob instanceof File ? blob : new File([blob], photo.originalName, { type: blob.type }));
          return {
            ...photo,
            url: freshUrl,
            file: restoredFile,
            status: 'ready'
          };
        }
      }
      return photo;
    })
  );
}

/**
 * Creates a scaled thumbnail data URL for lightweight rendering
 */
export function createThumbnail(img: HTMLImageElement, maxDim: number = 300): string {
  const canvas = document.createElement('canvas');
  let { width, height } = img;

  if (width > height) {
    if (width > maxDim) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    }
  } else {
    if (height > maxDim) {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }
  return img.src;
}
