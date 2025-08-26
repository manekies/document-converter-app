import React, { useMemo, useState } from "react";
import { Save, Plus, Trash2, SpellCheck, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import type { Document, DocumentElement } from "~backend/document/types";
import backend from "~backend/client";

interface DocumentEditorProps {
  document: Document;
  onSaved?: () => void;
}

export function DocumentEditor({ document, onSaved }: DocumentEditorProps) {
  const { toast } = useToast();
  const [text, setText] = useState(document.extractedText ?? "");
  const [elements, setElements] = useState<DocumentElement[]>(
    document.documentStructure?.elements ?? []
  );
  const [saving, setSaving] = useState(false);
  const [spellLang, setSpellLang] = useState(document.detectedLanguage ?? "auto");
  const [targetLang, setTargetLang] = useState("en");

  const handleAddElement = () => {
    setElements((els) => [
      ...els,
      {
        type: "paragraph",
        content: "New paragraph",
        position: { x: 50, y: 50, width: 500, height: 20 },
        style: { fontSize: 12 },
      },
    ]);
  };

  const handleRemoveElement = (idx: number) => {
    setElements((els) => els.filter((_, i) => i !== idx));
  };

  const handleChangeType = (idx: number, type: DocumentElement["type"]) => {
    setElements((els) =>
      els.map((e, i) => (i === idx ? { ...e, type, level: type === "heading" ? 2 : undefined } : e))
    );
  };

  const handleChangeContent = (idx: number, content: string) => {
    setElements((els) => els.map((e, i) => (i === idx ? { ...e, content } : e)));
  };

  const save = async () => {
    setSaving(true);
    try {
      await backend.document.updateDocument({
        id: document.id,
        extractedText: text,
        documentStructure: {
          elements,
          metadata:
            document.documentStructure?.metadata ?? {
              pageCount: 1,
              orientation: "portrait",
              dimensions: { width: 595, height: 842 },
            },
        },
      });
      toast({ title: "Saved", description: "Changes have been saved." });
      onSaved?.();
    } catch (err) {
      console.error("Save error:", err);
      toast({
        title: "Save failed",
        description: "Unable to save your changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const runSpellcheck = async () => {
    try {
      const res = await backend.document.spellcheck({ text, language: spellLang === "auto" ? undefined : spellLang });
      setText(res.correctedText);
      toast({ title: "Spellcheck complete", description: "Text has been corrected." });
    } catch (err) {
      console.error("Spellcheck error:", err);
      toast({ title: "Spellcheck failed", description: "Please try again.", variant: "destructive" });
    }
  };

  const runTranslate = async () => {
    try {
      const res = await backend.document.translate({ text, targetLanguage: targetLang, sourceLanguage: document.detectedLanguage });
      setText(res.translatedText);
      toast({ title: "Translation complete", description: `Translated to ${targetLang.toUpperCase()}` });
    } catch (err) {
      console.error("Translate error:", err);
      toast({ title: "Translation failed", description: "Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Text</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={runSpellcheck}>
              <SpellCheck className="h-4 w-4 mr-2" />
              Spellcheck
            </Button>
            <div className="w-28">
              <Select value={spellLang} onValueChange={setSpellLang}>
                <SelectTrigger><SelectValue placeholder="Lang" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="ru">RU</SelectItem>
                  <SelectItem value="de">DE</SelectItem>
                  <SelectItem value="fr">FR</SelectItem>
                  <SelectItem value="es">ES</SelectItem>
                  <SelectItem value="it">IT</SelectItem>
                  <SelectItem value="pt">PT</SelectItem>
                  <SelectItem value="zh">ZH</SelectItem>
                  <SelectItem value="ja">JA</SelectItem>
                  <SelectItem value="ar">AR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={save} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[320px]"
          placeholder="Extracted text"
        />
        <div className="flex items-center gap-2 mt-3">
          <div className="w-28">
            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger><SelectValue placeholder="Target" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">EN</SelectItem>
                <SelectItem value="ru">RU</SelectItem>
                <SelectItem value="de">DE</SelectItem>
                <SelectItem value="fr">FR</SelectItem>
                <SelectItem value="es">ES</SelectItem>
                <SelectItem value="it">IT</SelectItem>
                <SelectItem value="pt">PT</SelectItem>
                <SelectItem value="zh">ZH</SelectItem>
                <SelectItem value="ja">JA</SelectItem>
                <SelectItem value="ar">AR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={runTranslate}>
            <Languages className="h-4 w-4 mr-2" />
            Translate
          </Button>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Structure</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleAddElement}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
            <Button size="sm" onClick={save} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
          {elements.map((el, idx) => (
            <div key={idx} className="border border-gray-200 rounded-md p-3">
              <div className="flex items-center gap-3 mb-2">
                <Label className="text-xs text-gray-500">Type</Label>
                <Select
                  value={el.type}
                  onValueChange={(v) => handleChangeType(idx, v as DocumentElement["type"])}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="heading">Heading</SelectItem>
                    <SelectItem value="paragraph">Paragraph</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="table">Table</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="formula">Formula</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto text-red-600 hover:text-red-700"
                  onClick={() => handleRemoveElement(idx)}
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Label className="text-xs text-gray-500">Content</Label>
              <Textarea
                value={el.content}
                onChange={(e) => handleChangeContent(idx, e.target.value)}
                placeholder="Content or caption"
                className="mt-1"
              />
              {el.type === "image" && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <Label className="text-xs text-gray-500">Image Src (bucket path or URL)</Label>
                    <Input
                      value={el.imageSrc ?? ""}
                      onChange={(e) =>
                        setElements((els) => els.map((x, i) => (i === idx ? { ...x, imageSrc: e.target.value } : x)))
                      }
                      placeholder="original/.. or converted/.."
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Width (px)</Label>
                    <Input
                      type="number"
                      value={el.imageWidth ?? ""}
                      onChange={(e) =>
                        setElements((els) => els.map((x, i) => (i === idx ? { ...x, imageWidth: Number(e.target.value) } : x)))
                      }
                      placeholder="auto"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Height (px)</Label>
                    <Input
                      type="number"
                      value={el.imageHeight ?? ""}
                      onChange={(e) =>
                        setElements((els) => els.map((x, i) => (i === idx ? { ...x, imageHeight: Number(e.target.value) } : x)))
                      }
                      placeholder="auto"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
