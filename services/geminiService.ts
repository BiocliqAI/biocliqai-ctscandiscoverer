// Fix: Removed Type from import as it is no longer used.
import { GoogleGenAI } from "@google/genai";
import { ScanCenter, LocationCoords } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const findPincodesForCity = async (city: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find all 6-digit postal pincodes for the city of ${city}, India. Return the result as a JSON object with a single key "pincodes" which is an array of strings. For example: {"pincodes": ["110001", "110002"]}. Provide only the raw JSON object.`,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1, // Lower temperature for more consistent results
      },
    });

    let textResponse = response.text.trim();
    if (!textResponse) return [];

    // Extract JSON from markdown code block if present
    if (textResponse.startsWith('```json')) {
        textResponse = textResponse.replace(/^```json\s*|```$/g, '').trim();
    } else if (textResponse.startsWith('```')) {
        textResponse = textResponse.replace(/^```\s*|```$/g, '').trim();
    }
    
    try {
        const result = JSON.parse(textResponse);
        if (result && Array.isArray(result.pincodes)) {
            const pincodes = result.pincodes.filter((p: any) => typeof p === 'string' && /^\d{6}$/.test(p));
            return Array.from(new Set(pincodes)); // Remove duplicates
        }
    } catch (e) {
        console.warn("Failed to parse JSON for pincodes, falling back to regex.", e);
        // Fallback to regex if JSON parsing fails.
        const pincodes = textResponse.match(/\d{6}/g) || [];
        if (pincodes.length > 0) {
            return Array.from(new Set(pincodes));
        }
        throw new Error("Failed to parse pincodes from Gemini API response.");
    }
    
    return [];
  } catch (error) {
    console.error(`Error finding pincodes for ${city}:`, error);
    if (error instanceof Error && error.message.includes("Failed to parse pincodes")) {
        throw error;
    }
    throw new Error("Failed to fetch pincodes from Gemini API.");
  }
};

// Fix: Removed scanCenterSchema and responseSchema as they are not compatible with grounding tools.
export const findScanCentersInPincode = async (pincode: string, city: string, location: LocationCoords | null): Promise<ScanCenter[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      // Fix: Updated prompt to request JSON output directly.
      contents: `Find all CT scan centers, diagnostic scan centers, and private hospitals with CT scan facilities located in or very near the postal pincode ${pincode} in ${city}, India. For each, confirm CT scan availability. Return the results as a JSON array of objects. Each object should have the following keys: "name", "address", "pincode", "contactNumber", "googleRating", "mapLink", "website", "ctAvailable". Provide only the raw JSON array. If no centers are found, return an empty array.`,
      config: {
        tools: [{ googleMaps: {} }],
        // Fix: Removed responseMimeType and responseSchema as they are not allowed with the googleMaps tool.
        ...(location && {
            toolConfig: {
                retrievalConfig: {
                    latLng: {
                        latitude: location.latitude,
                        longitude: location.longitude,
                    },
                },
            },
        })
      },
    });
    
    let jsonStr = response.text.trim();
    if (!jsonStr) return [];
    
    // Fix: Add logic to extract JSON from a markdown code block if present.
    if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\s*|```$/g, '').trim();
    } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\s*|```$/g, '').trim();
    }
    
    const centers = JSON.parse(jsonStr);
    return centers as ScanCenter[];
  } catch (error) {
    console.error(`Error finding scan centers for pincode ${pincode}:`, error);
    // Return empty array on failure for a single pincode to not stop the whole process
    return []; 
  }
};