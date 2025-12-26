/**
 * BBox Selector Component
 * 
 * Allows users to draw and adjust a rectangular selection box on an image.
 * Supports: drag to create, move, resize from corners
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  LayoutChangeEvent,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { colors, borderRadius } from '../constants/theme';

export interface NormalizedBBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BBoxSelectorProps {
  imageWidth: number;
  imageHeight: number;
  onBBoxChange?: (bbox: NormalizedBBox | null) => void;
}

const MIN_SIZE = 40;
const HANDLE_SIZE = 28;
const HANDLE_HIT_AREA = 44;

type DragMode = 'none' | 'create' | 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br';

export function BBoxSelector({
  imageWidth,
  imageHeight,
  onBBoxChange,
}: BBoxSelectorProps) {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [box, setBox] = useState<Box | null>(null);
  
  // Use refs to access latest values in PanResponder callbacks
  const boxRef = useRef<Box | null>(null);
  const containerSizeRef = useRef({ width: 0, height: 0 });
  const onBBoxChangeRef = useRef(onBBoxChange);
  
  // Keep refs in sync
  useEffect(() => {
    boxRef.current = box;
  }, [box]);
  
  useEffect(() => {
    containerSizeRef.current = containerSize;
  }, [containerSize]);
  
  useEffect(() => {
    onBBoxChangeRef.current = onBBoxChange;
  }, [onBBoxChange]);

  const dragMode = useRef<DragMode>('none');
  const dragStart = useRef({ x: 0, y: 0 });
  const boxStart = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Calculate display metrics
  const getDisplayMetrics = useCallback(() => {
    const cs = containerSizeRef.current;
    if (cs.width === 0 || cs.height === 0) {
      return { scale: 1, displayWidth: 0, displayHeight: 0, offsetX: 0, offsetY: 0 };
    }
    const scale = Math.min(cs.width / imageWidth, cs.height / imageHeight);
    const displayWidth = imageWidth * scale;
    const displayHeight = imageHeight * scale;
    const offsetX = (cs.width - displayWidth) / 2;
    const offsetY = (cs.height - displayHeight) / 2;
    return { scale, displayWidth, displayHeight, offsetX, offsetY };
  }, [imageWidth, imageHeight]);

  // Convert view coordinates to normalized coordinates
  const toNormalized = useCallback((b: Box | null): NormalizedBBox | null => {
    if (!b) return null;
    const { displayWidth, displayHeight, offsetX, offsetY } = getDisplayMetrics();
    if (displayWidth === 0 || displayHeight === 0) return null;

    return {
      x0: Math.max(0, Math.min(1, (b.x - offsetX) / displayWidth)),
      y0: Math.max(0, Math.min(1, (b.y - offsetY) / displayHeight)),
      x1: Math.max(0, Math.min(1, (b.x + b.width - offsetX) / displayWidth)),
      y1: Math.max(0, Math.min(1, (b.y + b.height - offsetY) / displayHeight)),
    };
  }, [getDisplayMetrics]);

  // Clamp box to image bounds
  const clampBox = useCallback((b: Box | null): Box | null => {
    if (!b) return null;
    const { displayWidth, displayHeight, offsetX, offsetY } = getDisplayMetrics();
    if (displayWidth === 0) return b;
    
    const minX = offsetX;
    const minY = offsetY;
    const maxX = offsetX + displayWidth;
    const maxY = offsetY + displayHeight;

    let { x, y, width, height } = b;
    
    // Clamp size
    width = Math.max(MIN_SIZE, Math.min(width, displayWidth));
    height = Math.max(MIN_SIZE, Math.min(height, displayHeight));

    // Clamp position
    x = Math.max(minX, Math.min(x, maxX - width));
    y = Math.max(minY, Math.min(y, maxY - height));

    return { x, y, width, height };
  }, [getDisplayMetrics]);

  // Check if point is in handle
  const getHandleAtPoint = useCallback((px: number, py: number): DragMode => {
    const currentBox = boxRef.current;
    if (!currentBox) return 'none';
    
    const { x, y, width, height } = currentBox;
    const halfHit = HANDLE_HIT_AREA / 2;

    // Check corners
    if (Math.abs(px - x) < halfHit && Math.abs(py - y) < halfHit) return 'resize-tl';
    if (Math.abs(px - (x + width)) < halfHit && Math.abs(py - y) < halfHit) return 'resize-tr';
    if (Math.abs(px - x) < halfHit && Math.abs(py - (y + height)) < halfHit) return 'resize-bl';
    if (Math.abs(px - (x + width)) < halfHit && Math.abs(py - (y + height)) < halfHit) return 'resize-br';

    // Check if inside box
    if (px >= x && px <= x + width && py >= y && py <= y + height) return 'move';

    return 'none';
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e: GestureResponderEvent) => {
        const { locationX, locationY } = e.nativeEvent;
        const currentBox = boxRef.current;
        
        if (currentBox) {
          const mode = getHandleAtPoint(locationX, locationY);
          if (mode !== 'none') {
            dragMode.current = mode;
            dragStart.current = { x: locationX, y: locationY };
            boxStart.current = { ...currentBox };
            return;
          }
        }
        
        // Start creating new box
        dragMode.current = 'create';
        dragStart.current = { x: locationX, y: locationY };
        const newBox = { x: locationX, y: locationY, width: 0, height: 0 };
        boxRef.current = newBox;
        setBox(newBox);
      },
      onPanResponderMove: (e: GestureResponderEvent, gesture: PanResponderGestureState) => {
        const { locationX, locationY } = e.nativeEvent;
        const mode = dragMode.current;

        if (mode === 'create') {
          const x = Math.min(dragStart.current.x, locationX);
          const y = Math.min(dragStart.current.y, locationY);
          const width = Math.abs(locationX - dragStart.current.x);
          const height = Math.abs(locationY - dragStart.current.y);
          
          const { displayWidth, displayHeight, offsetX, offsetY } = getDisplayMetrics();
          const clampedBox = {
            x: Math.max(offsetX, Math.min(x, offsetX + displayWidth - width)),
            y: Math.max(offsetY, Math.min(y, offsetY + displayHeight - height)),
            width: Math.min(width, displayWidth),
            height: Math.min(height, displayHeight),
          };
          
          boxRef.current = clampedBox;
          setBox(clampedBox);
        } else if (mode === 'move') {
          const dx = locationX - dragStart.current.x;
          const dy = locationY - dragStart.current.y;
          
          const { displayWidth, displayHeight, offsetX, offsetY } = getDisplayMetrics();
          let newX = boxStart.current.x + dx;
          let newY = boxStart.current.y + dy;
          
          // Clamp position
          newX = Math.max(offsetX, Math.min(newX, offsetX + displayWidth - boxStart.current.width));
          newY = Math.max(offsetY, Math.min(newY, offsetY + displayHeight - boxStart.current.height));
          
          const newBox = {
            x: newX,
            y: newY,
            width: boxStart.current.width,
            height: boxStart.current.height,
          };
          
          boxRef.current = newBox;
          setBox(newBox);
        } else if (mode.startsWith('resize-')) {
          const dx = locationX - dragStart.current.x;
          const dy = locationY - dragStart.current.y;
          
          let newBox = { ...boxStart.current };
          
          if (mode === 'resize-tl') {
            newBox.x = boxStart.current.x + dx;
            newBox.y = boxStart.current.y + dy;
            newBox.width = boxStart.current.width - dx;
            newBox.height = boxStart.current.height - dy;
          } else if (mode === 'resize-tr') {
            newBox.y = boxStart.current.y + dy;
            newBox.width = boxStart.current.width + dx;
            newBox.height = boxStart.current.height - dy;
          } else if (mode === 'resize-bl') {
            newBox.x = boxStart.current.x + dx;
            newBox.width = boxStart.current.width - dx;
            newBox.height = boxStart.current.height + dy;
          } else if (mode === 'resize-br') {
            newBox.width = boxStart.current.width + dx;
            newBox.height = boxStart.current.height + dy;
          }
          
          // Ensure minimum size
          if (newBox.width < MIN_SIZE) {
            if (mode === 'resize-tl' || mode === 'resize-bl') {
              newBox.x = boxStart.current.x + boxStart.current.width - MIN_SIZE;
            }
            newBox.width = MIN_SIZE;
          }
          if (newBox.height < MIN_SIZE) {
            if (mode === 'resize-tl' || mode === 'resize-tr') {
              newBox.y = boxStart.current.y + boxStart.current.height - MIN_SIZE;
            }
            newBox.height = MIN_SIZE;
          }
          
          boxRef.current = newBox;
          setBox(newBox);
        }
      },
      onPanResponderRelease: () => {
        const currentBox = boxRef.current;
        const mode = dragMode.current;
        
        if (mode === 'create') {
          if (!currentBox || currentBox.width < MIN_SIZE || currentBox.height < MIN_SIZE) {
            boxRef.current = null;
            setBox(null);
            onBBoxChangeRef.current?.(null);
          } else {
            // Notify parent with normalized bbox
            const { displayWidth, displayHeight, offsetX, offsetY } = getDisplayMetrics();
            if (displayWidth > 0 && displayHeight > 0) {
              const normalized: NormalizedBBox = {
                x0: Math.max(0, Math.min(1, (currentBox.x - offsetX) / displayWidth)),
                y0: Math.max(0, Math.min(1, (currentBox.y - offsetY) / displayHeight)),
                x1: Math.max(0, Math.min(1, (currentBox.x + currentBox.width - offsetX) / displayWidth)),
                y1: Math.max(0, Math.min(1, (currentBox.y + currentBox.height - offsetY) / displayHeight)),
              };
              onBBoxChangeRef.current?.(normalized);
            }
          }
        } else if (currentBox) {
          // Notify parent with normalized bbox
          const { displayWidth, displayHeight, offsetX, offsetY } = getDisplayMetrics();
          if (displayWidth > 0 && displayHeight > 0) {
            const normalized: NormalizedBBox = {
              x0: Math.max(0, Math.min(1, (currentBox.x - offsetX) / displayWidth)),
              y0: Math.max(0, Math.min(1, (currentBox.y - offsetY) / displayHeight)),
              x1: Math.max(0, Math.min(1, (currentBox.x + currentBox.width - offsetX) / displayWidth)),
              y1: Math.max(0, Math.min(1, (currentBox.y + currentBox.height - offsetY) / displayHeight)),
            };
            onBBoxChangeRef.current?.(normalized);
          }
        }
        
        dragMode.current = 'none';
      },
    })
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    containerSizeRef.current = { width, height };
    setContainerSize({ width, height });
  };

  // Expose reset method
  useEffect(() => {
    (BBoxSelector as any).reset = () => {
      boxRef.current = null;
      setBox(null);
      onBBoxChangeRef.current?.(null);
    };
    (BBoxSelector as any).expand = (percentage: number) => {
      const currentBox = boxRef.current;
      if (!currentBox) return;
      
      const expandX = currentBox.width * percentage / 2;
      const expandY = currentBox.height * percentage / 2;
      
      const { displayWidth, displayHeight, offsetX, offsetY } = getDisplayMetrics();
      
      let newBox = {
        x: currentBox.x - expandX,
        y: currentBox.y - expandY,
        width: currentBox.width + expandX * 2,
        height: currentBox.height + expandY * 2,
      };
      
      // Clamp
      newBox.width = Math.min(newBox.width, displayWidth);
      newBox.height = Math.min(newBox.height, displayHeight);
      newBox.x = Math.max(offsetX, Math.min(newBox.x, offsetX + displayWidth - newBox.width));
      newBox.y = Math.max(offsetY, Math.min(newBox.y, offsetY + displayHeight - newBox.height));
      
      boxRef.current = newBox;
      setBox(newBox);
      
      if (displayWidth > 0 && displayHeight > 0) {
        const normalized: NormalizedBBox = {
          x0: Math.max(0, Math.min(1, (newBox.x - offsetX) / displayWidth)),
          y0: Math.max(0, Math.min(1, (newBox.y - offsetY) / displayHeight)),
          x1: Math.max(0, Math.min(1, (newBox.x + newBox.width - offsetX) / displayWidth)),
          y1: Math.max(0, Math.min(1, (newBox.y + newBox.height - offsetY) / displayHeight)),
        };
        onBBoxChangeRef.current?.(normalized);
      }
    };
  }, [getDisplayMetrics]);

  return (
    <View 
      style={styles.container} 
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      {/* Selection box */}
      {box && box.width > 0 && box.height > 0 && (
        <View
          style={[
            styles.box,
            {
              left: box.x,
              top: box.y,
              width: box.width,
              height: box.height,
            },
          ]}
          pointerEvents="none"
        >
          {/* Corner handles */}
          <View style={[styles.handle, styles.handleTopLeft]} />
          <View style={[styles.handle, styles.handleTopRight]} />
          <View style={[styles.handle, styles.handleBottomLeft]} />
          <View style={[styles.handle, styles.handleBottomRight]} />
        </View>
      )}
    </View>
  );
}

// Static methods for external control
BBoxSelector.expand = (percentage: number) => {};
BBoxSelector.reset = () => {};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  box: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  handle: {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.text,
  },
  handleTopLeft: {
    top: -HANDLE_SIZE / 2,
    left: -HANDLE_SIZE / 2,
  },
  handleTopRight: {
    top: -HANDLE_SIZE / 2,
    right: -HANDLE_SIZE / 2,
  },
  handleBottomLeft: {
    bottom: -HANDLE_SIZE / 2,
    left: -HANDLE_SIZE / 2,
  },
  handleBottomRight: {
    bottom: -HANDLE_SIZE / 2,
    right: -HANDLE_SIZE / 2,
  },
});
