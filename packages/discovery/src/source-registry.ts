import type { LeadSource } from "@krenora/sources";

export class LeadSourceNotFoundError extends Error {
  constructor(key: string) {
    super(`Lead kaynağı bulunamadı: ${key}`);
    this.name = "LeadSourceNotFoundError";
  }
}

export class SourceRegistry {
  private readonly sources = new Map<string, LeadSource>();

  constructor(sources: readonly LeadSource[] = []) {
    sources.forEach((source) => this.register(source));
  }

  register(source: LeadSource) {
    if (this.sources.has(source.name)) throw new Error(`Lead kaynağı zaten kayıtlı: ${source.name}`);
    this.sources.set(source.name, source);
  }

  get(key: string) {
    const source = this.sources.get(key);
    if (!source) throw new LeadSourceNotFoundError(key);
    return source;
  }
}
