"""
골프장 데이터 정기 점검 오케스트레이터 (Scheduled Data Check)
==========================================================
CI 스케줄러(매주) 또는 수동으로 실행합니다.

이 파이프라인은 데이터를 '자동으로 고치지' 않고 '점검만' 합니다.
2026-11 데이터 정비 때 KGBA 원본과 웹 검색으로 확인한 값(전화·홀 수·운영형태·개명 등)을
추정 규칙으로 덮어쓰지 않기 위해서입니다.

  1. KGA 공인 레이팅 PDF 변경 감지 → 바뀌었으면 경고만 남기고 사람이 반영
  2. 데이터베이스 무결성 검증 → 실패하면 작업 실패

예전 2단계였던 scripts/audit_and_update_5_dimensions.py 는 이름·지역만 보고
운영형태·티박스·잔디·지형·야간 값을 추정해 덮어쓰므로 정기 작업에서 뺐습니다.
"""

import subprocess
import sys


def run_step(step_name, cmd):
    print("\n==========================================")
    print(f"▶ [Pipeline Step] {step_name}")
    print("==========================================")
    res = subprocess.run([sys.executable] + cmd, capture_output=True, text=True, encoding='utf-8')
    print(res.stdout)
    if res.returncode != 0:
        print(f"❌ Error in {step_name}:")
        print(res.stderr)
        return False
    return True


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    print("🚀 Starting GolfMoa scheduled data check...")

    # Step 1: KGA 공인 레이팅 변경 감지 (네트워크 실패는 경고만 하고 계속)
    run_step("1. KGA Official Rating Change Detection", ["scripts/pipeline/fetch_kga_updates.py"])

    # Step 2: 무결성 검증 (실패 시 작업 실패)
    success = run_step("2. Database Integrity & Null-Safety Validation", ["scripts/pipeline/validate_database.py"])

    if success:
        print("\n🎉 GolfMoa data check passed.")
    else:
        print("\n⚠️ Data check failed: database validation errors.")
        sys.exit(1)


if __name__ == '__main__':
    main()
