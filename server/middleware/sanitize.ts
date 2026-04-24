import type { RequestHandler } from "express";

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
}

function sanitizeValue(value: any): any {
  if (typeof value === "string") {
    return stripHtml(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === "object") {
    const sanitized: any = {};
    for (const key of Object.keys(value)) {
      sanitized[key] = sanitizeValue(value[key]);
    }
    return sanitized;
  }
  return value;
}

export const sanitizeBody: RequestHandler = (req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  next();
};
