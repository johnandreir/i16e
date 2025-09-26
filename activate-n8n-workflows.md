# How to Activate N8N Workflows

## Current Status

- N8N is running at http://localhost:5678
- API shows 0 active workflows out of 0 total
- Webhooks are returning 404 errors

## Steps to Fix:

### 1. Access N8N Web Interface

- Open http://localhost:5678 in your browser
- You should see the N8N login/setup screen

### 2. Import the Workflow

- In N8N, go to "Workflows"
- Click "Import" or use the "+" button
- Upload the file: `Get cases.json`
- The workflow should import with the webhook path `get-performance`

### 3. Configure the Webhook (if needed)

- Open the imported workflow
- Find the "Webhook" node
- Ensure the path is set to `get-performance`
- Method should be `POST`

### 4. Activate the Workflow

- In the workflow editor, you'll see a toggle switch in the top-right
- Click to activate the workflow (it should turn green/enabled)

### 5. Verify

After activation, these endpoints should work:

- `POST http://localhost:5678/webhook/get-performance` (direct N8N)
- `POST http://localhost:3001/api/n8n/get-cases` (via API proxy)

## Alternative: Quick Fix

If you need immediate functionality, I can:

1. Create mock endpoints in the API that return sample data
2. Update the frontend to work without N8N temporarily
3. Fix the workflow activation later

Let me know which approach you prefer!
