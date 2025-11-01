#!/bin/bash

 if [ -z \"$RUNTIME\" ]; then echo '❌ RUNTIME not set'; exit 1; fi; \
  if [ -z \"$API_KEY\" ]; then echo '❌ API_KEY not set'; exit 1; fi; \
  if [ -z \"$CUSTOMER_ID\" ]; then echo '❌ CUSTOMER_ID not set'; exit 1; fi; \
  mkdir -p /app/products/sast/$RUNTIME/project; \
  cp -r /user_project/* /app/products/sast/$RUNTIME/project/; \
  cd /app/products/sast/$RUNTIME; \
  pwd
  ls
  make run CUSTOMER_ID=$CUSTOMER_ID API_KEY=$API_KEY RUNTIME=$RUNTIME            
 \
