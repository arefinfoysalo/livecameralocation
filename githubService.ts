
/**
 * Service to handle data persistence on GitHub
 */

const GITHUB_TOKEN = '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';
const REPO_OWNER = 'arefinfoysalo';
const REPO_NAME = 'livecameralocation';

export async function uploadToGitHub(fileName: string, content: string, isBase64: boolean = false) {
  const path = `logs/${fileName}`;
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;

  try {
    // Check if file exists to get SHA (for updates, though we mostly create unique files)
    let sha = '';
    const getFileResponse = await fetch(url, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      }
    });
    
    if (getFileResponse.status === 200) {
      const fileData = await getFileResponse.json();
      sha = fileData.sha;
    }

    const body = {
      message: `Log: ${fileName}`,
      content: isBase64 ? content : btoa(unescape(encodeURIComponent(content))),
      sha: sha || undefined,
    };

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return await response.json();
  } catch (error) {
    console.error('GitHub Upload Error:', error);
    return null;
  }
}

export function generateLogFileName(userId: string) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  return `${userId}_${timestamp}.json`;
}
