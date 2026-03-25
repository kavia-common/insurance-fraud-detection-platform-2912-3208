#!/bin/bash
cd /home/kavia/workspace/code-generation/insurance-fraud-detection-platform-2912-3208/frontend_dashboard
npm run lint
ESLINT_EXIT_CODE=$?
npm run build
BUILD_EXIT_CODE=$?
if [ $ESLINT_EXIT_CODE -ne 0 ] || [ $BUILD_EXIT_CODE -ne 0 ]; then
   exit 1
fi

