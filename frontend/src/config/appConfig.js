// Application Configuration
// This file centralizes application-wide settings for easy maintenance

export const APP_CONFIG = {
  // Application Name - Change this to update the app name throughout the application
  APP_NAME: "GAP HRMS",
  APP_FULL_NAME: "GAP HRMS - Human Resource Management System",
  APP_DESCRIPTION: "Modern Human Resource Management System",
  
  // Branding
//  BRAND_LOGO_URL: "",
//BRAND_LOGO_URL: "http://boltoerp.com/assets/img/boltologo.png",
  BRAND_LOGO_URL: "http://localhost:3000/gap_logo.png" ,
  BRAND_TAGLINE: "Empowering HR Excellence",
  
  // Colors (if needed for theming)
  PRIMARY_COLOR: "#3B82F6",
  SECONDARY_COLOR: "#1F2937",
  
  // Version
  VERSION: "1.0.0",
  
  // Contact Information
  SUPPORT_EMAIL: "",
  WEBSITE_URL: ""
//  SUPPORT_EMAIL: "support@sedarspine.com",
//  WEBSITE_URL: "https://sedarspine.com"
};

// Helper function to get app name
export const getAppName = () => APP_CONFIG.APP_NAME;
export const getAppFullName = () => APP_CONFIG.APP_FULL_NAME;
export const getAppDescription = () => APP_CONFIG.APP_DESCRIPTION;
