#!/bin/bash

PIPE="/tmp/stress_to_api"
TestType=("cpu" "io" "vm" "filesystem" "sock") # CPU, I/O, Memory, Filesystem, Network

# Ensure the named pipe exists, create it if necessary
if [[ ! -p $PIPE ]]; then
        echo "Creating named pipe: $PIPE"
        mkfifo $PIPE
        chmod 666 $PIPE # Allow all users to read/write
fi

while true; do
        Interval=$((RANDOM % 30 + 5)) # Random interval between 10-60 seconds
        TypeSelected=${TestType[$RANDOM % ${#TestType[@]}]} # Pick a test type
        # Send data to the named pipe before starting the test
        echo "$TypeSelected,$Interval" > $PIPE
        echo "Running stress-ng: $TypeSelected for $Interval seconds..."
        stress-ng --$TypeSelected 4 --timeout $Interval --metrics-brief > /dev/null 2>&1
        WaitTime=2
        echo "Waiting for $WaitTime seconds before next test..."
        sleep $WaitTime
done