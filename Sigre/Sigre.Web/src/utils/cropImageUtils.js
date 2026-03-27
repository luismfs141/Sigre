export const getCroppedImg = (imageSrc, pixelCrop, fileName = 'recorte.jpg') => {
    return new Promise((resolve, reject) => {
        const image = new window.Image();
        image.src = imageSrc;
        image.crossOrigin = "anonymous";
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = pixelCrop.width;
            canvas.height = pixelCrop.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(
                image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
                0, 0, pixelCrop.width, pixelCrop.height
            );
            canvas.toBlob((blob) => {
                if (!blob) { reject(new Error('Canvas vacío')); return; }
                resolve(new File([blob], fileName, { type: 'image/jpeg' }));
            }, 'image/jpeg', 0.95);
        };
        image.onerror = (error) => reject(error);
    });
};