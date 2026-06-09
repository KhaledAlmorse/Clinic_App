import { toast } from "sonner";

type ErrorRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ErrorRecord {
  return typeof value === "object" && value !== null;
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return value;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function formatPath(path: Array<string | number>): string {
  if (!path.length) {
    return "Request";
  }

  return path
    .map((part) => {
      if (typeof part === "number") {
        return `Item ${part + 1}`;
      }

      return part
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    })
    .join(" ");
}

function formatZodIssue(issue: ErrorRecord): string | null {
  const message = typeof issue.message === "string" ? issue.message.trim() : "";
  const path = Array.isArray(issue.path) ? issue.path : [];
  const label = formatPath(path as Array<string | number>);

  if (!message) {
    return null;
  }

  switch (issue.code) {
    case "too_small":
      if (issue.type === "string") {
        return `${label} must be at least ${issue.minimum} characters`;
      }

      if (issue.type === "array") {
        return `${label} must contain at least ${issue.minimum} items`;
      }

      return `${label} is too small`;
    case "too_big":
      if (issue.type === "string") {
        return `${label} must be at most ${issue.maximum} characters`;
      }

      if (issue.type === "array") {
        return `${label} must contain at most ${issue.maximum} items`;
      }

      return `${label} is too large`;
    case "invalid_type":
      return issue.received === "undefined"
        ? `${label} is required`
        : `${label} must be a valid ${String(issue.expected)}`;
    case "invalid_string":
      if (issue.validation === "email") {
        return `${label} must be a valid email`;
      }

      if (issue.validation === "url") {
        return `${label} must be a valid URL`;
      }

      if (issue.validation === "uuid") {
        return `${label} must be a valid UUID`;
      }

      return `${label} is invalid`;
    case "invalid_enum_value":
      return `${label} must be one of: ${(issue.options as Array<string | number>).join(", ")}`;
    case "unrecognized_keys":
      return `Unexpected fields: ${(issue.keys as Array<string | number>).join(", ")}`;
    default:
      return path.length ? `${label}: ${message}` : message;
  }
}

function collectErrorMessages(value: unknown, seen = new WeakSet<object>()): string[] {
  const parsed = parseMaybeJson(value);

  if (typeof parsed === "string") {
    return parsed
      .split(/\r?\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  if (Array.isArray(parsed)) {
    return parsed.flatMap((item) => collectErrorMessages(item, seen));
  }

  if (!isRecord(parsed)) {
    if (parsed == null) {
      return [];
    }

    return [String(parsed)];
  }

  if (seen.has(parsed)) {
    return [];
  }
  seen.add(parsed);

  if (Array.isArray(parsed.issues)) {
    return parsed.issues.flatMap((issue) => {
      if (!isRecord(issue)) {
        return [];
      }

      const formatted = formatZodIssue(issue);
      return formatted ? [formatted] : [];
    });
  }

  if (parsed.response !== undefined) {
    const responseMessages = collectErrorMessages(parsed.response, seen);
    if (responseMessages.length > 0) {
      return responseMessages;
    }
  }

  if (parsed.data !== undefined) {
    const dataMessages = collectErrorMessages(parsed.data, seen);
    if (dataMessages.length > 0) {
      return dataMessages;
    }
  }

  if (parsed.error !== undefined) {
    const errorMessages = collectErrorMessages(parsed.error, seen);
    if (errorMessages.length > 0) {
      return errorMessages;
    }
  }

  if (parsed.detail !== undefined) {
    const detailMessages = collectErrorMessages(parsed.detail, seen);
    if (detailMessages.length > 0) {
      return detailMessages;
    }
  }

  if (parsed.title !== undefined) {
    const titleMessages = collectErrorMessages(parsed.title, seen);
    if (titleMessages.length > 0) {
      return titleMessages;
    }
  }

  if (Array.isArray(parsed.errors)) {
    const errorsMessages = collectErrorMessages(parsed.errors, seen);
    if (errorsMessages.length > 0) {
      return errorsMessages;
    }
  }

  if (typeof parsed.message === "string" && parsed.message.trim()) {
    return parsed.message
      .split(/\r?\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [];
}

export function getErrorMessages(error: unknown): string[] {
  if (error instanceof Error) {
    const typedError = error as unknown as ErrorRecord;
    const candidates = [
      collectErrorMessages(typedError.response),
      collectErrorMessages(typedError.data),
      collectErrorMessages(typedError.error),
      collectErrorMessages(error.message),
    ];

    for (const messages of candidates) {
      if (messages.length > 0) {
        return messages;
      }
    }
  }

  const messages = collectErrorMessages(error);
  return messages.length > 0 ? messages : [];
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  return getErrorMessages(error)[0] ?? fallback;
}

export function showErrorToast(error: unknown, fallback = "Something went wrong"): void {
  const messages = getErrorMessages(error);

  if (messages.length === 0) {
    toast.error(fallback);
    return;
  }

  if (messages.length === 1) {
    toast.error(messages[0]);
    return;
  }

  toast.error(fallback, {
    description: messages.map((message) => `• ${message}`).join("\n"),
  });
}
