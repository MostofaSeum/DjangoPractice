"use client";

import { useState } from "react";
import Image from "next/image";
import { Collection, CollectionSubTab } from "../../types";
import CollectionSearchBar from "@/features/collections/components/CollectionSearchBar";
import { useLanguage } from "@/store/LanguageContext";

interface CollectionsTabProps {
  collectionSubTab: CollectionSubTab;
  collections: Collection[];
  apiBase: string;
  token: string | null;
  fetchAdminData: () => Promise<void>;
  handleSaveCollection: (e: React.FormEvent) => Promise<void>;
  handleDeleteCollection: (col: Collection) => Promise<void>;
  handleToggleCollectionFeatured: (col: Collection) => Promise<void>;
  handleToggleCollectionVisibility?: (col: Collection) => Promise<void>;
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
  collectionSubTab,
  collections,
  apiBase,
  token,
  fetchAdminData,
  handleSaveCollection,
  handleDeleteCollection,
  handleToggleCollectionFeatured,
  handleToggleCollectionVisibility,
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
  const { locale } = useLanguage();
  const isBn = locale === "bn";

  const [activeCollectionQuery, setActiveCollectionQuery] = useState("");
  const [editCollectionSearch, setEditCollectionSearch] = useState("");

  const filteredCollections = collections.filter(
    (c) =>
      String(c.id).includes(activeCollectionQuery) ||
      (c.title &&
        c.title.toLowerCase().includes(activeCollectionQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6">
      {/* SUBTAB 2: Add New Collection */}
      {collectionSubTab === "add" && (
        <div className="max-w-3xl mx-auto w-full bg-secondary text-foreground p-8 md:p-10 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300">
          <div className="flex justify-between items-center mb-6 pb-3 border-b border-foreground/10">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
                {isBn ? "নতুন কালেকশন / ক্যাটাগরি যোগ করুন" : "Add New Collection"}
              </h2>
              <p className="text-xs text-foreground/60 mt-0.5">
                {isBn ? "পণ্যগুলোকে সাজাতে নতুন ক্যাটাগরি তৈরি করুন।" : "Create a new category/collection to organize products."}
              </p>
            </div>
          </div>
          <form onSubmit={handleSaveCollection} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                {isBn ? "কালেকশনের নাম *" : "Collection Title *"}
              </label>
              <input
                type="text"
                required
                value={newCollectionTitle}
                onChange={(e) => setNewCollectionTitle(e.target.value)}
                placeholder={isBn ? "যেমনঃ গ্রীষ্মকালীন কালেকশন" : "e.g. Summer Drop"}
                className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                {isBn ? "কালেকশন কভার ফটো *" : "Collection Cover Photo *"}
              </label>
              <input
                ref={collectionFileInputRef}
                type="file"
                accept="image/*"
                required={!collectionImagePreview}
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
                      title={isBn ? "ছবি মুছুন" : "Delete Photo"}
                      className="absolute inset-0 bg-black/60 text-white text-xs font-bold uppercase opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                    >
                      {isBn ? "ছবি মুছুন" : "Delete Photo"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-3 bg-button-bg text-button-fg rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-colors shadow-sm cursor-pointer"
            >
              {isBn ? "কালেকশন তৈরি করুন" : "Create Collection"}
            </button>
          </form>
        </div>
      )}

      {/* SUBTAB 3: Edit Collection */}
      {collectionSubTab === "edit" && (
        <div className="max-w-3xl mx-auto w-full bg-secondary text-foreground p-8 md:p-10 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300">
          <div className="flex justify-between items-center mb-6 pb-3 border-b border-foreground/10">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
                {isBn ? "কালেকশন সম্পাদনা করুন" : "Edit Collection"}
              </h2>
              <p className="text-xs text-foreground/60 mt-0.5">
                {isBn ? "নাম, কভার ফটো পরিবর্তন বা ফিচার করতে কালেকশন নির্বাচন করুন।" : "Select a collection to edit its title, cover image, or featured status."}
              </p>
            </div>
            {editingCollectionId && (
              <button
                type="button"
                onClick={handleCancelCollectionEdit}
                className="text-xs font-bold uppercase tracking-wider text-red-500 hover:underline cursor-pointer"
              >
                {isBn ? "নির্বাচন বাতিল" : "Clear Selection"}
              </button>
            )}
          </div>

          {/* Collection Search Bar */}
          <div className="mb-6 p-5 rounded-2xl bg-primary/5 dark:bg-primary/20 border border-foreground/10 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-wider opacity-70">
                {isBn ? "সম্পাদনার জন্য কালেকশন খুঁজুন" : "Search Collection to Edit"}
              </label>
            </div>

            <div className="relative w-full">
              <input
                type="text"
                value={editCollectionSearch}
                onChange={(e) => setEditCollectionSearch(e.target.value)}
                placeholder={isBn ? "কালেকশন এর নাম বা আইডি দিয়ে খুঁজুন..." : "Search by collection title or ID..."}
                className="w-full pl-10 pr-8 py-3 border border-foreground/15 rounded-xl bg-background text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all shadow-inner"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none flex items-center justify-center opacity-60 dark:opacity-80">
                <Image
                  src="/search.png"
                  alt="Search"
                  width={16}
                  height={16}
                  className="object-contain dark:invert transition-all"
                />
              </div>
              {editCollectionSearch && (
                <button
                  type="button"
                  onClick={() => setEditCollectionSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Search Results List */}
            {(() => {
              const query = editCollectionSearch.trim().toLowerCase();
              const filteredEditCollections = collections.filter((c) => {
                if (!query) return false;
                return (
                  c.title.toLowerCase().includes(query) ||
                  String(c.id).includes(query)
                );
              });

              if (query) {
                return (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {filteredEditCollections.length > 0 ? (
                      filteredEditCollections.map((col) => (
                        <div
                          key={col.id}
                          onClick={() => {
                            handleSelectCollection(col);
                            setEditCollectionSearch("");
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                            editingCollectionId === col.id
                              ? "bg-accent/20 border-accent font-bold"
                              : "bg-background border-foreground/10 hover:bg-primary/5 dark:hover:bg-primary/30"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-primary/10 shrink-0 border border-foreground/10">
                              {col.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={
                                    col.image.startsWith("http")
                                      ? col.image
                                      : `${apiBase}${col.image}`
                                  }
                                  alt={col.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] opacity-40">
                                  {isBn ? "ছবি নেই" : "No Img"}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-black text-foreground">
                                {col.title}
                              </p>
                              <span className="text-[10px] opacity-60">
                                {isBn
                                  ? `আইডি: #${col.id.toLocaleString("bn-BD")} • ${(col.product_count || 0).toLocaleString("bn-BD")} টি পণ্য`
                                  : `ID: #${col.id} • ${col.product_count || 0} Products`}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="px-3 py-1 bg-accent text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
                          >
                            {isBn ? "এডিট" : "Edit"}
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs opacity-50 text-center py-2">
                        {isBn ? `"${query}" এর সাথে কোনো কালেকশন মিলেনি` : `No collections match "${query}"`}
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {editingCollectionId ? (
            <form onSubmit={handleSaveCollection} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {isBn ? "কালেকশনের নাম *" : "Collection Title *"}
                </label>
                <input
                  type="text"
                  required
                  value={newCollectionTitle}
                  onChange={(e) => setNewCollectionTitle(e.target.value)}
                  placeholder={isBn ? "যেমনঃ গ্রীষ্মকালীন কালেকশন" : "e.g. Summer Drop"}
                  className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {isBn ? "কালেকশন কভার ফটো" : "Collection Cover Photo"}
                </label>
                <input
                  ref={collectionFileInputRef}
                  type="file"
                  accept="image/*"
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
                        title={isBn ? "ছবি মুছুন" : "Delete Photo"}
                        className="absolute inset-0 bg-black/60 text-white text-xs font-bold uppercase opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                      >
                        {isBn ? "ছবি মুছুন" : "Delete Photo"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={handleCancelCollectionEdit}
                  className="w-1/3 py-2.5 border border-foreground/15 text-foreground rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  {isBn ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-button-bg text-button-fg rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-colors shadow-sm cursor-pointer"
                >
                  {isBn ? "কালেকশন আপডেট করুন" : "Update Collection"}
                </button>
              </div>
            </form>
          ) : (
            <div className="py-12 text-center border-2 border-dashed border-foreground/10 rounded-2xl bg-primary/5 dark:bg-primary/20">
              <p className="text-xs text-foreground/60">
                {isBn ? "সম্পাদনা করতে 'সকল কালেকশন' থেকে একটি নির্বাচন বা অনুসন্ধান করুন।" : "Please search or select a collection from 'All Collections' to edit."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 1: All Collections */}
      {collectionSubTab === "all" && (
        <div className="w-full bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm overflow-x-auto transition-colors duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-2 border-b border-foreground/10">
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground">
              {isBn
                ? `সকল কালেকশন (${filteredCollections.length.toLocaleString("bn-BD")})`
                : `All Collections (${filteredCollections.length})`}
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

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-foreground/10 text-[10px] font-black uppercase tracking-wider opacity-60">
                <th className="py-3 px-2">{isBn ? "আইডি" : "ID"}</th>
                <th className="py-3 px-2">{isBn ? "কভার" : "Cover"}</th>
                <th className="py-3 px-2">{isBn ? "নাম" : "Title"}</th>
                <th className="py-3 px-2">{isBn ? "পণ্যের সংখ্যা" : "Products Count"}</th>
                <th className="py-3 px-2 text-right">{isBn ? "কার্যক্রম" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/10 text-xs font-bold">
              {filteredCollections.map((col) => (
                <tr
                  key={col.id}
                  onClick={() => handleSelectCollection(col)}
                  className={`cursor-pointer transition-all ${
                    col.is_featured
                      ? editingCollectionId === col.id
                        ? "bg-amber-500/25 border-l-4 border-amber-500 font-extrabold"
                        : "bg-amber-500/15 dark:bg-amber-500/25 border-l-4 border-amber-500 hover:bg-amber-500/20"
                      : editingCollectionId === col.id
                        ? "bg-accent/20"
                        : "hover:bg-primary/5 dark:hover:bg-primary/30"
                  }`}
                >
                  <td className="py-3 px-2 opacity-50 align-middle">
                    #{isBn ? col.id.toLocaleString("bn-BD") : col.id}
                  </td>
                  <td className="py-3 px-2 align-middle">
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-foreground/10 bg-primary/5 dark:bg-primary/30 shadow-xs relative">
                      {col.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            col.image.startsWith("http")
                              ? col.image
                              : `${apiBase}${col.image}`
                          }
                          alt={col.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] opacity-40">
                          {isBn ? "ছবি নেই" : "No Img"}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2 font-black align-middle text-foreground">
                    {col.title}
                  </td>
                  <td className="py-3 px-2 opacity-70 align-middle">
                    {isBn ? `${(col.product_count || 0).toLocaleString("bn-BD")} টি পণ্য` : `${col.product_count || 0} products`}
                  </td>
                  <td
                    className="py-3.5 px-2 text-right flex justify-end items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {handleToggleCollectionVisibility && (
                      <button
                        onClick={() => handleToggleCollectionVisibility(col)}
                        title={
                          col.is_visible !== false
                            ? (isBn ? "পাবলিক থেকে লুকাতে ক্লিক করুন" : "Click to hide from public")
                            : (isBn ? "পাবলিকে দেখাতে ক্লিক করুন" : "Click to show to public")
                        }
                        className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                          col.is_visible !== false
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                            : "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/25 opacity-75 hover:opacity-100"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        <span>
                          {col.is_visible !== false
                            ? (isBn ? "দৃশ্যমান" : "Visible")
                            : (isBn ? "লুকানো" : "Hidden")}
                        </span>
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleCollectionFeatured(col)}
                      className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all shadow-sm cursor-pointer ${
                        col.is_featured
                          ? "bg-amber-500 text-black border border-amber-600 shadow-amber-500/20"
                          : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
                      }`}
                    >
                      {col.is_featured ? (isBn ? "★ ফিচার্ড" : "★ Featured") : (isBn ? "+ ফিচার করুন" : "+ Feature")}
                    </button>
                    <button
                      onClick={() => handleDeleteCollection(col)}
                      className="px-3 py-1.5 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      {isBn ? "মুছুন" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

