import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Transformer, Line, Group } from 'react-konva';
import { FlowerImage } from './FlowerImage';

export interface PlacedFlower {
  id: string;
  name: string;
  src: string;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

interface CanvasProps {
  flowers: PlacedFlower[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (flowers: PlacedFlower[]) => void;
  readOnly?: boolean;
  stageRef?: React.RefObject<any>;
}

export const Canvas: React.FC<CanvasProps> = ({
  flowers,
  selectedId,
  onSelect,
  onChange,
  readOnly = false,
  stageRef,
}) => {
  const trRef = useRef<any>(null);
  const nodeRefs = useRef<{ [key: string]: any }>({});
  const [dimensions, setDimensions] = useState({ width: 400, height: 400, scale: 0.5 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Virtual canvas base resolution is 800x800
  const VIRTUAL_SIZE = 800;

  // Handle resizing of the stage to fit its parent container
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        // Keep it square
        const height = width;
        const scale = width / VIRTUAL_SIZE;
        setDimensions({ width, height, scale });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update transformer node when selection changes
  useEffect(() => {
    if (readOnly) return;
    if (trRef.current) {
      if (selectedId && nodeRefs.current[selectedId]) {
        trRef.current.nodes([nodeRefs.current[selectedId]]);
        trRef.current.getLayer().batchDraw();
      } else {
        trRef.current.nodes([]);
      }
    }
  }, [selectedId, flowers, readOnly]);

  const handleStageClick = (e: any) => {
    if (readOnly) return;
    // Click on empty area to deselect
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      onSelect(null);
    }
  };

  const handleDragEnd = (id: string, e: any) => {
    if (readOnly) return;
    const updated = flowers.map((f) => {
      if (f.id === id) {
        return {
          ...f,
          x: e.target.x(),
          y: e.target.y(),
        };
      }
      return f;
    });
    onChange(updated);
  };

  const handleTransformEnd = (id: string, e: any) => {
    if (readOnly) return;
    const node = e.target;
    const updated = flowers.map((f) => {
      if (f.id === id) {
        return {
          ...f,
          x: node.x(),
          y: node.y(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
          rotation: node.rotation(),
        };
      }
      return f;
    });
    onChange(updated);
  };

  return (
    <div
      ref={containerRef}
      className="canvas-container glass-panel"
      style={{
        width: '100%',
        maxWidth: '500px',
        margin: '0 auto',
        aspectRatio: '1',
        overflow: 'hidden',
        position: 'relative',
        cursor: readOnly ? 'default' : 'pointer',
      }}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        onClick={handleStageClick}
        onTap={handleStageClick}
        scaleX={dimensions.scale}
        scaleY={dimensions.scale}
      >
        <Layer>
          {/* Decorative Bouquet Wrapper Paper Guide (Narrow at bottom, wide at top) */}
          <Group name="wrapper-guide" listening={false}>
            {/* Outer wrapping paper sheet */}
            <Line
              points={[
                180, 340, // Top Left
                400, 780, // Bottom Tip
                620, 340  // Top Right
              ]}
              closed={true}
              fillLinearGradientStartPoint={{ x: 400, y: 340 }}
              fillLinearGradientEndPoint={{ x: 400, y: 780 }}
              fillLinearGradientColorStops={[
                0, 'rgba(255, 240, 240, 0.75)', // Soft warm peachy pink
                1, 'rgba(254, 205, 211, 0.85)'  // Rose darker
              ]}
              stroke="rgba(225, 29, 72, 0.18)"
              strokeWidth={2}
              dash={[8, 5]}
            />
            {/* Inner fold accents */}
            <Line
              points={[
                280, 460,
                400, 780,
                520, 460
              ]}
              closed={true}
              fill="rgba(255, 255, 255, 0.35)"
              stroke="rgba(225, 29, 72, 0.12)"
              strokeWidth={1.5}
            />
            {/* Stems inside wrapping paper */}
            <Line
              points={[385, 460, 385, 680]}
              stroke="rgba(101, 163, 13, 0.45)" // Sage green
              strokeWidth={4.5}
            />
            <Line
              points={[400, 460, 400, 700]}
              stroke="rgba(101, 163, 13, 0.5)" // Central stem
              strokeWidth={5}
            />
            <Line
              points={[415, 460, 415, 680]}
              stroke="rgba(101, 163, 13, 0.45)"
              strokeWidth={4.5}
            />
          </Group>

          {(flowers || []).filter((f) => f && f.id && f.src).map((flower) => (
            <FlowerImage
              key={flower.id}
              src={flower.src}
              x={flower.x}
              y={flower.y}
              scaleX={flower.scaleX}
              scaleY={flower.scaleY}
              rotation={flower.rotation}
              isSelected={selectedId === flower.id}
              draggable={!readOnly}
              onRef={(node) => {
                if (node) {
                  nodeRefs.current[flower.id] = node;
                } else {
                  delete nodeRefs.current[flower.id];
                }
              }}
              onClick={() => {
                if (!readOnly) onSelect(flower.id);
              }}
              onTap={() => {
                if (!readOnly) onSelect(flower.id);
              }}
              onDragEnd={(e) => handleDragEnd(flower.id, e)}
              onTransformEnd={(e) => handleTransformEnd(flower.id, e)}
            />
          ))}
          {!readOnly && selectedId && (
            <Transformer
              ref={trRef}
              boundBoxFunc={(oldBox, newBox) => {
                // limit scale
                if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};
