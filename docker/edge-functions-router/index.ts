// Edge Function Router - Routes requests to individual edge functions
// This router enables multiple edge functions to be served from a single edge-runtime instance
// Based on the official Supabase self-hosted pattern

import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts'

console.log('Edge Functions Router started')

const JWT_SECRET = Deno.env.get('JWT_SECRET')
const VERIFY_JWT = Deno.env.get('VERIFY_JWT') === 'true'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getAuthToken(req: Request): string {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    throw new Error('Missing authorization header')
  }
  const [bearer, token] = authHeader.split(' ')
  if (bearer !== 'Bearer') {
    throw new Error(`Auth header is not 'Bearer {token}'`)
  }
  return token
}

async function verifyJWT(jwt: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const secretKey = encoder.encode(JWT_SECRET)
  try {
    await jose.jwtVerify(jwt, secretKey)
  } catch (err) {
    console.error(err)
    return false
  }
  return true
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // JWT verification (if enabled)
  if (VERIFY_JWT) {
    try {
      const token = getAuthToken(req)
      const isValidJWT = await verifyJWT(token)

      if (!isValidJWT) {
        return new Response(JSON.stringify({ msg: 'Invalid JWT' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } catch (e) {
      console.error(e)
      return new Response(JSON.stringify({ msg: e.toString() }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  const url = new URL(req.url)
  const { pathname } = url

  // Health check
  if (pathname === '/health' || pathname === '/') {
    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Parse function name from path
  const path_parts = pathname.split('/')
  const service_name = path_parts[1]

  if (!service_name || service_name === '') {
    const error = { msg: 'missing function name in request' }
    return new Response(JSON.stringify(error), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Check for pre-bundled eszip first, then fallback to source directory
  const eszipPath = `/home/deno/bundles/${service_name}.eszip`
  const sourcePath = `/home/deno/functions/${service_name}`

  // Check if eszip exists and read it
  let maybeEszip: Uint8Array | null = null
  let useEszip = false
  try {
    maybeEszip = await Deno.readFile(eszipPath)
    useEszip = true
    console.log(`Using bundled eszip: ${eszipPath} (${maybeEszip.length} bytes)`)
  } catch {
    console.log(`Using source directory: ${sourcePath}`)
  }

  const memoryLimitMb = 150
  const workerTimeoutMs = 2 * 60 * 1000  // 2 minutes for module downloads
  const noModuleCache = false
  const importMapPath = '/home/deno/router/import_map.json'
  const envVarsObj = Deno.env.toObject()
  const envVars = Object.keys(envVarsObj).map((k) => [k, envVarsObj[k]])

  try {
    // @ts-ignore - EdgeRuntime is a global provided by supabase/edge-runtime
    const workerConfig: Record<string, unknown> = {
      servicePath: sourcePath,  // Always required as base path identifier
      memoryLimitMb,
      workerTimeoutMs,
      noModuleCache,
      envVars,
    }

    // For eszips, pass the binary content; for source directories, use import map
    if (useEszip && maybeEszip) {
      workerConfig.maybeEszip = maybeEszip
      // The entrypoint path inside the eszip - root level index.ts
      workerConfig.maybeEntrypoint = 'file:///index.ts'
    } else {
      workerConfig.importMapPath = importMapPath
    }

    const worker = await EdgeRuntime.userWorkers.create(workerConfig)
    return await worker.fetch(req)
  } catch (e) {
    console.error(`Error routing to ${service_name}:`, e)
    const error = { msg: e.toString() }
    return new Response(JSON.stringify(error), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
