"""
대한골프협회(KGA) 공식 레이팅 업데이트 감지기
==========================================
KGA 웹사이트의 AllRatings_2.pdf 가 바뀌었는지 SHA-256 해시로 감지합니다.

- 바뀌었으면 PDF를 AllRatings_latest.pdf 로 저장하고 GitHub Actions 경고를 남깁니다.
  데이터베이스는 자동으로 고치지 않습니다(사람이 확인 후 반영).
- 반영을 마쳤으면 `python scripts/pipeline/fetch_kga_updates.py --accept` 로
  새 해시를 기록합니다. 그 전까지는 매주 경고가 계속 남아 놓치지 않습니다.
"""

import hashlib
import os
import ssl
import sys
import urllib.request

KGA_URL = 'https://www.kgagolf.or.kr/infor/infor_data/AllRatings_2.pdf'
HASH_FILE = 'scripts/pipeline/.last_kga_hash'
PDF_OUT = 'AllRatings_latest.pdf'


def fetch_pdf():
    ctx = ssl.create_default_context()
    # KGA 사이트 인증서 체인이 불완전해 검증을 끈다(공개 PDF 다운로드 전용).
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(KGA_URL, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx, timeout=20) as resp:
        return resp.read()


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    accept = '--accept' in sys.argv

    print(f"Checking for updates at {KGA_URL}...")
    try:
        content = fetch_pdf()
    except Exception as e:  # 네트워크 문제로 정기 점검 전체를 실패시키지 않는다
        print(f"::warning::KGA 레이팅 PDF를 받지 못했습니다: {e}")
        return

    curr_hash = hashlib.sha256(content).hexdigest()
    print(f"Downloaded PDF size: {len(content)} bytes | SHA256: {curr_hash[:16]}...")

    last_hash = ''
    if os.path.exists(HASH_FILE):
        with open(HASH_FILE, 'r', encoding='utf-8') as f:
            last_hash = f.read().strip()

    if curr_hash == last_hash:
        print("KGA AllRatings PDF is up to date (no changes detected).")
        return

    with open(PDF_OUT, 'wb') as f:
        f.write(content)

    if accept:
        with open(HASH_FILE, 'w', encoding='utf-8') as f:
            f.write(curr_hash + '\n')
        print(f"새 해시를 기록했습니다: {curr_hash[:16]}...")
    else:
        print(
            "::warning::KGA 공인 레이팅 PDF가 바뀌었습니다. "
            f"{PDF_OUT}(작업 결과물)을 확인해 슬로프·코스 레이팅을 반영한 뒤 "
            "`python scripts/pipeline/fetch_kga_updates.py --accept` 로 해시를 기록하세요."
        )


if __name__ == '__main__':
    main()
