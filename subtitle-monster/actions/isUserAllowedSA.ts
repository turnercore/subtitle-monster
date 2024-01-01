'use server'
import { API_KEY_TABLE } from '@/lib/constants'
import { ServerActionReturn } from '@/lib/types'
import extractErrorMessage from '@/utils/extractErrorMessage'
import { cookies, headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

// Type definitions
type ReturnData = {
  isAllowed: boolean
}

// Service Role Key (API keys are stored in the database with no role access)
export async function isUserAllowedSA(): Promise<
  // Define your parameters here
  ServerActionReturn<ReturnData>
> {
  try {
    // See if the user is authenticated with supabase or has a valid API key

    // Is user authenticated? Check for supabase session
    const supabase = createClient(cookies())
    const session = await supabase.auth.getSession()
    if (session.data.session?.user) {
      // User is authenticated
      return { data: { isAllowed: true } }
    }
    // Otherwise check for API key
    const apiKey = headers().get('authorization')
    if (apiKey) {
      //  get the api key in case they put Bearer in front
      const apiKeyString = apiKey.split(' ')[1]
      // Check if the api key is valid
      const { data, error } = await supabase
        .from(API_KEY_TABLE)
        .select()
        .eq('key', apiKeyString)
        .single()

      if (error) {
        throw error
      }

      // If the API key is valid, return success
      if (data) {
        return { data: { isAllowed: true } }
      }
    }

    // Otherwise, return failure
    return { data: { isAllowed: false } }
  } catch (error) {
    // Handle and return errors
    return { error: extractErrorMessage(error), data: { isAllowed: false } }
  }
}
