import { createAdminApiClient } from './client';

const emailTemplate = createAdminApiClient(
  `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/emailTemplate`
);

/**
 * Fetch the current order confirmation email template settings.
 * @returns {{ subject: string, customMessage: string, type: string }}
 */
export const getEmailTemplate = async () => {
  try {
    const response = await emailTemplate.get('/get');
    return response.data;
  } catch (error) {
    console.error('Error fetching email template:', error);
    throw error;
  }
};

/**
 * Save updated email template settings.
 * @param {{ subject?: string, customMessage?: string }} data
 */
export const updateEmailTemplate = async (data) => {
  try {
    const response = await emailTemplate.post('/update', data);
    return response.data;
  } catch (error) {
    console.error('Error updating email template:', error);
    throw error;
  }
};

/**
 * Send a test preview email.
 * @param {{ email: string }} data
 */
export const sendTestEmail = async (data) => {
  try {
    const response = await emailTemplate.post('/send-test', data);
    return response.data;
  } catch (error) {
    console.error('Error sending test email:', error);
    throw error;
  }
};
