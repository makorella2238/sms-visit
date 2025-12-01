import React, { useRef, useCallback, useState } from 'react';
import './ImageUpload.css'

export interface ImageFile {
    id: string;
    file?: File;
    preview: string;
    name: string;
    url?: string;
    mimetype?: string;
    size?: number;
    filename?: string;
}

interface ImageUploadProps {
    images?: ImageFile[];
    onChange: (updated: ImageFile[]) => void;
    maxImages?: number;
}

const BUCKET_ID = "2797680b-cef8f9ba-a621-4c39-b9fc-7908a8823878"; // ← фиксированный bucket

export const ImageUpload: React.FC<ImageUploadProps> = ({
                                                            images = [],
                                                            onChange,
                                                            maxImages = 5,
                                                        }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState('');

    /** ★ Фиксация URL — принудительно вставляем bucket */
    const fixS3Url = (url: string): string => {
        if (!url) return url;

        // если bucket уже есть → ничего не делаем
        if (url.includes(BUCKET_ID)) return url;

        // убираем домен
        const clean = url.replace("https://s3.twcstorage.ru/", "");

        // подставляем новый правильный путь
        return `https://s3.twcstorage.ru/${BUCKET_ID}/${clean}`;
    };

    /** ★ Нормализуем уже загруженные изображения */
    const normalizedImages = images.map(img => ({
        ...img,
        preview: img.file ? img.preview : fixS3Url(img.preview),
        url: img.url ? fixS3Url(img.url) : undefined
    }));


    const validateFile = (file: File): string => {
        if (!file.type.startsWith('image/')) return 'Можно загружать только изображения';
        if (file.size > 10 * 1024 * 1024) return 'Размер изображения не должен превышать 10MB';
        return '';
    };

    const handleFiles = useCallback(
        (files: FileList) => {
            const newImages: ImageFile[] = [];
            let newError = '';

            if (normalizedImages.length + files.length > maxImages) {
                setError(`Можно загрузить не более ${maxImages} изображений`);
                return;
            }

            Array.from(files).forEach((file) => {
                const validationError = validateFile(file);
                if (validationError) {
                    newError = validationError;
                    return;
                }

                newImages.push({
                    id: Math.random().toString(36).substr(2, 9),
                    file,
                    preview: URL.createObjectURL(file),
                    name: file.name,
                    filename: file.name,
                });
            });

            if (newError) setError(newError);
            else setError('');

            if (newImages.length > 0) {
                onChange([...normalizedImages, ...newImages]);
            }
        },
        [normalizedImages, maxImages, onChange]
    );

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
            e.target.value = '';
        }
    };

    const removeImage = (id: string) => {
        const updated = normalizedImages.filter(img => img.id !== id);
        onChange(updated);
    };

    return (
        <>
            <div className={`image-upload-inline ${normalizedImages.length > 0 ? 'download' : ''}`}>
                <button
                    type="button"
                    className="clip-btn"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Загрузить изображение"
                >
                    <img src={'/clip-icon.svg'} alt={'clip-icon'} />
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />

                <div className="image-list">
                    {normalizedImages.map((img) => (
                        <div key={img.id} className="image-item-inline">
                            <img src={img.preview} alt={img.name} className="image-thumb" />
                            <button
                                type="button"
                                className="remove-btn"
                                onClick={() => removeImage(img.id)}
                                aria-label="Удалить"
                            >
                                <img className='krestik_icon' src='/krestik.png' alt='krestik'/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}
        </>
    );
};
