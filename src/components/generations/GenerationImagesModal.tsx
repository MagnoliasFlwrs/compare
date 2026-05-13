import React from 'react';
import { EditOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { Modal, Tooltip, Typography, Upload } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import type { Generation, GenerationImage } from '../../types/generation';
import { resolveImageUrl } from './utils';

interface Props {
    generation: Generation | null;
    images: GenerationImage[];
    loading: boolean;
    uploading: boolean;
    onClose: () => void;
    onUpload: (file: File) => Promise<void>;
    onEditImage: (image: GenerationImage) => void;
    onDeleteImage: (image: GenerationImage) => Promise<void>;
}

const GenerationImagesModal: React.FC<Props> = ({
    generation,
    images,
    loading,
    uploading,
    onClose,
    onUpload,
    onEditImage,
    onDeleteImage,
}) => {
    const imageByUid = new Map<string, GenerationImage>(
        images.map((img) => [img.id, img]),
    );

    const fileList: UploadFile[] = images.map((img) => {
        const src = resolveImageUrl(img.imageUrl);
        return {
            uid: img.id,
            name: `#${img.order}`,
            status: 'done',
            url: src,
            thumbUrl: src,
        };
    });

    const handleBeforeUpload: NonNullable<UploadProps['beforeUpload']> = (file) => {
        void onUpload(file as File);
        return false;
    };

    const handleRemove: NonNullable<UploadProps['onRemove']> = async (file) => {
        const img = imageByUid.get(String(file.uid));
        if (!img) return false;
        return new Promise<boolean>((resolve) => {
            Modal.confirm({
                title: 'Удалить изображение?',
                okText: 'Удалить',
                cancelText: 'Отмена',
                okButtonProps: { danger: true },
                onOk: async () => {
                    try {
                        await onDeleteImage(img);
                        resolve(true);
                    } catch {
                        resolve(false);
                    }
                },
                onCancel: () => resolve(false),
            });
        });
    };

    const uploadButton = (
        <button
            type="button"
            style={{
                border: 0,
                background: 'none',
                cursor: uploading ? 'default' : 'pointer',
            }}
            disabled={uploading}
        >
            {uploading ? <LoadingOutlined /> : <PlusOutlined />}
            <div style={{ marginTop: 8 }}>{uploading ? 'Загрузка…' : 'Загрузить'}</div>
        </button>
    );

    return (
        <Modal
            title={
                generation
                    ? `Изображения поколения ${generation.number}`
                    : 'Изображения поколения'
            }
            open={!!generation}
            onCancel={onClose}
            footer={null}
            destroyOnHidden
            width={720}
        >
            {loading && images.length === 0 ? (
                <Typography.Text type="secondary">Загрузка…</Typography.Text>
            ) : (
                <Upload
                    listType="picture-card"
                    fileList={fileList}
                    accept="image/*"
                    multiple={false}
                    beforeUpload={handleBeforeUpload}
                    onRemove={handleRemove}
                    showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
                    itemRender={(originNode, file) => {
                        const img = imageByUid.get(String(file.uid));
                        if (!img) return originNode;
                        return (
                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                {originNode}
                                <Tooltip title="Редактировать">
                                    <button
                                        type="button"
                                        onClick={() => onEditImage(img)}
                                        aria-label="Редактировать"
                                        style={{
                                            position: 'absolute',
                                            top: 4,
                                            left: 4,
                                            zIndex: 10,
                                            width: 24,
                                            height: 24,
                                            borderRadius: '50%',
                                            border: 'none',
                                            background: 'rgba(0,0,0,0.55)',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: 0,
                                        }}
                                    >
                                        <EditOutlined />
                                    </button>
                                </Tooltip>
                            </div>
                        );
                    }}
                >
                    {uploadButton}
                </Upload>
            )}
        </Modal>
    );
};

export default GenerationImagesModal;
