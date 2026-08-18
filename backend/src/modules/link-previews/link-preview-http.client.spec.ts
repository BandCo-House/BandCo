import { isBlockedLinkPreviewAddress } from './link-preview-http.client';

describe('isBlockedLinkPreviewAddress', () => {
  it.each(['127.0.0.1', '10.0.0.1', '169.254.169.254', '192.168.0.1', '::1', 'fc00::1', 'fe80::1', '::ffff:127.0.0.1'])(
    '사설·로컬·예약 주소 %s를 차단한다',
    address => {
      expect(isBlockedLinkPreviewAddress(address)).toBe(true);
    },
  );

  it.each(['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111'])('공인 주소 %s를 허용한다', address => {
    expect(isBlockedLinkPreviewAddress(address)).toBe(false);
  });
});
