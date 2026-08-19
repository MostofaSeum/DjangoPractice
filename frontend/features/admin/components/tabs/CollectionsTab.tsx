"use client";

import { useState, useRef } from "react";
import { Collection } from "../../types";
import CollectionSearchBar from "@/features/collections/components/CollectionSearchBar";

interface CollectionsTabProps {
  collections: Collection[];
  apiBase: string;
  token: string | null;
  fetchAdminData: () => Promise<void>;
  handleSaveCollection: (e: React.FormEvent) => Promise<void>;
  handleDeleteCollection: (col: Collection) => Promise<void>;
  handleToggleCollectionFeatured: (col: Collection) => Promise<void>;
  newCollectionTitle: string;
  setNewCollectionTitle: (title: string) => void;
  editingCollectionId: number | null;
  setEditingCollectionId: (id: number | null) => void;
  collectionImageFile: File | null;
  setCollectionImageFile: (file: File | null) => void;
  collectionImagePreview: string | null;
  setCollectionImagePreview: (preview: string | null) => void;
  collectionFileInputRef: React.RefObject<HTMLInputElement | null>;
  handleSelectCollection: (col: Collection) => void;
  handleCancelCollectionEdit: () => void;
  handleDeleteCollectionPhoto: () => Promise<void>;
}

export default function CollectionsTab({
  collections,
  apiBase,
  token,
  fetchAdminData,
  handleSaveCollection,
  handleDeleteCollection,
  handleToggleCollectionFeatured,
  newCollectionTitle,
  setNewCollectionTitle,
  editingCollectionId,
  setEditingCollectionId,
  collectionImageFile,
  setCollectionImageFile,
  collectionImagePreview,
  setCollectionImagePreview,
  collectionFileInputRef,
  handleSelectCollection,
  handleCancelCollectionEdit,
  handleDeleteCollectionPhoto,
}: CollectionsTabProps) {
  const [activeCollectionQuery, setActiveCollectionQuery] = useState("");

  const filteredCollections = collections.filter(
    (c) =>
      String(c.id).includes(activeCollectionQuery) ||
      (c.title &&
        c.title.toLowerCase().includes(activeCollectionQuery.toLowerCase()))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
      {/* Create Collection Form */}
      <div className="bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm h-fit lg:sticky lg:top-24 transition-colors duration-300">
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-foreground/10">
          <h2 className="text-xs font-black uppercase tracking-widest text-foreground">
            {editingCollectionId
              ? `Edit Collection #${editingCollectionId}`
              : "Create Collection"}
          </h2>
          {editingCollectionId && (
            <button
              onClick={handleCancelCollectionEdit}
              className="text-[10px] font-bold uppercase tracking-wider text-red-500 hover:underline"
            >
              Cancel Edit
            </button>
          )}
        </div>
        <form onSubmit={handleSaveCollection} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
              Collection Title *
            </label>
            <input
              type="text"
              required
              value={newCollectionTitle}
              onChange={(e) => setNewCollectionTitle(e.target.value)}
              placeholder="e.g. Summer Drop"
              className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
              Collection Cover Photo {!editingCollectionId && "*"}
            </label>
            <input
              ref={collectionFileInputRef}
              type="file"
              accept="image/*"
              required={!editingCollectionId && !collectionImagePreview}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setCollectionImageFile(file);
                  setCollectionImagePreview(URL.createObjectURL(file));
                }
              }}
              className="block w-full text-xs text-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-button-bg file:text-button-fg hover:file:opacity-90 cursor-pointer"
            />
            {collectionImagePreview && (
              <div className="mt-3 flex justify-center w-full">
                <div className="relative group w-36 h-36 rounded-2xl overflow-hidden border border-foreground/10 shadow-md bg-primary/5 dark:bg-primary/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      collectionImagePreview.startsWith("http") ||
                      collectionImagePreview.startsWith("blob")
                        ? collectionImagePreview
                        : `${apiBase}${collectionImagePreview}`
                    }
                    alt="Cover preview"
                    className="object-cover w-full h-full"
                  />
                  <button
                    type="button"
                    onClick={handleDeleteCollectionPhoto}
                    title="Delete Photo"
                    className="absolute inset-0 bg-black/60 text-white text-xs font-bold uppercase opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    Delete Photo
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-button-bg text-button-fg rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-colors shadow-md"
          >
            {editingCollectionId ? "Update Collection" : "Save Collection"}
          </button>
        </form>
      </div>

      {/* Collections List */}
      <div className="lg:col-span-2 bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-2 border-b border-foreground/10">
          <h2 className="text-xs font-black uppercase tracking-widest text-foreground">
            Existing Collections ({filteredCollections.length})
          </h2>
          <CollectionSearchBar
            initialSearch={activeCollectionQuery}
            onSelectCollection={(col) => {
              handleSelectCollection(col as any);
            }}
            onSearchSubmit={(q) => {
              setActiveCollectionQuery(q);
            }}
            onClear={() => {
              setActiveCollectionQuery("");
            }}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredCollections.map((col) => (
            <div
              key={col.id}
              onClick={() => handleSelectCollection(col)}
              className={`p-4 rounded-2xl border transition-all flex justify-between items-center cursor-pointer ${
                col.is_featured
                  ? editingCollectionId === col.id
                    ? "bg-amber-500/25 border-l-4 border-amber-500 font-extrabold"
                    : "bg-amber-500/15 dark:bg-amber-500/25 border-l-4 border-amber-500 hover:bg-amber-500/20"
                  : editingCollectionId === col.id
                    ? "bg-accent/20 border-accent"
                    : "bg-primary/5 dark:bg-primary/30 border-foreground/10 hover:border-accent/50"
              }`}
            >
              <div className="flex items-center gap-3">
                {col.image && (
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-foreground/10 flex-shrink-0 bg-secondary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        col.image.startsWith("http")
                          ? col.image
                          : `${apiBase}${col.image}`
                      }
                      alt={col.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    {col.title}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                    ID: #{col.id} • {col.product_count || 0} Products
                  </span>
                </div>
              </div>
              <div
                className="flex gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handleToggleCollectionFeatured(col)}
                  className={`px-2.5 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all shadow-sm ${
                    col.is_featured
                      ? "bg-amber-500 text-black border border-amber-600 shadow-amber-500/20"
                      : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
                  }`}
                >
                  {col.is_featured ? " Featured" : "+ Feature"}
                </button>
                <button
                  onClick={() => handleDeleteCollection(col)}
                  className="px-3 py-1.5 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
