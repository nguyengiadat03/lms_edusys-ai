#!/bin/bash

# Safe startup script for EDU-SYS AI with OOM protection
# This script ensures safe startup with memory monitoring

echo "🚀 Starting EDU-SYS AI with OOM Protection..."
echo "=========================================="

# Check system memory before starting
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
AVAILABLE_MEM=$(free -m | awk 'NR==2{printf "%.0f", $7}')

echo "System Memory: ${TOTAL_MEM}MB total, ${AVAILABLE_MEM}MB available"

# Minimum memory requirement (MB)
MIN_MEMORY=2048

if [ "$AVAILABLE_MEM" -lt "$MIN_MEMORY" ]; then
    echo "❌ ERROR: Not enough memory available (${AVAILABLE_MEM}MB < ${MIN_MEMORY}MB required)"
    echo "Please free up memory or increase system RAM"
    exit 1
fi

echo "✅ Memory check passed"

# Set environment variables for memory protection
export NODE_OPTIONS="--max-old-space-size=1024"
export UVICORN_MEMORY_LIMIT="512MB"

# Function to check if process is running
check_process() {
    local pid=$1
    if ps -p $pid > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to monitor memory usage
monitor_memory() {
    local pid=$1
    local service_name=$2

    while check_process $pid; do
        # Get memory usage percentage
        local mem_usage=$(ps -p $pid -o pmem= | tr -d ' ')

        # Check if memory usage is too high
        if (( $(echo "$mem_usage > 85" | bc -l) )); then
            echo "⚠️  WARNING: $service_name memory usage is ${mem_usage}% - this may cause issues"
        fi

        sleep 30
    done
}

echo "Starting backend services..."

# Start backend server with memory monitoring
cd backend
python ocr_service.py &
OCR_PID=$!
echo "OCR Service started (PID: $OCR_PID)"

# Monitor OCR service memory
monitor_memory $OCR_PID "OCR Service" &
MONITOR_PID=$!

# Start main backend server
npm run dev &
BACKEND_PID=$!
echo "Backend API started (PID: $BACKEND_PID)"

# Monitor backend memory
monitor_memory $BACKEND_PID "Backend API" &
BACKEND_MONITOR_PID=$!

cd ..

echo "Starting frontend..."

# Start frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID)"

# Monitor frontend memory
monitor_memory $FRONTEND_PID "Frontend" &
FRONTEND_MONITOR_PID=$!

echo ""
echo "🎉 All services started successfully!"
echo "=========================================="
echo "Service PIDs:"
echo "  OCR Service: $OCR_PID"
echo "  Backend API: $BACKEND_PID"
echo "  Frontend: $FRONTEND_PID"
echo ""
echo "Memory monitors:"
echo "  OCR Monitor: $MONITOR_PID"
echo "  Backend Monitor: $BACKEND_MONITOR_PID"
echo "  Frontend Monitor: $FRONTEND_MONITOR_PID"
echo ""
echo "To stop all services, press Ctrl+C"
echo ""

# Wait for services and cleanup on exit
trap "echo 'Stopping services...'; kill $OCR_PID $BACKEND_PID $FRONTEND_PID $MONITOR_PID $BACKEND_MONITOR_PID $FRONTEND_MONITOR_PID 2>/dev/null; exit" INT TERM

# Keep script running
wait