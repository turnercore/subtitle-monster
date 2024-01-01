import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { updateSubtitlesSA } from '@/actions/updateSubtitlesSA'
import extractErrorMessage from '@/utils/extractErrorMessage'
import { isUserAllowedSA } from '@/actions/isUserAllowedSA'

// Zod schema for validation
const inputSchema = z.object({
  id: z.string(),
  updates: z.object({
    audioLink: z.string().url().optional(),
    subtitles: z.string().optional(),
  }),
})

/**
 * Handles the POST request for uploading subtitles and matching them with audio.
 * @param req - The NextRequest object representing the incoming request.
 * @returns A NextResponse object representing the response to be sent back. A JSON object with the subtitle id.
 */
export async function POST(req: NextRequest) {
  try {
    // ***Protected Route***
    // Check if user is authenticated or has a valid API key
    // If not, return 401 Unauthorized
    const { data: isAllowedData, error: isAllowedError } =
      await isUserAllowedSA()
    if (isAllowedError || !isAllowedData || isAllowedData.isAllowed === false) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      })
    }

    // Parse and validate the request body
    const body = await req.json()
    const validationResult = inputSchema.safeParse(body)
    if (!validationResult.success) {
      return new NextResponse(JSON.stringify({ error: 'Invalid input' }), {
        status: 400,
      })
    }

    const { id, updates } = validationResult.data

    // Process subtitles upload
    const uploadResult = await updateSubtitlesSA({ id, updates })
    if (uploadResult.error || !uploadResult.data) {
      throw new Error(uploadResult.error || 'Unknown error has occured.')
    }

    // Return success response
    return new NextResponse(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: extractErrorMessage(error) }),
      {
        status: 500,
      }
    )
  }
}
