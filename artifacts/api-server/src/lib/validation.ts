type ValidationIssue = Record<string, any>;

function formatPath(path: Array<string | number | symbol> = []): string {
  if (!path.length) {
    return "Request";
  }

  return path
    .map((part) => {
      if (typeof part === "number") {
        return `Item ${part + 1}`;
      }

      if (typeof part !== "string") {
        return String(part);
      }

      return part
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    })
    .join(" ");
}

function formatIssue(issue: ValidationIssue): string {
  const label = formatPath((issue.path ?? []) as Array<string | number | symbol>);
  const message = typeof issue.message === "string" ? issue.message.trim() : "";

  switch (issue.code) {
    case "too_small": {
      if (issue.type === "string") {
        return `${label} must be at least ${issue.minimum} characters`;
      }

      if (issue.type === "array") {
        return `${label} must contain at least ${issue.minimum} items`;
      }

      return `${label} is too small`;
    }
    case "too_big": {
      if (issue.type === "string") {
        return `${label} must be at most ${issue.maximum} characters`;
      }

      if (issue.type === "array") {
        return `${label} must contain at most ${issue.maximum} items`;
      }

      return `${label} is too large`;
    }
    case "invalid_type":
      return issue.received === "undefined"
        ? `${label} is required`
        : `${label} must be a valid ${issue.expected}`;
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
      return `${label} must be one of: ${(issue.options ?? []).join(", ")}`;
    case "unrecognized_keys":
      return `Unexpected fields: ${(issue.keys ?? []).join(", ")}`;
    default:
      return issue.path?.length ? `${label}: ${message}` : message;
  }
}

export function formatZodError(error: { issues: ValidationIssue[] }): string {
  return error.issues.map(formatIssue).join("\n");
}
