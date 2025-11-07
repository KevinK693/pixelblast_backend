export function checkBody(
  body: Record<string, any>, 
  keys: string[]
): boolean {
  let isValid = true;

  for (const field of keys) {
    if (!body[field] || body[field] === "") {
      isValid = false;
    }
  }

  return isValid;
}
