const permissions = 
{
  type: 'service_account',
  project_id: 'clone-nextjs-8adeb',
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY,
  client_email: 'firebase-adminsdk-njg9z@clone-nextjs-8adeb.iam.gserviceaccount.com',
  client_id: '106448700872435027966',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-njg9z%40clone-nextjs-8adeb.iam.gserviceaccount.com'
};

export default permissions;