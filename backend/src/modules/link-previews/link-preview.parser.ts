import type { LinkPreviewMetadata } from './types/link-preview.type';

const ATTRIBUTE_PATTERN = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function decodeHtmlEntities(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  };

  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith('#x') || code.startsWith('#X')) {
      return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    }

    if (code.startsWith('#')) {
      return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    }

    return namedEntities[code.toLowerCase()] ?? entity;
  });
}

function normalizeText(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }

  const normalized = decodeHtmlEntities(value).replace(/\s+/g, ' ').trim();
  return normalized.length > 0 ? normalized : null;
}

function parseAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const content = tag.replace(/^<\/?[a-z0-9:-]+/i, '').replace(/\/?\s*>$/, '');

  for (const match of content.matchAll(ATTRIBUTE_PATTERN)) {
    const [, rawName, doubleQuoted, singleQuoted, unquoted] = match;
    if (rawName === undefined) {
      continue;
    }

    attributes[rawName.toLowerCase()] = doubleQuoted ?? singleQuoted ?? unquoted ?? '';
  }

  return attributes;
}

function findOpenGraphContent(head: string, property: string): string | null {
  const metaTags = head.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of metaTags) {
    const attributes = parseAttributes(tag);
    const propertyName = attributes.property ?? attributes.name;

    if (propertyName?.toLowerCase() === property) {
      return normalizeText(attributes.content);
    }
  }

  return null;
}

function findTitle(head: string): string | null {
  const match = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(head);
  return normalizeText(match?.[1]);
}

function findFaviconUrl(head: string, baseUrl: URL): string | null {
  const linkTags = head.match(/<link\b[^>]*>/gi) ?? [];

  for (const tag of linkTags) {
    const attributes = parseAttributes(tag);
    const relTokens = attributes.rel?.toLowerCase().split(/\s+/) ?? [];

    if (!relTokens.includes('icon') || attributes.href === undefined) {
      continue;
    }

    try {
      const faviconUrl = new URL(attributes.href, baseUrl);
      if (faviconUrl.protocol === 'http:' || faviconUrl.protocol === 'https:') {
        return faviconUrl.toString();
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * HTML head에서 화면에 필요한 최소 링크 메타데이터만 추출한다.
 *
 * @param {string} html - 외부 페이지 HTML
 * @param {URL} baseUrl - 상대 favicon URL을 해석할 최종 응답 URL
 * @returns {LinkPreviewMetadata} 링크 미리보기 메타데이터
 */
export function parseLinkPreviewHtml(html: string, baseUrl: URL): LinkPreviewMetadata {
  const headMatch = /<head\b[^>]*>([\s\S]*?)(?:<\/head>|$)/i.exec(html);
  const head = headMatch?.[1] ?? html;

  return {
    title: findOpenGraphContent(head, 'og:title') ?? findTitle(head),
    siteName: findOpenGraphContent(head, 'og:site_name'),
    faviconUrl: findFaviconUrl(head, baseUrl),
  };
}
