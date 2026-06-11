import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'config-validator-secret-default-123',
  
  // Modificado com fallbacks para evitar o erro de "Invalid URL" no Render
  oauthServerUrl: process.env.OAUTH_SERVER_URL || 'https://validacao-de-configuracao.onrender.com',
  viteAppId: process.env.VITE_APP_ID || 'dummy-id',
  viteOauthPortalUrl: process.env.VITE_OAUTH_PORTAL_URL || 'https://validacao-de-configuracao.onrender.com',
  
  ownerOpenId: process.env.OWNER_OPEN_ID || '',
  ownerName: process.env.OWNER_NAME || 'Owner',
};