import loadImage from 'blueimp-load-image';

export async function resizeImageFile(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number,
  type: string,
): Promise<File> {
  // throws on unsupported file types
  const result = await loadImage(file, {
    maxWidth,
    maxHeight,
    contain: true,
    orientation: true,
    canvas: true,
  });

  const canvas = result.image as HTMLCanvasElement;

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to convert canvas to blob'));
          return;
        }
        resolve(new File([blob], file.name, { type }));
      },
      type,
      quality,
    );
  });
}
