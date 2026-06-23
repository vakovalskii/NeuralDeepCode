#!/usr/bin/env bash
# ndcode coding mini-benchmark.
# For each task: run the agent headless, then check the task's verify.sh.
# Usage:
#   bench/run.sh                       # default model qwen3.6-35b-a3b
#   MODEL=neuraldeep/gpt-oss-120b bench/run.sh
#   TIMEOUT=240 bench/run.sh           # per-task wall-clock cap (seconds)
# Requires: a working `ndcode` on PATH, logged in (`ndcode` -> /login), python3 + node.
set -u

MODEL="${MODEL:-neuraldeep/qwen3.6-35b-a3b}"
TIMEOUT="${TIMEOUT:-240}"
HERE="$(cd "$(dirname "$0")" && pwd)"
TASKS_DIR="$HERE/tasks"
NDCODE="$(command -v ndcode || true)"

[ -n "$NDCODE" ] || { echo "ndcode not found on PATH. Install it first."; exit 1; }

printf '%-16s %-8s %-8s\n' "task" "result" "time"
printf '%-16s %-8s %-8s\n' "----" "------" "----"

pass=0; total=0
for task in "$TASKS_DIR"/*/; do
  id="$(basename "$task")"
  total=$((total+1))
  work="$(mktemp -d)"
  # copy starter files (everything except the task metadata the agent shouldn't need to read)
  cp -R "$task"/* "$work"/ 2>/dev/null
  rm -f "$work/task.txt" "$work/verify.sh"   # keep prompt/verify out of the agent's workspace
  prompt="$(cat "$task/task.txt")"

  start=$(date +%s)
  ( cd "$work" && "$NDCODE" run --dangerously-skip-permissions --model "$MODEL" "$prompt" < /dev/null > "$work/.agent.log" 2>&1 ) &
  pid=$!
  while kill -0 "$pid" 2>/dev/null; do
    now=$(date +%s)
    [ $((now-start)) -ge "$TIMEOUT" ] && { kill -9 "$pid" 2>/dev/null; pkill -9 -P "$pid" 2>/dev/null; break; }
    sleep 3
  done
  wait "$pid" 2>/dev/null
  elapsed=$(( $(date +%s) - start ))

  # verify in the work dir using the task's verify.sh
  if ( cd "$work" && bash "$task/verify.sh" >/dev/null 2>&1 ); then
    result="PASS"; pass=$((pass+1))
  else
    result="FAIL"
  fi
  printf '%-16s %-8s %-8s\n' "$id" "$result" "${elapsed}s"
done

echo "----"
echo "model:     $MODEL"
echo "pass-rate: $pass/$total"
