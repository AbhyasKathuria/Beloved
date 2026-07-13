import React, { useEffect, useState } from 'react';
import { Image as KonvaImage } from 'react-konva';
import { makeImageTransparent } from '../utils/imageLoader';

interface FlowerImageProps {
  src: string;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  onClick: () => void;
  onTap: () => void;
  onDragEnd: (e: any) => void;
  onTransformEnd: (e: any) => void;
  draggable: boolean;
  isSelected: boolean;
  onRef: (node: any) => void;
}

export const FlowerImage: React.FC<FlowerImageProps> = ({
  src,
  x,
  y,
  scaleX,
  scaleY,
  rotation,
  onClick,
  onTap,
  onDragEnd,
  onTransformEnd,
  draggable,
  onRef,
}) => {
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    // Dynamically clip white backgrounds to create soft anti-aliased boundaries
    makeImageTransparent(src).then((transparentSrc) => {
      const img = new window.Image();
      img.src = transparentSrc;
      img.onload = () => {
        setImageObj(img);
      };
    });
  }, [src]);

  if (!imageObj) return null;

  return (
    <KonvaImage
      ref={onRef}
      image={imageObj}
      x={x}
      y={y}
      scaleX={scaleX}
      scaleY={scaleY}
      rotation={rotation}
      // Set offset to center for natural rotate/scale operations
      offsetX={imageObj.width / 2}
      offsetY={imageObj.height / 2}
      onClick={onClick}
      onTap={onTap}
      draggable={draggable}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    />
  );
};
