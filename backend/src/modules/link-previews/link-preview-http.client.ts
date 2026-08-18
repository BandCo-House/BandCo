import { lookup } from 'node:dns/promises';
import { type IncomingMessage, request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { BlockList, isIP } from 'node:net';

import { Injectable } from '@nestjs/common';

import type { LinkPreviewMetadata } from './types/link-preview.type';
import { parseLinkPreviewHtml } from './link-preview.parser';

export interface LinkPreviewReader {
  readLinkPreview(url: string): Promise<LinkPreviewMetadata>;
}

export const LINK_PREVIEW_READER = Symbol('LINK_PREVIEW_READER');

const REQUEST_TIMEOUT_MS = 5_000;
const MAX_REDIRECT_COUNT = 5;
const MAX_HTML_BYTES = 512 * 1024;

const blockedIpv4Addresses = new BlockList();
blockedIpv4Addresses.addSubnet('0.0.0.0', 8, 'ipv4');
blockedIpv4Addresses.addSubnet('10.0.0.0', 8, 'ipv4');
blockedIpv4Addresses.addSubnet('100.64.0.0', 10, 'ipv4');
blockedIpv4Addresses.addSubnet('127.0.0.0', 8, 'ipv4');
blockedIpv4Addresses.addSubnet('169.254.0.0', 16, 'ipv4');
blockedIpv4Addresses.addSubnet('172.16.0.0', 12, 'ipv4');
blockedIpv4Addresses.addSubnet('192.0.0.0', 24, 'ipv4');
blockedIpv4Addresses.addSubnet('192.0.2.0', 24, 'ipv4');
blockedIpv4Addresses.addSubnet('192.168.0.0', 16, 'ipv4');
blockedIpv4Addresses.addSubnet('198.18.0.0', 15, 'ipv4');
blockedIpv4Addresses.addSubnet('198.51.100.0', 24, 'ipv4');
blockedIpv4Addresses.addSubnet('203.0.113.0', 24, 'ipv4');
blockedIpv4Addresses.addSubnet('224.0.0.0', 4, 'ipv4');
blockedIpv4Addresses.addSubnet('240.0.0.0', 4, 'ipv4');

const blockedIpv6Addresses = new BlockList();
blockedIpv6Addresses.addAddress('::', 'ipv6');
blockedIpv6Addresses.addAddress('::1', 'ipv6');
blockedIpv6Addresses.addSubnet('::ffff:0:0', 96, 'ipv6');
blockedIpv6Addresses.addSubnet('64:ff9b::', 96, 'ipv6');
blockedIpv6Addresses.addSubnet('100::', 64, 'ipv6');
blockedIpv6Addresses.addSubnet('2001:db8::', 32, 'ipv6');
blockedIpv6Addresses.addSubnet('fc00::', 7, 'ipv6');
blockedIpv6Addresses.addSubnet('fe80::', 10, 'ipv6');
blockedIpv6Addresses.addSubnet('ff00::', 8, 'ipv6');

interface ResolvedAddress {
  address: string;
  family: 4 | 6;
}

interface LinkPreviewHttpResponse {
  html: string;
  finalUrl: URL;
}

/**
 * 외부 요청에 사용할 수 없는 사설·로컬·예약 IP인지 확인한다.
 *
 * @param {string} address - DNS 조회로 얻은 IP 주소
 * @returns {boolean} 외부 요청이 차단되어야 하면 true
 */
export function isBlockedLinkPreviewAddress(address: string): boolean {
  const family = isIP(address);

  if (family === 4) {
    return blockedIpv4Addresses.check(address, 'ipv4');
  }

  if (family === 6) {
    return blockedIpv6Addresses.check(address, 'ipv6');
  }

  return true;
}

function validateProtocol(url: URL): void {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('HTTP 또는 HTTPS URL만 조회할 수 있습니다.');
  }

  if (url.username.length > 0 || url.password.length > 0) {
    throw new Error('인증 정보가 포함된 URL은 조회할 수 없습니다.');
  }
}

