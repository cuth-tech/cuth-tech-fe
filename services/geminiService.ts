// No longer need to import GoogleGenerativeAI or its types on frontend as backend handles direct calls.

// --- Frontend Backend URL Configuration ---
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; // Use environment variable

// Ensure the variable is defined (good practice)
if (!BACKEND_URL) {
  console.error("VITE_BACKEND_URL is not defined in the environment. Please check your .env.local file.");
  // Consider throwing an error or setting a default fallback here in a real app
}

export const generateEmailContentFromGemini = async (prompt: string): Promise<string> => {
  // Frontend now calls your backend's Gemini proxy endpoint
  try {
    const response = await fetch(`${BACKEND_URL}/api/gemini/generate-email`, { // Use BACKEND_URL
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }), // Send the prompt to your backend
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate email content via backend proxy.');
    }

    const result = await response.json();
    if (!result.success) {
        throw new Error(result.message || 'Backend reported failure for email generation.');
    }
    return result.emailContent; // Get the generated content from your backend's response
  } catch (error: any) {
    console.error('Error generating email content via backend proxy:', error);
    let errorMessage = 'Failed to generate email content due to an unexpected error.';
    if (error instanceof Error) {
        errorMessage = `Failed to generate email content. Error: ${error.message}.`;
    }
    // Append advice for the user (keep existing advice)
    errorMessage += " Please check your internet connection or try again later. Your order has been placed and receipt downloaded.";
    return errorMessage;
  }
};