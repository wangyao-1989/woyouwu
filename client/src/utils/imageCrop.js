export const createCroppedImage = (image, pixelCrop, width, height) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('No 2d context'));
      return;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      width,
      height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        blob.name = 'cropped.jpeg';
        const fileUrl = URL.createObjectURL(blob);
        resolve(fileUrl);
      },
      'image/jpeg',
      0.92
    );
  });
};

export const getCroppedImg = (image, pixelCrop) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imageRatio = image.width / image.height;
    const cropRatio = 1;

    let sourceX, sourceY, sourceWidth, sourceHeight;

    if (imageRatio > cropRatio) {
      sourceHeight = image.height;
      sourceWidth = image.height * cropRatio;
      sourceX = (image.width - sourceWidth) / 2;
      sourceY = 0;
    } else {
      sourceWidth = image.width;
      sourceHeight = image.width / cropRatio;
      sourceX = 0;
      sourceY = (image.height - sourceHeight) / 2;
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      sourceX + pixelCrop.x * (sourceWidth / pixelCrop.width),
      sourceY + pixelCrop.y * (sourceHeight / pixelCrop.height),
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        resolve(URL.createObjectURL(file));
      },
      'image/jpeg',
      0.92
    );
  });
};
