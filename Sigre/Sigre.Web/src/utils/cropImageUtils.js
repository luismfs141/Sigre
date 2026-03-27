export const getCroppedImg = (imageElement, pixelCrop, fileName = 'recorte.jpg') => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        
        // 🔥 LA MAGIA: Calculamos la escala entre la imagen original y la que se ve en pantalla
        const scaleX = imageElement.naturalWidth / imageElement.width;
        const scaleY = imageElement.naturalHeight / imageElement.height;

        canvas.width = pixelCrop.width * scaleX;
        canvas.height = pixelCrop.height * scaleY;
        
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
            imageElement,
            pixelCrop.x * scaleX,
            pixelCrop.y * scaleY,
            pixelCrop.width * scaleX,
            pixelCrop.height * scaleY,
            0,
            0,
            pixelCrop.width * scaleX,
            pixelCrop.height * scaleY
        );

        canvas.toBlob((blob) => {
            if (!blob) { reject(new Error('Canvas vacío')); return; }
            resolve(new File([blob], fileName, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.95);
    });
};