async function resolvePublicAddress(url: URL): Promise<ResolvedAddress> {
  validateProtocol(url);

  const hostname = url.hostname.replace(/\.$/, '').toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw new Error('로컬 주소는 조회할 수 없습니다.');
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(item => isBlockedLinkPreviewAddress(item.address))) {
    throw new Error('외부 공개 주소만 조회할 수 있습니다.');
  }

  const [selectedAddress] = addresses;
  if (selectedAddress === undefined || (selectedAddress.family !== 4 && selectedAddress.family !== 6)) {
    throw new Error('URL 주소를 확인할 수 없습니다.');
  }

  return {
    address: selectedAddress.address,
    family: selectedAddress.family,
  };
}

function readResponseBody(response: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let html = '';
    let receivedBytes = 0;
    let completed = false;

    const finish = (): void => {
      if (completed) {
        return;
      }

      completed = true;
      resolve(html);
    };

    response.setEncoding('utf8');
    response.on('data', (chunk: string) => {
      if (completed) {
        return;
      }

      receivedBytes += Buffer.byteLength(chunk);
      if (receivedBytes > MAX_HTML_BYTES) {
        finish();
        response.destroy();
        return;
      }

      html += chunk;
      if (/<\/head>/i.test(html)) {
        finish();
        response.destroy();
      }
    });
    response.on('end', finish);
    response.on('error', error => {
      if (!completed) {
        reject(error);
      }
    });
  });
}

async function requestHtml(url: URL, address: ResolvedAddress): Promise<{ html?: string; redirectUrl?: URL }> {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      protocol: url.protocol,
      hostname: address.address,
      family: address.family,
      port: url.port || undefined,
      path: `${url.pathname}${url.search}`,
      method: 'GET',
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Encoding': 'identity',
        Host: url.host,
        'User-Agent': 'JamPlay-LinkPreview/1.0',
      },
    };

    const onResponse = (response: IncomingMessage): void => {
      const statusCode = response.statusCode ?? 0;
      const location = response.headers.location;

      if (statusCode >= 300 && statusCode < 400 && location !== undefined) {
        response.resume();
        resolve({ redirectUrl: new URL(location, url) });
        return;
      }

      if (statusCode < 200 || statusCode >= 300) {
        response.resume();
        reject(new Error(`외부 페이지가 ${statusCode} 상태를 반환했습니다.`));
        return;
      }

      const contentType = response.headers['content-type']?.toLowerCase() ?? '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
        response.resume();
        reject(new Error('HTML 페이지가 아닙니다.'));
        return;
      }

      void readResponseBody(response).then(html => resolve({ html }), reject);
    };

    const request =
      url.protocol === 'https:' ? httpsRequest({ ...requestOptions, servername: url.hostname }, onResponse) : httpRequest(requestOptions, onResponse);

    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy(new Error('외부 페이지 조회 시간이 초과되었습니다.'));
    });
    request.on('error', reject);
    request.end();
  });
}

async function fetchHtml(url: URL): Promise<LinkPreviewHttpResponse> {
  let currentUrl = url;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECT_COUNT; redirectCount += 1) {
    const address = await resolvePublicAddress(currentUrl);
    const response = await requestHtml(currentUrl, address);

    if (response.html !== undefined) {
      return { html: response.html, finalUrl: currentUrl };
    }

    if (response.redirectUrl === undefined || redirectCount === MAX_REDIRECT_COUNT) {
      throw new Error('외부 페이지의 리다이렉트 횟수를 초과했습니다.');
    }

    currentUrl = response.redirectUrl;
  }

  throw new Error('외부 페이지를 조회하지 못했습니다.');
}

@Injectable()
export class LinkPreviewHttpClient implements LinkPreviewReader {
  /**
   * SSRF 방어가 적용된 HTTP 요청으로 링크 미리보기 메타데이터를 읽는다.
   *
   * @param {string} url - 조회할 외부 절대 URL
   * @returns {Promise<LinkPreviewMetadata>} 파싱된 링크 메타데이터
   */
  async readLinkPreview(url: string): Promise<LinkPreviewMetadata> {
    const response = await fetchHtml(new URL(url));
    return parseLinkPreviewHtml(response.html, response.finalUrl);
  }
}
