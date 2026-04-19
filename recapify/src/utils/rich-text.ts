const htmlTagPattern = /<[^>]*>/g;

export function richTextToPlainText(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "- ")
    .replace(htmlTagPattern, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\u00A0/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function isRichTextEmpty(value: string) {
  return richTextToPlainText(value).length === 0;
}