import type { VerticalModule } from "./contracts";

export class VerticalModuleNotFoundError extends Error {
  constructor(key: string, version?: string) {
    super(`Dikey modül bulunamadı: ${key}${version ? `@${version}` : ""}`);
    this.name = "VerticalModuleNotFoundError";
  }
}

export class VerticalRegistry {
  private readonly modules = new Map<string, VerticalModule>();
  private readonly latestVersions = new Map<string, string>();

  constructor(modules: readonly VerticalModule[] = []) {
    modules.forEach((module) => this.register(module));
  }

  register(module: VerticalModule) {
    const identifier = this.identifier(module.manifest.key, module.manifest.version);
    if (this.modules.has(identifier)) throw new Error(`Dikey modül zaten kayıtlı: ${identifier}`);
    this.modules.set(identifier, module);
    this.latestVersions.set(module.manifest.key, module.manifest.version);
  }

  get(key: string, version?: string) {
    const resolvedVersion = version ?? this.latestVersions.get(key);
    const module = resolvedVersion ? this.modules.get(this.identifier(key, resolvedVersion)) : undefined;
    if (!module) throw new VerticalModuleNotFoundError(key, version);
    return module;
  }

  list() {
    return [...this.modules.values()].map((module) => module.manifest);
  }

  private identifier(key: string, version: string) {
    return `${key}@${version}`;
  }
}
