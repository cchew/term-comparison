#!/bin/bash
pkill -f "vite" 2>/dev/null || true
rm -rf test-results/ playwright-report/
echo "Cleanup done"
