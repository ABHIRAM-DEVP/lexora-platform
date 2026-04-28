/* eslint-disable @next/next/no-img-element */
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { API_BASE, CLIENT_API_BASE } from "@/lib/config";
import type { PublicBlogResponse } from "@/types/api";

async function loadBlogArticle(slug: string): Promise<PublicBlogResponse | null> {
  const response = await fetch(`${API_BASE}/api/public/blog/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to load article at this time. Please try again.");
  }

  return (await response.json()) as PublicBlogResponse;
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let article: PublicBlogResponse | null = null;

  try {
    article = await loadBlogArticle(slug);
  } catch (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <div className="lx-card rounded-3xl border border-[var(--lx-border)] bg-[var(--lx-panel)] p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--lx-primary)]">Public article</p>
          <h1 className="mt-4 text-3xl font-semibold text-[var(--lx-text)]">Unable to load this article</h1>
          <p className="mt-3 text-sm text-[var(--lx-text-muted)]">{(error as Error)?.message ?? "Please refresh the page or try again later."}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/publications" className="lx-btn-secondary">Browse public library</Link>
            <Link href="/" className="lx-btn-secondary">Return home</Link>
          </div>
        </div>
      </main>
    );
  }

  if (!article) {
    notFound();
  }

  const publicationDate = article.publishedAt ? new Date(article.publishedAt).toLocaleString() : "";
  const viewCount = article.views !== undefined && article.views !== null ? ` · ${article.views} views` : "";
  const authorInfo = article.publishedByName ? ` · By ${article.publishedByName}` : "";

  const alignmentClass = article.style?.alignment === "center" ? "text-center" : article.style?.alignment === "right" ? "text-right" : "text-left";
  const transformClass = article.style?.case === "upper" ? "uppercase tracking-widest" : article.style?.case === "lower" ? "lowercase italic tracking-wide" : "tracking-wide normal-case";
  const shadowClass = article.style?.shadow ? "shadow-2xl ring-1 ring-black/5" : "";
  
  const bgStyle: React.CSSProperties = article.style?.bgColor ? { backgroundColor: article.style.bgColor as string } : {};
  const textStyle: React.CSSProperties = article.style?.textColor ? { color: article.style.textColor as string } : {};

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 md:px-6">
      <div className="space-y-8">
        <div className="max-w-3xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--lx-primary)] mb-3">Public article</p>
          <h1 className="font-serif text-4xl font-semibold leading-tight text-[var(--lx-text)] md:text-6xl">{article.title}</h1>
          <p className="mt-6 text-sm font-medium text-[var(--lx-text-muted)] opacity-80">
            {publicationDate}{viewCount}{authorInfo}
          </p>
        </div>

        <div 
          className={`lx-card relative space-y-10 rounded-[2.5rem] border border-[var(--lx-border)] p-8 md:p-14 transition-all duration-700 ${alignmentClass} ${transformClass} ${shadowClass}`}
          style={{ ...bgStyle, ...textStyle }}
        >
          {article.tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-[var(--lx-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--lx-primary)]">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          {/* Media Attachments */}
          {article.media?.length ? (
            <div className="space-y-6 mb-8">
              {article.media.map((m) => {
                const isImage = m.fileType.startsWith('image/');
                const isPdf = m.fileType === 'application/pdf';
                // ALWAYS use the client-facing API URL for browser-loaded assets
                const mediaUrl = `${CLIENT_API_BASE}/api/media/view/${m.id}`;
                
                return (
                  <div key={m.id} className="group relative overflow-hidden rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel-solid)] shadow-md transition-all hover:shadow-lg">
                    {isImage ? (
                      <img 
                        src={mediaUrl} 
                        alt={m.fileName} 
                        className="w-full object-contain max-h-[600px] bg-black/5"
                      />
                    ) : isPdf ? (
                      <div className="flex flex-col items-center justify-center p-12 bg-indigo-50/50">
                         <div className="h-16 w-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4">
                            <span className="font-bold text-xl">PDF</span>
                         </div>
                         <p className="font-bold text-[var(--lx-text)]">{m.fileName}</p>
                         <a 
                           href={mediaUrl} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="mt-4 lx-btn-primary !px-6 !py-2 text-sm"
                         >
                            Open PDF Document
                         </a>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-6 bg-[var(--lx-panel)]">
                         <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-[var(--lx-border)] rounded-xl flex items-center justify-center">
                               <span className="text-xs font-bold uppercase tracking-tighter">FILE</span>
                            </div>
                            <span className="font-medium text-sm">{m.fileName}</span>
                         </div>
                         <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--lx-primary)] text-sm font-bold hover:underline">Open File</a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="prose prose-lx max-w-none">
            {article.content.split(/\n{2,}/).map((paragraph, index) => {
                const snippet = paragraph.trim().slice(0, 24).replaceAll(/\s+/g, "-");
                return (
                <p key={`${index}-${snippet}`} className="text-xl leading-relaxed whitespace-pre-wrap font-medium" style={textStyle}>
                    {paragraph.trim()}
                </p>
                );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
