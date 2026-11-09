"""
골프장 데이터 마스터 동기화 및 오케스트레이터 (Master Sync Orchestrator)
==================================================================
전체 데이터 파이프라인을 원클릭 또는 CI/CD 스케줄러에서 일괄 실행합니다.
"""

import subprocess
import sys

def run_step(step_name, cmd):
    print(f"\n==========================================")
    print(f"▶ [Pipeline Step] {step_name}")
    print(f"==========================================")
    res = subprocess.run([sys.executable] + cmd, capture_output=True, text=True, encoding='utf-8')
    print(res.stdout)
    if res.returncode != 0:
        print(f"❌ Error in {step_name}:")
        print(res.stderr)
        return False
    return True

def main():
    print("🚀 Starting GolfMoa Automated Data Sync Pipeline...")
    
    # Step 1: KGA update check
    run_step("1. KGA Official Rating Change Detection", ["scripts/pipeline/fetch_kga_updates.py"])
    
    # Step 2: 5 Dimensions (대중제, 티박스, 페어웨이, 지형, 야간) Audit & Refresh
    run_step("2. 5 Dimensions Quality Audit & Refresh", ["scripts/audit_and_update_5_dimensions.py"])
    
    # Step 3: Database Integrity & Null-Safety Validation
    success = run_step("3. Database Integrity & Null-Safety Validation", ["scripts/pipeline/validate_database.py"])
    
    if success:
        print("\n🎉 GolfMoa Data Pipeline completed successfully with 100% integrity!")
    else:
        print("\n⚠️ Data Pipeline aborted due to validation failure.")
        sys.exit(1)

if __name__ == '__main__':
    main()
