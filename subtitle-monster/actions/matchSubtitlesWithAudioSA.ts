'use server'
import { SUBTITLES_TABLE } from '@/lib/constants'
import { ServerActionReturn } from '@/lib/types'
import extractErrorMessage from '@/utils/extractErrorMessage'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { z } from 'zod'

// Type definitions
type ReturnData = {
  updated: boolean
}

// Zod validation of input data
const inputSchema = z.object({
  subtitleId: z.string(),
  audioLink: z.string().url(),
})

export async function matchSubtitlesWithAudioSA(
  subtitleId: string,
  audioLink: string
): Promise<ServerActionReturn<ReturnData>> {
  try {
    // Validate input
    const validationResult = inputSchema.safeParse({ subtitleId, audioLink })
    if (!validationResult.success) {
      return { error: extractErrorMessage(validationResult.error) }
    }

    // Create supabase client
    const supabase = createClient(cookies())

    // Update the subtitle entry with the audio link
    const { error } = await supabase
      .from(SUBTITLES_TABLE)
      .update({ audio_link: audioLink })
      .match({ id: subtitleId })

    if (error) {
      throw error
    }

    // Return success data
    return {
      data: { updated: true },
    }
  } catch (error) {
    // Handle and return errors
    return { error: extractErrorMessage(error) }
  }
}
