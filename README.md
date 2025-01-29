# Deployment Guide

## Prerequisites
- Node.js and npm installed on your system
- A Cloudflare account
- Your DeepSeek API key

## Setup Steps

1. Install Wrangler CLI globally:
   ```npm install -g wrangler```
2. Authenticate with Cloudflare:
   ```wrangler login```
3. Deploy your application:
   ```wrangler deploy```
4. Set up your DeepSeek API key as a secret:
   ```wrangler secret put DEEPSEEK_API_KEY```
