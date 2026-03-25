import React, { useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
    RichEditor,
    RichToolbar,
    actions,
} from "react-native-pell-rich-editor";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your article content here...",
  minHeight = 180,
}: RichTextEditorProps) {
  const editorRef = useRef<RichEditor>(null);

  return (
    <View style={styles.wrapper}>

      {/* ── TOOLBAR ── */}
      <RichToolbar
        editor={editorRef}
        selectedIconTint="#e2e8f0"
        iconTint="#94a3b8"
        style={styles.toolbar}
        flatContainerStyle={styles.flatContainer}
        actions={[
          actions.setBold,
          actions.setItalic,
          actions.setUnderline,
          actions.setStrikethrough,
          actions.insertOrderedList,
          actions.insertBulletsList,
          actions.blockquote,
          // ❌ actions.insertLink — removed, crashes with "focus of null" bug in the library
          actions.removeFormat,
          actions.undo,
          actions.redo,
        ]}
        iconMap={{
          [actions.setBold]: ({ tintColor }: { tintColor: string }) => (
            <View style={styles.iconBtn}>
              <Text style={[styles.iconTextBold, { color: tintColor }]}>B</Text>
            </View>
          ),
          [actions.setItalic]: ({ tintColor }: { tintColor: string }) => (
            <View style={styles.iconBtn}>
              <Text style={[styles.iconTextItalic, { color: tintColor }]}>I</Text>
            </View>
          ),
          [actions.setUnderline]: ({ tintColor }: { tintColor: string }) => (
            <View style={styles.iconBtn}>
              <Text style={[styles.iconTextUnderline, { color: tintColor }]}>U</Text>
            </View>
          ),
          [actions.setStrikethrough]: ({ tintColor }: { tintColor: string }) => (
            <View style={styles.iconBtn}>
              <Text style={[styles.iconTextStrike, { color: tintColor }]}>S</Text>
            </View>
          ),
          [actions.insertOrderedList]: ({ tintColor }: { tintColor: string }) => (
            <View style={styles.iconBtn}>
              <Text style={[styles.iconSymbol, { color: tintColor }]}>≡{"\n"}1.</Text>
            </View>
          ),
          [actions.insertBulletsList]: ({ tintColor }: { tintColor: string }) => (
            <View style={styles.iconBtn}>
              <Text style={[styles.iconSymbol, { color: tintColor }]}>≡{"\n"}•</Text>
            </View>
          ),
          [actions.blockquote]: ({ tintColor }: { tintColor: string }) => (
            <View style={styles.iconBtn}>
              <Text style={[styles.iconQuote, { color: tintColor }]}>"</Text>
            </View>
          ),
          [actions.removeFormat]: ({ tintColor }: { tintColor: string }) => (
            <View style={styles.iconBtn}>
              <Text style={[styles.iconClear, { color: tintColor }]}>Tx</Text>
            </View>
          ),
          [actions.undo]: ({ tintColor }: { tintColor: string }) => (
            <View style={styles.iconBtn}>
              <Text style={[styles.iconArrow, { color: tintColor }]}>↩</Text>
            </View>
          ),
          [actions.redo]: ({ tintColor }: { tintColor: string }) => (
            <View style={styles.iconBtn}>
              <Text style={[styles.iconArrow, { color: tintColor }]}>↪</Text>
            </View>
          ),
        }}
      />

      {/* ── EDITOR AREA ── */}
      <RichEditor
        ref={editorRef}
        initialContentHTML={value}
        onChange={onChange}
        placeholder={placeholder}
        initialHeight={minHeight}
        style={styles.editor}
        editorStyle={{
          backgroundColor: "#0f172a",
          color: "#cbd5e1",
          placeholderColor: "#475569",
          contentCSSText: `
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 14px;
            line-height: 1.7;
            padding: 0;
            caret-color: #94a3b8;
            min-height: ${minHeight}px;
          `,
        }}
        useContainer={true}
        scrollEnabled={false}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#0f172a",
  },
  toolbar: {
    backgroundColor: "#1e293b",
    height: 44,
    paddingHorizontal: 4,
    borderBottomWidth: 0,
  },
  flatContainer: {
    paddingHorizontal: 2,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 1,
  },
  iconTextBold: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  iconTextItalic: {
    fontSize: 14,
    fontWeight: "600",
    fontStyle: "italic",
    lineHeight: 18,
  },
  iconTextUnderline: {
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
    lineHeight: 18,
  },
  iconTextStrike: {
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "line-through",
    lineHeight: 18,
  },
  iconSymbol: {
    fontSize: 8,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 10,
  },
  iconQuote: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: -2,
  },
  iconClear: {
    fontSize: 12,
    fontWeight: "600",
    fontStyle: "italic",
    lineHeight: 18,
  },
  iconArrow: {
    fontSize: 16,
    lineHeight: 20,
  },
  editor: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
});