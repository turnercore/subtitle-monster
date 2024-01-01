'use server'
import { SUBTITLES_TABLE } from '@/lib/constants'
import { ServerActionReturn } from '@/lib/types'
import extractErrorMessage from '@/utils/extractErrorMessage'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import {
  determineSubtitleKind,
  isValidSubtitleFile,
} from '@/utils/subtitleHelpers'
import { z } from 'zod'

// Type definitions
type ReturnData = {
  subtitleId: string
}

// Zod validation of input data
const inputSchema = z.string().refine(isValidSubtitleFile, {
  message: 'Invalid subtitle file format. Must be SRT or VTT.',
})

export async function uploadSubtitlesSA(
  subtitleFile: string
): Promise<ServerActionReturn<ReturnData>> {
  // Validation check
  const validationResult = inputSchema.safeParse(subtitleFile)
  if (!validationResult.success) {
    return { error: extractErrorMessage(validationResult.error) }
  }

  // Get the validated subtitle file content
  const validSubtitles = validationResult.data

  // Create supabase client
  const supabase = createClient(cookies())

  // Create UUID for the subtitle
  const subtitleId = crypto.randomUUID()

  // Determine the kind of subtitle file it is
  const subtitleKind = determineSubtitleKind(validSubtitles)

  if (subtitleKind === 'unknown')
    return { error: 'Unknown subtitle file format.' }

  // Upload the subtitle file to the server using supabase
  const { error } = await supabase
    .from(SUBTITLES_TABLE)
    .insert({ subtitles: validSubtitles, id: subtitleId, kind: subtitleKind })

  // If there was an error, return it
  if (error) return { error: extractErrorMessage(error) }

  // Return the subtitle id
  return { data: { subtitleId } }
}
