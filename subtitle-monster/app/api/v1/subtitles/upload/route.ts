import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { uploadSubtitlesSA } from '@/actions/uploadSubtitlesSA'
import { matchSubtitlesWithAudioSA } from '@/actions/matchSubtitlesWithAudioSA'
import extractErrorMessage from '@/utils/extractErrorMessage'
import { isUserAllowedSA } from '@/actions/isUserAllowedSA'

// Zod schema for validation
const inputSchema = z.object({
  subtitles: z.string(),
  audioLink: z.string().url().optional(),
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

    const { subtitles, audioLink } = validationResult.data

    // Process subtitles upload
    const uploadResult = await uploadSubtitlesSA(subtitles)
    if (uploadResult.error || !uploadResult.data) {
      throw new Error(uploadResult.error || 'Unknown error has occured.')
    }

    // Get the subtitle id
    const subtitleId = uploadResult.data.subtitleId

    // Process audio match, if audio link provided
    if (audioLink) {
      const matchResult = await matchSubtitlesWithAudioSA(subtitleId, audioLink)
      if (matchResult.error) {
        throw new Error(matchResult.error)
      }
    }

    // Return success response
    return new NextResponse(JSON.stringify({ subtitleId }), { status: 200 })
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: extractErrorMessage(error) }),
      {
        status: 500,
      }
    )
  }
}
