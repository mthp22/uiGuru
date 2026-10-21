import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import CanvasBlock, { type Block } from './CanvasBlock';

type MenuState = { id: string; x: number; y: number };

const DEFAULT_SIZE = { width: 240, height: 160 };
const MENU_WIDTH = 168;
const MENU_HEIGHT = 200;

let nextId = 2;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

const initialBlocks: Block[] = [
  { id: '1', label: 'Hero section', x: 48, y: 96, width: DEFAULT_SIZE.width, height: DEFAULT_SIZE.height },
];

type ActionTone = 'light' | 'dark' | 'danger';

function ActionButton({ label, onPress, tone = 'light' }: { label: string; onPress: () => void; tone?: ActionTone }) {
  const background =
    tone === 'danger'
      ? 'bg-rose-600'
      : tone === 'dark'
        ? 'bg-slate-900'
        : 'border border-slate-300 bg-white';
  const foreground = tone === 'light' ? 'text-slate-700' : 'text-white';
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-lg px-3 py-2 active:opacity-60 ${background}`}
    >
      <Text className={`text-sm font-medium ${foreground}`}>{label}</Text>
    </Pressable>
  );
}

function MenuItem({ label, onPress, danger = false }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      className="border-b border-slate-100 px-4 py-3 last:border-b-0 active:bg-slate-50"
    >
      <Text className={`text-sm font-medium ${danger ? 'text-rose-600' : 'text-slate-700'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function CanvasScreen() {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [selectedId, setSelectedId] = useState<string | null>('1');
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const selected = blocks.find((block) => block.id === selectedId) ?? null;

  const select = useCallback((id: string) => {
    setSelectedId(id);
    setMenu(null);
    void Haptics.selectionAsync();
  }, []);

  const patchBlock = useCallback((id: string, patch: Partial<Block>) => {
    setBlocks((prev) => prev.map((block) => (block.id === id ? { ...block, ...patch } : block)));
  }, []);

  const addBlock = useCallback(() => {
    const id = String(nextId++);
    const offset = ((nextId - 2) % 5) * 16;
    setBlocks((prev) => [
      ...prev,
      {
        id,
        label: 'New block',
        x: 40 + offset,
        y: 140 + offset,
        width: DEFAULT_SIZE.width,
        height: DEFAULT_SIZE.height,
      },
    ]);
    setSelectedId(id);
    setMenu(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const duplicateBlock = useCallback(
    (id: string) => {
      const source = blocks.find((block) => block.id === id);
      if (!source) return;
      const copyId = String(nextId++);
      setBlocks((prev) => [
        ...prev,
        {
          ...source,
          id: copyId,
          label: `${source.label} copy`,
          x: clamp(source.x + 24, 0, Math.max(0, canvasSize.width - source.width)),
          y: clamp(source.y + 24, 0, Math.max(0, canvasSize.height - source.height)),
        },
      ]);
      setSelectedId(copyId);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [blocks, canvasSize],
  );

  const removeBlock = useCallback(
    (id: string) => {
      setBlocks((prev) => prev.filter((block) => block.id !== id));
      setSelectedId((current) => (current === id ? null : current));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },
    [],
  );

  const centerBlock = useCallback(
    (id: string) => {
      patchBlock(id, {
        x: Math.max(0, (canvasSize.width - (blocks.find((b) => b.id === id)?.width ?? 0)) / 2),
        y: Math.max(0, (canvasSize.height - (blocks.find((b) => b.id === id)?.height ?? 0)) / 2),
      });
      setMenu(null);
    },
    [blocks, canvasSize, patchBlock],
  );

  const resetSize = useCallback(
    (id: string) => {
      patchBlock(id, DEFAULT_SIZE);
      setMenu(null);
    },
    [patchBlock],
  );

  const openMenu = useCallback(
    (id: string, pos: { x: number; y: number }) => {
      setSelectedId(id);
      setMenu({
        id,
        x: Math.max(4, Math.min(pos.x, canvasSize.width - MENU_WIDTH - 4)),
        y: Math.max(4, Math.min(pos.y, canvasSize.height - MENU_HEIGHT - 4)),
      });
    },
    [canvasSize],
  );

  const handleLayout = useCallback(
    (event: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const { width, height } = event.nativeEvent.layout;
      setCanvasSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height },
      );
    },
    [],
  );

  const backgroundTap = Gesture.Tap().onStart(() => {
    runOnJS(setSelectedId)(null);
    runOnJS(setMenu)(null);
  });

  const menuBlockId = menu?.id ?? null;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between px-4 pb-2 pt-1">
        <View>
          <Text className="text-lg font-bold text-slate-900">uiGuru</Text>
          <Text className="text-xs text-slate-500">Phase 0 · native canvas spike</Text>
        </View>
        <ActionButton label="+ Block" onPress={addBlock} tone="dark" />
      </View>

      {selected && (
        <View className="flex-row flex-wrap gap-2 px-4 pb-2">
          <ActionButton label="Duplicate" onPress={() => duplicateBlock(selected.id)} />
          <ActionButton label="Center" onPress={() => centerBlock(selected.id)} />
          <ActionButton label="Reset size" onPress={() => resetSize(selected.id)} />
          <ActionButton label="Delete" onPress={() => removeBlock(selected.id)} tone="danger" />
        </View>
      )}

      <GestureDetector gesture={backgroundTap}>
        <View
          className="mx-3 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
          onLayout={handleLayout}
        >
          {blocks.map((block) => (
            <CanvasBlock
              key={block.id}
              block={block}
              selected={block.id === selectedId}
              canvas={canvasSize}
              onSelect={() => select(block.id)}
              onCommit={(patch) => patchBlock(block.id, patch)}
              onContextMenu={(pos) => openMenu(block.id, pos)}
            />
          ))}

          {menu && menuBlockId && (
            <View
              style={{ left: menu.x, top: menu.y, width: MENU_WIDTH }}
              className="absolute z-10 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
            >
              <MenuItem
                label="Duplicate"
                onPress={() => {
                  duplicateBlock(menu.id);
                  setMenu(null);
                }}
              />
              <MenuItem
                label="Center"
                onPress={() => centerBlock(menu.id)}
              />
              <MenuItem
                label="Reset size"
                onPress={() => resetSize(menu.id)}
              />
              <MenuItem
                label="Delete"
                danger
                onPress={() => {
                  removeBlock(menu.id);
                  setMenu(null);
                }}
              />
            </View>
          )}
        </View>
      </GestureDetector>

      <View className="flex-row items-center justify-between px-4 py-2">
        <Text className="text-xs text-slate-500">
          {selected
            ? `x ${Math.round(selected.x)}  y ${Math.round(selected.y)}  w ${Math.round(selected.width)}  h ${Math.round(selected.height)}`
            : 'No selection — tap a block'}
        </Text>
        <Text className="text-xs text-slate-400">{blocks.length} blocks</Text>
      </View>
    </SafeAreaView>
  );
}
