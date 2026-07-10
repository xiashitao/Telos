import "server-only";
import Database from "better-sqlite3";
import path from "node:path";
import crypto from "node:crypto";

/**
 * 模板分享库 —— Telos 的第一块服务端存储（SQLite，文件在项目根 telos.db）。
 * 只存 TemplateSpec(纯数据) + 名称 + 归属；fork 语义：使用方复制 spec，不建引用。
 */

const DB_PATH = process.env.TELOS_DB_PATH ?? path.join(process.cwd(), "telos.db");

let _db: Database.Database | null = null;

function db(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.exec(`
    CREATE TABLE IF NOT EXISTS shared_templates (
      slug       TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      spec_json  TEXT NOT NULL,
      owner      TEXT NOT NULL DEFAULT 'anonymous',
      source     TEXT NOT NULL DEFAULT 'manual',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  return _db;
}

export interface SharedTemplate {
  slug: string;
  name: string;
  specJson: string;
  owner: string;
}

/** 存入一份分享模板，返回 slug */
export function createShare(name: string, specJson: string, owner: string): string {
  const slug = crypto.randomBytes(6).toString("base64url"); // 8 字符,URL 安全
  db()
    .prepare("INSERT INTO shared_templates (slug, name, spec_json, owner) VALUES (?, ?, ?, ?)")
    .run(slug, name, specJson, owner);
  return slug;
}

export function getShare(slug: string): SharedTemplate | null {
  const row = db()
    .prepare("SELECT slug, name, spec_json, owner FROM shared_templates WHERE slug = ?")
    .get(slug) as { slug: string; name: string; spec_json: string; owner: string } | undefined;
  if (!row) return null;
  return { slug: row.slug, name: row.name, specJson: row.spec_json, owner: row.owner };
}
