export interface SupportRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}
export function validateSupportRequest(request: SupportRequest): string | null {
  if (!request.name.trim() || !request.subject.trim()) return "Name and subject are required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email.trim()))
    return "Enter a valid email address.";
  if (request.message.trim().length < 20) return "Message must contain at least 20 characters.";
  return null;
}
// Placeholder only: no request is sent and no personal data is stored.
// Replace this function with a real support endpoint before accepting requests.
export async function submitSupportRequest(request: SupportRequest): Promise<void> {
  const error = validateSupportRequest(request);
  if (error) throw new Error(error);
}
