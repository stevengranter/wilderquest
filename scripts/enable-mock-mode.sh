#!/bin/bash

# Enable mock mode for iNaturalist API to avoid rate limits during development
echo "🔧 Enabling mock mode for iNaturalist API..."
echo "USE_MOCK_INAT=true" >> .env
echo "✅ Mock mode enabled. Restart your development server to apply changes."
echo ""
echo "To disable mock mode later, remove USE_MOCK_INAT=true from your .env file"